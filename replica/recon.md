# Holo AI — Recon de una alternativa original (web)

Fecha de consulta: **2026-10-26**, America/Mexico_City. Fase: **solo Recon**.
Alcance: funcionalidades, Brand DNA, análisis web, anuncios, imagen, video, interfaz documentada, automatizaciones y dependencias para un producto propio. Destinatario: nuestro equipo; segmento comercial final aún no definido.

## 1. Conclusión ejecutiva

Holo se presenta como un departamento de marketing automatizado. La documentación pública describe un ciclo concreto: alta de marca → Brand DNA y catálogo → activación de canales → ideas y estrategia → generación → revisión/edición → biblioteca → descarga, programación o publicación → reportes y aprendizajes. No es únicamente un generador de anuncios: combina producción multimodal con organización, distribución y optimización.

Los diferenciales funcionales documentados son el contexto de marca reutilizado, múltiples métodos de creación a partir de referencias o URLs, revisión por guardar/descartar, edición conversacional, automatización social configurable y estrategia publicitaria conectada a Meta. Son **capacidades descritas oficialmente**, no resultados de pruebas realizadas por nosotros. No hemos verificado calidad de salida, rendimiento, fiabilidad, latencia ni equivalencia entre documentación y cuenta real.

Podemos construir el perfil, catálogo, composición, biblioteca, revisión y orquestación como software propio. Generar texto, imagen o video requiere modelos autorizados; una API es una opción, autohospedarlos otra. Publicar y medir en redes exige APIs oficiales, permisos y revisión de las plataformas. Los modelos internos, costes y arquitectura privada de Holo no se conocen.

Recomendación de Recon: comenzar por un único flujo de una marca, **URL propia o entrada manual → Brand DNA aprobado → producto → conceptos → imagen real → texto editable → PNG**. Es una propuesta nuestra, no una afirmación de que el flujo de Holo sea idéntico. Video, automatización de gasto y distribución multicanal aumentan notablemente el alcance. No se ha seleccionado stack ni proveedor ni iniciado Architect.

## 2. Método, evidencia y restricciones

- **Documentado:** comportamiento descrito en ayuda oficial leída. Confianza alta en que la documentación lo declara; disponibilidad y calidad práctica pendientes.
- **Claim comercial:** afirmación leída en landing/precios; no demuestra funcionamiento o resultado. ROAS, CTR, crecimiento, reseñas, número de conexiones y premios no se adoptan como hechos independientes.
- **Observado públicamente:** contenido textual y enlaces de páginas consultadas. No equivale a inspección visual de interfaz.
- **Inferido:** responsabilidades o entidades deducidas de flujos documentados, con confianza explícita; nunca stack privado.
- **Propuesta propia:** recomendación para nuestra alternativa. No atribuible a Holo.
- **Pendiente:** sin evidencia suficiente. Se conserva como desconocido, no como ausente.

Lectura dirigida, manual, de HTML público y de las versiones Markdown que ofrece la propia documentación. Sin crawling masivo, bundles, código privado, tráfico de la aplicación, cuentas, compras ni campañas. No se descargaron capturas ni se reutilizaron activos protegidos. No hay navegador visual disponible: interfaz, navegación y estados se describen **desde documentación**, no desde una sesión interactiva.

El acceso antes bloqueado quedó restablecido: `curl -I` devolvió 200 para sitio y docs; después se leyeron sus cuerpos con GET y TLS verificado. El error inicial del arranque del entorno fue transitorio; la ejecución posterior y ambas consultas funcionaron. No hace falta volver a solicitar la misma habilitación de red.

Los términos T01 §6.1 restringen ingeniería inversa/extracción de componentes, scraping masivo y uso de Services/Inputs/Outputs para desarrollar un servicio competidor. Por ello no se utiliza una cuenta ni se generan outputs en Holo para este proyecto. El trabajo se limita a lectura pública y análisis funcional original. No se presenta una interpretación jurídica definitiva ni una autorización contractual para reutilizar sus materiales.

## 3. Registro de fuentes

Todas las fuentes siguientes se consultaron el 2026-10-26. Los identificadores enlazan las afirmaciones de este documento y `features.csv` con su origen. No se afirma haber leído todo el centro de ayuda: se seleccionaron artículos de cada área solicitada; algunos detalles secundarios y los videos incrustados no se inspeccionaron.

