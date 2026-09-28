import { seedAppointments } from '../data/mock/appointments'
import { services as defaultServices } from '../data/mock/services'
const keys = { appointments: 'jt_appointments', services: 'jt_services', users: 'jt_users', schedules: 'jt_schedules' }
const clone = (value) => JSON.parse(JSON.stringify(value))
export const getStored = (key, fallback) => { const data = localStorage.getItem(key); if (!data) { localStorage.setItem(key, JSON.stringify(fallback)); return clone(fallback) } try { return JSON.parse(data) } catch { return clone(fallback) } }
export const setStored = (key, value) => localStorage.setItem(key, JSON.stringify(value))
export const getAppointments = () => getStored(keys.appointments, seedAppointments)
export const saveAppointments = (items) => setStored(keys.appointments, items)
export const getServices = () => getStored(keys.services, defaultServices.map((service) => ({ id: service.id, name: service.name, category: service.category, description: service.description, requirements: service.requirements, schedule: service.schedule, active: service.active })))
export const saveServices = (items) => setStored(keys.services, items)
export const getSchedules = () => getStored(keys.schedules, getServices().flatMap((service) => [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [{ id: `${service.id}-${dayOfWeek}-morning`, serviceId: service.id, service, dayOfWeek, startTime: '08:00', endTime: '12:00', slotDuration: 60, capacity: 2, active: true }, { id: `${service.id}-${dayOfWeek}-afternoon`, serviceId: service.id, service, dayOfWeek, startTime: '14:00', endTime: '16:00', slotDuration: 60, capacity: 2, active: true }])))
export const saveSchedules = (items) => setStored(keys.schedules, items)
