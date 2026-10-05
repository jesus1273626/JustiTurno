import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { success, publicUser } from '../utils/api.js'
import { clearCookieOptions, cookieOptions } from '../utils/cookies.js'
import { createSession, revokeSession, revokeAllSessions } from '../services/session.service.js'
import { audit, AuditActions } from '../services/audit.service.js'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_MINUTES = 15

export const register = async (req, res, next) => {
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12)
    const user = await prisma.user.create({ data: { ...req.body, password: undefined, passwordHash, role: 'CITIZEN' } })
    const { token } = await createSession(user, req.get('user-agent'))
    res.cookie(env.cookieName, token, cookieOptions)
    return success(res, { user: publicUser(user) }, 201)
  } catch (error) { next(error) }
}

export const login = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } })
    if (!user) return next({ status: 401, message: 'Correo o contraseña incorrectos.' })
    const now = new Date()
    if (user.lockedUntil && user.lockedUntil > now) {
      await audit({ actorId: user.id, action: AuditActions.LOGIN_FAILED, entityType: 'user', entityId: user.id, metadata: { reason: 'locked' } })
      return next({ status: 401, message: 'Cuenta temporalmente bloqueada. Intenta de nuevo más tarde.' })
    }
    if (!user.active) {
      await audit({ actorId: user.id, action: AuditActions.LOGIN_FAILED, entityType: 'user', entityId: user.id, metadata: { reason: 'inactive' } })
      return next({ status: 401, message: 'Tu cuenta no se encuentra activa.' })
    }
    const valid = await bcrypt.compare(req.body.password, user.passwordHash)
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1
      const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(now.getTime() + LOCK_MINUTES * 60000) : null
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockedUntil } })
      await audit({ actorId: user.id, action: AuditActions.LOGIN_FAILED, entityType: 'user', entityId: user.id, metadata: { attempts } })
      return next({ status: 401, message: 'Correo o contraseña incorrectos.' })
    }
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
    const { token } = await createSession(user, req.get('user-agent'))
    res.cookie(env.cookieName, token, cookieOptions)
    await audit({ actorId: user.id, action: AuditActions.LOGIN_SUCCESS, entityType: 'user', entityId: user.id })
    return success(res, { user: publicUser(user) })
  } catch (error) { next(error) }
}

export const logout = async (req, res) => {
  try {
    await revokeSession(req.jti)
    await audit({ actorId: req.user?.id, action: AuditActions.LOGOUT, entityType: 'session', entityId: req.sessionId })
  } catch { /* el cierre local siempre debe responder */ }
  res.clearCookie(env.cookieName, clearCookieOptions)
  return success(res, { message: 'Sesión cerrada correctamente.' })
}

export const logoutAll = async (req, res, next) => {
  try {
    await revokeAllSessions(req.user.id)
    await audit({ actorId: req.user.id, action: AuditActions.LOGOUT_ALL, entityType: 'user', entityId: req.user.id })
  } catch (error) { next(error) }
  res.clearCookie(env.cookieName, clearCookieOptions)
  return success(res, { message: 'Se cerraron todas las sesiones activas.' })
}

export const me = async (req, res) => success(res, { user: publicUser(req.user) })