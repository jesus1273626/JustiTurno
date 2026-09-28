import { getAppointments, saveAppointments } from './mockStore'
import { apiRequest, useMocks } from './apiClient'

const statusLabels = { PENDING: 'PENDIENTE', ACCEPTED: 'ACEPTADA', REJECTED: 'RECHAZADA', RESCHEDULED: 'REPROGRAMADA', ATTENDED: 'ATENDIDA', FINALIZED: 'FINALIZADA', CANCELED: 'CANCELADA' }
const mapAppointment = (item) => ({ ...item, code: item.code || item.id, status: statusLabels[item.status] || item.status, service: item.service?.name || item.service || '', citizen: item.citizen ? `${item.citizen.firstName} ${item.citizen.lastName}` : item.citizen, document: item.citizen?.document || item.document, observations: Array.isArray(item.observations) ? item.observations : item.observations || [], history: item.statusHistory || item.history || [] })
const updateMock = (id, changes) => { const items = getAppointments(); const index = items.findIndex((item) => item.id === id); if (index < 0) throw new Error('Solicitud no encontrada.'); items[index] = { ...items[index], ...changes }; saveAppointments(items); return items[index] }

export const appointmentService = {
  list: () => getAppointments(),
  byId: (id) => getAppointments().find((item) => item.id === id),
  create: (data, user) => { const items = getAppointments(); const appointment = { ...data, id: `JT-${String(items.length + 1).padStart(4, '0')}`, citizenId: user.id, citizen: user.name, document: user.document || '1.***.000', status: 'PENDIENTE', observations: data.observations || '', createdAt: new Date().toISOString().slice(0, 10) }; saveAppointments([appointment, ...items]); return appointment },
  update: updateMock,
  listMine: async (filters = {}) => { if (useMocks) return getAppointments().filter((item) => item.citizenId === filters.citizenId); const query = new URLSearchParams(filters).toString(); const data = await apiRequest(`/appointments/my${query ? `?${query}` : ''}`); return (Array.isArray(data) ? data : data.items).map(mapAppointment) },
  byIdAsync: async (id) => useMocks ? getAppointments().find((item) => item.id === id) : mapAppointment(await apiRequest(`/appointments/${id}`)),
  createAsync: async (data, user) => useMocks ? appointmentService.create(data, user) : mapAppointment(await apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) })),
  availability: async (slug, date) => { if (useMocks) return ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'].map((time) => ({ time, available: true, remaining: 2, capacity: 2 })); const data = await apiRequest(`/services/${slug}/availability?date=${encodeURIComponent(date)}`); return data.slots || data },
  cancel: async (id) => useMocks ? updateMock(id, { status: 'CANCELADA' }) : mapAppointment(await apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH' })),
  employeeList: async (filters = {}) => { if (useMocks) return getAppointments(); const query = new URLSearchParams(filters).toString(); const data = await apiRequest(`/employee/appointments${query ? `?${query}` : ''}`); return data.items.map(mapAppointment) },
  employeeAction: async (id, action, data = {}) => { if (useMocks) { const statuses = { accept: 'ACEPTADA', reject: 'RECHAZADA', reschedule: 'REPROGRAMADA', attend: 'ATENDIDA', finalize: 'FINALIZADA' }; return updateMock(id, { ...data, ...(statuses[action] ? { status: statuses[action] } : {}) }) }; return mapAppointment(await apiRequest(`/employee/appointments/${id}/${action}`, { method: 'PATCH', body: JSON.stringify(data) })) },
  addObservation: async (id, message, visibleToCitizen = true) => useMocks ? updateMock(id, { observations: message }) : mapAppointment(await apiRequest(`/employee/appointments/${id}/observations`, { method: 'POST', body: JSON.stringify({ message, visibleToCitizen }) }))
}
