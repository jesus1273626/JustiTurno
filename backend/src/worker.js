import { httpServerHandler } from 'cloudflare:node'
import { app } from './app.js'

app.listen(8080)
const handler = httpServerHandler({ port: 8080 })
export default {
  async fetch(request, bindings, ctx) {
    const {pathname, origin} = new URL(request.url)
    if (pathname === '/api-docs' || pathname === '/api-docs/') return bindings.ASSETS.fetch(new URL('/swagger/', origin))
    if (pathname.startsWith('/api/') || pathname === '/api-docs.json') {
      if (!bindings.HYPERDRIVE || !bindings.JWT_SECRET || bindings.JWT_SECRET.length < 32) {
        return Response.json({success:false,error:{message:'Configuración incompleta.'}},{status:503})
      }
      return handler.fetch(request, bindings, ctx)
    }
    return bindings.ASSETS.fetch(request)
  }
}
