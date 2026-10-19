import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'
import { dateRangeUtc, localDate, localTime } from '../utils/dates.js'

const statuses = ['PENDING', 'ACCEPTED', 'ATTENDED', 'FINALIZED', 'CANCELED', 'REJECTED', 'RESCHEDULED']
const include = { service: { select: { name: true } }, citizen: { select: { firstName: true, lastName: true } }, assignedEmployee: { select: { firstName: true, lastName: true } } }

const filterWhere = (query) => {
  const where = {}
  if (query.serviceId) where.serviceId = query.serviceId
  if (query.from || query.to) {
    const from = query.from ? dateRangeUtc(query.from).start : undefined
    const to = query.to ? dateRangeUtc(query.to).end : undefined
    where.scheduledAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
  }
  return where
}

const report = async (query) => {
  const where = filterWhere(query)
  const [total, grouped, byService, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.appointment.groupBy({ by: ['serviceId'], where, _count: { _all: true }, orderBy: { _count: { serviceId: 'desc' } } }),
    prisma.appointment.findMany({ where, include, orderBy: { scheduledAt: 'asc' } })
  ])
  const services = byService.length ? await prisma.service.findMany({ where: { id: { in: byService.map((item) => item.serviceId) } }, select: { id: true, name: true } }) : []
  const serviceMap = Object.fromEntries(services.map((item) => [item.id, item.name]))
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]))
  const days = new Set(appointments.map((item) => localDate(item.scheduledAt))).size
  return {
    total,
    states: Object.fromEntries(statuses.map((status) => [status, counts[status] || 0])),
    byService: byService.map((item) => ({ serviceId: item.serviceId, name: serviceMap[item.serviceId] || 'Servicio', count: item._count._all })),
    averageDaily: total ? Number((total / Math.max(1, days)).toFixed(2)) : 0,
    appointments
  }
}

export const appointmentReport = async (req, res, next) => {
  try {
    const data = await report(req.validatedQuery || req.query)
    success(res, { total: data.total, states: data.states, byService: data.byService, averageDaily: data.averageDaily })
  } catch (error) { next(error) }
}

const csvCell = (value) => {
  const raw = String(value ?? '')
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}

export const appointmentReportCsv = async (req, res, next) => {
  try {
    const data = await report(req.validatedQuery || req.query)
    const header = ['Código', 'Ciudadano', 'Servicio', 'Fecha', 'Hora', 'Estado', 'Funcionario', 'Fecha creación']
    const rows = data.appointments.map((item) => [item.code, `${item.citizen.firstName} ${item.citizen.lastName}`, item.service.name, localDate(item.scheduledAt), localTime(item.scheduledAt), item.status, item.assignedEmployee ? `${item.assignedEmployee.firstName} ${item.assignedEmployee.lastName}` : '', item.createdAt.toISOString()])
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=justiturno-reporte-citas.csv')
    res.send(`\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}`)
  } catch (error) { next(error) }
}
