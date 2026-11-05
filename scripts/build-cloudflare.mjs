import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const npm = (...args) => execFileSync(process.execPath,[process.env.npm_execpath,...args],{stdio:'inherit',env:{...process.env,VITE_USE_MOCKS:'false',VITE_API_URL:'/api/v1'}})
npm('run','prisma:generate')
npm('run','build')
const dir = 'frontend/dist/swagger'
await mkdir(dir,{recursive:true})
for (const file of ['swagger-ui.css','swagger-ui-bundle.js']) await copyFile(require.resolve('swagger-ui-dist/'+file),dir+'/'+file)
await writeFile(dir+'/index.html','<!doctype html><html lang="es"><meta charset="utf-8"><title>JustiTurno API</title><link rel="stylesheet" href="/swagger/swagger-ui.css"><div id="swagger-ui"></div><script src="/swagger/swagger-ui-bundle.js"></script><script src="/swagger/init.js"></script></html>')
await writeFile(dir+'/init.js',"SwaggerUIBundle({url:'/api-docs.json',dom_id:'#swagger-ui',withCredentials:true})")
