import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import CanchasPage from './pages/CanchasPage'
import ClientesPage from './pages/ClientesPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'

import ReservacionesPage from './pages/ReservacionesPage'
import UsuariosPage from './pages/UsuariosPage'
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="canchas" element={<CanchasPage />} />
          <Route path="reservaciones" element={<ReservacionesPage />} />
          <Route element={<ProtectedRoute admin />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
