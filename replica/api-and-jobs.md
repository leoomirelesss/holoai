# API, generación asíncrona y contratos de flujo

Propuesta, no endpoints implementados. Fecha: 2026-10-26. Complementa [arquitectura](architecture.md) y [datos](data-model.md). Los endpoints son **nuestros**, no endpoints privados de Holo.

## 1. Reglas comunes

Base `/api/v1`; JSON validado por contrato versionado, límites de tamaño y listas de campos permitidos. Sesión de Supabase validada, membership activa y autorización de recurso en cada operación. Owner significa owner del workspace correspondiente. UUID conocido nunca otorga acceso. En V1 el único rol creado es owner; no se publican invitaciones ni gestión de roles.

GET devuelve DTO mínimo; no llaves, prompts internos, URLs duraderas de proveedor o stack traces. Listados paginados con cursor opaco y límite máximo propuesto 50. POST de trabajo responde **202** con job_id y status_url; no mantiene request abierta generando imágenes. PATCH/guardados usan `If-Match` de revisión; omitir produce 428 y versión incorrecta 409. DELETE de producto/creativo normalmente archiva; borrado duro es proceso distinto. Origen verificado y protección CSRF en mutaciones con cookies; GET nunca gasta IA ni modifica datos.

`Idempotency-Key` obligatoria en submit/import/conceptos/generación/export y bootstrap: misma clave, tenant y operación con mismo request_hash devuelve mismo resultado; distinto hash devuelve 409. Tabla jobs conserva la clave al menos durante la retención operativa y nunca se reutiliza automáticamente una clave antigua. Bootstrap usa `owner_user_id` y registro de solicitud en transacción con auditoría para no crear workspaces duplicados; no se basa en un job de marca inexistente. Cargas usan asset ID/nonce persistido único; operaciones de revisión tienen UNIQUE revisión/versión esperada para deduplicar. Se documentan ámbitos distintos: no se promete idempotencia universal de todos los proveedores.

Errores: 400 JSON malformado, 401 sesión no válida, 403 acción de rol prohibida, 404 recurso inexistente/no accesible, 409 conflicto, 413 tamaño, 415 formato, 422 datos semánticos, 429 cuota o rate limit (Retry-After cuando proceda), 503 dependencia no disponible. Estado de negocio de un trabajo fallido aparece en su GET, no como request HTTP colgada. Error expone code/message seguros, correlation_id y si es razonable reintentar; nunca oculta coste ambiguo como fallo gratuito.

## 2. Operaciones de negocio: 32

Todos los paths siguientes llevan prefijo `/api/v1`. Entrada/salida es contrato lógico, sin código ni esquema ejecutable.

