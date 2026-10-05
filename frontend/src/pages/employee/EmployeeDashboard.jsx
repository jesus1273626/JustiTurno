import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, ListTodo, Timer, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { appointmentService } from '../../services/appointmentService'
import StatCard from '../../components/ui/StatCard'
import AppointmentList from '../../components/appointments/AppointmentList'

export default function EmployeeDashboard() {
  const [data, setData] = useState(null)
  useEffect(() => { appointmentService.employeeDashboard().then(setData).catch((error) => toast.error(error.message)) }, [])
  if (!data) return <p className="text-sm text-slate-500">Cargando panel de atención…</p>
  return <><h1 className="page-title">Panel de atención</h1><p className="mt-2 text-slate-600">Gestiona las solicitudes de los servicios que tienes asignados.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Pendientes disponibles" value={data.pendingAvailable} icon={ListTodo} tone="amber"/><StatCard label="Mis citas aceptadas" value={data.myAccepted} icon={ClipboardList}/><StatCard label="Atendidas hoy" value={data.attendedToday} icon={CheckCircle2} tone="green"/><StatCard label="Por finalizar" value={data.toFinalize} icon={Timer} tone="violet"/></div>{data.services?.length ? <div className="mt-6 flex flex-wrap gap-2">{data.services.map((service) => <span className="rounded-full bg-skysoft px-3 py-1 text-xs font-semibold text-primary" key={service.id}>{service.name}</span>)}</div> : <p className="mt-6 text-sm text-slate-500"><UsersRound className="mr-1 inline text-slate-400"/>Sin servicios asignados. Un administrador puede asignártelos.</p>}<section className="mt-7"><h2 className="mb-4 text-lg font-bold text-navy">Agenda de hoy</h2>{data.todayAgenda?.length ? <AppointmentList appointments={data.todayAgenda} basePath="/funcionario/citas" employee/> : <p className="card p-6 text-sm text-slate-500">No tienes citas programadas para hoy.</p>}</section></>
}