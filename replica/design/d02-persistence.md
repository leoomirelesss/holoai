# D02 — alta manual persistente

2026-10-27. Extensión funcional del diseño aprobado; mantiene tokens, componentes, tipografía, espaciado y composición de D02. No implementa D03/D04 ni modifica D01.

## Superficie pública y privada

`/` conserva URL/manual como borradores de pestaña; no hace llamadas de negocio. `/app` exige identidad verificada en servidor. Modo URL: únicamente borrador, sin visitar la web. Modo manual: «Crear mi marca» envía nombre y descripción aportados por el usuario. El texto explica el envío, la conservación local y que el perfil queda draft, sin aprobación ni análisis.

El CTA permanece en la posición aprobada. Durante el envío muestra «Guardando tu marca…» y el formulario declara aria-busy. Un estado vivo anuncia la etapa conocida, sin porcentajes ni tiempos inventados. Validación por campo y foco en el primer error; inputs conservan labels, autocomplete y límites existentes. Los campos de un intento iniciado son de solo lectura: modificar su payload podría crear otra entidad o invalidar la clave estable. No hay acción para crear otra marca en este tramo.

## Estados y acciones

| Estado | Información y acción real |
| --- | --- |
| Inicial | Nombre/descripción requeridos; Crear mi marca. No se crean recursos al renderizar. |
| Cargando | Verificar sesión → consultar workspace → crear workspace si falta → crear marca → leer revisión → guardar descripción → confirmar lectura. Doble envío bloqueado. |
| Resultado parcial | Tarjeta de intento con datos aportados y, solo si fue confirmado, ID de marca. «Comprobar y continuar» consulta antes de escribir. No dice que todo fue atómico. |
| Éxito | «Marca y descripción guardadas» únicamente después de una lectura confirmada. Recibo conservado; «Comprobar guardado» solo lee. No avanza a D04. |
| Red/servicio | Aviso persistente; borrador e intento conservados. Reintento explícito de la etapa que se pueda comprobar, sin repetir creación incierta. |
| Sesión | Revalidación servidor devuelve al acceso si expiró/cambió la identidad. Un401 de API conserva campos y ofrece volver a iniciar sesión. |
| Conflicto | Descripción local conservada, sin sobrescribir la revisión nueva. Se puede volver a comprobar, sin forzar If-Match nuevo. |
| Creación incierta | No se recibió un ID confirmado después de enviar POST. Aviso persistente y referencia del intento; CTA de creación bloqueado, también al recargar. No se inventa una recuperación que la API no ofrece. |
| Almacenamiento no disponible | No se envía ningún efecto sin registro previo durable. Campos conservados; aviso para descargar borrador/conservar ID si existe. |

La tarjeta reutiliza Card, Badge, clases de resumen/borrador y tokens. Referencias largas se parten sin overflow. Desktop conserva dos columnas; móvil coloca notas tras el formulario. Errores usan role=alert y estado de progreso role=status; botones y enlaces nativos accesibles por teclado. Avisos tienen pasos reales, sin soporte/chat ficticio.

## Conservación y privacidad local

El borrador público existente no se renombra, limpia ni migra. Borradores privados de pestaña y registro durable de operación se separan por un identificador opaco derivado en servidor de la cuenta verificada. Otro usuario no ve ese recibo en la aplicación. No se almacenan sesiones, cookies o claves en el registro. Los IDs locales nunca autorizan: la API aplica RLS en cada operación.

El avance se conserva en localStorage, por lo que sigue después de recargar, cerrar sesión y abrir otra pestaña en el mismo navegador/origen. No equivale a almacenamiento cifrado ni protege frente a alguien con acceso al perfil del navegador. Borrar datos del navegador o usar otro dispositivo pierde esa referencia local; no se promete deduplicación universal. El modo URL tiene un espacio separado si ya hay un intento manual, para no sustituir su borrador pendiente.