| ID | Método y path | Quién | Entrada principal | Salida / efecto | Flujo Recon |
| --- | --- | --- | --- | --- | --- |
| A01 | POST /workspaces | Usuario verificado sin bootstrap equivalente | Nombre, clave idempotente | Workspace + owner membership; creación atómica | F01/S03 |
| A02 | GET /workspaces/current | Miembro | Contexto seleccionado validado | Workspace y permisos mínimos; nunca aceptar selección sin membership | F01/S05 |
| A03 | DELETE /workspaces/{workspaceId} | Owner, reautenticación | Confirmación explícita | 202 y recibo deletion_requested; tenant deshabilitado, proceso interno de borrado | Privacidad propia |
| A04 | POST /workspaces/{workspaceId}/brands | Owner | Nombre, URL opcional | Marca + revisión draft; sin análisis implícito facturable | F01/S04 |
| A05 | GET /brands/{brandId} | Miembro | ID | Marca, DNA draft/aprobado, revisión y estado | F01/S07 |
| A06 | POST /brands/{brandId}/imports | Miembro autorizado | URL, mode company/product, versión base; clave | 202 job de importación y website_import_id | F01/S04/S08 |
| A07 | PATCH /brands/{brandId}/profile | Miembro | Campos editables/evidencias, If-Match | Nueva revisión draft y ETag; invalida aprobación de esta nueva versión | F01/S07 |
| A08 | POST /brands/{brandId}/profile/approve | Owner | Revision ID, versión esperada | Revisión aprobada y actor/fecha; atómica | F01/S07 |
| A09 | GET /brands/{brandId}/products | Miembro | Cursor, texto y estado permitidos | Productos paginados | F01/S08 |
| A10 | POST /brands/{brandId}/products | Miembro | Nombre, descripción, URL opcional | Producto draft/activo según revisión; no importa sin A06 | F01/S08 |
| A11 | PATCH /products/{productId} | Miembro | Campos, status permitido, If-Match | Producto actualizado + ETag | F01/S08 |
| A12 | DELETE /products/{productId} | Owner | Versión esperada | Archivado; generaciones previas conservan snapshot | F01/S08 |
| A13 | POST /assets/uploads | Miembro | Brand ID, MIME, bytes, nonce | Asset pending y autorización temporal para ruta privada exacta | F01/F02/S08 |
| A14 | POST /assets/{assetId}/finalize | Miembro | ID y checksum esperado | 202 job de inspección; asset queda quarantine hasta ready | F01/F02 |
| A15 | POST /products/{productId}/assets | Miembro | Asset ready, posición y primary | Vínculo validado misma marca/tenant | F01/S08 |
| A16 | DELETE /products/{productId}/assets/{assetId} | Miembro | ID y versión de producto | Quita relación, no borra objeto; referencia histórica intacta | F01/S08 |
| A17 | POST /brands/{brandId}/concept-batches | Miembro | Producto, DNA aprobado, brief, count=3; clave | 202 job + batch; snapshots fijos | F02/S11 |
| A18 | GET /concept-batches/{batchId} | Miembro | ID | Batch, conceptos y estado de generación | F02/S11 |
| A19 | PATCH /concepts/{conceptId} | Miembro | Copy/ángulo/dirección, If-Match | Concepto actualizado; trabajos existentes conservan su snapshot | F02/S11 |
| A20 | POST /brands/{brandId}/creatives | Miembro | Título, concepto opcional, escena inicial/versión | Creativo y revisión draft; assets solo propios y ready | F02/S21/S22 |
| A21 | GET /brands/{brandId}/creatives | Miembro | Cursor, favorito/tipo/estado | Biblioteca paginada con thumbnails autorizados | F02/S21 |
| A22 | GET /creatives/{creativeId} | Miembro | Revisión opcional | Escena/revisión/contexto y estado; URLs privadas breves autorizadas | F02/S22 |
| A23 | PATCH /creatives/{creativeId} | Miembro | Título, favorito, saved/archived; If-Match | Metadata; no sustituye guardar escena | F02/S21 |
| A24 | POST /creatives/{creativeId}/revisions | Miembro | Documento de escena, versión base | Nueva revisión inmutable y ETag; valida todas las referencias | F02/S22 |
| A25 | POST /creatives/{creativeId}/generations | Miembro | Concepto/revisión, referencias, formato/calidad permitidos; clave | 202 job de imagen; reserva; resultado no sobrescribe una edición concurrente | F02/S12 |
| A26 | POST /creatives/{creativeId}/exports | Miembro | Revision ID exacta, format=PNG; clave | 202 job de render; sin IA; reutiliza export igual si ya existe | F02/S22 |
| A27 | GET /jobs/{jobId} | Miembro | ID | Estado, etapa, retry_after y resultados autorizados; sin detalles sensibles | F01/F02 |
| A28 | POST /jobs/{jobId}/cancel | Solicitante activo u owner | Motivo opcional | Cancelación solicitada; no promesa de detener/cancelar coste externo | F01/F02 |
| A29 | GET /assets/{assetId}/download | Miembro | ID y propósito permitido | Redirección/URL temporal de objeto ready; sin caché compartida | F02/export |
| A30 | DELETE /assets/{assetId} | Owner | Confirmación | Ocultar/archivar si referenciado; si no, purga asíncrona; 409 si se pide romper histórico activo | Privacidad/biblioteca |
| A31 | GET /workspaces/{workspaceId}/usage | Owner | Periodo permitido | Uso agregado, reservas y límite; no keys ni ledger global | S23/cuotas |
| A32 | GET /imports/{importId} | Miembro | ID | Propuestas extraídas, fuentes y errores editables; no aplica automáticamente un perfil aprobado | F01 |

