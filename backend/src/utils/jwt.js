import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
export const createToken = (user, jti) => jwt.sign({ sub: user.id, role: user.role, jti }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
export const verifyToken = (token) => jwt.verify(token, env.jwtSecret)