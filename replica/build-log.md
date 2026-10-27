# Build — frontend foundation y D02

Fecha:2026-10-26. Rama:`feat/ui-foundation`. Alcance aprobado: Next.js App Router + TypeScript estricto + Tailwind, tokens, primitivas, shell/navegación responsive y D02 URL/manual. No autorización para D01,D03,D04 u otras pantallas/backend. Las fases aprobadas se han leído; no se modifican arquitectura ni especificaciones de Design.

## Resultado dentro del alcance

| Área | Estado | Evidencia / límite |
| --- | --- | --- |
| Toolchain | Implementado | Next16.4.3, React19.3.1, Tailwind4.3.3, TypeScript5.9.3; versiones fijadas y package-lock; Node24.19.0 en validación |
| Tokens | Implementado | Generador a partir de replica/design/tokens.json, variables rem y theme Tailwind; build rechaza desincronización. Fuente aprobada intacta |
| Tipografía/iconos | Implementado | Inter variable Latin, carga local sin Google/CDN; licencia OFL conservada; iconos geométricos propios |
| Primitivas usadas | Implementado | Button primary/secondary/ghost; input/textarea con label/hint/error/ref; Card/Badge/Notice/Icon; sin librería UI ni dependencias no utilizadas |
| Shell y navegación | Implementado | Header/footer, skip link, navegación modal con foco contenido/restaurado, Escape y bloqueo de scroll; variante workspace con sidebar responsive para reutilización, sin ruta nueva ni pantallas ficticias |
| D02 URL | Implementado en alcance UI; funcionalidad Recon parcial | Formulario, HTTPS y formato, foco de error; guardar/reabrir/eliminar/descargar borrador local. Nunca fetch a URL ni supuesto análisis |
| D02 manual | Implementado en alcance UI | Cambia dentro de D02 a nombre/descripción inicial, validación y mismas acciones locales; no constituye pantalla D04 ni genera perfil |
| Disponibilidad | Explícita | Análisis y secciones futuras solo texto de indisponibilidad; no botones que simulen generar o navegar a contenido inventado |

Solo una de las73 filas de features.csv pasa de no a **partial** (entrada web/manual). No se marca importación real ni ningún must completo del circuito SaaS. Borradores locales no sustituyen el futuro backend/Auth. La etapa UI solicitada está realizada; el producto completo sigue pendiente.

## Adaptaciones acotadas y justificadas

- D02 del diseño incluía “Analizar sitio” y avanzar a D03. La restricción actual excluye análisis/backend: el CTA operativo es “Guardar dirección”, acompañado de explicación y sin cobro. No hay carga o éxito de análisis ficticios.
- “Comenzar manualmente” muestra dos campos iniciales dentro de D02, no Brand DNA editable ni su aprobación. La persistencia temporal explícita en esta pestaña permite una acción útil y comprobable; no se rotula como guardado en nube. JSON descargable es copia de datos aportados por el usuario, no anuncio exportado.
- Se conserva el onboarding fuera de sidebar según README de Design. El shell incluye la variante de sidebar como base reutilizable, pero D02 usa header y menú responsive; no se crea `/workspace` ni stubs del resto de pantallas.
- No se copian tokens al azar: CSS de aplicación se genera sin cambiar tokens JSON aprobados; colores/espaciados/tipos por roles. El favicon tipográfico y los iconos son originales. No se usa un paquete entero de iconos para ocho dibujos sencillos.

## Validación

Comandos ejecutados en checkout con Node24.19.0:

