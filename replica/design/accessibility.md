# Objetivo WCAG 2.2 AA y plan de validación

Objetivo de producto, no declaración de conformidad alcanzada. Esta entrega contiene documentos, tokens y diagramas; no una interfaz funcional que pueda auditarse. Contraste de pares concretos sí calculado con la herramienta de la skill: [reporte](contrast-report.md). Que pase contraste no prueba foco, semántica, teclado, zoom, lector o autenticación.

## 1. Criterios y decisiones de diseño

| Ámbito / criterios | Especificación para Build | Comprobación futura |
| --- | --- | --- |
| Texto alternativo 1.1.1 | Thumbnails con nombre de producto/creativo y propósito; decorativos sin nombre redundante; canvas con resumen y representación DOM | NVDA/VoiceOver; verificar que la descripción permite elegir recurso, sin inventar detalle visual |
| Relaciones y orden 1.3.1–1.3.3 | Labels/grupos/encabezados reales; orden DOM coherente; instrucciones no dependen de “botón verde a la derecha” | Lectura lineal, CSS desactivado, formularios y tablas |
| Orientación y propósito 1.3.4–1.3.5 | No bloquear orientación; autocomplete para email/contraseña; datos ya conocidos reutilizados | Portrait/landscape, autocompletado y password manager |
| Color y contraste 1.4.1/1.4.3/1.4.11 | Texto normal ≥4.5:1; grande ≥3:1; elementos UI/foco ≥3:1 cuando aplica; color siempre con etiqueta/icono | Ratios de tokens y contraste real en browser, incluyendo selección/hover/errores |
| Texto y reflujo 1.4.4/1.4.10/1.4.12 | Texto200%, zoom400% a320 CSS; line-height1.5, párrafo2, letter-spacing0.12em y word-spacing0.16em sin pérdida | Probar labels largos, modales, formularios y paneles del editor. No scroll horizontal de UI |
| Texto como imagen 1.4.5 | UI y copy editables como texto, no screenshots de controles; anuncios/export son contenido y no sustituyen UI | Modo zoom/selección y alternativas de datos; no afirmar que PNG garantiza accesibilidad del anuncio |
| Hover/focus 1.4.13 | Tooltips suplementarios descartables, hoverables y persistentes al usar; no información esencial exclusiva de hover | Mouse, Tab, Escape y lector |
| Teclado 2.1.1/2.1.2/2.1.4 | Todo el editor operable en lista/inspector; sin trampas; atajos de caracteres no globales | Recorrido completo sin mouse; no interceptar teclas al escribir |
| Tiempo/movimiento 2.2.1/2.2.2/2.3.1 | Sin flashes/parallax; estados persistentes, toasts no esenciales; sesión advierte cuando se conoce expiración y permite reautenticar sin pérdida evitable | Reduced-motion, pausa, límites reales y pérdida de red; deadlines de trabajo no se disfrazan de examen cronometrado |
| Navegación 2.4.1–2.4.7 | Skip link, títulos únicos, h1, orden lógico, links descriptivos, destinos consistentes y vías nav/breadcrumb/biblioteca | Tab/Shift+Tab, volver, abrir deep link propio, nombre de acciones repetidas con contexto |
| Foco no oculto 2.4.11 | Sticky headers/drawers/teclado virtual no tapan completamente foco; scroll padding y acciones que refluyen |320px, zoom400%, teclado virtual, diálogos y avisos |
| Gestos y puntero 2.5.1/2.5.2/2.5.3/2.5.4 | No gesto complejo obligatorio; cancelar antes de pointerup; nombre accesible incluye etiqueta visible; ninguna función exige mover dispositivo | Toque único, activación/cancelación y control por voz |
| Arrastre 2.5.7 | Mover/resize por inputs y botones; ordenar por Subir/Bajar; subir por selector; zoom por botones | **Solo clics/toques sin arrastrar**; teclado no es por sí solo alternativa de puntero |
| Targets 2.5.8 | Regla propia44×44 para táctil y acciones principales; mínimo24×24 o separación equivalente donde aplique; handles pequeños tienen alternativa grande | Medición de áreas activas, no solo glyph; editor y filtros densos |
| Idioma 3.1.1/3.1.2 | Español en UI, fragmentos de idioma distinto marcados cuando corresponda; nombres de producto no traducidos inventadamente | Lector y contenido internacional |
| Predecible 3.2.1–3.2.4/3.2.6 | Cambiar campo no dispara gasto/navegación; ayuda en posición consistente; labels y destinos estables | Foco, select, autosubmit no autorizado, responsive |
| Errores 3.3.1–3.3.4 | Label/hint/error, resumen enlazado, sugerencia segura; coste/borrado revisables y confirmados; no reset destructivo de formulario | Submit inválido, cuota,429,conflicto,incertidumbre y borrado; sin cargos por un click accidental |
| Entrada redundante 3.3.7 | Reutilizar marca/producto/brief; no pedir URL otra vez al volver o reautenticar si puede conservarse de forma segura | Atrás, refresh de job, reconexión y volver desde editor |
| Auth accesible 3.3.8 | Paste/autofill/password manager permitidos; mostrar contraseña; sin puzzle cognitivo obligatorio; recuperación accesible | Verificación/recuperación en móvil y lector; no exigir transcripción manual si se puede pegar |
| Roles y estados 4.1.2/4.1.3 | Botones/links/listas reales, estado seleccionado/expanded/busy, mensajes programáticos; no anunciar cada poll | AX tree, lector, live regions y controles de canvas equivalentes |

