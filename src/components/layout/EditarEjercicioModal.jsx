import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Trash2 } from 'lucide-react'

const GRUPOS = [
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'brazos', label: 'Brazos' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'otro', label: 'Otro' },
]

export default function EditarEjercicioModal({ ejercicio, onClose, onActualizado, onEliminado }) {
  const [nombre, setNombre] = useState(ejercicio.nombre)
  const [grupoMuscular, setGrupoMuscular] = useState(ejercicio.grupo_muscular)
  const [descripcion, setDescripcion] = useState(ejercicio.descripcion || '')
  const [loading, setLoading] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [error, setError] = useState('')

  const handleGuardar = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('ejercicios')
        .update({
          nombre: nombre.trim(),
          grupo_muscular: grupoMuscular,
          descripcion: descripcion.trim() || null,
        })
        .eq('id', ejercicio.id)
        .select()
        .single()

      if (error) throw error

      onActualizado(data)
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
        .from('ejercicios')
        .delete()
        .eq('id', ejercicio.id)

      if (error) throw error

      onEliminado(ejercicio.id)
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
        {/* Header del modal */}
        <div className="sticky top-0 bg-surface flex justify-between items-center p-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg">Editar ejercicio</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>

        {/* Contenido: formulario o confirmación de eliminar */}
        {!confirmandoEliminar ? (
          <form onSubmit={handleGuardar} className="p-4 space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                Nombre del ejercicio
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
                Grupo muscular
              </label>
              <div className="grid grid-cols-4 gap-2">
                {GRUPOS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGrupoMuscular(g.value)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                      grupoMuscular === g.value
                        ? 'bg-primary text-white'
                        : 'bg-bg border border-border text-text-muted'
                    }`}
                  >
                    {g.label}
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
              <p className="font-medium text-red-900 mb-1">¿Eliminar ejercicio?</p>
              <p className="text-sm text-red-700">
                "{ejercicio.nombre}" se va a borrar permanentemente. Esta acción no se puede deshacer.
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