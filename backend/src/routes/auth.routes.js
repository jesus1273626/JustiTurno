import { Router } from 'express'
import { login, logout, logoutAll, me, register } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { loginSchema, registerSchema } from '../validators/auth.validator.js'
const router = Router()
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/logout', logout)
router.post('/logout-all', authenticate, logoutAll)
router.get('/me', authenticate, me)
export default router