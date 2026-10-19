import { useEffect, useState } from 'react'
import { Download, FileBarChart } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { adminService } from '../../services/adminService'
import { apiBaseUrl, useMocks } from '../../services/apiClient'

const labels = { PENDING: 'Pendientes', ACCEPTED: 'Aceptadas', ATTENDED: 'Atendidas', FINALIZED: 'Finalizadas', CANCELED: 'Canceladas', REJECTED: 'Rechazadas', RESCHEDULED: 'Reprogramadas' }

export default function AdminReportsPage() {
  const [services, setServices] = useState([])
  const [filters, setFilters] = useState({ from: '', to: '', serviceId: '' })
  const [data, setData] = useState(null)
  const load = () => adminService.appointmentReport(filters).then(setData).catch((error) => toast.error(error.message))

  useEffect(() => {
    adminService.services().then(setServices).catch((error) => toast.error(error.message))
    adminService.appointmentReport({}).then(setData).catch((error) => toast.error(error.message))
  }, [])

  const download = async () => {
    try {
      if (useMocks) return toast.info('La exportación CSV está disponible en modo API.')
      const response = await fetch(`${apiBaseUrl}${adminService.reportCsvUrl(filters)}`, { credentials: 'include' })
      if (!response.ok) throw new Error('No fue posible exportar el reporte.')
      const href = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = href
      link.download = 'justiturno-reporte-citas.csv'
      link.click()
      URL.revokeObjectURL(href)
    } catch (error) { toast.error(error.message) }
  }

  return <><PageHeader title="Reportes de citas" description="Consulta métricas operativas reales y exporta el resultado." action={<button className="btn-secondary" onClick={download}><Download size={17}/>Exportar CSV</button>}/><div className="mb-6 grid gap-3 md:grid-cols-4"><label><span className="label">Desde</span><input className="field" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })}/></label><label><span className="label">Hasta</span><input className="field" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })}/></label><label><span className="label">Servicio</span><select className="field" value={filters.serviceId} onChange={(event) => setFilters({ ...filters, serviceId: event.target.value })}><option value="">Todos</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><div className="flex items-end"><button className="btn-primary w-full" onClick={load}>Aplicar filtros</button></div></div>{!data ? <p className="text-sm text-slate-500">Cargando reporte…</p> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total de citas" value={data.total} icon={FileBarChart}/><StatCard label="Promedio diario" value={data.averageDaily} icon={FileBarChart} tone="violet"/><StatCard label="Finalizadas" value={data.states.FINALIZED || 0} icon={FileBarChart} tone="green"/><StatCard label="Pendientes" value={data.states.PENDING || 0} icon={FileBarChart} tone="amber"/></div><div className="mt-7 grid gap-6 lg:grid-cols-2"><section className="card p-6"><h2 className="font-bold text-navy">Resumen por estado</h2><div className="mt-4 space-y-3">{Object.entries(labels).map(([status, label]) => <div className="flex items-center justify-between border-b pb-3 text-sm" key={status}><span>{label}</span><strong>{data.states[status] || 0}</strong></div>)}</div></section><section className="card p-6"><h2 className="font-bold text-navy">Servicios más solicitados</h2><div className="mt-4 space-y-3">{data.byService.length ? data.byService.map((service) => <div className="flex items-center justify-between border-b pb-3 text-sm" key={service.serviceId}><span>{service.name}</span><strong>{service.count}</strong></div>) : <p className="text-sm text-slate-500">No hay citas para los filtros seleccionados.</p>}</div></section></div></>}</>
}
