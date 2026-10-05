# JustiTurno

Sistema web para organizar servicios y citas de atención en una Casa de Justicia.

## Arquitectura

- `frontend/`: React + Vite, con modo demostración local y consumo de API real.
- `backend/`: Express, Prisma, PostgreSQL y autenticación con cookies httpOnly.
- `docker-compose.yml`: PostgreSQL 16 en el puerto local `5435`.

## Instalación

Desde `C:\Users\LENOVO\Documents\JustiTurno`:

```bash
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:migrate -- --name phase2_appointments
npm run prisma:seed
npm run dev
```

Frontend: `http://127.0.0.1:5174` · API: `http://127.0.0.1:8081/api/v1` en esta máquina.

## Modos del frontend

En `frontend/.env`, `VITE_USE_MOCKS=true` mantiene la demostración basada en `localStorage`. Con `VITE_USE_MOCKS=false`, inicio de sesión, disponibilidad, citas y acciones de funcionario usan la API real. El frontend envía cookies mediante `credentials: include`.

## API disponible

- Autenticación: registro, inicio de sesión (con bloqueo por intentos), cierre de sesión, `POST /auth/logout-all` (revoca todas las sesiones) y sesión actual.
- Servicios: listado, detalle y `GET /services/:slug/availability?date=YYYY-MM-DD`.
- Ciudadano: crear, consultar, detallar y cancelar citas.
- Funcionario: listar, aceptar, rechazar, reprogramar, atender, finalizar y registrar observaciones; `GET /employee/dashboard` con métricas y servicios asignados.
- Perfil (todos los roles): datos personales, cambio de contraseña (revoca otras sesiones) y sesiones activas con revocación.
- Administración: dashboard ampliado, citas, usuarios (detalle y activar/desactivar), servicios y horarios, CRUD de funcionarios con asignación de servicios, CRUD de requisitos por servicio y registro de auditoría con filtros.

## Seguridad

- Sesiones: cookie `httpOnly` + `sameSite=lax` (+ `secure` en producción), JWT con `jti` almacenado en `UserSession`; el middleware revoca el acceso si la sesión fue cerrada o expiró.
- Bloqueo: 5 intentos fallidos bloquean la cuenta por 15 minutos (autodesbloqueo).
- Protección de último administrador: no se puede desactivar el único admin activo.
- Auditoría: acciones de autenticación, perfiles, citas, servicios, funcionarios y administración quedan en `AuditLog`.
- CSRF: mitigado por `sameSite=lax` (la cookie no acompaña peticiones cross-site de mutación), CORS restringido al origen del frontend con credenciales, mutaciones solo por `POST/PATCH/DELETE` con `Content-Type: application/json` (requiere preflight). No se requiere token CSRF adicional; como endurecimiento opcional se puede migrar a `sameSite=strict`.

## Cuentas seed

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Ciudadano | ciudadano@demo.com | Demo1234 |
| Funcionario | funcionario@demo.com | Demo1234 |
| Funcionario 2 | funcionario2@demo.com | Demo1234 |
| Administrador | admin@demo.com | Demo1234 |

`funcionario@demo.com` atiende Orientación jurídica y Conciliación; `funcionario2@demo.com` atiende Comisaría de Familia y Atención a víctimas.

## Validación

```bash
# Raíz (backend)
npm run lint
npm run test

# Frontend
cd frontend
npm run lint
npm run test
npm run build
```

La disponibilidad se calcula en `America/Bogota` usando horarios activos, capacidad por franja y citas que consumen cupo. Cada transición de estado queda registrada en el historial de la cita. La suite backend (`backend/tests`) cubre Fase 2 y Fase 3 contra la API real; la suite frontend (`frontend/src/test`) cubre componentes públicos y de Fase 3.
