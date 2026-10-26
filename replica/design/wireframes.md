# Wireframes por pantalla, breakpoint y estado

Diagramas originales de baja fidelidad. No son capturas de Holo ni pantallas implementadas. Referencia nominal:1440px desktop,390px compacto; reglas320/640/1024/1280 de [README](README.md). Las etiquetas de producto/imagen son placeholders explícitos, nunca resultados de IA simulados. Especificación de acciones y errores en [screens.md](screens.md).

Cada D incluye layout desktop, layout compacto y cuatro variantes de la región principal (loading, empty, error, success). El shell se mantiene salvo acceso/onboarding/editor. Las variantes se leen con los requisitos de pantallas, no sustituyen sus condiciones de negocio.

## D01 — Acceso

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Linde                                                                            │
│ Entra a tu espacio                                                               │
│ Correo [________________________]                                                │
│ Contraseña [________________] Mostrar                                            │
│ [ Entrar ]  Recuperar acceso                                                     │
│ Crear cuenta | Ayuda                                                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Linde                             │
│ Entra a tu espacio                │
│ Correo [___________]              │
│ Contraseña [_______]              │
│ [ Entrar ]                        │
│ Recuperar / Crear cuenta          │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Acceso                                                 │
│ Entrando… · formulario ocupado                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Acceso                                                   │
│ Completa correo y contraseña · Crear cuenta                      │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Acceso                                                   │
│ No pudimos entrar · Revisar datos / Recuperar                    │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Acceso                                                 │
│ Correo verificado · Continuar al espacio                         │
└──────────────────────────────────────────────────────────────────┘
```

## D02 — URL de empresa

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Tu primera marca                         Paso 1 de 3                             │
│ Prepara el contexto de tu marca                                                  │
│ Dirección HTTPS [______________________________]                                 │
│ Crearemos un borrador que podrás revisar                                         │
│ Coste máximo [dato real si existe]                                               │
│ [ Analizar sitio ]  Completar manualmente                                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Paso 1 de 3                       │
│ Tu primera marca                  │
│ URL HTTPS [________]              │
│ Borrador revisable                │
│ Coste [dato real]                 │
│ [ Analizar sitio ]                │
│ Completar manualmente             │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · URL de empresa                                         │
│ Iniciando análisis… · evitar doble envío                         │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · URL de empresa                                           │
│ Introduce una dirección HTTPS · Manual disponible                │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · URL de empresa                                           │
│ URL no accesible · Corregir / Completar manualmente              │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · URL de empresa                                         │
│ Análisis aceptado · Ver progreso D03                             │
└──────────────────────────────────────────────────────────────────┘
```

## D03 — Análisis

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Analizando: empresa.example                                                      │
│ Etapas                          Resumen                                          │
│ ✓ Leer sitio                    Perfil por revisar                               │
│ → Preparar perfil               Productos: dato real                             │
│ ○ Buscar productos              Sin aprobación automática                        │
│ [ Cancelar análisis ]           [ Revisar información ]                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Analizando sitio                  │
│ ✓ Leer sitio                      │
│ → Preparar perfil                 │
│ ○ Buscar productos                │
│ Puedes volver después             │
│ [ Cancelar análisis ]             │
│ Revisar cuando esté listo         │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Análisis                                               │
│ Preparando perfil… · sin porcentaje ni ETA                       │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Análisis                                                 │
│ Sin datos suficientes · Completar perfil manualmente             │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Análisis                                                 │
│ Resultado por confirmar · Consultar estado, no regenerar         │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Análisis                                               │
│ Borrador listo · Revisar Brand DNA                               │
└──────────────────────────────────────────────────────────────────┘
```

## D04 — Brand DNA

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Brand DNA     Borrador vN          [ Guardar borrador ]                          │
│ Identidad / Visual / Voz / Competidores                                          │
│ Nombre [____________]   Resumen revisable                                        │
│ Descripción [_______]   Logo / colores / tono                                    │
│ Campo [Sugerido] Fuente  Aprobado anterior: vN                                   │
│ [ Aprobar perfil guardado ]       [ Revisar productos ]                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Brand DNA · Borrador              │
│ Identidad / Visual / Voz          │
│ Nombre [___________]              │
│ Descripción [______]              │
│ Detectado · Ver fuente            │
│ [ Guardar borrador ]              │
│ [ Aprobar perfil ]                │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Brand DNA                                              │
│ Cargando revisión… · campos aún no editables                     │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Brand DNA                                                │
│ Perfil manual · Completa información mínima                      │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Brand DNA                                                │
│ No se guardó / Conflicto · Conservamos campos                    │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Brand DNA                                              │
│ Revisión aprobada · Continuar con productos                      │
└──────────────────────────────────────────────────────────────────┘
```

