import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'

const OBJETIVOS = [
  { value: 'fuerza', label: 'Fuerza' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'resistencia', label: 'Resistencia' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'otro', label: 'Otro' },
]

export default function NuevaRutinaModal({ onClose, onCreada }) {
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('hipertrofia')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('rutinas')
        .insert({
          nombre: nombre.trim(),
          objetivo,
          descripcion: descripcion.trim() || null,
          creada_por: user.id,
        })
        .select()
        .single()

      if (error) throw error

      onCreada(data)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface flex justify-between items-center p-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg">Nueva rutina</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
              Nombre de la rutina
            </label>
            <input
              type="text"
              placeholder="Ej: Tren Superior"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
              Objetivo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {OBJETIVOS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setObjetivo(o.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                    objetivo === o.value
                      ? 'bg-primary text-white'
                      : 'bg-bg border border-border text-text-muted'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
              Descripción <span className="lowercase font-normal">(opcional)</span>
            </label>
            <textarea
              placeholder="Ej: Rutina para ganar masa muscular en torso..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="input-field resize-none"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !nombre.trim()}
            >
              {loading ? 'Creando...' : 'Crear rutina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}