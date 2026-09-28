import { demoUsers } from '../data/mock/users'
import { apiRequest, useMocks } from './apiClient'
const key = 'jt_session'
export const mockAuthService = {
  current: () => { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } },
  login: async (email, password) => { const user = demoUsers.find((item) => item.email === email && item.password === password); if (!user) throw new Error('Correo o contraseña de demostración incorrectos.'); const session = { ...user }; localStorage.setItem(key, JSON.stringify(session)); return session },
  logout: () => localStorage.removeItem(key),
  updateProfile: (data) => { const user = { ...mockAuthService.current(), ...data }; localStorage.setItem(key, JSON.stringify(user)); return user },
  register: async (data) => ({ ...data, id: `citizen-${Date.now()}`, role: 'CITIZEN', name: `${data.firstName} ${data.lastName}` })
}
export const authService = {
  current: async () => useMocks ? mockAuthService.current() : (await apiRequest('/auth/me')).user,
  login: async (email, password) => useMocks ? mockAuthService.login(email, password) : (await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })).user,
  logout: async () => { if (useMocks) return mockAuthService.logout(); await apiRequest('/auth/logout', { method: 'POST' }) },
  register: async (data) => useMocks ? mockAuthService.register(data) : (await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) })).user,
  updateProfile: (data) => mockAuthService.updateProfile(data)
}