## D05 — Catálogo

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Productos             [ Importar URL ] [ Añadir producto ]                       │
│ Buscar nombre [___________]  Activos / Por revisar                               │
│ [Foto] Producto A   [Foto] Producto B   [Foto] Producto C                        │
│ Por revisar        Activo             Validando fotos                            │
│ [ Revisar ]        [ Usar en anuncio ] [ Abrir ]                                 │
│ Cargar más                                                                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Productos                         │
│ [ Añadir ] [ Importar ]           │
│ Buscar [___________]              │
│ Filtro: Por revisar               │
│ [Foto] Producto A                 │
│ Estado · [ Revisar ]              │
│ Cargar más                        │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Catálogo                                               │
│ Cargando catálogo… · tarjetas skeleton                           │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Catálogo                                                 │
│ Sin productos · Añadir primero / Sin coincidencias: limpiar      │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Catálogo                                                 │
│ No pudimos cargar · Reintentar lectura                           │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Catálogo                                               │
│ Producto guardado · Estado actualizado                           │
└──────────────────────────────────────────────────────────────────┘
```

## D06 — Ficha de producto

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Productos                      [ Guardar producto ]                            │
│ Nombre [____________]  Fotos propias                                             │
│ Descripción [_______]  [ Elegir imágenes ]                                       │
│ URL opcional [______] [Foto 1] [Foto 2: validando]                               │
│ Estado: Por revisar    Principal / Subir / Bajar / Quitar                        │
│ [ Guardar borrador ]   [ Crear anuncio si está listo ]                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ ← Productos                       │
│ Nombre [___________]              │
│ Descripción [______]              │
│ [ Elegir imágenes ]               │
│ [Foto] Principal                  │
│ Subir / Bajar / Quitar            │
│ [ Guardar producto ]              │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Ficha de producto                                      │
│ Cargando ficha / Inspeccionando imagen…                          │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Ficha de producto                                        │
│ Producto nuevo · Añade nombre descripción e imagen               │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Ficha de producto                                        │
│ Foto rechazada / Conflicto · Conservar imágenes válidas          │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Ficha de producto                                      │
│ Producto activo · Crear anuncio                                  │
└──────────────────────────────────────────────────────────────────┘
```

