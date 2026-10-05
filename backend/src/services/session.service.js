import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'
import { createToken } from '../utils/jwt.js'

export const createSession = async (user, userAgent) => {
  const jti = crypto.randomUUID()
  const token = createToken(user, jti)
  const decoded = jwt.decode(token)
  const expiresAt = new Date(decoded.exp * 1000)
  const session = await prisma.userSession.create({ data: { userId: user.id, jti, expiresAt, userAgent: userAgent ? String(userAgent).slice(0, 200) : null } })
  return { token, session }
}

export const revokeSession = async (jti) => {
  if (!jti) return
  await prisma.userSession.updateMany({ where: { jti, revokedAt: null }, data: { revokedAt: new Date() } })
}

export const revokeAllSessions = async (userId, exceptJti = null) => {
  await prisma.userSession.updateMany({ where: { userId, ...(exceptJti ? { jti: { not: exceptJti } } : {}), revokedAt: null }, data: { revokedAt: new Date() } })
}

export const touchSession = (id) => {
  prisma.userSession.updateMany({ where: { id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(Date.now() - 60000) } }] }, data: { lastSeenAt: new Date() } }).catch(() => {})
}

export const serializeSession = (session, currentJti) => ({
  id: session.id,
  createdAt: session.createdAt,
  lastSeenAt: session.lastSeenAt,
  expiresAt: session.expiresAt,
  userAgent: session.userAgent,
  current: session.jti === currentJti,
  active: !session.revokedAt && session.expiresAt > new Date()
})