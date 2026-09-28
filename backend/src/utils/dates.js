import { DateTime } from 'luxon'
import { env } from '../config/env.js'
export const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value, { zone: env.timezone }).isValid
export const localDateTime = (date, time) => DateTime.fromISO(`${date}T${time}`, { zone: env.timezone })
export const toUtcDate = (date, time) => { const value = localDateTime(date, time); if (!value.isValid) throw { status: 400, message: 'Fecha u horario inválido.' }; return value.toUTC().toJSDate() }
export const localDay = (date) => DateTime.fromISO(date, { zone: env.timezone }).weekday % 7
export const isPastDate = (date) => DateTime.fromISO(date, { zone: env.timezone }).startOf('day') < DateTime.now().setZone(env.timezone).startOf('day')
export const dateRangeUtc = (date) => { const start = DateTime.fromISO(date, { zone: env.timezone }).startOf('day'); return { start: start.toUTC().toJSDate(), end: start.plus({ days: 1 }).toUTC().toJSDate() } }
export const localTime = (date) => DateTime.fromJSDate(date, { zone: 'utc' }).setZone(env.timezone).toFormat('HH:mm')
export const localDate = (date) => DateTime.fromJSDate(date, { zone: 'utc' }).setZone(env.timezone).toISODate()
