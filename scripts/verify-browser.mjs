// Run only against the JustiTurno academic demo. Only the new UUID-tagged requirement is removed.
import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
const baseURL = process.env.DEMO_URL || 'http://127.0.0.1:8787'
const browser = await chromium.launch()
const name = 'Evidencia ' + randomUUID().slice(0,8)
const sizes = [[1440,900],[1024,768],[768,1024],[430,932],[390,844],[375,812]]
const publicRoutes = ['/','/servicios','/login','/registro']
const routes = {
  ciudadano:['','/citas/nueva','/citas','/perfil','/notificaciones'],
  funcionario:['','/citas'],
  admin:['','/usuarios','/funcionarios','/servicios','/horarios','/citas','/auditoria','/reportes']
}
const overflow = []
async function inspect(page,paths) {
  for (const path of paths) {
    await page.goto(path)
    await expect(page).toHaveURL(new URL(path,baseURL).href)
    try { await page.locator('h1:visible').first().waitFor({timeout:12000}) }
    catch { overflow.push([path,'sin título visible',await page.locator('main').innerText().catch(()=>'(sin main)')]); continue }
    console.log('Revisando',path)
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height})
      if(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth+1)) overflow.push([path,width])
    }
  }
  await page.setViewportSize({width:1440,height:900})
}
async function shot(page,activity,file) {
  const dir = 'docs/evidencias/actividad'+activity
  await mkdir(dir,{recursive:true})
  await page.screenshot({path:dir+'/'+file+'.png'})
}
try {
  for(const [role,paths] of Object.entries(routes)) {
    const context = await browser.newContext({baseURL,viewport:{width:1440,height:900}})
    const page = await context.newPage()
    if(process.env.DEMO_ROLE && process.env.DEMO_ROLE!==role) {await context.close();continue}
    if(role==='ciudadano') await inspect(page,publicRoutes)
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill(role+'@demo.com')
    await page.getByLabel('Contraseña').fill('Demo1234')
    await page.getByRole('button',{name:'Iniciar sesión'}).click()
    await expect(page).toHaveURL(new URL('/'+role,baseURL).href,{timeout:20000})
    console.log('Login correcto:',role)
    if(role==='ciudadano') {
      let resume
      const gate = new Promise(resolve=>{resume=resolve})
      const filter = '**/PublicHolidays/**'
      await page.route(filter,async route=>{await gate;await route.continue()})
      await page.reload({waitUntil:'domcontentloaded'})
      const panel = page.locator('section').filter({has:page.getByRole('heading',{name:'Próximos días festivos'})})
      await panel.getByText('Consultando información...').waitFor()
      await panel.scrollIntoViewIfNeeded()
      await shot(page,4,'01-loading')
      resume()
      await panel.locator('li').first().waitFor({timeout:30000})
      await shot(page,4,'02-success')
      await page.unroute(filter)
      await page.route(filter,r=>r.fulfill({json:[]}))
      await page.reload()
      await panel.getByText(/No hay días festivos/).waitFor()
      await panel.scrollIntoViewIfNeeded()
      await shot(page,4,'03-empty')
      await page.unroute(filter)
      await page.route(filter,r=>r.abort())
      await page.reload()
      await panel.getByRole('button',{name:'Reintentar'}).waitFor()
      await panel.scrollIntoViewIfNeeded()
      await shot(page,4,'04-error')
      await page.unroute(filter)
    }
    if(role==='admin') {
      await page.goto('/admin/servicios')
      const open = ()=>page.getByRole('button',{name:'Requisitos',exact:true}).first().click()
      await open()
      const field = page.getByLabel('Título *')
      const row = value=>page.locator('.divide-y > div').filter({has:page.getByText(value,{exact:true})})
      await shot(page,6,'01-listado')
      await field.fill(name)
      await shot(page,6,'02-formulario-crear')
      await page.getByRole('button',{name:'Agregar requisito'}).click()
      await expect(row(name)).toBeVisible()
      await page.reload(); await open()
      await expect(row(name)).toBeVisible()
      await shot(page,6,'03-creado')
      await row(name).getByLabel('Editar requisito').click()
      const edited = name+' editado'
      await field.fill(edited)
      await shot(page,6,'04-edicion')
      await page.getByRole('button',{name:'Guardar requisito'}).click()
      await expect(row(edited)).toBeVisible()
      await page.reload(); await open()
      await expect(row(edited)).toBeVisible()
      await shot(page,6,'05-editado')
      await page.getByRole('button',{name:'Agregar requisito'}).click()
      await page.getByText('El título del requisito es obligatorio.').waitFor()
      await shot(page,6,'06-validacion')
      await row(edited).getByLabel('Eliminar requisito').click()
      await expect(row(edited)).toHaveCount(0)
      await page.reload(); await open()
      await expect(row(edited)).toHaveCount(0)
      await shot(page,6,'07-eliminado')
    }
    const pathsToCheck = paths.map(path=>'/'+role+path)
    if(role!=='admin') {
      await page.goto('/'+role+'/citas')
      const r = await page.request.get('/api/v1/'+(role==='ciudadano'?'appointments/my':'employee/appointments'))
      const { data } = await r.json()
      const first = (data.items || data)[0]
      if(first) pathsToCheck.push('/'+role+'/citas/'+first.id)
    }
    await inspect(page,pathsToCheck)
    console.log('Rutas comprobadas:',pathsToCheck)
    await context.close()
  }
  if(overflow.length) throw new Error('Desbordamientos: '+JSON.stringify(overflow))
} finally { await browser.close() }
