import { prisma } from '../config/prisma.js'
import { success } from '../utils/api.js'

const pageOptions = (query) => ({ page: Number(query.page || 1), limit: Math.min(Number(query.limit || 20), 100) })
export const listNotifications = async (req, res, next) => { try { const { page, limit } = pageOptions(req.query); const where = { userId: req.user.id, ...(req.query.unread === 'true' ? { readAt: null } : {}) }; const [total, items] = await prisma.$transaction([prisma.notification.count({ where }), prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit })]); success(res, { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }) } catch (error) { next(error) } }
export const unreadCount = async (req, res, next) => { try { success(res, { count: await prisma.notification.count({ where: { userId: req.user.id, readAt: null } }) }) } catch (error) { next(error) } }
export const markRead = async (req, res, next) => { try { const result = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id, readAt: null }, data: { readAt: new Date() } }); if (!result.count) throw { status: 404, message: 'Notificación no encontrada.' }; success(res, { id: req.params.id }) } catch (error) { next(error) } }
export const markAllRead = async (req, res, next) => { try { const result = await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } }); success(res, { count: result.count }) } catch (error) { next(error) } }
