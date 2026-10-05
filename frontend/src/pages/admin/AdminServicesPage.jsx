import { useEffect, useState } from 'react'
import { ListChecks, Pencil, Plus, Power, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { adminService } from '../../services/adminService'

const blank = { name: '', slug: '', description: '', category: 'Información', durationMinutes: 60 }

export default function AdminServicesPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [requirementsFor, setRequirementsFor] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [requirementForm, setRequirementForm] = useState({ title: '', description: '', required: true, editingId: null })

  const load = () => adminService.services().then(setItems).catch((error) => toast.error(error.message))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing('new'); setForm(blank) }
  const save = async () => {
    if (!form.name || !form.slug || form.description.length < 10 || !form.category) return toast.error('Completa los campos requeridos y una descripción de al menos 10 caracteres.')
    setSaving(true)
    try {
      const data = { ...form, durationMinutes: Number(form.durationMinutes) }
      const saved = editing === 'new' ? await adminService.createService(data) : await adminService.updateService(editing.id, data)
      setItems((current) => editing === 'new' ? [...current, saved] : current.map((item) => item.id === saved.id ? saved : item))
      setEditing(null)
      toast.success(editing === 'new' ? 'Servicio creado.' : 'Servicio actualizado.')
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }
  const toggle = async (item) => {
    try {
      const saved = await adminService.setServiceStatus(item.id, !item.active)
      setItems((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
      toast.success(`Servicio ${saved.active ? 'activado' : 'desactivado'}.`)
    } catch (error) { toast.error(error.message) }
  }

  const openRequirements = async (service) => {
    setRequirementsFor(service)
    setRequirements((service.requirements || []).map((item) => ({ ...item })))
    setRequirementForm({ title: '', description: '', required: true, editingId: null })
  }
  const saveRequirement = async (event) => {
    event.preventDefault()
    if (!requirementForm.title.trim()) return toast.error('El título del requisito es obligatorio.')
    const payload = { title: requirementForm.title.trim(), description: requirementForm.description.trim(), required: requirementForm.required }
    try {
      if (requirementForm.editingId) {
        const result = await adminService.updateRequirement(requirementForm.editingId, payload)
        setRequirements((current) => current.map((item) => item.id === requirementForm.editingId ? result.requirement : item))
        toast.success('Requisito actualizado.')
      } else {
        const result = await adminService.createRequirement(requirementsFor.id, payload)
        setRequirements((current) => [...current, result.requirement])
        toast.success('Requisito agregado.')
      }
      setRequirementForm({ title: '', description: '', required: true, editingId: null })
    } catch (error) { toast.error(error.message) }
  }
  const editRequirement = (item) => setRequirementForm({ title: item.title, description: item.description || '', required: item.required, editingId: item.id })
  const removeRequirement = async (item) => {
    try { await adminService.deleteRequirement(item.id); setRequirements((current) => current.filter((entry) => entry.id !== item.id)); toast.success('Requisito eliminado.') } catch (error) { toast.error(error.message) }
  }
  const toggleRequirement = async (item) => {
    try {
      const result = await adminService.updateRequirement(item.id, { required: !item.required })
      setRequirements((current) => current.map((entry) => entry.id === item.id ? result.requirement : entry))
    } catch (error) { toast.error(error.message) }
  }

  return <><PageHeader title="Gestión de servicios" description="Administra la oferta visible en la plataforma y sus requisitos." action={<button className="btn-primary" onClick={openNew}><Plus size={17}/>Nuevo servicio</button>}/>
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Servicio</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Duración</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
        <tbody>
          {items.map((item) => <tr className="border-t" key={item.id}>
            <td className="px-5 py-4 font-bold text-navy">{item.name}<small className="mt-1 block font-normal text-slate-500">{item.category} · {item.slug}</small></td>
            <td className="max-w-sm px-5 py-4 text-slate-600">{item.description}</td>
            <td className="px-5 py-4">{item.durationMinutes} min</td>
            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{item.active ? 'Activo' : 'Inactivo'}</span></td>
            <td className="px-5 py-4"><div className="flex justify-end gap-1">
              <button className="btn-ghost min-h-0 p-2" aria-label="Requisitos" onClick={() => openRequirements(item)}><ListChecks size={17}/></button>
              <button className="btn-ghost min-h-0 p-2" aria-label="Editar" onClick={() => { setEditing(item); setForm({ name: item.name, slug: item.slug, description: item.description, category: item.category, durationMinutes: item.durationMinutes }) }}><Pencil size={17}/></button>
              <button className="btn-ghost min-h-0 p-2" aria-label="Cambiar estado" onClick={() => toggle(item)}><Power size={17}/></button>
            </div></td>
          </tr>)}
        </tbody>
      </table>
      {!items.length && <p className="p-6 text-sm text-slate-500">No hay servicios para mostrar.</p>}
    </div>
    {editing && <Modal title={editing === 'new' ? 'Nuevo servicio' : 'Editar servicio'} onClose={() => setEditing(null)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className="label">Nombre *</span><input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
        <label className="block"><span className="label">Categoría *</span><input className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}/></label>
        <label className="block sm:col-span-2"><span className="label">Identificador (slug) *</span><input className="field" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })}/></label>
        <label className="block sm:col-span-2"><span className="label">Descripción * (mín. 10 caracteres)</span><textarea className="field" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
        <label className="block"><span className="label">Duración (minutos) *</span><input type="number" className="field" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}/></label>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t pt-5"><button className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar servicio'}</button></div>
    </Modal>}
    {requirementsFor && <Modal title={`Requisitos · ${requirementsFor.name}`} onClose={() => setRequirementsFor(null)}>
      <form className="mb-5 grid gap-4 sm:grid-cols-2" onSubmit={saveRequirement}>
        <label className="block"><span className="label">Título *</span><input className="field" value={requirementForm.title} onChange={(event) => setRequirementForm({ ...requirementForm, title: event.target.value })} placeholder="Ej. Documento de identidad"/></label>
        <label className="block"><span className="label">Descripción</span><input className="field" value={requirementForm.description} onChange={(event) => setRequirementForm({ ...requirementForm, description: event.target.value })} placeholder="Opcional"/></label>
        <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-[#1d4ed8]" checked={requirementForm.required} onChange={(event) => setRequirementForm({ ...requirementForm, required: event.target.checked })}/><span className="text-sm font-semibold text-slate-700">Obligatorio</span></label>
        <div className="sm:col-span-2"><button className="btn-secondary" type="submit"><Save size={16}/>{requirementForm.editingId ? 'Guardar requisito' : 'Agregar requisito'}</button>{requirementForm.editingId && <button className="btn-ghost ml-2" type="button" onClick={() => setRequirementForm({ title: '', description: '', required: true, editingId: null })}>Cancelar edición</button>}</div>
      </form>
      <div className="divide-y">
        {requirements.map((item) => <div className="flex items-center gap-3 py-3" key={item.id}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy">{item.title}</p>
            {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
          </div>
          <button className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.required ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`} onClick={() => toggleRequirement(item)}>{item.required ? 'Obligatorio' : 'Opcional'}</button>
          <button className="btn-ghost min-h-0 p-2" aria-label="Editar requisito" onClick={() => editRequirement(item)}><Pencil size={15}/></button>
          <button className="btn-ghost min-h-0 p-2" aria-label="Eliminar requisito" onClick={() => removeRequirement(item)}><Trash2 size={15}/></button>
        </div>)}
        {!requirements.length && <p className="py-4 text-sm text-slate-500">No hay requisitos para este servicio.</p>}
      </div>
    </Modal>}
  </>
}