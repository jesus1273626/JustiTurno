# Seguridad

La [instancia pública](https://justiturno.onrender.com/) es una demo académica con cuentas de prueba compartidas. Usa exclusivamente datos y archivos ficticios. Render almacena los secretos del servidor. El navegador accede por HTTPS, bajo el mismo origen, con cookies `Secure`, `HttpOnly` y `SameSite=Lax`. La API comprueba el propietario, el servicio asignado y la visibilidad antes de leer adjuntos de PostgreSQL. No se publican URLs directas a los archivos.

Contraseñas con bcrypt; JWT incluye `jti` y se verifica contra `UserSession`; cookies httpOnly, `secure` en producción; roles y ownership restringen acciones. Helmet, CORS limitado, rate limit de auth, bloqueo por intentos, Zod, filtros de upload y auditoría reducen superficies de ataque. CSV se genera de datos validados. Revisar secretos con `git ls-files` antes de publicar.
