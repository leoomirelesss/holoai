# Pantallas y estados — especificación UI/UX

13 superficies propias D01–D13. Referencias S/F pertenecen al Recon; A pertenece a [API aprobada](../api-and-jobs.md). No se añaden endpoints. Todas las pantallas tienen estructura y estados dibujados en [wireframes](wireframes.md); los wireframes son especificación, no aplicación funcional.

## 1. Inventario y continuidad

| ID | Pantalla / acceso lógico | Propósito y acción primaria | Referencias de arquitectura |
| --- | --- | --- | --- |
| D01 | Acceso; antes de cualquier dato privado | Entrar/crear cuenta/verificar/recuperar acceso | S03; Supabase Auth, callback y logout |
| D02 | Primera marca: introducir web | “Analizar sitio” o entrada manual | S04/F01; A01/A04/A06 |
| D03 | Resultado/progreso de importación actual | Revisar información o continuar manualmente | S04/F01; A27/A28/A32 |
| D04 | Brand DNA; alta o sidebar | Guardar borrador y después aprobar revisión | S07/F01; A05/A07/A08 |
| D05 | Catálogo; alta o sidebar | Revisar productos y añadir/importar | S08/F01; A09/A10/A06 |
| D06 | Ficha de producto; desde catálogo | Guardar producto y sus fotos verificadas | S08/F01; A10–A16 |
| D07 | Brief; Crear anuncio | Crear 3 conceptos para producto elegido | S11/F02; A17/A18 |
| D08 | Conceptos; resultado del lote | Elegir y editar concepto; continuar | S11/F02; A18/A19/A20 |
| D09 | Imágenes; concepto seleccionado | Generar 1–3 imágenes y elegir resultado | S12/F02; A25/A27/A28/A20 |
| D10 | Editor; abrir resultado o creativo | Guardar versión y exportar revisión | S22/F02; A22/A24/A26 |
| D11 | Biblioteca; sidebar/retorno | Reabrir creativo o crear otro | S21/F02; A21/A23 |
| D12 | Detalle de creativo y exportación | Revisar contexto/revisión y descargar PNG | S21/S22/F02; A22/A26/A27/A29 |
| D13 | Cuenta y uso; pie de sidebar | Consultar consumo y salir; borrado aparte | S23; A02/A31/A03 y logout |

Las etapas conservan contexto de marca/producto/revisión. Atrás no regenera ni aprueba nada. Sidebar activo por sección; editor fuera del shell habitual. Saltar al siguiente paso solo cuando existen inputs aprobados necesarios. Un usuario puede abrir catálogo o biblioteca sin terminar perfil; generar está explicado como no disponible hasta completar requisitos, no se ocultan los datos ya guardados.

## D01 — Acceso y verificación

Centro de pantalla: wordmark, título y formulario máx. 400; sin imagen promocional de fondo. Email, contraseña con toggle mostrar y enlace recuperar; crear cuenta pide lo mínimo. Acceso por contraseña según Architect; no botón Google no configurado. Verificación: email parcialmente visible, aviso “Revisa tu correo” y reenviar con disponibilidad real del proveedor, nunca countdown inventado. Recuperar: email y respuesta genérica que no revele si existe cuenta; nueva contraseña con paste/password manager.

Desktop: columna única en superficie clara, ayuda al pie. Compacto: mismo orden con padding16, sin teclado tapando CTA. Foco inicial en h1 o primer campo según navegación; errores asociados; no bloquear pegar ni imponer memoria/captcha cognitivo sin alternativa. Tras acceso, volver solo a destino interno autorizado. Valores de contraseña no aparecen en reportes ni previews.

- **Loading:** botón “Entrando…” conservando nombre, busy en formulario; no login doble.
- **Empty:** formulario vacío con labels y enlace a crear cuenta; no error antes de interactuar.
- **Error:** “No pudimos iniciar sesión. Revisa tus datos o recupera el acceso.” Conservar email; no confirmar existencia de cuenta.
- **Success:** “Correo verificado” o acceso confirmado; redirección anunciada a URL/marca actual, sin toast de éxito seguido de pantalla inaccesible.

