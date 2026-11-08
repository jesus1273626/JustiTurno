# JustiTurno

JustiTurno organiza servicios y citas de una Casa de Justicia. Reduce la atención informal, permite seguir cada solicitud y separa responsabilidades de ciudadanía, funcionarios y administración.

**Demo académica en línea:** [Abrir JustiTurno](https://justiturno.onrender.com/) · [Iniciar sesión](https://justiturno.onrender.com/login) · [Swagger](https://justiturno.onrender.com/api-docs/). Usa datos ficticios. La primera visita después de un periodo de inactividad puede tardar alrededor de un minuto.

## Usuarios y características

- **Ciudadano:** registro, perfil, servicios, disponibilidad, citas, adjuntos y notificaciones.
- **Funcionario:** agenda, observaciones y transiciones de atención.
- **Administrador:** usuarios, funcionarios, servicios, requisitos, horarios, auditoría, reportes y CSV.

Incluye códigos JT, cupos por franja, historial, sesiones revocables, Swagger/OpenAPI y health checks.

## Arquitectura y stack

React + Vite + Tailwind forman la SPA; Express ofrece una API REST JSON; Prisma accede a PostgreSQL. Tecnologías: JavaScript, React Router, Node.js, Express, Prisma, PostgreSQL, Zod, bcrypt, JWT, Docker, Vitest y ESLint. Detalles: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
frontend/  SPA, rutas, componentes, contextos y servicios HTTP
backend/   API Express, Prisma, validadores, middlewares y pruebas
docs/      documentación técnica, académica y evidencias
```

## Requisitos e instalación

Node.js 20+, npm y Docker Desktop activo.

```powershell
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:seed
npm run dev
```

Frontend: `http://127.0.0.1:5174` · API: `http://127.0.0.1:8081/api/v1` · Swagger: `http://127.0.0.1:8081/api-docs`.

## Variables

Copie los ejemplos como `.env` locales, sin subirlos a Git.

```text
# backend/.env
NODE_ENV=development
PORT=8081
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/justiturno?schema=public
JWT_SECRET=un-secreto-local-seguro
FRONTEND_URL=http://127.0.0.1:5174
APP_TIMEZONE=America/Bogota
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5

# frontend/.env
VITE_API_URL=http://127.0.0.1:8081/api/v1
VITE_USE_MOCKS=false
VITE_PUBLIC_HOLIDAYS_API_URL=https://date.nager.at/api/v3/PublicHolidays
```

## Base de datos, Prisma y desarrollo

PostgreSQL corre por Docker en `5435`. Use `npm run prisma:generate`; para una migración de desarrollo use `npm run prisma:migrate -- --name nombre`; para recargar datos demo, `npm run prisma:seed`. No ejecute el seed automáticamente en producción.

`npm run dev` inicia API y frontend juntos. Si Vite informa que el puerto está ocupado, cierre el proceso Vite anterior o use la URL que ese proceso ya mostró; no abra el puerto de otro proyecto.

## Calidad

```powershell
npm run lint
npm run test
npm run build
npx prisma validate --schema backend/prisma/schema.prisma
```

## Demo

| Rol | Correo | Contraseña |
|---|---|---|
| Ciudadano | ciudadano@demo.com | Demo1234 |
| Funcionario | funcionario@demo.com | Demo1234 |
| Administrador | admin@demo.com | Demo1234 |

## Seguridad, notificaciones y archivos

Contraseñas bcrypt, JWT con `jti`, sesiones revocables, cookies httpOnly, roles, ownership, bloqueo de login, rate limits, Helmet, CORS restringido, Zod, auditoría y filtros de upload protegen el sistema. Las notificaciones, adjuntos y reportes CSV están integrados por rol. Detalles: [docs/SECURITY.md](docs/SECURITY.md).

## API externa académica

El tablero ciudadano consulta festivos públicos de Colombia desde Nager.Date solo como referencia informativa. No altera disponibilidad. Véase [Actividad 4](docs/academico/ACTIVIDAD_4_API_EXTERNA.md).

## Despliegue

Render Free sirve React y Express desde el mismo origen. Neon Free conserva las citas, las sesiones y el contenido privado de los adjuntos en PostgreSQL. La [comprobación de disponibilidad](https://justiturno.onrender.com/api/v1/health/ready) verifica la conexión. Consulta la [guía de despliegue](docs/DEPLOYMENT.md).
