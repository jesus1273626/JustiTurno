import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { appointmentService } from '../../services/appointmentService'
import { serviceService } from '../../services/serviceService'
import PageHeader from '../../components/ui/PageHeader'

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
export default function NewAppointmentPage() {
  const { user } = useAuth(); const nav = useNavigate()
  const [services, setServices] = useState([]); const [slots, setSlots] = useState([])
  const [form, setForm] = useState({ serviceId: '', date: '', time: '', reason: '', optional: '' })
  const [errors, setErrors] = useState({}); const [loading, setLoading] = useState(false); const [loadingSlots, setLoadingSlots] = useState(false)
  const service = services.find((item) => item.id === form.serviceId)
  useEffect(() => { serviceService.listAsync().then((items) => setServices(items.filter((item) => item.active !== false))).catch((error) => toast.error(error.message)) }, [])
  useEffect(() => {
    if (!service || !form.date) { setSlots([]); return }
    setLoadingSlots(true); setForm((current) => ({ ...current, time: '' }))
    appointmentService.availability(service.slug || service.id, form.date).then(setSlots).catch((error) => { setSlots([]); toast.error(error.message) }).finally(() => setLoadingSlots(false))
  }, [service, form.date])
  const submit = async (event) => {
    event.preventDefault(); const next = {}
    if (!form.serviceId) next.serviceId = 'Selecciona un servicio.'
    if (!form.date) next.date = 'Selecciona una fecha.'
    if (!form.time) next.time = 'Selecciona un horario disponible.'
    if (form.reason.trim().length < 10) next.reason = 'Describe el motivo con al menos 10 caracteres.'
    setErrors(next); if (Object.keys(next).length) return
    setLoading(true)
    try {
      const created = await appointmentService.createAsync({ serviceId: form.serviceId, date: form.date, time: form.time, reason: form.reason, observations: form.optional, service: service.name }, user)
      toast.success('Tu solicitud fue registrada correctamente.'); nav(`/ciudadano/citas/${created.id}`)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }
  return <><PageHeader title="Solicitar cita" description="Completa la información para registrar tu solicitud de atención."/><form className="card max-w-3xl p-5 sm:p-7" onSubmit={submit} noValidate><div className="mb-7 grid gap-3 border-b pb-6 sm:grid-cols-4">{['Servicio', 'Fecha', 'Horario', 'Motivo'].map((item, index) => <div className="flex items-center gap-2 text-sm font-semibold text-slate-500" key={item}><span className={`grid h-6 w-6 place-items-center rounded-full ${index === 0 ? 'bg-primary text-white' : 'bg-slate-100'}`}>{index + 1}</span>{item}</div>)}</div><div className="grid gap-5 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="label">Servicio <b className="text-red-600">*</b></span><select className="field" value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}><option value="">Selecciona el servicio</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.serviceId && <small className="mt-1 block text-red-600">{errors.serviceId}</small>}</label><label><span className="label">Fecha <b className="text-red-600">*</b></span><input className="field" type="date" min={today} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/>{errors.date && <small className="mt-1 block text-red-600">{errors.date}</small>}</label><div><span className="label">Horario <b className="text-red-600">*</b></span><div className="mt-2 flex min-h-10 flex-wrap gap-2">{loadingSlots ? <small className="text-slate-500">Consultando disponibilidad…</small> : slots.map((slot) => <button type="button" disabled={!slot.available} key={slot.time} onClick={() => setForm({ ...form, time: slot.time })} className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${form.time === slot.time ? 'border-primary bg-skysoft text-primary' : 'hover:bg-slate-50'}`}>{slot.time}{slot.remaining !== undefined && <small className="ml-1">({slot.remaining})</small>}</button>)}</div>{errors.time && <small className="mt-1 block text-red-600">{errors.time}</small>}</div><label className="block sm:col-span-2"><span className="label">Motivo de la solicitud <b className="text-red-600">*</b></span><textarea className="field min-h-28" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Describe brevemente el motivo de tu solicitud."/>{errors.reason && <small className="mt-1 block text-red-600">{errors.reason}</small>}</label><label className="block sm:col-span-2"><span className="label">Observaciones <span className="font-normal text-slate-500">(opcional)</span></span><textarea className="field min-h-20" value={form.optional} onChange={(event) => setForm({ ...form, optional: event.target.value })}/></label></div><div className="mt-6 flex items-center justify-between border-t pt-5"><p className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><CheckCircle2 size={16} className="text-primary"/> La solicitud inicia en estado pendiente.</p><button className="btn-primary" disabled={loading}>{loading ? 'Registrando…' : 'Confirmar solicitud'}</button></div></form></> 
}