## D02 — URL de empresa

Formulario central máx640: “Empecemos por tu marca”, URL HTTPS, ayuda sobre lectura de páginas públicas y opción “Completar manualmente”. Aviso breve de derechos/autorización con enlace a información; no checkbox redundante para cada clic. Acción “Analizar sitio”; si tiene coste de IA, C14 muestra cota válida antes de confirmar. Si el importe aún no está disponible, no iniciar trabajo ni mostrar cero. A01/A04 se realizan de forma idempotente en alta, no al simple render de página.

Desktop: columna de formulario + nota secundaria de pasos, sin panel de marketing. Compacto: nota después del formulario. Se valida formato; el backend decide seguridad/acceso, no una barra verde que diga “sitio seguro”. La extracción limitada se explica como “Prepararemos un borrador para que lo revises”.

- **Loading:** “Iniciando análisis…” hasta job persistido; después D03. Doble submit bloqueado.
- **Empty:** URL vacía; acción no ejecuta, ayuda “Introduce una dirección HTTPS”; manual disponible.
- **Error:** error de URL junto al input; acceso bloqueado/no legible ofrece corregir o manual; nunca pedir desactivar protecciones.
- **Success:** job aceptado → D03, conservando dominio y contexto.

## D03 — Análisis y resultado de importación

Panel con URL, etapas “Leer sitio → Preparar perfil → Buscar productos → Revisar”, y estado del job. Solo etapa conocida como progreso, sin % o “faltan 20 s”. La extracción puede producir perfil con campos desconocidos y productos draft; mostrar conteos reales. “Puedes salir y volver cuando termine” solo cuando el ID persistido permite recuperar A27/A32; no depender exclusivamente de localStorage. No prometer notificaciones por email o background push.

Desktop: lista de etapas izquierda y resumen derecha. Compacto: vertical. “Cancelar análisis” disponible según estado; cancelar no equivale a detener coste externo. Resultado parcial útil con aviso de páginas no legibles. Reanudar no es volver a generar. Al terminar, CTA “Revisar Brand DNA”, no “Tu marca está verificada”.

- **Loading:** estado en cola/running/retry_wait, etapa textual; posibilidad de continuar manualmente con advertencia de trabajo en curso y cancelación separada.
- **Empty:** terminó sin datos extraíbles: “No encontramos información suficiente”; CTA manual, URL editable.
- **Error:** falló con resultado conocido: reintento solo si API lo declara seguro, o manual. `uncertain`: aviso persistente de resultado en comprobación, sin reenviar coste.
- **Success:** resumen “Borrador listo · {n} productos por revisar”; D04. Ningún dato se aprueba automáticamente.

## D04 — Brand DNA editable

Título, badge de versión y estado; cuatro grupos: identidad (nombre, web, descripción, idioma), visual (logo raster, HEX y fuente de catálogo), voz/audiencia, competidores opcionales. En desktop formulario de 2/3 + tarjeta resumen de 1/3; compacto una columna y resumen al final. Navegación por anclas de secciones, no tabs que oculten errores sin indicar su ubicación.

Cada dato detectado tiene origen y acción editar; desconocido vacío con label “Por completar”. No generar score de identidad. Logo pasa inspección antes de ready. Campos mínimos para aprobar: nombre, descripción, idioma, tono, público; fuente de catálogo por defecto identificada y color inicial explícitamente marcado como sugerencia. Web/logo/competidores no obligatorios para entrada manual. Colores de perfil no recolorean app.

“Guardar borrador” conserva sin aprobar; “Aprobar perfil” aparece como acción final con resumen, usando revisión guardada. Cambiar perfil aprobado crea borrador: badge “Borrador nuevo · aprobado v{n}”; generaciones existentes permanecen iguales. Foco y error en sección correspondiente. Guardado compara versión; conflicto mantiene campos y ofrece recargar o copiar contenido local, no mezclar silenciosamente.

- **Loading:** skeleton de formulario, sin campos aparentemente vacíos que inviten a sobrescribir.
- **Empty:** entrada manual con ayudas, ningún hecho inventado; completar mínimos.
- **Error:** validación por campo + resumen; upload rechazado; conflicto/versionado o red sin descartar cambios.
- **Success:** borrador guardado o revisión aprobada con textos distintos; CTA “Revisar productos”.

