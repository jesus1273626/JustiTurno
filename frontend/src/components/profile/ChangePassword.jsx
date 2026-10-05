import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { profileService } from '../../services/profileService'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    if (form.newPassword.length < 8) return toast.error('La nueva contraseña debe tener al menos 8 caracteres.')
    if (form.newPassword !== form.confirmPassword) return toast.error('Las contraseñas no coinciden.')
    setSaving(true)
    try {
      await profileService.changePassword(form)
      toast.success('Contraseña actualizada. Otras sesiones fueron cerradas.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    ['Contraseña actual', 'currentPassword'],
    ['Nueva contraseña', 'newPassword'],
    ['Confirmar contraseña', 'confirmPassword'],
  ]

  return (
    <section className="card p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <KeyRound className="text-primary" />
          <h2 className="font-bold text-navy">Seguridad</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Cambia tu contraseña. Al hacerlo, se cerrarán las sesiones de otros dispositivos.</p>
      </div>
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={save}>
        {fields.map(([label, key], index) => (
          <label key={key} className={index === 0 ? 'sm:col-span-2' : ''}>
            <span className="label">{label}</span>
            <span className="relative block">
              <input
                type={show ? 'text' : 'password'}
                className="field pr-11"
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
        ))}
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500">Mínimo 8 caracteres. No puede ser igual a la contraseña anterior.</p>
        </div>
        <div className="sm:col-span-2">
          <button className="btn-primary" disabled={saving}>
            <KeyRound size={16} />
            {saving ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </section>
  )
}