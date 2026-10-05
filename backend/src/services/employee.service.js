import { prisma } from '../config/prisma.js'

export const employeeServiceIds = async (userId) => {
  const rows = await prisma.employeeService.findMany({ where: { employeeId: userId }, select: { serviceId: true } })
  return rows.map((row) => row.serviceId)
}

export const assertServiceAccess = async (appointment, user) => {
  if (user.role === 'ADMIN') return
  if (appointment.assignedEmployeeId === user.id) return
  const serviceIds = await employeeServiceIds(user.id)
  if (serviceIds.includes(appointment.serviceId)) return
  throw { status: 403, message: 'No estás autorizado para atender este servicio.' }
}