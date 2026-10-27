# API V1 de workspaces y marcas

2026-10-27 · `feat/brand-api-foundation` · base main `58ee6d3`, PR #4 integrado. Seis endpoints, DAL servidor y sesión SSR; sin pantallas, tablas, políticas o migraciones nuevas. No se escriben datos de prueba en linde-dev.

## Contrato común

Sesión por cookies Supabase SSR, verificada remotamente con `getUser()` en cada request. Un JWT en Authorization no sustituye la sesión por cookies. Usuario sin correo confirmado:403. No se autoriza con getSession, metadata editable, IDs de workspace de cabeceras/query o service_role. Las consultas conservan el JWT del usuario y RLS; las mutaciones usan exclusivamente las cuatro RPC aprobadas.

Mutaciones: Origin exacto permitido por SITE_URL/configuración canónica, rechazo de Origin ausente/null/ajeno y Sec-Fetch-Site cross-site. El caso localhost/127 del entorno local conserva la excepción ya usada por Auth. No se publican cabeceras CORS. GET no muta datos.

Respuestas propias:

- Éxito: `{data: ..., meta: {correlation_id: ...}}`.
- Error: `{error: {code, message, retryable}, meta: {correlation_id: ...}}`.
- Cache-Control private/no-store, Vary Cookie, nosniff y referrer-policy no-referrer; sin redirects de login en API.
- Correlation ID generado por servidor, nunca reflejado desde un valor arbitrario del cliente. No se registran cuerpos, cookies, tokens, claves ni errores de proveedor; también se omiten URLs privadas de API en el logger entrante de Next.

Máximo HTTP:70KiB reales, incluso sin Content-Length/chunked. JSON sin compresión; tipo distinto:415; JSON inválido:400; payload excesivo:413; campos/tipos/propiedades desconocidas:422. Perfil v1 limitado por el contrato ya aprobado (64KiB de documento y límites de cada campo); SQL mantiene su validación final. No hay logo/assets/import/evidencias nuevas sin sus tablas/FKs. Se rechazan NUL y Unicode malformado antes de llegar a PostgreSQL.

401: sesión ausente/inválida. 403: correo sin confirmar, CSRF o miembro visible sin rol owner. 404: recurso ausente/no autorizado, incluidos IDs ajenos conocidos. 409: SQLSTATE40001, unicidad o versión obsoleta. 428: falta If-Match. 422: entrada inválida. 503: dependencia/configuración no disponible; detalles internos ocultos. Fallos inesperados de aplicación:500 genérico. `retryable` solo se marca para lecturas503: las mutaciones no se reintentan automáticamente ante resultados ambiguos.

## Endpoints

| Método/ruta | Entrada | Salida/efecto |
| --- | --- | --- |
| POST `/api/v1/workspaces` | `{name}`; Idempotency-Key ASCII opaca de1–128 caracteres | 200 y workspace mínimo autorizado; bootstrap_workspace atómico owner+membership. Misma clave/usuario/payload devuelve el mismo ID; conflicto409. No inventa un flag de replay ni status201: la RPC solo devuelve UUID. |
| GET `/api/v1/workspaces/current` | Sin query/selección de tenant | 200 `{workspace}` o `{workspace:null}`. Primero workspace propio activo; si no existe, única membership activa autorizada; ambigüedad409. La selección nunca procede de metadata/query. |
| POST `/api/v1/workspaces/{workspaceId}/brands` | `{name, website_url?}`; HTTPS o null | Solo owner activo. create_brand crea marca y revisión1 draft atómicamente. 201 con brand_id/initial_revision reales y Location relativa para consultar la marca. Sin análisis o IA implícitos. |
| GET `/api/v1/brands/{brandId}` | Opcional history=1, limit≤50 (default20), cursor opaco, revision_id | Marca, current_revision y approved_revision; selección/historial acotados a la misma marca y workspace. ETag de versión. |
| PATCH `/api/v1/brands/{brandId}/profile` | `{profile_document: patch}` e If-Match | Miembro activo. Merge de secciones editables sobre snapshot actual; save_brand_profile con versión esperada. Nueva revisión draft;200 con ID/revisión y ETag de esa operación. |
| POST `/api/v1/brands/{brandId}/profile/approve` | `{revision_id}` e If-Match | Solo owner. Revisión de esa marca/tenant y actual; approve_brand_profile valida mínimos y fija actor/fecha.200 con ID/revisión y ETag. Historial conservado. |

Workspace DTO: id, nombre, estado, versión, rol del usuario y fechas. Nunca bootstrap_key, request_hash, owner_user_id u otros miembros. Marca DTO: ID, workspace_id autorizado, nombre/web, versión, archivo y fechas. Revisión: ID, número, documento, estado, fecha de aprobación y creación; sin IDs de usuarios ni mensajes internos.

`current_revision_id` representa la última revisión guardada, draft o aprobada. approved_revision conserva la aprobada más reciente aunque haya un draft nuevo. Historial entrega metadatos paginados; revision_id permite leer el documento exacto autorizado. El cursor solo representa un número anterior; no concede acceso ni selecciona workspace. Durante lecturas compuestas se comprueba de nuevo la versión/pertenencia al final; un cambio concurrente devuelve409 para no presentar una mezcla como snapshot coherente.

