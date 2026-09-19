import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
export default function ProtectedRoute({ admin = false, children }) {
  const { usuario, esAdmin } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (admin && !esAdmin) return <Navigate to="/" replace />
  return children ?? <Outlet />
}
