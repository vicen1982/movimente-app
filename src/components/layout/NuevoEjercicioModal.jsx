import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'

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

export default function NuevoEjercicioModal({ onClose, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [grupoMuscular, setGrupoMuscular] = useState('pecho')
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
        .from('ejercicios')
        .insert({
          nombre: nombre.trim(),
          grupo_muscular: grupoMuscular,
          descripcion: descripcion.trim() || null,
          creado_por: user.id,
        })
        .select()
        .single()

      if (error) throw error

      onCreado(data)
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
        {/* Header del modal */}
        <div className="sticky top-0 bg-surface flex justify-between items-center p-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg">Nuevo ejercicio</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text"
          >
            <X size={22} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
              Nombre del ejercicio
            </label>
            <input
              type="text"
              placeholder="Ej: Press inclinado con barra"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              required
              autoFocus
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
              placeholder="Notas o instrucciones para realizar el ejercicio..."
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
              {loading ? 'Creando...' : 'Crear ejercicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}