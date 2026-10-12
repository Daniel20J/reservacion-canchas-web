import { useCallback, useMemo, useState } from 'react'
import api, { eliminarSesion, guardarSesion, obtenerSesion } from '../api/api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(obtenerSesion)

    const login = useCallback(async (correo, password) => {
        const { data } = await api.post('/Auth/login', { correo, password })
        guardarSesion(data)
        setUsuario(data)
        return data
    }, [])

    const logout = useCallback(() => {
        eliminarSesion()
        setUsuario(null)
    }, [])

    const value = useMemo(() => ({
        usuario,
        login,
        logout,
        esAdmin: usuario?.roles?.includes('ADMINISTRADOR') ?? false,
    }), [usuario, login, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}