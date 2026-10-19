import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import { listNotifications, markAllRead, markRead, unreadCount } from '../controllers/notification.controller.js'
const router = Router()
router.use(authenticate)
router.get('/', listNotifications)
router.get('/unread-count', unreadCount)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markRead)
export default router
