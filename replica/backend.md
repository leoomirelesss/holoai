# Backend — Supabase Auth únicamente

2026-10-26 · rama`feat/supabase-auth` · sobre main integrado con PR#1. User scope: D01, Auth real y protección de sesión; no esquema, Brand DNA, IA, Trigger, billing o demás backend.

## Implementación

- `@supabase/ssr`0.12.7 + `@supabase/supabase-js`2.118.0, clientes nuevos por request solo en servidor; sin cliente Auth de navegador.
- `src/proxy.ts` de Next16 refresca/verifica claims en vistas Auth/privadas y transmite cookies/cabeceras no-cache. Las mutaciones Auth, callback, confirmación y logout controlan sus propias cookies para evitar que un refresh anterior sobrescriba una sesión nueva/cerrada.
- `/app` es D02 existente protegido; `requireUser` usa getUser remoto y email confirmado además de proxy. La raíz sigue siendo borrador local público, no un recurso privado o tenant de Supabase.
- Server Actions: signUp, signInWithPassword, resend signup, resetPasswordForEmail y updateUser. Rutas de intercambio PKCE/verifyOtp, y POST logout global; no endpoint de contraseña casero ni simulación de sesión.
- Destinos cerrados a /app; origen canónico desde configuración confiable; proxy usa URL absoluta de origen permitido porque Next16 la exige. Enlace fallido solo refleja un aviso local fijo, sin token/hash/código en redirect.
- Cookies HttpOnly/Lax y Secure en HTTPS; SameSite no sustituye Origin/CSRF. Validación de entradas y límites en servidor. Paste/autofill/gestores y mostrar contraseña permitidos.
- Registro/recovery/resend no afirman que el buzón recibió correo ni revelan si una cuenta existe. Errores de proveedor se normalizan; demasiados intentos se informan sin countdown ficticio.
- Cambiar contraseña revoca sesiones globalmente cuando Supabase lo confirma; errores de cierre tras actualización distinguen que la contraseña ya cambió. Logout fallido no se presenta como éxito. Access tokens existentes pueden vivir hasta su expiración según Supabase.
- D02 y la clave/formato de sessionStorage permanecen intactos. No se borran borradores al entrar/salir. Son locales, no están asociados a una cuenta/workspace y no se sincronizan entre orígenes/pestañas.

## Validación y evidencia

- Variables presentes y proyecto correcto, sin imprimir claves. GET settings real200: email/registro habilitados, confirmación exigida. Prueba negativa real400 invalid_credentials, sin sesión ni email enviado.
- Producción, TypeScript y lint ejecutados.36 pruebas Playwright:22 D01/Auth y14 regresiones D02. Axe en cuatro páginas D01, rechazo de acceso real y estados cubiertos de D02/menú, sin infracciones detectadas. No certifica WCAG completa.
- Validaciones de email/contraseña, privacidad de rutas sin sesión/cookie falsa, recuperación no autorizada bloqueada, callback seguro, Origin logout/GET405, continuidad de borrador, teclado, responsive1440/390 y reflujo320px/200% texto.
- Capturas reales de D01 login/register/recover/verify en escritorio1440 y móvil390, diez archivos en `clone-screens/auth/`; review visual de espaciados, tipografía, enlaces, targets y ausencia de overflow. Se conservaron capturas de regresión D02 con nuevo enlace Entrar.
- `npm audit`:0 vulnerabilidades reportadas en el lockfile durante esta revisión. Esto no prueba ausencia de vulnerabilidades lógicas.
- Comprobación de build público: valores de las dos variables Supabase no aparecen en `.next/static`; no se copiaron sus valores a archivos.

## Problemas encontrados y corrección

1. Node no seguía el proxy de red del entorno: ECONNREFUSED directo,200 al habilitar soporte nativo. `scripts/next.mjs` arranca Next con NODE_USE_ENV_PROXY=1, respetando override y proxy/CA existentes; sin desactivar TLS. Requisito de Node ajustado a22.21+ de rama22 o24+, versiones con soporte documentado.
2. Location relativo en proxy causaba500: URL absoluta canónica o loopback permitido, nunca origen arbitrario de Host. Los handlers pueden devolver Location relativo seguro.
3. Enlace dentro de texto se distinguía solo por color: subrayado visible; axe vuelve a pasar.
4. Revisión de cookies: handlers y acciones Auth son dueños de sus writes; no se refresca una sesión anterior en proxy antes de reemplazarla/cerrarla.

## Checklist: distinguir código, prueba y configuración

- [x] Código de autenticación real, no mocks; endpoints oficiales con claves propias existentes.
- [x] Autorización servidor con getClaims/getUser, sin getSession como prueba de identidad.
- [x] Comprobaciones negativas y denegación de acceso en navegador.
- [x] Entradas/destinos/origen validados y caché privada; no secretos elevados en cliente.
- [x] UI responsive/accesible con errores y teclado; pruebas automáticas limitadas al alcance.
- [x] Borradores de D02 conservados; cero cambios al esquema de negocio.
- [x] Dependencias auditadas y lockfile actualizado.
- [ ] Registro y confirmación por correo completos: pendientes; no se ejecutan en esta validación. El estado del login con cuenta existente figura en la sección de validación posterior.
- [ ] Recibir correo/reset completo/refresco real/revocación en segundo dispositivo: pendiente, sin simularlos.
- [ ] Site URL/Redirect URLs/plantillas/SMTP/límites de Auth comprobados en dashboard: requieren revisión del propietario; no accesibles con publishable key.
- [ ] RLS, tablas, roles de workspace, account deletion empresarial, pagos, uploads y jobs: fuera del alcance, no implementados ni afirmados.

