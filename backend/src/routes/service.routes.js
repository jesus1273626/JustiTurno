import { Router } from 'express'
import { getService, listServices } from '../controllers/service.controller.js'
import { availability } from '../controllers/appointment.controller.js'
import { validateQuery } from '../middlewares/validate.js'
import { availabilitySchema } from '../validators/appointment.validator.js'
const router = Router()
router.get('/', listServices)
router.get('/:slug/availability', validateQuery(availabilitySchema), availability)
router.get('/:slug', getService)
export default router
