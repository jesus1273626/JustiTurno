# Actividad 4 — API externa

Se verificó el **26 de octubre de 2026** la API pública Nager.Date: `GET https://date.nager.at/api/v3/PublicHolidays/2026/CO`. Respondió JSON con 19 elementos, sin secreto. Ejemplo real: `{"date":"2026-01-01","localName":"Año Nuevo","name":"New Year's Day","countryCode":"CO","global":true}`.

`frontend/src/services/publicHolidayService.js` encapsula HTTP y normaliza `date`, `name` y `global`. `frontend/src/components/holidays/PublicHolidays.jsx`, incluido en el tablero ciudadano, muestra próximos tres días. Es una referencia institucional: **no altera cupos, horarios ni disponibilidad**.

El componente presenta *Consultando información...* (loading), lista (success), *No hay días festivos disponibles para este periodo.* (empty) y *No fue posible consultar la información externa.* con **Reintentar** (error). Para reemplazarla, cambie `VITE_PUBLIC_HOLIDAYS_API_URL` por un servicio con el mismo contrato o elimine el componente; ninguna regla de negocio depende de ella.
