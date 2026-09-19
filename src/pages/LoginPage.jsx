import { useState } from 'react'
import { CalendarDays, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { obtenerError } from '../api/api'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
    const [correo, setCorreo] = useState('admin@canchas.local')
    const [password, setPassword] = useState('')
    const [enviando, setEnviando] = useState(false)
    const { usuario, login } = useAuth()
    const navigate = useNavigate()

    if (usuario) return <Navigate to="/" replace />

    const iniciarSesion = async (event) => {
        event.preventDefault()
        if (!correo.trim() || !password) return toast.warning('Ingresa tu correo y contraseña.')

        try {
            setEnviando(true)
            const sesion = await login(correo.trim(), password)
            toast.success(`Bienvenido, ${sesion.nombreCompleto}.`)
            navigate('/', { replace: true })
        } catch (error) {
            toast.error(obtenerError(error))
        } finally {
            setEnviando(false)
        }
    }

    return (
        <main className="login-page">
            <div className="login-glow login-glow--one" />
            <div className="login-glow login-glow--two" />
            <section className="login-card">
                <div className="login-brand">
                    <span><CalendarDays size={33} /></span>
                    <h1>CanchaPro</h1>
                    <p>Gestión inteligente de reservaciones</p>
                </div>
                <form onSubmit={iniciarSesion}>
                    <div className="form-heading">
                        <h2>Iniciar sesión</h2>
                        <p>Accede al panel de administración</p>
                    </div>

                    <label className="field-label" htmlFor="correo">Correo electrónico</label>
                    <div className="input-control">
                        <Mail size={19} />
                        <input
                            id="correo"
                            type="email"
                            value={correo}
                            onChange={(event) => setCorreo(event.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <label className="field-label" htmlFor="password">Contraseña</label>
                    <div className="input-control">
                        <LockKeyhole size={19} />
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>

                    <button className="primary-button login-button" type="submit" disabled={enviando}>
                        {enviando ? <><LoaderCircle className="spin" size={20} />Ingresando...</> : 'Iniciar sesión'}
                    </button>
                </form>
                <p className="login-footer">Universidad Mariano Gálvez</p>
            </section>
        </main>
    )
}