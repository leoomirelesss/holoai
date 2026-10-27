"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge, Card, Notice } from "@/components/ui/surface";
import { documentFor, validate } from "./model";
import { useDnaEditor } from "./use-editor";
import { useLeaveGuard } from "./use-leave-guard";
import { DnaSections, ProfileSummary } from "./sections";
import { DnaSkeleton } from "./skeleton";

const messages = { network: "No pudimos conectar con Linde. Tu edición de esta pestaña se conserva.", session: "Tu sesión ha expirado. Vuelve a iniciar sesión con la misma cuenta; tus cambios locales se conservan.", denied: "No tienes acceso a esta marca o a la acción solicitada. No se ha concedido acceso a datos de otro espacio.", conflict: "La versión ha cambiado (409). Tu edición se conserva y no se sobrescribirá la nueva versión. Copia tus cambios antes de cargarla.", validation: "Revisa los campos indicados. No se ha confirmado ningún guardado.", unavailable: "No pudimos confirmar la operación. El servicio no está disponible; tu edición se conserva.", storage: "El almacenamiento de esta pestaña no permite conservar la edición de forma segura. Descarga tus cambios antes de salir. No se enviarán escrituras sin copia de recuperación.", busy: "Hay otra operación de esta marca en curso en otra pestaña. Puedes comprobar su resultado antes de continuar." };
export function DnaEditor(props: { brandId: string; scope: string; owner: boolean; authorized: boolean; validationNonce: string }) {
  const editor = useDnaEditor(props);
  const [backupMessage, setBackupMessage] = useState("");
  useLeaveGuard(editor.dirty || Boolean(editor.pending));
  const denied = editor.failure === "session" || editor.failure === "denied";
  const href = `/app/brands/${props.brandId}/dna`;
  const errors = editor.form ? validate(editor.form, true) : {};
  const missing = Object.keys(errors).filter(key => ["name", "description", "language", "tone", "audience"].includes(key));
  const blocked = editor.busy || Boolean(editor.pending) || editor.conflict || editor.storageBad;
  async function copy() {
    if (!editor.form) return;
    try { await navigator.clipboard.writeText(JSON.stringify(documentFor(editor.form), null, 2)); setBackupMessage("Cambios copiados como JSON."); }
    catch { setBackupMessage("No pudimos copiar al portapapeles. Puedes descargar los cambios como JSON."); }
  }
  function download() {
    if (!editor.form) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(documentFor(editor.form), null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "linde-brand-dna-edicion-local.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <AppShell authenticated dnaHref={props.authorized && !denied ? href : undefined} dnaActive>
    <div className="onboarding-page dna-page">
      <div className="dna-heading"><div className="page-intro"><div className="intro-meta"><span className="eyebrow">TU IDENTIDAD, CON CRITERIO</span>{editor.base && <Badge>Revisión {editor.base.revisionNumber} · {editor.base.status === "approved" ? "Aprobada" : "Borrador"}</Badge>}</div><h1>El ADN de tu marca.</h1><p className="intro-description">Una identidad clara para cada idea que viene. Guarda tu borrador y aprueba una revisión cuando esté lista.</p></div><Link href="/app" className="button button--ghost">Volver a configurar marca</Link></div>
      <p className="field-hint" role="status" aria-live="polite">{editor.message}</p>
      {editor.failure && <div role="alert" className="notice notice--warning dna-notice"><p>{messages[editor.failure]}</p>{editor.failure === "session" && <Link href="/auth/login?next=%2Fapp">Volver a iniciar sesión</Link>}</div>}
      {editor.pending && !editor.busy && <Notice tone="warning" title="Escritura por comprobar"><p>La respuesta no confirma el resultado. Consulta la versión actual antes de volver a guardar o aprobar; no repetiremos la escritura automáticamente.</p></Notice>}
      {editor.form && <div className="dna-backup"><Button variant="ghost" onClick={() => void copy()}>Copiar mis cambios (JSON)</Button><Button variant="ghost" onClick={download}>Descargar mis cambios</Button><span role="status" className="field-hint">{backupMessage}</span></div>}
      {(!editor.base || denied) && <>{editor.busy ? <DnaSkeleton /> : <div className="dna-empty"><h2>{denied ? "Acceso no disponible" : "No pudimos cargar el perfil"}</h2><p className="field-hint">No se mostrará un perfil vacío como si fuera la revisión guardada.</p><Button variant="secondary" onClick={() => void editor.consult()}>Volver a consultar</Button></div>}</>}
      {editor.base && editor.form && !denied && <>
        <nav className="dna-section-nav" aria-label="Secciones de Brand DNA"><a href="#dna-identity">Identidad</a><a href="#dna-visual">Identidad visual</a><a href="#dna-voice">Voz y audiencia</a><a href="#dna-competitors">Competidores</a></nav>
        {editor.latest && <Card className="dna-section" aria-labelledby="dna-latest-title"><h2 id="dna-latest-title">Versión del servidor · revisión {editor.latest.revisionNumber}</h2><p className="field-hint">Consulta independiente. No se ha mezclado con tus cambios.</p><details><summary>Consultar contenido de la versión actual</summary><ProfileSummary form={editor.latest.form} full /></details><div className="draft-actions"><Button variant="secondary" disabled={editor.busy} onClick={() => void editor.consult(true)}>Cargar versión del servidor</Button></div></Card>}
        <div className="dna-grid">
          <form noValidate className="dna-form" aria-busy={editor.busy} onSubmit={e => { e.preventDefault(); editor.start("save"); }}>
            <DnaSections form={editor.form} errors={editor.errors} locked={editor.busy || Boolean(editor.pending) || editor.storageBad} onChange={editor.change} />
            <Card className="dna-section" aria-labelledby="dna-save-title"><h2 id="dna-save-title">Conserva tu siguiente versión.</h2><p className="field-hint">Guardar crea una revisión. Aprobar confirma solo la revisión guardada y actual; no incluye cambios locales.</p>
              {editor.errors.document && <p role="alert" className="field-error">{editor.errors.document}</p>}
              {missing.length > 0 && <p className="field-hint">Perfil incompleto: para aprobar necesitas nombre, descripción, idioma, tono y audiencia.</p>}
              {editor.dirty && <p className="field-hint">Tienes cambios locales sin guardar.</p>}
              <div className="draft-actions"><Button type="submit" disabled={blocked || (!editor.dirty && !editor.retry)}>{editor.busy ? "Comprobando operación…" : "Guardar borrador"}</Button>
                {props.owner ? <Button variant="secondary" disabled={blocked || editor.dirty || editor.base.status !== "draft"} onClick={() => editor.start("approve")}>Aprobar perfil</Button> : <p className="field-hint">Solo el propietario puede aprobar este perfil. Puedes guardar borradores.</p>}
                <Button variant="ghost" disabled={editor.busy} onClick={() => void editor.consult()}>Consultar versión actual</Button>
              </div><p className="local-note">La edición se conserva en esta pestaña, separada por cuenta y marca. No cierres la pestaña sin guardar o descargar tus cambios.</p>
            </Card>
          </form>
          <aside className="dna-summary" aria-labelledby="dna-summary-title"><Card className="dna-section"><span className="eyebrow">EN PERSPECTIVA</span><h2 id="dna-summary-title">Tu marca, en esencia.</h2><p className="field-hint">{editor.dirty ? "Vista previa de tu edición local; todavía sin guardar." : "Contenido de la revisión guardada."}</p><ProfileSummary form={editor.form} />
            {editor.base.approved && <div className="dna-approved"><h3>Última aprobada · revisión {editor.base.approved.number}</h3><p className="field-hint">{editor.base.status === "approved" ? "Esta es la revisión aprobada actual." : "La aprobación anterior se conserva; este borrador no la sustituye."}</p><details><summary>Consultar perfil aprobado</summary><ProfileSummary form={editor.base.approved.form} full /></details></div>}
          </Card><Card className="dna-section"><h2>Historial reciente</h2><p className="field-hint">Hasta 20 revisiones guardadas. Guardar un nuevo borrador conserva las anteriores.</p><ol className="dna-history">{editor.base.history.map(r => <li key={r.id}>Revisión {r.revision_number}<span>{r.approval_status === "approved" ? "Aprobada" : "Borrador"}</span></li>)}</ol><p className="field-hint">Productos, importación web y generación de IA todavía no están disponibles.</p></Card></aside>
        </div>
      </>}
    </div>
  </AppShell>;
}
