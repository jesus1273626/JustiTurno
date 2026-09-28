import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'
const select = { id: true, slug: true, name: true, description: true, category: true, durationMinutes: true, requirements: { select: { id: true, title: true, description: true, required: true } } }
export const listServices = async (_req, res, next) => { try { success(res, await prisma.service.findMany({ where: { active: true }, select, orderBy: { name: 'asc' } })) } catch (error) { next(error) } }
export const getService = async (req, res, next) => { try { const service = await prisma.service.findFirst({ where: { slug: req.params.slug, active: true }, select }); if (!service) return next({ status: 404, message: 'Servicio no encontrado.' }); success(res, service) } catch (error) { next(error) } }
