# Base de datos — fase 1: marcas y Brand DNA

2026-10-26 · rama `feat/brand-data-foundation`, desde `main` (`b716e73`, PR #2 integrado).

**Preparado para revisión; NO aplicado a `linde-dev` (`wjjtqmtsysufqdxwknqx`).** No se conectó el runner SQL al proyecto, no se ejecutó `supabase link`, `db push`, `db reset --linked` ni SQL remoto. No cambian frontend, Auth, Recon, Architect o Design. No se implementan pantallas D03/D04, endpoints HTTP, importación, productos, IA, jobs, Storage ni pagos.

## 1. Entrega y correspondencia con Architect

- Migración: `supabase/migrations/20261026000100_brand_data_foundation.sql`. DDL y permisos en una sola transacción. Cuatro tablas propias, sin dependencias nuevas de npm.
- Pruebas SQL: `supabase/tests/brand-data-foundation.sql`.
- Fixture exclusivamente local: `supabase/tests/local-auth-fixture.sql`.
- Ejecutor: `scripts/test-brand-data.mjs`, mediante `npm run test:db`.

Lectura completa de `architecture.md`, `data-model.md`, `api-and-jobs.md` y `design/screens.md`. Se implementa el subconjunto de Identity/Tenancy y Brands de A01/A04/A07/A08 como funciones SQL, **no sus rutas HTTP**. La futura DAL usará el JWT del usuario, sin una service key. No se integra todavía el borrador local D02 con la base.

| Tabla | Contenido e invariantes de esta fase |
| --- | --- |
| `workspaces` | Owner FK a `auth.users` con RESTRICT, nombre, estado active/deleting/deleted, revisión, clave de bootstrap/hash de solicitud; un solo workspace active/deleting por propietario en V1. |
| `memberships` | Workspace CASCADE, usuario RESTRICT, UNIQUE workspace/usuario, roles owner/member, estados active/revoked. Un único owner activo que coincide con el propietario del workspace, comprobado por triggers diferibles. |
| `brands` | Workspace CASCADE, nombre/web opcional, archivo, revisión optimista y puntero a su última revisión. FK compuesta impide punteros a otro tenant **o a otra marca del mismo tenant**. |
| `brand_revisions` | Snapshot JSONB, número único por marca, draft/approved/rejected, creador y aprobación con actor/fecha. FK compuesta a marca/tenant. Aprobación exige actor/fecha; no modifica el contenido. |

Todas tienen UUID y fechas de servidor, con trigger que genera ID y tiempos al insertar y protege identidad/contexto al actualizar. `updated_at` de una revisión permanece igual a `created_at`; la transición de aprobación tiene su propia fecha `approved_at`. Actores derivados de `auth.uid()`, nunca aceptados como parámetros.

**Construcción progresiva, sin modificar el contrato aprobado:** los campos presupuestarios de workspaces se añaden cuando se implemente admisión/uso, no como una contabilidad ficticia en esta fase. `source_import_id` se pospone hasta crear `website_imports` y su FK compuesta. Tampoco se admiten IDs de logos/assets sin su tabla e integridad referencial. No se dejan referencias UUID sin FK dentro del perfil. La integración de fuentes/evidencias de importación deberá ampliar explícitamente el contrato del documento al añadir ese módulo. Las otras doce tablas no se crean.

## 2. Mutaciones transaccionales y permisos

Las cuatro tablas tienen RLS habilitada. `authenticated` recibe únicamente SELECT, sujeto a membership activa, workspace activo y correo confirmado. `anon` no recibe acceso. No existen políticas de escritura: la ausencia de INSERT/UPDATE/DELETE policies es un **default deny intencionado**, además de retirar esos grants. Se revocan también permisos automáticos de `service_role` sobre estos objetos; ninguna función nueva necesita su clave. Un superusuario/propietario de migraciones sigue siendo privilegiado y no representa un usuario de aplicación.

RLS consulta relaciones persistidas, no `user_metadata`, roles enviados en JSON, selección de workspace del cliente o una copia antigua de memberships en JWT. El helper de lectura está en `linde_private`, con SECURITY DEFINER, `search_path = ''`, relaciones cualificadas y ejecución restringida. Así evita recursión RLS sobre memberships. Ese esquema **no debe añadirse a los esquemas expuestos de Data API**.

| Función pública | Autorización y resultado |
| --- | --- |
| `bootstrap_workspace(p_name text, p_bootstrap_key text) → uuid` | Usuario existente con correo confirmado; bloquea su fila de Auth, crea workspace y owner membership en la misma transacción. Misma clave/owner y hash devuelve ID original; payload distinto o segundo workspace vivo da conflicto. |
| `create_brand(p_workspace_id uuid, p_name text, p_website_url text default null) → uuid` | Solo owner activo; crea marca y primera revisión draft, y enlaza el puntero, atómicamente. No crea análisis ni llamadas externas. |
| `save_brand_profile(p_brand_id uuid, p_expected_revision bigint, p_profile_document jsonb) → uuid` | Miembro activo; comprueba contexto, archivo y versión. Inserta nuevo snapshot draft y cambia puntero/metadatos/versionado de marca en una transacción. |
| `approve_brand_profile(p_brand_id uuid, p_revision_id uuid, p_expected_revision bigint) → uuid` | Solo owner activo; exige revisión actual draft de esa marca, versión correcta y cinco campos mínimos. Marca aprobación y avanza versión de marca atómicamente. |

Son las únicas funciones de mutación concedidas a `authenticated`; PUBLIC, anon y service_role no pueden ejecutarlas. Todas fijan `search_path = ''`, verifican identidad y permisos dentro de la función y no utilizan SQL dinámico. Helpers de escritura/triggers no tienen EXECUTE para usuarios. No se modifica el grant de funciones ajenas de Auth o del proyecto.

Las escrituras de marca bloquean workspace → membership → marca. Se serializan por workspace para simplificar esta etapa. La fila de membership se vuelve a comprobar y bloquear antes de escribir; una revocación elimina lecturas y mutaciones sin emitir un JWT nuevo. No se publica gestión de miembros ni transferencias de propiedad.

Conflicto de clave/versión: SQLSTATE `40001`; identidad/permisos/recurso no accesible: `42501`; validación: `22023`. La futura API deberá mapearlos al contrato HTTP aprobado (409, 401/403 o 404 sin revelar tenant ajeno, 422), además de validar Origin/CSRF y devolver DTOs. Conocer un UUID o proporcionar la versión correcta no concede permisos.

## 3. Revisiones y contrato del documento

`brands.revision` es el contador para If-Match futuro; avanza en cada guardado/aprobación. `brand_revisions.revision_number` numera snapshots, no acciones de aprobación. Son contadores distintos: aprobar no duplica contenido. Dos guardados concurrentes sobre la misma versión no se sobrescriben.

`current_revision_id` apunta al último snapshot guardado, draft o aprobado. Las versiones aprobadas anteriores permanecen en el historial; la futura consulta de A05 puede mostrar “Borrador nuevo · aprobado vN”. Los futuros jobs deberán elegir una revisión aprobada explícita, no asumir que el puntero actual está aprobado. Editar una aprobada **crea un draft nuevo**, no revoca ni reescribe la anterior. Incluso los drafts guardados se conservan como snapshots: no se actualiza su contenido in situ. Solo el draft actual puede aprobarse. `rejected` se reserva por compatibilidad con Architect; no se expone aún una operación para rechazar.

El JSONB de fase 1 es un snapshot completo, no un PATCH parcial dentro de SQL. La futura DAL deberá fusionar los campos editados con la versión base validada antes del RPC. Contrato `schema_version: 1`:

| Grupo | Campos permitidos y límites propios de implementación |
| --- | --- |
| `identity` | name ≤160, website_url HTTPS opcional ≤2048, description ≤8000, language ≤35 caracteres. |
| `voice` | tone ≤2000, audience ≤4000 caracteres. |
| `visual` | colors: hasta 12 strings `#RRGGBB`; font_family opcional ≤100 caracteres. Solo descripción textual de fuente, no descarga ni licencia/verificación de catálogo. |
| `competitors` | Hasta 20 objetos con name no vacío ≤160 y website_url HTTPS opcional ≤2048. |

Documento máximo 65.536 bytes; grupos/propiedades desconocidos, tipos incorrectos y versiones no soportadas se rechazan. Draft admite campos incompletos/nulos; aprobar exige strings no vacíos para nombre, descripción, idioma, tono y público. No se inventan valores para cumplirlos. Los límites son decisiones locales para acotar almacenamiento, no límites de Supabase ni cambios de UI. Una validación sintáctica de URL no certifica seguridad SSRF: **no hay fetcher en esta entrega**. Logos, archivos, importaciones y evidencias de terceros requieren una ampliación posterior validada, con las tablas/FKs correspondientes.

Historial y actores usan RESTRICT donde corresponde. Un borrado completo administrativo deberá limpiar primero `current_revision_id` y después recorrer marcas/revisiones/workspace; CASCADE no puede romper el puntero restrictivo ni borrar una identidad con datos retenidos. No se implementa purga/borrado de cuenta en esta fase. Mientras workspace esté deleting/deleted se bloquean sus datos de negocio; el DTO de recibo de cierre A02 sigue siendo trabajo de su futura implementación, sin relajar RLS ahora.

## 4. Pruebas ejecutadas realmente

| Comprobación | Resultado |
| --- | --- |
| Aplicar migración en PostgreSQL 17.6 local vacío | Correcto. |
| Suite SQL | **163 aserciones correctas**; incluyen inspección de grants, no 163 recorridos de UI. |
| Reproducibilidad | Segunda base vacía, misma migración y 163 aserciones correctas de nuevo. Una migración se aplica una vez por historial, no se reejecuta a ciegas sobre tablas existentes. |
| Concurrencia, dos conexiones reales | Bootstrap con misma clave devuelve un solo ID/owner; guardados sobre misma versión producen exactamente un éxito y un `40001`, sin revisión duplicada. |
| Dos usuarios distintos | Identidades sintéticas A/B; aislamiento de las cuatro tablas y escritura cruzada denegada, incluso con UUID/versiones correctos y metadata de owner falsificada. |
| Anónimo, sesión sin sub y correo sin confirmar | Acceso privado o ejecución privilegiada denegados. |
| Grants y RLS | Sin DML directo para anon/authenticated/service_role; se concedió DML temporalmente dentro del test para demostrar que RLS también bloquea inserts/updates/deletes fuera de RPC. Los grants de prueba se revierten. |
| Integridad | FKs cross-tenant/cross-brand, números duplicados, RESTRICT de identidad/revisión apuntada, consistencia del propietario, snapshots aprobados inmutables. |
| Atomicidad | Fallo local inyectado al insertar owner membership revierte workspace y membership. Marca inválida no deja filas parciales. |
| Roles y revocación | Miembro puede guardar draft si pertenece al workspace, pero no crear marca/aprobar. Revocar membership bloquea inmediatamente lectura y escritura. Marca archivada/tenant en borrado no admite escritura. |
| Regresiones de aplicación | **34 Playwright** correctos, desktop/móvil, incluyendo Axe en los estados cubiertos. Sin modificar frontend ni pruebas previas. |
| Calidad | `npm run typecheck`, `npm run lint` y `npm run build` correctos. |

El runner usa una imagen fijada por digest, sin red para el contenedor, sin puertos publicados, sin montar archivos del host y sin reenviar claves. Todo el almacenamiento de pruebas es tmpfs y el contenedor se elimina al acabar. Fixture con dos UUID sintéticos, sin correos, contraseñas, JWT reales ni usuarios remotos.

**Límite de evidencia:** se probaron RLS, roles y constraints reales de PostgreSQL; el fixture local reproduce únicamente `auth.users` mínimo y `auth.uid()` leyendo claims de sesión. No es GoTrue, no verifica firmas JWT, no es PostgREST ni demuestra grants particulares o versión de Postgres del proyecto remoto. Auth/JWT de la aplicación ya fue validado en la etapa anterior, pero no se sustituye aquí por un mock en la app. No se añadieron dependencias/fixtures al runtime de Linde.

No se ejecutaron en esta fase los dos casos de rechazo real de Supabase ni el recorrido `auth-live`: se evitó usar la cuenta/proyecto remoto para una revisión exclusivamente SQL. Tampoco se hicieron registro, correos o cambio de contraseña. No se afirma que toda la suite de 37 casos haya vuelto a ejecutarse.

## 5. Repetir las pruebas sin riesgo de despliegue

Requisitos: Node compatible con el repositorio, dependencias instaladas y Docker en funcionamiento. La primera ejecución descarga la imagen de prueba si falta; el contenedor de base de datos tiene red deshabilitada.

```bash
npm run test:db
npm run typecheck
npm run lint
npm run build
CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --project=desktop --project=mobile --grep-invert 'real Supabase sign-in refusal'
```

El comando SQL no acepta DATABASE_URL, claves o proyecto destino: solo crea un contenedor desechable con nombre aleatorio. Los scripts bajo `supabase/tests/` son exclusivamente para esa base aislada; **no ejecutar el fixture contra una instalación Supabase existente**. No instala pgTAP ni modifica el servicio remoto para poder probar.

No hay rollback destructivo automático ni comandos de push en npm. Ante una migración local fallida se destruye el contenedor, no datos reales. Para cambios posteriores se añadirá otra migración versionada, conservando el historial.

## 6. Pendiente antes de aplicar a linde-dev

Requiere aprobación explícita del propietario de esta migración/PR. Después, en una etapa autorizada, revisar historial/esquemas preexistentes y versión del proyecto, probar también con el stack Supabase completo local/staging (GoTrue/PostgREST, grants efectivos y JWT de dos usuarios), generar tipos tras el esquema definitivo y comprobar backup/restore. No se declara validada la ejecución remota ni un respaldo existente del plan.

La migración espera roles Supabase `anon`, `authenticated`, `service_role`, `auth.users(id,email_confirmed_at)` y `auth.uid()`. Debe ejecutarla el propietario de migraciones, no un usuario de aplicación. No sobrescribe tablas de negocio ya existentes: si existen estas tablas o el esquema `linde_private` con otro historial, detenerse y reconciliar antes de aplicar. La migración falla ante esas colisiones en lugar de adoptar objetos o un esquema de propietario desconocido. No se necesita ninguna configuración nueva para ejecutar las pruebas locales actuales.

## 7. Fuentes oficiales consultadas

Lectura pública 2026-10-26:

- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS, grants, identidad, índices, política por rol, metadata mutable y helpers sin recursión.
- https://supabase.com/docs/guides/database/functions — security invoker/definer, search_path vacío, nombres cualificados y revocación de EXECUTE público.
- https://supabase.com/docs/guides/local-development/overview — migraciones versionadas y reconstrucción local antes de despliegue.

No se usaron endpoints privados de terceros ni se modificó configuración del proyecto.