| ID | Fuente | URL | Alcance de evidencia |
| --- | --- | --- | --- |
| M01 | Inicio | https://tryholo.ai/ | Marketing; contenido HTML público leído, sin evaluación visual. |
| M02 | Precios | https://tryholo.ai/pricing | Marketing; comparación de planes; importes animados/promocionales no validados en checkout. |
| T01 | Términos | https://tryholo.ai/policies/terms-of-service | Texto público; secciones 6, 7 y 8 revisadas; última actualización indicada: 2026-08-07. |
| D00 | Bienvenida | https://docs.tryholo.ai/ | Describe motor de marketing; contiene un enlace Start Creating roto. |
| D01 | Índice documental | https://docs.tryholo.ai/llms.txt | Localización de artículos públicos; no equivale a haber leído todos los artículos. |
| D02 | Onboarding | https://docs.tryholo.ai/getting-started/onboarding.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D03 | Activation Checklist | https://docs.tryholo.ai/getting-started/activation-checklist.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D04 | Brand Overview | https://docs.tryholo.ai/brand-dna/overview.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D05 | Integrations | https://docs.tryholo.ai/brand-dna/integrations.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D06 | Catalogue | https://docs.tryholo.ai/brand-dna/catalogue.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D07 | Create Image | https://docs.tryholo.ai/creation-methods/image/create-image.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D08 | Create Video | https://docs.tryholo.ai/creation-methods/video/create-video.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D09 | AI UGC | https://docs.tryholo.ai/creation-methods/video/ai-ugc.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D10 | Ads Overview | https://docs.tryholo.ai/ads/ads-overview.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D11 | Ads Manager | https://docs.tryholo.ai/ads/ads-manager.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D12 | Reports | https://docs.tryholo.ai/ads/reports.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D13 | Learnings | https://docs.tryholo.ai/ads/learnings.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D14 | Manage Socials automations | https://docs.tryholo.ai/socials/manage-socials-automations.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D15 | Socials Calendar | https://docs.tryholo.ai/socials/socials-calendar.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D16 | Edit & Enhance | https://docs.tryholo.ai/library/edit-and-enhance.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D17 | Publish & Share | https://docs.tryholo.ai/library/publish-and-share.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D18 | Image | https://docs.tryholo.ai/creation-methods/image.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D19 | Video | https://docs.tryholo.ai/creation-methods/video.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D20 | Emails Overview | https://docs.tryholo.ai/emails/emails-overview.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D21 | SEO publishing | https://docs.tryholo.ai/seo/connect-your-website-for-seo-publishing.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D22 | SEO Webhooks | https://docs.tryholo.ai/seo/seo-webhooks.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D23 | Credits | https://docs.tryholo.ai/account-and-billing/credits.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D24 | Team | https://docs.tryholo.ai/settings/team.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D25 | Brands | https://docs.tryholo.ai/settings/brands.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D26 | Chat with Holo | https://docs.tryholo.ai/getting-started/chat-with-holo.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D27 | URL to Image | https://docs.tryholo.ai/creation-methods/image/url-to-image.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D28 | Image Carousel | https://docs.tryholo.ai/creation-methods/image/image-carousel.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D29 | Image to Video | https://docs.tryholo.ai/creation-methods/video/image-to-video.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D30 | Video Clone | https://docs.tryholo.ai/creation-methods/video/video-clone.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D31 | URL to Video | https://docs.tryholo.ai/creation-methods/video/url-to-video.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D32 | Translate Video | https://docs.tryholo.ai/creation-methods/video/translate-video.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D33 | Common issues | https://docs.tryholo.ai/troubleshooting/when-holo-gets-stuck-fixes-for-common-issues.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D34 | Connect Meta | https://docs.tryholo.ai/ads/connect-meta.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D35 | Advertising Goal | https://docs.tryholo.ai/ads/setting-your-advertising-goal.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D36 | Create Ads | https://docs.tryholo.ai/ads/create-ads.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D37 | SEO Overview | https://docs.tryholo.ai/seo/seo-overview.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D38 | SEO Analytics | https://docs.tryholo.ai/seo/seo-analytics.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D39 | Organize & Filter Assets | https://docs.tryholo.ai/library/organize-and-filter-assets.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D40 | Email Creation Tools | https://docs.tryholo.ai/emails/email-creation-tools.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D41 | Image Variations | https://docs.tryholo.ai/creation-methods/image/image-variations.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D42 | Clone | https://docs.tryholo.ai/creation-methods/image/clone.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D43 | Translate Image | https://docs.tryholo.ai/creation-methods/image/translate-image.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D44 | Video Variations | https://docs.tryholo.ai/creation-methods/video/video-variations.md | Documentación pública leída; no prueba de ejecución en una cuenta. |
| D45 | Login | https://docs.tryholo.ai/account-and-billing/login.md | Documentación pública leída; no prueba de ejecución en una cuenta. |

Las versiones locales del starter y las 12 skills están presentes. Se aplicaron `holo-replica` y `replica-recon`; ninguna otra fase. El starter se usó como orientación y no como evidencia de funcionalidades. No se encontró un changelog o referencia general de API navegando las fuentes seleccionadas; esto no demuestra que no existan. D22 sí es un contrato público de webhooks SEO. No se localizaron ni observaron aplicaciones móviles nativas.

## 4. Funcionalidades y herramientas

### 4.1 Alta, análisis web y Brand DNA

D02 documenta seis pasos: URL —o botón **Don't have a website** para entrada manual—; canal principal Ads/Socials/Emails; análisis; confirmación de Brand Identity, Visual Identity y Voice & Audience; productos; invitación opcional al equipo. Exige al menos un producto para continuar. Importa automáticamente **hasta 10 productos** y permite URL de producto o alta manual del resto. Recomienda cinco fotos por producto; es recomendación, no requisito observado. No documenta profundidad de rastreo, páginas máximas, parser, fuentes externas o motor de inferencia.

D04 desglosa cuatro áreas del perfil:

