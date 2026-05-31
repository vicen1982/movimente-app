import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Plus, Dumbbell, Pencil } from 'lucide-react'
import SelectorEjerciciosModal from '../../components/layout/SelectorEjerciciosModal'
import EditarEjercicioRutinaModal from '../../components/layout/EditarEjercicioRutinaModal'
import EditarRutinaModal from '../../components/layout/EditarRutinaModal'

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

export default function DetalleRutina() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rutina, setRutina] = useState(null)
  const [ejerciciosRutina, setEjerciciosRutina] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false)
  const [ejercicioEditando, setEjercicioEditando] = useState(null)
  const [modalEditarRutinaAbierto, setModalEditarRutinaAbierto] = useState(false)

  useEffect(() => {
    cargarRutina()
  }, [id])

  const cargarRutina = async () => {
    try {
      const { data: rutinaData, error: rutinaError } = await supabase
        .from('rutinas')
        .select('*')
        .eq('id', id)
        .single()

      if (rutinaError) throw rutinaError
      setRutina(rutinaData)

      const { data: ejerciciosData, error: ejerciciosError } = await supabase
        .from('rutina_ejercicios')
        .select(`
          *,
          ejercicio:ejercicios(*)
        `)
        .eq('rutina_id', id)
        .order('orden', { ascending: true })

      if (ejerciciosError) throw ejerciciosError
      setEjerciciosRutina(ejerciciosData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarEjercicios = async (ejerciciosSeleccionados) => {
    const ordenInicial = ejerciciosRutina.length
    const nuevos = ejerciciosSeleccionados.map((ej, idx) => ({
      rutina_id: id,
      ejercicio_id: ej.id,
      orden: ordenInicial + idx + 1,
      series_sugeridas: 3,
      reps_sugeridas: '10',
      descanso_seg: 90,
    }))

    const { data, error } = await supabase
      .from('rutina_ejercicios')
      .insert(nuevos)
      .select(`
        *,
        ejercicio:ejercicios(*)
      `)

    if (error) {
      setError(error.message)
      return
    }

    setEjerciciosRutina((prev) => [...prev, ...data])
  }

  const handleEjercicioActualizado = (actualizado) => {
    setEjerciciosRutina((prev) =>
      prev.map((re) => (re.id === actualizado.id ? actualizado : re))
    )
  }

  const handleEjercicioEliminado = (idEliminado) => {
    setEjerciciosRutina((prev) => prev.filter((re) => re.id !== idEliminado))
  }

  const handleRutinaActualizada = (actualizada) => {
    setRutina(actualizada)
  }

  const handleRutinaEliminada = () => {
    navigate('/rutinas')
  }

  if (loading) {
    return <p className="text-center text-text-muted py-12">Cargando rutina...</p>
  }

  if (error || !rutina) {
    return (
      <div className="p-6">
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          {error || 'Rutina no encontrada'}
        </div>
      </div>
    )
  }

  const ejerciciosYaAgregados = ejerciciosRutina.map((re) => re.ejercicio_id)

  return (
    <div className="p-6">
      {/* Volver */}
      <button
        onClick={() => navigate('/rutinas')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={16} />
        Volver a rutinas
      </button>

      {/* Header de rutina con botón editar */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h1 className="text-2xl font-serif font-bold flex-1">{rutina.nombre}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${OBJETIVO_COLORES[rutina.objetivo]}`}>
              {rutina.objetivo}
            </span>
            <button
              onClick={() => setModalEditarRutinaAbierto(true)}
              className="p-2 text-text-muted hover:text-text hover:bg-bg rounded-lg transition-colors"
              title="Editar rutina"
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>
        {rutina.descripcion && (
          <p className="text-sm text-text-muted">{rutina.descripcion}</p>
        )}
      </div>

      {/* Encabezado lista */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
          {ejerciciosRutina.length === 0
            ? 'Sin ejercicios'
            : `${ejerciciosRutina.length} ejercicio${ejerciciosRutina.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setModalAgregarAbierto(true)}
          className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:opacity-90"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Lista o vacío */}
      {ejerciciosRutina.length === 0 ? (
        <div className="card text-center py-12">
          <Dumbbell size={32} className="mx-auto text-text-muted mb-3" />
          <p className="font-medium mb-1">Tu rutina está vacía</p>
          <p className="text-sm text-text-muted">
            Agregá ejercicios desde la biblioteca.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ejerciciosRutina.map((re, idx) => (
            <button
              key={re.id}
              onClick={() => setEjercicioEditando(re)}
              className="card flex items-center gap-3 w-full text-left hover:border-primary transition-colors"
            >
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
              <span className="text-text-muted">›</span>
            </button>
          ))}
        </div>
      )}

      {/* Modales */}
      {modalAgregarAbierto && (
        <SelectorEjerciciosModal
          onClose={() => setModalAgregarAbierto(false)}
          onAgregar={handleAgregarEjercicios}
          ejerciciosYaAgregados={ejerciciosYaAgregados}
        />
      )}

      {ejercicioEditando && (
        <EditarEjercicioRutinaModal
          rutinaEjercicio={ejercicioEditando}
          onClose={() => setEjercicioEditando(null)}
          onActualizado={handleEjercicioActualizado}
          onEliminado={handleEjercicioEliminado}
        />
      )}

      {modalEditarRutinaAbierto && (
        <EditarRutinaModal
          rutina={rutina}
          onClose={() => setModalEditarRutinaAbierto(false)}
          onActualizada={handleRutinaActualizada}
          onEliminada={handleRutinaEliminada}
        />
      )}
    </div>
  )
}