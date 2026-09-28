import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate, validateQuery } from '../middlewares/validate.js'
import { createAppointment, myAppointments, appointmentDetail, cancelAppointment } from '../controllers/appointment.controller.js'
import { appointmentFiltersSchema, createAppointmentSchema } from '../validators/appointment.validator.js'
const router = Router()
router.use(authenticate)
router.post('/', authorize('CITIZEN'), validate(createAppointmentSchema), createAppointment)
router.get('/my', authorize('CITIZEN'), validateQuery(appointmentFiltersSchema), myAppointments)
router.patch('/:id/cancel', authorize('CITIZEN'), cancelAppointment)
router.get('/:id', appointmentDetail)
export default router
