# D04 — Brand DNA implementado

2026-10-27 · Rama `feat/d04-brand-dna-editor`, base main `bbb54f9` (PR #6 integrado). Complementa screens.md sin cambiar sus tokens ni el diseño de D01/D02.

## Composición

Ruta privada `/app/brands/[brandId]/dna`, dentro de AppShell. H1 «El ADN de tu marca», revisión/estado confirmados y regreso a /app. Navegación por anclas: Identidad, Identidad visual, Voz y audiencia, Competidores. Desktop: formulario 2/3 y resumen/historial 1/3; móvil: formulario y después resumen, una sola columna. Se reutilizan Card, Badge, Button, Field, TextAreaField, Notice e Inter local.

Cada sección tiene número, encabezado y explicación breve. El resumen diferencia edición local de revisión guardada. La última revisión aprobada se mantiene visible cuando existe otro borrador. Colores aportados por el usuario no recolorean la interfaz. No hay imágenes decorativas, logos ficticios, recursos de Holo ni un catálogo de fuentes inventado.

## Contrato visible

| Campo | Límite actual |
| --- | --- |
| Nombre del perfil | 160 caracteres Unicode |
| URL opcional | 2048; HTTPS sin credenciales ni espacios |
| Descripción | 8000 caracteres Unicode |
| Idioma | 35; texto aportado, sin inferencia automática |
| Colores | Máximo12; # y seis dígitos HEX |
| Familia tipográfica opcional | 100; texto admitido por el contrato, sin carga de fuentes externas |
| Tono / audiencia | 2000 / 4000 caracteres Unicode |
| Competidores | Máximo20; nombre obligatorio hasta160 y URL HTTPS opcional hasta2048 |
| Documento | Hasta64KiB UTF-8, sujeto a validación final de API/SQL |

Se cuentan puntos de código, como la API, sin truncar emojis por unidades UTF-16. Se rechazan NUL y Unicode malformado. Añadir color abre un campo vacío; no se guardan sugerencias. Cada fila puede eliminarse por botón y mantiene foco accesible. Logo es un aviso de indisponibilidad, sin control de subida simulado. El nombre y la URL se presentan como campos del perfil; el éxito no anuncia una mutación independiente del registro de marca.

## Estados y acciones

- Carga: skeleton con estado vivo y sin campos aparentemente vacíos editables.
- Incompleto: ayuda sobre los cinco requisitos de aprobación. Guardar admite borradores incompletos; aprobar valida nombre, descripción, idioma, tono y audiencia con error por campo/foco.
- Guardado: solo tras respuesta real y consulta de la revisión. Se informa el número confirmado; no hay aprobación implícita.
- Aprobación: solo propietario, revisión actual guardada, sin cambios locales pendientes. Miembros ven explicación y pueden guardar borradores.
- Cambios posteriores: borrador nuevo y última aprobada diferenciados; no se sustituye la aprobación anterior.
- Red/sesión: copia local conservada; sesión nueva exige la misma cuenta para recuperar su edición.
- Conflicto409: edición intacta; «Consultar versión actual» muestra otra versión en lectura separada. Copiar/descargar cambios antes de «Cargar versión del servidor», con confirmación explícita. No hay merge automático.
- Escritura incierta: aviso persistente y botones de escritura bloqueados hasta consultar. Leer puede confirmar el resultado o habilitar un reenvío explícito con la precondición comprobada; nunca reenvía automáticamente.
- Sin permisos: ruta404 genérica o aviso seguro del cliente; no se muestran recursos ajenos como perfil vacío. El ID no concede permisos.

Guardar y aprobar tienen acciones separadas, bloqueo de doble envío y estado busy. Los cambios se conservan en sessionStorage por cuenta/marca; cerrar la pestaña puede perderlos. Descarga JSON y copia al portapapeles son acciones reales de respaldo, sin simular exportaciones publicitarias.

## Navegación y accesibilidad

D02 ofrece «Revisar Brand DNA» únicamente con ID confirmado y alta completa. No desbloquea creaciones inciertas. AppShell habilita Brand DNA en el detalle cuando el servidor autorizó el destino; no incorpora selector o listado sin endpoint. Las otras secciones siguen no disponibles.

Anclas, labels, fieldsets/legends, controles nativos, foco visible y avisos role=status/alert. Confirmación al salir con cambios o escritura pendiente, incluyendo links, logout, recarga y navegación de historial. Cargar una versión distinta requiere confirmación; antes se ofrecen copia y descarga. No se aprueban cambios sin guardar.

Los estilos usan tokens existentes; los HEX de las vistas previas son datos del perfil validados. Revisión de contraste:58 pares,0 fallos AA. Las auditorías axe y capturas reales están documentadas en el resultado siguiente; no se declara certificación global WCAG.

## Validación y evidencia final

[Actions 40590747868](https://github.com/leoomirelesss/holoai/actions/runs/40590747868), código d3d7559:48 comprobaciones D04 correctas con usuarios reales de Supabase local. Auditorías axe sin infracciones en los estados medidos; viewport1440/390 y reflow320 con texto200% sin overflow. [Índice de ocho PNG originales](screenshots/d04/README.md), con enlaces directos y dimensiones.

La revisión detectó y corrigió el nombre ARIA en la paleta vacía (ahora texto de estado o grupo accesible) y nowrap en la etiqueta de revisión a200% (ahora puede ocupar varias líneas). Los cambios se limitan a D04; no se recolorean tokens ni se rediseñan D02/D01. El estado y los errores también aparecen junto a las acciones al final del formulario; las nuevas versiones siguen siendo consultas separadas y su carga exige confirmación.