Además hay dos rutas de transporte Auth fuera de estas 32: `GET /auth/callback`, que valida el intercambio y redirect permitido con SDK oficial, y `POST /auth/logout`, que revoca sesión con protección de origen. Registro, verificación de email, recuperación y acceso usan Supabase Auth mediante integración SSR, no endpoints de contraseña caseros. No se crea endpoint público de workers, redes, pagos o webhook de IA en V1. Trigger invoca tareas internas autenticadas por su plataforma; el contrato exacto de deployment se verificará antes de Build.

Borrado A03 devuelve recibo de workspace en modo deleting; UI consulta A02 mientras conserva sesión y owner, con DTO de estado sin datos creativos. Esta consulta excepcional de cierre no permite nuevas mutaciones. Tras purga, A02 devuelve ausencia; no se exige un job de marca ficticia para borrar el workspace.

## 3. Contratos de generación

### Importación de empresa/producto

Modo company usa raíz y como máximo 4 páginas adicionales del mismo sitio autorizado, incluyendo producto si se encuentra; sin crawling ilimitado. Propuesta inicial: hasta 10 fichas detectadas por import, sin garantizar que cualquier web permita detectarlas. Modo product acepta URL específica del mismo contexto y extrae nombre, descripción e imágenes. No usa navegador ejecutando JS en V1; sitios puramente client-side, protegidos o con login pueden requerir entrada manual.

El fetcher obtiene documentos mediante política de red de seguridad; normaliza texto/metadata y evidencias con URL y fecha. El modelo devuelve perfil estructurado con campos desconocidos explícitos; no los rellena con datos inventados. Los productos se guardan draft o como propuesta a revisar; nunca sobrescribir producto modificado por usuario ni perfil aprobado tras comenzar el job. A32 muestra propuestas y A07/A10 permiten aceptar/corregir. Una importación incompleta sigue siendo útil y reporta qué páginas fallaron.

### Conceptos

Entrada: revisión aprobada de DNA, snapshot de producto/activos y brief (objetivo creativo, canal de destino solo orientativo, tono y restricciones). Salida validada: tres conceptos con ángulo, titular, cuerpo, CTA y dirección visual. Claims sin evidencia se señalan; evitar métricas/testimonios o beneficios clínicos inventados. No dar herramientas, credenciales o acceso a red al LLM. Si el proveedor no ofrece salida estructurada para el modelo elegido, validar parsing y como máximo un intento de reparación con presupuesto explícito; nunca persistir JSON inválido como éxito.

### Imagen real

Entrada: concepto seleccionado, assets propios listos, configuración permitida y snapshot completo. La imagen constituye arte visual/fondo; el texto final es capa separada. Usar referencia/edición oficial cuando el modelo lo soporte. No declarar un espacio vacío con placeholder como resultado real. Tras respuesta: verificar bytes/MIME/dimensiones, persistir asset y miniatura y registrar modelo/request ID/usage. El job puede proponer una revisión nueva basada en la versión de inicio; si el usuario siguió editando, guardar resultado sin reemplazar su revisión actual, ofreciendo incorporación explícita.

### Exportación

Entrada: creative_revision_id, escena v1, fuentes de catálogo y activos de misma marca. Render en entorno fijado; no petición al proveedor de IA. Cache interna por hash de revisión+assets+fuentes+renderer+formato; el cache hit no re-renderiza ni gasta IA. Sin recursos remotos arbitrarios; navegador de render con red deshabilitada y assets suministrados internamente. Archivo final descargable y recuperable desde biblioteca. No reutilizar cache entre tenants solo porque coincida el hash.

