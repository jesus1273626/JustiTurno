import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
const server = app.listen(env.port, '127.0.0.1', () => console.log(`JustiTurno API en http://127.0.0.1:${env.port}`))
const stop = async () => { await prisma.$disconnect(); server.close(() => process.exit(0)) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
