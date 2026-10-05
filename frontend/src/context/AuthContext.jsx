import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'
import { onUnauthorized } from '../services/apiClient'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(() => { onUnauthorized((message) => { if (message === 'Tu cuenta no se encuentra activa.') toast.error(message); else if (message === 'Sesión no válida o expirada.') toast.error('Tu sesión expiró o fue cerrada. Inicia sesión de nuevo.'); setUser(null) }); authService.current().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const login = async (email, password) => { const logged = await authService.login(email, password); setUser(logged); return logged }
  const logout = async () => { await authService.logout(); setUser(null) }
  const updateUser = async (data) => { const updated = await profileService.updateProfile(data); setUser((current) => ({ ...current, ...updated, name: `${updated.firstName || current.firstName} ${updated.lastName || current.lastName}` })); return updated }
  const logoutAll = async () => { await profileService.logoutAll(); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, login, logout, updateUser, logoutAll }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)