import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { X, Dumbbell, Minus, Plus, Check, SkipForward } from 'lucide-react'
 
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
 
export default function Entrenar() {
  const { rutinaId } = useParams()
  const navigate = useNavigate()
  const [rutina, setRutina] = useState(null)
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sesionId, setSesionId] = useState(null)
  const [indexEjercicio, setIndexEjercicio] = useState(0)
  const [serieActual, setSerieActual] = useState(1)
  const [peso, setPeso] = useState('0')
  const [reps, setReps] = useState('10')
  const [guardando, setGuardando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [horaInicio] = useState(Date.now())
  const [descansando, setDescansando] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [duracionDescanso, setDuracionDescanso] = useState(90)
 
  useEffect(() => {
    cargarRutina()
  }, [rutinaId])
 
  useEffect(() => {
    if (ejercicios.length > 0 && ejercicios[indexEjercicio]) {
      const e = ejercicios[indexEjercicio]
      setPeso(e.peso_sugerido ? String(e.peso_sugerido) : '0')
      setReps(e.reps_sugeridas?.split('-')[0] || '10')
    }
  }, [indexEjercicio, ejercicios])
 
  useEffect(() => {
    if (!descansando) return
    if (segundosRestantes <= 0) {
      setDescansando(false)
      return
    }
    const timer = setTimeout(() => {
      setSegundosRestantes((s) => s - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [descansando, segundosRestantes])
 
  const cargarRutina = async () => {
    try {
      const { data: rutinaData, error: rutinaError } = await supabase
        .from('rutinas')
        .select('*')
        .eq('id', rutinaId)
        .single()
      if (rutinaError) throw rutinaError
      setRutina(rutinaData)
      const { data: ejerciciosData, error: ejerciciosError } = await supabase
        .from('rutina_ejercicios')
        .select('*, ejercicio:ejercicios(*)')
        .eq('rutina_id', rutinaId)
        .order('orden', { ascending: true })
      if (ejerciciosError) throw ejerciciosError
      setEjercicios(ejerciciosData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
 
  const crearSesionSiHaceFalta = async () => {
    if (sesionId) return sesionId
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: errSesion } = await supabase
      .from('sesiones')
      .insert({ socio_id: user.id, rutina_id: rutinaId, completada: false })
      .select()
      .single()
    if (errSesion) throw errSesion
    setSesionId(data.id)
    return data.id
  }
 
  const completarSesion = async () => {
    if (!sesionId) return
    const duracionMin = Math.max(1, Math.round((Date.now() - horaInicio) / 60000))
    await supabase
      .from('sesiones')
      .update({ completada: true, duracion_min: duracionMin })
      .eq('id', sesionId)
  }
 
  const iniciarDescanso = (segs) => {
    setDuracionDescanso(segs)
    setSegundosRestantes(segs)
    setDescansando(true)
  }
 
  const saltarDescanso = () => {
    setDescansando(false)
    setSegundosRestantes(0)
  }
 
  const handleCompletarSerie = async () => {
    setError('')
    setGuardando(true)
    try {
      const id = await crearSesionSiHaceFalta()
      const ejercicioActual = ejercicios[indexEjercicio]
      const { error: errRegistro } = await supabase
        .from('registros')
        .insert({
          sesion_id: id,
          ejercicio_id: ejercicioActual.ejercicio_id,
          numero_serie: serieActual,
          peso_kg: parseFloat(peso) || 0,
          reps_realizadas: parseInt(reps) || 0,
        })
      if (errRegistro) throw errRegistro
      const seriesTotales = ejercicioActual.series_sugeridas
      const segundosDescanso = ejercicioActual.descanso_seg || 90
      if (serieActual < seriesTotales) {
        setSerieActual(serieActual + 1)
        iniciarDescanso(segundosDescanso)
      } else if (indexEjercicio < ejercicios.length - 1) {
        setIndexEjercicio(indexEjercicio + 1)
        setSerieActual(1)
        iniciarDescanso(segundosDescanso)
      } else {
        await completarSesion()
        setCompletado(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }
 
  const handleSalir = () => {
    if (window.confirm('Salir del entrenamiento? Vas a perder lo que estes haciendo.')) {
      navigate('/mi-rutina')
    }
  }
 
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-muted">Preparando entrenamiento...</p>
      </div>
    )
  }
 
  if (error || !rutina || ejercicios.length === 0) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          {error || 'No se encontro la rutina o no tiene ejercicios.'}
        </div>
        <button onClick={() => navigate('/mi-rutina')} className="btn-ghost mt-4">
          Volver
        </button>
      </div>
    )
  }
 
  if (completado) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
          <Check size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2">Entrenamiento completo!</h1>
        <p className="text-sm text-text-muted text-center mb-6 max-w-xs">
          Bien hecho. Tus registros quedaron guardados.
        </p>
        <button onClick={() => navigate('/mi-rutina')} className="btn-primary max-w-xs">
          Volver al inicio
        </button>
      </div>
    )
  }
 
  const ejercicioActual = ejercicios[indexEjercicio]
  const totalEjercicios = ejercicios.length
  const seriesTotales = ejercicioActual.series_sugeridas
  const seriesCompletadas =
    ejercicios.slice(0, indexEjercicio).reduce((acc, e) => acc + e.series_sugeridas, 0) +
    (serieActual - 1)
  const seriesTotalesTodas = ejercicios.reduce((acc, e) => acc + e.series_sugeridas, 0)
  const progresoPct = (seriesCompletadas / seriesTotalesTodas) * 100
 
  if (descansando) {
    const progresoDescanso = ((duracionDescanso - segundosRestantes) / duracionDescanso) * 100
    const radio = 90
    const circunferencia = 2 * Math.PI * radio
    const offset = circunferencia - (progresoDescanso / 100) * circunferencia
    let proximoTexto = 'Serie ' + serieActual + ' de ' + seriesTotales
    let proximoNombre = ejercicioActual.ejercicio?.nombre
    if (serieActual === 1 && indexEjercicio > 0) {
      proximoTexto = 'Ejercicio ' + (indexEjercicio + 1) + ' de ' + totalEjercicios
    }
 
    return (
      <div className="min-h-screen bg-secondary text-white flex flex-col">
        <div className="p-4">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs text-white/60">Descansando</p>
              <p className="text-sm font-medium">{rutina.nombre}</p>
            </div>
            <button onClick={handleSalir} className="text-white/60 hover:text-white p-1">
              <X size={22} />
            </button>
          </div>
        </div>
        <main className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center p-6">
          <p className="text-xs uppercase tracking-wider text-white/60 mb-6">
            Descanso entre series
          </p>
          <div className="relative mb-8">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r={radio} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
              <circle
                cx="110"
                cy="110"
                r={radio}
                fill="none"
                stroke="#E85A0C"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circunferencia}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-6xl font-bold tabular-nums">{segundosRestantes}</p>
              <p className="text-sm text-white/60 mt-1">segundos</p>
            </div>
          </div>
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2">A continuacion</p>
            <p className="text-lg font-medium">{proximoNombre}</p>
            <p className="text-sm text-white/60 mt-1">{proximoTexto}</p>
          </div>
          <button
            onClick={saltarDescanso}
            className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
          >
            <SkipForward size={18} />
            Saltar descanso
          </button>
        </main>
      </div>
    )
  }
 
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="bg-secondary text-white p-4 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex-1">
            <p className="text-xs text-white/60">{rutina.nombre}</p>
            <p className="text-sm font-medium">
              Ejercicio {indexEjercicio + 1} de {totalEjercicios}
            </p>
          </div>
          <button onClick={handleSalir} className="text-white/60 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>
        <div className="max-w-md mx-auto mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: progresoPct + '%' }} />
        </div>
      </div>
      <main className="flex-1 max-w-md mx-auto w-full p-6">
        <div className={'w-20 h-20 ' + COLORES_GRUPO[ejercicioActual.ejercicio?.grupo_muscular] + ' rounded-2xl flex items-center justify-center mx-auto mb-4'}>
          <Dumbbell size={36} className="text-text" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-center mb-1">
          {ejercicioActual.ejercicio?.nombre}
        </h1>
        <p className="text-sm text-text-muted text-center capitalize mb-4">
          {ejercicioActual.ejercicio?.grupo_muscular}
        </p>
        <div className="card bg-bg border-border mb-5">
          <div className="flex justify-around items-center text-center">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Series</p>
              <p className="text-lg font-bold mt-1">{seriesTotales}</p>
            </div>
            <div className="w-px h-10 bg-border"></div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Reps</p>
              <p className="text-lg font-bold mt-1">{ejercicioActual.reps_sugeridas}</p>
            </div>
            {ejercicioActual.peso_sugerido && (
              <>
                <div className="w-px h-10 bg-border"></div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Peso</p>
                  <p className="text-lg font-bold mt-1">{ejercicioActual.peso_sugerido}kg</p>
                </div>
              </>
            )}
          </div>
          {ejercicioActual.notas && (
            <p className="text-sm text-primary italic mt-3 pt-3 border-t border-border">
              {ejercicioActual.notas}
            </p>
          )}
        </div>
        <div className="text-center mb-6">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
            Serie {serieActual} de {seriesTotales}
          </p>
          <div className="flex justify-center gap-2">
            {Array.from({ length: seriesTotales }).map((_, i) => {
              const numero = i + 1
              const completada = numero < serieActual
              const esActual = numero === serieActual
              let claseNumero = 'bg-bg border border-border text-text-muted'
              if (completada) claseNumero = 'bg-primary text-white'
              else if (esActual) claseNumero = 'bg-primary-light text-primary border-2 border-primary'
              return (
                <div
                  key={i}
                  className={'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ' + claseNumero}
                >
                  {completada ? <Check size={16} /> : numero}
                </div>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">Peso (kg)</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPeso(String(Math.max(0, (parseFloat(peso) || 0) - 2.5)))}
                className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-text active:bg-border transition-colors"
                disabled={guardando}
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                step="0.5"
                min="0"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="w-20 text-3xl font-bold text-center bg-transparent border-0 focus:outline-none p-0"
                disabled={guardando}
              />
              <button
                onClick={() => setPeso(String((parseFloat(peso) || 0) + 2.5))}
                className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-text active:bg-border transition-colors"
                disabled={guardando}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="card text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">Reps</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setReps(String(Math.max(0, (parseInt(reps) || 0) - 1)))}
                className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-text active:bg-border transition-colors"
                disabled={guardando}
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                min="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-16 text-3xl font-bold text-center bg-transparent border-0 focus:outline-none p-0"
                disabled={guardando}
              />
              <button
                onClick={() => setReps(String((parseInt(reps) || 0) + 1))}
                className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-text active:bg-border transition-colors"
                disabled={guardando}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {error}
          </p>
        )}
      </main>
      <div className="max-w-md mx-auto w-full p-6 pt-0">
        <button
          onClick={handleCompletarSerie}
          disabled={guardando || peso === '' || !reps}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Check size={20} />
          {guardando ? 'Guardando...' : 'Completar serie'}
        </button>
      </div>
    </div>
  )
}