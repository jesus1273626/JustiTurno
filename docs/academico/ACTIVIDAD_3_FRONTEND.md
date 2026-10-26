# Actividad 3 — Frontend

`frontend/src` organiza `pages/` por público, autenticación y rol; `components/` reutilizables; `layouts/` público/portal; `routes/ProtectedRoute.jsx`; `context/AuthContext.jsx`; `services/` HTTP, mocks y dominio; `utils/` de formato; y `data/mock/` para modo demostración.

Hay navegación React Router, layouts responsivos Tailwind, formularios con mensajes y componentes como modal, paginación, estados, tarjetas, lista de citas y notificaciones. `VITE_USE_MOCKS` conserva el modo local; con `false`, los servicios consumen la API configurada con `VITE_API_URL`. Esta separación deja la interfaz preparada para API sin acoplarla a endpoints dentro de componentes.
