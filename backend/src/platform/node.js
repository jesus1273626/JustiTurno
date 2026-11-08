import { PrismaClient } from '@prisma/client'
import swaggerUi from 'swagger-ui-express'
export { default as limitAuth } from 'express-rate-limit'
import { openapiSpec } from '../docs/openapi.js'
export const prisma = new PrismaClient()
export const configure = app => app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {swaggerOptions:{withCredentials:true}}))
