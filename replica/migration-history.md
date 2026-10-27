# Historial de migraciones — diferencia pendiente de reconciliación

2026-10-27. El propietario confirma que Brand Data Foundation ya está aplicada y verificada en `linde-dev` (`wjjtqmtsysufqdxwknqx`). Este estado procede de su confirmación; no se ejecutaron consultas de administración ni comandos de migración remotos en esta etapa.

| Fuente | Versión registrada |
| --- | --- |
| GitHub: `supabase/migrations/20261026000100_brand_data_foundation.sql` | `20261026000100` |
| Historial remoto, según el propietario | `20261027163720` |

La DAL usa nombres/contratos de tablas y RPC, no la versión del historial. Esta diferencia no se corrige renombrando el archivo a ciegas ni volviendo a aplicar CREATE sobre objetos existentes. La migración aprobada se conserva intacta y CI aplica la versión de GitHub únicamente a un Supabase local nuevo.

**No ejecutar db push, db reset, migration repair ni nuevas migraciones remotas como parte de este PR.** No se enlaza la CLI al proyecto remoto. No hay un paso de deployment/migración en Actions.

Reconciliación futura, con autorización aparte: inspeccionar ambos historiales y las definiciones efectivas; comprobar que el SQL aplicado corresponde al archivo aprobado; acordar una versión canónica y una reconciliación que no reejecute DDL ya aplicado; revisar backups y ensayar el procedimiento en un entorno aislado antes del destino. No se prescribe ni ejecuta ahora una dirección de repair sin esa comprobación.
