// Run only against the JustiTurno academic demo. Only the new UUID-tagged requirement is removed.
import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { activitySeven, productionOrigin } from './production-evidence.mjs'
const production = process.argv.includes('--production')
const preview = process.argv.includes('--preview-evidence')
const baseURL = production ? productionOrigin(process.env.DEMO_URL) : process.env.DEMO_URL || 'http://127.0.0.1:8787'
const evidence = production || preview ? activitySeven(baseURL) : null
if (evidence && process.env.DEMO_ROLE) throw new Error('La validación de la Actividad 7 requiere los tres roles. Quita DEMO_ROLE.')
const browser = await chromium.launch()
const name = (production ? 'Requisito temporal producción ' : 'Evidencia ') + randomUUID().slice(0,8)
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
  if (evidence) return
  const dir = 'docs/evidencias/actividad'+activity
  await mkdir(dir,{recursive:true})
  await page.screenshot({path:dir+'/'+file+'.png'})
}
try {
  for(const [role,paths] of Object.entries(routes)) {
    const context = await browser.newContext({baseURL,viewport:{width:1440,height:900}})
    const page = await context.newPage()
    if(process.env.DEMO_ROLE && process.env.DEMO_ROLE!==role) {await context.close();continue}
    if(role==='ciudadano') {
      if (evidence) await evidence.publicPages(page)
      await inspect(page,publicRoutes)
    }
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill(process.env['DEMO_EMAIL_' + role.toUpperCase()] || role+'@demo.com')
    await page.getByLabel('Contraseña').fill(process.env['DEMO_PASSWORD_' + role.toUpperCase()] || 'Demo1234')
    await page.getByRole('button',{name:'Iniciar sesión'}).click()
    await expect(page).toHaveURL(new URL('/'+role,baseURL).href,{timeout:20000})
    console.log('Login correcto:',role)
    if (evidence) await evidence.rolePages(page,role)
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
      let ownedId
      try {
        const [created] = await Promise.all([
          page.waitForResponse(response => response.request().method() === 'POST' &&
            /^\/api\/v1\/admin\/services\/[^/]+\/requirements$/.test(new URL(response.url()).pathname)),
          page.getByRole('button',{name:'Agregar requisito'}).click()
        ])
        expect(created.status()).toBe(201)
        const requirement = (await created.json()).data.requirement
        expect(requirement.title).toBe(name)
        ownedId = requirement.id
        await expect(row(name)).toBeVisible()
        await page.reload(); await open()
        await expect(row(name)).toBeVisible()
        await shot(page,6,'03-creado')
        if (evidence) await evidence.capture(page,'07-crud-produccion')
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
        ownedId = undefined
        await shot(page,6,'07-eliminado')
      } finally {
        if (ownedId) {
          const cleanup = await page.request.delete('/api/v1/admin/requirements/' + encodeURIComponent(ownedId))
          if (![200,404].includes(cleanup.status())) throw new Error('No se pudo limpiar el requisito temporal ' + name)
        }
      }
    }
    const pathsToCheck = paths.map(path=>'/'+role+path)
    if(role!=='admin') {
      await page.goto('/'+role+'/citas')
      const r = await page.request.get('/api/v1/'+(role==='ciudadano'?'appointments/my':'employee/appointments'))
      const { data } = await r.json()
      const first = (data.items || data)[0]
      if(first) pathsToCheck.push('/'+role+'/citas/'+first.id)
      else if (evidence) throw new Error('Falta una cita de demostración para verificar el detalle de '+role+'.')
    }
    await inspect(page,pathsToCheck)
    console.log('Rutas comprobadas:',pathsToCheck)
    await context.close()
  }
  if(overflow.length) throw new Error('Desbordamientos: '+JSON.stringify(overflow))
  if (production) await evidence.save('docs/evidencias/actividad7')
} finally { await browser.close() }
