import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

export default function EmployeeForm({ employee, services, saving, onSave, onClose }) {
  const isNew = !employee
  const [form, setForm] = useState({ firstName: '', lastName: '', document: '', phone: '', email: '', password: '' })
  const [selected, setSelected] = useState([])
  useEffect(() => {
    if (employee) {
      setForm({ firstName: employee.firstName || '', lastName: employee.lastName || '', document: employee.document || '', phone: employee.phone || '', email: employee.email || '', password: '' })
      setSelected((employee.services || []).map((service) => service.id))
    } else {
      setForm({ firstName: '', lastName: '', document: '', phone: '', email: '', password: '' })
      setSelected([])
    }
  }, [employee])
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const submit = (event) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.document.trim() || !form.email.trim()) return
    if (isNew && form.password.length < 8) return
    onSave({ ...form, ...(form.password ? { password: form.password } : {}), serviceIds: selected })
  }
  return <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
    <label><span className="label">Nombre *</span><input className="field" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required/></label>
    <label><span className="label">Apellidos *</span><input className="field" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required/></label>
    <label><span className="label">Documento *</span><input className="field" value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} required disabled={!isNew}/></label>
    <label><span className="label">Teléfono</span><input className="field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label>
    <label className="sm:col-span-2"><span className="label">Correo electrónico *</span><input type="email" className="field" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required/></label>
    {isNew && <label className="sm:col-span-2"><span className="label">Contraseña inicial *</span><input type="password" className="field" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Mínimo 8 caracteres" required minLength={8}/><span className="mt-1 block text-xs text-slate-500">Se usará para iniciar sesión; el rol será funcionario.</span></label>}
    <fieldset className="sm:col-span-2"><legend className="label mb-2">Servicios que puede atender</legend>{services.length ? <div className="grid gap-2 sm:grid-cols-2">{services.map((service) => <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected.includes(service.id) ? 'border-primary bg-skysoft' : 'border-[#e4e7ec] hover:bg-slate-50'}`} key={service.id}><input type="checkbox" className="h-4 w-4 accent-[#1d4ed8]" checked={selected.includes(service.id)} onChange={() => toggle(service.id)}/><span className="text-sm font-medium text-slate-700">{service.name}<span className="ml-1 text-xs font-normal text-slate-500">{service.category}</span></span></label>)}</div> : <p className="text-sm text-slate-500">No hay servicios disponibles.</p>}</fieldset>
    <div className="mt-1 flex justify-end gap-3 sm:col-span-2 border-t pt-5"><button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={saving}><Check size={16}/>{saving ? 'Guardando…' : (isNew ? 'Crear funcionario' : 'Guardar cambios')}</button></div>
  </form>
}