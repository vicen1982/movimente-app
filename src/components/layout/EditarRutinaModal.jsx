import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Trash2 } from 'lucide-react'

const OBJETIVOS = [
  { value: 'fuerza', label: 'Fuerza' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'resistencia', label: 'Resistencia' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'otro', label: 'Otro' },
]

export default function EditarRutinaModal({ rutina, onClose, onActualizada, onEliminada }) {
  const [nombre, setNombre] = useState(rutina.nombre)
  const [objetivo, setObjetivo] = useState(rutina.objetivo)
  const [descripcion, setDescripcion] = useState(rutina.descripcion || '')
  const [loading, setLoading] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [error, setError] = useState('')

  const handleGuardar = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('rutinas')
        .update({
          nombre: nombre.trim(),
          objetivo,
          descripcion: descripcion.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rutina.id)
        .select()
        .single()

      if (error) throw error
      onActualizada(data)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase
        .from('rutinas')
        .delete()
        .eq('id', rutina.id)

      if (error) throw error
      onEliminada(rutina.id)
      onClose()
    } catch (err) {
      setError(err.message)
      setConfirmandoEliminar(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface flex justify-between items-center p-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg">Editar rutina</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>

        {!confirmandoEliminar ? (
          <form onSubmit={handleGuardar} className="p-4 space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                Nombre de la rutina
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-field"
                required
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
                onClick={() => setConfirmandoEliminar(true)}
                className="bg-red-50 text-red-600 border border-red-200 font-medium py-3 px-4 rounded-lg hover:bg-red-100 transition-colors"
                disabled={loading}
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading || !nombre.trim()}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900 mb-1">¿Eliminar rutina?</p>
              <p className="text-sm text-red-700">
                "{rutina.nombre}" y todos sus ejercicios se van a borrar permanentemente. Esta acción no se puede deshacer.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                className="btn-ghost flex-1"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                className="bg-red-600 text-white font-medium py-3 px-4 rounded-lg flex-1 hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}