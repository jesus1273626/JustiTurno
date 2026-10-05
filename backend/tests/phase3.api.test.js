import bcrypt from 'bcryptjs'
import { DateTime } from 'luxon'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'

const localToday = () => DateTime.now().setZone('America/Bogota')
const nextWeekday = () => { let value = localToday().plus({ days: 1 }); while ([0, 6].includes(value.weekday % 7)) value = value.plus({ days: 1 }); return value.toISODate() }

const ts = Date.now()
const citizenEmail = `ciudadano.fase3.${ts}@ejemplo.com`
const employeeEmail = `funcionario.fase3.${ts}@ejemplo.com`
const secondAdminEmail = `admin2.fase3.${ts}@ejemplo.com`
const lockEmail = `bloqueo.fase3.${ts}@ejemplo.com`

let citizen, admin, employee, secondAdminAgent, otherEmployee
let citizenId, employeeId, adminId, secondAdminId
let orientation, family, inspection, date, slot, otherSlot
const createdAppointmentIds = []
const createdRequirementIds = []

const login = async (agent, email, password = 'Demo1234') => agent.post('/api/v1/auth/login').send({ email, password })
const createAppointment = async (agent, serviceId, time, reason = 'Solicitud de prueba para la fase tres.') => agent.post('/api/v1/appointments').send({ serviceId, date, time, reason })