[Guía exacta de configuración y pruebas pendientes](auth-setup.md). El proyecto Auth no se reconfiguró. No se creó proveedor adicional. No se inicia ninguna otra fase por abrir el PR.


## Capturas D01 reales

| Estado | Escritorio1440 | Móvil390 |
| --- | --- | --- |
| Acceso | [Ver](clone-screens/auth/D01-login-desktop.png) | [Ver](clone-screens/auth/D01-login-mobile.png) |
| Registro | [Ver](clone-screens/auth/D01-register-desktop.png) | [Ver](clone-screens/auth/D01-register-mobile.png) |
| Recuperación | [Ver](clone-screens/auth/D01-recover-desktop.png) | [Ver](clone-screens/auth/D01-recover-mobile.png) |
| Reenvío de confirmación | [Ver](clone-screens/auth/D01-verify-desktop.png) | [Ver](clone-screens/auth/D01-verify-mobile.png) |
| Rechazo real de login | [Ver](clone-screens/auth/D01-login-error-desktop.png) | [Ver](clone-screens/auth/D01-login-error-mobile.png) |

Las capturas del rechazo usan una dirección del dominio reservado `.invalid`, no una cuenta de usuario ni un acceso simulado correcto. No se capturó update-password detrás de una sesión inventada.


## Validación real posterior — 2026-10-26

Con las credenciales seguras existentes: login mediante la UI real, usuario confirmado verificado remotamente con `getUser()`, cookies Auth HttpOnly, acceso a `/app`, recarga con el mismo usuario, cierre mediante el botón real, ausencia de sesión y denegación posterior. El borrador D02 se comparó exactamente antes/después de recarga y logout en el mismo origen/pestaña: intacto. También se verificó la denegación inicial sin sesión.

Se detectó y corrigió una redirección del proxy que normalizaba `127.0.0.1` a `localhost`. Se conserva Host únicamente si coincide exactamente con el origen canónico o su variante loopback permitida. Hay regresión para conservación de origen y rechazo de Host ajeno. Sin cambios de aplicación fuera de autenticación.

Resultado final: `npm run typecheck`, `npm run lint`, `npm run build` y 37 pruebas Playwright correctos (36 regresiones desktop/móvil y un recorrido autenticado de escritorio). Axe sin infracciones en los estados comprobados. Evidencia sin datos de cuenta: [auth-live-validation.json](auth-live-validation.json).

El recorrido real se ejecuta en proceso aislado, sin trazas, capturas, vídeos ni estado de sesión en disco. Sus excepciones se descartan antes de llegar al reporter; solo se guardan etapas permitidas y booleanos. Variables verificadas sin imprimir valores. No se crearon cuentas, modificaron contraseñas ni enviaron solicitudes de recuperación. Una comprobación directa adicional confirmó credenciales aceptadas y usuario confirmado y cerró su propia sesión; no sustituye al recorrido UI final.

Pendientes: registro/confirmación y recuperación por correo completos (no ejecutados por instrucción), refresco tras expiración y revocación en otro dispositivo. Una recarga correcta no demuestra esos dos últimos casos. Site URL, Redirect URLs, plantillas, SMTP y límites efectivos siguen requiriendo revisión del propietario según esta guía; no se modificaron servicios.

Repetición: tras compilar, ejecutar `CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` con las variables seguras disponibles. Sin credenciales, el caso `auth-live` se omite explícitamente; nunca se considera validado. No utilizar capturas o trazas para esa cuenta.

## Fase 1 de datos — marcas/Brand DNA (2026-10-26)

Preparadas, **sin aplicar a linde-dev**, cuatro tablas: workspaces, memberships, brands y brand_revisions. RLS de lectura por pertenencia activa; escrituras exclusivamente mediante RPCs con identidad verificada y permisos transaccionales. Bootstrap atómico/idempotente; revisiones nuevas para cada guardado, aprobación owner-only y bloqueo optimista. No cambios de frontend, Auth o esquema remoto.

Validación: 163 aserciones SQL locales repetidas en otra base vacía; dos conexiones concurrentes verifican deduplicación de bootstrap y rechazo de versión obsoleta. Dos usuarios sintéticos aislados, anónimos sin acceso, FKs compuestas y permisos comprobados. PostgreSQL local real con fixture mínimo de Auth, no stack Supabase completo ni evidencia de aplicación remota. 34 regresiones Playwright, TypeScript, ESLint y build correctos; casos remotos de Auth no repetidos en esta fase. [Decisiones, comandos, resultados y límites](brand-data-foundation.md).

Pendientes de aprobación: aplicar migraciones y validar con stack/roles/JWT reales del destino en una etapa autorizada. No se avanzan módulos de producto, IA, jobs ni UI de Brand DNA.
