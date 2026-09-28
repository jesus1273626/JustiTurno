const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api/v1'
export const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
export const apiRequest = async (path, options = {}) => { const response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const body = await response.json().catch(() => ({})); if (!response.ok || !body.success) throw new Error(body?.error?.message || 'No fue posible procesar la solicitud.'); return body.data }
