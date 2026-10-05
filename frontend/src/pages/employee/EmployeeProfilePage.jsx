import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { appointmentService } from '../../services/appointmentService'
import PageHeader from '../../components/ui/PageHeader'
import PersonalInfo from '../../components/profile/PersonalInfo'
import ChangePassword from '../../components/profile/ChangePassword'
import ActiveSessions from '../../components/profile/ActiveSessions'

export default function EmployeeProfilePage() {
  const { user, logoutAll } = useAuth()
  const [profile, setProfile] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([appointmentService.employeeDashboard(), appointmentService.employeeList()])
      .then(([dashboard]) => { setServices(dashboard.services || []); setProfile({ ...(user || {}), ...dashboard.user }) })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])
  const handleLogoutAll = async () => { await logoutAll() }
  if (loading) return <p className="text-sm text-slate-500">Cargando tu perfil…</p>
  const data = profile || user || {}
  return <><PageHeader title="Perfil del funcionario" description="Tus datos personales y los servicios que puedes atender."/><div className="grid max-w-4xl gap-6"><PersonalInfo user={data}/><section className="card p-6"><div className="mb-4 flex items-center gap-2"><Wrench className="text-primary"/><h2 className="font-bold text-navy">Servicios asignados</h2></div>{services.length ? <div className="grid gap-3 sm:grid-cols-2">{services.map((service) => <div className="flex items-center gap-3 rounded-xl border border-[#e4e7ec] bg-slate-50 p-4" key={service.id}><span className="rounded-lg bg-skysoft p-2 text-primary"><Wrench size={17}/></span><div><p className="text-sm font-semibold text-navy">{service.name}</p><p className="text-xs text-slate-500">{service.category}</p></div></div>)}</div> : <p className="text-sm text-slate-500">No tienes servicios asignados. Un administrador puede asignártelos.</p>}</section><ChangePassword/><ActiveSessions onLogoutAll={handleLogoutAll}/></div></>
}