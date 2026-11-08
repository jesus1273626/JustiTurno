import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { prisma } from '../config/prisma.js'
import { databaseStorage, readLegacyFile, removeLegacyFile } from '../services/attachmentStorage.js'
import { assertServiceAccess } from '../services/employee.service.js'
import { success } from '../utils/api.js'

const editableStatuses = ['PENDING', 'ACCEPTED', 'RESCHEDULED']
const publicFields = { id: true, appointmentId: true, originalName: true, mimeType: true, size: true, visibleToCitizen: true, createdAt: true, uploadedById: true }
const extensionFor = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
const attachmentNotFound = () => ({ status: 404, message: 'Adjunto no encontrado.' })

async function authorizeAppointment(client, id, user, lock = false) {
  // Serialize changes per appointment, including the count check on concurrent uploads.
  if (lock) await client.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} FOR UPDATE`
  const appointment = await client.appointment.findUnique({
    where: { id },
    select: { citizenId: true, serviceId: true, assignedEmployeeId: true, status: true }
  })
  if (!appointment) throw { status: 404, message: 'Cita no encontrada.' }
  if (user.role === 'CITIZEN') {
    if (appointment.citizenId !== user.id) throw { status: 403, message: 'No tienes permiso para acceder a esta cita.' }
  } else {
    await assertServiceAccess(appointment, user, client)
  }
  return appointment
}

export async function listAttachments(req, res) {
  const appointmentId = req.params.id
  await authorizeAppointment(prisma, appointmentId, req.user)
  const where = req.user.role === 'CITIZEN' ? { appointmentId, visibleToCitizen: true } : { appointmentId }
  const attachments = await prisma.appointmentAttachment.findMany({ where, select: publicFields, orderBy: { createdAt: 'desc' } })
  success(res, attachments)
}

export async function uploadAttachment(req, res) {
  if (!req.file) throw { status: 400, message: 'Selecciona un archivo PDF o imagen válido.' }
  const appointmentId = req.params.id
  const attachment = await prisma.$transaction(async tx => {
    const appointment = await authorizeAppointment(tx, appointmentId, req.user, true)
    if (req.user.role === 'CITIZEN' && !editableStatuses.includes(appointment.status)) {
      throw { status: 409, message: 'No puedes adjuntar documentos en el estado actual de la cita.' }
    }
    const count = await tx.appointmentAttachment.count({ where: { appointmentId } })
    if (count >= 5) throw { status: 409, message: 'Una cita admite máximo 5 adjuntos.' }
    return tx.appointmentAttachment.create({
      data: {
        appointmentId, uploadedById: req.user.id,
        originalName: path.basename(req.file.originalname).slice(0, 180),
        storedName: randomUUID() + extensionFor[req.file.mimetype],
        mimeType: req.file.mimetype, size: req.file.size, path: databaseStorage,
        visibleToCitizen: req.user.role === 'CITIZEN' || req.body.visibleToCitizen !== 'false',
        content: { create: { bytes: req.file.buffer } }
      },
      select: publicFields
    })
  }, { timeout: 30000 })
  success(res, attachment, 201)
}

export async function downloadAttachment(req, res) {
  const { id: appointmentId, attachmentId } = req.params
  await authorizeAppointment(prisma, appointmentId, req.user)
  const where = { appointmentId, id: attachmentId }
  if (req.user.role === 'CITIZEN') where.visibleToCitizen = true
  const attachment = await prisma.appointmentAttachment.findFirst({
    where,
    select: { originalName: true, storedName: true, mimeType: true, path: true, content: { select: { bytes: true } } }
  })
  if (!attachment) throw attachmentNotFound()
  let bytes = attachment.content?.bytes
  if (!bytes && attachment.path !== databaseStorage) bytes = await readLegacyFile(attachment.storedName)
  if (!bytes) throw { status: 404, message: 'El archivo ya no está disponible.' }
  res.type(attachment.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`)
  res.send(Buffer.from(bytes))
}

async function authorizeDelete(tx, appointmentId, attachmentId, user) {
  const appointment = await authorizeAppointment(tx, appointmentId, user, true)
  const attachment = await tx.appointmentAttachment.findFirst({
    where: { id: attachmentId, appointmentId },
    select: { uploadedById: true, path: true, storedName: true }
  })
  if (!attachment) throw attachmentNotFound()
  if (user.role !== 'ADMIN' && attachment.uploadedById !== user.id) {
    throw { status: 403, message: 'Solo quien adjuntó el archivo puede eliminarlo.' }
  }
  if (user.role === 'CITIZEN' && !editableStatuses.includes(appointment.status)) {
    throw { status: 409, message: 'No puedes eliminar documentos en el estado actual de la cita.' }
  }
  return attachment
}

export async function deleteAttachment(req, res) {
  const { id: appointmentId, attachmentId } = req.params
  const where = { id: attachmentId }
  const legacyName = await prisma.$transaction(async tx => {
    const attachment = await authorizeDelete(tx, appointmentId, attachmentId, req.user)
    if (attachment.path !== databaseStorage) {
      // Keep a private, committed copy until both the legacy unlink and final DELETE succeed.
      const bytes = await readLegacyFile(attachment.storedName)
      if (bytes) {
        await tx.attachmentContent.upsert({ where: { attachmentId }, create: { attachmentId, bytes }, update: {} })
        return attachment.storedName
      }
    }
    await tx.appointmentAttachment.delete({ where, select: { id: true } })
    return null
  }, { timeout: 30000 })
  if (legacyName) {
    await removeLegacyFile(legacyName)
    await prisma.$transaction(async tx => {
      await authorizeDelete(tx, appointmentId, attachmentId, req.user)
      await tx.appointmentAttachment.delete({ where, select: { id: true } })
    })
  }
  success(res, { id: attachmentId })
}
