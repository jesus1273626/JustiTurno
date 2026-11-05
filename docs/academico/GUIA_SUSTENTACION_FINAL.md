# Guion de sustentación final (10–15 min)

**Recorrido público previsto (05-11-2026).** Antes de exponer, abrir la URL real que informe Wrangler y confirmar que `/api/v1/health/ready` responde 200. Mientras no se publique, identificar expresamente cualquier demostración como vista previa local.

- Minutos 0–3: explicar el problema desde Home. Abrir Servicios; explicar que el navegador usa el mismo dominio para React y Express. Abrir Swagger y ejecutar GET /services.
- Minutos 3–6: ingresar como ciudadano, elegir servicio y franja, consultar el código JT y adjuntar el PDF de demostración. Mostrar el calendario externo.
- Minutos 6–8: en otra sesión de funcionario, abrir la agenda, aceptar la cita, agregar observación y finalizar la atención.
- Minutos 8–11: como administrador abrir Servicios → Requisitos. Crear un requisito temporal, recargar, editar, recargar y eliminar únicamente ese requisito. Mostrar el error de título vacío y el reporte CSV.
- Minutos 11–14: mostrar health/db y ready, explicar PostgreSQL administrado, Hyperdrive, sesiones revocables y descarga autorizada desde R2. Cerrar con las pruebas y evidencias; separar resultados públicos de locales.

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
14. Conclusión: aplicación funcional, documentada y preparada para configurar infraestructura pública.
