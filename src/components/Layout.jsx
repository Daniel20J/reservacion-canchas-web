import { useEffect, useState } from 'react'
import { CalendarCheck, CalendarDays, House, LogOut, MapPin, Menu, UserCog, Users, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
const opciones = [
  { to: '/', texto: 'Inicio', icono: House },
  { to: '/clientes', texto: 'Clientes', icono: Users },
  { to: '/canchas', texto: 'Canchas', icono: MapPin },
  { to: '/reservaciones', texto: 'Reservaciones', icono: CalendarCheck },
  { to: '/usuarios', texto: 'Usuarios', icono: UserCog, admin: true },
]
export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { usuario, esAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const iniciales = usuario?.nombreCompleto?.split(' ').slice(0, 2).map((nombre) => nombre[0]).join('').toUpperCase() || 'U'
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuAbierto)
    return () => document.body.classList.remove('menu-open')
  }, [menuAbierto])
  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="app-shell">
      <button className={`sidebar-overlay ${menuAbierto ? 'is-visible' : ''}`} type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />
      <aside className={`sidebar ${menuAbierto ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <span className="brand-icon"><CalendarDays size={25} /></span>
          <div><strong>CanchaPro</strong><small>Reservaciones</small></div>
          <button className="sidebar__mobile-close" type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú"><X size={21} /></button>
        </div>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          <span className="sidebar__section-label">MENÚ PRINCIPAL</span>
          {opciones.filter(({ admin }) => !admin || esAdmin).map(({ to, texto, icono: Icono }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuAbierto(false)} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <Icono size={20} /><span>{texto}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <div className="user-summary">
            <span className="user-avatar">{iniciales}</span>
            <div><strong>{usuario?.nombreCompleto}</strong><small>{usuario?.correo}</small></div>
          </div>
          <button className="logout-button" type="button" onClick={cerrarSesion}><LogOut size={18} />Cerrar sesión</button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"><Menu size={23} /></button>
          <div><strong>Sistema de Reservación de Canchas</strong><span>Universidad Mariano Gálvez</span></div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
