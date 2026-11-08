# Actividad 7 — Despliegue público

**Estado académico: CUMPLIDO.** Validación realizada el 7 de noviembre de 2026, hora de Bogotá.

[Aplicación](https://justiturno.onrender.com/) · [Portal de acceso](https://justiturno.onrender.com/login) · [Swagger](https://justiturno.onrender.com/api-docs/) · [Disponibilidad](https://justiturno.onrender.com/api/v1/health/ready)

El sitio académico está publicado en el plan Free de Render. El mismo servidor entrega la interfaz React y la API Express. La base Neon PostgreSQL conserva citas, sesiones y adjuntos privados cuando el servidor web se detiene. La inicialización y las seis migraciones están descritas en la [guía técnica](../DEPLOYMENT.md).

La comprobación desde Internet obtuvo HTTP 200 para la portada, la ruta directa de servicios, el catálogo API, Swagger, el contrato OpenAPI y los dos controles de conexión a PostgreSQL. Una ruta API inexistente devolvió HTTP 404 en JSON.

El [registro de 48 comprobaciones públicas](../evidencias/actividad7/flujo-citas.json) cubre la creación de una cita, la gestión por el funcionario asignado, cinco estados hasta la finalización y seis tipos de notificación. El PDF de 34.358 bytes se descargó con el mismo SHA-256 después de cerrar sesión y volver a ingresar. Un ciudadano ajeno y un funcionario de otro servicio recibieron HTTP 403. La descarga posterior al borrado devolvió HTTP 404.

Con el PostgreSQL de Docker detenido, se verificaron la disponibilidad de Neon, el inicio y cierre de sesión del ciudadano y el rechazo de su acceso al módulo administrativo. La cookie recibida por HTTPS tenía los atributos `Secure`, `HttpOnly` y `SameSite=Lax`.

Chromium abrió 21 rutas en seis anchos (1440, 1024, 768, 430, 390 y 375 px). Pasaron las 126 comprobaciones de desbordamiento horizontal. Los tres roles iniciaron sesión. Swagger ejecutó GET de salud y servicios con HTTP 200. Se descargó el CSV UTF-8 y se verificaron en la interfaz el CRUD de un requisito, las recargas y el rechazo de un título vacío. Tres tandas concurrentes a la API de salud, base y servicios devolvieron los resultados esperados.

El tablero ciudadano mostró los festivos de Nager.Date. Se verificaron carga, vacío y error controlando la respuesta de red en el navegador de prueba. Las diez capturas del sitio público incluyen su URL y tamaño en el [manifiesto](../evidencias/actividad7/manifest.json). Las actividades 4 y 6 conservan también sus capturas locales originales.

Pasaron 38 pruebas del backend y 17 del frontend, lint, compilación y validación de Prisma. El seguimiento de las cuatro alertas altas y dos moderadas figura en la [auditoría de dependencias](../DEPENDENCY_AUDIT.md).
