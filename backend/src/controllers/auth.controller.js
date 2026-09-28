import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { success, publicUser } from '../utils/api.js'
import { createToken } from '../utils/jwt.js'
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' }
const setSession = (res, user) => res.cookie(env.cookieName, createToken(user), cookieOptions)
export const register = async (req, res, next) => { try { const passwordHash = await bcrypt.hash(req.body.password, 12); const user = await prisma.user.create({ data: { ...req.body, password: undefined, passwordHash, role: 'CITIZEN' } }); setSession(res, user); return success(res, { user: publicUser(user) }, 201) } catch (error) { next(error) } }
export const login = async (req, res, next) => { try { const user = await prisma.user.findUnique({ where: { email: req.body.email } }); if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)) || !user.active) return next({ status: 401, message: 'Correo o contraseña incorrectos.' }); setSession(res, user); return success(res, { user: publicUser(user) }) } catch (error) { next(error) } }
export const logout = (_req, res) => { res.clearCookie(env.cookieName, { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', path: '/' }); return success(res, { message: 'Sesión cerrada correctamente.' }) }
export const me = async (req, res) => success(res, { user: publicUser(req.user) })
