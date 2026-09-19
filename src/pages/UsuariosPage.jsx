import { useEffect, useState } from 'react'
import { Edit3, KeyRound, LoaderCircle, Plus, ToggleLeft, ToggleRight, UsersRound } from 'lucide-react'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import api, { obtenerError } from '../api/api'
import Modal from '../components/Modal'
const roles = ['ADMINISTRADOR', 'EMPLEADO']
const formularioInicial = { nombreCompleto: '', correo: '', password: '', rol: 'EMPLEADO', activo: true }
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [recarga, setRecarga] = useState(0)
  const [modal, setModal] = useState({ abierto: false, usuario: null })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [guardando, setGuardando] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const cargar = async () => {
      try {
        setCargando(true)
        const { data } = await api.get('/Usuarios', { signal: controller.signal })
        setUsuarios(data)
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') toast.error(obtenerError(error))
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }
    cargar()
    return () => controller.abort()
  }, [recarga])
  const abrirModal = (usuario = null) => {
    setFormulario(usuario ? {
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      password: '',
      rol: usuario.roles[0] || 'EMPLEADO',
      activo: usuario.activo,
    } : formularioInicial)
    setModal({ abierto: true, usuario })
  }
  const actualizarCampo = ({ target }) => setFormulario((actual) => ({ ...actual, [target.name]: target.value }))
  const guardar = async (event) => {
    event.preventDefault()
    const editando = Boolean(modal.usuario)
    const payload = editando
      ? { nombreCompleto: formulario.nombreCompleto.trim(), activo: formulario.activo === true || formulario.activo === 'true', rol: formulario.rol }
      : { nombreCompleto: formulario.nombreCompleto.trim(), correo: formulario.correo.trim(), password: formulario.password, rol: formulario.rol }
    try {
      setGuardando(true)
      const { data } = editando
        ? await api.put(`/Usuarios/${modal.usuario.idUsuario}`, payload)
        : await api.post('/Usuarios', payload)
      toast.success(data.mensaje)
      setModal({ abierto: false, usuario: null })
      setRecarga((valor) => valor + 1)
    } catch (error) {
      toast.error(obtenerError(error))
    } finally {
      setGuardando(false)
    }
  }
  const cambiarPassword = async (usuario) => {
    const resultado = await Swal.fire({
      title: 'Cambiar contraseña',
      text: `Nueva contraseña para ${usuario.nombreCompleto}`,
      input: 'password',
      inputPlaceholder: 'Mínimo 8 caracteres',
      inputAttributes: { minlength: '8', autocomplete: 'new-password' },
      showCancelButton: true,
      confirmButtonText: 'Actualizar contraseña',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      reverseButtons: true,
      preConfirm: (password) => {
        if (!password || password.length < 8) {
          Swal.showValidationMessage('La contraseña debe tener al menos 8 caracteres.')
          return false
        }
        return password
      },
    })
    if (!resultado.isConfirmed) return
    try {
      const { data } = await api.put(`/Usuarios/${usuario.idUsuario}/password`, { password: resultado.value })
      toast.success(data.mensaje)
    } catch (error) {
      toast.error(obtenerError(error))
    }
  }
  const cambiarEstado = async (usuario) => {
    const activar = !usuario.activo
    const resultado = await Swal.fire({
      title: `${activar ? 'Activar' : 'Desactivar'} usuario`,
      text: `¿Deseas ${activar ? 'activar' : 'desactivar'} a ${usuario.nombreCompleto}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${activar ? 'activar' : 'desactivar'}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: activar ? '#16845b' : '#dc4c58',
      reverseButtons: true,
    })
    if (!resultado.isConfirmed) return
    try {
      const { data } = await api.put(`/Usuarios/${usuario.idUsuario}`, {
        nombreCompleto: usuario.nombreCompleto,
        activo: activar,
        rol: usuario.roles[0] || 'EMPLEADO',
      })
      toast.success(data.mensaje)
      setRecarga((valor) => valor + 1)
    } catch (error) {
      toast.error(obtenerError(error))
    }
  }
  return (
    <section className="management-page users-page">
      <div className="page-header">
        <div><span className="eyebrow">SEGURIDAD</span><h1>Usuarios</h1><p>Administración de acceso y roles.</p></div>
        <button className="primary-button page-action" type="button" onClick={() => abrirModal()}><Plus size={19} />Nuevo usuario</button>
      </div>
      <section className="panel management-panel">
        <div className="panel__header"><div><h2>Usuarios del sistema</h2><p>{cargando ? 'Consultando información...' : `${usuarios.length} usuario${usuarios.length === 1 ? '' : 's'} registrado${usuarios.length === 1 ? '' : 's'}`}</p></div><span className="total-badge">{usuarios.length} total</span></div>
        <div className="table-wrapper">
          <table className="users-table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th className="text-right">Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="5"><div className="table-message"><LoaderCircle className="spin" size={24} />Cargando usuarios...</div></td></tr>
              ) : usuarios.length ? usuarios.map((usuario) => (
                <tr key={usuario.idUsuario}>
                  <td><div className="client-cell user-cell"><span>{usuario.nombreCompleto.charAt(0).toUpperCase()}</span><strong>{usuario.nombreCompleto}</strong></div></td>
                  <td>{usuario.correo}</td>
                  <td><div className="role-list">{usuario.roles.map((rol) => <span className={`role-badge role-badge--${rol.toLowerCase()}`} key={rol}>{rol}</span>)}</div></td>
                  <td><span className={`entity-status ${usuario.activo ? 'is-active' : 'is-inactive'}`}>{usuario.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                  <td><div className="row-actions user-actions">
                    <button className="icon-action" type="button" onClick={() => abrirModal(usuario)} title="Editar usuario"><Edit3 size={17} /><span>Editar</span></button>
                    <button className="icon-action" type="button" onClick={() => cambiarPassword(usuario)} title="Cambiar contraseña"><KeyRound size={17} /><span>Contraseña</span></button>
                    <button className={`icon-action ${usuario.activo ? 'danger' : 'success'}`} type="button" onClick={() => cambiarEstado(usuario)} title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}>
                      {usuario.activo ? <ToggleRight size={19} /> : <ToggleLeft size={19} /> }<span>{usuario.activo ? 'Desactivar' : 'Activar'}</span>
                    </button>
                  </div></td>
                </tr>
              )) : (
                <tr><td colSpan="5"><div className="table-message empty"><UsersRound size={28} />No hay usuarios registrados.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal abierto={modal.abierto} titulo={modal.usuario ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setModal({ abierto: false, usuario: null })} ancho="590px">
        <form className="entity-form" onSubmit={guardar}>
          <div className="form-grid">
            <label className="form-field full"><span>Nombre completo *</span><input name="nombreCompleto" value={formulario.nombreCompleto} onChange={actualizarCampo} maxLength="150" required autoFocus /></label>
            <label className="form-field full"><span>Correo electrónico *</span><input name="correo" type="email" value={formulario.correo} onChange={actualizarCampo} required disabled={Boolean(modal.usuario)} /></label>
            {!modal.usuario && <label className="form-field full"><span>Contraseña *</span><input name="password" type="password" value={formulario.password} onChange={actualizarCampo} minLength="8" required autoComplete="new-password" placeholder="Mínimo 8 caracteres" /></label>}
            <label className="form-field"><span>Rol *</span><select name="rol" value={formulario.rol} onChange={actualizarCampo} required>{roles.map((rol) => <option key={rol} value={rol}>{rol}</option>)}</select></label>
            {modal.usuario && <label className="form-field"><span>Estado *</span><select name="activo" value={String(formulario.activo)} onChange={actualizarCampo} required><option value="true">ACTIVO</option><option value="false">INACTIVO</option></select></label>}
          </div>
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setModal({ abierto: false, usuario: null })}>Cancelar</button><button className="primary-button save-button" type="submit" disabled={guardando}>{guardando && <LoaderCircle className="spin" size={18} />}{guardando ? 'Guardando...' : 'Guardar usuario'}</button></div>
        </form>
      </Modal>
    </section>
  )
}