| Área | Campos/controles documentados | Papel funcional |
| --- | --- | --- |
| Brand Identity | Nombre, web, descripción, idioma | Contexto factual y localización |
| Visual identity | Colores, logo, fuente | Consistencia visual declarada |
| Voice & audience | Tono y cliente ideal | Personalización de copy |
| Competitors | Revisar, quitar, añadir y ampliar sugerencias | Contexto competitivo |

D06: catálogo de productos **y servicios**, nombre, descripción, imágenes y URL opcional; búsqueda, importación rápida y panel lateral para edición; indicador de calidad basado en información aportada. Los productos también pueden agrupar categorías o campañas, no solo SKUs. La fidelidad perfecta no está garantizada: D33 reconoce mezcla de productos y pérdida de contexto.

### 4.2 Anuncios, estrategia e imagen

D34 conecta Meta mediante autenticación externa; selecciona página, cuenta publicitaria y pixel opcional, importa datos y permite estilos Conservative/Balanced/Aggressive. Segmentación documentada por países; **no ciudades ni radios**. D35 define objetivo comercial, KPI CPA/CPL/ROAS y meta a cuatro semanas. D10 organiza tareas en To Do/In Progress/Done y ofrece Launch Campaign cuando está completa la preparación.

D36: conceptos sugeridos con ángulo, descripción y formato imagen/video; herramientas Create New; inspiración Competitor Ads y Clone. La existencia de una galería no concede derechos sobre los ejemplos ni demuestra que su rendimiento esté auditado.

| Método de imagen | Entradas y resultado descritos | Fuente |
| --- | --- | --- |
| Create Image | Referencia de producto, subida, imágenes o biblioteca; formato y cantidad; prompts editables; lote para guardar/descartar | D07 |
| URL to Image | Página de producto → extracción revisable de nombre/descripcion/fotos → formato/cantidad → prompts → imágenes | D27 |
| Image Carousel | Referencia, proporción, número de slides y prompt → carrusel | D28 |
| Image Variations | Diseño de referencia, producto y sus activos → nuevas versiones | D41 |
| Clone | Plantillas por nicho o referencia propia → adaptación al producto y marca | D42 |
| Translate Image | Imagen y uno o varios idiomas → reemplazo del texto conservando diseño, según docs | D43 |

D07 y D27 enumeran Square, Feed, Story y Landscape, sin fijar aquí dimensiones de píxeles. La cantidad es configurable: **no está confirmado un lote fijo de tres conceptos**. Guardar con corazón añade a Library; descartar es parte del flujo de selección. El supuesto aprendizaje a partir de preferencias es una declaración del producto, no evidencia de entrenamiento de pesos.

### 4.3 Videos publicitarios y UGC

| Método | Capacidad documentada | Límites / desconocidos |
| --- | --- | --- |
| Create Video | Referencia imagen/video; ratio, duración y cantidad; guiones sugeridos/editables; lote de conceptos | D08; sin catálogo completo de duraciones o resolución |
| Image to Video | Animar imagen de producto con movimiento, escenas y guion | D29; no se probó estabilidad del producto |
| URL to Video | Extraer página de producto, revisar datos, ajustar formato/duración/cantidad y elegir guion | D31; no se conoce cobertura de sitios |
| Video Clone | Video propio/biblioteca, producto y guion; nuevas versiones conservando estructura/ritmo/estilo según docs | D30; entradas MP4/MOV/WebM |
| Video Variations | Video, producto/activos, duración y formato; cambios de enfoque | D44; subida hasta 50 MB; no extrapolar límite a otros métodos |
| Translate Video | Traducir audio hablado conservando visuales | D32; no afirma aquí clonación de voz propia, lip-sync o traducción de subtítulos |
| AI UGC | Actor con previsualización de voz; duración/ratio/cantidad; imagen de referencia opcional; idea o guion propio | D09; resultado aprobado MP4 en Library, edición vía chat, descarga o publicación |

No se identificaron proveedores internos, modelos, resolución máxima, control de semillas, número de actores, duración máxima o garantías de audio. Un avatar que habla no demuestra que el usuario pueda clonar su voz o crear avatares personalizados. La calidad “realista” es una caracterización oficial sin evaluación propia. Nuestra alternativa no debe fabricar testimonios de clientes ni usar voces/rostros sin derechos.

### 4.4 Chat, edición y biblioteca

D26 sitúa **Ask Holo anything...** en Home. El chat genera texto, imagen y video, edita, cambia fondos/colores/texto, redimensiona, propone variaciones, consulta catálogo y programa posts. Admite hasta **3 imágenes adjuntas**. Guarda conversaciones con título y miniaturas en sidebar. Creative Chat Mode coloca activo a la izquierda y conversación a la derecha, con historial por creativo. Tiene estados de progreso, botón Stop y timeout automático tras **10 minutos**.

D16 confirma edición mediante lenguaje natural; no confirma un editor de capas tipográficas, timeline multipista, curvas o edición vectorial. No confundir “cambiar texto por chat” con texto determinista realmente editable. Ese control sería una propuesta diferencial nuestra.

