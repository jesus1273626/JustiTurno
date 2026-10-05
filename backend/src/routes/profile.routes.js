import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { changePassword, getProfile, getSessions, updateProfile } from '../controllers/profile.controller.js'
import { changePasswordSchema, updateProfileSchema } from '../validators/profile.validator.js'
const router = Router()
router.use(authenticate)
router.get('/', getProfile)
router.patch('/', validate(updateProfileSchema), updateProfile)
router.patch('/password', validate(changePasswordSchema), changePassword)
router.get('/sessions', getSessions)
export default router