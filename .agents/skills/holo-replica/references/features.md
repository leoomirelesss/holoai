# Alcance inicial: Holo AI (orientativo, sujeto a recon)

Fuentes públicas consultadas el 2026-10-26:
- https://tryholo.ai/ — claims de marketing: URL -> campañas; sociales, anuncios, emails, SEO, aprobaciones y automatización.
- https://tryholo.ai/es — Brand DNA, sugerencias de contenido, edición, descarga y publicaciones.
- https://docs.tryholo.ai/ — onboarding y activación de cuentas; leer las páginas enlazadas antes de afirmar comportamiento detallado.
- https://tryholo.ai/es/use-cases/ai-ugc-generator — contenido UGC en video.

## Matriz de partida, NO considerada inventario verificado de pantallas

| Área | Funcionalidad que se debe investigar | Prioridad MVP | Observación |
| --- | --- | --- | --- |
| Onboarding | Introducir URL y extraer identidad de marca | MUST | sitio de producto público |
| Brand DNA | Colores, voz, mensajes, clientes y edición | MUST | sitio de producto público |
| Catálogo | Productos, nombre, descripción, fotos propias | MUST | verificar detalles en docs |
| Ideas | 3 propuestas de anuncios con mensaje y canal | MUST | versión propia mínima |
| Imagen | Generación de activo y exportación editable | MUST | requiere proveedor de IA autorizado |
| Editor | Texto editable y dimensiones social/ad | MUST | composición tipográfica determinista |
| Biblioteca | Guardar proyectos/activos por marca | SHOULD | persistencia posterior |
| Video UGC | Avatares, voz, generación video | LATER | alto coste y dependencias |
| Emails | Secuencias/copies editables | SHOULD | no enviar sin autorización |
| Calendario | Programación de contenido | LATER | no implica publicación conectada |
| Plataformas | Meta, Instagram, TikTok, etc. | LATER | solo APIs oficiales, permisos y revisión |
| Analítica | Rendimiento por campaña | LATER | datos autorizados; no inventar resultados |
| Autopilot | Aprobaciones + programaciones | LATER | acciones explícitas y trazabilidad |
| SEO | Briefs y borradores de contenido | LATER | publicación externa es fase distinta |

## Comportamiento de Recon
- Convertir la lista de arriba en `replica/features.csv` usando la cabecera que esperan `replica-diff/parity.py` y el origen correspondiente.
- Distinguir **documentado**, **visto en la interfaz**, **inferido** y **propuesta propia**.
- Si documentación y marketing discrepan, atribuir el dato y registrarlo como incertidumbre.
- Enfocar primero el flujo de un solo negocio y generación de una pieza; no implementar plataforma multi-tenant compleja antes de validar el MVP.
