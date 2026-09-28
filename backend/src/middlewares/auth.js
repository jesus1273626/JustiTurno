import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { verifyToken } from '../utils/jwt.js'
export const authenticate = async (req, _res, next) => { try { const token = req.cookies?.[env.cookieName]; if (!token) return next({ status: 401, message: 'Sesión no autenticada.' }); const payload = verifyToken(token); const user = await prisma.user.findUnique({ where: { id: payload.sub } }); if (!user || !user.active) return next({ status: 401, message: 'Sesión no válida.' }); req.user = user; next() } catch { next({ status: 401, message: 'Sesión no válida.' }) } }
export const authorize = (...roles) => (req, _res, next) => { if (!req.user || !roles.includes(req.user.role)) return next({ status: 403, message: 'No tienes permisos para esta acción.' }); next() }
