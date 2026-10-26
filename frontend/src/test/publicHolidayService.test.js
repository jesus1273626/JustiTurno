import { describe, expect, it, vi } from 'vitest'
import { listPublicHolidays } from '../services/publicHolidayService'

describe('publicHolidayService', () => {
  it('normaliza la respuesta pública de Nager.Date', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ date: '2026-01-01', localName: 'Año Nuevo', name: 'New Year', global: true }] })
    await expect(listPublicHolidays({ year: 2026, fetchImpl })).resolves.toEqual([{ date: '2026-01-01', name: 'Año Nuevo', global: true }])
  })
  it('expone un error controlado si la API responde mal', async () => {
    await expect(listPublicHolidays({ fetchImpl: vi.fn().mockResolvedValue({ ok: false }) })).rejects.toThrow('fuente pública')
  })
})
