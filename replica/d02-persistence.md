# D02 conectado al alta manual real

Rama `feat/d02-persistent-onboarding`, base main `bd28142` (PR #5 integrado). Implementación acotada a D02 y su consumo de la API existente. [Estados UI/UX](design/d02-persistence.md).

## Flujo y recuperación

1. Antes de cada acción, una actualización read-only de `/app` vuelve a ejecutar requireUser. El nonce servidor nuevo permite continuar. Si cambió la cuenta, el componente se remonta con otro scope y descarta el envío pendiente. No se transportan credenciales al cliente.
2. Se conserva el borrador de pestaña y se escribe un registro de intento por cuenta en localStorage. Web Locks serializa pestañas del mismo origen/cuenta; si no está disponible, se bloquea el envío. Un mutex inmediato evita doble submit en la misma pestaña.
3. GET current resuelve exclusivamente el workspace autorizado del servidor. Si no existe, POST workspaces usa la misma Idempotency-Key y el mismo nombre del intento en cada reintento. No se crean espacios al montar la pantalla.
4. Antes de POST brands se persiste stage=creating. Un201 con UUID confirmado permite guardar brandId y pasar a profile. Nunca se toma metadata como selector de tenant.
5. GET marca obtiene la revisión y ETag real. PATCH envía únicamente la descripción aportada, conserva los otros campos y usa If-Match. Se guarda la versión base antes de enviar. Un GET posterior confirma descripción/nombre/tenant antes de declarar éxito.
6. Recargar restaura la tarjeta/etapa y el formulario manual. No escribe por sí solo. Si se perdió la respuesta de PATCH, «Comprobar y continuar» primero lee: si la descripción ya coincide, confirma sin otro PATCH. Si la versión cambió y no coincide, presenta conflicto sin sobrescribir. Con versión base idéntica, el reintento explícito puede completar el PATCH pendiente.

No hay aprobación automática. Workspace, marca y descripción son operaciones distintas; se conserva cada resultado parcial. Logout no limpia los borradores ni el registro. Tras confirmar, se conserva el borrador; borrarlo requiere la acción explícita ya existente. Recuperar el borrador manual hacia campos editables queda bloqueado una vez iniciado el intento: la edición posterior del perfil pertenece a D04. Eliminar el borrador también está bloqueado mientras el guardado esté pendiente; descargar sigue disponible. Las acciones de borrador URL continúan operativas.

## Límite importante de creación

POST brands no tiene clave idempotente ni endpoint de consulta por intento/listado de marcas. Cualquier envío sin respuesta de creación confirmada queda **incierto** y no puede reenviarse desde esta UI, ni tras recargar, volver a iniciar sesión o desde otra pestaña. Incluso un4xx podría seguir a una RPC confirmada si la lectura posterior perdió permisos: la UI no presume que no hubo commit. La referencia local no es una clave reconocida por la API. No existe conciliación automática ni botón «crear otra» que eluda esta barrera.

Si la pestaña cae después de registrar creating pero antes del envío efectivo, el bloqueo es conservador. Si se confirma el ID pero falla escribir el registro local, se conserva el resultado en memoria y se informa del fallo; recargar puede perder ese ID. No borrar el almacenamiento para «reintentar»: eso elimina la protección local. Resolver esta limitación requiere una etapa futura autorizada de idempotencia/conciliación en API, no cambios encubiertos a SQL o RLS.

## Pruebas reproducibles

- `npm run test:onboarding:contracts`: contratos puros del controlador con dobles explícitos, no evidencia de persistencia remota.
- `npm run test:onboarding`: CLI2.122.0 + Docker + Chrome/Chromium (PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH o navegador de Playwright instalado), Supabase local nuevo y Next.js de producción, dos usuarios locales con Auth real y login por interfaz Playwright. Solo acepta127.0.0.1:55321/3100; construye con variables locales y no propaga credenciales remotas.
- El workflow de integración comprueba Chrome/Chromium preinstalado del runner y añade la suite D02, manteniendo las regresiones API/RPC. Publica JSON de estructura cerrada y exclusivamente capturas explícitas de datos sintéticos locales, sin formularios Auth, trazas o reportes crudos.
- Regresión pública/D01: Playwright desktop/móvil, excluyendo auth-live y el caso que consulta Auth remoto. No se usan cuentas reales ni se crean marcas en linde-dev.

La integración Docker en este entorno Codex sigue teniendo controlador vfs/disco32GiB; la validación completa se ejecuta en runner estándar gratuito ubuntu-24.04/overlay2 mediante Actions. Resultados finales y capturas se registrarán tras completar la ejecución. No se simulan resultados.

## Alcance conservado

API, DAL servidor, SQL, políticas RLS y pantallas Auth aprobadas intactas. Sin servicios adicionales, análisis web, productos, IA, D03/D04 o cambios de tokens. El único ajuste a draft-store es un scope opcional para borradores privados; sin scope conserva exactamente la clave y comportamiento públicos.