D39 documenta filtros por categoría/tipo, Favorites, Boards con nombre/portada y Recently Deleted. No especifica plazo de retención ni confirma en el artículo leído una acción de restauración. D17 permite Publish como Ad o Social Post, canal conectado, caption generado/manual, preview y fecha/hora. D09 confirma MP4 para UGC; no hay prueba de un catálogo universal de formatos descargables de imagen.

### 4.5 Socials y automatizaciones

D15: calendario mensual; estados Needs review, Needs approval, Scheduled y Published; placeholders de ideas futuras y preparación habitual de una a dos semanas. Se puede revisar/regenerar tema, crear post, editar visual/caption, cambiar horario y aprobar. Publicar/programar exige conectar el canal; **recibir y revisar ideas no**. Un post programado puede reprogramarse o cancelarse; al cancelar vuelve a Review. Alta manual con + Add, selección de activo, plataformas, tipo, caption y horario.

D14 separa tres controles por canal: generación de ideas (cada lunes, frecuencia y formatos); generación de posts; aprobación y programación automáticas. Esta última exige cuenta conectada y generación automática activa. Desactivar ideas apaga las otras automatizaciones, pero **no elimina ideas ni posts ya programados**. Los cambios de frecuencia afectan ideas futuras. Existe automatización conjunta Instagram + Facebook.

### 4.6 Email, SEO, reportes y equipo

- **Email:** Unlock Emails genera ideas sin exigir conexión externa; categorías, asunto, resumen y longitud recomendada. Swipe, Variations, Clone, URL to Email y Translate Email están descritos. La salida confirmada por D20 es **HTML descargable** para usar en una herramienta de email. No se comprobó envío directo, sincronización de listas o conector Klaviyo/Gmail, aunque el marketing sugiera más cobertura (D03/D20/D40).
- **SEO:** D37 describe objetivo, estrategia de 30 días, keywords, aprobación, tablero, metadata title/description/slug, calendario y seguimiento. D21: WordPress.com, WordPress self-hosted, Shopify o embed para sitio propio; un destino SEO activo por marca, reemplazado al cambiar. WordPress self-hosted requiere HTTPS, versión 5.6+ y application password; Shopify exige blog y permisos `read_content`/`write_content`.
- **Webhook SEO:** D22 documenta publicación/actualización a un HTTPS controlado por el usuario, autenticación bearer o HMAC, test y payload de artículo. Menciona Zapier/Make/n8n como receptores posibles. Es un contrato público específico, no evidencia de API general de generación ni de miles de conectores nativos.
- **Métricas:** D11 muestra gasto, leads, CPL, ROAS y gasto diario. D12 reportes diarios/semanales/mensuales, condicionados a datos suficientes y conexión activa; mes del objetivo normalmente de cuatro semanas, no necesariamente mes natural. D13 aprendizajes Winner/Loser de tests concluyentes, guardados por marca para próximas estrategias. **D38 declara que los datos SEO son estimaciones y no proceden directamente de Google Search Console.**
- **Organización:** D25 separa DNA, productos, estrategia, integraciones y biblioteca por marca. D24 permite invitación y roles Owner/Member con acceso asignado por marca; no se verificó colaboración en tiempo real. D45 documenta Google, código de email y contraseña, con reenvío de código tras 120 s.

## 5. Comercial, contradicciones e incertidumbres

| Tema | Evidencia contrastada | Conclusión de Recon |
| --- | --- | --- |
| Marcas por plan | D25: Starter 3, Scale 5, Agency ilimitadas; M02: Starter 1, Scale 3 | Fuentes oficiales incompatibles; confirmar condiciones del plan antes de comparar valor |
| Créditos diarios | D23: 5 al iniciar sesión, vigencia 24h; M02 tabla excluye free daily grants de Starter pero su tarjeta incluye créditos diarios | No prometer cuota neta basándose en una sola página |
| Acumulación/caducidad | D23 presenta reglas distintas según ciclo, top-ups y cancelación; M02 promete rollover y su tabla limita Starter | Políticas requieren aclaración; no extrapolar número garantizado de creaciones |
| Precio efectivo | M02 mezcla mensual/semestral, promoción y números animados | No se verificó importe en checkout ni se compra. Créditos no son coste real de proveedor ni todos equivalen a una creación |
| Coste por acción | D23: mayoría de acciones básicas 2 créditos; ejemplo de video 10s/17 créditos; T01 §7.1 permite cambios con coste previo | Cifras documentadas, no presupuesto propio ni garantía universal |
| Revisión humana | M01 dice que nada sale sin aprobación; D14 permite autoaprobación activada por el usuario | La aprobación es configurable; diseñar el consentimiento con precisión |
| Uso de datos | M01/M02 afirman no entrenar; T01 §8.4 concede licencia amplia para desarrollar/entrenar/mejorar con Inputs/Outputs/datos de uso | Discrepancia material, no prueba técnica de que se entrene. No compartir información sensible sin aclararla |
| Privacidad absoluta | M01 afirma que ni Holo ni terceros acceden a archivos; T01 §8.2 y §8.4 permiten procesamiento por proveedores | No convertir claim en garantía de aislamiento criptográfico |
| Derechos del resultado | M02 habla de propiedad; T01 §7.2–7.4 y §8.3 no garantizan exclusividad, originalidad o protección | Derechos/licencias y revisión importan más que promesa de “todo es tuyo” |
| Integraciones | M01 anuncia 1.000+; M02 cita Slack/Gmail; D05 lista plataformas concretas | Solo las listadas en ayuda se consideran documentadas; envío de email y conectores extra siguen sin validar |
| Calidad generativa | M01 promete resultados consistentes; D33 reconoce deriva, mezcla de productos y variación entre sesiones | Riesgos reconocidos oficialmente, no bugs reproducidos por nosotros |
| Guardado de catálogo | D02 dice autosave; D06 indica Save en panel | Puede depender de pantalla/versión. UX real pendiente |
| Certificaciones/resultados | M02 menciona SOC 2; M01 muestra métricas y testimonios | No se consultó auditoría ni verificó causalidad; no reproducir como hechos propios |

