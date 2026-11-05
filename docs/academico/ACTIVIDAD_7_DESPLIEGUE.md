# Actividad 7 — Preparación de despliegue

Arquitectura elegida (05-11-2026): React + Express en el Worker justiturno, Prisma Postgres vía Hyperdrive y adjuntos R2. Estado: PENDIENTE de evidencia pública. El procedimiento vigente y el rollback están en [DEPLOYMENT](../DEPLOYMENT.md); las opciones de hosts separados descritas abajo son alternativas históricas.

## Requisitos y variables

Backend: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `APP_TIMEZONE`, `UPLOAD_DIR`, `MAX_UPLOAD_SIZE_MB`, `JWT_EXPIRES_IN`, `COOKIE_NAME`. Frontend: `VITE_API_URL`, `VITE_USE_MOCKS=false`, `VITE_PUBLIC_HOLIDAYS_API_URL`. No publicar `.env` ni secretos.

```
FRONTEND_PUBLIC_URL=
BACKEND_PUBLIC_URL=
```

## Pasos

1. Provisionar PostgreSQL y cargar `DATABASE_URL` segura en backend.
2. En backend: `npm ci`, `npm run prisma:generate`, `npx prisma migrate deploy`, `npm start`.
3. Configurar `FRONTEND_URL` exactamente al origen público y `PORT` proporcionado por hosting.
4. En frontend: configurar `VITE_API_URL=https://BACKEND_PUBLIC_URL/api/v1`, ejecutar `npm ci && npm run build` y publicar `frontend/dist`.
5. Verificar `/api/v1/health`, `/health/db`, `/health/ready`, `/api-docs` y login desde el dominio público.

CORS permite únicamente `FRONTEND_URL` con credenciales. La cookie es httpOnly y `secure` en producción; si los dominios son cross-site se debe probar y decidir `sameSite` con el proveedor antes de modificarlo. Los uploads en disco local no sobreviven hosting efímero: usar volumen persistente u object storage. Rollback básico: revertir al despliegue anterior, restaurar una copia de la base y no ejecutar migraciones irreversibles sin respaldo.
