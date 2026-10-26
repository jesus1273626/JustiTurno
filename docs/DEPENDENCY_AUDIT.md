# Auditoría de dependencias

Ejecutado el 26 de octubre de 2026: `npm audit --omit=dev`. Resultado: 6 altas, 3 moderadas, 0 bajas, 0 críticas.

| Paquete | Severidad | Cadena | Tratamiento |
|---|---|---|---|
| `multer` | Alta | Dependencia directa | Revisar actualización compatible y probar uploads antes de publicar. |
| `zod` | Alta | Dependencia directa | Actualizar de forma controlada, ejecutar validaciones y tests. |
| `prisma`, `@prisma/config`, `deepmerge-ts` | Alta | Prisma transitivo | Actualizar Prisma y cliente juntos siguiendo su guía de migración. |
| `body-parser` | Alta | Express transitivo | Se resolverá al actualizar la cadena compatible de Express. |
| `react-router-dom`, `react-router` | Moderada | Dependencia directa/transitiva | Actualizar pareja compatible y probar rutas/redirecciones. |
| `fast-uri` | Moderada | Transitiva | Resolver con actualización de la cadena que la trae. |

No se aplicó `npm audit fix --force`: un cambio masivo de versiones mayores sin suite final estable no es seguro. Estas alertas son pendientes de mantenimiento antes de un despliegue público.
