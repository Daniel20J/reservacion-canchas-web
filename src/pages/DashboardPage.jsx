import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, CalendarDays, CalendarX, CircleDollarSign, LoaderCircle, MapPin, Trophy } from 'lucide-react'
import { toast } from 'react-toastify'
import api, { obtenerError } from '../api/api'

const hoy = () => {
    const fecha = new Date()
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
    return fecha.toISOString().slice(0, 10)
}

const moneda = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })
const hora = new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit' })

export default function DashboardPage() {
    const [fecha, setFecha] = useState(hoy)
    const [resumen, setResumen] = useState(null)
    const [reservaciones, setReservaciones] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const cargar = async () => {
            try {
                setCargando(true)
                const config = { params: { fecha }, signal: controller.signal }
                const [respuestaResumen, respuestaReservaciones] = await Promise.all([
                    api.get('/Dashboard/resumen', config),
                    api.get('/Reservaciones', config),
                ])
                setResumen(respuestaResumen.data)
                setReservaciones(respuestaReservaciones.data)
            } catch (error) {
                if (error.code !== 'ERR_CANCELED') toast.error(obtenerError(error))
            } finally {
                if (!controller.signal.aborted) setCargando(false)
            }
        }
        cargar()
        return () => controller.abort()
    }, [fecha])

    const tarjetas = useMemo(() => [
        { titulo: 'Canchas activas', valor: resumen?.canchasActivas ?? 0, icono: MapPin, estilo: 'purple' },
        { titulo: 'Reservadas', valor: resumen?.reservadas ?? 0, icono: CalendarCheck, estilo: 'green' },
        { titulo: 'Utilizadas', valor: resumen?.utilizadas ?? 0, icono: Trophy, estilo: 'blue' },
        { titulo: 'Canceladas', valor: resumen?.canceladas ?? 0, icono: CalendarX, estilo: 'red' },
        { titulo: 'Ingreso programado', valor: moneda.format(resumen?.ingresoProgramado ?? 0), icono: CircleDollarSign, estilo: 'amber' },
    ], [resumen])

    const horario = (inicio, fin) => `${hora.format(new Date(inicio))} – ${hora.format(new Date(fin))}`

    return (
        <section className="dashboard-page">
            <div className="page-header">
                <div>
                    <span className="eyebrow">PANEL GENERAL</span>
                    <h1>Resumen del día</h1>
                    <p>Consulta la operación y las reservaciones programadas.</p>
                </div>
                <label className="date-picker">
                    <CalendarDays size={19} />
                    <span>Fecha</span>
                    <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
                </label>
            </div>

            <div className="stats-grid">
                {tarjetas.map(({ titulo, valor, icono: Icono, estilo }) => (
                    <article className={`stat-card stat-card--${estilo}`} key={titulo}>
                        <span className="stat-card__icon"><Icono size={23} /></span>
                        <div>
                            <p>{titulo}</p>
                            <strong>{cargando ? '—' : valor}</strong>
                        </div>
                    </article>
                ))}
            </div>

            <section className="panel reservations-panel">
                <div className="panel__header">
                    <div>
                        <h2>Reservaciones del día</h2>
                        <p>{cargando ? 'Consultando información...' : `${reservaciones.length} ${reservaciones.length === 1 ? 'reservación encontrada' : 'reservaciones encontradas'}`}</p>
                    </div>
                    <span className="total-badge">{resumen?.totalReservaciones ?? 0} total</span>
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Cancha</th>
                                <th>Horario</th>
                                <th>Estado</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="table-message">
                                            <LoaderCircle className="spin" size={24} />
                                            Cargando reservaciones...
                                        </div>
                                    </td>
                                </tr>
                            ) : reservaciones.length ? reservaciones.map((reservacion) => (
                                <tr key={reservacion.idReservacion}>
                                    <td><strong>{reservacion.cliente}</strong></td>
                                    <td>{reservacion.cancha}<small>{reservacion.tipoCancha}</small></td>
                                    <td>{horario(reservacion.fechaInicio, reservacion.fechaFin)}</td>
                                    <td>
                                        <span className={`status status--${reservacion.estado.toLowerCase()}`}>
                                            {reservacion.estado}
                                        </span>
                                    </td>
                                    <td className="text-right amount">{moneda.format(reservacion.total)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5">
                                        <div className="table-message empty">
                                            <CalendarDays size={27} />
                                            No hay reservaciones para esta fecha.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    )
}