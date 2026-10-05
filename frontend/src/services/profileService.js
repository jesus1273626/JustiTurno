import { apiRequest, useMocks } from './apiClient'

const mockUser = () => { try { const stored = JSON.parse(localStorage.getItem('jt_session')); if (!stored) return null; return { id: stored.id, firstName: stored.firstName || stored.name?.split(' ')[0] || '', lastName: stored.lastName || stored.name?.split(' ').slice(1).join(' ') || '', document: stored.document || '', phone: stored.phone || '', email: stored.email || '', role: stored.role || 'CITIZEN', active: true, createdAt: stored.createdAt || new Date().toISOString() } } catch { return null } }
const mockSessions = () => [{ id: 'sesion-demo', createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), userAgent: 'Navegador de demostración', current: true, active: true }]

export const profileService = {
  getProfile: async () => useMocks ? mockUser() : (await apiRequest('/profile')).user,
  updateProfile: async (data) => useMocks ? { ...mockUser(), ...data } : (await apiRequest('/profile', { method: 'PATCH', body: JSON.stringify(data) })).user,
  changePassword: async (data) => { if (useMocks) return { message: 'Contraseña actualizada.' }; await apiRequest('/profile/password', { method: 'PATCH', body: JSON.stringify(data) }); return { message: 'Contraseña actualizada.' } },
  getSessions: async () => useMocks ? mockSessions() : (await apiRequest('/profile/sessions')).sessions,
  logoutAll: async () => { if (useMocks) return { message: 'Sesiones cerradas.' }; await apiRequest('/auth/logout-all', { method: 'POST' }); return { message: 'Sesiones cerradas.' } }
}