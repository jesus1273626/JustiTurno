# Actividad 5 — Backend y API propia

`backend/src` separa rutas, controladores, servicios, validadores Zod, middlewares y utilidades. Prisma define el esquema y migraciones PostgreSQL. La API usa JSON y respuestas homogéneas; `errorHandler` controla errores de validación, autorización y negocio.

Rutas principales: `/api/v1/auth`, `/services`, `/appointments`, `/employee`, `/admin`, `/profile`, `/notifications` y `/health`. Autenticación usa bcrypt, JWT con `jti` y `UserSession` en cookie httpOnly. El acceso por rol y ownership se verifica antes de operaciones sensibles. Swagger está en `/api-docs`; JSON en `/api-docs.json`. Allí use **Try it out**, complete parámetros/cuerpo y pulse **Execute**; para rutas protegidas primero inicie sesión en la misma sesión del navegador.
