import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate, validateQuery } from '../middlewares/validate.js'
import { createAppointment, myAppointments, appointmentDetail, cancelAppointment } from '../controllers/appointment.controller.js'
import { appointmentFiltersSchema, createAppointmentSchema } from '../validators/appointment.validator.js'
import { appointmentUpload } from '../middlewares/upload.js'
import { deleteAttachment, downloadAttachment, listAttachments, uploadAttachment } from '../controllers/attachment.controller.js'
const router = Router()
router.use(authenticate)
router.post('/', authorize('CITIZEN'), validate(createAppointmentSchema), createAppointment)
router.get('/my', authorize('CITIZEN'), validateQuery(appointmentFiltersSchema), myAppointments)
router.patch('/:id/cancel', authorize('CITIZEN'), cancelAppointment)
router.get('/:id/attachments', listAttachments)
router.post('/:id/attachments', appointmentUpload.single('file'), uploadAttachment)
router.delete('/:id/attachments/:attachmentId', deleteAttachment)
router.get('/:id/attachments/:attachmentId/download', downloadAttachment)
router.get('/:id', appointmentDetail)
export default router
