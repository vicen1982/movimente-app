import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Dumbbell, Clock, Activity, Trophy } from 'lucide-react'

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

function formatearFechaCompleta(fechaStr) {
  const fecha = new Date(fechaStr)
  const opciones = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }
  return fecha.toLocaleDateString('es-AR', opciones)
}

export default function DetalleSesion() {
  const { sesionId } = useParams()
  const navigate = useNavigate()
  const [sesion, setSesion] = useState(null)
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarSesion()
  }, [sesionId])

  const cargarSesion = async () => {
    try {
      const { data: sesionData, error: errSesion } = await supabase
        .from('sesiones')
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq('id', sesionId)
        .single()

      if (errSesion) throw errSesion
      setSesion(sesionData)

      const { data: registrosData, error: errRegistros } = await supabase
        .from('registros')
        .select(`
          *,
          ejercicio:ejercicios(*)
        `)
        .eq('sesion_id', sesionId)
        .order('numero_serie', { ascending: true })

      if (errRegistros) throw errRegistros
      setRegistros(registrosData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-text-muted py-12">Cargando sesión...</p>
      </div>
    )
  }

  if (error || !sesion) {
    return (
      <div className="p-6">
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          {error || 'No se encontró la sesión'}
        </div>
        <button onClick={() => navigate('/historial')} className="btn-ghost mt-4">
          Volver
        </button>
      </div>
    )
  }

  // Agrupar registros por ejercicio
  const ejerciciosAgrupados = {}
  registros.forEach((r) => {
    const id = r.ejercicio_id
    if (!ejerciciosAgrupados[id]) {
      ejerciciosAgrupados[id] = {
        ejercicio: r.ejercicio,
        series: [],
      }
    }
    ejerciciosAgrupados[id].series.push(r)
  })

  // Calcular volumen total
  const volumenTotal = registros.reduce(
    (acc, r) => acc + (r.peso_kg * r.reps_realizadas),
    0
  )
  const totalEjercicios = Object.keys(ejerciciosAgrupados).length
  const totalSeries = registros.length

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/historial')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={16} />
        Volver al historial
      </button>

      {/* Header de la sesión */}
      <div className="mb-6">
        <p className="text-sm text-text-muted capitalize">
          {formatearFechaCompleta(sesion.fecha)}
        </p>
        <div className="flex items-start justify-between gap-3 mt-1">
          <h1 className="text-2xl font-serif font-bold flex-1">
            {sesion.rutina?.nombre || 'Sesión'}
          </h1>
          {sesion.rutina?.objetivo && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize flex-shrink-0 ${OBJETIVO_COLORES[sesion.rutina.objetivo]}`}>
              {sesion.rutina.objetivo}
            </span>
          )}
        </div>
        {sesion.rutina?.descripcion && (
          <p className="text-sm text-text-muted mt-1">{sesion.rutina.descripcion}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <Clock size={16} className="text-primary mx-auto mb-2" />
          <p className="text-xl font-bold">{sesion.duracion_min || 0}</p>
          <p className="text-xs text-text-muted">minutos</p>
        </div>
        <div className="card text-center">
          <Activity size={16} className="text-primary mx-auto mb-2" />
          <p className="text-xl font-bold">{totalSeries}</p>
          <p className="text-xs text-text-muted">series</p>
        </div>
        <div className="card text-center">
          <Trophy size={16} className="text-primary mx-auto mb-2" />
          <p className="text-xl font-bold">{volumenTotal.toFixed(0)}</p>
          <p className="text-xs text-text-muted">kg total</p>
        </div>
      </div>

      {/* Lista de ejercicios */}
      <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
        {totalEjercicios} ejercicio{totalEjercicios !== 1 ? 's' : ''}
      </p>

      {totalEjercicios === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm text-text-muted">
            Esta sesión no tiene registros.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(ejerciciosAgrupados).map((item, idx) => {
            // Calcular volumen por ejercicio
            const volumenEjercicio = item.series.reduce(
              (acc, s) => acc + (s.peso_kg * s.reps_realizadas),
              0
            )

            return (
              <div key={item.ejercicio.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-text-muted text-sm font-medium w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className={`w-10 h-10 ${COLORES_GRUPO[item.ejercicio.grupo_muscular]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Dumbbell size={16} className="text-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.ejercicio.nombre}</p>
                    <p className="text-xs text-text-muted capitalize">
                      {item.ejercicio.grupo_muscular} · {volumenEjercicio.toFixed(0)}kg de volumen
                    </p>
                  </div>
                </div>

                {/* Tabla de series */}
                <div className="bg-bg rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 px-3 py-2 text-xs text-text-muted uppercase tracking-wider font-medium border-b border-border">
                    <p>Serie</p>
                    <p className="text-center">Peso</p>
                    <p className="text-right">Reps</p>
                  </div>
                  {item.series.map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-3 px-3 py-2 text-sm border-b border-border last:border-b-0"
                    >
                      <p className="font-medium">S{s.numero_serie}</p>
                      <p className="text-center">
                        {s.peso_kg > 0 ? `${s.peso_kg} kg` : '—'}
                      </p>
                      <p className="text-right font-medium">{s.reps_realizadas}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}