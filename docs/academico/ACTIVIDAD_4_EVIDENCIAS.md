# Evidencias de Actividad 4

No se incluyen capturas inventadas. Con `VITE_USE_MOCKS=false`, inicie el frontend, entre como `ciudadano@demo.com` / `Demo1234` y abra `/ciudadano`.

1. Recargue la página y capture **loading** mientras aparece “Consultando información...”.
2. Espere la respuesta y capture la lista de “Próximos días festivos” (**success**).
3. En DevTools > Network, bloquee `date.nager.at`, recargue y capture **error**; pulse **Reintentar**.
4. Para **empty**, sustituya temporalmente en DevTools la respuesta por `[]` con Local Overrides o pruebe el componente con una respuesta vacía en la suite; capture el mensaje indicado. Restaure la red/override al terminar.
