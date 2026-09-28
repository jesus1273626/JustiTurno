import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, CircleUserRound, ClipboardList, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { adminService } from '../../services/adminService'
const statuses = ['PENDIENTE', 'ACEPTADA', 'FINALIZADA', 'REPROGRAMADA']
export default function AdminDashboard() {
  const [data, setData] = useState(null)
  useEffect(() => { adminService.dashboard().then(setData).catch((error) => toast.error(error.message)) }, [])
  if (!data) return <p className="text-sm text-slate-500">Cargando dashboard…</p>
  const items = data.recentAppointments || []
  return <><h1 className="page-title">Dashboard administrativo</h1><p className="mt-2 text-slate-600">Resumen general de la operación de JustiTurno.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Usuarios registrados" value={data.totalUsers} icon={CircleUserRound}/><StatCard label="Citas del mes" value={data.appointmentsThisMonth} icon={CalendarDays} tone="violet"/><StatCard label="Servicios activos" value={data.activeServices} icon={Wrench} tone="green"/><StatCard label="Citas pendientes" value={data.pendingAppointments} icon={ClipboardList} tone="amber"/></div><div className="mt-7 grid gap-6 lg:grid-cols-2"><section className="card p-6"><div className="flex items-center gap-2"><BarChart3 className="text-primary"/><h2 className="font-bold text-navy">Citas recientes por estado</h2></div><div className="mt-6 space-y-4">{statuses.map((status) => { const value = items.filter((item) => item.status === status).length; return <div key={status}><div className="flex justify-between text-sm"><StatusBadge status={status}/><span className="font-semibold">{value}</span></div><div className="mt-2 h-2 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-primary" style={{ width: `${Math.max(12, value * 25)}%` }}/></div></div> })}</div></section><section className="card p-6"><h2 className="font-bold text-navy">Citas recientes</h2><div className="mt-4 divide-y">{items.map((item) => <div className="flex items-center justify-between gap-3 py-4" key={item.id}><div><p className="text-sm font-bold text-navy">{item.code || item.id} · {item.service}</p><p className="mt-1 text-xs text-slate-500">{item.citizen}</p></div><StatusBadge status={item.status}/></div>)}</div></section></div></>
}
