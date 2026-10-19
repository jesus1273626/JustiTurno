import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import { notificationService } from '../../services/notificationService'

const displayDate = (value) => new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/funcionario') ? '/funcionario' : '/ciudadano'
  const load = useCallback(() => {
    setLoading(true)
    notificationService.list().then((data) => setItems(data.items || [])).catch((error) => toast.error(error.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const read = async (item) => {
    if (item.readAt) return
    try {
      await notificationService.markRead(item.id)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry))
    } catch (error) { toast.error(error.message) }
  }
  const readAll = async () => {
    try {
      await notificationService.markAllRead()
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
      toast.success('Notificaciones marcadas como leídas.')
    } catch (error) { toast.error(error.message) }
  }

  return <><PageHeader title="Notificaciones" description="Mantente al tanto de los cambios en tus solicitudes." action={<button className="btn-secondary" onClick={readAll}><CheckCheck size={17}/>Marcar todas como leídas</button>}/>{loading ? <p className="text-sm text-slate-500">Cargando notificaciones…</p> : !items.length ? <div className="card p-10 text-center text-sm text-slate-500"><Bell className="mx-auto mb-3 text-slate-400"/>No tienes notificaciones por ahora.</div> : <div className="space-y-3">{items.map((item) => <article className={`card p-4 ${item.readAt ? '' : 'border-l-4 border-primary bg-sky-50/40'}`} key={item.id}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><button className="text-left" onClick={() => read(item)}><h2 className="font-bold text-navy">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.message}</p><time className="mt-2 block text-xs text-slate-500">{displayDate(item.createdAt)}</time></button>{item.entityType === 'appointment' && <Link className="text-sm font-bold text-primary" to={`${basePath}/citas/${item.entityId}`} onClick={() => read(item)}>Ver cita</Link>}</div></article>)}</div>}</>
}
