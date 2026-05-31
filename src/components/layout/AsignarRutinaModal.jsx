import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Check, ClipboardList } from 'lucide-react'

const OBJETIVO_COLORES = {
  fuerza: 'bg-pecho',
  hipertrofia: 'bg-brazos',
  resistencia: 'bg-piernas',
  funcional: 'bg-hombros',
  otro: 'bg-border',
}

export default function AsignarRutinaModal({ socio, asignacionesActuales = [], onClose, onCambioAsignaciones }) {
  const [rutinas, setRutinas] = useState([])
  // IDs de las rutinas actualmente asignadas
  const [seleccionadas, setSeleccionadas] = useState(
    new Set(asignacionesActuales.map((a) => a.rutina_id))
  )
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarRutinas()
  }, [])

  const cargarRutinas = async () => {
    const { data } = await supabase
      .from('rutinas')
      .select('*')
      .order('nombre', { ascending: true })
    setRutinas(data || [])
    setLoading(false)
  }

  const toggleRutina = (rutinaId) => {
    setSeleccionadas((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(rutinaId)) nuevo.delete(rutinaId)
      else nuevo.add(rutinaId)
      return nuevo
    })
  }

  const handleGuardar = async () => {
    setError('')
    setGuardando(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const idsActuales = new Set(asignacionesActuales.map((a) => a.rutina_id))

      // Rutinas a agregar (estaban marcadas pero no asignadas antes)
      const paraAgregar = [...seleccionadas].filter((id) => !idsActuales.has(id))

      // Rutinas a desactivar (estaban asignadas pero ya no marcadas)
      const paraDesactivar = asignacionesActuales.filter(
        (a) => !seleccionadas.has(a.rutina_id)
      )

      // Desactivar las que se quitaron
      if (paraDesactivar.length > 0) {
        const idsADesactivar = paraDesactivar.map((a) => a.id)
        const { error: errDesact } = await supabase
          .from('asignaciones')
          .update({ activa: false })
          .in('id', idsADesactivar)
        if (errDesact) throw errDesact
      }

      // Crear las nuevas asignaciones
      if (paraAgregar.length > 0) {
        const nuevas = paraAgregar.map((rutinaId) => ({
          rutina_id: rutinaId,
          socio_id: socio.id,
          asignada_por: user.id,
          activa: true,
        }))

        const { error: errInsert } = await supabase
          .from('asignaciones')
          .insert(nuevas)

        if (errInsert) throw errInsert
      }

      onCambioAsignaciones()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div>
            <h2 className="font-serif font-bold text-lg">Asignar rutinas</h2>
            <p className="text-xs text-text-muted">A {socio.nombre} {socio.apellido}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 pt-3">
          <p className="text-xs text-text-muted">
            Marcá una o más rutinas. Podés combinar varias (ej: superior + inferior + core).
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="text-center text-text-muted py-8 text-sm">Cargando rutinas...</p>
          )}

          {!loading && rutinas.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList size={32} className="mx-auto text-text-muted mb-3" />
              <p className="font-medium text-sm">No hay rutinas creadas</p>
              <p className="text-xs text-text-muted mt-1">
                Creá una rutina primero en la sección Rutinas.
              </p>
            </div>
          )}

          {!loading && rutinas.length > 0 && (
            <div className="space-y-2">
              {rutinas.map((rutina) => {
                const marcada = seleccionadas.has(rutina.id)
                return (
                  <button
                    key={rutina.id}
                    onClick={() => toggleRutina(rutina.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      marcada
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-surface hover:border-primary'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{rutina.nombre}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${OBJETIVO_COLORES[rutina.objetivo]}`}>
                        {rutina.objetivo}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      marcada ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {marcada && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="btn-primary"
          >
            {guardando
              ? 'Guardando...'
              : seleccionadas.size === 0
                ? 'Quitar todas las rutinas'
                : `Asignar ${seleccionadas.size} ${seleccionadas.size === 1 ? 'rutina' : 'rutinas'}`}
          </button>
        </div>
      </div>
    </div>
  )
}