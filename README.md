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

- Autenticación: registro, inicio/cierre de sesión y sesión actual.
- Servicios: listado, detalle y `GET /services/:slug/availability?date=YYYY-MM-DD`.
- Ciudadano: crear, consultar, detallar y cancelar citas.
- Funcionario: listar, aceptar, rechazar, reprogramar, atender, finalizar y registrar observaciones.
- Administración: dashboard, citas, usuarios, servicios y horarios.

## Cuentas seed

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Ciudadano | ciudadano@demo.com | Demo1234 |
| Funcionario | funcionario@demo.com | Demo1234 |
| Administrador | admin@demo.com | Demo1234 |

## Validación

```bash
npm run lint
npm run test
npm run build
```

La disponibilidad se calcula en `America/Bogota` usando horarios activos, capacidad por franja y citas que consumen cupo. Cada transición de estado queda registrada en el historial de la cita.
