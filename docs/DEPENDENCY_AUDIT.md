# Auditoría de dependencias

**Actualización de publicación, 05-11-2026.** `npm audit --omit=dev` pasó de 6 altas + 7 moderadas a 4 altas + 2 moderadas (0 críticas). npm incluye paquetes afectados por la misma dependencia; no son seis fallas independientes.

| Cadena/versión inicial | Aviso GHSA | Cambio o riesgo residual |
|---|---|---|
| Express → body-parser 2.3.0; Express → qs 6.16.0 | 27r3-jxmh-p828; 6pq8-jhm2-2vcw | Actualizados a 2.4.0 y 6.17.1 sin salto mayor. |
| API → multer 2.4.0 | q7qp-rjg7-q26m | 2.5.0. PDF verificado en Workers local. |
| swagger-jsdoc 6.3.0 → glob 11.1.0 → minimatch 10.2.6; cadena de análisis → fast-uri 3.1.8 | 3g3m-2fjr-6pw4; g3hv-75wg-m249; w74x-v6f9-j3xg, xhq7-xmqj-769h, wjr9-j795-jxcr, 333x-w4r6-6crp | Eliminado el generador sin anotaciones que analizar. OpenAPI ahora exporta el mismo contrato directamente. Versiones corregidas de referencia: glob >14.0.1, minimatch ≥11.0.1, fast-uri ≥3.1.9. |
| Prisma 6.19.3 → @prisma/config 6.19.3 → deepmerge-ts 7.1.5 | ggr8-5vv4-36mx | 3 altas propagadas. El aviso requiere deepmerge-ts ≥8.0.0; no forzar un major transitivo fuera del contrato de Prisma. |
| API → zod 3.25.76 | mrhx-c7xc-m3w5 | Alta. Corrección en 4.6.6 o posterior; migrar y comprobar todos los contratos de validación por separado. |
| react-router-dom → react-router 6.30.6 | wrjc-x8rr-h8h6; 337j-9hxr-rhxg | 2 moderadas propagadas. Corrección en 7.18.0 o posterior; requiere cambio mayor y pruebas de navegación. |

Registro anterior:

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