Multimedia temporal 1.2.x no aplica a V1 porque no hay video/audio. Se reevaluará al autorizar esos módulos. La excepción de contenido2D permite desplazamiento del lienzo en ciertos casos; **no excusa** paneles/formularios ni la ausencia de alternativa operable. Área de enfoque de2px y targets44 son políticas propias; no se llama requisito AA al criterio AAA de Focus Appearance2.4.13.

## 2. Patrones críticos

- Modal abre foco en título/primer campo lógico, restringe fondo, restaura foco; Escape no borra datos silenciosamente.
- Campos inválidos: resumen al inicio con enlaces, texto junto a campo y asociación programática. No cambiar foco durante validación mientras se escribe.
- Job inicia/completa/falla: live polite con una frase por transición; error urgente de acción mediante alert. No leer cada3–5s de polling ni un reloj indefinido.
- Nuevos resultados no roban foco; mensaje y enlace “Ver resultado” si el usuario se fue a otra sección.
- Canvas: texto/posición/orden/visibilidad de cada capa accesibles en DOM. Una aria-label genérica “editor” no basta. Operación equivalente por teclado y por puntero sin drag.
- No esconder acciones necesarias en hover, context menu sin alternativa o atajo. Nombres específicos en cards: “Editar {nombre}”, no seis botones ambiguos “Editar” al escucharlos fuera de contexto.
- UI de Brand DNA cumple sus tokens aunque la marca elija amarillo claro. Ad creativo tiene advertencias propias; fotografía+texto no se certifica AA automáticamente.
- Auth y autorizaciones: éxito solo tras servidor; errores no exponen existencia de usuario/tenant o secretos. Accesibilidad no exige desactivar las protecciones.

## 3. Plan de evaluación futura

Matriz: Chrome/Firefox + NVDA en Windows; Safari + VoiceOver en macOS/iOS; Chrome + TalkBack en Android según dispositivos disponibles. Estas combinaciones son objetivo, no pruebas ejecutadas. En beta, priorizar versiones estables y registrar versiones exactas, casos y resultados.

Recorridos: alta→URL→corrección DNA→producto→concepto→imagen→editor→guardar→PNG; variante manual; recuperación de resultado incierto; exportación repetida sin IA; guardado conflictivo; reautenticación; permisos revocados; cuenta/borrado. Repetir teclado, puntero sin drag, lector,320px, zoom400%, texto200% y reduced-motion. Comprobar después controles del editor con30 capas y textos largos.

Automatización futura: contraste y lint de tokens, axe u otra auditoría en páginas implementadas, regresión visual y pruebas de recorrido/semántica. Ninguna herramienta automática cubre toda WCAG; auditoría manual y pruebas con personas completarán la evidencia. No se escriben tests de aplicación en esta fase.

## 4. Evidencia actual

Leídos [WCAG2.2](https://www.w3.org/TR/WCAG22/) y [Understanding Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html),26-10-2026. Análisis de58 pares del archivo de tokens con `contrast.py` de la skill, resultados en reporte. Revisada coherencia documental con Arquitectura y límites. No se certifica conformidad global, accesibilidad de SVGs de wireframe o funcionamiento de software inexistente. Los SVG incorporan título/descripción y la versión textual equivalente está en wireframes.md.

Se inspeccionaron visualmente tres previews raster temporales de la misma geometría de las láminas originales, y se comprobó que los SVG son XML válido sin scripts ni recursos externos. No se ejecutó una app, no se probó un navegador y no se afirma render tipográfico idéntico entre viewers.
