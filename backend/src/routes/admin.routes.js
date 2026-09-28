import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { adminAppointments, adminDashboard, adminSchedules, adminServices, adminUsers, createSchedule, createService, setScheduleStatus, setServiceStatus, updateSchedule, updateService } from '../controllers/admin.controller.js'
import { scheduleSchema, scheduleUpdateSchema, serviceSchema } from '../validators/admin.validator.js'
const router = Router()
const activeSchema = z.object({ active: z.boolean() })
router.use(authenticate, authorize('ADMIN'))
router.get('/dashboard', adminDashboard)
router.get('/appointments', adminAppointments)
router.get('/users', adminUsers)
router.get('/schedules', adminSchedules)
router.post('/schedules', validate(scheduleSchema), createSchedule)
router.patch('/schedules/:id', validate(scheduleUpdateSchema), updateSchedule)
router.patch('/schedules/:id/status', validate(activeSchema), setScheduleStatus)
router.get('/services', adminServices)
router.post('/services', validate(serviceSchema), createService)
router.patch('/services/:id', validate(serviceSchema.partial()), updateService)
router.patch('/services/:id/status', validate(activeSchema), setServiceStatus)
export default router
