# D02 — evidencia visual aprobada

Capturas originales del artefacto `manual-onboarding-screens` de la [ejecución aprobada 40559911090](https://github.com/leoomirelesss/holoai/actions/runs/40559911090), correspondiente al commit [`57b9dbd`](https://github.com/leoomirelesss/holoai/commit/57b9dbd299298b8c8cce5917a0bef40c0c2203c3).

Generadas con Playwright/Chrome real y Supabase local aislado. Los datos e identificadores visibles son fixtures locales; no corresponden a linde-dev. No contienen formularios de acceso, contraseñas, cookies, claves o tokens.

| Captura | Dimensiones PNG (px) |
| --- | --- |
| [Formulario desktop: fallo de almacenamiento y avance pendiente](D02-persistent-desktop.png) | 1440 × 1912 |
| [Éxito desktop: marca y descripción confirmadas](D02-persistent-success-desktop.png) | 1440 × 1868 |
| [Éxito móvil: marca y descripción confirmadas](D02-persistent-success-mobile.png) | 390 × 2828 |
| [Incertidumbre móvil: creación sin respuesta confirmada](D02-persistent-uncertain-mobile.png) | 390 × 2836 |

Los anchos de viewport son 1440 px en desktop y 390 px en móvil. Son capturas de página completa, por lo que su altura supera la del viewport. La primera documenta el formulario después de provocar un fallo local de almacenamiento; no representa un formulario vacío ni una creación confirmada.

Se verificaron los cuatro PNG mediante decodificación completa y revisión visual. Se conservan nombres, dimensiones y bytes originales; la copia se comprobó por SHA-256, sin recortes, edición ni regeneración. Los enlaces abren directamente los archivos versionados en GitHub y no dependen de la retención temporal del artefacto de Actions.

La ejecución aprobada completó 34 comprobaciones D02, 93 API, 82 RPC/RLS, 10 contratos D02 y 31 contratos API. Esta incorporación es exclusivamente documental; no modifica código, pruebas, SQL ni servicios y no representa una nueva ejecución de esas pruebas.

[Flujo y limitaciones](../../../d02-persistence.md) · [Especificación UI/UX](../../d02-persistence.md)
