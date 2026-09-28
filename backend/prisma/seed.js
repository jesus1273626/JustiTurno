import bcrypt from 'bcryptjs'
import { DateTime } from 'luxon'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const users = [
  { firstName: 'María', lastName: 'Rodríguez', document: '1000000001', phone: '3005551212', email: 'ciudadano@demo.com', role: 'CITIZEN' },
  { firstName: 'Andrés', lastName: 'Gómez', document: '1000000002', phone: '3005551213', email: 'funcionario@demo.com', role: 'EMPLOYEE' },
  { firstName: 'Valentina', lastName: 'Rojas', document: '1000000003', phone: '3005551214', email: 'admin@demo.com', role: 'ADMIN' }
]
const services = [
  ['orientacion-juridica', 'Orientación jurídica', 'Asesoría', 'Información inicial sobre rutas y opciones de atención.', ['Documento de identidad', 'Información relacionada con la consulta', 'Documentos de soporte, si existen']],
  ['conciliacion', 'Conciliación', 'Resolución de conflictos', 'Acompañamiento administrativo para conocer el proceso de conciliación.', ['Documento de identidad', 'Datos de la persona convocada', 'Resumen del asunto']],
  ['comisaria-familia', 'Comisaría de Familia', 'Familia', 'Canal de orientación para rutas de atención familiar.', ['Documento de identidad', 'Descripción de la situación', 'Soportes disponibles']],
  ['inspeccion-policia', 'Inspección de Policía', 'Convivencia', 'Información sobre asuntos de convivencia ciudadana.', ['Documento de identidad', 'Descripción de los hechos', 'Evidencias disponibles']],
  ['atencion-victimas', 'Atención a víctimas', 'Atención especializada', 'Información sobre rutas institucionales de atención y acompañamiento.', ['Documento de identidad', 'Información del caso', 'Documentos disponibles']],
  ['orientacion-ciudadano', 'Orientación al ciudadano', 'Información', 'Guía para identificar el servicio institucional adecuado.', ['Documento de identidad', 'Descripción breve de la solicitud']]
]

const passwordHash = await bcrypt.hash('Demo1234', 12)
for (const user of users) await prisma.user.upsert({ where: { email: user.email }, update: { ...user, passwordHash, active: true }, create: { ...user, passwordHash } })
const serviceBySlug = {}
for (const [slug, name, category, description, requirements] of services) {
  const service = await prisma.service.upsert({ where: { slug }, update: { name, category, description, active: true, durationMinutes: 60 }, create: { slug, name, category, description, durationMinutes: 60 } })
  serviceBySlug[slug] = service
  await prisma.requirement.deleteMany({ where: { serviceId: service.id } })
  await prisma.requirement.createMany({ data: requirements.map((title) => ({ serviceId: service.id, title, required: true })) })
  // Los horarios amplios de la primera entrega se conservan para auditoría,
  // pero no deben coexistir con las franjas operativas de Fase 2.
  await prisma.schedule.updateMany({ where: { serviceId: service.id, startTime: '08:00', endTime: '16:00', slotDuration: 30, capacity: 12, active: true }, data: { active: false } })
  for (const schedule of [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [{ serviceId: service.id, dayOfWeek, startTime: '08:00', endTime: '12:00', slotDuration: 60, capacity: 2 }, { serviceId: service.id, dayOfWeek, startTime: '14:00', endTime: '16:00', slotDuration: 60, capacity: 2 }])) {
    const exists = await prisma.schedule.findFirst({ where: { serviceId: schedule.serviceId, dayOfWeek: schedule.dayOfWeek, startTime: schedule.startTime, endTime: schedule.endTime } })
    if (!exists) await prisma.schedule.create({ data: schedule })
  }
}
const citizen = await prisma.user.findUniqueOrThrow({ where: { email: 'ciudadano@demo.com' } })
const employee = await prisma.user.findUniqueOrThrow({ where: { email: 'funcionario@demo.com' } })
const nextWeekday = () => { let date = DateTime.now().setZone('America/Bogota').plus({ days: 1 }).startOf('day'); while (date.weekday > 5) date = date.plus({ days: 1 }); return date }
const scheduledAt = (dayOffset, hour) => nextWeekday().plus({ days: dayOffset }).set({ hour, minute: 0 }).toUTC().toJSDate()
const appointments = [
  ['JT-000001', 'orientacion-juridica', 'PENDING', scheduledAt(0, 8), null, 'Solicitud demo pendiente.'],
  ['JT-000002', 'conciliacion', 'ACCEPTED', scheduledAt(1, 9), employee.id, 'Solicitud demo aceptada.'],
  ['JT-000003', 'orientacion-ciudadano', 'FINALIZED', scheduledAt(-7, 10), employee.id, 'Solicitud demo finalizada.']
]
for (const [code, slug, status, date, assignedEmployeeId, reason] of appointments) {
  const appointment = await prisma.appointment.upsert({ where: { code }, update: { status, scheduledAt: date, assignedEmployeeId, reason }, create: { code, citizenId: citizen.id, serviceId: serviceBySlug[slug].id, status, scheduledAt: date, assignedEmployeeId, reason } })
  await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId: appointment.id } })
  await prisma.appointmentStatusHistory.create({ data: { appointmentId: appointment.id, toStatus: 'PENDING', changedById: citizen.id, note: 'Solicitud creada por el ciudadano.' } })
  if (status !== 'PENDING') await prisma.appointmentStatusHistory.create({ data: { appointmentId: appointment.id, fromStatus: 'PENDING', toStatus: status, changedById: employee.id, note: 'Estado de demostración.' } })
}
console.log('Seed de JustiTurno completado.')
await prisma.$disconnect()
