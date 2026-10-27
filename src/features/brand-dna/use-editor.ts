"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DnaFailure, loadDna, requestDna } from "./api";
import { documentFor, equal, parseLocal, reconcile, validate, type DnaForm, type Errors, type LocalEdit, type Pending, type Snapshot } from "./model";

type State = { base: Snapshot | null; form: DnaForm | null; editETag: string; latest: Snapshot | null; pending: Pending | null; busy: boolean; failure: DnaFailure["kind"] | null; errors: Errors; message: string; conflict: boolean; retry: boolean; storageBad: boolean };
const initial: State = { base: null, form: null, editETag: "", latest: null, pending: null, busy: true, failure: null, errors: {}, message: "", conflict: false, retry: false, storageBad: false };
export function useDnaEditor({ scope, brandId, owner, authorized, validationNonce }: { scope: string; brandId: string; owner: boolean; authorized: boolean; validationNonce: string }) {
  const router = useRouter();
  const key = `linde.brand-dna.v1.${scope}.${brandId}`;
  const [state, setState] = useState<State>(initial);
  const ref = useRef<State>(initial);
  const running = useRef(false);
  const intent = useRef<{ nonce: string; kind: "save" | "approve" } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const update = useCallback((value: State) => { ref.current = value; setState(value); }, []);
  const store = useCallback((value: State) => {
    if (!value.form) throw new DnaFailure("storage");
    try {
      const raw = JSON.stringify({ version: 1, baseETag: value.editETag, form: value.form, pending: value.pending } satisfies LocalEdit);
      if (raw.length > 200000) throw new Error();
      sessionStorage.setItem(key, raw);
    }
    catch { throw new DnaFailure("storage"); }
  }, [key]);
  const failure = useCallback((error: unknown) => { const current = ref.current; update({ ...current, busy: false, failure: error instanceof DnaFailure ? error.kind : "unavailable", message: "" }); }, [update]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const fresh = await loadDna(brandId);
        let local;
        try { local = parseLocal(sessionStorage.getItem(key)); }
        catch { if (active) update({ ...initial, busy: false, base: fresh, form: fresh.form, editETag: fresh.etag, failure: "storage", storageBad: true }); return; }
        if (!active) return;
        let next: State = { ...initial, busy: false, base: fresh, editETag: local?.baseETag ?? fresh.etag, form: local?.form ?? fresh.form, pending: local?.pending ?? null };
        if (local?.pending) {
          const result = reconcile(local.pending, fresh);
          if (result === "confirmed") next = { ...next, form: fresh.form, pending: null, editETag: fresh.etag, message: local.pending.kind === "save" ? "Guardado confirmado tras consultar la revisión actual." : "Aprobación confirmada tras consultar la revisión actual." };
          else if (result === "retry") next = { ...next, pending: null, retry: true, editETag: fresh.etag, message: "Versión actual comprobada. La solicitud anterior no está confirmada; puedes volver a enviarla explícitamente." };
          else next = { ...next, pending: null, latest: fresh, conflict: true, failure: "conflict" };
        } else if (local && local.baseETag !== fresh.etag && !equal(local.form, fresh.form)) next = { ...next, latest: fresh, conflict: true, failure: "conflict" };
        else if (equal(next.form!, fresh.form)) next.editETag = fresh.etag;
        update(next);
        try { store(next); } catch { update({ ...next, failure: "storage", storageBad: true }); }
      } catch (error) { if (active) failure(error); }
    })();
    return () => { active = false; };
  }, [brandId, key, update, store, failure]);

  function change(form: DnaForm) {
    const next = { ...ref.current, form, errors: {}, message: "" };
    update(next);
    try { store(next); if (next.storageBad) update({ ...next, storageBad: false, failure: null }); }
    catch { update({ ...next, failure: "storage", storageBad: true }); }
  }
  const consult = useCallback(async (replace = false) => {
    if (running.current) return;
    const old = ref.current;
    if (replace && old.form && (!old.base || !equal(old.form, old.base.form) || old.pending) && !window.confirm("¿Cargar la versión del servidor y sustituir esta edición local? Copia o descarga tus cambios antes de continuar.")) return;
    running.current = true; update({ ...old, busy: true, failure: null });
    try {
      const fresh = await loadDna(brandId);
      const current = ref.current;
      let next: State = { ...current, busy: false, latest: fresh, message: "Versión del servidor consultada. Tu edición local se conserva." };
      if (replace || !current.form) next = { ...initial, base: fresh, form: fresh.form, editETag: fresh.etag, latest: null, busy: false, message: "Versión del servidor cargada." };
      else if (current.pending) {
        const result = reconcile(current.pending, fresh);
        if (result === "confirmed") next = { ...next, base: fresh, form: fresh.form, editETag: fresh.etag, pending: null, conflict: false, retry: false, message: current.pending.kind === "save" ? "Guardado confirmado tras consultar la revisión actual." : "Aprobación confirmada tras consultar la revisión actual." };
        else if (result === "retry") next = { ...next, base: fresh, pending: null, conflict: false, retry: true, message: "Versión actual comprobada. Puedes volver a enviar la solicitud explícitamente." };
        else next = { ...next, pending: null, conflict: true, failure: "conflict", message: "" };
      } else if (fresh.etag !== current.editETag) {
        if (equal(current.form, fresh.form)) next = { ...next, base: fresh, editETag: fresh.etag, conflict: false };
        else next = { ...next, conflict: true, failure: "conflict", message: "" };
      }
      store(next); update(next);
    } catch (error) { failure(error); }
    finally { running.current = false; }
  }, [brandId, update, failure, store]);
  const run = useCallback(async (kind: "save" | "approve") => {
    try {
      if (!authorized || (kind === "approve" && !owner)) throw new DnaFailure("denied");
      if (!navigator.locks) throw new DnaFailure("storage");
      await navigator.locks.request(key, { ifAvailable: true }, async lock => {
        if (!lock) throw new DnaFailure("busy");
        const current = ref.current;
        if (!current.base || !current.form || current.conflict || current.pending || current.storageBad) throw new DnaFailure("conflict");
        const pending: Pending = { kind, etag: current.editETag, revisionId: current.base.revisionId, form: current.form };
        const next = { ...current, pending, busy: true, failure: null, message: "" };
        store(next); update(next); // Durable record before the HTTP mutation.
        const response = await requestDna(`/brands/${brandId}/profile${kind === "approve" ? "/approve" : ""}`, kind === "approve" ? "POST" : "PATCH", kind === "approve" ? { revision_id: pending.revisionId } : { profile_document: documentFor(pending.form) }, pending.etag);
        const fresh = await loadDna(brandId);
        const result = response.data as { revision_id?: string };
        if (reconcile(pending, fresh) !== "confirmed" || result.revision_id !== fresh.revisionId) {
          const conflicted: State = { ...ref.current, busy: false, pending: null, latest: fresh, conflict: true, failure: "conflict" };
          store(conflicted); update(conflicted); return;
        }
        const confirmed: State = { ...initial, base: fresh, form: fresh.form, editETag: fresh.etag, busy: false, message: kind === "save" ? `Perfil guardado. Revisión ${fresh.revisionNumber} confirmada.` : `Revisión ${fresh.revisionNumber} aprobada.` };
        store(confirmed); update(confirmed);
      });
    } catch (error) { failure(error); }
    finally { running.current = false; if (ref.current.busy) update({ ...ref.current, busy: false }); }
  }, [authorized, owner, key, brandId, store, update, failure]);
  useEffect(() => {
    const action = intent.current;
    if (!action || validationNonce === action.nonce) return;
    intent.current = null;
    if (timer.current) clearTimeout(timer.current);
    void Promise.resolve().then(() => run(action.kind));
  }, [validationNonce, run]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function start(kind: "save" | "approve") {
    const current = ref.current;
    if (running.current || !current.form || !current.base || current.pending || current.conflict || current.storageBad) return;
    const errors = validate(current.form, kind === "approve");
    if (Object.keys(errors).length) {
      update({ ...current, errors, message: "", failure: "validation" });
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".dna-form [aria-invalid='true']")?.focus()); return;
    }
    if (kind === "approve" && (!owner || !equal(current.form, current.base.form) || current.base.status !== "draft")) return;
    if (!navigator.onLine) { failure(new DnaFailure("network")); return; }
    running.current = true;
    update({ ...current, busy: true, failure: null, message: "Verificando sesión y permisos…" });
    intent.current = { nonce: validationNonce, kind };
    timer.current = setTimeout(() => { intent.current = null; running.current = false; failure(new DnaFailure("network")); }, 12000);
    router.refresh();
  }
  return { ...state, dirty: Boolean(state.form && state.base && !equal(state.form, state.base.form)), change, start, consult };
}
