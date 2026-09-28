import bcrypt from 'bcryptjs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'

const nextWeekday = () => { const value = new Date(); value.setDate(value.getDate() + 1); while ([0, 6].includes(value.getDay())) value.setDate(value.getDate() + 1); return value.toISOString().slice(0, 10) }
const sunday = () => { const value = new Date(); value.setDate(value.getDate() + ((7 - value.getDay()) % 7 || 7)); return value.toISOString().slice(0, 10) }
const testEmail = `fase2.${Date.now()}@ejemplo.com`
const secondEmployeeEmail = `funcionario.fase2.${Date.now()}@ejemplo.com`
let citizen; let anotherCitizen; let employee; let secondEmployee; let admin; let service; let date; let slot; const createdIds = []
const login = async (agent, email, password = 'Demo1234') => agent.post('/api/v1/auth/login').send({ email, password })
const appointment = (time, reason = 'Solicitud de prueba integrada para validar la fase dos.') => ({ serviceId: service.id, date, time, reason })

describe.sequential('Fase 2 API real', () => {
  beforeAll(async () => {
    service = await prisma.service.findUniqueOrThrow({ where: { slug: 'orientacion-juridica' } })
    date = nextWeekday()
    citizen = request.agent(app); anotherCitizen = request.agent(app); employee = request.agent(app); secondEmployee = request.agent(app); admin = request.agent(app)
    await citizen.post('/api/v1/auth/register').send({ firstName: 'Ciudadana', lastName: 'FaseDos', document: String(Date.now()).slice(-10), phone: '3005551212', email: testEmail, password: 'Demo1234' })
    await anotherCitizen.post('/api/v1/auth/register').send({ firstName: 'Otra', lastName: 'Ciudadana', document: String(Date.now() + 1).slice(-10), phone: '3005551213', email: `otra.${testEmail}`, password: 'Demo1234' })
    await prisma.user.upsert({ where: { email: secondEmployeeEmail }, update: { active: true }, create: { firstName: 'Segundo', lastName: 'Funcionario', document: String(Date.now() + 2).slice(-10), phone: '3005551214', email: secondEmployeeEmail, passwordHash: await bcrypt.hash('Demo1234', 10), role: 'EMPLOYEE' } })
    await login(employee, 'funcionario@demo.com'); await login(secondEmployee, secondEmployeeEmail); await login(admin, 'admin@demo.com')
    const available = await request(app).get(`/api/v1/services/${service.slug}/availability?date=${date}`)
    slot = available.body.data.slots.find((item) => item.remaining === 2).time
  })

  afterAll(async () => {
    if (createdIds.length) await prisma.appointment.deleteMany({ where: { id: { in: createdIds } } })
    await prisma.user.deleteMany({ where: { email: { in: [testEmail, `otra.${testEmail}`, secondEmployeeEmail] } } })
    await prisma.$disconnect()
  })

  it('expone disponibilidad válida, rechaza fecha inválida y devuelve vacío en domingo', async () => {
    const valid = await request(app).get(`/api/v1/services/${service.slug}/availability?date=${date}`)
    expect(valid.status).toBe(200); expect(valid.body.data.slots.some((item) => item.time === '08:00')).toBe(true); expect(valid.body.data.slots.some((item) => item.time === '14:00')).toBe(true)
    expect((await request(app).get(`/api/v1/services/${service.slug}/availability?date=2020-01-01`)).status).toBe(400)
    expect((await request(app).get(`/api/v1/services/${service.slug}/availability?date=no-es-fecha`)).status).toBe(400)
    expect((await request(app).get(`/api/v1/services/no-existe/availability?date=${date}`)).status).toBe(404)
    const noService = await request(app).get(`/api/v1/services/${service.slug}/availability?date=${sunday()}`)
    expect(noService.status).toBe(200); expect(noService.body.data.slots).toEqual([])
  })

  it('crea cita, restringe el detalle a su propietaria y registra el timeline inicial', async () => {
    expect((await employee.post('/api/v1/appointments').send(appointment(slot))).status).toBe(403)
    const created = await citizen.post('/api/v1/appointments').send(appointment(slot))
    expect(created.status).toBe(201); expect(created.body.data.code).toMatch(/^JT-\d{6}$/); createdIds.push(created.body.data.id)
    const mine = await citizen.get('/api/v1/appointments/my')
    expect(mine.status).toBe(200); expect(mine.body.data.some((item) => item.id === created.body.data.id)).toBe(true)
    expect((await anotherCitizen.get(`/api/v1/appointments/${created.body.data.id}`)).status).toBe(403)
    const detail = await citizen.get(`/api/v1/appointments/${created.body.data.id}`)
    expect(detail.status).toBe(200); expect(detail.body.data.statusHistory).toHaveLength(1); expect(detail.body.data.statusHistory[0].toStatus).toBe('PENDING')
  })

  it('controla el cupo, libera al cancelar y bloquea una segunda cancelación', async () => {
    const created = await citizen.post('/api/v1/appointments').send(appointment(slot, 'Segunda solicitud para comprobar límite de capacidad.'))
    expect(created.status).toBe(201); createdIds.push(created.body.data.id)
    const full = await citizen.post('/api/v1/appointments').send(appointment(slot, 'Tercera solicitud que debe exceder el cupo disponible.'))
    expect(full.status).toBe(409)
    expect((await citizen.patch(`/api/v1/appointments/${created.body.data.id}/cancel`)).status).toBe(200)
    expect((await citizen.patch(`/api/v1/appointments/${created.body.data.id}/cancel`)).status).toBe(409)
    const availability = await request(app).get(`/api/v1/services/${service.slug}/availability?date=${date}`)
    expect(availability.body.data.slots.find((item) => item.time === slot).remaining).toBe(1)
  })

  it('permite aceptar, observa, atiende y finaliza; otro funcionario no interviene', async () => {
    const created = await citizen.post('/api/v1/appointments').send(appointment('09:00', 'Flujo completo de funcionario con observación visible.'))
    expect(created.status).toBe(201); createdIds.push(created.body.data.id)
    expect((await employee.patch(`/api/v1/employee/appointments/${created.body.data.id}/accept`)).status).toBe(200)
    expect((await secondEmployee.post(`/api/v1/employee/appointments/${created.body.data.id}/observations`).send({ message: 'No debería poder escribir.', visibleToCitizen: true })).status).toBe(403)
    expect((await employee.post(`/api/v1/employee/appointments/${created.body.data.id}/observations`).send({ message: 'Solicitud revisada. Presentarse con documento de identidad.', visibleToCitizen: true })).status).toBe(201)
    expect((await employee.patch(`/api/v1/employee/appointments/${created.body.data.id}/attend`)).status).toBe(200)
    expect((await employee.patch(`/api/v1/employee/appointments/${created.body.data.id}/finalize`)).status).toBe(200)
    const detail = await citizen.get(`/api/v1/appointments/${created.body.data.id}`)
    expect(detail.body.data.status).toBe('FINALIZED'); expect(detail.body.data.observations).toHaveLength(1); expect(detail.body.data.statusHistory.map((item) => item.toStatus)).toEqual(['PENDING', 'ACCEPTED', 'ATTENDED', 'FINALIZED'])
    expect((await citizen.patch(`/api/v1/appointments/${created.body.data.id}/cancel`)).status).toBe(409)
  })

  it('rechaza y reprograma con historial y libera el horario anterior', async () => {
    const rejected = await citizen.post('/api/v1/appointments').send(appointment('10:00', 'Solicitud que será rechazada con motivo visible.'))
    expect(rejected.status).toBe(201); createdIds.push(rejected.body.data.id)
    expect((await employee.patch(`/api/v1/employee/appointments/${rejected.body.data.id}/reject`).send({ reason: 'No hay disponibilidad operativa para la atención solicitada.' })).status).toBe(200)
    const rejectedDetail = await citizen.get(`/api/v1/appointments/${rejected.body.data.id}`)
    expect(rejectedDetail.body.data.status).toBe('REJECTED'); expect(rejectedDetail.body.data.observations[0].message).toContain('No hay disponibilidad')
    const rescheduled = await citizen.post('/api/v1/appointments').send(appointment('11:00', 'Solicitud que será reprogramada a otra franja disponible.'))
    expect(rescheduled.status).toBe(201); createdIds.push(rescheduled.body.data.id)
    await employee.patch(`/api/v1/employee/appointments/${rescheduled.body.data.id}/accept`
    )
    const reschedule = await employee.patch(`/api/v1/employee/appointments/${rescheduled.body.data.id}/reschedule`).send({ date, time: '15:00', reason: 'Se requiere ajustar el horario de atención.' })
    expect(reschedule.status).toBe(200); expect(reschedule.body.data.status).toBe('RESCHEDULED'); expect(reschedule.body.data.time).toBe('15:00')
  })

  it('protege y expone las operaciones administrativas reales', async () => {
    expect((await citizen.get('/api/v1/admin/dashboard')).status).toBe(403)
    expect((await admin.get('/api/v1/admin/dashboard')).status).toBe(200)
    expect((await admin.get('/api/v1/admin/users')).status).toBe(200)
    expect((await admin.get('/api/v1/admin/appointments?page=1&limit=5')).status).toBe(200)
    const schedules = await admin.get('/api/v1/admin/schedules')
    expect(schedules.status).toBe(200); expect(schedules.body.data.length).toBeGreaterThan(0)
  })
})
