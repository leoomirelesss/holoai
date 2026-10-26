# Proveedores de IA, costes, seguridad y decisiones pendientes

Fecha: 2026-10-26. Propuesta documental de [arquitectura](architecture.md). No llamadas de generación, benchmark, cuenta creada, claves solicitadas, instalación, contrato o servicio configurado en esta fase.

## 1. Decisión de proveedor y alcance de evidencia

**Seleccionado inicialmente: OpenAI** para extracción asistida/conceptos mediante modelo textual y para generación/edición de imagen mediante API oficial. Se mantienen dos adaptadores pequeños, `texto estructurado` e `imagen con referencias`, que devuelven datos normalizados, usage y request ID cuando el proveedor los ofrezca. Es una elección para reducir integración y mantenimiento, no una afirmación de superioridad, menor precio o uso por parte de Holo.

Para el modelo textual se seleccionará un modelo vigente de coste bajo/medio que supere la validación de extracción y copy; salida estructurada y límites de tokens deberán verificarse en su contrato específico. Para imagen se seleccionará una versión disponible de la familia GPT Image, con soporte de las referencias/ediciones necesarias según modelo. **No fijar un ID en producción basándose solo en el nombre comercial o en una página general**: disponibilidad por cuenta, parámetros, endpoint, tamaño, calidad y versión son gates. Registrar el ID exacto y config_version en cada job.

| Opción | Qué se pudo contrastar públicamente | Coste y mantenimiento | Decisión |
| --- | --- | --- | --- |
| OpenAI | Guía de imagen documenta generación, edición, entradas de referencia, salida de imagen y límites de consistencia/texto/posicionamiento; costes dependen de modelo/calidad/uso | Un proveedor para texto e imagen reduce adaptadores y credenciales; no demuestra menor coste. Imagen no se factura necesariamente como tarifa plana universal | Primario V1 sujeto a cuenta/contrato y benchmark; no usar la herramienta de imagen del chat como sustituto de una API del producto |
| Gemini API (Google) | Guía oficial describe generación y edición de imagen y modelos disponibles; incluye requisitos/limitaciones y marcado SynthID | Alternativa para comparar calidad/coste; salida, tamaños y política dependen del modelo. Añade credencial, evaluación y comportamiento distintos | Segunda opción evaluada, sin fallback automático ni contratación |
| Proveedor especializado de imagen | No se consultaron contratos específicos en esta fase | Podría resolver mejor referencias o coste; necesitaría integración, licencia y observabilidad adicionales | No seleccionado sin evidencia; no se inventan capacidades de FLUX/Stability u otros |
| Modelos autohospedados | No se probó ningún modelo/licencia/runtime | GPU, capacidad ociosa, actualizaciones, seguridad, moderación y derechos de pesos/datos recaen en nosotros | Descartado en V1; revisar solo con volumen y ahorro total medido |
| Video y avatares | Recon confirma herramientas de Holo, no proveedores internos | Audio/video/avatar no quedan cubiertos por elegir un proveedor de imagen; derechos de voz/rostro y costes adicionales | Sin proveedor seleccionado ahora; evaluación específica futura |

No activar cascadas de proveedores ante fallos: un timeout puede haber tenido coste, y un fallback también cambia tratamiento de datos, moderación y resultado. Un cambio de proveedor requiere política de datos, presupuesto y aprobación del producto; la UI debe poder explicar qué modelo se utilizó. No garantizar fidelidad de logos, packaging o personajes por aceptar referencia.

### Criterios de aceptación antes de habilitar IA real

Prueba futura con 20 fichas/imágenes propias o licenciadas, seleccionadas para formatos, productos, idiomas y dificultades representativas. Este tamaño es diseño de evaluación, no muestra ejecutada ni garantía estadística. Medir: exactitud factual de DNA; campos desconocidos; fidelidad del producto; composición aprovechable; ausencia de texto inventado en imagen; legibilidad de copy como capa; moderación; p50/p95 de latencia; porcentaje de resultados aceptados y coste por aceptado. Definir umbrales con el usuario antes de decidir “aprobado”; no publicar puntuaciones inventadas.

Guardar configuración, inputs autorizados y evaluaciones versionadas; no reproducir outputs de Holo ni comparar contra su código privado. Reintentos que cambien resultado son nuevas generaciones con consentimiento y presupuesto, no correcciones gratuitas implícitas.

## 2. Modelo de costes sin precios inventados

No se publica una tabla en dólares porque **no se verificaron tarifas de planes, checkout, impuestos, descuentos ni costes efectivos de nuestra cuenta**. Las guías de APIs pueden mostrar ejemplos y tasas, pero no sustituyen una cotización de nuestros modelos/formatos/uso. Los créditos de Holo no se convierten en dólares ni se adoptan como economía del SaaS.

