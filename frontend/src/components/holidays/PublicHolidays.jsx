import { useEffect, useState } from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { listPublicHolidays } from '../../services/publicHolidayService'

const formatHolidayDate = (value) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`))

export default function PublicHolidays() {
  const [state, setState] = useState('loading')
  const [holidays, setHolidays] = useState([])
  const load = async () => {
    setState('loading')
    try {
      const items = await listPublicHolidays()
      const today = new Date().toISOString().slice(0, 10)
      setHolidays(items.filter((item) => item.date >= today).slice(0, 3))
      setState('success')
    } catch { setState('error') }
  }
  useEffect(() => { load() }, [])
  return <section className="card p-6" aria-live="polite">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">Próximos días festivos</h2><p className="mt-1 text-xs text-slate-500">Referencia informativa; no modifica la disponibilidad de citas.</p></div><CalendarDays className="shrink-0 text-primary" size={21}/></div>
    {state === 'loading' && <p className="mt-5 text-sm text-slate-500">Consultando información...</p>}
    {state === 'success' && (holidays.length ? <ul className="mt-5 space-y-3">{holidays.map((holiday) => <li className="flex items-center justify-between gap-3 text-sm" key={`${holiday.date}-${holiday.name}`}><span className="font-medium text-slate-700">{holiday.name}</span><time className="shrink-0 font-semibold text-primary" dateTime={holiday.date}>{formatHolidayDate(holiday.date)}</time></li>)}</ul> : <p className="mt-5 text-sm text-slate-500">No hay días festivos disponibles para este periodo.</p>)}
    {state === 'error' && <div className="mt-5"><p className="text-sm text-rose-700">No fue posible consultar la información externa.</p><button className="btn-ghost mt-3 min-h-0 px-0 text-primary" type="button" onClick={load}><RefreshCw size={16}/>Reintentar</button></div>}
  </section>
}
