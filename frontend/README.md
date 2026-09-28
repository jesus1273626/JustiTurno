# JustiTurno Frontend

Primera entrega funcional del frontend de JustiTurno, una plataforma para organizar citas y solicitudes de atención en una Casa de Justicia.

## Tecnologías

React, Vite, JavaScript, React Router DOM, Tailwind CSS, Lucide React, Sonner, Vitest y React Testing Library.

## Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

Abre la URL exacta que mostrará Vite (por defecto `http://127.0.0.1:5174/`). Se usa este host y puerto para evitar conflictos con otros proyectos que puedan estar usando `localhost:5173`.

Para crear el build de producción, ejecutar las validaciones o las pruebas:

```bash
npm run build
npm run lint
npm run test
```

## Cuentas demo

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Ciudadano | ciudadano@demo.com | Demo1234 |
| Funcionario | funcionario@demo.com | Demo1234 |
| Administrador | admin@demo.com | Demo1234 |

## Datos simulados

La aplicación usa `VITE_USE_MOCKS=true` y persiste sesión, citas y cambios administrativos en `localStorage`. Estos datos son exclusivamente simulados para desarrollo y demostración. Las capas en `src/services/` aíslan el acceso a los datos para reemplazarlas posteriormente por llamadas `fetch()` contra `VITE_API_URL` (Node.js, Express y PostgreSQL).