## D07 — Brief creativo

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Crear anuncio                      [ Crear 3 conceptos ]                         │
│ Producto [seleccionar]     Resumen antes de generar                              │
│ DNA: aprobado vN          Producto y foto seleccionados                          │
│ Objetivo [____________]   Coste máximo [dato real]                               │
│ Mensaje [_____________]   Los conceptos son texto                                │
│ Restricciones [_______]   No inicia generación al elegir                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Crear anuncio                     │
│ Producto [_________]              │
│ DNA aprobado vN                   │
│ Objetivo [_________]              │
│ Mensaje [__________]              │
│ Coste [dato real]                 │
│ [ Crear 3 conceptos ]             │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Brief creativo                                         │
│ Preparando conceptos… · trabajo persistido                       │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Brief creativo                                           │
│ Falta DNA/producto listo · Ir al requisito concreto              │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Brief creativo                                           │
│ No disponible por presupuesto o error · Conservar brief          │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Brief creativo                                         │
│ Lote listo · Revisar 3 conceptos D08                             │
└──────────────────────────────────────────────────────────────────┘
```

## D08 — Conceptos

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 3 direcciones creativas            [ Otros conceptos ]                           │
│ ( ) Concepto 1      (●) Concepto 2      ( ) Concepto 3                           │
│ Ángulo / titular   Ángulo / titular    Ángulo / titular                          │
│ Cuerpo / CTA       Cuerpo / CTA        Cuerpo / CTA                              │
│ [ Editar copy ]    [ Editar copy ]     [ Editar copy ]                           │
│ Imagen aún no generada       [ Continuar con selección ]                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Tus 3 conceptos                   │
│ ( ) Concepto 1                    │
│ Titular / CTA · Editar            │
│ (●) Concepto 2                    │
│ Titular / CTA · Editar            │
│ ( ) Concepto 3                    │
│ [ Continuar ]                     │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Conceptos                                              │
│ Creando conceptos… · no texto simulado de IA                     │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Conceptos                                                │
│ No hay lote · Completa el brief                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Conceptos                                                │
│ Resultado no válido / Incierto · Recuperación segura             │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Conceptos                                              │
│ Concepto seleccionado y guardado · Generar imagen                │
└──────────────────────────────────────────────────────────────────┘
```

## D09 — Imágenes

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Generar imagen                  DNA vN · Producto elegido                        │
│ Configuración            Resultados por trabajo                                  │
│ Referencia [foto propia] [Imagen lista] [Generando…]                             │
│ Formato / calidad / 1–3  (●) Seleccionar [ Cancelar ]                            │
│ Coste por imagen y total [Error conocido / por confirmar]                        │
│ [ Generar N imágenes ]   [ Editar imagen seleccionada ]                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Generar imagen                    │
│ Referencia / Formato              │
│ Cantidad [1] · Coste              │
│ [ Generar 1 imagen ]              │
│ [ Resultado o estado ]            │
│ Seleccionar / Cancelar            │
│ [ Editar selección ]              │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Imágenes                                               │
│ Generando imagen… · puedes volver más tarde                      │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Imágenes                                                 │
│ Aún no hay imagen · Confirmar cantidad y coste                   │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Imágenes                                                 │
│ Un trabajo falló / incierto · Conservar éxitos                   │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Imágenes                                               │
│ Imagen real lista · Abrir editor                                 │
└──────────────────────────────────────────────────────────────────┘
```

## D10 — Editor

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Biblioteca | Anuncio | Sin guardar | Guardar | Exportar                        │
│ Seleccionar  Añadir texto  Imagen  Forma     Undo / Redo                         │
│ Capas                 Lienzo              Propiedades                            │
│ Titular [selección]    [Fondo / producto]    Texto / fuente                      │
│ Foto de producto      [Titular editable]    X Y W H / Color                      │
│ Subir / Bajar         [CTA editable]        Alinear / Rotar                      │
│ Zoom − 100% + Ajustar              Cuadrado 1080×1080                            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ ← Biblioteca · Guardar            │
│ Exportar PNG                      │
│ Texto / Imagen / Forma            │
│ [ Lienzo ajustado ]               │
│ − 100% + Ajustar                  │
│ Capas | Propiedades               │
│ Texto [____________]              │
│ X [___] Y [___]                   │
│ Alinear / Subir / Bajar           │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Editor                                                 │
│ Cargando escena… · export bloqueado hasta estar lista            │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Editor                                                   │
│ Sin capas · Añadir texto / Añadir imagen                         │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Editor                                                   │
│ No se guardó / Conflicto · Copia local conservada                │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Editor                                                 │
│ Versión N guardada · Exportar PNG                                │
└──────────────────────────────────────────────────────────────────┘
```

