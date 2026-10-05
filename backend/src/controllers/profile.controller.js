import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { success, publicUser } from '../utils/api.js'
import { revokeAllSessions } from '../services/session.service.js'
import { serializeSession } from '../services/session.service.js'
import { audit, AuditActions } from '../services/audit.service.js'

export const getProfile = async (req, res) => success(res, { user: publicUser(req.user) })

export const updateProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: req.body })
    success(res, { user: publicUser(user) })
  } catch (error) {
    if (error.code === 'P2002') return next({ status: 409, message: 'El correo ya está registrado.' })
    next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return next({ status: 401, message: 'Sesión no válida.' })
    if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) return next({ status: 400, message: 'La contraseña actual es incorrecta.' })
    if (await bcrypt.compare(req.body.newPassword, user.passwordHash)) return next({ status: 400, message: 'La nueva contraseña no puede ser igual a la anterior.' })
    const passwordHash = await bcrypt.hash(req.body.newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    await revokeAllSessions(user.id, req.jti)
    audit({ actorId: user.id, action: AuditActions.PASSWORD_CHANGED, entityType: 'user', entityId: user.id })
    success(res, { message: 'Contraseña actualizada correctamente.' })
  } catch (error) { next(error) }
}

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.userSession.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } })
    success(res, { sessions: sessions.map((session) => serializeSession(session, req.jti)) })
  } catch (error) { next(error) }
}