/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import api, { eliminarSesion, guardarSesion, obtenerSesion } from '../api/api'

const AuthContext = createContext(null)

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

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
    return context
}