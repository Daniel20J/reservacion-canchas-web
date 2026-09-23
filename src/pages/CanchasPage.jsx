import { useEffect, useState } from 'react'
import { Edit3, LoaderCircle, MapPin, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import api, { obtenerError } from '../api/api'
import Modal from '../components/Modal'

const formularioInicial = { nombre: '', tipo: '', precioHora: '' }

export default function CanchasPage() {
  const [canchas, setCanchas] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [cargando, setCargando] = useState(true)
  const [recarga, setRecarga] = useState(0)
  const [modal, setModal] = useState({ abierto: false, cancha: null })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const cargar = async () => {
      try {
        setCargando(true)
        const params = filtro === 'todas' ? undefined : { activo: filtro === 'activas' }
        const { data } = await api.get('/Canchas', { params, signal: controller.signal })
        setCanchas(data)
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') toast.error(obtenerError(error))
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }
    cargar()
    return () => controller.abort()
  }, [filtro, recarga])

  const abrirModal = (cancha = null) => {
    setFormulario(cancha ? { nombre: cancha.nombre, tipo: cancha.tipo, precioHora: cancha.precioHora } : formularioInicial)
    setModal({ abierto: true, cancha })
  }

  const actualizarCampo = ({ target }) => setFormulario((actual) => ({ ...actual, [target.name]: target.value }))

  const guardar = async (event) => {
    event.preventDefault()
    const payload = { nombre: formulario.nombre.trim(), tipo: formulario.tipo.trim(), precioHora: Number(formulario.precioHora) }
    try {
      setGuardando(true)
      const { data } = modal.cancha
        ? await api.put(`/Canchas/${modal.cancha.idCancha}`, payload)
        : await api.post('/Canchas', payload)
      toast.success(data.mensaje)
      setModal({ abierto: false, cancha: null })
      setRecarga((valor) => valor + 1)
    } catch (error) {
      toast.error(obtenerError(error))
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (cancha) => {
    const activar = !cancha.activo
    const resultado = await Swal.fire({
      title: `${activar ? 'Activar' : 'Desactivar'} cancha`,
      text: `¿Deseas ${activar ? 'activar' : 'desactivar'} ${cancha.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${activar ? 'activar' : 'desactivar'}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: activar ? '#16845b' : '#dc4c58',
      reverseButtons: true,
    })
    if (!resultado.isConfirmed) return
    try {
      const { data } = await api.put(`/Canchas/${cancha.idCancha}/estado`, { activo: activar })
      toast.success(data.mensaje)
      setRecarga((valor) => valor + 1)
    } catch (error) {
      toast.error(obtenerError(error))
    }
  }

  return (
    <section className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Canchas</h1>
          <p>Configura espacios, tipos y tarifas por hora.</p>
        </div>
        <button className="primary-button page-action" type="button" onClick={() => abrirModal()}>
          <Plus size={19} />Nueva cancha
        </button>
      </div>

      <div className="courts-toolbar">
        <div className="filter-tabs" role="group" aria-label="Filtrar canchas">
          {[['todas', 'Todas'], ['activas', 'Activas'], ['inactivas', 'Inactivas']].map(([valor, texto]) => (
            <button key={valor} className={filtro === valor ? 'is-active' : ''} type="button" onClick={() => setFiltro(valor)}>
              {texto}
            </button>
          ))}
        </div>
        <span className="results-count">{canchas.length} cancha{canchas.length === 1 ? '' : 's'}</span>
      </div>

      {cargando ? (
        <div className="cards-message">
          <LoaderCircle className="spin" size={25} />Cargando canchas...
        </div>
      ) : canchas.length ? (
        <div className="courts-grid">
          {canchas.map((cancha) => (
            <article className={`court-card ${cancha.activo ? '' : 'is-inactive'}`} key={cancha.idCancha}>
              <div className="court-card__visual">
                <span><MapPin size={25} /></span>
                <span className={`entity-status ${cancha.activo ? 'is-active' : 'is-inactive'}`}>
                  {cancha.activo ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>
              <div className="court-card__body">
                <span className="court-type">{cancha.tipo}</span>
                <h2>{cancha.nombre}</h2>
                <div className="court-price">
                  <strong>Q {Number(cancha.precioHora).toFixed(2)}</strong>
                  <span>por hora</span>
                </div>
              </div>
              <div className="court-card__actions">
                <button className="card-button" type="button" onClick={() => abrirModal(cancha)}>
                  <Edit3 size={17} />Editar
                </button>
                <button className={`card-button ${cancha.activo ? 'danger' : 'success'}`} type="button" onClick={() => cambiarEstado(cancha)}>
                  {cancha.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {cancha.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="cards-message empty">
          <MapPin size={30} />No hay canchas para este filtro.
        </div>
      )}

      <Modal abierto={modal.abierto} titulo={modal.cancha ? 'Editar cancha' : 'Nueva cancha'} onClose={() => setModal({ abierto: false, cancha: null })} ancho="560px">
        <form className="entity-form" onSubmit={guardar}>
          <div className="form-grid">
            <label className="form-field full">
              <span>Nombre *</span>
              <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} maxLength="100" required autoFocus placeholder="Ej. Cancha Central" />
            </label>
            <label className="form-field">
              <span>Tipo *</span>
              <input name="tipo" value={formulario.tipo} onChange={actualizarCampo} maxLength="50" required placeholder="Ej. Fútbol 5" />
            </label>
            <label className="form-field">
              <span>Precio por hora *</span>
              <div className="price-input">
                <span>Q</span>
                <input name="precioHora" type="number" value={formulario.precioHora} onChange={actualizarCampo} min="0.01" max="999999" step="0.01" required placeholder="150.00" />
              </div>
            </label>
          </div>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => setModal({ abierto: false, cancha: null })}>
              Cancelar
            </button>
            <button className="primary-button save-button" type="submit" disabled={guardando}>
              {guardando && <LoaderCircle className="spin" size={18} />}
              {guardando ? 'Guardando...' : 'Guardar cancha'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
