import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { profileService } from '../../services/profileService'
import PageHeader from '../../components/ui/PageHeader'
import PersonalInfo from '../../components/profile/PersonalInfo'
import ChangePassword from '../../components/profile/ChangePassword'
import ActiveSessions from '../../components/profile/ActiveSessions'

export default function AdminProfilePage() {
  const { user, logoutAll } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { profileService.getProfile().then(setProfile).catch((error) => toast.error(error.message)).finally(() => setLoading(false)) }, [])
  const handleLogoutAll = async () => { await logoutAll() }
  if (loading) return <p className="text-sm text-slate-500">Cargando tu perfil…</p>
  const data = profile || user || {}
  return <><PageHeader title="Perfil del administrador" description="Tus datos personales y de seguridad."/><div className="grid max-w-4xl gap-6"><PersonalInfo user={data}/><ChangePassword/><ActiveSessions onLogoutAll={handleLogoutAll}/></div></>
}