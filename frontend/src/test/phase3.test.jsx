import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ChangePassword from '../components/profile/ChangePassword'
import PersonalInfo from '../components/profile/PersonalInfo'
import ProtectedRoute from '../routes/ProtectedRoute'
import AdminEmployeesPage from '../pages/admin/AdminEmployeesPage'
import { toast } from 'sonner'
import { profileService } from '../services/profileService'
import { adminService } from '../services/adminService'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../services/profileService', () => ({
  profileService: {
    update: vi.fn(() => Promise.resolve({ user: {} })),
    changePassword: vi.fn(() => Promise.resolve({})),
    sessions: vi.fn(() => Promise.resolve({ items: [] })),
    revokeSession: vi.fn(() => Promise.resolve({})),
  },
}))
vi.mock('../services/adminService', () => ({
  adminService: {
    employees: vi.fn(() => Promise.resolve({ items: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 1 } })),
    services: vi.fn(() => Promise.resolve([])),
    getEmployee: vi.fn(() => Promise.resolve({ employee: {} })),
  },
}))
const auth = vi.hoisted(() => ({ state: { user: null, loading: false, logout: vi.fn(), logoutAll: vi.fn(), updateUser: vi.fn(() => Promise.resolve({ user: {} })) } }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth.state, AuthProvider: ({ children }) => children }))

beforeEach(() => {
  vi.clearAllMocks()
  adminService.employees.mockResolvedValue({ items: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 1 } })
  adminService.services.mockResolvedValue([])
  profileService.changePassword.mockResolvedValue({})
  profileService.update.mockResolvedValue({ user: {} })
  auth.state.user = null
  auth.state.loading = false
})

describe('ChangePassword', () => {
  test('renderiza los tres campos y el botón', () => {
    render(<ChangePassword/>)
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Actualizar contraseña/ })).toBeInTheDocument()
  })
  test('rechaza contraseña nueva menor a 8 caracteres', async () => {
    render(<ChangePassword/>)
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'corto' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'corto' } })
    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(profileService.changePassword).not.toHaveBeenCalled()
  })
  test('rechaza contraseñas que no coinciden', async () => {
    render(<ChangePassword/>)
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva12345' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'otra12345' } })
    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(profileService.changePassword).not.toHaveBeenCalled()
  })
  test('envía la solicitud con credenciales válidas', async () => {
    render(<ChangePassword/>)
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva12345' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'nueva12345' } })
    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/ }))
    await waitFor(() => expect(profileService.changePassword).toHaveBeenCalledWith({ currentPassword: 'actual123', newPassword: 'nueva12345', confirmPassword: 'nueva12345' }))
    expect(toast.success).toHaveBeenCalled()
  })
})

describe('PersonalInfo', () => {
  const user = { firstName: 'Laura', lastName: 'Gómez', document: '1.234.567', email: 'laura@demo.com', phone: '3001234', role: 'CITIZEN' }
  test('muestra los datos del usuario y su rol', () => {
    render(<PersonalInfo user={user}/>)
    expect(screen.getByText('Laura')).toBeInTheDocument()
    expect(screen.getByText('Gómez')).toBeInTheDocument()
    expect(screen.getByText('laura@demo.com')).toBeInTheDocument()
    expect(screen.getByText('1.234.567')).toBeInTheDocument()
    expect(screen.getByText('Ciudadano')).toBeInTheDocument()
  })
})

describe('ProtectedRoute', () => {
  const renderRoutes = (user, roles) => {
    auth.state.user = user
    auth.state.loading = false
    return render(
      <MemoryRouter initialEntries={['/ciudadano']}>
        <Routes>
          <Route element={<ProtectedRoute roles={roles}/>}>
            <Route path="/ciudadano" element={<div>Panel ciudadano</div>}/>
          </Route>
          <Route path="/login" element={<div>Iniciar sesión</div>}/>
          <Route path="/funcionario" element={<div>Panel funcionario</div>}/>
        </Routes>
      </MemoryRouter>
    )
  }
  test('redirige a login cuando no hay usuario', () => {
    renderRoutes(null, ['CITIZEN'])
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  })
  test('renderiza el contenido cuando el rol coincide', () => {
    renderRoutes({ role: 'CITIZEN' }, ['CITIZEN'])
    expect(screen.getByText('Panel ciudadano')).toBeInTheDocument()
  })
  test('redirige al inicio del rol cuando no coincide', () => {
    renderRoutes({ role: 'EMPLOYEE' }, ['CITIZEN'])
    expect(screen.getByText('Panel funcionario')).toBeInTheDocument()
  })
})

describe('AdminEmployeesPage', () => {
  test('muestra el encabezado y la lista de funcionarios', async () => {
    adminService.employees.mockResolvedValueOnce({ items: [{ id: 'e1', firstName: 'Ana', lastName: 'Torres', email: 'ana@demo.com', document: '9.876.543', active: true, activeAppointments: 3, services: [{ id: 's1', name: 'Orientación jurídica' }] }], pagination: { page: 1, limit: 8, total: 1, totalPages: 1 } })
    render(<AdminEmployeesPage/>)
    expect(screen.getByText('Gestión de funcionarios')).toBeInTheDocument()
    expect((await screen.findAllByText('Ana Torres')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('ana@demo.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Orientación jurídica').length).toBeGreaterThan(0)
  })
  test('muestra mensaje vacío cuando no hay funcionarios', async () => {
    render(<AdminEmployeesPage/>)
    expect(await screen.findByText('No hay funcionarios para mostrar.')).toBeInTheDocument()
  })
})