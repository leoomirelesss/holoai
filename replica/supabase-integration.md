# Integración local de Brand Data Foundation con Supabase

2026-10-27 · rama `test/supabase-integration` · base `main` con PR #3 integrado (`63dad07`).

Validación exclusivamente local. No se enlaza ni se modifica `linde-dev`. El SQL aprobado se conserva sin cambios. No se modifican frontend, Auth de la aplicación, Recon, Architect o Design.

## Ejecución reproducible

Requisitos: Docker local operativo y CLI oficial **2.122.0**, instalada según la [guía oficial](https://supabase.com/docs/guides/local-development/cli/getting-started). Se verificó el digest SHA256 del artefacto Linux AMD64 contra los metadatos de su [release oficial](https://github.com/supabase/cli/releases/tag/v2.122.0). No se añadió la CLI al runtime ni dependencias npm nuevas.

```bash
SUPABASE_CLI=/ruta/a/supabase npm run test:supabase
```

Sin `SUPABASE_CLI`, busca `supabase` en PATH. Exige la versión fijada. No requiere variables de Supabase ni credenciales de prueba; genera dos cuentas sintéticas de Auth local únicamente cuando el stack esté saludable.

Archivos:

- `scripts/test-supabase-integration.mjs`: orquestación, salida sanitizada y resultado de la ejecución.
- `scripts/supabase-integration/stack.mjs`: ciclo de vida del proyecto CLI/Docker temporal.
- `scripts/supabase-integration/checks.mjs`: peticiones HTTP reales a Auth y PostgREST/RPC.
- `replica/supabase-integration-results.json`: evidencia sin cuentas, contraseñas, claves, JWT, respuestas HTTP ni cabeceras.

El runner crea un directorio privado temporal, SUPABASE_HOME separado, project_id aleatorio y una red propia con puertos publicados solo en loopback. Usa los puertos 55320–55329; deben estar libres. No toma configuración, tokens de gestión o enlaces remotos del proyecto del usuario. Una lista explícita de variables de entorno conserva únicamente requisitos de ejecución/red; no reenvía credenciales remotas.

Inicializa la configuración con la CLI, desactiva seeds y utiliza imágenes estándar. El perfil omite Studio, postgres-meta, Edge Runtime, Logflare y Vector para reducir consumo en este entorno. Mantiene PostgreSQL Supabase, Auth/GoTrue, PostgREST, Kong, Realtime, Storage y correo de desarrollo. Es un perfil local de integración con servicios reales, no un PostgreSQL con un fixture que sustituye Auth; tampoco pretende probar las herramientas auxiliares excluidas.

Primero exige que `supabase start` termine correctamente, sin `--ignore-health-check`. Solo después copia las migraciones versionadas y ejecuta **`supabase migration up --local`**. No acepta un URL/proyecto destino, no hace link/push/reset remoto y no copia `local-auth-fixture.sql` ni crea una función auth.uid de prueba.

En caso de fallo detiene la ejecución, escribe el estado fallido y limpia los recursos del project_id generado. No continúa con mocks, tokens inventados ni un servicio no saludable. En el cierre usa `supabase stop --no-backup --project-id` de esa instancia; nunca `--all`. Elimina sus archivos temporales y red propia. No se borran recursos de otros proyectos.

## Comprobaciones preparadas

Estas son las comprobaciones que ejecuta la suite **después** del arranque saludable y la migración local. Su presencia en el código no constituye evidencia de que se hayan completado: consultar el resultado de esta ejecución al final.

| Área | Comprobación |
| --- | --- |
| Auth real | Dos registros locales, login por contraseña contra GoTrue y verificación de usuario confirmado con su access JWT. Sin usuarios insertados manualmente en auth.users. |
| Bootstrap | Dos RPC concurrentes con misma clave/payload devuelven un único workspace y su owner membership. Payload diferente provoca conflicto. |
| Atomicidad | Un trigger local de prueba rechaza la membership del segundo usuario; el RPC debe revertir ambas filas. Se retira el trigger y se crea su workspace normalmente. |
| Marcas y DNA | Crear marca/draft inicial por RPC; rechazar aprobación incompleta; guardar DNA y aprobar con actor/fecha de servidor. |
| Historial | Editar una aprobada crea draft nuevo; snapshot aprobado permanece exactamente igual; números/punteros/versiones coherentes. |
| RLS entre usuarios | Lectura propia y ausencia de filas ajenas en las cuatro tablas, en ambas direcciones; RPC de creación/guardado/aprobación cruzado rechazado. |
| Anónimo | Tablas privadas y las cuatro RPC denegadas con rol anon; petición sin API key rechazada. |
| Escalamiento | Cambiar user_metadata a owner de un workspace ajeno, renovar sesión real y verificar que no concede pertenencia. Inserts/updates/deletes directos y helpers/esquemas privados inaccesibles. JWT con firma alterada rechazado. |
| Roles y revocación | Fixture administrativo local de membership explícita: miembro guarda draft, pero no crea/aprueba; propietario aprueba. Revocar membership bloquea lectura/escritura con el mismo JWT. |
| Concurrencia | Dos guardados HTTP sobre misma versión producen un solo éxito y un conflicto SQLSTATE 40001, sin duplicados/pérdida de revisión; historial aprobado intacto. |
| Catálogo | RLS y grants reales de las cuatro tablas comprobados en PostgreSQL Supabase. |

Los únicos SQL administrativos de prueba son inspección del catálogo/conteos, inyección de fallo local para comprobar rollback y alta/revocación de una membership de prueba. Los usuarios y sus sesiones se obtienen exclusivamente de Auth; las operaciones de negocio usan JWT reales mediante PostgREST, sin service_role. No se crea ninguna API/pantalla de producto ni se prueba el frontend contra ese proyecto local.

El documento de DNA es sintético y las direcciones de cuenta usan el dominio reservado `.invalid`. No se usan usuarios reales, no se cambian contraseñas ni se envían correos de recuperación. Los JWT/contraseñas se mantienen en memoria; las salidas de la CLI se capturan y no se imprimen. No se generan trazas, capturas, HAR, storageState o logs de peticiones con credenciales. El cliente HTTP solo acepta `http://127.0.0.1:55321`, no sigue redirecciones y no usa el proxy global para las peticiones locales.

## Pruebas de aplicación

```bash
npm run typecheck
npm run lint
npm run build
CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --project=desktop --project=mobile --grep-invert 'real Supabase sign-in refusal' --workers=1 --timeout=90000
```

TypeScript, ESLint y build de producción correctos. Ejecución final de Playwright: **34/34 correctos**, incluyendo Axe en los estados cubiertos. Las ejecuciones previas con dos workers tuvieron timeouts de 30 s durante esta sesión de descargas/arranque; se repitió con un worker y timeout de 90 s, sin modificar la aplicación ni las pruebas aprobadas. No se afirma una mejora de rendimiento.

Se excluyen los dos rechazos reales contra Supabase remoto y `auth-live`, que usaría la cuenta real del entorno. No se ha vuelto a ejecutar la integración de Auth remoto ya aprobada. El test SQL con fixture mínimo del PR #3 no se usa como sustituto de esta integración.

## Fuentes oficiales consultadas

- https://supabase.com/docs/guides/local-development/cli/getting-started — CLI y Docker para desarrollo local.
- https://supabase.com/docs/guides/local-development/overview — migraciones locales versionadas.
- https://supabase.com/docs/guides/local-development/docker-and-native-runtimes — runtimes y artefactos oficiales; no se emplea un runtime simulado.
- https://supabase.com/docs/guides/api/securing-your-api — grants, JWT y RLS de Data API.
- https://supabase.com/docs/reference/javascript/auth-signinwithpassword — sesión de correo/contraseña mediante Auth.
- Ayuda de CLI 2.122.0: start, migration up --local, status y stop --no-backup --project-id.

## Resultado de esta ejecución: BLOQUEADO

**No se completó la validación de integración.** Docker 28.4.0 y CLI 2.122.0 están disponibles, pero el stack estándar no pudo terminar de arrancar. El motor Docker de este entorno usa `vfs` sobre un disco de 32 GB. La extracción de la imagen oficial `public.ecr.aws/supabase/postgres:17.11.0.006` falló reiteradamente por falta de espacio (`no space left on device`, categoría sanitizada `disk-space`); se observó el disco al 100 %.

Se intentó primero el arranque estándar, se retiraron servicios auxiliares para reducir consumo y se comprobó también la variante compacta oficial. Esa variante no superó los controles de salud y tampoco se utilizó para ejecutar pruebas. El último intento, con imágenes estándar y servicios auxiliares excluidos, volvió a fallar por espacio. No se cambió el almacenamiento global de Docker, no se ignoraron los controles de salud y no se sustituyeron servicios por simulaciones.

| Validación requerida | Resultado real |
| --- | --- |
| Leer documentación y migración; verificar CLI/Docker | Completado. |
| Stack local operativo completo | Bloqueado por extracción/espacio; no se declara saludable. |
| Aplicar la migración aprobada en ese stack | **No ejecutado**: el runner lo impide hasta completar start correctamente. |
| Dos usuarios locales y sesiones JWT reales | **No ejecutado**: no se crearon cuentas ni se obtuvieron tokens. |
| Bootstrap, creación de marca, guardado y aprobación/historial por RPC | Pendiente, 0 comprobaciones de integración completadas. |
| RLS, anónimos, escalamiento, revocación y concurrencia vía PostgREST | Pendiente; no se reutilizan resultados del fixture SQL anterior como prueba de estos casos. |
| TypeScript, ESLint, build | Correctos. |
| Regresiones de navegador | 34/34 correctas con el comando de un worker indicado arriba. |
| Recursos locales y proyecto remoto | Instancias/redes/volúmenes temporales eliminados; `linde-dev` intacto. |

El [resultado JSON](supabase-integration-results.json) conserva `status: failed`, etapa `local-stack-start`, categoría `disk-space`, lista vacía de checks y limpieza del proyecto confirmada. El checksum identifica el SQL preparado; **no afirma que se aplicó**. La caché de imágenes introducida por estos intentos se limpió de forma selectiva para recuperar espacio (24 GB libres observados después); no se usó un prune global ni se borraron imágenes anteriores de otras tareas. La limpieza del runner se refiere a su proyecto/volúmenes/red/archivos, no a la caché compartida de imágenes de Docker.

**Siguiente paso pendiente:** repetir `npm run test:supabase` en un Docker local con capacidad suficiente para extraer y ejecutar las imágenes oficiales, preferiblemente sin la amplificación de almacenamiento observada con vfs. No basta con que Docker responda a version/info. En ese entorno el comando debe completar start, aplicar la migración local y ejecutar realmente todos los checks antes de considerar aprobada la integración. No se ha demostrado un fallo del SQL aprobado; por tanto no se modificó ninguna migración ni código de aplicación.

Publicar/mergear estas pruebas no autoriza aplicar nada a Supabase remoto. Esperar aprobación y mantener pendiente la validación real; no avanzar a pantallas ni otras funcionalidades.
