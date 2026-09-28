import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'
const router = Router()
router.get('/', (_req, res) => success(res, { status: 'ok', service: 'justiturno-api' }))
router.get('/db', async (_req, res) => { try { await prisma.$queryRaw`SELECT 1`; success(res, { status: 'ok', database: 'connected' }) } catch { res.status(503).json({ success: false, error: { message: 'Base de datos no disponible.' } }) } })
export default router
