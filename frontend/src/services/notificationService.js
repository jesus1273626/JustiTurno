import { apiRequest, useMocks } from './apiClient'
import { getNotifications, saveNotifications } from './mockStore'
const page = (items, filters) => { const visible = filters.unread === 'true' ? items.filter((item) => !item.readAt) : items; return { items: visible.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), pagination: { page: 1, limit: 20, total: visible.length, totalPages: 1 } } }
export const notificationService = {
  list: async (filters = {}) => useMocks ? page(getNotifications(), filters) : apiRequest(`/notifications${new URLSearchParams(filters).toString() ? `?${new URLSearchParams(filters)}` : ''}`),
  unreadCount: async () => useMocks ? getNotifications().filter((item) => !item.readAt).length : (await apiRequest('/notifications/unread-count')).count,
  markRead: async (id) => { if (!useMocks) return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }); const items = getNotifications().map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item); saveNotifications(items); return { id } },
  markAllRead: async () => { if (!useMocks) return apiRequest('/notifications/read-all', { method: 'PATCH' }); const items = getNotifications().map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })); saveNotifications(items); return { count: items.length } }
}
