import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Dumbbell, ClipboardList, Play } from 'lucide-react'

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

const OBJETIVO_COLORES = {
  fuerza: 'bg-pecho',
  hipertrofia: 'bg-brazos',
  resistencia: 'bg-piernas',
  funcional: 'bg-hombros',
  otro: 'bg-border',
}

export default function DashboardSocio() {
  const { profile } = useOutletContext()
  const navigate = useNavigate()
  const [asignaciones, setAsignaciones] = useState([])
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null)
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.id) cargarMisRutinas()
  }, [profile?.id])

  useEffect(() => {
    if (rutinaSeleccionada?.rutina_id) cargarEjercicios(rutinaSeleccionada.rutina_id)
  }, [rutinaSeleccionada?.rutina_id])

  const cargarMisRutinas = async () => {
    try {
      const { data, error } = await supabase
        .from('asignaciones')
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq('socio_id', profile.id)
        .eq('activa', true)
        .order('fecha_asignacion', { ascending: false })

      if (error) throw error

      setAsignaciones(data || [])
      if (data && data.length > 0) setRutinaSeleccionada(data[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cargarEjercicios = async (rutinaId) => {
    const { data } = await supabase
      .from('rutina_ejercicios')
      .select(`
        *,
        ejercicio:ejercicios(*)
      `)
      .eq('rutina_id', rutinaId)
      .order('orden', { ascending: true })

    setEjercicios(data || [])
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-text-muted py-12">Cargando tu rutina...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      </div>
    )
  }

  // Estado vacío: socio sin rutinas asignadas
  if (asignaciones.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-text-muted">¡Hola!</p>
          <h1 className="text-2xl font-serif font-bold mt-1">{profile?.nombre}</h1>
        </div>

        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-piernas rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-text" />
          </div>
          <p className="font-medium mb-1">Tu rutina está en camino</p>
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            Tu entrenador está preparando tu plan personalizado. Vas a verlo acá apenas esté listo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-text-muted">¡Hola!</p>
        <h1 className="text-2xl font-serif font-bold mt-1">{profile?.nombre}</h1>
      </div>

      {/* Selector de rutinas (si tiene más de una) */}
      {asignaciones.length > 1 && (
        <div className="mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
            Elegí qué entrenás hoy
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {asignaciones.map((a) => (
              <button
                key={a.id}
                onClick={() => setRutinaSeleccionada(a)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  rutinaSeleccionada?.id === a.id
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-muted hover:text-text'
                }`}
              >
                {a.rutina?.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card de la rutina seleccionada */}
      {rutinaSeleccionada && (
        <div className="bg-secondary text-white rounded-xl p-5 mb-6">
          <p className="text-xs uppercase tracking-wider text-white/60 mb-1">
            {asignaciones.length === 1 ? 'Tu rutina' : 'Entrenamiento de hoy'}
          </p>
          <h2 className="text-xl font-serif font-bold">{rutinaSeleccionada.rutina.nombre}</h2>
          {rutinaSeleccionada.rutina.descripcion && (
            <p className="text-sm text-white/70 mt-1">{rutinaSeleccionada.rutina.descripcion}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize text-text ${OBJETIVO_COLORES[rutinaSeleccionada.rutina.objetivo]}`}>
              {rutinaSeleccionada.rutina.objetivo}
            </span>
            <span className="text-xs text-white/60">
              {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
        Ejercicios
      </p>

      {ejercicios.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm text-text-muted">
            Esta rutina todavía no tiene ejercicios.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {ejercicios.map((re, idx) => (
            <div key={re.id} className="card flex items-center gap-3">
              <span className="text-text-muted text-sm font-medium w-5 text-center">
                {idx + 1}
              </span>
              <div className={`w-10 h-10 ${COLORES_GRUPO[re.ejercicio?.grupo_muscular]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Dumbbell size={16} className="text-text" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{re.ejercicio?.nombre}</p>
                <p className="text-xs text-text-muted">
                  {re.series_sugeridas} × {re.reps_sugeridas}
                  {re.peso_sugerido ? ` · ${re.peso_sugerido}kg` : ''}
                  {` · ${re.descanso_seg}s descanso`}
                </p>
                {re.notas && (
                  <p className="text-xs text-primary mt-1 italic">📝 {re.notas}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ejercicios.length > 0 && (
        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={() => navigate(`/entrenar/${rutinaSeleccionada.rutina_id}`)}
        >
          <Play size={18} />
          Empezar entrenamiento
        </button>
      )}
    </div>
  )
}