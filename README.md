# Linde — base frontend

Next.js App Router, TypeScript estricto y Tailwind. Esta etapa implementa **D02: URL o entrada manual**, componentes fundamentales y shell responsive. El onboarding queda fuera de la sidebar, como especifica Design.

**Sin backend, autenticación, análisis de webs o IA.** Los borradores se guardan solo en `sessionStorage` de la pestaña actual mediante acción explícita; pueden recuperarse, eliminarse y descargarse como JSON. Cerrar la pestaña puede eliminarlos. No son Brand DNA ni datos sincronizados en la nube.

## Desarrollo

Requiere Node.js 22 o superior (verificado con 24.19.0) y npm.

```bash
npm ci
npm run dev
```

No hacen falta credenciales ni archivos `.env`. Fuentes Inter servidas localmente desde su paquete OFL; licencia en `public/licenses/inter-OFL.txt`. Iconos geométricos originales. Ningún recurso o petición procede de Holo.

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

Se conserva a continuación la documentación del starter original. Recon, Architect y Design están aprobados; esta rama se limita a la base UI y D02. No continuar otras pantallas/backend sin autorización.

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
