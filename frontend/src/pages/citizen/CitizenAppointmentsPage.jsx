import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { appointmentService } from '../../services/appointmentService'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import AppointmentList from '../../components/appointments/AppointmentList'
const tabs = ['TODAS', 'PENDIENTE', 'ACEPTADA', 'FINALIZADA']
export default function CitizenAppointmentsPage({ history = false }) {
  const { user } = useAuth(); const [filter, setFilter] = useState(history ? 'FINALIZADA' : 'TODAS'); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); appointmentService.listMine({ citizenId: user.id }).then(setItems).catch((error) => toast.error(error.message)).finally(() => setLoading(false)) }, [user.id])
  const visible = items.filter((item) => history ? ['FINALIZADA', 'CANCELADA', 'RECHAZADA'].includes(item.status) : filter === 'TODAS' || item.status === filter)
  return <><PageHeader title={history ? 'Historial' : 'Mis citas'} description={history ? 'Consulta las solicitudes que ya finalizaron o fueron canceladas.' : 'Consulta el estado y detalle de tus solicitudes.'}/>{!history && <div className="mb-5 flex gap-2 overflow-auto pb-1">{tabs.map((tab) => <button onClick={() => setFilter(tab)} key={tab} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === tab ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{tab === 'TODAS' ? 'Todas' : tab.charAt(0) + tab.slice(1).toLowerCase()}</button>)}</div>}{loading ? <p className="text-sm text-slate-500">Cargando citas…</p> : <AppointmentList appointments={visible}/>}</>
}
