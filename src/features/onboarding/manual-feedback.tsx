import Link from "next/link";
import { Badge, Card } from "@/components/ui/surface";
import type { FailureKind, ManualOperation } from "./manual-operation";

const messages: Record<FailureKind, string> = {
  network: "No hay conexión con Linde. Conservamos el borrador y el avance. Cuando vuelva la conexión, puedes comprobar y continuar el guardado.",
  session: "Tu sesión ha expirado. Vuelve a iniciar sesión con la misma cuenta para continuar. El borrador y el avance permanecen guardados.",
  validation: "No pudimos aceptar los datos. Tu borrador se conserva. Revisa el nombre y la descripción; el intento iniciado mantiene sus datos originales para evitar duplicados.",
  permission: "No tienes acceso a este espacio o a esta marca. No se ha cambiado de espacio ni iniciado otra creación. Tu borrador permanece guardado.",
  conflict: "La marca o el espacio han cambiado. Conservamos tu descripción sin sobrescribir otra versión. Puedes comprobar de nuevo; no crearemos otra marca.",
  unavailable: "El servicio no está disponible o no pudo confirmar la respuesta. Conservamos el avance. Puedes comprobar el guardado antes de continuar.",
  uncertain: "No sabemos si la marca llegó a crearse. No volveremos a crearla para evitar duplicados. Conservamos tu borrador y la referencia del intento; será necesario verificar este resultado antes de empezar otro.",
  storage: "No pudimos conservar de forma segura el avance en este navegador. No continúes en otra pestaña ni borres sus datos. Los campos siguen disponibles; descarga el borrador y, si aparece un ID de marca, conserva también esa referencia.",
  busy: "Este intento ya está en curso en otra pestaña. Espera a que termine y comprueba su estado aquí.",
};
export function ManualFeedback({ operation, failure, busy, progress }: { operation: ManualOperation | null; failure: FailureKind | null; busy: boolean; progress: string }) {
  const uncertain = operation?.stage === "creating";
  const message = failure ? messages[failure] : uncertain && !busy ? messages.uncertain : null;
  return <>
    <p className="field-hint" role="status" aria-live="polite">{busy ? progress : operation?.stage === "complete" ? (failure ? "El alta inicial está confirmada; el perfil puede haber cambiado después." : "Marca y descripción guardadas. Se conserva el borrador local.") : operation?.brandId ? "Marca creada. La descripción todavía necesita confirmación de guardado." : ""}</p>
    {message && <div className="field-error" role="alert"><p>{message}</p>{failure === "session" && <Link href="/auth/login?next=%2Fapp">Volver a iniciar sesión</Link>}</div>}
    {operation && <Card className="manual-receipt" aria-labelledby="manual-operation-title">
      <div className="saved-heading"><h2 id="manual-operation-title">Tu alta manual</h2><Badge>{busy ? "En curso" : operation.stage === "complete" ? "Guardado confirmado" : uncertain ? "Resultado incierto" : "Guardado pendiente"}</Badge></div>
      <p className="draft-value">{operation.name}</p>
      <p className="draft-description">{operation.description}</p>
      <p className="field-hint">{operation.workspaceId ? "Espacio de trabajo confirmado." : "Espacio de trabajo pendiente de confirmar."}</p>
      {operation.brandId && <p className="field-hint">ID de marca confirmado: <span className="operation-reference">{operation.brandId}</span></p>}
      <p className="field-hint">Referencia del intento: <span className="operation-reference">{operation.attempt}</span></p>
      <p className="field-hint">Esta alta no aprueba el perfil. Su revisión y aprobación se realizan por separado.</p>
      {operation.stage === "complete" && operation.brandId && failure !== "session" && failure !== "permission" && !busy && <div className="draft-actions"><Link className="button button--secondary" href={`/app/brands/${operation.brandId}/dna`}>Revisar Brand DNA</Link></div>}
    </Card>}
  </>;
}
