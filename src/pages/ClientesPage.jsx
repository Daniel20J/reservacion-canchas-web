import { useCallback, useEffect, useState } from 'react'
import { Edit3, LoaderCircle, Plus, Search, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import api, { obtenerError } from '../api/api'
import Modal from '../components/Modal'

const formularioInicial = { nombre: '', documento: '', telefono: '', email: '' }

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState({ abierto: false, cliente: null })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [guardando, setGuardando] = useState(false)

  const cargarClientes = useCallback(async (signal) => {
    try {
      setCargando(true)
      const texto = buscar.trim()
      const { data } = await api.get('/Clientes', { params: texto ? { buscar: texto } : undefined, signal })
      setClientes(data)
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') toast.error(obtenerError(error))
    } finally {
      if (!signal?.aborted) setCargando(false)
    }
  }, [buscar])

  useEffect(() => {
    const controller = new AbortController()
    const temporizador = setTimeout(() => cargarClientes(controller.signal), 350)
    return () => { clearTimeout(temporizador); controller.abort() }
  }, [cargarClientes])

  const abrirModal = (cliente = null) => {
    setFormulario(cliente ? {
      nombre: cliente.nombre,
      documento: cliente.documento ?? '',
      telefono: cliente.telefono ?? '',
      email: cliente.email ?? '',
    } : formularioInicial)
    setModal({ abierto: true, cliente })
  }

  const actualizarCampo = ({ target }) => setFormulario((actual) => ({ ...actual, [target.name]: target.value }))

  const guardar = async (event) => {
    event.preventDefault()
    const payload = {
      nombre: formulario.nombre.trim(),
      documento: formulario.documento.trim() || null,
      telefono: formulario.telefono.trim() || null,
      email: formulario.email.trim() || null,
    }
    try {
      setGuardando(true)
      const { data } = modal.cliente
        ? await api.put(`/Clientes/${modal.cliente.idCliente}`, payload)
        : await api.post('/Clientes', payload)
      toast.success(data.mensaje)
      setModal({ abierto: false, cliente: null })
      await cargarClientes()
    } catch (error) {
      toast.error(obtenerError(error))
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (cliente) => {
    const activar = !cliente.activo
    const resultado = await Swal.fire({
      title: `${activar ? 'Activar' : 'Desactivar'} cliente`,
      text: `¿Deseas ${activar ? 'activar' : 'desactivar'} a ${cliente.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${activar ? 'activar' : 'desactivar'}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: activar ? '#16845b' : '#dc4c58',
      reverseButtons: true,
    })
    if (!resultado.isConfirmed) return
    try {
      const { data } = await api.put(`/Clientes/${cliente.idCliente}/estado`, { activo: activar })
      toast.success(data.mensaje)
      await cargarClientes()
    } catch (error) {
      toast.error(obtenerError(error))
    }
  }

  return (
    <section className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">GESTIÓN</span>
          <h1>Clientes</h1>
          <p>Administra las personas que reservan tus canchas.</p>
        </div>
        <button className="primary-button page-action" type="button" onClick={() => abrirModal()}>
          <Plus size={19} />Nuevo cliente
        </button>
      </div>

      <section className="panel management-panel">
        <div className="management-toolbar">
          <div className="search-control">
            <Search size={19} />
            <input type="search" value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar por nombre, documento o teléfono" aria-label="Buscar clientes" />
          </div>
          <span className="results-count">{clientes.length} resultado{clientes.length === 1 ? '' : 's'}</span>
        </div>

        <div className="table-wrapper">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5">
                    <div className="table-message">
                      <LoaderCircle className="spin" size={24} />Cargando clientes...
                    </div>
                  </td>
                </tr>
              ) : clientes.length ? clientes.map((cliente) => (
                <tr key={cliente.idCliente}>
                  <td>
                    <div className="client-cell">
                      <span>{cliente.nombre.charAt(0).toUpperCase()}</span>
                      <div>
                        <strong>{cliente.nombre}</strong>
                        <small>{cliente.email || 'Sin correo registrado'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{cliente.documento || '—'}</td>
                  <td>{cliente.telefono || '—'}</td>
                  <td>
                    <span className={`entity-status ${cliente.activo ? 'is-active' : 'is-inactive'}`}>
                      {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-action" type="button" onClick={() => abrirModal(cliente)} title="Editar cliente">
                        <Edit3 size={17} /><span>Editar</span>
                      </button>
                      <button className={`icon-action ${cliente.activo ? 'danger' : 'success'}`} type="button" onClick={() => cambiarEstado(cliente)} title={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}>
                        {cliente.activo ? <ToggleRight size={19} /> : <ToggleLeft size={19} />}
                        <span>{cliente.activo ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5">
                    <div className="table-message empty">
                      <Users size={28} />
                      {buscar ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal abierto={modal.abierto} titulo={modal.cliente ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModal({ abierto: false, cliente: null })} ancho="590px">
        <form className="entity-form" onSubmit={guardar}>
          <div className="form-grid">
            <label className="form-field full">
              <span>Nombre completo *</span>
              <input name="nombre" value={formulario.nombre} onChange={actualizarCampo} maxLength="150" required autoFocus />
            </label>
            <label className="form-field">
              <span>Documento</span>
              <input name="documento" value={formulario.documento} onChange={actualizarCampo} maxLength="30" placeholder="DPI, NIT u otro" />
            </label>
            <label className="form-field">
              <span>Teléfono</span>
              <input name="telefono" type="tel" value={formulario.telefono} onChange={actualizarCampo} maxLength="20" placeholder="5555-5555" />
            </label>
            <label className="form-field full">
              <span>Correo electrónico</span>
              <input name="email" type="email" value={formulario.email} onChange={actualizarCampo} maxLength="150" placeholder="cliente@correo.com" />
            </label>
          </div>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => setModal({ abierto: false, cliente: null })}>
              Cancelar
            </button>
            <button className="primary-button save-button" type="submit" disabled={guardando}>
              {guardando && <LoaderCircle className="spin" size={18} />}
              {guardando ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}