import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, ClipboardList, Search } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Pagination from '../../components/ui/Pagination'
import { adminService } from '../../services/adminService'

const actionLabels = {
  LOGIN_SUCCESS: 'Inicio de sesión', LOGIN_FAILED: 'Inicio fallido', LOGOUT: 'Cierre de sesión', LOGOUT_ALL: 'Cierre en todos',
  PASSWORD_CHANGED: 'Contraseña cambiada', USER_ACTIVATED: 'Usuario activado', USER_DEACTIVATED: 'Usuario desactivado',
  EMPLOYEE_CREATED: 'Funcionario creado', EMPLOYEE_UPDATED: 'Funcionario editado', EMPLOYEE_SERVICES_UPDATED: 'Servicios de funcionario',
  SERVICE_CREATED: 'Servicio creado', SERVICE_UPDATED: 'Servicio editado', SERVICE_STATUS_CHANGED: 'Estado de servicio',
  SCHEDULE_CREATED: 'Horario creado', SCHEDULE_UPDATED: 'Horario editado',
  APPOINTMENT_ACCEPTED: 'Cita aceptada', APPOINTMENT_REJECTED: 'Cita rechazada', APPOINTMENT_RESCHEDULED: 'Cita reprogramada',
  APPOINTMENT_ATTENDED: 'Cita atendida', APPOINTMENT_FINALIZED: 'Cita finalizada'
}
const entityLabels = { user: 'Usuario', service: 'Servicio', schedule: 'Horario', appointment: 'Cita', session: 'Sesión' }
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) }

export default function AdminAuditPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [date, setDate] = useState('')
  const [, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback((targetPage = 1) => {
    setLoading(true)
    const filters = { page: targetPage, limit: 12, ...(action ? { action } : {}), ...(entityType ? { entityType } : {}), ...(date ? { date } : {}) }
    adminService.auditLogs(filters)
      .then((result) => { setItems(result.items || []); setPagination(result.pagination); setPage(targetPage) })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [action, entityType, date])
  useEffect(() => { load(1) }, [load])

  return <><PageHeader title="Auditoría" description="Registro de las acciones relevantes realizadas en la plataforma."/>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <select className="field sm:w-56" value={action} onChange={(event) => setAction(event.target.value)} aria-label="Filtrar por acción">
        <option value="">Todas las acciones</option>
        {Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select className="field sm:w-44" value={entityType} onChange={(event) => setEntityType(event.target.value)} aria-label="Filtrar por entidad">
        <option value="">Todas las entidades</option>
        {Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label className="relative flex-1"><CalendarDays className="absolute left-3 top-3 text-slate-400" size={18}/><input type="date" className="field pl-10" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filtrar por fecha"/></label>
      <button className="btn-secondary" onClick={() => load(1)}><Search size={16}/>Filtrar</button>
    </div>
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Usuario</th><th className="px-5 py-3">Acción</th><th className="px-5 py-3">Entidad</th><th className="px-5 py-3">Detalle</th></tr></thead>
        <tbody>
          {items.map((item) => <tr className="border-t" key={item.id}>
            <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(item.createdAt)}</td>
            <td className="px-5 py-4"><p className="font-semibold text-navy">{item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : 'Sistema'}</p><p className="text-xs text-slate-500">{item.actor?.email || '—'}</p></td>
            <td className="px-5 py-4"><span className="rounded bg-skysoft px-2 py-1 text-xs font-semibold text-primary">{actionLabels[item.action] || item.action}</span></td>
            <td className="px-5 py-4 text-slate-600">{entityLabels[item.entityType] || item.entityType || '—'}{item.entityId ? <span className="ml-1 text-xs text-slate-400">{item.entityId.slice(0, 8)}</span> : null}</td>
            <td className="max-w-[220px] px-5 py-4 text-slate-600">{item.metadata ? JSON.stringify(item.metadata) : '—'}</td>
          </tr>)}
        </tbody>
      </table>
      {loading && <p className="p-6 text-sm text-slate-500">Cargando registros…</p>}
      {!loading && !items.length && <div className="p-6 text-sm text-slate-500"><ClipboardList className="mb-2 text-slate-400"/>No hay registros de auditoría para los filtros seleccionados.</div>}
    </div>
    <div className="mt-5"><Pagination pagination={pagination} onChange={load}/></div>
  </>
}