## D11 — Biblioteca

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Biblioteca                          [ Crear anuncio ]                            │
│ Filtros: Todos / Favoritos / Archivados / Tipo                                   │
│ [Preview] Creativo A [Preview] Creativo B [Preview] C                            │
│ Versión / formato   Versión / formato   Versión / formato                        │
│ [ Editar ] ☆        [ Abrir ] ★         [ Abrir ] ☆                              │
│ [ Cargar más ]                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Biblioteca                        │
│ [ Crear anuncio ]                 │
│ Filtros / Favoritos               │
│ [ Preview creativo ]              │
│ Nombre / versión                  │
│ [ Abrir ] [ Editar ] ☆            │
│ [ Cargar más ]                    │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Biblioteca                                             │
│ Cargando biblioteca… · filtros conservados                       │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Biblioteca                                               │
│ Aún no hay anuncios / Sin resultados: limpiar filtros            │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Biblioteca                                               │
│ No pudimos cargar · Reintentar sin generar                       │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Biblioteca                                             │
│ Creativos guardados · Abrir y editar                             │
└──────────────────────────────────────────────────────────────────┘
```

## D12 — Detalle y exportación

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Biblioteca                Anuncio · Versión N                                  │
│ [ Preview contain ]         Producto / fecha / formato                           │
│ [ Preview contain ]         [ Editar ] [ Exportar PNG ]                          │
│ ---------------- Panel de exportación ----------------                           │
│ PNG · Revisión N · 1080×1080 · Sin generación IA                                 │
│ [ Preparar PNG / Descargar si ya está listo ] [ Cerrar ]                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ ← Biblioteca                      │
│ [ Preview completo ]              │
│ Versión N / Formato               │
│ [ Editar ]                        │
│ Exportar PNG · versión N          │
│ [ Preparar PNG ]                  │
│ [ Descargar si listo ]            │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Detalle y exportación                                  │
│ Preparando PNG de versión N…                                     │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Detalle y exportación                                    │
│ No hay exportación de esta versión · Preparar PNG                │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Detalle y exportación                                    │
│ Falló render o link caducó · Recuperar sin regenerar IA          │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Detalle y exportación                                  │
│ PNG listo · Descargar versión N                                  │
└──────────────────────────────────────────────────────────────────┘
```

## D13 — Cuenta y uso

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Cuenta y uso                                                                     │
│ Correo verificado · Marca actual                                                 │
│ Periodo real: inicio — fin · Moneda del backend                                  │
│ Usado [dato] Reservado [dato] Disponible [dato]                                  │
│ [ Salir ]                                                                        │
│ Zona separada: Borrar espacio → confirmar y reautenticar                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Compacto

```text
┌───────────────────────────────────┐
│ Cuenta y uso                      │
│ Correo verificado                 │
│ Periodo / Moneda                  │
│ Usado [dato]                      │
│ Reservado [dato]                  │
│ Disponible [dato]                 │
│ [ Salir ]                         │
│ Borrar espacio…                   │
└───────────────────────────────────┘
```

### Variantes del contenido principal

**Loading**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Loading · Cuenta y uso                                           │
│ Consultando consumo… · sin cifras cero provisionales             │
└──────────────────────────────────────────────────────────────────┘
```

**Empty**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Empty · Cuenta y uso                                             │
│ Periodo sin uso confirmado · Crea tu primer anuncio              │
└──────────────────────────────────────────────────────────────────┘
```

**Error**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Error · Cuenta y uso                                             │
│ Uso no disponible · Reintentar lectura                           │
└──────────────────────────────────────────────────────────────────┘
```

**Success**

```text
┌──────────────────────────────────────────────────────────────────┐
│ Success · Cuenta y uso                                           │
│ Consumo confirmado / Borrado solicitado en progreso              │
└──────────────────────────────────────────────────────────────────┘
```

## Adaptación y estados superpuestos

Los wireframes compactos mantienen acciones equivalentes; un overflow de toolbar se reorganiza en filas o paneles sin ocultar la función. Teclado virtual desplaza acciones a flujo. Estados globales de sesión expirada, permisos, offline, cambios sin guardar y conflicto se superponen según screens/editor, sin duplicar pantallas o pedir de nuevo datos ya capturados. Ningún wireframe de error habilita un reintento facturable si el resultado del proveedor es incierto.
