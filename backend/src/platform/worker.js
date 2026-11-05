import { AsyncLocalStorage } from 'node:async_hooks'
import { env, waitUntil } from 'cloudflare:workers'
import { PrismaClient } from '../../prisma/generated/worker/wasm.js'
import { PrismaPg } from '@prisma/adapter-pg'

const scope = new AsyncLocalStorage()
export const bucket = env.ATTACHMENTS
export const limitAuth = () => async (req,res,next) => {
  const result = await env.AUTH_LIMITER.limit({key:req.get('cf-connecting-ip') || 'local'})
  if (!result.success) return res.status(429).json({success:false,error:{message:'Demasiados intentos. Intenta más tarde.'}})
  next()
}
export const prisma = new Proxy({}, { get(_target, name) {
  const client = scope.getStore()
  const member = client[name]
  return typeof member === 'function' ? member.bind(client) : member
} })
export function configure(app) {
  app.use((_req, res, next) => {
    const client = new PrismaClient({adapter:new PrismaPg({connectionString:env.HYPERDRIVE.connectionString, max:1, connectionTimeoutMillis:5000})})
    let closing = false
    const release = () => { if (!closing) { closing=true; waitUntil(client.$disconnect()) } }
    res.once('finish',release)
    res.once('close',release)
    scope.run(client, next)
  })
}
