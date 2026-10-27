"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { Badge, Card, Notice } from "@/components/ui/surface";
import { Icon } from "@/components/ui/icon";
import { removeDraft, saveDraft, useBrandDraft, validateWebsite, type BrandDraft } from "./draft-store";

import { useManualOnboarding } from "./use-manual-onboarding";
import { ManualFeedback } from "./manual-feedback";

type Errors = { website?: string; name?: string; description?: string };

export function BrandStart({ persistenceScope, validationNonce }: { persistenceScope?: string; validationNonce?: string }) {
  const manual = useManualOnboarding(persistenceScope, validationNonce);
  const persistent = Boolean(persistenceScope);
  const locked = Boolean(manual.operation);
  const [selectedMode, setMode] = useState<BrandDraft["mode"] | null>(null);
  const mode = selectedMode ?? (manual.operation ? "manual" : "url");
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [storageError, setStorageError] = useState("");
  const [dirty, setDirty] = useState(false);
  const draftScope = persistenceScope && locked && mode === "url" ? `${persistenceScope}.url` : persistenceScope;
  const draft = useBrandDraft(draftScope);
  const websiteRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function changeMode(next: BrandDraft["mode"]) {
    setMode(next);
    setErrors({});
    setStatus("");
    requestAnimationFrame(() => (next === "url" ? websiteRef : nameRef).current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Errors = locked && mode === "manual" ? {} : mode === "url"
      ? { website: validateWebsite(website) }
      : { name: !name.trim() ? "Escribe el nombre de tu marca." : name.includes("\0") || !name.isWellFormed() ? "El nombre contiene caracteres no admitidos." : undefined, description: !description.trim() ? "Describe brevemente qué ofrece tu empresa." : description.includes("\0") || !description.isWellFormed() ? "La descripción contiene caracteres no admitidos." : undefined };
    setErrors(nextErrors);
    setStatus("");
    setStorageError("");
    if (nextErrors.website || nextErrors.name || nextErrors.description) {
      (nextErrors.website ? websiteRef : nextErrors.name ? nameRef : descriptionRef).current?.focus();
      return;
    }
    try {
      if (!(persistent && mode === "manual" && locked)) saveDraft({ version: 1, mode, website: mode === "url" ? new URL(website.trim()).href : "", name: mode === "manual" ? name.trim() : "", description: mode === "manual" ? description.trim() : "", savedAt: new Date().toISOString() }, draftScope);
      setDirty(false);
      if (persistent && mode === "manual") {
        await manual.start(name.trim(), description.trim());
        return;
      }
      setStatus("Borrador guardado solo en esta pestaña. No se ha analizado ninguna web ni creado un Brand DNA.");
    } catch {
      setStorageError("No pudimos guardar en esta pestaña. Comprueba que tu navegador permite el almacenamiento de sesión. Tus datos siguen en el formulario.");
    }
  }

  function restore() {
    if (!draft) return;
    setWebsite(draft.website);
    setName(draft.name);
    setDescription(draft.description);
    setMode(draft.mode);
    setErrors({});
    setDirty(false);
    setStatus("Borrador recuperado. Puedes editarlo y volver a guardarlo.");
    requestAnimationFrame(() => (draft.mode === "url" ? websiteRef : nameRef).current?.focus());
  }

  function download() {
    if (!draft) return;
    const href = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "linde-borrador-marca.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  function clear() {
    try {
      removeDraft(draftScope);
      setStatus("Borrador de esta pestaña eliminado. Los campos del formulario no se han borrado.");
      setDirty(Boolean(mode === "url" ? website : name || description));
      requestAnimationFrame(() => (mode === "url" ? websiteRef : nameRef).current?.focus());
    } catch { setStorageError("No pudimos eliminar el borrador del almacenamiento de esta pestaña."); }
  }

  return (
    <div className="onboarding-page">
      <div className="page-intro">
        <div className="intro-meta"><span className="eyebrow">UN BUEN COMIENZO</span><Badge>Paso 1 de 3</Badge></div>
        <h1>Tu marca empieza aquí.</h1>
        <p className="intro-description">Cada buena idea parte de conocerte. Empecemos por la información que hace única a tu empresa.</p>
      </div>

      <div className="onboarding-grid">
        <div className="form-column">
          <Card aria-labelledby="brand-start-title" className="brand-card">
            <div className="section-symbol"><Icon name={mode === "url" ? "globe" : "edit"} /></div>
            <h2 id="brand-start-title">{mode === "url" ? "Añade la web de tu empresa" : "Empecemos sin una web"}</h2>
            <p className="section-description">{mode === "url" ? "Guarda tu dirección para tenerla a mano cuando el análisis esté disponible." : (persistent ? "Crea tu marca y guarda una descripción inicial en tu cuenta. El perfil quedará en borrador." : "Deja los datos básicos de tu marca. Podrás revisarlos antes de crear su perfil.")}</p>

            <form onSubmit={submit} aria-busy={manual.busy || undefined} noValidate className="brand-form">
              {mode === "url" ? (
                <Field ref={websiteRef} id="company-url" label="Dirección de tu empresa" type="url" inputMode="url" autoComplete="url" placeholder="https://tuempresa.com" maxLength={2048} value={website} onChange={(e) => { setWebsite(e.target.value); setDirty(true); }} error={errors.website} hint="Usa una dirección HTTPS que tengas permiso para aportar. No la visitaremos en esta etapa." required />
              ) : (
                <>
                  <Field ref={nameRef} id="brand-name" label="Nombre de tu marca" autoComplete="organization" placeholder="El nombre de tu empresa" maxLength={120} readOnly={persistent && locked} value={persistent && manual.operation ? manual.operation.name : name} onChange={(e) => { setName(e.target.value); setDirty(true); }} error={errors.name} required />
                  <TextAreaField ref={descriptionRef} id="brand-description" label="¿Qué ofrece tu empresa?" placeholder="Cuéntanos qué haces y para quién." maxLength={600} readOnly={persistent && locked} value={persistent && manual.operation ? manual.operation.description : description} onChange={(e) => { setDescription(e.target.value); setDirty(true); }} error={errors.description} hint={`${(persistent && manual.operation ? manual.operation.description : description).length} de 600 caracteres. Solo necesitamos una descripción inicial.`} required />
                </>
              )}
              <div className="form-actions">
                <Button type="submit" disabled={manual.busy || (persistent && mode === "manual" && manual.operation?.stage === "creating")}>{mode === "url" ? "Guardar dirección" : !persistent ? "Guardar datos iniciales" : manual.busy ? "Guardando tu marca…" : manual.operation?.stage === "complete" ? "Comprobar guardado" : manual.operation ? "Comprobar y continuar" : "Crear mi marca"}<Icon name="arrow" /></Button>
                <Button variant="ghost" disabled={manual.busy} onClick={() => changeMode(mode === "url" ? "manual" : "url")}>{mode === "url" ? "Comenzar manualmente" : "Usar una dirección web"}</Button>
              </div>
              <p className="local-note">{persistent && mode === "manual" ? "Crear mi marca envía estos datos a tu cuenta. Conservamos el borrador en esta pestaña y el avance del intento en este navegador, separado por cuenta. No se analiza ninguna web." : "Este borrador permanece solo en la pestaña actual. No se envía a ningún servidor y puede perderse al cerrarla."}</p>
              {persistent && mode === "manual" && <ManualFeedback operation={manual.operation} failure={manual.failure} busy={manual.busy} progress={manual.progress} />}
              <p className="save-feedback" role="status" aria-live="polite">{status}</p>
              {storageError && <p className="field-error" role="alert">{storageError}</p>}
            </form>
            <div className="availability-note">
              <span className="availability-dot" aria-hidden="true" />
              <div><p className="notice-title">Análisis del sitio: todavía no disponible</p><p className="notice-body">{persistent ? "Puedes crear una marca manualmente y revisar su Brand DNA. El análisis web y la generación de anuncios llegarán en etapas posteriores." : "Hoy puedes preparar tu borrador. El análisis, Brand DNA y la generación de anuncios llegarán en etapas posteriores."}</p></div>
            </div>
          </Card>

          {draft && (
            <Card aria-labelledby="saved-draft-title" className="saved-draft">
              <div className="saved-heading"><Icon name="check" /><h2 id="saved-draft-title">Borrador en esta pestaña</h2></div>
              <p className="draft-value">{draft.mode === "url" ? draft.website : draft.name}</p>
              {draft.mode === "manual" && <p className="draft-description">{draft.description}</p>}
              <p className="field-hint">{persistent && locked && mode === "manual" ? "Conservamos los datos originales del intento. La edición del perfil estará disponible en una etapa posterior; puedes descargar este borrador." : dirty ? "Tienes cambios sin guardar. La descarga contiene el último borrador guardado." : "Es información aportada por ti; no un perfil generado ni analizado."}</p>
              <div className="draft-actions"><Button variant="secondary" disabled={manual.busy || (persistent && locked && mode === "manual")} onClick={restore}>Recuperar borrador</Button><Button variant="ghost" onClick={download}>Descargar JSON</Button><Button variant="ghost" disabled={manual.busy || (persistent && locked && mode === "manual" && manual.operation?.stage !== "complete")} onClick={clear}>Eliminar borrador</Button></div>
            </Card>
          )}
        </div>

        <aside className="journey" aria-labelledby="journey-title">
          <p className="eyebrow">A TU RITMO</p>
          <h2 id="journey-title">Primero, lo que te hace diferente.</h2>
          <p className="journey-description">Un contexto claro será el punto de partida de tu trabajo creativo.</p>
          <ol className="journey-steps" aria-label="Etapas de configuración">
            <li aria-current="step"><span className="step-number step-number--current">1</span><div><h3>Información de tu marca</h3><p>Una web o tus propios datos.</p><span className="step-state">Disponible ahora</span></div></li>
            <li><span className="step-number">2</span><div><h3>Brand DNA</h3><p>Revisarás la identidad y la voz.</p><span className="step-state">{persistent && manual.operation?.stage === "complete" && manual.operation.brandId ? "Disponible para tu marca" : "Próxima etapa · No disponible"}</span></div></li>
            <li><span className="step-number">3</span><div><h3>Productos</h3><p>Añadirás lo que quieres dar a conocer.</p><span className="step-state">Próxima etapa · No disponible</span></div></li>
          </ol>
          <Notice title="Tú mantienes el control"><p>Guardar datos no inicia un análisis, no genera contenido con IA y no implica ningún cargo.</p></Notice>
        </aside>
      </div>
    </div>
  );
}
