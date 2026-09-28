import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate, validateQuery } from '../middlewares/validate.js'
import { employeeAppointments, acceptAppointment, rejectAppointment, rescheduleAppointment, addObservation, attendAppointment, finalizeAppointment } from '../controllers/appointment.controller.js'
import { appointmentFiltersSchema, observationSchema, rejectSchema, rescheduleSchema } from '../validators/appointment.validator.js'
const router = Router()
router.use(authenticate, authorize('EMPLOYEE', 'ADMIN'))
router.get('/appointments', validateQuery(appointmentFiltersSchema), employeeAppointments)
router.patch('/appointments/:id/accept', acceptAppointment)
router.patch('/appointments/:id/reject', validate(rejectSchema), rejectAppointment)
router.patch('/appointments/:id/reschedule', validate(rescheduleSchema), rescheduleAppointment)
router.post('/appointments/:id/observations', validate(observationSchema), addObservation)
router.patch('/appointments/:id/attend', attendAppointment)
router.patch('/appointments/:id/finalize', finalizeAppointment)
export default router