## D05 — Catálogo de productos

Header Productos y acciones “Añadir producto”, “Importar URL”; búsqueda por nombre, filtros Activos/Por revisar/Archivados. Cards con foto contain, nombre, estado y número de fotos ready; sin rating de “calidad” algorítmico que no existe en backend. Lista alternativa en móvil para nombres largos; cards de una columna, acciones visibles. Importados aparecen “Por revisar”, no listos por defecto.

Abrir ficha D06. “Usar en anuncio” elige producto activo con imagen ready y lleva D07; si falta, explicación enlaza ficha. Archivar por menú + confirmación si afecta disponibilidad futura; revisiones anteriores no desaparecen. No bulk edit, sync de tienda o CTA Shopify no implementados. Generar no exige cinco fotos: la recomendación de Holo no es nuestro requisito.

- **Loading:** cards skeleton; búsqueda/selección conservadas.
- **Empty:** inicial: “Añade tu primer producto” + alta/manual/import; filtros sin coincidencias: “No hay productos con estos filtros” + limpiar.
- **Error:** error de lista con reintento de lectura; productos previos visibles si se pueden conservar; no falsear lista vacía.
- **Success:** cards reales, toast auxiliar “Producto guardado”, estado persistente actualizado.

## D06 — Ficha de producto

Página o drawer ancho480 desktop; compacto página completa sin modal estrecho. Nombre, descripción, URL opcional, fotos y principal; origen importado revisable. Guardar explícito; subida no significa que la ficha ya esté guardada. Imágenes ready se pueden ordenar con botones subir/bajar/establecer principal además de drag opcional. Resultado de inspección individual visible. Cambiar fichero requiere asset nuevo.

“Guardar producto” valida datos; activar para generación requiere al menos nombre/descripción y una imagen ready. Si quedan fotos validándose, permitir guardar draft y explicar por qué todavía no se puede generar. Mantener al usuario en control de remover imágenes; la relación se elimina, el archivo histórico no se purga implícitamente. Guardar y volver conserva búsqueda/scroll en catálogo.

- **Loading:** detalle skeleton y uploads inspeccionándose con nombre por archivo.
- **Empty:** alta manual con zona de selección y botón “Elegir imágenes”; sin dependencia de arrastre.
- **Error:** tipo/tamaño/inspección/rechazo por archivo, campos y conflicto; no perder fotos válidas.
- **Success:** producto guardado draft/activo con estado veraz; CTA “Crear anuncio” solo si listo.

## D07 — Brief creativo

Formulario con producto (selector con resumen), DNA aprobado v{n}, objetivo del anuncio, mensaje/beneficio autorizado, tono y restricciones. Canal/formato es orientación de creativo, no conexión a plataforma ni promesa de publicación. Resumen de inputs a derecha, debajo en compacto. Si existe borrador de DNA nuevo, avisar qué revisión se utilizará y enlazar a revisarla; no bloquear si el usuario elige explícitamente usar versión aprobada válida.

CTA “Crear 3 conceptos”, con cota de operación textual y disponibilidad real antes de ejecutar. No generar imagen ni llamar a IA al cambiar un selector. Tres conceptos no son tres anuncios de pago. Datos de producto desactualizados se recargan/validan antes de submit. Brief se conserva al volver de D08; generar de nuevo crea lote distinto, no reemplaza anterior sin aviso.

- **Loading:** carga de inputs o envío; al aceptar, D08 muestra job; misma clave mientras el resultado de submit no se conoce.
- **Empty:** sin producto listo/DNA aprobado → checklist con enlaces específicos, no spinner infinito ni botón sin explicación.
- **Error:** brief insuficiente, cuota/coste no disponible o fallo de submit; conservar valores; no indicar cargo inexistente.
- **Success:** batch aceptado y tres conceptos cuando se confirmen; enlazar D08.

## D08 — Conceptos y copy

