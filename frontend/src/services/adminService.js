import { apiRequest, useMocks } from './apiClient'
import { appointmentService } from './appointmentService'
import { getSchedules, getServices, saveSchedules, saveServices } from './mockStore'
import { demoUsers } from '../data/mock/users'

const labels = { PENDING: 'PENDIENTE', ACCEPTED: 'ACEPTADA', REJECTED: 'RECHAZADA', RESCHEDULED: 'REPROGRAMADA', ATTENDED: 'ATENDIDA', FINALIZED: 'FINALIZADA', CANCELED: 'CANCELADA' }
const mapAppointment = (item) => ({ ...item, code: item.code || item.id, status: labels[item.status] || item.status, service: item.service?.name || item.service, citizen: item.citizen ? `${item.citizen.firstName} ${item.citizen.lastName}` : item.citizen, document: item.citizen?.document || item.document })
const slugify = (name) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const adminService = {
  appointments: async (filters = {}) => { if (useMocks) return appointmentService.list(); const query = new URLSearchParams(filters).toString(); const result = await apiRequest(`/admin/appointments${query ? `?${query}` : ''}`); return result.items.map(mapAppointment) },
  dashboard: async () => { if (useMocks) { const items = appointmentService.list(); return { totalUsers: 128, activeServices: getServices().filter((item) => item.active).length, pendingAppointments: items.filter((item) => item.status === 'PENDIENTE').length, appointmentsThisMonth: items.length, recentAppointments: items } }; const result = await apiRequest('/admin/dashboard'); return { ...result, recentAppointments: result.recentAppointments.map(mapAppointment) } },
  users: async (filters = {}) => { if (useMocks) { const items = demoUsers.map((user) => ({ ...user, firstName: user.name?.split(' ')[0] || '', lastName: user.name?.split(' ').slice(1).join(' ') || '', active: true })).filter((user) => (!filters.role || user.role === filters.role) && (!filters.search || `${user.name} ${user.email}`.toLowerCase().includes(filters.search.toLowerCase()))); return { items } }; const query = new URLSearchParams(filters).toString(); return apiRequest(`/admin/users${query ? `?${query}` : ''}`) },
  services: async () => useMocks ? getServices() : apiRequest('/admin/services'),
  createService: async (data) => { if (!useMocks) return apiRequest('/admin/services', { method: 'POST', body: JSON.stringify(data) }); const item = { ...data, id: slugify(data.name), slug: data.slug || slugify(data.name), active: true, requirements: [] }; const items = getServices(); saveServices([...items, item]); return item },
  updateService: async (id, data) => { if (!useMocks) return apiRequest(`/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); const items = getServices().map((item) => item.id === id ? { ...item, ...data } : item); saveServices(items); return items.find((item) => item.id === id) },
  setServiceStatus: async (id, active) => { if (!useMocks) return apiRequest(`/admin/services/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }); return adminService.updateService(id, { active }) },
  schedules: async () => useMocks ? getSchedules() : apiRequest('/admin/schedules'),
  createSchedule: async (data) => { if (!useMocks) return apiRequest('/admin/schedules', { method: 'POST', body: JSON.stringify(data) }); const service = getServices().find((item) => item.id === data.serviceId); const item = { ...data, id: `schedule-${Date.now()}`, service, active: true }; const items = getSchedules(); saveSchedules([...items, item]); return item },
  updateSchedule: async (id, data) => { if (!useMocks) return apiRequest(`/admin/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); const items = getSchedules().map((item) => item.id === id ? { ...item, ...data } : item); saveSchedules(items); return items.find((item) => item.id === id) },
  setScheduleStatus: async (id, active) => { if (!useMocks) return apiRequest(`/admin/schedules/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }); return adminService.updateSchedule(id, { active }) }
}