- `npm ci --no-audit --no-fund`: instalación reproducible desde lockfile, sin ignorar conflictos de peers. ESLint9.39.5 se fija por compatibilidad declarada de plugins de Next; no se fuerza ESLint10 con peers incompatibles.
- `npm run tokens:check`: coincide exactamente con la fuente aprobada.
- `npm run lint`: ESLint, cero errores y cero advertencias.
- `npm run typecheck`: TypeScript sin emisión, strict y noUncheckedIndexedAccess, sin errores.
- `npm run build`: compilación de producción Next; página raíz prerenderizada y fuentes locales; no endpoints de negocio.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`:14 pruebas (7 recorridos ×2 viewports) sobre servidor de producción.

Cobertura E2E:1440×1000 y390×844, validación URL, guardado de sesión y refresh, recuperación/descarga JSON, manual con nombre largo, borrado local, error de almacenamiento, teclado completo, skip link, foco modal/retorno Escape, reduced-motion y reflujo320px/200% texto. Axe en estado inicial/manual guardado/menú; ausencia de errores JS/consola en inicio y ausencia de solicitudes externas al guardar URL. El servidor real arranca para las pruebas; no se usan mocks de análisis o IA.

## Capturas y revisión visual

Capturas reales de Chromium a ancho1440/390, de página completa (altura puede superar viewport):

- [D02 escritorio](clone-screens/D02-desktop.png).
- [D02 móvil](clone-screens/D02-mobile.png).
- [D02 manual escritorio](clone-screens/D02-manual-desktop.png).
- [D02 manual móvil](clone-screens/D02-manual-mobile.png).

Revisión: espaciados, tipografía Inter efectiva, orden, estados y adaptación sin overflow horizontal. Se detectó y corrigió ciclo de Tab del diálogo; la etiqueta visual de navegación desktop se ajustó tras inspección. La revisión de captura completa detectó el skip link fuera de foco asomando al capturar una página desplazada; se recorta fuera de foco y permanece visible al enfocarlo. Capturas finales se regeneran tras las correcciones; estos archivos son UI implementada, no láminas de Design.

## Límites y continuidad

Sin autenticación, Supabase, Trigger.dev, LLM, importador, red a web del usuario, generación, pagos ni pantallas adicionales. No se declara WCAG2.2 AA global solo por axe/contraste; falta evaluación manual con tecnologías asistivas/dispositivos adicionales en etapas posteriores. Las pruebas320px/200% texto no equivalen por sí solas a toda la auditoría400% de zoom. El navegador puede bloquear sessionStorage; error conserva inputs. Reabrir una pestaña nueva no promete sincronización.

PR hacia main para revisión; no merge automático. Esperar aprobación antes de continuar. Guía operativa en README raíz; no se configuraron servicios o secretos.


## Etapa D01 — Supabase Auth (2026-10-26)

Rama `feat/supabase-auth`, desde main con la base UI aprobada e integrada. Implementada la integración real de email/password, registro y links de confirmación/recovery, login/logout y protección servidor de `/app` (D02 reutilizado); raíz D02 local pública conservada. Detalle, límites y evidencia en [backend.md](backend.md); ajustes que revisar en [auth-setup.md](auth-setup.md).

D01: implementación disponible, **validación positiva incompleta**.36 pruebas de navegador pasan, además de TypeScript/ESLint/build, settings reales y rechazo real de credenciales inválidas. No se creó una cuenta para fingir happy path: el usuario decidió continuar sin credenciales. El formulario privado de nueva contraseña existe pero no tiene captura autenticada; no se fabricó una sesión para obtenerla. Las diez capturas nuevas documentan acceso, registro, solicitud de recuperación y reenvío de confirmación a1440/390px.

No se cambiaron fuentes de tokens, Design o Architect; se añadieron estilos D01 con sus roles existentes. La fila combinada de login en features.csv queda partial porque no incorpora Google/OTP ni tiene prueba positiva. Ninguna otra pantalla o backend se implementa. Main no se fusiona automáticamente.


## D01 — validación con cuenta existente (2026-10-26)

Superada la validación positiva de login UI, getUser remoto, `/app`, recarga, logout y denegación posterior, conservando exactamente el borrador local D02. Corregido únicamente el origen de redirección en proxy para evitar cambiar entre 127.0.0.1 y localhost; origen validado por allowlist y Host ajeno probado. 37 Playwright correctos, TypeScript, ESLint y build correctos. Sin cuentas nuevas, cambio de contraseña, correos, capturas/trazas de cuenta o servicios configurados. Evidencia y límites en backend.md y auth-live-validation.json. No se modifican Recon, Architect ni Design; la matriz histórica permanece intacta. PR #2 abierto, sin merge; esperar aprobación.

## Base de datos — fase 1 (2026-10-26)

`feat/brand-data-foundation` desde main actualizado con Auth integrado. Cuatro tablas y RPCs SQL de tenancy/perfil/revisiones preparados, sin frontend ni migraciones remotas. RLS, roles, FKs compuestas, bootstrap atómico y concurrencia probados en PostgreSQL local: 163 aserciones, repetidas tras reconstrucción desde cero. 34 regresiones de navegador, TypeScript, lint y build correctos. [Detalle y límites de evidencia](brand-data-foundation.md). No equivale a implementar D04 ni conectar D02 a la base; Architect/Design/Recon intactos. PR para revisión, sin merge; esperar aprobación antes de aplicar a Supabase.


## API V1 de marcas — 2026-10-27

Seis endpoints y DAL autenticada mediante SSR/getUser, sesión/RLS y RPCs aprobadas. Bootstrap idempotente, selección de workspace desde membership, creación de marca, lectura/historial, guardado parcial con If-Match y aprobación owner-only. CSRF/Origin, JSON acotado, validación, errores seguros y SQLSTATE40001→HTTP409. No se conectan D02/D03/D04 ni se modifican migraciones o políticas.

Validación real en Actions: 93 comprobaciones API con dos usuarios locales, 82 regresiones RPC y 31 contratos correctos; TypeScript, ESLint y build de producción correctos. Regresión desktop/móvil local correcta, sin auth-live ni llamadas de pruebas a Auth remoto. [Evidencia y alcance](brand-api.md). Sin datos de prueba ni cambios en linde-dev. Ajuste mínimo de transporte Auth: HTTP solo loopback para el stack local; HTTPS remoto permanece requerido.

[Versiones de migración](migration-history.md): GitHub20261026000100 y remoto20261027163720 confirmado por el propietario; reconciliación pendiente, sin repair/push/reset. Desviaciones acotadas de Architect: validación TypeScript sin nueva dependencia y ausencia del futuro recibo de borrado porque RLS oculta workspaces inactivos. Rama feat/brand-api-foundation, PR #5 sin fusionar. Esperar aprobación antes de avanzar a interfaz.


## D02 — alta manual persistente (2026-10-27)

Rama feat/d02-persistent-onboarding, base main bd28142 con PR #5 integrado. D02 privado consume los seis contratos existentes necesarios para alta (sin aprobación); GET current, bootstrap solo si falta workspace, creación de marca, GET revisión/ETag, PATCH descripción y lectura de confirmación. D02 público/URL permanece local. No se implementan D03/D04, extracción, IA o productos.

Borradores públicos conservados; borradores privados y avance separados por cuenta. Revalidación servidor antes de enviar, bloqueo entre pestañas y registro previo de cada efecto. Resultado incierto de creación queda bloqueado: la API no permite reconciliar por intento ni deduplicar POST brands. Sin nuevas dependencias, tokens o cambios de API/SQL/RLS/Auth. [Flujo, reintentos y límites](d02-persistence.md), [estados visuales](design/d02-persistence.md).

Validación local: TypeScript, ESLint, build, 10 contratos del controlador, 31 contratos API y 34 regresiones desktop/móvil correctos. 58 pares de contraste sin fallos AA. Un fallo inicial de infraestructura Playwright por directorio compartido se resolvió separando la salida de contratos y repitiendo la suite. La integración real de alta y sus capturas se valida separadamente en Actions con Supabase local aislado; no equivale a una prueba contra linde-dev.
