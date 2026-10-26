const defaultBaseUrl = 'https://date.nager.at/api/v3/PublicHolidays'

const getBaseUrl = () => (import.meta.env.VITE_PUBLIC_HOLIDAYS_API_URL || defaultBaseUrl).replace(/\/$/, '')

export const listPublicHolidays = async ({ year = new Date().getFullYear(), countryCode = 'CO', fetchImpl = fetch } = {}) => {
  const response = await fetchImpl(`${getBaseUrl()}/${year}/${countryCode}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('La fuente pública de festivos no está disponible.')
  const holidays = await response.json()
  if (!Array.isArray(holidays)) throw new Error('La fuente pública devolvió un formato no esperado.')
  return holidays.map((holiday) => ({ date: holiday.date, name: holiday.localName || holiday.name, global: Boolean(holiday.global) }))
}