Variables que deberán registrarse antes de cualquier operación facturable:

| Variable | Definición verificable requerida |
| --- | --- |
| Pt_in / Pt_out | Precio vigente por unidad de tokens de texto para modelo/version elegidos |
| Pi | Función de coste de imagen: entrada textual/visual, salida, calidad, formato, caché si aplica y endpoint exacto |
| Phost / Pdb / Pjobs | Coste base y por uso de hosting, Supabase y runtime de tareas según planes reales |
| Ps / Pe | Almacenamiento por periodo y salida/transformación por volumen y región |
| Prender | CPU/memoria/tiempo/egress de exportación; no hay tarifa de IA por render |
| Pemail | SMTP y entrega transaccional para verificación/recuperación de cuenta |
| Retry / Accept | Intentos realmente facturados y tasa de resultado aceptado, observados en nuestras pruebas |

Coste por operación textual = unidades entrada × Pt_in + unidades salida × Pt_out. Coste de imagen = Pi(uso medido, parámetros, modelo), no “una imagen = X” sin contrato. Coste de una sesión = importación + conceptos + imágenes realmente solicitadas + render + persistencia/salida; múltiples imágenes y regeneraciones multiplican consumo. Incluir coste de consultas/páginas de import y de reintentos facturados. Coste por creativo aceptado = coste total de intentos / número de creativos aceptados; si no hay aceptados, no hay valor finito que anunciar.

Ejemplo de dimensionamiento **sin precios**: 100 usuarios × 20 sesiones/mes = 2.000 sesiones; con 3 imágenes solicitadas por sesión serían 6.000 solicitudes antes de reintentos. No implica 100 usuarios soportados ni cada sesión necesite tres imágenes. El presupuesto queda expresado por esas cantidades y variables anteriores, no por un total monetario ficticio.

Coste mensual total = bases de hosting/DB/jobs/email + consumo de texto/imagen + ejecución de workers/render + bytes almacenados + salida + observabilidad/backups + soporte. No contar dos veces componentes incluidos en un plan. Una exportación cacheada no repite generación y reduce CPU; no se promete coste cero porque puede haber salida y almacenamiento.

### Admisión, reserva y conciliación

Cuotas de beta administradas por workspace, sin venta de créditos. Cada llamada exige un presupuesto con moneda y periodo, modelo/config permitido y máximo conservador sustentado en contrato. Calcular máximo de texto mediante límites de entrada/salida y tarifa versionada. Imagen: limitar input bytes/tokens, cantidad, resolución/calidad y estimar límite superior **solo si el contrato lo permite**. Si no se puede establecer una cota suficientemente verificable, operación bloqueada hasta fijar presupuesto de riesgo autorizado; no tratar una media como máximo garantizado.

Reservar atómicamente antes de submit; settled + reserved + nueva reserva no debe superar límite. Registrar usage y coste real o estimado claramente; no fingir que siempre hay desglose completo. Si falta factura/usage conciliable, mantener coste conservador y estado pendiente. `uncertain` retiene reserva. Límite de admisión interno no garantiza límite de facturación externo: pueden existir cargos pendientes o sobrecostes no acotables, que requieren límites/alertas de cuenta y revisión. El presupuesto de plataforma debe limitar también el conjunto de workspaces.

Cliente no envía precio, saldo, descuento, modelo libre o tokens ilimitados. Reprecio solo con revisión de config y consentimiento antes de una nueva solicitud. Un cambio de tarifa no reescribe el ledger histórico. Facturación comercial futura en céntimos y moneda, separada de ledger de API en microunidades; no redondear cada cargo pequeño a cero.

## 3. Seguridad por frontera

### URLs, SSRF y extracción

El importador es la superficie de mayor riesgo. No basta con una regex ni comprobar que la URL contiene https:

- Solo HTTPS, puerto 443, sin userinfo; normalizar host/IDN, rechazar IPs literales y resoluciones a rangos privados, loopback, link-local, multicast, reservados y metadata, tanto IPv4 como IPv6 y direcciones mapeadas.
- Resolver y validar **cada salto y cada recurso**. Proteger contra DNS rebinding validando dirección efectivamente conectada con cliente/transporte que lo soporte; bloquear si el runtime no puede garantizarlo. Redirecciones manuales, máximo propuesto 3, sin credenciales y con nueva validación completa. Nada de seguir Location automáticamente tras una única validación.
- Política de egress del fetcher que bloquee redes internas además de la validación de aplicación. El worker con IA/Storage no debe ser un proxy de internet del usuario. Ejecutar fetch de contenido sin acceso a secretos de negocio ni metadata privilegiada; verificar aislamiento del runtime elegido antes de producción. Si no puede aislarse en Trigger, separar únicamente esa tarea en runtime gestionado restringido, con revisión del ADR.
- Empresa: máximo 5 páginas del sitio y no más de 10 productos propuestos por import como límites nuestros. Imágenes de CDN externas solo tras validación pública individual y permiso de origen previsto, no un comodín derivado de la web. No autorizar sitios/URLs para webhooks arbitrarios en V1.
- Límites propuestos: timeout 15 s por documento, 2 MB HTML descomprimido por página, 10 MB por imagen y 20 megapíxeles al decodificar; presupuesto total 60 s de fetch por import y techo de bytes acumulados. Cortar streaming al exceder límite; prevenir bombas de compresión y respuestas sin fin.
- Sin cookies del usuario, tokens del SaaS, headers internos o ejecución de scripts. No login, paywalls, crawling masivo o evasión; respetar las condiciones del sitio autorizado. El usuario declara que puede aportar esa información. No prometer importación completa de cualquier URL; entrada manual es parte funcional de V1.

