import crypto from 'crypto'
import { storage } from '../services/attachmentStorage.js'
import path from 'path'

import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'
import { assertServiceAccess } from '../services/employee.service.js'

const editableStatuses = ['PENDING', 'ACCEPTED', 'RESCHEDULED']
const publicFields = { id: true, appointmentId: true, originalName: true, mimeType: true, size: true, visibleToCitizen: true, createdAt: true, uploadedById: true }
const appointmentWithAttachments = { attachments: { orderBy: { createdAt: 'desc' } } }

const extensionFor = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
const visible = (attachment, user) => user.role !== 'CITIZEN' || attachment.visibleToCitizen
const serializeAttachment = ({ storedName: _storedName, path: _path, ...attachment }) => attachment

const getAuthorizedAppointment = async (id, user) => {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: appointmentWithAttachments })
  if (!appointment) throw { status: 404, message: 'Cita no encontrada.' }
  if (user.role === 'CITIZEN') {
    if (appointment.citizenId !== user.id) throw { status: 403, message: 'No tienes permiso para acceder a esta cita.' }
  } else await assertServiceAccess(appointment, user)
  return appointment
}
export const listAttachments = async (req, res, next) => { try { const appointment = await getAuthorizedAppointment(req.params.id, req.user); success(res, appointment.attachments.filter((item) => visible(item, req.user)).map(serializeAttachment)) } catch (error) { next(error) } }
export const uploadAttachment = async (req, res, next) => { try { if (!req.file) throw { status: 400, message: 'Selecciona un archivo PDF o imagen válido.' }; const appointment = await getAuthorizedAppointment(req.params.id, req.user); if (req.user.role === 'CITIZEN' && (!editableStatuses.includes(appointment.status) || appointment.citizenId !== req.user.id)) throw { status: 409, message: 'No puedes adjuntar documentos en el estado actual de la cita.' }; if (appointment.attachments.length >= 5) throw { status: 409, message: 'Una cita admite máximo 5 adjuntos.' }; const storedName = `${crypto.randomUUID()}${extensionFor[req.file.mimetype]}`; const filePath = await storage.put(storedName, req.file.buffer, req.file.mimetype); try { const attachment = await prisma.appointmentAttachment.create({ data: { appointmentId: appointment.id, uploadedById: req.user.id, originalName: path.basename(req.file.originalname).slice(0, 180), storedName, mimeType: req.file.mimetype, size: req.file.size, path: filePath, visibleToCitizen: req.user.role === 'CITIZEN' || req.body.visibleToCitizen !== 'false' }, select: publicFields }); success(res, attachment, 201) } catch (error) { await storage.remove(storedName); throw error } } catch (error) { next(error) } }
export const downloadAttachment = async (req, res, next) => { try { const appointment = await getAuthorizedAppointment(req.params.id, req.user); const attachment = appointment.attachments.find((item) => item.id === req.params.attachmentId); if (!attachment || !visible(attachment, req.user)) throw { status: 404, message: 'Adjunto no encontrado.' }; const bytes = await storage.read(attachment.storedName); res.type(attachment.mimeType); res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`); res.send(bytes) } catch (error) { if (error.code === 'ENOENT') return next({ status: 404, message: 'El archivo ya no está disponible.' }); next(error) } }
export const deleteAttachment = async (req, res, next) => { try { const appointment = await getAuthorizedAppointment(req.params.id, req.user); const attachment = appointment.attachments.find((item) => item.id === req.params.attachmentId); if (!attachment) throw { status: 404, message: 'Adjunto no encontrado.' }; if (req.user.role !== 'ADMIN' && attachment.uploadedById !== req.user.id) throw { status: 403, message: 'Solo quien adjuntó el archivo puede eliminarlo.' }; if (req.user.role === 'CITIZEN' && !editableStatuses.includes(appointment.status)) throw { status: 409, message: 'No puedes eliminar documentos en el estado actual de la cita.' }; await prisma.$transaction(async tx => { await tx.appointmentAttachment.delete({ where: { id: attachment.id } }); await storage.remove(attachment.storedName) }); success(res, { id: attachment.id }) } catch (error) { next(error) } }
