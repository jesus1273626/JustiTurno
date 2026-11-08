import express from 'express'
import helmet from 'helmet'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { access } from 'node:fs/promises'
import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'

const production = env.nodeEnv === 'production'
const host = production ? '0.0.0.0' : '127.0.0.1'
const site = express()
site.disable('x-powered-by')
if (process.env.RENDER === 'true') app.set('trust proxy', 1)

if (production) {
  if (!process.env.DATABASE_URL || (process.env.JWT_SECRET || '').length < 32) {
    throw new Error('Configura DATABASE_URL y JWT_SECRET antes de iniciar JustiTurno.')
  }
  const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url))
  const index = path.join(dist, 'index.html')
  await access(index)
  site.use(helmet({
    contentSecurityPolicy: {
      directives: { connectSrc: ["'self'", 'https://date.nager.at'] }
    }
  }))
  site.use(express.static(dist, { index: false }))
  site.get(/^(?!\/api(?:\/|$)|\/api-docs(?:[/.]|$)).*$/, (req, res, next) => {
    if (path.extname(req.path) || !req.accepts('html')) return next()
    res.sendFile(index)
  })
}
site.use(app)
const server = site.listen(env.port, host, () => console.log(`JustiTurno en http://${host}:${env.port}`))
const stop = () => server.close(async () => {
  await prisma.$disconnect()
  process.exit(0)
})
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
