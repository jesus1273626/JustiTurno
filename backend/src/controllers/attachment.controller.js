import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'
import { assertServiceAccess } from '../services/employee.service.js'

const editableStatuses = ['PENDING', 'ACCEPTED', 'RESCHEDULED']
const publicFields = { id: true, appointmentId: true, originalName: true, mimeType: true, size: true, visibleToCitizen: true, createdAt: true, uploadedById: true }
const appointmentWithAttachments = { attachments: { orderBy: { createdAt: 'desc' } } }
const uploadsRoot = path.resolve(process.cwd(), env.uploadDir, 'appointments')
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
export const uploadAttachment = async (req, res, next) => { try { if (!req.file) throw { status: 400, message: 'Selecciona un archivo PDF o imagen válido.' }; const appointment = await getAuthorizedAppointment(req.params.id, req.user); if (req.user.role === 'CITIZEN' && (!editableStatuses.includes(appointment.status) || appointment.citizenId !== req.user.id)) throw { status: 409, message: 'No puedes adjuntar documentos en el estado actual de la cita.' }; if (appointment.attachments.length >= 5) throw { status: 409, message: 'Una cita admite máximo 5 adjuntos.' }; const storedName = `${crypto.randomUUID()}${extensionFor[req.file.mimetype]}`; await fs.mkdir(uploadsRoot, { recursive: true }); const filePath = path.join(uploadsRoot, storedName); await fs.writeFile(filePath, req.file.buffer, { flag: 'wx' }); try { const attachment = await prisma.appointmentAttachment.create({ data: { appointmentId: appointment.id, uploadedById: req.user.id, originalName: path.basename(req.file.originalname).slice(0, 180), storedName, mimeType: req.file.mimetype, size: req.file.size, path: filePath, visibleToCitizen: req.user.role === 'CITIZEN' || req.body.visibleToCitizen !== 'false' }, select: publicFields }); success(res, attachment, 201) } catch (error) { await fs.unlink(filePath).catch(() => {}); throw error } } catch (error) { next(error) } }
export const downloadAttachment = async (req, res, next) => { try { const appointment = await getAuthorizedAppointment(req.params.id, req.user); const attachment = appointment.attachments.find((item) => item.id === req.params.attachmentId); if (!attachment || !visible(attachment, req.user)) throw { status: 404, message: 'Adjunto no encontrado.' }; const safePath = path.resolve(attachment.path); if (!safePath.startsWith(`${uploadsRoot}${path.sep}`)) throw { status: 404, message: 'Adjunto no encontrado.' }; await fs.access(safePath); res.type(attachment.mimeType); res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`); res.sendFile(safePath) } catch (error) { if (error.code === 'ENOENT') return next({ status: 404, message: 'El archivo ya no está disponible.' }); next(error) } }
export const deleteAttachment = async (req, res, next) => { try { const appointment = await getAuthorizedAppointment(req.params.id, req.user); const attachment = appointment.attachments.find((item) => item.id === req.params.attachmentId); if (!attachment) throw { status: 404, message: 'Adjunto no encontrado.' }; if (req.user.role !== 'ADMIN' && attachment.uploadedById !== req.user.id) throw { status: 403, message: 'Solo quien adjuntó el archivo puede eliminarlo.' }; if (req.user.role === 'CITIZEN' && !editableStatuses.includes(appointment.status)) throw { status: 409, message: 'No puedes eliminar documentos en el estado actual de la cita.' }; await prisma.appointmentAttachment.delete({ where: { id: attachment.id } }); await fs.unlink(path.resolve(attachment.path)).catch(() => {}); success(res, { id: attachment.id }) } catch (error) { next(error) } }