Contenido externo no es instrucción: extraer texto como datos delimitados, sin herramientas de publicación, acceso a secretos o navegación autónoma del modelo. Validar resultado y registrar campo/fuente/confianza. No generar afirmaciones “verificadas” de una inferencia del LLM. Escape de texto, sanitización y no renderizar HTML bruto de terceros en la app.

### Archivos y renderer

Subidas directas a una ruta privada temporal de asset pending; nonce y nombre UUID generado, sin path del usuario. Inspección del contenido real (MIME/sniff/decode/dimensiones), checksum, cuota y derechos antes de ready. V1 acepta PNG/JPEG/WebP, no SVG, HTML, PDF, archivos comprimidos ni fuentes aportadas por usuario. El logotipo SVG requerirá conversión segura futura; no interpretarlo en navegador con privilegios. El límite propuesto coincide con importación (10 MB/20 MP), sin atribuirlo al plan Storage.

Re-encode de raster, orientación consistente y eliminación de metadata no necesaria para privacidad **sin retirar marcado/procedencia exigidos por proveedor o ley**. Antes de elegir re-encode, verificar que no destruye marcas obligatorias; si existe conflicto, conservar output original privado y generar derivado permitido, o bloquear esa transformación. Moderación en proveedor y control de derechos propio; no asegurar que una API garantiza cumplimiento de publicidad.

Renderer solo recibe escena validada y assets propios listos; sin JS/HTML, URLs externas o fonts arbitrarias; red deshabilitada, límites de CPU/memoria/tiempo, navegación controlada y fuentes empaquetadas licenciadas. Downloads firmadas breves, no públicas ni guardadas en documentos. Verificar CORS/tainted canvas de previews, no solucionarlo con un proxy abierto. Caducidad propuesta de URL de descarga 5 minutos; depende del SDK/plan, a comprobar.

### Identidad, aislamiento y secretos

Ver [políticas de datos](data-model.md): RLS + grants mínimos + DAL con autorización + FKs compuestas. RLS no protege peticiones realizadas con service key; el backend privilegiado valida cada job/objeto. No service key ni API key en `NEXT_PUBLIC_*`, payloads del cliente, enlaces, logs o GitHub. No keys del usuario final en V1; claves de proveedor operadas en servidor, rotación y proyectos separados por entorno.

Verificar firma/expiración del JWT y membership actual; no fiarse de metadata o user del cookie. Sesiones y DTOs de tenant sin caché compartida; CSP y escape de texto; controles Origin/CSRF y allowlist de redirect. Owner reautentica antes de borrado; revocar cuenta impide nueva ejecución. Rate limiting persistente por usuario/workspace y límite global para admisión; no contador en memoria de una función web. Objetivos iniciales: 5 submits de IA/minuto/workspace y 2 imports/minuto/workspace, además de presupuesto/concurrencia; son política propia por validar, no promesas de proveedor.

### Datos y auditoría

Minimizar contenido enviado al proveedor: solo brief y activos autorizados necesarios, sin cookies o datos de clientes extraídos de formularios. Tokens OAuth de redes no existen en V1. Deben verificarse DPA, residencia, retención, uso para entrenamiento, subprocesadores y derechos comerciales de cada proveedor antes de habilitar producción; no copiar la promesa comercial de Holo como nuestra política.

No garantizar confidencialidad de terceros basándose en publicidad. Logs sin prompts/imágenes por defecto, error bodies filtrados, trace IDs. Especificar borrado operativo y de backups por contrato; no decir “borrado inmediato de todas las copias” si el proveedor las retiene. Export de anuncio PNG es distinto de una portabilidad integral de cuenta, que requiere procedimiento adicional y validación futura. Auditoría y ledger no almacenan creativos y se eliminan/anonimizan según política y obligación aplicable.

## 4. Registro de fuentes técnicas