## PATCH, ETag y concurrencia

ETag fuerte para precondiciones: `"brand-<uuid>-v<versión>"`. Se obtiene del GET y se envía literalmente en If-Match de guardar/aprobar. No se aceptan tags débiles, listas, wildcard ni números sueltos; un tag de otra marca o versión obsoleta entra en conflicto. No se utiliza If-None-Match/cache compartida para saltarse autorización.

PATCH no es JSON Merge Patch RFC7396: identidad/visual/voz se fusionan por campo; arrays de colores/competidores se reemplazan; null en strings opcionales conserva un valor explícitamente vacío para un draft. No se admite null en toda una sección. schema_version, si se incluye, debe ser1; el servidor conserva esa versión. Guardar solo descripción no elimina nombre, web, idioma o audiencia guardados. No se permite escribir approval_status, actores, fechas, workspace_id o punteros.

El contador brands.revision se comprueba antes del merge y otra vez por la RPC transaccional. SQLSTATE40001 se convierte a HTTP409, incluido el500 que PostgREST entrega al SDK. El resultado de escritura identifica su propia revisión/ETag confirmado por la operación; no se atribuye al cliente una versión posterior de otro escritor. GET permite recuperar fechas/documentos actuales. Un retry de PATCH sobre una versión ya consumida devuelve409, no duplica silenciosamente la revisión.

## Implementación y decisiones acotadas

- Validación acotada TypeScript y contratos con Playwright ya instalado; no se añaden Zod/Vitest en este tramo, frente a la selección futura de Architect. La validación transaccional SQL permanece autoritativa.
- `src/lib/api`: contexto SSR/getUser, envelope/CSRF/lector de JSON acotado, clasificación de errores y validación pura.
- `src/features/workspaces/server.ts` y `src/features/brands/server.ts`: DAL con módulos de dominio separados, RLS y RPC; Route Handlers finos.
- `src/lib/data/database.types.ts`: proyección TypeScript estricta de las cuatro tablas y funciones aprobadas, sin introspección remota. Insert/Update de tablas son never en la DAL: no sustituyen los grants/RLS reales. Relationships vacías limitan esta proyección a consultas explícitas, no niegan las FKs de la base.
- Ajuste mínimo de transporte en getAuthConfig: HTTP permitido exclusivamente en loopback para el Supabase local oficial. HTTPS remoto y prohibición de claves privilegiadas se conservan. No cambian login, logout, recuperación, proxy o UI de Auth.
- La prueba construye Next.js de producción con URL/key locales nuevas para impedir que un build incluya variables NEXT_PUBLIC de otro entorno. Captura/suprime logs de build/start y no publica el directorio temporal ni bundles.

Límite de Architect: la política actual oculta workspaces deleting/deleted también al owner. Sin cambiar RLS o usar privilegios elevados, A02 no puede entregar el futuro recibo de borrado descrito en Architect. En esta fase current solo representa tenants activos y devuelve null si no hay uno visible; el DTO de cierre queda para la fase de borrado autorizada. No se simula ese estado. La selección explícita entre múltiples workspaces y audit_events tampoco se añaden a estas cuatro tablas.

## Historial de migraciones

El propietario confirma aplicación remota con versión20261027163720; GitHub conserva20261026000100. [Registro y reconciliación pendiente](migration-history.md). Ningún comando de este PR repara o aplica migraciones remotas; CI usa solo una base local nueva. La diferencia de historial no se oculta renombrando el SQL.

## Validación

Local, completado antes de CI: TypeScript, ESLint, build de producción y **31 contratos Playwright sin navegador/DB**. Verifican validación, Unicode/límites, merge sin pérdida, ETags, cursores y clasificación segura de errores, incluido40001→409.

`npm run test:api` levanta un Supabase CLI/Docker nuevo y Next.js de producción; crea exactamente dos usuarios locales mediante Auth/SSR y usa sus cookies/JWT reales. Prueba contratos HTTP,401/403/404/409/413/415/422/428/503, idempotencia, creación/guardado/aprobación, historial, metadata, ownership/membership, revocación y concurrencia. Un cambio temporal del registro local de confirmación comprueba que se vuelve a consultar getUser; una pausa/reanudación de PostgREST comprueba503 y recuperación. Son fixtures/fallos locales de prueba, no nuevas funciones del producto ni cambios de esquema/políticas remotos.

El workflow conserva la regresión RPC previa de82 checks y añade la suite API, con TypeScript/ESLint/contratos. Solo sube JSON sanitizado por suite. No usa usuarios reales, secretos de GitHub o linde-dev, ni ejecuta auth-live. **Resultado inicial de integración API: 91 comprobaciones HTTP correctas** y82 regresiones RPC en [Actions](https://github.com/leoomirelesss/holoai/actions/runs/40549066939), con cleanup confirmado.** La ampliación de validación de Unicode se verifica en la siguiente ejecución del mismo PR.
