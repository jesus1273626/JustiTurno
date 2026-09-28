import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { appointmentService } from '../../services/appointmentService'
import PageHeader from '../../components/ui/PageHeader'
import AppointmentList from '../../components/appointments/AppointmentList'
const tabs = ['TODAS', 'PENDIENTE', 'ACEPTADA', 'REPROGRAMADA', 'ATENDIDA', 'FINALIZADA']
export default function EmployeeAppointmentsPage({ history = false }) {
  const [params] = useSearchParams(); const assigned = params.get('view') === 'assigned'; const [filter, setFilter] = useState(history ? 'FINALIZADA' : 'TODAS'); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { const filters = assigned ? { assignedToMe: 'true' } : {}; appointmentService.employeeList(filters).then(setItems).catch((error) => toast.error(error.message)).finally(() => setLoading(false)) }, [assigned])
  const visible = items.filter((item) => history ? ['FINALIZADA', 'RECHAZADA', 'CANCELADA'].includes(item.status) : filter === 'TODAS' || item.status === filter)
  return <><PageHeader title={history ? 'Historial de atención' : assigned ? 'Citas asignadas' : 'Citas pendientes'} description={history ? 'Consulta solicitudes cerradas.' : assigned ? 'Consulta las citas activas asignadas a tu jornada.' : 'Revisa y actualiza el estado de las solicitudes.'}/>{!assigned && <div className="mb-5 flex gap-2 overflow-auto pb-1">{tabs.map((tab) => <button onClick={() => setFilter(tab)} key={tab} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === tab ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{tab === 'TODAS' ? 'Todas' : tab.charAt(0) + tab.slice(1).toLowerCase()}</button>)}</div>}{loading ? <p className="text-sm text-slate-500">Cargando citas…</p> : <AppointmentList appointments={visible} basePath="/funcionario/citas" employee/>}</>
}
