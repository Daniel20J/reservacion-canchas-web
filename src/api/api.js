import axios from 'axios'
export const CLAVE_SESION = 'canchas_sesion'
export const obtenerSesion = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION))
  } catch {
    sessionStorage.removeItem(CLAVE_SESION)
    return null
  }
}
export const guardarSesion = (sesion) => sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
export const eliminarSesion = () => sessionStorage.removeItem(CLAVE_SESION)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})
api.interceptors.request.use((config) => {
  const token = obtenerSesion()?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = /\/Auth\/login(?:\?|$)/i.test(error.config?.url ?? '')
    if (error.response?.status === 401 && !esLogin) {
      eliminarSesion()
      if (window.location.pathname !== '/login') window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)
export const obtenerError = (error) => {
  const data = error.response?.data
  const mensajes = []
  if (typeof data?.mensaje === 'string') mensajes.push(data.mensaje)
  if (data?.errors && typeof data.errors === 'object') {
    Object.values(data.errors).flat().forEach((mensaje) => {
      if (typeof mensaje === 'string') mensajes.push(mensaje)
    })
  }
  return [...new Set(mensajes)].join(' ') || 'No se pudo completar la solicitud.'
}
export default api
