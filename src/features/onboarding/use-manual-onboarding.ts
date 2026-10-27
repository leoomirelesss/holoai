"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { callOnboardingApi, newOperation, OnboardingFailure, parseOperation, persistManual, type FailureKind, type ManualOperation } from "./manual-operation";

const changed = "linde-manual-operation";
const keyFor = (scope: string) => `linde.manual-onboarding.v1.${scope}`;
function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); };
}
export function useManualOnboarding(scope?: string, validationNonce?: string) {
  const router = useRouter();
  const snapshot = useCallback(() => {
    if (!scope) return null;
    try { return localStorage.getItem(keyFor(scope)); } catch { return "unavailable"; }
  }, [scope]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  let stored: ManualOperation | null = null;
  let broken = false;
  try { stored = parseOperation(raw); } catch { broken = true; }
  const [volatile, setVolatile] = useState<ManualOperation | null>(null);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const running = useRef(false);
  const pending = useRef<{ nonce: string; name: string; description: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operation = volatile && (!stored || stored.attempt === volatile.attempt) ? volatile : stored;
  const run = useCallback(async (name: string, description: string) => {
    if (!scope) return;
    try {
      if (!navigator.locks) throw new OnboardingFailure("storage");
      await navigator.locks.request(keyFor(scope), { ifAvailable: true }, async (lock) => {
        if (!lock) throw new OnboardingFailure("busy");
        let op: ManualOperation | null;
        try {
          op = parseOperation(localStorage.getItem(keyFor(scope)));
          if (volatile && (!op || op.attempt === volatile.attempt)) op = volatile;
        }
        catch { throw new OnboardingFailure("storage"); }
        op ??= newOperation(name, description);
        const save = (value: ManualOperation) => {
          try { localStorage.setItem(keyFor(scope), JSON.stringify(value)); }
          catch { setVolatile(value); throw new OnboardingFailure("storage"); }
          setVolatile(null);
          window.dispatchEvent(new Event(changed));
        };
        save(op);
        await persistManual(op, callOnboardingApi, save, setProgress);
      });
    } catch (error) { setFailure(error instanceof OnboardingFailure ? error.kind : "unavailable"); }
    finally { setBusy(false); setProgress(""); running.current = false; }
  }, [scope, volatile]);
  useEffect(() => {
    const intent = pending.current;
    if (!intent || validationNonce === intent.nonce) return;
    // /app re-ran requireUser. A changed account remounts the keyed component,
    // discarding this intent instead of submitting one account's draft as another.
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    void Promise.resolve().then(() => run(intent.name, intent.description));
  }, [validationNonce, run]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function start(name: string, description: string) {
    if (!scope || !validationNonce || running.current) return;
    running.current = true; setBusy(true); setFailure(null); setProgress("Verificando tu sesión…");
    pending.current = { nonce: validationNonce, name, description };
    timer.current = setTimeout(() => {
      pending.current = null; running.current = false; setBusy(false); setProgress(""); setFailure("network");
    }, 12000);
    router.refresh(); // Read-only server identity preflight, never a business mutation.
  }
  return { operation, failure: broken ? "storage" as const : failure, busy, progress, start };
}
