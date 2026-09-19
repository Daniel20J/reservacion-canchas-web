import { useEffect, useMemo, useState } from 'react'
import { Ban, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Edit3, LoaderCircle, Plus, Search } from 'lucide-react'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import api, { obtenerError } from '../api/api'
import Modal from '../components/Modal'
const hoy = () => {
  const fecha = new Date()
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
  return fecha.toISOString().slice(0, 10)
}
const formularioInicial = { idCliente: '', idCancha: '', fechaInicio: '', fechaFin: '', observaciones: '' }
const numero = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 })
const fechaHora = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
const dinero = (valor) => `Q ${Number(valor || 0).toFixed(2)}`
export default function ReservacionesPage() {
  const [reservaciones, setReservaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [canchas, setCanchas] = useState([])
  const [estados, setEstados] = useState([])
  const [filtros, setFiltros] = useState({ fecha: hoy(), idCancha: '', estado: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [recarga, setRecarga] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState({ abierto: false, id: null })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [guardando, setGuardando] = useState(false)
  const [cargandoEdicion, setCargandoEdicion] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    const cargarCatalogos = async () => {
      try {
        const [respuestaClientes, respuestaCanchas, respuestaEstados] = await Promise.all([
          api.get('/Clientes', { signal: controller.signal }),
          api.get('/Canchas', { params: { activo: true }, signal: controller.signal }),
          api.get('/EstadosReservacion', { signal: controller.signal }),
        ])
        setClientes(respuestaClientes.data.filter((cliente) => cliente.activo))
        setCanchas(respuestaCanchas.data)
        setEstados(respuestaEstados.data)
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') toast.error(obtenerError(error))
      }
    }
    cargarCatalogos()
    return () => controller.abort()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const cargarReservaciones = async () => {
      try {
        setCargando(true)
        const params = Object.fromEntries(Object.entries(filtrosAplicados).filter(([, valor]) => valor !== ''))
        const { data } = await api.get('/Reservaciones', { params, signal: controller.signal })
        setReservaciones(data)
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') toast.error(obtenerError(error))
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }
    cargarReservaciones()
    return () => controller.abort()
  }, [filtrosAplicados, recarga])
  const canchaSeleccionada = useMemo(() => canchas.find((cancha) => cancha.idCancha === Number(formulario.idCancha)), [canchas, formulario.idCancha])
  const estimacion = useMemo(() => {
    const inicio = new Date(formulario.fechaInicio)
    const fin = new Date(formulario.fechaFin)
    const duracion = formulario.fechaInicio && formulario.fechaFin ? (fin - inicio) / 3600000 : 0
    const horas = duracion > 0 ? Math.round(duracion * 100) / 100 : 0
    const precio = Number(canchaSeleccionada?.precioHora || 0)
    return { horas, precio, total: horas * precio }
  }, [formulario.fechaInicio, formulario.fechaFin, canchaSeleccionada])
  useEffect(() => {
    if (!modal.abierto || modal.id || !formulario.idCancha || estimacion.horas <= 0) return
    const controller = new AbortController()
    const temporizador = setTimeout(async () => {
      try {
        setDisponibilidad({ consultando: true })
        const { data } = await api.get('/Reservaciones/disponibilidad', {
          params: { idCancha: formulario.idCancha, inicio: formulario.fechaInicio, fin: formulario.fechaFin },
          signal: controller.signal,
        })
        setDisponibilidad(data)
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') setDisponibilidad({ disponible: false, mensaje: obtenerError(error) })
      }
    }, 450)
    return () => { clearTimeout(temporizador); controller.abort() }
  }, [modal.abierto, modal.id, formulario.idCancha, formulario.fechaInicio, formulario.fechaFin, estimacion.horas])
  const buscar = (event) => {
    event.preventDefault()
    setFiltrosAplicados({ ...filtros })
    setRecarga((valor) => valor + 1)
  }
  const abrirNueva = () => {
    setFormulario(formularioInicial)
    setDisponibilidad(null)
    setModal({ abierto: true, id: null })
  }
  const abrirEdicion = async (reservacion) => {
    if (reservacion.estado !== 'RESERVADA') return toast.warning('Solo una reservación RESERVADA puede modificarse.')
    try {
      setCargandoEdicion(true)
      const { data } = await api.get(`/Reservaciones/${reservacion.idReservacion}`)
      setFormulario({
        idCliente: String(data.idCliente),
        idCancha: String(data.idCancha),
        fechaInicio: data.fechaInicio.substring(0, 16),
        fechaFin: data.fechaFin.substring(0, 16),
        observaciones: data.observaciones ?? '',
      })
      setDisponibilidad(null)
      setModal({ abierto: true, id: data.idReservacion })
    } catch (error) {
      toast.error(obtenerError(error))
    } finally {
      setCargandoEdicion(false)
    }
  }
  const actualizarCampo = ({ target }) => {
    setDisponibilidad(null)
    setFormulario((actual) => ({ ...actual, [target.name]: target.value }))
  }
  const guardar = async (event) => {
    event.preventDefault()
    if (new Date(formulario.fechaFin) <= new Date(formulario.fechaInicio)) return toast.warning('La fecha y hora final deben ser mayores a la inicial.')
    const payload = {
      idCliente: Number(formulario.idCliente),
      idCancha: Number(formulario.idCancha),
      fechaInicio: formulario.fechaInicio,
      fechaFin: formulario.fechaFin,
      observaciones: formulario.observaciones.trim() || null,
    }
    try {
      setGuardando(true)
      const { data } = modal.id
        ? await api.put(`/Reservaciones/${modal.id}`, payload)
        : await api.post('/Reservaciones', payload)
      toast.success(data.mensaje)
      setModal({ abierto: false, id: null })
      setRecarga((valor) => valor + 1)
    } catch (error) {
      toast.error(obtenerError(error))
    } finally {
      setGuardando(false)
    }
  }
  const cambiarEstado = async (reservacion, accion) => {
    const cancelar = accion === 'cancelar'
    const resultado = await Swal.fire({
      title: cancelar ? '¿Cancelar reservación?' : '¿Marcar como utilizada?',
      text: cancelar ? 'El horario quedará nuevamente disponible.' : 'La reservación se registrará como utilizada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: cancelar ? 'Sí, cancelar' : 'Sí, marcar utilizada',
      cancelButtonText: 'Volver',
      confirmButtonColor: cancelar ? '#dc4c58' : '#2563eb',
      reverseButtons: true,
    })
    if (!resultado.isConfirmed) return
    try {
      const { data } = await api.put(`/Reservaciones/${reservacion.idReservacion}/${accion}`)
      toast.success(data.mensaje)
      setRecarga((valor) => valor + 1)
    } catch (error) {
      toast.error(obtenerError(error))
    }
  }
  return (
    <section className="management-page reservations-page">
      <div className="page-header">
        <div><span className="eyebrow">OPERACIÓN</span><h1>Reservaciones</h1><p>Control de horarios, clientes y disponibilidad.</p></div>
        <button className="primary-button page-action" type="button" onClick={abrirNueva}><Plus size={19} />Nueva reservación</button>
      </div>
      <form className="reservation-filters panel" onSubmit={buscar}>
        <label><span>Fecha</span><input type="date" value={filtros.fecha} onChange={(event) => setFiltros((actual) => ({ ...actual, fecha: event.target.value }))} /></label>
        <label><span>Cancha</span><select value={filtros.idCancha} onChange={(event) => setFiltros((actual) => ({ ...actual, idCancha: event.target.value }))}><option value="">Todas las canchas</option>{canchas.map((cancha) => <option key={cancha.idCancha} value={cancha.idCancha}>{cancha.nombre}</option>)}</select></label>
        <label><span>Estado</span><select value={filtros.estado} onChange={(event) => setFiltros((actual) => ({ ...actual, estado: event.target.value }))}><option value="">Todos los estados</option>{estados.map((estado) => <option key={estado.idEstadoReservacion} value={estado.nombre}>{estado.nombre}</option>)}</select></label>
        <button className="primary-button filter-button" type="submit"><Search size={18} />Buscar</button>
      </form>
      <section className="panel reservation-list">
        <div className="panel__header"><div><h2>Listado de reservaciones</h2><p>{cargando ? 'Consultando información...' : `${reservaciones.length} resultado${reservaciones.length === 1 ? '' : 's'}`}</p></div><span className="total-badge">{reservaciones.length} total</span></div>
        <div className="table-wrapper">
          <table className="reservations-table">
            <thead><tr><th>Cliente</th><th>Cancha</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Total</th><th>Estado</th><th className="text-right">Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="8"><div className="table-message"><LoaderCircle className="spin" size={24} />Cargando reservaciones...</div></td></tr>
              ) : reservaciones.length ? reservaciones.map((reservacion) => (
                <tr key={reservacion.idReservacion}>
                  <td><strong>{reservacion.cliente}</strong></td>
                  <td><strong>{reservacion.cancha}</strong><small>{reservacion.tipoCancha}</small></td>
                  <td>{fechaHora.format(new Date(reservacion.fechaInicio))}</td>
                  <td>{fechaHora.format(new Date(reservacion.fechaFin))}</td>
                  <td>{numero.format(reservacion.duracionHoras)} h</td>
                  <td className="amount">{dinero(reservacion.total)}</td>
                  <td><span className={`status status--${reservacion.estado.toLowerCase()}`}>{reservacion.estado}</span></td>
                  <td><div className="reservation-actions">{reservacion.estado === 'RESERVADA' && <>
                    <button type="button" onClick={() => abrirEdicion(reservacion)} disabled={cargandoEdicion} title="Editar"><Edit3 size={16} /><span>Editar</span></button>
                    <button className="use" type="button" onClick={() => cambiarEstado(reservacion, 'utilizar')} title="Marcar utilizada"><CheckCircle2 size={17} /><span>Utilizar</span></button>
                    <button className="cancel" type="button" onClick={() => cambiarEstado(reservacion, 'cancelar')} title="Cancelar"><Ban size={17} /><span>Cancelar</span></button>
                  </>}</div></td>
                </tr>
              )) : (
                <tr><td colSpan="8"><div className="table-message empty"><CalendarDays size={28} />No hay reservaciones para los filtros seleccionados.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal abierto={modal.abierto} titulo={modal.id ? 'Editar reservación' : 'Nueva reservación'} onClose={() => setModal({ abierto: false, id: null })} ancho="720px">
        <form className="entity-form reservation-form" onSubmit={guardar}>
          <div className="form-grid">
            <label className="form-field"><span>Cliente *</span><select name="idCliente" value={formulario.idCliente} onChange={actualizarCampo} required autoFocus><option value="">Selecciona un cliente</option>{clientes.map((cliente) => <option key={cliente.idCliente} value={cliente.idCliente}>{cliente.nombre}</option>)}</select></label>
            <label className="form-field"><span>Cancha *</span><select name="idCancha" value={formulario.idCancha} onChange={actualizarCampo} required><option value="">Selecciona una cancha</option>{canchas.map((cancha) => <option key={cancha.idCancha} value={cancha.idCancha}>{cancha.nombre} · {cancha.tipo}</option>)}</select></label>
            <label className="form-field"><span>Fecha y hora de inicio *</span><input name="fechaInicio" type="datetime-local" value={formulario.fechaInicio} onChange={actualizarCampo} required /></label>
            <label className="form-field"><span>Fecha y hora de fin *</span><input name="fechaFin" type="datetime-local" value={formulario.fechaFin} onChange={actualizarCampo} required /></label>
            <label className="form-field full"><span>Observaciones</span><textarea name="observaciones" value={formulario.observaciones} onChange={actualizarCampo} maxLength="500" rows="3" placeholder="Información adicional de la reservación" /></label>
          </div>
          {!modal.id && disponibilidad && <div className={`availability ${disponibilidad.consultando ? 'checking' : disponibilidad.disponible ? 'available' : 'unavailable'}`}>
            {disponibilidad.consultando ? <LoaderCircle className="spin" size={18} /> : disponibilidad.disponible ? <CheckCircle2 size={18} /> : <Ban size={18} />}
            <span>{disponibilidad.consultando ? 'Verificando disponibilidad...' : disponibilidad.mensaje}</span>
          </div>}
          <div className="estimate-box">
            <div><span><Clock3 size={17} />Duración estimada</span><strong>{numero.format(estimacion.horas)} h</strong></div>
            <div><span><CircleDollarSign size={17} />Precio por hora</span><strong>{dinero(estimacion.precio)}</strong></div>
            <div><span><CircleDollarSign size={17} />Total estimado</span><strong>{dinero(estimacion.total)}</strong></div>
            <p>Estimación informativa. El cálculo definitivo lo realiza el servidor.</p>
          </div>
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setModal({ abierto: false, id: null })}>Cancelar</button><button className="primary-button save-button" type="submit" disabled={guardando}>{guardando && <LoaderCircle className="spin" size={18} />}{guardando ? 'Guardando...' : 'Guardar reservación'}</button></div>
        </form>
      </Modal>
    </section>
  )
}