Quedan sin observar: comportamiento real bajo errores, fidelidad visual, móvil, accesibilidad, permisos efectivos, latencia/costes de reintento, retención, exportación completa de datos, matriz exacta de modelos por plan y detalles de integraciones no cubiertos por ayuda. No se crearon cuentas para despejarlos.

## 6. Pantallas y navegación

**0 pantallas de la aplicación observadas interactivamente.** Inventario de 23 superficies funcionales descritas o enlazadas; algunas pueden coexistir dentro de una pantalla. No se afirma un número real de rutas. Rutas privadas desconocidas; los recorridos son etiquetas de navegación documentadas.

| ID | Superficie | Cómo llegar | Componentes/propósito documentados | Estados documentados / fuente |
| --- | --- | --- | --- | --- |
| S01 | Landing | `/` | Propuesta de valor, secciones, Login, Try Now | Texto público leído; sin evaluación visual (M01) |
| S02 | Precios | `/pricing` | Tarjetas, comparación, ciclos | Promociones y planes; no checkout (M02) |
| S03 | Login | Enlace público a app.tryholo.ai/login; no abierto | Google/código/contraseña | Código no recibido, reenvío; D45 |
| S04 | Onboarding | Primer acceso / nueva marca | URL/manual, canal, análisis, revisión y productos | Progreso y validación ≥1 producto; D02 |
| S05 | Selección de marca | Tras login o Settings → Brands | Marca activa, crear/cambiar/borrar | Borrado solo Owner; D25 |
| S06 | Home / Chat | Home → Ask Holo anything | Prompts, adjuntos, mensajes e historial | Generando, Stop, timeout; D26 |
| S07 | Brand Overview | Brand DNA → Overview | Identidad, visual, voz, competidores | Edición documentada; D04 |
| S08 | Catalogue | DNA → Products / Catalogue | Búsqueda, importación, panel de producto | Edición, quality rating; D02/D06 |
| S09 | Integrations | Brand DNA → Integrations | Canal, autorización, cuentas/páginas | Conectado/desconectado; D05/D34 |
| S10 | Ads Overview / Goal | Ads → Overview → Set a goal | KPI, estrategia, tareas y reportes | To Do/In Progress/Done; D10/D35 |
| S11 | Ads Create | Ads → Create | Ideas, herramientas, referencias | Concepto y formato; D36 |
| S12 | Generadores de imagen | Create New → método | Referencia, ajustes, prompts, revisión | Guardar/descartar; D07/D27/D28/D41–43 |
| S13 | Generadores de video | Create New → método | Referencia, guion, duración/cantidad | Generación y salida; D08/D29–32/D44 |
| S14 | AI UGC | Método AI UGC | Actor, voz preview, guion, ajustes | MP4 aprobado en biblioteca; D09 |
| S15 | Ads Manager / Analytics | Ads Manager; Ads → Analytics | Métricas, gráfico, campañas, learnings | Sin campañas / datos insuficientes; D11–13 |
| S16 | Socials Calendar | Socials | Ideas, revisión, caption, horario | Review/Approval/Scheduled/Published; D15 |
| S17 | Automations | Socials → Manage automations | Canal, frecuencia, formatos y toggles | Desactivado, requisitos de autoaprobación; D14 |
| S18 | Emails | Emails → Unlock Emails | Ideas, herramientas e inspiración | Desbloqueo y generación; D20/D40 |
| S19 | SEO Overview | SEO → Set goal & strategy | Objetivo, tablero y calendario | Estrategia por aprobar, artículos en progreso; D37 |
| S20 | SEO Analytics | SEO → Analytics | Métricas estimadas, posts y aprendizajes | Secciones vacías hasta tener datos; D38 |
| S21 | Library / detalle | Library → activo | Filtros, favoritos, boards, prompt, método | Recently Deleted; D16/D39 |
| S22 | Creative Chat / Publish | Activo → Edit o Publish | Vista de activo/chat; caption, preview y fecha | Progreso de edición / cuenta requerida; D16/D17/D26 |
| S23 | Settings | Team / Credits / Brands | Invitaciones, roles, cuotas y marcas | Owner/Member, créditos agotados; D23–25 |

Patrón de navegación deducido: contexto persistente de marca con áreas por canal y herramientas comunes de producción/biblioteca/chat. Confianza media como interpretación del conjunto documental, sin verificar orden del menú, responsive o layout global. No se inventaron screenshots, breakpoints, colores, tipografías ni medidas.

