import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'

export default function PersonalInfo({ user }) {
  const { updateUser } = useAuth()
  const [edit, setEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const startEdit = () => { setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '' }); setEdit(true) }
  const save = async (event) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return toast.error('Nombre, apellidos y correo son obligatorios.')
    setSaving(true)
    try {
      const updated = await updateUser(form)
      toast.success('Datos actualizados correctamente.')
      setEdit(false)
      return updated
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }
  const fields = [
    ['Nombre', 'firstName', true],
    ['Apellidos', 'lastName', true],
    ['Documento', 'document', false],
    ['Correo electrónico', 'email', true],
    ['Teléfono', 'phone', true]
  ]
  return <section className="card p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-navy">Información personal</h2><p className="mt-1 text-sm text-slate-500">Datos de contacto y identificación.</p></div>{!edit && <button className="btn-secondary" onClick={startEdit}><Pencil size={16}/>Editar</button>}</div>{edit ? <form className="grid gap-5 sm:grid-cols-2" onSubmit={save}>{fields.map(([label, key, editable]) => <label className={key === 'email' || key === 'phone' ? 'sm:col-span-2' : ''} key={key}><span className="label">{label}</span><input className="field disabled:bg-slate-50" disabled={!editable || key === 'document'} value={key === 'document' ? (user.document || 'No registrado') : form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label>)}<div className="mt-2 flex justify-end gap-3 sm:col-span-2 border-t pt-5"><button type="button" className="btn-ghost" onClick={() => setEdit(false)}><X size={16}/>Cancelar</button><button className="btn-primary" disabled={saving}><Check size={16}/>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div></form> : <div className="grid gap-5 sm:grid-cols-2">{fields.map(([label, key]) => <div className={key === 'email' || key === 'phone' ? 'sm:col-span-2' : ''} key={key}><p className="label">{label}</p><p className="mt-1 text-sm text-slate-800">{key === 'document' ? (user.document || 'No registrado') : (user[key] || 'No registrado')}</p></div>)}<div className="sm:col-span-2"><p className="label">Rol</p><p className="mt-1 text-sm text-slate-800">{user.role === 'ADMIN' ? 'Administrador' : user.role === 'EMPLOYEE' ? 'Funcionario' : 'Ciudadano'}</p></div></div>}</section>
}