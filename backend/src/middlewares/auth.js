import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { verifyToken } from '../utils/jwt.js'
import { touchSession } from '../services/session.service.js'

export const authenticate = async (req, _res, next) => {
  try {
    const token = req.cookies?.[env.cookieName]
    if (!token) return next({ status: 401, message: 'Sesión no autenticada.' })
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return next({ status: 401, message: 'Sesión no válida.' })
    if (!user.active) return next({ status: 401, message: 'Tu cuenta no se encuentra activa.' })
    const session = payload.jti ? await prisma.userSession.findUnique({ where: { jti: payload.jti } }) : null
    if (!session || session.revokedAt || session.expiresAt < new Date()) return next({ status: 401, message: 'Sesión no válida o expirada.' })
    touchSession(session.id)
    req.user = user
    req.jti = payload.jti
    req.sessionId = session.id
    next()
  } catch {
    next({ status: 401, message: 'Sesión no válida.' })
  }
}

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next({ status: 403, message: 'No tienes permisos para esta acción.' })
  next()
}