## 7. Flujos documentados

Los siguientes ocho recorridos están reconstruidos de ayuda, **no ejecutados**. Clics no medidos; no convertir número de pasos en clics. Los casos indicados proceden de docs o se marcan como comprobaciones propias.

| ID | Objetivo y recorrido | Bifurcaciones / límite | Fuentes |
| --- | --- | --- | --- |
| F01 | S03/S05 → S04 → URL/manual → canal → análisis → confirmar DNA → ≥1 producto → invitación opcional | Hasta 10 productos importados; faltantes manuales; campo URL puede requerir zoom out | D02 |
| F02 | S08/S11 → S12 → referencia → formato/cantidad → prompt editable → lote → guardar → S21 → S22 | Guardar/descartar; revisión del producto importado; probar URL inaccesible es pendiente propio | D07/D27 |
| F03 | S11 → S13 → referencia → ajustes → guion → generación → revisión/biblioteca | Entradas y controles varían por método; límites 50 MB solo documentados en Variations | D08/D29–32/D44 |
| F04 | S14 → actor/voz → ajustes y referencia opcional → idea/guion → generación → MP4 S21 → Edit/Download/Post | No avala uso de rostro/voz ajenos ni testimonios ficticios | D09 |
| F05 | S09 Meta → autorización → página/cuenta/pixel opcional → S10 objetivo/KPI/estrategia → tareas/creativos → Launch Campaign → S15 | Países, no radios; reportes exigen datos/conexión; no se lanzó nada | D10–13/D34–36 |
| F06 | S16 idea → revisar tema → Create post → revisar caption/visual/hora → conectar si falta → Approve and schedule | Reprogramar o cancelar vuelve a Review; S17 puede automatizar pasos futuros | D14/D15 |
| F07 | S18 Unlock → concepto o herramienta → email → revisión → HTML → herramienta de email externa | Sin conexión exigida para ideas; envío directo no confirmado | D03/D20/D40 |
| F08 | S19 meta/estrategia 30 días → aprobación → idea → artículo/metadata → revisión → S09 destino → programar → S20 | Un destino SEO por marca; estimaciones no GSC; webhook específico si se usa | D21/D22/D37/D38 |

## 8. Componentes y oportunidades UX

| Componente funcional documentado | Variantes/estados conocidos | Superficies / evidencia |
| --- | --- | --- |
| Formulario de marca | Identidad, visual, tono, competidores; edición | S04/S07; D02/D04 |
| Selector de referencia | Producto, subidas y biblioteca | S12/S13; D07/D08 |
| Ajustes de generación | Formato, cantidad; duración en video; slides en carrusel | S12–14; D07–09/D28 |
| Prompt/guion | Sugerido, editable, regenerar, propio | S12–14; D07–09 |
| Revisión por swipe | Guardar corazón / descartar | S12; D07 |
| Panel de producto | Nombre, descripción, fotos y Save | S08; D06 |
| Chat y acciones rápidas | Adjuntos, chips, Stop, progreso, historial | S06/S22; D26 |
| Tablero | To Do/In Progress/Done | S10/S19; D10/D37 |
| Calendario / revisión | Estado, canal, caption, fecha/hora y cancelación | S16; D15 |
| Controles de automatización | Tres niveles, dependencias y frecuencia por canal | S17; D14 |
| Biblioteca | Filtros, favoritos, boards, detalle, eliminados | S21; D16/D39 |
| Publicación | Tipo, canal, caption, preview, horario | S22; D17 |
| Métricas e informes | Rangos, gráficas, datos insuficientes y reportes pendientes | S15/S20; D11–13/D38 |

Fortalezas potenciales del patrón documentado: contexto de marca compartido, revisión antes de generación final, continuidad entre crear y publicar, activos reutilizables y separación de niveles de automatización. No son puntuaciones de usabilidad medidas.

Oportunidades para nuestra alternativa, **propuestas propias**: procedencia y confianza de cada dato extraído; historial de correcciones del DNA; coste visible antes de generar; texto determinista editable; referencia de producto fijada por creación; permisos de publicación separados de permisos de generación; cancelación explícita de trabajos y posts; etiquetas claras para métricas estimadas. Validar accesibilidad de swipe, foco y estados de progreso, además de alternativa de lista. No se afirma que Holo carezca de estas soluciones salvo donde la evidencia sea insuficiente.

## 9. Arquitectura funcional y datos inferidos

No es arquitectura técnica de Holo. Son responsabilidades deducidas de D02–D44: ingesta autorizada → contexto de marca/catálogo → planificación → generación multimodal → revisión/edición → almacenamiento/biblioteca → distribución → métricas y aprendizajes. Control de acceso, cuotas y estado de procesos atraviesan el flujo. Las docs no permiten afirmar frameworks, base de datos, colas, modelos, regiones, embeddings o infraestructura internos.

