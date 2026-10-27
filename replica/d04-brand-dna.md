# D04 — edición y aprobación real de Brand DNA

Implementación sobre la API V1 aprobada, sin cambios en endpoints, SQL, RLS o migraciones. Base main `bbb54f9`; PR #6 integrado. [Especificación visual](design/d04-brand-dna.md).

## Acceso y modelo

`/app/brands/[brandId]/dna` exige requireUser/getUser. El servidor valida UUID, consulta la marca mediante la DAL aprobada y comprueba membership del workspace real de esa marca. El permiso de aprobación se deriva del rol activo y owner_user_id del servidor, nunca del workspace seleccionado en el navegador, user_metadata o almacenamiento local. Un miembro que sea owner de otro workspace no obtiene permisos de propietario sobre esta marca. Revalidación de identidad/permisos antes de cada escritura; un cambio de cuenta remonta el componente y descarta el envío pendiente.

El cliente carga GET marca con history=1/limit20, su revisión y ETag. No usa SDK de Supabase para escribir ni consulta tablas directamente. Todas las mutaciones son PATCH profile / POST approve de la API existente, con sesión SSR/RLS y If-Match. No se añade un endpoint de permisos, listado o selector de marcas. Errores de recurso inexistente y ajeno comparten404.

El formulario cubre exclusivamente schema_version1: identity, visual, voice, competitors. Vacíos opcionales se convierten a null, arrays se reemplazan de forma explícita y los límites se comparan con los contratos aprobados. No agrega assets/logo, evidencia inventada o campos desconocidos. Mensajes de éxito corresponden al perfil, sin anunciar que se renombró el registro de marca o se actualizó su URL por un endpoint independiente.

## Versiones y recuperación

Se conservan por separado snapshot guardado, edición local, ETag base, última revisión aprobada y, si se consulta, una versión más nueva para lectura. Modificar campos nunca altera el snapshot ni mueve el ETag base. Guardar envía el documento conocido con su If-Match y confirma revisión/resultado mediante GET. Aprobar requiere propietario, campos mínimos completos, ausencia de cambios locales y revisión actual draft; envía su revision_id y ETag, no un documento editado.

El historial reciente viene de la API (hasta20 metadatos); no se inventan páginas anteriores. Guardar después de aprobar crea un draft nuevo y conserva la aprobación anterior. La prueba de historial verifica snapshots aprobados conservados; no pretende que aprobar cree otra fila.

Antes de una mutación se escribe un registro de intención en sessionStorage, separado por cuenta y marca. El borrador se actualiza al editar y no se limpia al cerrar sesión. Fallos de almacenamiento se anuncian; no se envían escrituras sin copia previa durable en la pestaña. No contiene cookies, contraseñas o tokens. No es almacenamiento cifrado, sincronización entre dispositivos ni protección frente a alguien con acceso al perfil del navegador. Cerrar la pestaña puede perder la copia; descargarla es una alternativa explícita.

No hay reintentos automáticos. Si una escritura queda incierta, GET determina:

1. Save: cambió el ETag y el contenido actual coincide → guardado confirmado.
2. Approve: la misma revisión actual está aprobada → aprobación confirmada.
3. ETag base sin cambios → se permite una nueva acción explícita. If-Match sigue evitando duplicados si la solicitud anterior termina tarde.
4. Otra versión/contenido → conflicto; se conserva la edición, sin merge y sin renovar silenciosamente la precondición para forzar la escritura.

En409 se conserva el journal hasta consultar. La nueva versión se muestra separadamente; cargarla reemplaza la edición solo tras confirmación. Antes se puede copiar o descargar JSON. Mutex de pestaña y Web Lock por cuenta/marca evitan envío simultáneo; las pestañas conservan sus propios borradores y la API resuelve CAS entre escritores. Nunca se guardan campos de otro usuario al cambiar de cuenta durante el preflight.

## Integración con D02

Solo se añade el enlace de revisión al recibo de alta completa con ID confirmado. El controlador idempotente de D02 y su barrera de creación incierta no cambian. El recibo de alta es histórico: si D04 cambia el perfil, la comprobación del contenido inicial puede detectar conflicto, pero conserva el enlace al ID ya confirmado sin reenviar una creación ni restaurar los campos antiguos. D02 público sigue local; D03, productos, extracción, generación y pagos no se habilitan. Auth permanece intacto, incluida su allowlist cerrada de retorno a /app; tras reautenticarse se puede volver a abrir el detalle autorizado desde el enlace de D02 o su URL.

## Comprobaciones

