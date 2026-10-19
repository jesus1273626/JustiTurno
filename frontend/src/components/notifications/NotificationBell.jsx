import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { notificationService } from '../../services/notificationService'

export default function NotificationBell({ basePath }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    notificationService.unreadCount().then(setCount).catch(() => setCount(0))
  }, [])

  return <Link aria-label="Ver notificaciones" className="relative rounded-lg p-2 text-navy hover:bg-skysoft" to={`${basePath}/notificaciones`}><Bell size={20}/>{count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}</Link>
}
