import { X } from 'lucide-react'

export default function Modal({ abierto, titulo, children, onClose, ancho = '560px' }) {
  if (!abierto) return null
  const cerrarDesdeOverlay = (event) => {
    if (event.target === event.currentTarget) onClose()
  }
  return (
    <div className="modal-overlay" onMouseDown={cerrarDesdeOverlay} role="presentation">
      <section className="modal" style={{ maxWidth: ancho }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <h2 id="modal-title">{titulo}</h2>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="modal__content">{children}</div>
      </section>
    </div>
  )
}
