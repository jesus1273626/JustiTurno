export const formatDate = (value) => {
  const date = new Date(/^\d{4}-\d\d-\d\d$/.test(value) ? value + 'T12:00:00-05:00' : value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('es-CO', { day:'numeric', month:'long', year:'numeric', timeZone:'America/Bogota' }).format(date) : '—'
}
export const formatTime = (time) => new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}:00`))