Tres cards: ángulo, titular, cuerpo, CTA y dirección visual. Selección de una mediante radios y botón “Continuar con este concepto”; editar texto inline o panel de card (misma semántica) y guardar cambios antes de D09. La UI no confunde miniaturas conceptuales con imágenes reales: fase solo texto y bloque “Imagen aún no generada”.

Desktop tres columnas si ancho útil permite mínimo240; 1024 dos; compacto una columna y selección/copy en lectura normal, sin swipe obligatorio. “Crear otros conceptos” es acción secundaria de nueva generación con coste confirmado; volver no vuelve a facturar. Fijar producto y DNA usados; imágenes previas no cambian si se edita copy después.

- **Loading:** 3 skeleton de texto con estado real; no titulares fabricados como resultado de IA.
- **Empty:** aún no hay lote → “Completa el brief para crear conceptos”; volver D07.
- **Error:** salida inválida/servicio/cuota se explica; error de una lectura reintenta sin generar; job uncertain sin botón nuevo hasta resolver.
- **Success:** conceptos reales editables, selección confirmada, CTA D09. No porcentaje de calidad o ganador ficticio.

## D09 — Generación de imágenes

Panel de configuración izquierda: concepto, referencias seleccionadas, Cuadrado/Vertical como destino, calidad disponible según backend y cantidad1–3. Cota máxima válida por imagen y total, moneda y resumen antes de confirmar “Generar N imágenes”. No selector libre de modelos no autorizados. Destino 1080×1080/1080×1920 no implica tamaño nativo de salida de API; recorte/ajuste se revisa en editor.

Galería derecha con resultado por trabajo: queued/running/ready/failed/uncertain/cancel_requested/cancelled. Una imagen por job; no exigir que todas terminen para usar una ready. Referencia no es output: borde/etiqueta distintos. CTA al seleccionar “Editar este anuncio”. Si la generación incluye un producto no fiel, ofrecer editar brief/referencias y crear otra con nuevo coste, sin decir que se puede corregir gratis. En compacto configuración arriba y resultados debajo.

- **Loading:** placeholders rotulados Generando, etapa y cancelar por job; nada de % ficticio.
- **Empty:** “Tu imagen aparecerá aquí” + resumen; generar explícito, no ejecutar al abrir.
- **Error:** fallo por resultado con causa/recuperación segura; conservar éxitos. Presupuesto ausente bloquea IA, no biblioteca/editor de assets propios.
- **Success:** imagen real validada con selección por radio, contexto y botón editar; ninguna publicación.

## D10 — Editor visual

Ver [especificación precisa](editor.md). Capas a izquierda, lienzo al centro, inspector a derecha; toolbar superior, título/contexto/estado guardado en header, zoom al pie. Selección única en V1. Texto, imagen y formas; no video, chat, timeline o funciones pagadas ficticias. Fondo generado y copy tipográfico separados.

CTA “Guardar versión”; Exportar abre D12 y exige revisión guardada. Salida de generación posterior queda disponible como nuevo asset sin sobrescribir el trabajo abierto. Compacto conserva toda capacidad mediante lista de capas y panel inferior en flujo; editor no se limita a una imagen de preview.

- **Loading:** shell estable, escena no interactiva hasta assets/fuentes listos; no modificar capas sobre un preview incompleto.
- **Empty:** documento sin capas con “Añadir texto” / “Añadir imagen”; fuente requerida ausente no se disimula con un anuncio inventado.
- **Error:** guardado/red/conflicto con escena conservada; asset/fuente fallidos bloquean export exacto hasta resolver; diagnóstico útil sin stacktrace.
- **Success:** “Versión {n} guardada”; export habilitado; los ajustes locales siguientes vuelven a “Cambios sin guardar”.

## D11 — Biblioteca

Cards de creativos guardados con preview contain, nombre, formato, versión, fecha y favorito. Barra de filtros soportados por A21: tipo, estado y favorito. Sin buscador global de biblioteca, porque A21 no define parámetro de texto; la búsqueda por nombre pertenece al catálogo A09. No se añaden contratos a Architect. Apertura D12; acción “Editar” D10; duplicar como crear nuevo documento mediante A20/A24 si se añade al menú, sin nuevo endpoint.

