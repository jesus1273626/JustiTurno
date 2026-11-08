# Arquitectura

JustiTurno es un monorepo npm con `frontend/` React/Vite y `backend/` Express/Prisma. El navegador solo conoce la API REST; Prisma es el único acceso a PostgreSQL. Consulte `docs/academico/ACTIVIDAD_1_ARQUITECTURA.md` para el flujo y decisiones.

En [la instancia pública](https://justiturno.onrender.com/), un servicio Node de Render aloja React, Express y Swagger. Prisma conecta con Neon mediante TLS. Los listados consultan metadatos de adjuntos. La descarga autorizada consulta la tabla separada que contiene el archivo.
