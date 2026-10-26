# Contrato de tokens y mapeo Tailwind

Especificación para implementación posterior; no es config ejecutable. Fuente de verdad: [tokens.json](tokens.json); [tokens.css](tokens.css) expresa los mismos valores como variables, sin estilos de aplicación. No cambiar colores inline por pantalla. Todo cambio de paleta obliga a recalcular contraste.

| Categoría JSON | Variable declarativa CSS | Uso Tailwind previsto |
| --- | --- | --- |
| color.bg / surface / surface-subtle | --color-bg / --color-surface / --color-surface-subtle | bg-bg / bg-surface / bg-surface-subtle |
| color.text / text-muted | --color-text / --color-text-muted | text-text / text-text-muted |
| color.border / border-input | --color-border / --color-border-input | border-border solo decoración / border-border-input para inputs |
| color.accent / on-accent | --color-accent / --color-on-accent | bg-accent + text-on-accent; hover usa accent-hover, active accent-active |
| color.surface-selected / accent | --color-surface-selected / --color-accent | Selección de nav/card con texto accent y marcador visible |
| color.focus | --color-focus | Outline externo 2 px separado 2 px con base surface; no sustituir por sombra tenue |
| color.danger / success / warning / info | Variables homónimas y -surface | Texto/icono en su superficie tintada; ningún status solo por color |
| color.disabled-* | --color-disabled-* | Fondo/texto inactivos, no opacity global |
| font.sans / mono | --font-sans / --font-mono | font-sans / font-mono |
| type.body.size/line/weight | --type-body-size / --type-body-line / --type-body-weight | Utilidad tipográfica compuesta body, sin colisión con color text |
| space, valores en px | --space-0 … --space-96 | Escala de 4 px; documentar en tema de versión de Tailwind elegida |
| radius.sm/md/lg/xl | --radius-* | rounded-sm 8 / md 12 / lg 16 / xl 24, reemplazando defaults explícitamente |
| shadow.card/popover/dialog | --shadow-* | shadow-card / shadow-popover / shadow-dialog |
| motion.fast/base/slow/ease/reduced | --motion-* | Duración/easing semántico y reduced-motion; sin clases arbitrarias divergentes |
| layout y breakpoint | --layout-* y --breakpoint-* | Shell, editor y media queries del sistema; breakpoints semánticos de README |
| control y z | --control-* y --z-* | Tamaños y capas; no números mágicos por componente |

La sintaxis final del theme depende de la versión estable de Tailwind elegida en Build: en v4 integrar mediante su mecanismo de theme; en v3 extender configuración. **No se añaden ambos ni se genera una configuración ahora.** En CSS se entregan referencias en px por legibilidad de especificación; en implementación usar unidades relativas/rem donde correspondan para respetar aumento de texto, con base de usuario no forzada. Breakpoints expresados como anchuras CSS, no detección de dispositivo.

La escala nominal cambia defaults de radios de Tailwind; el integrador debe mapear valores exactos y validar, no asumir que rounded-md del framework ya es 12 px. Component aliases en tokens.json referencian roles; no son colores adicionales. Familias tipográficas propuestas no incluyen archivos descargados. Cuadros de Brand DNA y colores del creativo son datos del usuario, nunca sustituyen --color-accent de la app.

Pares permitidos exhaustivos en `pairs`. No usar text-muted sobre accent ni texto sobre fotografía sin fondo sólido validado. Bordes decorativos, sombras y disabled tienen excepciones normativas posibles, pero el diseño no se apoya en ellas para campos identificables. Estados hover/focus usan colores sólidos; no opacity arbitraria que altere contraste.
