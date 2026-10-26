# Editor visual — precisión, flujo y adaptación

Diseño original dentro del alcance de [Architect](../architecture.md): escena v1, texto/imagen/forma, selección única, revisiones inmutables y PNG autoritativo en worker. No hay editor implementado. Pantalla D10, detalle/export D12. [Wireframe desktop](boards/editor-desktop.svg) y [compacto](boards/editor-mobile.svg).

## 1. Anatomía desktop

Frame1440 nominal. Header64: volver a Biblioteca, título editable, “Cambios sin guardar” / “Guardando…” / “Versión n guardada”, Guardar versión y Exportar PNG. Toolbar48: Seleccionar, Añadir texto, Añadir imagen, Añadir forma; undo/redo y elección Cuadrado/Vertical con explicación si cambiar tamaño altera composición. Área de trabajo: panel de capas240, lienzo flexible, inspector288; footer40 con zoom/ajustar, dimensiones y aviso contextual. No sidebar del producto además del panel de capas.

Lienzo en `canvas-mat`, borde visible, margen de trabajo24; preview contiene imagen completa a escala de ajuste, no datos de UI encima de la publicidad. Reglas no visibles por defecto. Guías de alineación al mover con contraste sobre backing blanco, sin confiar en el color contra una fotografía. Un cuadro de selección nunca se considera texto publicitario ni aparece en exportación. Un botón “Vista previa” oculta controles sin modificar escena.

La UI es px CSS, la geometría del documento es px de salida. Escala y zoom no alteran coordenadas ni tamaños exportados. Canvas1080×1080 o1080×1920; máximo 30 capas, 2.000 caracteres totales y4MP según Architect. La app explica el límite cuando se acerca, no permite el submit para después truncar texto silenciosamente.

## 2. Selección y capas

Click/tap sobre objeto selecciona; click vacío deselecciona; Escape termina edición local antes de deseleccionar. Lista DOM de capas mantiene nombres humanos (“Titular”, “Foto del producto”), botón de selección y acciones Renombrar/Ocultar/Bloquear/Subir/Bajar/Eliminar. Máxima jerarquía simple, sin grupos o artboards V1. No tree semántico si solo es lista.

Bloquear impide drag y modificación accidental, pero permite desbloquear desde lista por teclado/puntero. Ocultar excluye de preview/export y se indica con texto; no borrar. Borrar capa admite undo; borrar un asset de biblioteca es operación distinta, no se ofrece desde tecla Delete del canvas. Duplicar crea otra capa dentro del límite, con nombre “Copia de …”.

Ordenar arrastrando es opcional. **Subir/Bajar y Enviar al frente/fondo son botones** accesibles mediante puntero único y teclado, no exclusivamente atajos. No auto-scroll agresivo de lista mientras un usuario edita. Capa seleccionada permanece identificable por indicador, nombre y atributo de selección.

## 3. Inspector preciso

| Selección | Controles disponibles | Restricciones y feedback |
| --- | --- | --- |
| Ninguna | Formato, color de fondo, selección de capa y añadir elemento | Cambio de formato crea cambios locales y vista previa; no crop destructivo silencioso |
| Texto | Contenido, fuente del catálogo, peso400/600, tamaño, color, alineación, interlineado, caja x/y/ancho/alto, rotación y opacidad | Texto real independiente del fondo; mostrar overflow “El texto no cabe”; ajustar caja/tamaño manualmente; no truncar al exportar sin aviso |
| Imagen | Asset propio, reemplazar, x/y/ancho/alto, relación bloqueada por defecto, contain/crop, rotación/opacidad, recorte numérico si modo crop | Reemplazo no regenera ni segmenta; no selector de URL remota. Crop se puede ajustar sin deformar el producto |
| Forma | Rectángulo/elipse, relleno, x/y/ancho/alto, radio cuando aplica, rotación y opacidad | No vectores arbitrarios, efectos avanzados o paths |

Campos numéricos con unidad, step y límites visibles; incrementos por botones44. Posición admite salir parcialmente del lienzo, con aviso de recorte; rangos seguros ligados al tamaño de documento y validación de servidor, no floats infinitos/NaN. Rotación normalizada, opacidad0–100; dimensiones estrictamente positivas. X/Y y tamaño respetan enteros o precisión máxima acordada del documento; propuesta v1: 1 px de edición de posición y tamaño, 1° de rotación, 1% opacidad. Si renderer admite decimales, su redondeo debe probarse antes de mostrar otra precisión. Color HEX editable con muestra y nombre accesible; picker no obligatorio para introducir valor.

Movimiento: arrastre directo o botones de nudge ±1px y ±10px; alineación izquierda/centro/derecha y arriba/medio/abajo. Resize: handles o campos ancho/alto; preservar relación de imagen activado, con opción explícita de desbloquear. Rotar: handle opcional y campo con botones. Ninguna función exige gesto de arrastre o multitáctil. No se inventa remove-background automático fuera del alcance aprobado.

## 4. Teclado y semántica

Tab recorre toolbar, lista de capas, controles de escena/zoom e inspector en orden lógico; enlace “Ir a propiedades” evita recorrer30 capas repetidamente. El canvas expone resumen del documento (formato, número de capas y capa activa), y lista/formularios DOM permiten operar sin interpretar pixels. No `role=application` global. Lectores de pantalla pueden seleccionar y editar cada capa en los controles equivalentes.

Atajos solo al enfocar región de canvas y sin estar escribiendo en un campo:

| Tecla | Acción |
| --- | --- |
| Flechas / Shift+Flechas | Mover selección1/10px |
| Delete o Backspace | Eliminar capa seleccionada con undo, nunca archivo/cuenta; Backspace no secuestra navegación global |
| Escape | Salir de modo de texto/recorte, después deseleccionar; diálogo confirma cambios solo al navegar fuera |
| Ctrl/Cmd+Z; Ctrl/Cmd+Shift+Z | Undo/redo local; no interceptar undo nativo dentro de input/textarea |
| Ctrl/Cmd+S | Guardar versión si puede hacerlo; no gasto IA |

No atajos de una sola letra activos globalmente, para evitar conflicto con dictado/lector (2.1.4). Todas las acciones tienen botón etiquetado, no solo shortcut. Zoom del lienzo tiene −/valor/+ y Ajustar; no interceptar Ctrl/Cmd +/- del navegador. Pinch/pan opcional nunca es único camino; botón Ajustar devuelve toda la escena visible.

Foco de handles: edición asistida principal mediante lista/inspector, sin introducir decenas de puntos de tabulación por capa. Anillo visible sobre backing para asegurar contraste; la selección visual azul solo no identifica foco. Tras borrar capa, foco en la siguiente o en Añadir si ya no quedan. Tras añadir, seleccionar la capa nueva y enfocar su primer control pertinente sin salto innecesario.

## 5. Mobile y zoom de página

A1280+ paneles completos. A1024–1279 capas en drawer y inspector persistente. A640–1023 una región de control visible; vista del lienzo seguida de tabs Capas/Propiedades. A320–639 toolbar a filas, lienzo al ancho y panel elegido **debajo en flujo**, no sheet que cubra la selección; guardar/export quedan en header/acciones wrap, pasan a flujo cuando abre teclado. Ninguna función se reserva a desktop.

El teclado virtual no se superpone a campos/actions: scroll normal, espacio seguro y focus-scroll. Contenido informativo refluye; el lienzo puede desplazarse/zoom como representación2D, pero formularios no. Mover/resize con toque puede usar handles target44, o inputs/botones si geometría impide separarlos. En pantallas pequeñas, ocultar handles superpuestos y priorizar inspector en vez de reducir targets a puntos minúsculos.

## 6. Guardar, versionar y exportar

Undo/redo es local a sesión; propuesta de historial50 operaciones, sin prometer historial de servidor por operación. Guardar explícitamente crea revisión inmutable A24; feedback solo después del servidor. Cambio nuevo devuelve “Cambios sin guardar”. Botón guardar permanece visible y con disabled explicado cuando no hay cambios o inputs inválidos.

Exportar con cambios pendientes abre C22: “Guarda esta versión antes de exportar” con Guardar y exportar / Volver al editor; no exportar silenciosamente la revisión anterior. Si el usuario quiere el PNG ya existente de una versión anterior, lo descarga desde D12 con etiqueta de versión inequívoca. Render espera fuentes/activos; no usa fallback distinto sin avisar. Un resultado de IA nuevo no pisa la escena abierta; se incorpora por decisión propia a una nueva revisión.

Fallo de guardado conserva memoria de la escena; ofrece reintentar seguro o copiar valores según contexto. Conflicto409: “Hay una versión más reciente”; Recargar versión guardada / Guardar como copia (crear nuevo creativo con A20/A24) / Seguir aquí. Recargar advierte pérdida de cambios locales; no sobrescribir otra sesión ni prometer fusión automática. Guardar copia sigue validando autorización/referencias actuales.

## 7. Estados y mensajes

- **Cargando escena:** shell estático, nombre y mensaje; acciones de edición bloqueadas hasta contrato válido.
- **Sin capas:** lienzo vacío con fuera-de-lienzo “Añade texto o una imagen”; no aparece una obra inventada.
- **Fallo de asset o fuente:** lista identifica elemento afectado y acción reemplazar/reintentar lectura; export bloqueado si no puede representar fielmente.
- **Límite:** mostrar “Has llegado a30 capas” o contador de caracteres antes de aceptar; no recortar silenciosamente.
- **Guardando:** etiqueta estable y feedback textual; otra generación no se inicia por el guardado.
- **Guardado:** revisión/fecha reales, PNG independiente.
- **Sin conexión:** cambios pendientes en memoria; informar que cerrar puede perderlos; no prometer modo offline completo.
- **Resultado IA incierto:** solo recuperar estado/esperar; editor continúa con recursos existentes, sin reenviar llamada facturable.

Comprobación editorial del anuncio: detectar contraste de texto sobre fondos sólidos conocidos y avisar si <4.5; sobre fotografía no afirmar AA por muestreo parcial. Opción de colocar placa de color sólida detrás del texto, ajustar estilo o revisar manualmente. Las comprobaciones no garantizan que el creativo generado cumpla WCAG o normas publicitarias; el usuario conserva revisión. La app sí debe cumplir sus propios contrastes y accesibilidad.

## 8. Criterios de aceptación futuros

Editar y exportar el mismo anuncio usando solo teclado, solo clics/toques sin arrastre y lector de pantalla mediante lista/inputs. Validar igualdad de contenido/dimensiones/fuentes entre preview y renderer, sin selección/guías en PNG. Probar320px,200% texto,400% zoom, teclado virtual y texto largo en español; guardar concurrente, pérdida de red, error de fuente y recuperación de export sin repetir IA. Son requisitos para Build, no pruebas ya ejecutadas.
