# Seguridad

Contraseñas con bcrypt; JWT incluye `jti` y se verifica contra `UserSession`; cookies httpOnly, `secure` en producción; roles y ownership restringen acciones. Helmet, CORS limitado, rate limit de auth, bloqueo por intentos, Zod, filtros de upload y auditoría reducen superficies de ataque. CSV se genera de datos validados. Revisar secretos con `git ls-files` antes de publicar.
