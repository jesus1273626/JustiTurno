import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('Documentación OpenAPI', () => {
  it('expone el contrato OpenAPI de JustiTurno', async () => {
    const response = await request(app).get('/api-docs.json')
    expect(response.status).toBe(200)
    expect(response.body.openapi).toMatch(/^3\./)
    expect(response.body.info).toMatchObject({ title: 'JustiTurno API', version: '1.0.0' })
    expect(response.body.paths).toHaveProperty('/health')
    expect(response.body.paths).toHaveProperty('/services')
    expect(response.body.paths).toHaveProperty('/appointments')
    expect(response.body.paths['/employee/dashboard'].get.tags).toEqual(['Funcionario'])
    expect(response.body.paths['/admin/dashboard'].get.tags).toEqual(['Admin'])
    expect(response.body.paths['/notifications'].get.tags).toEqual(['Notificaciones'])
  })

  it('sirve la interfaz Swagger UI', async () => {
    const response = await request(app).get('/api-docs/')
    expect(response.status).toBe(200)
    expect(response.text).toContain('swagger-ui')
  })
})
