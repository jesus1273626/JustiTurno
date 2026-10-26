import crypto from 'crypto'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env.js'
import { openapiSpec } from './docs/openapi.js'
import authRoutes from './routes/auth.routes.js'
import healthRoutes from './routes/health.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import serviceRoutes from './routes/service.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import employeeRoutes from './routes/employee.routes.js'
import adminRoutes from './routes/admin.routes.js'
import profileRoutes from './routes/profile.routes.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'

export const createApp = () => {
  const app = express()
  app.disable('x-powered-by')
  app.use((req, res, next) => { req.requestId = crypto.randomUUID(); res.setHeader('X-Request-Id', req.requestId); next() })
  app.use(helmet())
  app.use(cors({ origin: env.frontendUrl, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.get('/api-docs.json', (_req, res) => res.json(openapiSpec))
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { swaggerOptions: { withCredentials: true, persistAuthorization: true } }))
  if (env.nodeEnv !== 'test') app.use(morgan(':method :url :status :response-time ms id=:req[x-request-id]'))
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: { message: 'Demasiados intentos. Intenta de nuevo más tarde.' } } })
  app.use('/api/v1/auth/login', authLimiter)
  app.use('/api/v1/auth/register', authLimiter)
  app.use('/api/v1/health', healthRoutes)
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/profile', profileRoutes)
  app.use('/api/v1/notifications', notificationRoutes)
  app.use('/api/v1/services', serviceRoutes)
  app.use('/api/v1/appointments', appointmentRoutes)
  app.use('/api/v1/employee', employeeRoutes)
  app.use('/api/v1/admin', adminRoutes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}
export const app = createApp()
