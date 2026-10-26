# Linde — base frontend

Next.js App Router, TypeScript estricto y Tailwind. Esta etapa implementa **D02: URL o entrada manual**, componentes fundamentales y shell responsive. El onboarding queda fuera de la sidebar, como especifica Design.

**D02 sigue sin análisis web o IA.** La autenticación real se describe a continuación; los datos de marca todavía no tienen backend. Los borradores se guardan solo en `sessionStorage` de la pestaña actual mediante acción explícita; pueden recuperarse, eliminarse y descargarse como JSON. Cerrar la pestaña puede eliminarlos. No son Brand DNA ni datos sincronizados en la nube.

## Autenticación real (D01)

Supabase Auth está integrado con `@supabase/ssr`. Acceso/registro/recuperación/confirmación en `/auth/*`; D02 autenticado en `/app`, verificado en servidor mediante proxy y getUser. La raíz `/` conserva el borrador local público. Entrar o salir no borra sessionStorage.

Configura los nombres de `.env.example` de forma segura; URL y publishable key ya se proporcionan en Codex. No service_role ni secretos elevados. `SITE_URL` es el origen de Linde (por defecto localhost:3000 en local), no el de Supabase. Revisa [guía de Redirect URLs, plantillas y entrega](replica/auth-setup.md) antes de probar el ciclo por correo. No se ha configurado SMTP u otro servicio.

El usuario difirió las credenciales de prueba: están verificados rechazo real de login y acceso privado sin sesión; **login correcto, recepción de correo y reset completo todavía no se han probado con una cuenta real**. No se presenta una sesión simulada como evidencia.

## Desarrollo

Requiere Node.js22.21+ de rama22 o24+ (verificado con24.19.0) y npm. El launcher usa el soporte nativo NODE_USE_ENV_PROXY con el proxy autorizado del entorno; no desactiva TLS y admite override explícito.

```bash
npm ci
npm run dev
```

D02 público no necesita credenciales. D01 y `/app` requieren las dos variables Supabase; usa los nombres de `.env.example` sin copiar valores a Git. Fuentes Inter servidas localmente desde su paquete OFL; licencia en `public/licenses/inter-OFL.txt`. Iconos geométricos originales. Ningún recurso o petición procede de Holo.

## Verificación

```bash
npm run tokens:check
npm run lint
npm run typecheck
npm run build
npm run start
```

`src/app/design-tokens.css` se genera desde el diseño aprobado con `npm run tokens`; no editarlo a mano. Arquitectura y documentos de Design no se modifican. El build comprueba que los tokens generados coinciden con la fuente.

Pruebas de navegador (después de compilar):

```bash
npx playwright install chromium
npm run test:e2e
```

Si el sistema ya dispone de Chromium, se puede evitar descargar otro navegador:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

En este entorno cloud, si npm no puede escribir su caché predeterminada, anteponer `npm_config_cache=/tmp/linde-npm-cache` a los comandos de npm. No desactivar TLS ni verificaciones.

Las pruebas arrancan el servidor de producción si hace falta. Cubren escritorio1440px y móvil390px, teclado, foco del menú, URL/manual, almacenamiento bloqueado, ausencia de peticiones a la empresa, axe y reflujo320px con texto ampliado. Las capturas reales están en `replica/clone-screens/`; no son wireframes ni una prueba de todas las condiciones WCAG. Ver [registro de implementación](replica/build-log.md).

## Paquete de skills e investigación

Se conserva a continuación la documentación del starter original. Recon, Architect y Design están aprobados; la base UI/D02 está integrada y esta rama añade exclusivamente D01/Auth. No continuar otras pantallas/backend sin autorización.

---

# Holo Replica — Starter para OpenAI Codex

Una skill principal **holo-replica** diseñada para coordinar el proyecto de una alternativa propia a Holo AI sin copiar contenido ni código privado.

## Instalación sencilla

1. Crea o abre tu proyecto en Codex.
2. Copia la carpeta `.agents/skills/holo-replica/` de este ZIP a la carpeta `.agents/skills/` de tu proyecto. **Fusiona directorios, no reemplaces archivos existentes.**
3. Abre Codex y escribe: `$holo-replica Investiga https://tryholo.ai/ y https://docs.tryholo.ai/ para construir una alternativa original. Empieza solo por Recon: mapa de pantallas/flujos, funciones verificadas y features.csv. No programes todavía.`
4. Opcional: instala también las 11 skills del repositorio original con el script del paso siguiente. El archivo `SKILL.md` principal funciona por sí solo si no instalas las demás.

## Instalar las 11 skills originales para Codex (Windows PowerShell)

Abre PowerShell en la raíz de tu proyecto y ejecuta, **después de revisar el repositorio de terceros**:

```powershell
.\scripts\install-replica.ps1
```

El script descarga desde https://github.com/Jakeschincariol/replica-skill, revisa que cada carpeta incluya `SKILL.md`, instala en `.agents/skills/replica-*` sin sobrescribir habilidades ya existentes y NO ejecuta scripts de terceros. Se necesita `git`.

Alternativa manual (terminal):

```powershell
git clone https://github.com/Jakeschincariol/replica-skill.git
New-Item -ItemType Directory -Force .agents\skills | Out-Null
Get-ChildItem .\replica-skill -Directory -Filter 'replica-*' | ForEach-Object { Copy-Item $_.FullName .\.agents\skills\ -Recurse }
```

Puedes invocarlas en Codex como `$replica-recon`, `$replica-architect` o `$replica-design`, etc.; NO se invocan con `/replica-recon`, que es sintaxis propia de Claude Code.

## Primer resultado esperado

- `replica/recon.md`: mapa de funciones, pantallas y flujos documentados.
- `replica/features.csv`: backlog con prioridad MUST/SHOULD/COULD y estado inicial `no`.
- Un alcance MVP de un solo flujo end-to-end.
- Ninguna app creada ni cambios a producción en esta primera fase.

## Fuentes
- Skill upstream MIT: https://github.com/Jakeschincariol/replica-skill
- Guía oficial de Codex skills: https://learn.chatgpt.com/docs/build-skills
- Holo AI: https://tryholo.ai/ y https://docs.tryholo.ai/

Este paquete incluye nuestra skill de orquestación; **no contiene ni afirma incluir el código fuente de las 11 skills del autor**. El script las instala separadamente desde GitHub.


### Verificación negativa contra Supabase (sin cuenta ni correos)

```bash
NODE_USE_ENV_PROXY=1 node scripts/auth-smoke.mjs
```

Lee settings y comprueba rechazo de credenciales inválidas en dominio reservado; nunca registra usuarios ni solicita emails. No sustituye prueba de login correcto. Resultados y checklist en `replica/backend.md`. Capturas D01 en `replica/clone-screens/auth/`. El caso completo con cuenta propia y correo debe ejecutarse después según la guía; no pegar contraseña o enlaces de verificación en chats/issues.

### Pruebas locales de la base de datos (sin despliegue)

```bash
npm run test:db
```

Requiere Docker. Crea un PostgreSQL desechable, sin red/puertos ni claves de Supabase; prueba las migraciones, RLS e integridad con identidades sintéticas y elimina el contenedor. No toca `linde-dev`. Alcance, contratos y límites en [replica/brand-data-foundation.md](replica/brand-data-foundation.md). No aplicar migraciones remotas hasta aprobar el PR de esta fase.
