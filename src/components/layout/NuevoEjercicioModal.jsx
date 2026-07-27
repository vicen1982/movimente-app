import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { subirImagenEjercicio } from '../../lib/imagenes'
import { X, ImagePlus } from 'lucide-react'

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
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputArchivo = useRef(null)

  const handleSeleccionarImagen = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let imagenUrl = null
      if (archivo) {
        imagenUrl = await subirImagenEjercicio(archivo)
      }

      const { data, error } = await supabase
        .from('ejercicios')
        .insert({
          nombre: nombre.trim(),
          grupo_muscular: grupoMuscular,
          descripcion: descripcion.trim() || null,
          imagen_url: imagenUrl,
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

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-medium block mb-1.5">
              Imagen del ejercicio <span className="lowercase font-normal">(opcional)</span>
            </label>
            <input
              ref={inputArchivo}
              type="file"
              accept="image/*"
              onChange={handleSeleccionarImagen}
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full h-40 object-cover rounded-xl border border-border"
                />
                <button
                  type="button"
                  onClick={() => { setArchivo(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-lg flex items-center justify-center hover:bg-black/80"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputArchivo.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus size={22} />
                <span className="text-xs">Subir imagen (muestra el músculo trabajado)</span>
              </button>
            )}
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