import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Trash2 } from 'lucide-react'

const COLORES_GRUPO = {
  pecho: 'bg-pecho',
  espalda: 'bg-espalda',
  piernas: 'bg-piernas',
  hombros: 'bg-hombros',
  brazos: 'bg-brazos',
  core: 'bg-core',
  cardio: 'bg-cardio',
  otro: 'bg-border',
}

export default function EditarEjercicioRutinaModal({ rutinaEjercicio, onClose, onActualizado, onEliminado }) {
  const [series, setSeries] = useState(rutinaEjercicio.series_sugeridas || 3)
  const [reps, setReps] = useState(rutinaEjercicio.reps_sugeridas || '10')
  const [peso, setPeso] = useState(rutinaEjercicio.peso_sugerido || '')
  const [descanso, setDescanso] = useState(rutinaEjercicio.descanso_seg || 90)
  const [notas, setNotas] = useState(rutinaEjercicio.notas || '')
  const [loading, setLoading] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [error, setError] = useState('')

  const ejercicio = rutinaEjercicio.ejercicio

  const handleGuardar = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('rutina_ejercicios')
        .update({
          series_sugeridas: parseInt(series),
          reps_sugeridas: reps.trim(),
          peso_sugerido: peso ? parseFloat(peso) : null,
          descanso_seg: parseInt(descanso),
          notas: notas.trim() || null,
        })
        .eq('id', rutinaEjercicio.id)
        .select(`
          *,
          ejercicio:ejercicios(*)
        `)
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
        .from('rutina_ejercicios')
        .delete()
        .eq('id', rutinaEjercicio.id)

      if (error) throw error
      onEliminado(rutinaEjercicio.id)
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
          <h2 className="font-serif font-bold text-lg">Configurar ejercicio</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>

        {/* Nombre del ejercicio */}
        <div className="p-4 pb-0">
          <div className="flex items-center gap-3 p-3 bg-bg rounded-lg">
            <div className={`w-10 h-10 ${COLORES_GRUPO[ejercicio?.grupo_muscular]} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className="text-xs font-bold">{ejercicio?.grupo_muscular?.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{ejercicio?.nombre}</p>
              <p className="text-xs text-text-muted capitalize">{ejercicio?.grupo_muscular}</p>
            </div>
          </div>
        </div>

        {!confirmandoEliminar ? (
          <form onSubmit={handleGuardar} className="p-4 space-y-4">
            {/* Series y Reps */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                  Series
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                  Repeticiones
                </label>
                <input
                  type="text"
                  placeholder="Ej: 10 o 8-12"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Peso y Descanso */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                  Peso (kg) <span className="lowercase font-normal">opc.</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Ej: 60"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                  Descanso (seg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={descanso}
                  onChange={(e) => setDescanso(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
                Notas para el socio <span className="lowercase font-normal">(opcional)</span>
              </label>
              <textarea
                placeholder="Ej: codos pegados al torso, bajar en 2 segundos..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input-field resize-none"
                rows={2}
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
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900 mb-1">¿Quitar de la rutina?</p>
              <p className="text-sm text-red-700">
                "{ejercicio?.nombre}" se va a quitar de esta rutina. El ejercicio sigue en la biblioteca.
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
                {loading ? 'Quitando...' : 'Sí, quitar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}