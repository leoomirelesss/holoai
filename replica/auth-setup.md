# Supabase Auth — configuración de Linde y comprobación pendiente

Fecha:2026-10-26. Proyecto indicado por el usuario:`linde-dev`, ID`wjjtqmtsysufqdxwknqx`. Integración real con `@supabase/ssr`0.12.7 y `@supabase/supabase-js`2.118.0. No hay migraciones ni cambios de esquema de negocio, IA, Trigger.dev, OAuth u otros servicios configurados.

## 1. Qué está comprobado y qué no

Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` están presentes; sus valores no se imprimieron ni se copiaron a documentación/Git. La URL coincide con el proyecto solicitado. Consulta real `GET /auth/v1/settings`:200, email habilitado, registro habilitado y `mailer_autoconfirm=false` (confirmación requerida). Login de un identificador del dominio reservado `.invalid` con contraseña aleatoria desechable:400 `invalid_credentials`, sin sesión. No crea cuentas ni envía correo.

**No se han comprobado desde el dashboard** Site URL, Redirect URLs, plantillas, SMTP, límites/captcha o entrega al buzón: la clave publishable no es una credencial de gestión. No se han modificado estos ajustes. El usuario prefirió continuar sin credenciales de prueba; no se creó ninguna cuenta de prueba, no se solicitaron correos para una dirección inventada ni se fabricó una sesión.

El código implementa registro, verificación, acceso, cierre y recuperación reales. La entrada correcta con cuenta confirmada, refresco de una sesión real, recepción/reuso/caducidad real de correos, cambio de contraseña completo y revocación global siguen **sin prueba end-to-end**. No se considera que un formulario renderizado o un rechazo de credenciales demuestren esos casos.

## 2. Variables de aplicación

`.env.example` enumera nombres vacíos. Nunca añadir una clave `service_role`, secret key, contraseña, sesión o código de correo a Git. La aplicación solo necesita la URL pública y publishable key existentes. No necesita claves de gestión para Auth.

`SITE_URL` es una variable **no secreta del servidor** con el origen canónico de la aplicación, no la URL de Supabase. Si falta, usa `https://{VERCEL_URL}` cuando el despliegue la proporciona; en desarrollo local,`http://localhost:3000`. Se rechazan protocolos inseguros fuera de loopback, credenciales, paths, query y fragmentos. No se construyen URLs de correo usando Host/X-Forwarded-Host enviados por el navegador.

Para este desarrollo local puede usarse:

```text
SITE_URL=http://localhost:3000
```

Usar ese mismo origen al abrir la app, confirmar y recuperar. `localhost` y `127.0.0.1` son **orígenes diferentes** para cookies y sessionStorage: alternarlos no borra datos, pero puede impedir ver el borrador o el verificador PKCE de la otra dirección. Playwright usa127.0.0.1 para pruebas sin correo; no demuestra el ciclo de email en localhost.

Antes de un despliegue real, configurar `SITE_URL` con su origen HTTPS real. No hay dominio de producción aprobado aquí; no se inventa uno. Variables `NEXT_PUBLIC_*` pueden fijarse durante build en Next, por lo que cambios de proyecto requieren recompilar/reiniciar según despliegue.

## 3. Ajustes exactos que debes revisar en Supabase

Abrir el proyecto `linde-dev` → **Authentication**.

### Sign In / Providers → Email

- Email habilitado; permitir registro si esa es la política de la beta.
- **Confirm email activado**. La consulta pública actual indica que se exige confirmación; revisar que siga así antes de probar.
- Revisar requisitos de contraseña. Linde valida al menos8 caracteres y máximo128; si el proyecto exige más, Supabase es la autoridad y puede rechazarla. No se ha reducido su política.

### URL Configuration

Para probar abriendo `http://localhost:3000`:

- **Site URL:**`http://localhost:3000`.
- **Redirect URLs:** agregar las dos URLs exactas que genera el código:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?flow=recovery
```

Si deliberadamente se va a probar por127.0.0.1, establecer SITE_URL de la app y Site URL de Supabase a ese mismo origen y añadir:

```text
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3000/auth/callback?flow=recovery
```

En un despliegue, sustituir el origen por el HTTPS real manteniendo los dos paths/query indicados. Usar rutas exactas en producción; no allowlists de dominios arbitrarios ni `**` como solución general. Volver a guardar/reiniciar cuando corresponda. No es la URL`https://wjjtqmtsysufqdxwknqx.supabase.co` la que debe ponerse como Site URL de la app.

### Email Templates: opciones compatibles

**Opción recomendada para SSR y enlaces abiertos en otro navegador:** en la plantilla **Confirm signup**, utilizar un enlace directo al handler que valida TokenHash en servidor:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email">Confirmar mi correo</a>
```

En **Reset password**:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery">Elegir una contraseña nueva</a>
```

Es una instrucción para el dashboard, no un cambio ya aplicado. Site URL debe ser el origen correcto de Linde. El token es credencial temporal: no compartir enlaces completos, capturas con token o contraseñas por chat/issues. Linde excluye callback/confirm del log de requests de desarrollo; al desplegar, excluir también sus query strings de access logs/monitorización del hosting o reverse proxy. El endpoint valida solo email/signup/recovery y nunca acepta un redirect externo.

