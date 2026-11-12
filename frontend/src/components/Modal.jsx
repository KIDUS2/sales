import { X } from 'lucide-react'
export default function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row"><h2>{title}</h2><button className="btn sm" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        {children}
      </div>
    </div>
  )
}
export const Field = ({ label, children }) => <label className="field">{label}{children}</label>