## 4. Estado de trabajos y entrega

Tipos V1: `brand_import`, `asset_inspection`, `concept_generation`, `image_generation`, `creative_export`. Procesos de mantenimiento (borrado, outbox, conciliación) son tareas operativas, no jobs de marca expuestos.

Estados: queued → running → succeeded. Ramas: running → retry_wait → queued; running → uncertain; running/queued/retry_wait → cancel_requested → cancelled; running → failed. `uncertain` puede resolver a succeeded/failed/cancelled mediante conciliación, nunca mediante reenvío automático ciego. En espera de un proveedor con API de status verificada, la etapa puede ser `awaiting_provider` dentro de running; no se inventa soporte asíncrono nativo de una API que no lo tenga.

Cancelación terminal solo cuando no queda resultado que registrar/conciliar; si llegó un cargo o respuesta tardía, conservar usage y gestionar el output según borrado/consentimiento. Polling propuesto cada 3–5 segundos con backoff, pausa en pestaña oculta y 404 al perder membership. No SSE/WebSocket inicial; el trabajo continúa sin navegador.

Secuencia durable:

1. API valida sesión/tenant/inputs, DNA, producto, assets, rate limit y presupuesto. Transacción: snapshot + reserva + job + outbox. Responde 202 después de commit.
2. Dispatcher adquiere lease de outbox y dispara tarea con job ID y clave de dispatch. No transporta secretos, HTML ni prompts completos en mensajes de cola.
3. Worker carga DB, comprueba tenant activo, snapshot y lease; adquiere concurrencia. Antes de cada efecto externo verifica que el intento sigue vigente y que no hay cancelación.
4. Fija estado de envío **antes** de llamar al proveedor. Registra request ID si existe; solo usa idempotency key del proveedor si su contrato la garantiza para ese endpoint.
5. Respuesta válida se materializa primero en almacenamiento staging; transacción confirma salida/uso y finaliza job una sola vez. Un stale worker no puede confirmar tras perder lease.
6. Dispatcher confirma dispatched solo después de aceptación del runner. Si cae entre trigger y confirmación, puede repetir dispatch, pero DB bloquea una segunda ejecución efectiva.
7. Polling consulta DB; un reconciliador trata leases vencidos y resultados ambiguos. No asegura exactly-once de facturación externa: ver límite siguiente.

**Ventana crítica:** proveedor acepta una solicitud y el worker cae antes de guardar ID/resultado. La DB no puede saber si hubo generación/cargo. Marcar uncertain, mantener reserva y no volver a generar automáticamente. Consultar status solo si el proveedor lo permite; si no, conciliación de soporte y decisión informada del usuario. La deduplicación interna no evita por sí sola el gasto externo duplicado. Un lease vencido no autoriza automáticamente repetir una llamada en curso.

Reintentos por etapa: red antes de enviar, 429 o 5xx solo si el resultado no es ambiguo y el contrato permite repetir; backoff exponencial con jitter, respetando Retry-After. Máximo propuesto 3 intentos **totales**, no tres reintentos adicionales. Reintento de persistencia/render no repite IA. Error de cuota, credenciales, input o moderación no se reintenta sin corregir causa. SDK y runner sin reintentos implícitos contradictorios: configurar política explícita y registrar intento real. Deadline de imagen propuesto 10 minutos globales y timeout de red según modelo, no garantía de proveedor; conceptos 2 minutos y export 2 minutos son objetivos de configuración que deben medirse.

## 5. Mantenimiento y observabilidad

