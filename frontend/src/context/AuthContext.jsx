import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
const AuthContext = createContext(null)
export function AuthProvider({ children }) { const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); useEffect(() => { authService.current().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)) }, []); const login = async (email, password) => { const logged = await authService.login(email, password); setUser(logged); return logged }; const logout = async () => { await authService.logout(); setUser(null) }; const updateUser = (data) => setUser(authService.updateProfile(data)); return <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>{children}</AuthContext.Provider> }
export const useAuth = () => useContext(AuthContext)
