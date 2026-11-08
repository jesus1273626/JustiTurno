import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { env } from '../src/config/env.js'

const ts = Date.now()
const email = `ciudadano.fase4.${ts}@ejemplo.com`
const localToday = () => DateTime.now().setZone('America/Bogota')
const nextWeekday = () => { let value = localToday().plus({ days: 1 }); while ([0, 6].includes(value.weekday % 7)) value = value.plus({ days: 1 }); return value.toISODate() }
let citizen, employee, admin, service, appointmentId, attachmentId

describe.sequential('Fase 4 API real', () => {
  beforeAll(async () => {
    service = await prisma.service.findUniqueOrThrow({ where: { slug: 'orientacion-juridica' } })
    citizen = request.agent(app); employee = request.agent(app); admin = request.agent(app)
    await citizen.post('/api/v1/auth/register').send({ firstName: 'Ciudadana', lastName: 'FaseCuatro', document: String(ts).slice(-10), phone: '3005551212', email, password: 'Demo1234' })
    await employee.post('/api/v1/auth/login').send({ email: 'funcionario@demo.com', password: 'Demo1234' })
    await admin.post('/api/v1/auth/login').send({ email: 'admin@demo.com', password: 'Demo1234' })
  })

  it('expone readiness y crea notificaciones por cambios de cita', async () => {
    const ready = await request(app).get('/api/v1/health/ready')
    expect(ready.status).toBe(200)
    expect(ready.body.data.status).toBe('ready')
    const date = nextWeekday()
    const slots = (await request(app).get(`/api/v1/services/${service.slug}/availability?date=${date}`)).body.data.slots
    const slot = slots.find((item) => item.remaining > 0).time
    const created = await citizen.post('/api/v1/appointments').send({ serviceId: service.id, date, time: slot, reason: 'Solicitud de prueba para notificaciones y documentos de la fase cuatro.' })
    expect(created.status).toBe(201)
    appointmentId = created.body.data.id
    let notifications = await citizen.get('/api/v1/notifications?unread=true')
    expect(notifications.status).toBe(200)
    expect(notifications.body.data.items.some((item) => item.type === 'APPOINTMENT_CREATED' && item.entityId === appointmentId)).toBe(true)
    const pending = notifications.body.data.items.find((item) => item.entityId === appointmentId)
    expect((await citizen.patch(`/api/v1/notifications/${pending.id}/read`)).status).toBe(200)
    expect((await employee.patch(`/api/v1/employee/appointments/${appointmentId}/accept`)).status).toBe(200)
    notifications = await citizen.get('/api/v1/notifications?unread=true')
    expect(notifications.body.data.items.some((item) => item.type === 'APPOINTMENT_ACCEPTED' && item.entityId === appointmentId)).toBe(true)
  })

  it('sube, lista y descarga adjuntos con validaciones', async () => {
    const upload = await citizen.post(`/api/v1/appointments/${appointmentId}/attachments`).attach('file', Buffer.from('contenido de soporte'), { filename: 'soporte.pdf', contentType: 'application/pdf' })
    expect(upload.status).toBe(201)
    attachmentId = upload.body.data.id
    const list = await citizen.get(`/api/v1/appointments/${appointmentId}/attachments`)
    expect(list.status).toBe(200)
    expect(list.body.data.some((item) => item.id === attachmentId)).toBe(true)
    const download = await employee.get(`/api/v1/appointments/${appointmentId}/attachments/${attachmentId}/download`)
    expect(download.status).toBe(200)
    expect(download.headers['content-type']).toContain('application/pdf')
    expect(download.body).toEqual(Buffer.from('contenido de soporte'))
    expect(list.body.data[0]).not.toHaveProperty('content')
    const persisted = await prisma.attachmentContent.findUniqueOrThrow({ where: { attachmentId } })
    expect(Buffer.from(persisted.bytes)).toEqual(download.body)
    const endpoint = `/api/v1/appointments/${appointmentId}/attachments/${attachmentId}`
    expect((await employee.delete(endpoint)).status).toBe(403)
    expect((await citizen.delete(endpoint)).status).toBe(200)
    expect((await citizen.get(endpoint + '/download')).status).toBe(404)
    expect(await prisma.attachmentContent.count({ where: { attachmentId } })).toBe(0)
    const invalid = await citizen.post(`/api/v1/appointments/${appointmentId}/attachments`).attach('file', Buffer.from('texto'), { filename: 'soporte.txt', contentType: 'text/plain' })
    expect(invalid.status).toBe(400)
    const oversized = await citizen.post(`/api/v1/appointments/${appointmentId}/attachments`).attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'grande.pdf', contentType: 'application/pdf' })
    expect(oversized.status).toBe(413)
  })

  it('mantiene el límite de cinco al subir simultáneamente y respeta la visibilidad', async () => {
    const collection = `/api/v1/appointments/${appointmentId}/attachments`
    const uploads = await Promise.all(Array.from({ length: 6 }, () =>
      employee.post(collection).field('visibleToCitizen', 'false')
        .attach('file', Buffer.from('privado'), { filename: 'interno.pdf', contentType: 'application/pdf' })
    ))
    expect(uploads.map(result => result.status).sort()).toEqual([201, 201, 201, 201, 201, 409])
    expect((await citizen.get(collection)).body.data).toEqual([])
    const internal = (await employee.get(collection)).body.data
    expect(internal).toHaveLength(5)
    expect((await citizen.get(`${collection}/${internal[0].id}/download`)).status).toBe(404)
    for (const attachment of internal) expect((await admin.delete(`${collection}/${attachment.id}`)).status).toBe(200)
  })

  it('permite descargar y eliminar adjuntos de instalaciones previas', async () => {
    const { id: uploadedById } = await prisma.user.findUniqueOrThrow({ where: { email } })
    const storedName = randomUUID() + '.pdf'
    const folder = path.resolve(env.uploadDir, 'appointments')
    const file = path.join(folder, storedName)
    const bytes = Buffer.from('formato anterior')
    await fs.mkdir(folder, { recursive: true })
    await fs.writeFile(file, bytes, { flag: 'wx' })
    try {
      const legacy = await prisma.appointmentAttachment.create({ data: {
        appointmentId, uploadedById, originalName: 'anterior.pdf', storedName,
        mimeType: 'application/pdf', size: bytes.length, path: 'appointments/' + storedName
      } })
      const endpoint = `/api/v1/appointments/${appointmentId}/attachments/${legacy.id}`
      expect((await citizen.get(endpoint + '/download')).body).toEqual(bytes)
      expect((await citizen.delete(endpoint)).status).toBe(200)
      await expect(fs.access(file)).rejects.toMatchObject({ code: 'ENOENT' })
      expect(await prisma.attachmentContent.count({ where: { attachmentId: legacy.id } })).toBe(0)
    } finally {
      await fs.rm(file, { force: true })
    }
  })

  it('genera reportes administrativos y el CSV', async () => {
    const report = await admin.get('/api/v1/admin/reports/appointments')
    expect(report.status).toBe(200)
    expect(report.body.data.total).toBeGreaterThan(0)
    const csv = await admin.get('/api/v1/admin/reports/appointments.csv')
    expect(csv.status).toBe(200)
    expect(csv.headers['content-type']).toContain('text/csv')
    expect(csv.text).toContain('Código')
  })

  it('notifica los cambios de estado de la cuenta', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } })
    const changed = await admin.patch(`/api/v1/admin/users/${user.id}/status`).send({ active: false })
    expect(changed.status).toBe(200)
    const notification = await prisma.notification.findFirst({ where: { userId: user.id, type: 'ACCOUNT_STATUS_CHANGED' }, orderBy: { createdAt: 'desc' } })
    expect(notification?.message).toContain('desactivada')
  })

  afterAll(async () => {
    if (appointmentId) await prisma.appointment.deleteMany({ where: { id: appointmentId } })
    await prisma.user.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })
})