| Entidad conceptual inferida | Información funcional | Evidencia / confianza |
| --- | --- | --- |
| Workspace | Miembros, permisos y marcas | D24/D25; alta conceptual |
| BrandProfile | Identidad, logo, colores, fuente, tono, audiencia y competidores | D04; alta |
| Product | Nombre, descripción, imágenes, URL y calidad | D06; alta |
| CreativeAsset | Tipo, referencia, prompt, método y salida | D07/D16; alta |
| Conversation | Mensajes, título, adjuntos e historial por creativo | D26; alta |
| GoalStrategy | Objetivo, KPI, meta y acciones | D10/D35/D37; alta |
| ScheduledPost | Canal, caption, creativo, horario y estado | D15; alta |
| AutomationPolicy | Canal, frecuencia, formatos y tres controles | D14; alta |
| ChannelConnection | Plataforma, cuenta/página, permiso y conexión | D05/D34; alta |
| ReportLearning | Periodo/métricas o test/resultado/explicación | D12/D13/D38; alta |
| CreditUsage | Consumo, saldo y vigencia según tipo | D23; media; reglas contradictorias |
| GenerationJob | Solicitud, progreso, parada y timeout | D26; media; proceso interno no observado |

Relaciones conceptuales: Workspace agrupa marcas y miembros con asignación; cada marca conserva perfil/productos/activos/conexiones/estrategias; posts usan activos y canales; aprendizajes sobreviven a objetivos. Son relaciones funcionales, no claves, cardinalidades técnicas definitivas o esquema de almacenamiento. El contrato D22 expone marca y artículo en su payload sin revelar el esquema privado completo.

## 10. Qué podemos desarrollar y qué depende de terceros


Esta sección responde qué podríamos construir en términos de capacidades. No selecciona una arquitectura, proveedores ni contratos, y no identifica servicios usados por Holo.

| Capacidad propuesta | Trabajo que podemos desarrollar | Servicio externo / alternativa propia | Condiciones y riesgos |
| --- | --- | --- | --- |
| Análisis de URL | Validación, extracción acotada, trazabilidad de campos y revisión | Acceso HTTP público; un servicio de extracción sería opcional | Respetar términos; proteger contra SSRF, DNS/redirects a redes privadas, esquemas inseguros y contenido excesivo |
| Brand DNA | Modelo de perfil editable, colores, tono, mensajes y aprobaciones | LLM por API opcional para inferencia; modelo autohospedado o entrada manual | Inferencias no son hechos; el usuario debe revisar y corregir |
| Catálogo | Carga, metadatos, selección, miniaturas y permisos | Almacenamiento propio o gestionado; conector de tienda solo si se decide | Derechos sobre activos, límites de archivos, fidelidad y aislamiento |
| Conceptos y copy | Brief, estructura de respuesta, historial y validación | LLM autorizado por API o autohospedado | Revisión de afirmaciones, idioma, coste y contenido inseguro |
| Imagen generativa | Orquestación, referencias autorizadas, variantes y manejo de errores | API de generación/edición o modelo propio con recursos de cómputo | Licencia, moderación, coste, consistencia y calidad requieren pruebas |
| Edición y exportación | Texto como capa tipográfica, composición, recorte y exportación | Renderizador local; fuentes y plantillas propias/autorizadas | Tipografía y dimensiones deterministas; no prometer texto correcto dentro de la imagen IA |
| Video publicitario | Brief, guion, secuencia, trabajos y revisión | Modelo de video por API o autohospedado; voz/avatar solo si se incorporan | Derechos de voz/imagen, consistencia temporal, espera y coste; no es igual a montar diapositivas |
| Biblioteca | Guardado, búsqueda básica, versiones y borrado | Persistencia y objetos propios o gestionados | Retención, autorización y recuperabilidad |
| Calendario y aprobación | Estados, borradores, programación y registro de acciones | Ejecución de trabajos propia o gestionada | Idempotencia, zona horaria, reintentos y capacidad de cancelar |
| Publicación en canales | Gestión de autorización, adaptadores y estado | APIs oficiales del canal; permisos y posibles revisiones obligatorios | No se sustituye la red del canal. Requiere credenciales del usuario; aprobación de acciones reales |
| Métricas | Normalización y presentación de métricas autorizadas | APIs de canales si se publican y se dispone de permisos | No inventar rendimiento ni atribución; acceso y ventanas de datos variables |
| Email y SEO | Borradores y revisión editorial | Envío real: proveedor o infraestructura SMTP; publicación: API del CMS correspondiente | Separar generar de enviar/publicar; consentimiento, reputación y permisos |
| Cuenta y acceso | Roles básicos, aislamiento y uso | Identidad y base de datos propias o gestionadas | Colaboración avanzada y multitenencia compleja no son necesarias para validar un único negocio |

**Qué sería imprescindible externamente:** conectividad a la web aportada para importación; APIs y permisos de una plataforma para publicar en ella. Para generación, el componente imprescindible es un modelo utilizable legalmente, no necesariamente una empresa externa: autohospedarlo cambia coste, recursos y operación. No se han verificado APIs, precios o términos vigentes de proveedores concretos. No hay un cálculo de presupuesto fiable todavía.

### Arquitectura funcional conceptual, no arquitectura privada de Holo

Responsabilidades candidatas para contrastar: adquisición autorizada de datos → perfil revisable → contexto de producto y brief → generación → edición → exportación. Persistencia, control de acceso, registro de uso y manejo de trabajos serían necesidades transversales de nuestra alternativa si aprobamos este alcance. Video y distribución añadirían procesos y dependencias propios. No se afirma que Holo utilice colas, un LLM particular, un framework, una base de datos, un proveedor de imágenes o microservicios específicos.



