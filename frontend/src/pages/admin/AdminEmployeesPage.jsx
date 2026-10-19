import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, CircleOff, Pencil, Plus, Search, UserRound, Wrench, X } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import EmployeeForm from '../../components/admin/EmployeeForm'
import { adminService } from '../../services/adminService'

const roleLabel = { CITIZEN: 'Ciudadano', EMPLOYEE: 'Funcionario', ADMIN: 'Administrador' }

export default function AdminEmployeesPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [services, setServices] = useState([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [toggling, setToggling] = useState(null)

  const load = useCallback((targetPage = 1) => {
    setLoading(true)
    const filters = { page: targetPage, limit: 8, ...(search ? { search } : {}), ...(activeFilter ? { active: activeFilter } : {}) }
    adminService.employees(filters)
      .then((result) => { setItems(result.items || []); setPagination(result.pagination); setPage(targetPage) })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [search, activeFilter])
  useEffect(() => { load(1) }, [load])
  useEffect(() => { adminService.services().then(setServices).catch((error) => toast.error(error.message)) }, [])

  const openNew = () => setEditing('new')
  const openEdit = (item) => setEditing(item)
  const save = async (data) => {
    setSaving(true)
    try {
      if (editing === 'new') {
        const result = await adminService.createEmployee(data)
        setItems((current) => [result.employee, ...current])
        toast.success('Funcionario creado correctamente.')
      } else {
        const result = await adminService.updateEmployee(editing.id, data)
        setItems((current) => current.map((item) => item.id === editing.id ? result.employee : item))
        toast.success('Funcionario actualizado correctamente.')
      }
      setEditing(null)
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }
  const toggleStatus = async () => {
    if (!toggling) return
    const active = !toggling.active
    try {
      await adminService.setEmployeeStatus(toggling.id, active)
      setItems((current) => current.map((item) => item.id === toggling.id ? { ...item, active } : item))
      setToggling(null)
      toast.success(`Funcionario ${active ? 'activado' : 'desactivado'}.`)
    } catch (error) { toast.error(error.message) }
  }
  const openDetail = async (item) => {
    try {
      const result = await adminService.getEmployee(item.id)
      setDetail(result.employee)
    } catch (error) { toast.error(error.message) }
  }
  const assignServices = async (item) => {
    openEdit({ ...item, services: item.services || [] })
  }

  const statusBadge = (active) => active ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Activo</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Inactivo</span>

  return <><PageHeader title="Gestión de funcionarios" description="Administra los funcionarios y los servicios que pueden atender." action={<button className="btn-primary" onClick={openNew}><Plus size={17}/>Nuevo funcionario</button>}/>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="field pl-10" placeholder="Buscar por nombre, correo o documento" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load(1)}/></label>
      <select className="field sm:w-44" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
      <button className="btn-secondary" onClick={() => load(1)}>Filtrar</button>
    </div>
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Funcionario</th><th className="px-5 py-3">Correo</th><th className="px-5 py-3">Servicios</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Citas activas</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
        <tbody>
          {items.map((item) => <tr className="border-t" key={item.id}>
            <td className="px-5 py-4"><p className="font-bold text-navy">{item.firstName} {item.lastName}</p><p className="text-xs text-slate-500">{item.document}</p></td>
            <td className="px-5 py-4 text-slate-600">{item.email}</td>
            <td className="px-5 py-4"><div className="flex max-w-[220px] flex-wrap gap-1">{(item.services || []).slice(0, 2).map((service) => <span className="rounded bg-skysoft px-2 py-0.5 text-xs font-semibold text-primary" key={service.id} title={service.name}>{service.name}</span>)}{(item.services || []).length > 2 && <span className="text-xs text-slate-500">+{item.services.length - 2}</span>}{!(item.services || []).length && <span className="text-xs text-slate-400">Sin servicios</span>}</div></td>
            <td className="px-5 py-4">{statusBadge(item.active)}</td>
            <td className="px-5 py-4"><span className="font-semibold text-navy">{item.activeAppointments ?? 0}</span></td>
            <td className="px-5 py-4"><div className="flex justify-end gap-1">
              <button className="btn-ghost min-h-0 p-2" aria-label="Ver detalle" onClick={() => openDetail(item)}><UserRound size={17}/></button>
              <button className="btn-ghost min-h-0 p-2" aria-label="Editar" onClick={() => openEdit(item)}><Pencil size={17}/></button>
              <button className="btn-ghost min-h-0 p-2" aria-label="Asignar servicios" onClick={() => assignServices(item)}><Wrench size={17}/></button>
              <button className="btn-ghost min-h-0 p-2" aria-label={item.active ? 'Desactivar' : 'Activar'} onClick={() => setToggling(item)}>{item.active ? <CircleOff size={17}/> : <CheckCircle2 size={17}/>}</button>
            </div></td>
          </tr>)}
        </tbody>
      </table>
      {loading && <p className="p-6 text-sm text-slate-500">Cargando funcionarios…</p>}
      {!loading && !items.length && <p className="p-6 text-sm text-slate-500">No hay funcionarios para mostrar.</p>}
    </div>
    <div className="mt-5"><Pagination pagination={pagination} onChange={load}/></div>
    <div className="mt-6 space-y-3 sm:hidden">
      {items.map((item) => <div className="card p-4" key={item.id}>
        <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-navy">{item.firstName} {item.lastName}</p><p className="text-xs text-slate-500">{item.email}</p></div>{statusBadge(item.active)}</div>
        <p className="mt-2 text-xs text-slate-600">Servicios: {(item.services || []).map((service) => service.name).join(', ') || 'Sin servicios'}</p>
        <p className="mt-1 text-xs text-slate-600">Citas activas: {item.activeAppointments ?? 0}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => openDetail(item)}><UserRound size={15}/>Detalle</button>
          <button className="btn-secondary" onClick={() => openEdit(item)}><Pencil size={15}/>Editar</button>
          <button className="btn-secondary" onClick={() => assignServices(item)}><Wrench size={15}/>Servicios</button>
          <button className="btn-ghost" onClick={() => setToggling(item)}>{item.active ? 'Desactivar' : 'Activar'}</button>
        </div>
      </div>)}
    </div>
    {editing && <Modal title={editing === 'new' ? 'Nuevo funcionario' : 'Editar funcionario'} onClose={() => setEditing(null)}><EmployeeForm employee={editing === 'new' ? null : editing} services={services} saving={saving} onSave={save} onClose={() => setEditing(null)}/></Modal>}
    {detail && <Modal title="Detalle del funcionario" onClose={() => setDetail(null)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><span className="rounded-lg bg-skysoft p-3 text-primary"><UserRound size={20}/></span><div><p className="font-bold text-navy">{detail.firstName} {detail.lastName}</p><p className="text-xs text-slate-500">{detail.email}</p></div></div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="label">Documento</dt><dd className="text-slate-700">{detail.document}</dd></div>
          <div><dt className="label">Teléfono</dt><dd className="text-slate-700">{detail.phone || 'No registrado'}</dd></div>
          <div><dt className="label">Rol</dt><dd className="text-slate-700">{roleLabel[detail.role]}</dd></div>
          <div><dt className="label">Estado</dt><dd className="text-slate-700">{detail.active ? 'Activo' : 'Inactivo'}</dd></div>
          <div><dt className="label">Citas activas</dt><dd className="text-slate-700">{detail.activeAppointments ?? 0}</dd></div>
        </dl>
        <div><p className="label mb-2">Servicios asignados</p>{(detail.services || []).length ? <div className="space-y-2">{(detail.services || []).map((service) => <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm" key={service.id}><Wrench size={15} className="text-primary"/><span>{service.name}<span className="ml-1 text-xs text-slate-500">{service.category}</span></span></div>)}</div> : <p className="text-sm text-slate-500">Sin servicios asignados.</p>}</div>
      </div>
      <div className="mt-6 flex justify-end border-t pt-5"><button className="btn-ghost" onClick={() => setDetail(null)}><X size={16}/>Cerrar</button></div>
    </Modal>}
    {toggling && <Modal title={toggling.active ? 'Desactivar funcionario' : 'Activar funcionario'} onClose={() => setToggling(null)}>
      <p className="text-sm text-slate-600">{toggling.active ? `¿Desactivar a ${toggling.firstName} ${toggling.lastName}? Se cerrarán sus sesiones activas y no podrá iniciar sesión.` : `¿Activar a ${toggling.firstName} ${toggling.lastName}? Podrá iniciar sesión de nuevo.`}</p>
      <div className="mt-6 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setToggling(null)}>Cancelar</button><button className="btn-primary" onClick={toggleStatus}>{toggling.active ? 'Desactivar' : 'Activar'}</button></div>
    </Modal>}
  </>
}
