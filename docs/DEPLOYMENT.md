# Despliegue público de JustiTurno

[Aplicación](https://justiturno.onrender.com/) · [Swagger](https://justiturno.onrender.com/api-docs/) · [Disponibilidad de la API y la base](https://justiturno.onrender.com/api/v1/health/ready)

El servicio Node de Render usa el plan Free en Virginia. Express sirve la SPA, la API y Swagger desde el mismo dominio HTTPS. Render asigna el puerto y el servidor escucha en todas las interfaces en producción. Neon aloja PostgreSQL 16 en un proyecto académico del plan Free. Los documentos y sus metadatos se guardan en una transacción y se descargan a través de la API autenticada. El despliegue es independiente del equipo de desarrollo.

## Configuración del servicio

- Repositorio `jesus1273626/JustiTurno`, rama `release/final`. La publicación es manual para decidir qué revisión pasa a la instancia pública. [Servicio en Render](https://dashboard.render.com/web/srv-dbnrpb8u01pc73dikdc0).
- Compilación con `npm ci --include=dev && npm run prisma:generate && npm run build`. Arranque con `npm start --workspace backend`.
- Render proporciona `PORT` y `RENDER_EXTERNAL_URL`. La aplicación usa este último como origen permitido. Variables de compilación: `VITE_USE_MOCKS=false`, `VITE_API_URL=/api/v1` y `VITE_ACADEMIC_DEMO=true`. Variables del servidor: `NODE_ENV=production`, `NODE_VERSION=22`, `APP_TIMEZONE=America/Bogota` y `MAX_UPLOAD_SIZE_MB=5`.
- `DATABASE_URL` y `JWT_SECRET` son secretos de Render. Mantener el mismo secreto al redesplegar para conservar sesiones vigentes.

## Base y archivos

Aplicar las migraciones con `prisma migrate deploy` desde el workspace del backend, con la conexión del entorno de destino. Comprobar después con `prisma migrate status`. Se aplicaron seis migraciones, incluida la tabla privada `AttachmentContent`. La inicialización académica con `NODE_ENV=production` y `DEMO_SEED=true` se ejecutó dos veces sobre la base dedicada de Neon. Se conservaron cuatro usuarios, seis servicios, cinco citas y ocho transiciones iniciales. Las publicaciones posteriores conservan los datos.

## Operación

Render confirmó como activa la revisión de aplicación [870197e](https://github.com/jesus1273626/JustiTurno/commit/870197ee1dcbc9a440d777a0415e8838216d9f55), despliegue `dep-dbnrr3s9v7es73djaeog`. La revisión contiene los ajustes para pantallas estrechas y los scripts de verificación.

Comprobar la portada, `/api/v1/health/ready`, un login y una descarga autenticada después de cada publicación. La suspensión del servicio web por inactividad puede demorar el primer acceso. Los datos persisten en Neon mientras el servidor web duerme. [Condiciones de Render Free](https://render.com/docs/free).

Para revertir el servidor, utilizar el último despliegue estable en Render y comprobar su compatibilidad con el esquema vigente. Las migraciones y los datos requieren una estrategia de recuperación independiente. La configuración alternativa de Wrangler sigue disponible para desarrollo.
