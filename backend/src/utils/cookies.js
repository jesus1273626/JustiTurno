import { env } from '../config/env.js'
export const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' }
export const clearCookieOptions = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', path: '/' }