- `npm run test:dna:contracts`: 12 contratos de límites Unicode/JSONv1, validación, journal y conciliación, contrastados con el validador API aprobado.
- `npm run test:dna`: stack Supabase local nuevo, Next de producción y Playwright/Chrome. Dos usuarios de Auth local, dos workspaces y fixtures de membership local para probar miembro frente a propietario; sin modificar políticas o esquema.
- Suite prevista: alta real por D02, GET/ETag, campos, guardado/aprobación, historial, draft posterior, edición recuperada, conflicto real409, copy/download, fallos de transporte después de escrituras reales, sesión expirada, permisos, aislamiento y axe/capturas desktop/móvil.
- Regresión local D02 público/D01:34 Playwright correctos. TypeScript, ESLint y build correctos. No se ejecutó auth-live ni el caso que consulta rechazo Auth remoto.
- Actions mantiene las regresiones RPC/RLS, API y D02 privado antes de D04. Runner estándar gratuito, CLI2.122.0 y solo endpoints loopback del stack aislado. Artefactos JSON de esquema cerrado y capturas explícitas de datos sintéticos, sin formularios Auth, trazas o logs crudos.

Primera integración real correcta: [Actions 40584300887](https://github.com/leoomirelesss/holoai/actions/runs/40584300887), 41 comprobaciones D04, 34 D02, 93 API y 82 RPC/RLS; contratos 12 D04,10 D02 y31 API correctos. Limpieza confirmada. La aceptación ampliada posterior figura en el resultado final de esta documentación. No se usa linde-dev remoto para probar escrituras, ni se aplica o repara su historial de migraciones.

En la ejecución40585736453 falló la regresión de conflicto D02 antes de llegar a D04. Se detectó una espera de UI de15s inferior al presupuesto de20s por request más el preflight/varias operaciones. Se ajustó la espera de pruebas a60s y se agregó una aserción HTTP200 de la escritura concurrente inyectada; todas las aserciones de conflicto y conservación permanecen activas. Los timeouts de producción no cambian. El escenario reforzado y la ampliación de estados D04 pasaron en la ejecución final.

La ampliación encontró una infracción ARIA en el resumen sin colores: un div genérico vacío tenía aria-label. Se corrigió con texto explícito para el estado vacío y role=group para la paleta con colores. El diagnóstico local de componentes no usa ni simula sesiones de Supabase; la aceptación integral posterior pasó con usuarios reales del stack local. Los fallos axe ahora identifican solo la regla en el JSON sanitizado, sin HTML o datos del perfil. Las capturas D04 explícitas pueden publicarse también al fallar una auditoría para revisar el estado real; nunca se capturan formularios Auth.

La comprobación320px/200% detectó overflow en la etiqueta larga de revisión, que heredaba nowrap de Badge. El ajuste se limita a `.dna-page .badge`: permite varias líneas sin ocultar estado/versión y mantiene intactos D02 y Auth. Pasaron la comprobación real de reflow y las pruebas de permisos y persistencia.

## Resultado final verificado

[Actions 40590747868](https://github.com/leoomirelesss/holoai/actions/runs/40590747868), código `d3d7559`: **48 D04, 35 D02 privadas, 93 API y82 RPC/RLS correctas**, con cleanup confirmado y SQL aprobado idéntico. **12 contratos D04,10 D02 y31 API**, TypeScript, ESLint y builds de producción correctos. [Evidencia JSON de D04](dna-results.json).

Se verificaron carga/ETag reales, edición, aprobación owner-only, historial, borrador posterior conservando aprobados, HTTP409 sin sobrescritura, miembro que no puede aprobar aunque posea otro workspace, aislamiento/revocación/anonimato, recarga/reautenticación y recuperación de PATCH/approve con respuesta perdida sin duplicar revisiones. D02 mantiene el enlace confirmado tras editar el perfil y su barrera de creación incierta. Axe pasó en los estados medidos, incluido skeleton, incompleto/error, draft/approved, conflicto, escritura incierta, offline, acceso denegado y miembro. Reflow320px/200% sin overflow. La regresión local final de D02 público/D01 suma34 Playwright correctas.

[Ocho capturas originales y estados](design/screenshots/d04/README.md), desktop1440/móvil390, revisadas visualmente y sin modificaciones. Ninguna prueba creó registros en linde-dev. No hubo cambios de API, SQL, RLS, migraciones o Auth; no quedan bloqueos de contrato para D04. Límites explícitos: logo/Storage no disponibles, fuente como texto según contrato, historial reciente hasta20, copia local limitada a la pestaña y navegación Auth de retorno a /app preservada. No se implementan catálogo, importación, IA o pagos. PR #7 sin fusionar; esperar revisión.