| Tarea | Disparador propuesto | Recuperación y criterio |
| --- | --- | --- |
| Dispatcher outbox | Aviso después de commit + barrido cada minuto si el plan lo soporta | Recuperar pendientes; leases; dead tras umbral, alarma y redrive autorizado |
| Conciliador | Cada 5 minutos | Leases vencidos, uncertain y reservas; no reiniciar IA sin conocer resultado |
| Limpieza | Cada hora | Pending/temporales vencidos y huérfanos confirmados; no eliminar assets referenciados |
| Cierre de uso | Al terminar job y revisión diaria | Comparar eventos y reservas por periodo con registros del proveedor cuando existan |
| Eliminación workspace | Petición A03 + reanudación programada | Deshabilitar, detener/aislar efectos, purgar y certificar lo pendiente de backup/proveedor |

Intervalos son decisiones propuestas, **no límites de planes verificados**. Antes de producción, confirmar scheduling, max duración, concurrencia, retención de logs, regiones y soporte Chromium en Trigger. Si no soporta el render con el entorno fijado, una tarea de render en contenedor gestionado es alternativa a evaluar y documentar antes de cambiar; no desplegarla silenciosamente.

Registrar correlation_id, job_id, tenant interno, etapa, intento, duración, modelo/config_version, request ID y métricas de coste sin contenido sensible. Alertas para jobs sin progreso, picos de error, outbox muerto, presupuesto desbordado, leases duplicados y export fallida. El estado de DB, proveedor y runner se pueden comparar, no asumir equivalencia. Redrive administrativo requiere permisos y auditoría.

## 6. Cobertura de las 15 filas must de Recon

| Funcionalidad must (nombre de CSV) | Cobertura arquitectónica |
| --- | --- |
| Importar web o introducir marca manualmente | A04/A06/A07/A32; extracción limitada y alternativa manual |
| Revisar y corregir Brand DNA antes de continuar | A07/A08; revisión aprobada obligatoria |
| Editar nombre web descripción e idioma | Documento de perfil y A07 |
| Gestionar logo colores y fuente | Perfil + assets privados + A07/A13/A14 |
| Definir tono y público objetivo | Perfil aprobado, snapshot y A07 |
| Cargar y editar productos o servicios | A09–A16; producto draft/activo |
| Importar producto individual desde URL | A06 modo product y A32; aceptación A10/A11 |
| Seleccionar activos de producto como referencia | A15 y validación de A17/A25 |
| Generar conceptos publicitarios sugeridos | A17–A19; tres conceptos y respuesta validada |
| Crear lote de imágenes desde referencia | A25 repetible con clave nueva para cada imagen; V1 un resultado por job, lotes por UI de tamaño acotado, sin prometer batch nativo |
| Revisar editar o regenerar prompts | A19, snapshot de A25 y nueva solicitud explícita; no chat universal |
| Mostrar progreso parar y agotar tiempo de generación | A27/A28, deadline y estado uncertain |
| Editar texto como capa tipográfica determinista | A24 y escena v1, sin depender del texto pintado por IA |
| Exportar una imagen como PNG | A26/A29, revisión fija y render sin IA |
| Organizar biblioteca por categoría y tipo | A21/A23; tipo inicial imagen/export y categoría ad; contrato extensible, sin categorías vacías de video/email |

Lote en V1: selección de uno a tres resultados; cada imagen se admite, reserva y ejecuta como job independiente con límites de concurrencia y cancelación propia. Tres conceptos no obliga a generar tres imágenes automáticamente. El usuario conoce cuántas imágenes y coste máximo de cada acción antes de autorizar.

## 7. Verificación futura necesaria, no ejecutada

Plan de aceptación: dos usuarios de tenants distintos sin acceso cruzado en DB/Storage/API; concurrencia de reserva; idempotencia submit/outbox/settlement; caída antes/después de proveedor; cancelación y respuesta tardía; bloqueo de SSRF en cada hop/imagen; extracción corrupta; inyección en página; producto incorrecto; JSON inválido/moderación; conflicto de editor; PNG dimensiones/fuentes/texto correctos; recuperación tras cerrar pestaña; limpieza y borrado reanudables.

No son pruebas ejecutadas ni garantías certificadas. No se han escrito tests, handlers o procesos en esta fase; solo contratos para revisión y posterior implementación autorizada.