describe.sequential('Fase 3 API real', () => {
  beforeAll(async () => {
    orientation = await prisma.service.findUniqueOrThrow({ where: { slug: 'orientacion-juridica' } })
    family = await prisma.service.findUniqueOrThrow({ where: { slug: 'comisaria-familia' } })
    inspection = await prisma.service.findUniqueOrThrow({ where: { slug: 'inspeccion-policia' } })
    date = nextWeekday()
    citizen = request.agent(app); admin = request.agent(app); employee = request.agent(app); secondAdminAgent = request.agent(app); otherEmployee = request.agent(app)
    const registered = await citizen.post('/api/v1/auth/register').send({ firstName: 'Ciudadana', lastName: 'FaseTres', document: String(ts).slice(-10), phone: '3005551212', email: citizenEmail, password: 'Demo1234' })
    citizenId = registered.body.data.user.id
    await login(admin, 'admin@demo.com')
    adminId = (await admin.get('/api/v1/auth/me')).body.data.user.id
    const created = await admin.post('/api/v1/admin/employees').send({ firstName: 'Funcionario', lastName: 'FaseTres', document: String(ts + 1).slice(-10), phone: '3005551213', email: employeeEmail, password: 'Demo1234', serviceIds: [orientation.id, inspection.id] })
    employeeId = created.body.data.employee.id
    const secondAdmin = await prisma.user.create({ data: { firstName: 'Segundo', lastName: 'Admin', document: String(ts + 2).slice(-10), phone: '3005551214', email: secondAdminEmail, passwordHash: await bcrypt.hash('Demo1234', 10), role: 'ADMIN' } })
    secondAdminId = secondAdmin.id
    await admin.post('/api/v1/admin/employees').send({ firstName: 'Otro', lastName: 'Funcionario', document: String(ts + 3).slice(-10), phone: '3005551215', email: `otro.fase3.${ts}@ejemplo.com`, password: 'Demo1234', serviceIds: [family.id] })
    await login(employee, employeeEmail)
    await login(otherEmployee, `otro.fase3.${ts}@ejemplo.com`)
    const available = await request(app).get(`/api/v1/services/${family.slug}/availability?date=${date}`)
    const slots = available.body.data.slots
    otherSlot = slots.find((item) => item.remaining > 0)?.time || slots[0]?.time
    const availableOrientation = await request(app).get(`/api/v1/services/${orientation.slug}/availability?date=${date}`)
    const orientationSlots = availableOrientation.body.data.slots
    slot = orientationSlots.find((item) => item.remaining > 0)?.time || orientationSlots[0]?.time
    await prisma.user.create({ data: { firstName: 'Bloqueo', lastName: 'Prueba', document: String(ts + 4).slice(-10), phone: '3005551216', email: lockEmail, passwordHash: await bcrypt.hash('Demo1234', 10), role: 'CITIZEN' } })
  })

  afterAll(async () => {
    if (createdAppointmentIds.length) await prisma.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } })
    if (createdRequirementIds.length) await prisma.requirement.deleteMany({ where: { id: { in: createdRequirementIds } } })
    await prisma.user.deleteMany({ where: { email: { in: [citizenEmail, employeeEmail, secondAdminEmail, lockEmail, `otro.fase3.${ts}@ejemplo.com`] } } })
    await prisma.$disconnect()
  })

  it('consulta, edita el perfil y rechaza correo duplicado', async () => {
    const profile = await citizen.get('/api/v1/profile')
    expect(profile.status).toBe(200)
    expect(profile.body.data.user.email).toBe(citizenEmail)
    expect(profile.body.data.user.passwordHash).toBeUndefined()
    const updated = await citizen.patch('/api/v1/profile').send({ firstName: 'Ciudadana Actualizada', phone: '3005559999' })
    expect(updated.status).toBe(200)
    expect(updated.body.data.user.firstName).toBe('Ciudadana Actualizada')
    expect(updated.body.data.user.role).toBe('CITIZEN')
    const duplicate = await citizen.patch('/api/v1/profile').send({ email: 'admin@demo.com' })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.message).toBe('El correo ya está registrado.')
  })

  it('cambia la contraseña, revoca otras sesiones y mantiene la actual', async () => {
    const secondDevice = request.agent(app)
    await login(secondDevice, citizenEmail)
    const wrongCurrent = await citizen.patch('/api/v1/profile/password').send({ currentPassword: 'Incorrecta1', newPassword: 'Nueva1234', confirmPassword: 'Nueva1234' })
    expect(wrongCurrent.status).toBe(400)
    expect(wrongCurrent.body.error.message).toBe('La contraseña actual es incorrecta.')
    const mismatch = await citizen.patch('/api/v1/profile/password').send({ currentPassword: 'Demo1234', newPassword: 'Nueva1234', confirmPassword: 'Otra1234' })
    expect(mismatch.status).toBe(400)
    const changed = await citizen.patch('/api/v1/profile/password').send({ currentPassword: 'Demo1234', newPassword: 'Nueva1234', confirmPassword: 'Nueva1234' })
    expect(changed.status).toBe(200)
    const stillActive = await citizen.get('/api/v1/auth/me')
    expect(stillActive.status).toBe(200)
    const revoked = await secondDevice.get('/api/v1/auth/me')
    expect(revoked.status).toBe(401)
    const sessions = await citizen.get('/api/v1/profile/sessions')
    expect(sessions.status).toBe(200)
    expect(sessions.body.data.sessions.length).toBeGreaterThan(0)
    expect(sessions.body.data.sessions.some((item) => item.current)).toBe(true)
  })

  it('lista sesiones, cierra la actual y revoca con logout-all', async () => {
    const deviceA = request.agent(app)
    const deviceB = request.agent(app)
    await login(deviceA, 'funcionario@demo.com')
    await login(deviceB, 'funcionario@demo.com')
    const beforeA = await deviceA.get('/api/v1/auth/me')
    expect(beforeA.status).toBe(200)
    const beforeB = await deviceB.get('/api/v1/auth/me')
    expect(beforeB.status).toBe(200)
    const loggedOut = await deviceA.post('/api/v1/auth/logout')
    expect(loggedOut.status).toBe(200)
    const afterLogout = await deviceA.get('/api/v1/auth/me')
    expect(afterLogout.status).toBe(401)
    const deviceBOk = await deviceB.get('/api/v1/auth/me')
    expect(deviceBOk.status).toBe(200)
    await login(deviceA, 'funcionario@demo.com')
    const all = await deviceA.post('/api/v1/auth/logout-all')
    expect(all.status).toBe(200)
    expect((await deviceA.get('/api/v1/auth/me')).status).toBe(401)
    expect((await deviceB.get('/api/v1/auth/me')).status).toBe(401)
  })

  it('bloquea temporalmente el login tras intentos fallidos', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const failed = await request(app).post('/api/v1/auth/login').send({ email: lockEmail, password: 'wrong' })
      expect(failed.status).toBe(401)
    }
    const locked = await request(app).post('/api/v1/auth/login').send({ email: lockEmail, password: 'Demo1234' })
    expect(locked.status).toBe(401)
    expect(locked.body.error.message).toBe('Cuenta temporalmente bloqueada. Intenta de nuevo más tarde.')
    const record = await prisma.user.findUnique({ where: { email: lockEmail } })
    expect(record.failedLoginAttempts).toBe(5)
    expect(record.lockedUntil).not.toBeNull()
  })

  it('crea funcionarios, protege el endpoint y edita funcionarios', async () => {
    const forbidden = await citizen.post('/api/v1/admin/employees').send({ firstName: 'No', lastName: 'Puede', document: '9999999999', phone: '3005551217', email: `nopuede.${ts}@ejemplo.com`, password: 'Demo1234' })
    expect(forbidden.status).toBe(403)
    const detail = await admin.get(`/api/v1/admin/employees/${employeeId}`)
    expect(detail.status).toBe(200)
    expect(detail.body.data.employee.role).toBe('EMPLOYEE')
    expect(detail.body.data.employee.services.map((item) => item.slug)).toEqual(expect.arrayContaining([orientation.slug, inspection.slug]))
    const edited = await admin.patch(`/api/v1/admin/employees/${employeeId}`).send({ phone: '3005558888' })
    expect(edited.status).toBe(200)
    expect(edited.body.data.employee.phone).toBe('3005558888')
    const list = await admin.get('/api/v1/admin/employees?search=FaseTres')
    expect(list.status).toBe(200)
    expect(list.body.data.items.some((item) => item.id === employeeId)).toBe(true)
  })

  it('asigna servicios a un funcionario y sincroniza la asignación', async () => {
    const assigned = await admin.put(`/api/v1/admin/employees/${employeeId}/services`).send({ serviceIds: [family.id] })
    expect(assigned.status).toBe(200)
    expect(assigned.body.data.employee.services.map((item) => item.id)).toEqual([family.id])
    const cleared = await admin.put(`/api/v1/admin/employees/${employeeId}/services`).send({ serviceIds: [orientation.id, inspection.id] })
    expect(cleared.status).toBe(200)
    expect(cleared.body.data.employee.services.map((item) => item.id).sort()).toEqual([inspection.id, orientation.id].sort())
  })

  it('restringe citas y acciones a los servicios asignados al funcionario', async () => {
    const pending = await createAppointment(citizen, family.id, otherSlot, 'Cita de un servicio que no corresponde al primer funcionario.')
    expect(pending.status).toBe(201)
    createdAppointmentIds.push(pending.body.data.id)
    const employeeList = await employee.get('/api/v1/employee/appointments')
    expect(employeeList.status).toBe(200)
    expect(employeeList.body.data.items.some((item) => item.id === pending.body.data.id)).toBe(false)
    const rejected = await employee.patch(`/api/v1/employee/appointments/${pending.body.data.id}/accept`)
    expect(rejected.status).toBe(403)
    expect(rejected.body.error.message).toBe('No estás autorizado para atender este servicio.')
    const allowed = await otherEmployee.patch(`/api/v1/employee/appointments/${pending.body.data.id}/accept`)
    expect(allowed.status).toBe(200)
    expect(allowed.body.data.status).toBe('ACCEPTED')
    const observation = await employee.post(`/api/v1/employee/appointments/${pending.body.data.id}/observations`).send({ message: 'No debería poder intervenir.', visibleToCitizen: true })
    expect(observation.status).toBe(403)
  })

  it('acepta citas de servicios permitidos', async () => {
    const pending = await createAppointment(citizen, orientation.id, slot, 'Cita del servicio asignado al funcionario.')
    expect(pending.status).toBe(201)
    createdAppointmentIds.push(pending.body.data.id)
    const accepted = await employee.patch(`/api/v1/employee/appointments/${pending.body.data.id}/accept`)
    expect(accepted.status).toBe(200)
    expect(accepted.body.data.status).toBe('ACCEPTED')
    expect(accepted.body.data.assignedEmployee.id).toBe(employeeId)
  })

  it('desactiva usuarios, revoca sesiones y protege al último administrador', async () => {
    const deactivateSecond = await admin.patch(`/api/v1/admin/users/${secondAdminId}/status`).send({ active: false })
    expect(deactivateSecond.status).toBe(200)
    expect(deactivateSecond.body.data.user.active).toBe(false)
    const deactivateLast = await admin.patch(`/api/v1/admin/users/${adminId}/status`).send({ active: false })
    expect(deactivateLast.status).toBe(409)
    expect(deactivateLast.body.error.message).toBe('No es posible desactivar el último administrador activo.')
    const selfDeactivate = await admin.patch(`/api/v1/admin/users/${adminId}/status`).send({ active: false })
    expect(selfDeactivate.status).toBe(409)
    const reactivate = await admin.patch(`/api/v1/admin/users/${secondAdminId}/status`).send({ active: true })
    expect(reactivate.status).toBe(200)
    expect(reactivate.body.data.user.active).toBe(true)
  })

  it('impide el login de un usuario desactivado y revoca su sesión', async () => {
    await login(secondAdminAgent, secondAdminEmail)
    const active = await secondAdminAgent.get('/api/v1/auth/me')
    expect(active.status).toBe(200)
    await admin.patch(`/api/v1/admin/users/${secondAdminId}/status`).send({ active: false })
    const deactivated = await secondAdminAgent.get('/api/v1/auth/me')
    expect(deactivated.status).toBe(401)
    const loginAgain = await request(app).post('/api/v1/auth/login').send({ email: secondAdminEmail, password: 'Demo1234' })
    expect(loginAgain.status).toBe(401)
    expect(loginAgain.body.error.message).toBe('Tu cuenta no se encuentra activa.')
    await admin.patch(`/api/v1/admin/users/${secondAdminId}/status`).send({ active: true })
  })

  it('expone el detalle de usuario sin datos sensibles', async () => {
    const detail = await admin.get(`/api/v1/admin/users/${citizenId}`)
    expect(detail.status).toBe(200)
    expect(detail.body.data.user.appointments).toBeGreaterThanOrEqual(0)
    expect(detail.body.data.user.passwordHash).toBeUndefined()
    const employeeDetail = await admin.get(`/api/v1/admin/users/${employeeId}`)
    expect(employeeDetail.status).toBe(200)
    expect(Array.isArray(employeeDetail.body.data.user.services)).toBe(true)
  })

  it('administra requisitos de un servicio', async () => {
    const created = await admin.post(`/api/v1/admin/services/${orientation.id}/requirements`).send({ title: 'Requisito de prueba fase 3', description: 'Descripción opcional', required: true })
    expect(created.status).toBe(201)
    createdRequirementIds.push(created.body.data.requirement.id)
    const updated = await admin.patch(`/api/v1/admin/requirements/${created.body.data.requirement.id}`).send({ required: false })
    expect(updated.status).toBe(200)
    expect(updated.body.data.requirement.required).toBe(false)
    const removed = await admin.delete(`/api/v1/admin/requirements/${created.body.data.requirement.id}`)
    expect(removed.status).toBe(200)
    expect(createdRequirementIds.pop()).toBe(created.body.data.requirement.id)
  })

  it('protege y registra la auditoría de acciones importantes', async () => {
    const forbidden = await citizen.get('/api/v1/admin/audit')
    expect(forbidden.status).toBe(403)
    const audit = await admin.get('/api/v1/admin/audit?page=1&limit=20')
    expect(audit.status).toBe(200)
    expect(Array.isArray(audit.body.data.items)).toBe(true)
    expect(audit.body.data.pagination).toBeDefined()
    const byEmployeeCreated = await admin.get('/api/v1/admin/audit?action=EMPLOYEE_CREATED')
    expect(byEmployeeCreated.status).toBe(200)
    expect(byEmployeeCreated.body.data.items.length).toBeGreaterThan(0)
    expect(byEmployeeCreated.body.data.items.every((item) => item.action === 'EMPLOYEE_CREATED')).toBe(true)
    expect(byEmployeeCreated.body.data.items[0].actor.email).toBe('admin@demo.com')
    const byServices = await admin.get('/api/v1/admin/audit?action=EMPLOYEE_SERVICES_UPDATED')
    expect(byServices.body.data.items.length).toBeGreaterThan(0)
    const byAccepted = await admin.get('/api/v1/admin/audit?action=APPOINTMENT_ACCEPTED')
    expect(byAccepted.body.data.items.length).toBeGreaterThan(0)
    const byEntity = await admin.get(`/api/v1/admin/audit?entityType=appointment`)
    expect(byEntity.body.data.items.every((item) => item.entityType === 'appointment')).toBe(true)
  })

  it('mejora el dashboard de funcionario con servicios asignados', async () => {
    const dashboard = await employee.get('/api/v1/employee/dashboard')
    expect(dashboard.status).toBe(200)
    const data = dashboard.body.data
    expect(typeof data.pendingAvailable).toBe('number')
    expect(typeof data.myAccepted).toBe('number')
    expect(typeof data.attendedToday).toBe('number')
    expect(typeof data.toFinalize).toBe('number')
    expect(Array.isArray(data.todayAgenda)).toBe(true)
  })
})