import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const homes = { CITIZEN: '/ciudadano', EMPLOYEE: '/funcionario', ADMIN: '/admin' }
export default function ProtectedRoute({ roles }) { const { user, loading } = useAuth(); if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Cargando tu sesión…</main>; if (!user) return <Navigate to="/login" replace/>; if (roles && !roles.includes(user.role)) return <Navigate to={homes[user.role]} replace/>; return <Outlet/> }