**Alternativa PKCE:** plantillas que conservan `{{ .ConfirmationURL }}` pueden llevar al `/auth/callback` configurado por signup/resend o al `/auth/callback?flow=recovery` solicitado por recuperación. El callback solo acepta código intercambiable y verifica después al usuario. Para PKCE se necesita el navegador/origen que guardó la cookie de verificación; otro dispositivo, una cookie bloqueada o código expirado/reutilizado da error seguro y permite solicitar correo nuevo. No se implementa flujo implicit de tokens en fragmento de URL ni se confía en esos tokens en cliente.

Enlaces previsualizados por escáneres o reescritos por tracking pueden consumir/alterar tokens; si se observa, revisar las recomendaciones oficiales de plantillas y entrega. No se afirma que esto ocurra en el proyecto actual ni se cambia SMTP/tracking aquí.

### Entrega y protección contra abuso

Revisar Email/SMTP, límites de Auth y captcha en el dashboard antes de exponer registro públicamente. El proveedor integrado puede restringir destinatarios/volumen; una respuesta de solicitud aceptada **no prueba entrega al buzón**. No se configuró SMTP ni se contrató un proveedor adicional. Si el correo propio de prueba no está permitido por el modo actual, Supabase devolverá un error o habrá que ajustar la entrega autorizada desde el proyecto; no se elude con cuentas inventadas.

Los límites reales de Supabase Auth protegen intentos y solicitudes de email; Linde deshabilita submit mientras está pendiente y maneja rate-limit, pero no pretende que un botón sea un limitador distribuido. Verificar política efectiva antes de producción. No hay countdown de reenvío inventado ni garantía de entrega en segundos.

## 4. Rutas y frontera de acceso

| Ruta | Acceso / función |
| --- | --- |
| `/` | D02 público de borrador local, conservado. No devuelve datos de cuenta o de DB |
| `/app` y prefijo `/app/` | Privado: proxy verifica claims; página vuelve a verificar con getUser y exige email confirmado |
| `/auth/login`, `/auth/register` | D01; usuario ya confirmado con sesión válida vuelve a /app |
| `/auth/recover`, `/auth/verify` | Solicitud de recuperación o reenvío real; respuesta no enumera cuentas |
| `/auth/callback` | Intercambio PKCE + verificación de usuario; no códigos/errores del proveedor reflejados en URL final |
| `/auth/confirm` | verifyOtp TokenHash + getUser; manejo de enlace no válido y destinos internos |
| `/auth/update-password` | Usuario verificado y continuidad de recuperación; actualización real, nunca solo por parámetro de URL |
| `POST /auth/logout` | Origin permitido + signOut global. GET no cierra sesión. No borra sessionStorage |

La cookie temporal `linde-recovery-user` dura15min y mantiene continuidad de UX. **No es una prueba criptográfica de identidad ni autoriza por sí sola:** la acción de actualización exige getUser contra Supabase, email confirmado y coincidencia de identidad. Las APIs públicas de Supabase siguen siendo la autoridad de la actualización. No se ofrece aquí una pantalla genérica de configuración de contraseña.

Cookies Auth son HttpOnly, SameSite=Lax y Secure en el origen HTTPS configurado; sin Secure en loopback HTTP. Toda autenticación se ejecuta en servidor, así que no existe createBrowserClient que necesite leerlas. Si se añade cliente Auth en el futuro, esta decisión debe revisarse explícitamente. Ningún uso de getSession autoriza rutas/acciones. Claves elevadas rechazadas; no service_role.

## 5. Procedimiento posterior de comprobación con tu propio correo

1. Confirmar los ajustes anteriores; abrir el origen canónico de Linde y crear cuenta con un correo propio autorizado.
2. Verificar que no se puede entrar a `/app` antes de confirmar. Abrir el enlace más reciente y comprobar acceso a D02 privado, con cierre de sesión disponible.
3. Guardar un borrador; cerrar sesión; volver al borrador local en el **mismo origen y pestaña**. Debe seguir ahí.
4. Iniciar sesión correctamente, recargar y verificar continuidad. Probar expiración/refresco con una sesión real sin alterar manualmente tokens para fingir éxito.
5. Pedir recuperación, abrir el enlace y cambiar contraseña. Debe volver al acceso; comprobar nueva contraseña y rechazo de la anterior, sin compartir valores.
6. Probar enlace ya usado/caducado y comprobar error sin acceso. Verificar cierre global desde otro dispositivo según limitaciones de access-token TTL de Supabase: revocar refresh tokens no invalida necesariamente cada JWT emitido de inmediato.

No se ejecutaron estos pasos con una cuenta real porque el usuario difirió las credenciales. No son bloqueos que se hayan resuelto mediante mocks. La entrega de este PR permite revisar código y configuración; **la validación positiva queda pendiente**.

## 6. Fuentes oficiales consultadas

Lectura pública2026-10-26 de las secciones relevantes:

- https://supabase.com/docs/guides/auth/server-side/nextjs — Next16 proxy, cookies, getClaims/getUser y caché.
- https://supabase.com/docs/guides/auth/server-side/creating-a-client — clientes SSR y almacenamiento.
- https://supabase.com/docs/guides/auth/passwords — registro/password/recovery y no enumeración.
- https://supabase.com/docs/guides/auth/redirect-urls — Site URL, allowlist y rutas exactas en producción.
- https://supabase.com/docs/guides/auth/auth-email-templates — TokenHash, SiteURL, confirmación SSR y problemas de tracking/scanners.
- https://nodejs.org/api/cli.html — NODE_USE_ENV_PROXY disponible en Node24 y22.21; conserva TLS y usa únicamente proxy ya autorizado.

No se consultaron ni copiaron endpoints privados de Holo o credenciales ajenas.
