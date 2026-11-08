# Guion de sustentación final (10–15 min)

Abrir [JustiTurno](https://justiturno.onrender.com/) y el [estado de la base](https://justiturno.onrender.com/api/v1/health/ready). El primer acceso puede tardar alrededor de un minuto cuando Render ha suspendido el servidor por inactividad. Usar únicamente datos ficticios.

- Minutos 0–3: explicar el problema desde Home. Abrir Servicios; explicar que el navegador usa el mismo dominio para React y Express. Abrir Swagger y ejecutar GET /services.
- Minutos 3–6: ingresar como ciudadano, elegir servicio y franja, consultar el código JT y adjuntar el PDF de demostración. Mostrar el calendario externo.
- Minutos 6–8: en otra sesión de funcionario, abrir la agenda, aceptar la cita, agregar observación y finalizar la atención.
- Minutos 8–11: como administrador abrir Servicios → Requisitos. Crear un requisito temporal, recargar, editar, recargar y eliminar únicamente ese requisito. Mostrar el error de título vacío y el reporte CSV.
- Minutos 11–14: mostrar health/db y ready. Explicar la conexión de Render con Neon, las sesiones revocables y el control de permisos al descargar un documento guardado en PostgreSQL. Abrir las evidencias de validación.

1. Problema: turnos y trazabilidad en una Casa de Justicia.
2. Arquitectura: React SPA, Express API, Prisma y PostgreSQL.
3. Frontend: rutas, layouts y servicios separados.
4. Backend: rutas, validadores y respuestas JSON.
5. Base de datos: entidades usuario, servicio, requisito, cita y auditoría.
6. Seguridad: bcrypt, sesión JWT con jti, cookies httpOnly, roles, rate limit y Zod.
7. Ciudadano: solicitar y consultar una cita.
8. Funcionario: agenda y transición de atención.
9. Administrador: servicios, requisitos, usuarios y reportes.
10. API: Swagger y health checks.
11. CRUD: crear, editar y eliminar un requisito desde interfaz.
12. Producción: variables, CORS, cookies, migraciones y uploads persistentes.
13. Pruebas: lint, tests, build y auditoría de dependencias.
14. Infraestructura pública: servicio Node en Render y PostgreSQL en Neon.