Consultas de lectura pública realizadas el 2026-10-26. No sustituyen pruebas de compatibilidad o credenciales. Se inspeccionaron los apartados relevantes; no se ejecutaron ejemplos de código. HTTP 200 y lectura textual de las ocho páginas técnicas P01–P08; Recon se enlaza en los documentos principales:

| ID | URL oficial | Evidencia usada y límite |
| --- | --- | --- |
| P01 | https://nextjs.org/docs/app/guides/data-security | Recomienda DAL servidor, autorización y DTOs; Server Actions/handlers no equivalen a autorización automática |
| P02 | https://supabase.com/docs/guides/database/postgres/row-level-security | RLS, roles y grants; service_role y vistas pueden saltar RLS; habilitar políticas no corrige grants excesivos |
| P03 | https://supabase.com/docs/guides/storage/security/access-control | Control de Storage por políticas; service key tiene acceso sin RLS |
| P04 | https://supabase.com/docs/guides/auth/server-side/nextjs | SSR, cookies, validación de claims/usuario y riesgo de cachear sesiones; no confiar en getSession para autorización |
| P05 | https://trigger.dev/docs/tasks/overview | Tareas, colas/concurrencia, retries configurables y handle; no se verificó pricing o entorno Chromium/planes |
| P06 | https://platform.openai.com/docs/guides/image-generation | Generación/edición, formatos, parámetros por modelo; limitaciones de texto, consistencia y composición; usage y costes variables; no prueba acceso a nuestra cuenta |
| P07 | https://ai.google.dev/gemini-api/docs/image-generation | Generación/edición y modelos con restricciones y SynthID; no se probó calidad ni precio por resultado |
| P08 | https://konvajs.org/docs/react/index.html | Primitivas React/Canvas y ejemplos de edición/export; no es garantía de editor completo o compatibilidad del worker |


Enlaces para verificación futura, **no tarifas consultadas/aplicadas**: https://supabase.com/pricing ; https://vercel.com/pricing ; https://trigger.dev/pricing ; https://openai.com/api/pricing/ ; https://ai.google.dev/gemini-api/docs/pricing . Confirmar también SMTP y backups. Antes de Build, registrar fecha, plan/región, unidad, modelo, impuestos si aplican, precio y política de cambio; no rellenar esos valores por aproximación.

## 5. Registro de decisiones y pendientes

| ADR | Decisión seleccionada | Motivo | Condición que justificaría revisarla |
| --- | --- | --- | --- |
| ADR-01 | Monolito modular Next/TS | Equipo pequeño y un flujo de valor; menos despliegues | Límites medidos o equipo/servicio que requiera aislamiento real |
| ADR-02 | Supabase DB/Auth/Storage | Un sistema de identidad/tenant y archivos privados | Región, compliance, egress o coste total verificado que no encaje |
| ADR-03 | DAL + RLS + funciones transaccionales, sin ORM inicial | Menos rutas de acceso y coherencia tenant | Complejidad real de consultas/migraciones que justifique Drizzle sin debilitar RLS |
| ADR-04 | Trigger.dev para jobs con DB como autoridad | Operación gestionada y reintentos controlados | Falta de aislamiento/renderer, límites o coste del plan; evaluar worker gestionado alternativo |
| ADR-05 | OpenAI inicialmente, Gemini alternativa | Integración simple y APIs de imagen documentadas | Fallo de fidelidad, coste, permisos o política de datos en benchmark propio |
| ADR-06 | Escena propia + texto determinista + PNG server-side | Control y reproducibilidad, sin depender de exactitud textual de IA | Requisitos de edición más amplios que el editor acotado pueda sostener |
| ADR-07 | Sin microservicios/billing/redes/video en V1 | Reducir dependencias y efectos externos | Nuevo alcance explícitamente autorizado y caso económico validado |

Pendientes que no bloquean aprobar el diseño pero sí habilitar producción: tarifas y límites de cuenta; modelos/versiones; formato de referencia; permisos comerciales/retención; runtime renderer y egress seguro; SMTP/entrega; región y backups; presupuesto beta; umbrales de evaluación; política pública de privacidad; capacidad/roles concretos de despliegue. No requieren que el usuario envíe secretos por chat ahora.

## 6. Evidencia de lo realizado y punto de control

Se leyeron los dos archivos completos de Recon, la skill/template de Architect y las secciones técnicas indicadas. Solo se generaron cuatro Markdown de arquitectura. No hay SQL, migraciones, componentes, endpoints, tests o servicios creados. La validación actual es documental: enlaces relativos, conteos, coherencia de tablas/rutas, conservación de Recon y diff de Git; no se declara que la arquitectura corra o escale sin pruebas.

Esta propuesta queda publicada para revisión en GitHub. No se inicia Design, Build o configuración de proveedores; se espera aprobación del usuario.
