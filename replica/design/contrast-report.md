# Contraste de tokens — resultado calculado

Fecha:2026-10-26. Herramienta: `.agents/skills/replica-design/contrast.py`, sin modificaciones. Comando ejecutado: `python3 .agents/skills/replica-design/contrast.py replica/design/tokens.json --json`. Código de salida0. **58 pares permitidos, 0 fallos AA**.

Se usa luminancia relativa WCAG2 y umbral4.5 para texto normal,3 para UI. Los pares son colores sólidos, sin mezclas/alpha; las sombras y el borde decorativo no identifican inputs. No usar otros emparejamientos sin comprobarlos. El cálculo no valida aplicación, foco, layout, texto en imágenes o cumplimiento WCAG integral.

| Foreground | Background | Uso | Ratio | Umbral AA | Resultado |
| --- | --- | --- | --- | --- | --- |
| text (#1D2722) | bg (#F7F6F2) | normal | 14.22:1 | 4.5:1 | PASS |
| text-muted (#536056) | bg (#F7F6F2) | normal | 6.12:1 | 4.5:1 | PASS |
| border-input (#727A70) | bg (#F7F6F2) | ui | 4.10:1 | 3:1 | PASS |
| focus (#2463A0) | bg (#F7F6F2) | ui | 5.77:1 | 3:1 | PASS |
| text (#1D2722) | surface (#FFFFFF) | normal | 15.38:1 | 4.5:1 | PASS |
| text-muted (#536056) | surface (#FFFFFF) | normal | 6.61:1 | 4.5:1 | PASS |
| border-input (#727A70) | surface (#FFFFFF) | ui | 4.44:1 | 3:1 | PASS |
| focus (#2463A0) | surface (#FFFFFF) | ui | 6.24:1 | 3:1 | PASS |
| text (#1D2722) | surface-subtle (#F0F1EC) | normal | 13.55:1 | 4.5:1 | PASS |
| text-muted (#536056) | surface-subtle (#F0F1EC) | normal | 5.83:1 | 4.5:1 | PASS |
| border-input (#727A70) | surface-subtle (#F0F1EC) | ui | 3.91:1 | 3:1 | PASS |
| focus (#2463A0) | surface-subtle (#F0F1EC) | ui | 5.49:1 | 3:1 | PASS |
| text (#1D2722) | surface-selected (#E6EFE8) | normal | 13.09:1 | 4.5:1 | PASS |
| text-muted (#536056) | surface-selected (#E6EFE8) | normal | 5.63:1 | 4.5:1 | PASS |
| border-input (#727A70) | surface-selected (#E6EFE8) | ui | 3.78:1 | 3:1 | PASS |
| focus (#2463A0) | surface-selected (#E6EFE8) | ui | 5.31:1 | 3:1 | PASS |
| text (#1D2722) | canvas-mat (#E8EAE4) | normal | 12.68:1 | 4.5:1 | PASS |
| text-muted (#536056) | canvas-mat (#E8EAE4) | normal | 5.45:1 | 4.5:1 | PASS |
| border-input (#727A70) | canvas-mat (#E8EAE4) | ui | 3.66:1 | 3:1 | PASS |
| focus (#2463A0) | canvas-mat (#E8EAE4) | ui | 5.14:1 | 3:1 | PASS |
| on-accent (#FFFFFF) | accent (#255D49) | normal | 7.66:1 | 4.5:1 | PASS |
| on-accent (#FFFFFF) | accent-hover (#1D4D3C) | normal | 9.64:1 | 4.5:1 | PASS |
| on-accent (#FFFFFF) | accent-active (#163D30) | normal | 12.04:1 | 4.5:1 | PASS |
| accent (#255D49) | bg (#F7F6F2) | normal | 7.09:1 | 4.5:1 | PASS |
| accent (#255D49) | surface (#FFFFFF) | normal | 7.66:1 | 4.5:1 | PASS |
| danger (#A52F3F) | bg (#F7F6F2) | normal | 6.31:1 | 4.5:1 | PASS |
| danger (#A52F3F) | surface (#FFFFFF) | normal | 6.82:1 | 4.5:1 | PASS |
| success (#226240) | bg (#F7F6F2) | normal | 6.72:1 | 4.5:1 | PASS |
| success (#226240) | surface (#FFFFFF) | normal | 7.27:1 | 4.5:1 | PASS |
| warning (#795000) | bg (#F7F6F2) | normal | 6.56:1 | 4.5:1 | PASS |
| warning (#795000) | surface (#FFFFFF) | normal | 7.09:1 | 4.5:1 | PASS |
| info (#235D8A) | bg (#F7F6F2) | normal | 6.46:1 | 4.5:1 | PASS |
| info (#235D8A) | surface (#FFFFFF) | normal | 6.99:1 | 4.5:1 | PASS |
| danger (#A52F3F) | danger-surface (#FFF0F2) | normal | 6.17:1 | 4.5:1 | PASS |
| text (#1D2722) | danger-surface (#FFF0F2) | normal | 13.91:1 | 4.5:1 | PASS |
| text-muted (#536056) | danger-surface (#FFF0F2) | normal | 5.98:1 | 4.5:1 | PASS |
| danger (#A52F3F) | danger-surface (#FFF0F2) | ui | 6.17:1 | 3:1 | PASS |
| success (#226240) | success-surface (#EBF5EE) | normal | 6.52:1 | 4.5:1 | PASS |
| text (#1D2722) | success-surface (#EBF5EE) | normal | 13.79:1 | 4.5:1 | PASS |
| text-muted (#536056) | success-surface (#EBF5EE) | normal | 5.93:1 | 4.5:1 | PASS |
| success (#226240) | success-surface (#EBF5EE) | ui | 6.52:1 | 3:1 | PASS |
| warning (#795000) | warning-surface (#FFF4DC) | normal | 6.49:1 | 4.5:1 | PASS |
| text (#1D2722) | warning-surface (#FFF4DC) | normal | 14.08:1 | 4.5:1 | PASS |
| text-muted (#536056) | warning-surface (#FFF4DC) | normal | 6.05:1 | 4.5:1 | PASS |
| warning (#795000) | warning-surface (#FFF4DC) | ui | 6.49:1 | 3:1 | PASS |
| info (#235D8A) | info-surface (#EDF4FC) | normal | 6.31:1 | 4.5:1 | PASS |
| text (#1D2722) | info-surface (#EDF4FC) | normal | 13.87:1 | 4.5:1 | PASS |
| text-muted (#536056) | info-surface (#EDF4FC) | normal | 5.97:1 | 4.5:1 | PASS |
| info (#235D8A) | info-surface (#EDF4FC) | ui | 6.31:1 | 3:1 | PASS |
| on-danger (#FFFFFF) | danger (#A52F3F) | normal | 6.82:1 | 4.5:1 | PASS |
| on-danger (#FFFFFF) | danger-hover (#882435) | normal | 8.93:1 | 4.5:1 | PASS |
| disabled-text (#59635B) | disabled-bg (#E5E8E1) | normal | 5.05:1 | 4.5:1 | PASS |
| selection (#2463A0) | canvas-control (#FFFFFF) | ui | 6.24:1 | 3:1 | PASS |
| selection (#2463A0) | canvas-mat (#E8EAE4) | ui | 5.14:1 | 3:1 | PASS |
| on-accent (#FFFFFF) | selection (#2463A0) | normal | 6.24:1 | 4.5:1 | PASS |
| border-input (#727A70) | disabled-bg (#E5E8E1) | ui | 3.58:1 | 3:1 | PASS |
| accent (#255D49) | surface-selected (#E6EFE8) | normal | 6.52:1 | 4.5:1 | PASS |
| selection (#2463A0) | surface (#FFFFFF) | ui | 6.24:1 | 3:1 | PASS |

La decisión se calcula con ratio sin redondear; tabla redondeada a2 decimales. Outline focus/selection se dibuja contra base blanca cuando cruza una foto o botón; no confiar en contraste contra cualquier creativo. Los colores de marca y anuncios son datos variables y exigen evaluación separada.

Revalidar en Build: hover/active, estados de error/success, foco real, superficies, selección, disabled y cualquier overlay; el reporte no autoriza usar texto muted encima de accent ni controles sobre fotografías sin backing.
