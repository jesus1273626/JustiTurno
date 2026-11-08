import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect } from '@playwright/test'

export function productionOrigin(value) {
  assert(value, 'Indica el origen público en DEMO_URL.')
  const url = new URL(value)
  assert(url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash &&
    !url.username && !url.password && url.hostname.includes('.') &&
    !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname),
  'DEMO_URL debe ser el origen HTTPS público del despliegue.')
  return url.origin
}

export async function verifyPublicApi(request) {
  async function json(path, status = 200) {
    const response = await request.get(path, { maxRedirects: 0 })
    assert.equal(response.status(), status, path)
    assert.match(response.headers()['content-type'] || '', /application\/json/i, path)
    return response.json()
  }
  const spec = await json('/api-docs.json')
  assert.match(spec.info.title, /JustiTurno/i)
  for (const path of ['/health', '/services']) assert(spec.paths[path]?.get)
  assert.equal((await json('/api/v1/health')).data.service, 'justiturno-api')
  const missing = await json('/api/v1/ruta-inexistente-actividad7', 404)
  assert.equal(missing.success, false)
  const paths = ['/health/db', '/health/ready', '/services']
  for (let wave = 0; wave < 3; wave++) {
    await Promise.all(paths.map(async path => {
      const { success, data } = await json('/api/v1' + path)
      assert.equal(success, true, path)
      if (path === '/services') assert(Array.isArray(data) && data.length > 0, path)
      else {
        assert.equal(data.database, 'connected', path)
        assert.equal(data.status, path.endsWith('/ready') ? 'ready' : 'ok', path)
      }
    }))
  }
}

// Hold images in memory until every check succeeds, so a failed run leaves prior evidence intact.
export function activitySeven(baseURL) {
  const captures = new Map()
  async function capture(page, name) {
    assert.equal(new URL(page.url()).origin, new URL(baseURL).origin)
    captures.set(name, {
      image: await page.screenshot(),
      file: name + '.png',
      url: page.url(),
      viewport: page.viewportSize()
    })
  }

  async function publicPages(page) {
    await verifyPublicApi(page.request)
    await page.goto('/')
    await expect(page.locator('h1:visible').first()).toBeVisible()
    await capture(page, '01-home-produccion')
    await page.setViewportSize({ width: 390, height: 844 })
    await capture(page, '09-mobile-390')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/api/v1/health/ready')
    await expect(page.locator('body')).toContainText('connected')
    await capture(page, '10-health-ready')
    await page.goto('/api-docs')
    await expect(page.locator('.swagger-ui .info .title')).toContainText(/JustiTurno/i)
    for (const path of ['/health', '/services']) {
      const block = page.locator('.opblock-get').filter({
        has: page.locator('.opblock-summary-path[data-path="' + path + '"]')
      })
      const summary = block.locator('.opblock-summary-control')
      await summary.click()
      await block.getByRole('button', { name: 'Try it out' }).click()
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url() === new URL('/api/v1' + path, baseURL).href),
        block.getByRole('button', { name: 'Execute', exact: true }).click()
      ])
      assert.equal(response.status(), 200, 'Swagger ' + path)
      await expect(block.locator('.live-responses-table tbody .response-col_status')).toHaveText('200')
      if (path === '/health') {
        await block.locator('.live-responses-table').scrollIntoViewIfNeeded()
        await capture(page, '02-swagger-produccion')
      }
      await summary.click()
    }
  }

  async function rolePages(page, role) {
    await expect(page.locator('h1:visible').first()).toBeVisible()
    await capture(page, { ciudadano: '03-ciudadano', funcionario: '05-funcionario', admin: '06-admin' }[role])
    if (role === 'ciudadano') {
      await page.goto('/ciudadano/citas/nueva')
      await expect(page.getByRole('heading', { name: 'Solicitar cita' })).toBeVisible()
      await expect.poll(() => page.locator('select option').count()).toBeGreaterThan(1)
      await capture(page, '04-nueva-cita')
      await page.goto('/ciudadano')
    }
    if (role === 'admin') {
      await page.goto('/admin/reportes')
      await expect(page.getByRole('heading', { name: 'Resumen por estado' })).toBeVisible()
      const [download, response] = await Promise.all([
        page.waitForEvent('download'),
        page.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/admin/reports/appointments.csv'),
        page.getByRole('button', { name: 'Exportar CSV' }).click()
      ])
      assert.equal(await download.failure(), null)
      assert.match(download.suggestedFilename(), /\.csv$/i)
      assert.equal(response.status(), 200)
      assert.match(response.headers()['content-type'], /text\/csv;\s*charset=utf-8/i)
      const csv = new TextDecoder('utf-8', { fatal: true }).decode(await readFile(await download.path()))
      assert(csv.startsWith('"Código","Ciudadano","Servicio","Fecha","Hora","Estado","Funcionario","Fecha creación"'))
      await capture(page, '08-reportes')
    }
  }
  async function save(directory) {
    assert.equal(captures.size, 10)
    await mkdir(directory, { recursive: true })
    const files = []
    for (const { image, ...info } of [...captures.values()].sort((a, b) => a.file.localeCompare(b.file))) {
      await writeFile(join(directory, info.file), image)
      files.push(info)
    }
    await writeFile(join(directory, 'manifest.json'), JSON.stringify({
      origin: new URL(baseURL).origin, verifiedAt: new Date().toISOString(), files
    }, null, 2) + '\n')
  }
  return { capture, publicPages, rolePages, save }
}
