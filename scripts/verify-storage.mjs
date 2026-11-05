import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
const base = (process.env.DEMO_URL || 'http://127.0.0.1:8787')+'/api/v1'
async function login() {
  const r=await fetch(base+'/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'ciudadano@demo.com',password:'Demo1234'})})
  assert.equal(r.status,200)
  return {cookie:r.headers.get('set-cookie').split(';')[0]}
}
const headers=await login()
const {data}=await (await fetch(base+'/appointments/my',{headers})).json()
const appointment=(data.items || data).find(a=>a.code==='JT-000001')
assert.ok(appointment,'Se necesita la cita demo JT-000001')
const collection=base+'/appointments/'+appointment.id+'/attachments'
const browser=await chromium.launch()
let pdf
try {
  const page=await browser.newPage()
  await page.setContent('<h1>JustiTurno</h1><p>Prueba académica de adjuntos.</p>')
  pdf=await page.pdf()
} finally {await browser.close()}
const form=new FormData()
form.set('file',new Blob([pdf],{type:'application/pdf'}),'prueba-academica.pdf')
const upload=await fetch(collection,{method:'POST',headers,body:form})
assert.equal(upload.status,201)
const url=collection+'/'+(await upload.json()).data.id
try {
  const logout=await fetch(base+'/auth/logout',{method:'POST',headers})
  assert.equal(logout.status,200)
  assert.equal((await fetch(url+'/download',{headers})).status,401)
  Object.assign(headers,await login())
  const download=await fetch(url+'/download',{headers})
  assert.equal(download.status,200)
  assert.deepEqual(Buffer.from(await download.arrayBuffer()),pdf)
} finally {
  assert.equal((await fetch(url,{method:'DELETE',headers})).status,200)
}
assert.equal((await fetch(url+'/download',{headers})).status,404)
console.log('PDF: upload 201; sesión revocada 401; nueva sesión descarga bytes idénticos; delete 200 y lectura posterior 404.')
