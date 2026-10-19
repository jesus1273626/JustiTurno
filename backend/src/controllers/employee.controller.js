import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'
import { dateRangeUtc, localDate, localTime } from '../utils/dates.js'
import { employeeServiceIds } from '../services/employee.service.js'

const agendaInclude = { service: { select: { id: true, name: true, slug: true } }, citizen: { select: { id: true, firstName: true, lastName: true, document: true } } }
const serialize = (item) => ({ ...item, date: localDate(item.scheduledAt), time: localTime(item.scheduledAt) })

export const employeeDashboard = async (req, res, next) => {
  try {
    const serviceIds = await employeeServiceIds(req.user.id)
    const { start, end } = dateRangeUtc(localDate(new Date()))
    const myServices = { serviceId: { in: serviceIds } }
    const services = serviceIds.length ? await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true, slug: true, category: true, active: true }, orderBy: { name: 'asc' } }) : []
    const [pendingAvailable, myAccepted, attendedToday, toFinalize, todayAgenda] = await Promise.all([
      prisma.appointment.count({ where: { status: 'PENDING', ...myServices, OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: req.user.id }] } }),
      prisma.appointment.count({ where: { status: 'ACCEPTED', assignedEmployeeId: req.user.id } }),
      prisma.appointment.count({ where: { status: 'ATTENDED', assignedEmployeeId: req.user.id, scheduledAt: { gte: start, lt: end } } }),
      prisma.appointment.count({ where: { status: 'ATTENDED', assignedEmployeeId: req.user.id } }),
      prisma.appointment.findMany({ where: { assignedEmployeeId: req.user.id, scheduledAt: { gte: start, lt: end }, status: { in: ['ACCEPTED', 'RESCHEDULED', 'ATTENDED'] } }, include: agendaInclude, orderBy: { scheduledAt: 'asc' } })
    ])
    success(res, { pendingAvailable, myAccepted, attendedToday, toFinalize, services, todayAgenda: todayAgenda.map(serialize) })
  } catch (error) { next(error) }
}

export const employeeAgenda = async (req, res, next) => {
  try {
    const date = req.validatedQuery?.date || req.query.date || localDate(new Date())
    const { start, end } = dateRangeUtc(date)
    const items = await prisma.appointment.findMany({ where: { assignedEmployeeId: req.user.id, scheduledAt: { gte: start, lt: end }, status: { in: ['ACCEPTED', 'RESCHEDULED', 'ATTENDED'] } }, include: agendaInclude, orderBy: { scheduledAt: 'asc' } })
    success(res, { date, items: items.map(serialize) })
  } catch (error) { next(error) }
}