Desktop 3–4 columnas según mínimo240; compacto una. Cargar más por cursor accesible; no scroll infinito obligatorio. Mantener filtros/scroll al volver. Metadata permite favorito/archivar con A23; nada de Boards o Recently Deleted sin contrato. Archivar no borra outputs anteriores. Botón “Crear anuncio” siempre accesible.

- **Loading:** skeleton manteniendo filtros; al cargar más, solo indicador al final.
- **Empty:** inicial “Tu biblioteca empieza con tu primer anuncio” + Crear; cero coincidencias + limpiar; estado Archivados separado.
- **Error:** fallo de lectura con reintento, preserve tarjetas previas; thumbnails con fallback y nombre si URL temporal caduca.
- **Success:** lista de datos reales, favorito anunciado sin cambiar foco/orden durante interacción; regreso al mismo punto.

## D12 — Detalle y exportación

Detalle: preview, título, formato, revisión, fecha, producto/contexto y acciones Editar/Exportar PNG. No historial arbitrario de revisiones sin listado disponible; mostrar revisión actual y la que se ha abierto mediante ID conocido. “Exportar PNG” abre panel con revisión exacta, dimensiones y advertencia si hay cambios locales no guardados. Export en segundo plano sin IA; no depende de mantener pestaña abierta.

Desktop preview 2/3 + metadata1/3; compacto vertical. Panel export es modal560 desktop/página compacta; estados persistentes en detalle. Nunca “Publicar”. Descargar renueva URL vencida por A29 de manera segura; no vuelve a renderizar/generar por un enlace caducado. Descarga no muestra firma/credenciales al usuario.

- **Loading:** exportando revisión {n}, texto y cancelación solo cuando backend la permita; no mostrar PNG aún inexistente.
- **Empty:** sin export de esa revisión: “Prepara un PNG de esta versión”; hay acción Exportar, no descarga muerta.
- **Error:** render fallido con razón y retry de render seguro; no afecta imagen ni gasto IA. Si fuente/asset no disponible, volver editor.
- **Success:** “PNG listo · 1080×1080 · versión {n}” con datos reales y Descargar; si la escena cambió, aclarar que el PNG es de versión anterior.

## D13 — Cuenta y uso

Cuenta/email verificado y marca actual informativa; consumo real Usado/Reservado/Disponible, periodo y moneda del backend. Sin planes, precios ficticios, créditos comprables o gestión de equipo. Salir es acción secundaria. Borrado de workspace en sección separada, no CTA principal; confirma alcance, consecuencias y reautenticación. Estado deleting informa proceso, bloquea mutaciones y no promete purgar backups instantáneamente.

Desktop formulario máx640 y resumen; compacto una columna. No barras sin valores; un importe no disponible se muestra “No disponible”, no 0. Sincronización y correo con redacción mínima que ayude a decidir, sin detalles de infraestructura.

- **Loading:** skeleton de cifras, nunca saldo cero provisional.
- **Empty:** periodo sin uso real → “Aún no has generado contenido en este periodo”; valor cero solo confirmado.
- **Error:** no se puede consultar saldo; reintentar lectura; nunca ofrecer generación ilimitada por no cargar cuota.
- **Success:** cifras confirmadas, salida de sesión o recibo de borrado en progreso; borrar terminado elimina acceso a datos de ese workspace.

## 2. Transiciones globales y soporte

Loading no se convierte en empty hasta confirmar respuesta. Si expira sesión con cambios pendientes, pedir reautenticación y conservar memoria local si sigue abierta la página, sin prometer persistencia segura al cerrar. Revocación de permisos: salir del recurso y no mantener datos privados accesibles en caches compartidas. Error 404 no revela tenant ajeno. Manejo offline no equivale a app offline-first.

Todos los avisos ofrecen siguiente paso real: corregir campo, volver a un requisito, consultar un job, repetir una lectura, o contactar soporte con correlation_id no secreto si existe canal disponible. No añadir un chat de soporte ficticio. Costes/estimaciones y textos con variables solo se muestran con respuesta de servidor válida; estos documentos no fijan tarifas ni tiempos de generación reales.
