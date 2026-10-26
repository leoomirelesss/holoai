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