### Integraciones documentadas frente a servicios que necesitaríamos

D05 enumera Facebook, Instagram, X, LinkedIn, TikTok, Pinterest, YouTube, Threads, Meta Ads, WordPress, Shopify y custom website para blogs. Su presencia en la ayuda no confirma todos los formatos, planes o permisos disponibles. No se presupone integración nativa de email por una gráfica de Klaviyo en marketing ni un conector de tienda por la mera capacidad de importar una URL.

Para nuestra alternativa, los contratos de modelos y sus límites deben verificarse en una fase posterior. No hay evidencia de que Holo use un proveedor concreto. Candidatos se evaluarán por generación/edición con referencia, conservación de producto, derechos comerciales, idioma, moderación, coste de fallo y latencia. Video/avatares/voz pueden requerir proveedores distintos o una solución propia; no se asume que una sola API resuelva todo.

Construir el workflow es factible; igualar la calidad generativa o el rendimiento comercial no está demostrado. Crear modelos desde cero exigiría datos autorizados, cómputo y evaluación: no es requisito necesario para un MVP ni una actividad iniciada aquí. No se conectó ninguna cuenta, API o servicio de pago.

## 11. Priorización y alcance propuesto

`features.csv` usa exactamente `feature,area,priority,original,clone,notes`. `original=yes` significa presencia **descrita en documentación leída**, no prueba funcional; `original=unknown` se reserva para claims o preguntas no resueltas. Todas las filas comienzan con `clone=no`. Las notas incluyen categoría, evidencia y límites. No hay porcentaje de paridad ni funcionalidad propia implementada.

La matriz contiene **73 filas**: 15 must, 19 should y 39 could; 66 documentadas y 7 no confirmadas/propuestas propias. Todas siguen sin implementar.

Las prioridades `must/should/could` se refieren a nuestra propuesta: un negocio, alta por URL o manual, perfil editable aprobado, producto autorizado, tres conceptos como decisión propia, generación de una imagen, edición de texto y PNG. Esto no afirma que Holo tenga un editor tipográfico ni que exporte PNG. Mantener las necesidades propias explícitas evita confundirlas con una copia de funciones observadas.

Fuera del primer MVP: video/UGC, SEO, envío de email, administración multimarcas avanzada, múltiples redes, campañas con gasto y optimización autónoma. Se investigan aquí porque el usuario pidió cobertura amplia, pero no se incluyen automáticamente en el primer desarrollo.

No reproducir: marca y diseño distintivo de Holo; plantillas, actores, voces, capturas, bases de ejemplos o multimedia sin licencia; código, endpoints privados, datos de clientes, acuerdos de partnership o rendimiento histórico. “Clone” es un nombre de herramienta documentado, no un permiso de uso de los activos. Todas las referencias creativas de nuestro producto deberán ser propias o autorizadas.

## 12. Tamaño, riesgos y siguientes decisiones

Inventario documental: **23 superficies funcionales**, **8 flujos** y **12 entidades conceptuales inferidas**. Observación interactiva de producto: **0**; pruebas de generación/publicación: **0**. No se contabilizan como pantallas ejecutadas ni entidades reales del esquema privado.

La visión completa es **XL** (necesita acotación) por combinar producción multimodal, editor, datos de rendimiento y operación en canales externos. No hay estimación fiable de semanas o presupuesto sin equipo, calidad objetivo, volumen y proveedores. El MVP de imagen reduce alcance pero sigue necesitando evaluación de fidelidad y coste antes de prometer resultados.

Los tres riesgos técnicos mayores: (1) fidelidad de marca/producto y texto; (2) video coherente con coste/latencia asumibles; (3) publicación y optimización robustas con credenciales, cuotas y políticas externas. Riesgos de producto adicionales: fuentes oficiales contradictorias, expectativas de autopilot y comprensión del coste por generación.

Para cerrar incertidumbres de una evaluación futura: recorrido autorizado o demostración pública visual, formatos/latencia reales, matriz de planes, derechos/retención, evidencias de integración y validación con negocios objetivo. No se exige crear una cuenta para aceptar esta investigación pública con sus límites. No se requiere autorización para una fase siguiente hasta que el usuario revise este informe.

## 13. Entrega y validación

Archivos: `replica/recon.md` y `replica/features.csv`. Se reemplazó el borrador bloqueado por este Recon público documentado; no se escribió código de aplicación, modificaron dependencias o ejecutaron otras skills. El analizador temporal usado para leer HTML solo extrajo texto y no se incorporó al proyecto.

Comprobaciones: acceso HTTP a sitio/docs, lectura dirigida de fuentes listadas, cabecera/columnas y valores de CSV, referencias de fuentes, unicidad de funcionalidades y `git diff --check`. Esto valida la integridad documental; no verifica que los flujos de Holo funcionen. Los cambios quedan en el checkout; no se publicaron campañas ni servicios.

**Punto de control: esperar aprobación del usuario.** El siguiente paso posible sería definir el alcance/arquitectura, pero no se ha iniciado ni se iniciará sin autorización.
