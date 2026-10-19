import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, CircleOff, Search, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { adminService } from '../../services/adminService'

const labels = { CITIZEN: 'Ciudadano', EMPLOYEE: 'Funcionario', ADMIN: 'Administrador' }
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-CO', { dateStyle: 'medium' }) }

export default function AdminUsersPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback((targetPage = 1) => {
    setLoading(true)
    const filters = { page: targetPage, limit: 8, ...(search ? { search } : {}), ...(role ? { role } : {}), ...(activeFilter ? { active: activeFilter } : {}) }
    adminService.users(filters)
      .then((result) => { setItems(result.items || []); setPagination(result.pagination); setPage(targetPage) })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [search, role, activeFilter])
  useEffect(() => { load(1) }, [load])

  const filter = () => load(1)
  const toggleStatus = async () => {
    if (!toggling) return
    const active = !toggling.active
    try {
      await adminService.setUserStatus(toggling.id, active)
      setItems((current) => current.map((item) => item.id === toggling.id ? { ...item, active } : item))
      setToggling(null)
      toast.success(`Usuario ${active ? 'activado' : 'desactivado'}.`)
    } catch (error) { toast.error(error.message) }
  }
  const openDetail = async (item) => {
    try {
      const result = await adminService.getUser(item.id)
      setDetail(result.user)
    } catch (error) { toast.error(error.message) }
  }

  const statusBadge = (active) => active ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Activo</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Inactivo</span>

  return <><PageHeader title="Usuarios" description="Consulta y administra los usuarios registrados en la plataforma."/>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="field pl-10" placeholder="Buscar por nombre, correo o documento" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && filter()}/></label>
      <select className="field sm:w-40" value={role} onChange={(event) => { setRole(event.target.value) }} aria-label="Filtrar por rol">
        <option value="">Todos los roles</option>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select className="field sm:w-40" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
      <button className="btn-secondary" onClick={filter}>Filtrar</button>
    </div>
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Correo</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
        <tbody>
          {items.map((user) => <tr className="border-t" key={user.id}>
            <td className="px-5 py-4 font-semibold text-navy">{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}<p className="text-xs font-normal text-slate-500">{user.document}</p></td>
            <td className="px-5 py-4 text-slate-600">{user.email}</td>
            <td className="px-5 py-4 text-slate-600">{labels[user.role]}</td>
            <td className="px-5 py-4">{statusBadge(user.active)}</td>
            <td className="px-5 py-4"><div className="flex justify-end gap-1">
              <button className="btn-ghost min-h-0 p-2" aria-label="Ver detalle" onClick={() => openDetail(user)}><UserRound size={17}/></button>
              <button className="btn-ghost min-h-0 p-2" aria-label={user.active ? 'Desactivar' : 'Activar'} onClick={() => setToggling(user)}>{user.active ? <CircleOff size={17}/> : <CheckCircle2 size={17}/>}</button>
            </div></td>
          </tr>)}
        </tbody>
      </table>
      {loading && <p className="p-6 text-sm text-slate-500">Cargando usuarios…</p>}
      {!loading && !items.length && <p className="p-6 text-sm text-slate-500">No hay usuarios para mostrar.</p>}
    </div>
    <div className="mt-5"><Pagination pagination={pagination} onChange={load}/></div>
    <div className="mt-6 space-y-3 sm:hidden">
      {items.map((user) => <div className="card p-4" key={user.id}>
        <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-navy">{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div>{statusBadge(user.active)}</div>
        <p className="mt-1 text-xs text-slate-600">Rol: {labels[user.role]}</p>
        <div className="mt-3 flex gap-2">
          <button className="btn-secondary" onClick={() => openDetail(user)}><UserRound size={15}/>Detalle</button>
          <button className="btn-ghost" onClick={() => setToggling(user)}>{user.active ? 'Desactivar' : 'Activar'}</button>
        </div>
      </div>)}
    </div>
    {toggling && <Modal title={toggling.active ? 'Desactivar usuario' : 'Activar usuario'} onClose={() => setToggling(null)}>
      <p className="text-sm text-slate-600">{toggling.active ? `¿Desactivar a ${toggling.firstName} ${toggling.lastName}? Se cerrarán sus sesiones activas y no podrá iniciar sesión.` : `¿Activar a ${toggling.firstName} ${toggling.lastName}? Podrá iniciar sesión de nuevo.`}</p>
      <div className="mt-6 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setToggling(null)}>Cancelar</button><button className="btn-primary" onClick={toggleStatus}>{toggling.active ? 'Desactivar' : 'Activar'}</button></div>
    </Modal>}
    {detail && <Modal title="Detalle del usuario" onClose={() => setDetail(null)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><span className="rounded-lg bg-skysoft p-3 text-primary"><UserRound size={20}/></span><div><p className="font-bold text-navy">{detail.firstName} {detail.lastName}</p><p className="text-xs text-slate-500">{detail.email}</p></div>{statusBadge(detail.active)}</div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="label">Documento</dt><dd className="text-slate-700">{detail.document}</dd></div>
          <div><dt className="label">Teléfono</dt><dd className="text-slate-700">{detail.phone || 'No registrado'}</dd></div>
          <div><dt className="label">Rol</dt><dd className="text-slate-700">{labels[detail.role]}</dd></div>
          <div><dt className="label">Fecha de registro</dt><dd className="text-slate-700">{formatDate(detail.createdAt)}</dd></div>
          {detail.role === 'CITIZEN' && <div><dt className="label">Citas realizadas</dt><dd className="text-slate-700">{detail.appointments ?? 0}</dd></div>}
          {detail.role === 'EMPLOYEE' && <div className="sm:col-span-2"><dt className="label">Servicios asignados</dt><dd className="text-slate-700">{(detail.services || []).map((service) => service.name).join(', ') || 'Sin servicios'}</dd></div>}
          {detail.role === 'EMPLOYEE' && <div><dt className="label">Citas activas</dt><dd className="text-slate-700">{detail.activeAppointments ?? 0}</dd></div>}
        </dl>
      </div>
      <div className="mt-6 flex justify-end border-t pt-5"><button className="btn-ghost" onClick={() => setDetail(null)}><X size={16}/>Cerrar</button></div>
    </Modal>}
  </>
}
