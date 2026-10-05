import { useEffect, useState } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '../ui/Modal'
import { profileService } from '../../services/profileService'

const deviceIcon = (agent = '') => { const value = String(agent).toLowerCase(); if (/mobile|android|iphone|ipod/i.test(value)) return Smartphone; if (/tablet|ipad/i.test(value)) return Tablet; return Monitor }
const formatDate = (value) => { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) }

export default function ActiveSessions({ onLogoutAll }) {
  const [sessions, setSessions] = useState([])
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  useEffect(() => { setLoading(true); profileService.getSessions().then(setSessions).catch((error) => toast.error(error.message)).finally(() => setLoading(false)) }, [])
  const closeAll = async () => { setWorking(true); try { await onLogoutAll(); toast.success('Sesiones cerradas en todos los dispositivos.'); setConfirming(false) } catch (error) { toast.error(error.message) } finally { setWorking(false) } }
  return <section className="card p-6"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-navy">Sesiones activas</h2><p className="mt-1 text-sm text-slate-500">Dispositivos donde has iniciado sesión.</p></div><button className="btn-secondary" onClick={() => setConfirming(true)}>Cerrar sesión en todos los dispositivos</button></div>{loading ? <p className="text-sm text-slate-500">Cargando sesiones…</p> : !sessions.length ? <p className="text-sm text-slate-500">No hay sesiones activas.</p> : <div className="divide-y">{sessions.map((session) => { const Icon = deviceIcon(session.userAgent); return <div className="flex items-center gap-4 py-4" key={session.id}><span className="rounded-lg bg-skysoft p-3 text-primary"><Icon size={19}/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy">{session.userAgent || 'Dispositivo desconocido'} {session.current && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">Actual</span>}</p><p className="mt-1 text-xs text-slate-500">Inicio: {formatDate(session.createdAt)} · Última actividad: {formatDate(session.lastSeenAt)} · Expira: {formatDate(session.expiresAt)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${session.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{session.active ? 'Activa' : 'Inactiva'}</span></div> })}</div>}{confirming && <Modal title="Cerrar todas las sesiones" onClose={() => setConfirming(false)}><p className="text-sm text-slate-600">Se cerrará la sesión en todos los dispositivos, incluyendo este. Deberás iniciar sesión de nuevo.</p><div className="mt-6 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setConfirming(false)}>Cancelar</button><button className="btn-primary" disabled={working} onClick={closeAll}>{working ? 'Cerrando…' : 'Cerrar todas'}</button></div></Modal>}</section>
}