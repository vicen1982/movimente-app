import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { Dumbbell, Plus, Search, X } from 'lucide-react'
import NuevoEjercicioModal from '../../components/layout/NuevoEjercicioModal'
import EditarEjercicioModal from '../../components/layout/EditarEjercicioModal'

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

const GRUPOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'brazos', label: 'Brazos' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
]

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [grupoActivo, setGrupoActivo] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [ejercicioEditando, setEjercicioEditando] = useState(null)

  useEffect(() => {
    cargarEjercicios()
  }, [])

  const cargarEjercicios = async () => {
    try {
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setEjercicios(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const ejerciciosFiltrados = useMemo(() => {
    return ejercicios.filter((ej) => {
      const matchGrupo = grupoActivo === 'todos' || ej.grupo_muscular === grupoActivo
      const matchBusqueda = ej.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return matchGrupo && matchBusqueda
    })
  }, [ejercicios, busqueda, grupoActivo])

  const handleEjercicioCreado = (nuevo) => {
    setEjercicios((prev) =>
      [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
  }

  const handleEjercicioActualizado = (actualizado) => {
    setEjercicios((prev) =>
      prev
        .map((ej) => (ej.id === actualizado.id ? actualizado : ej))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
  }

  const handleEjercicioEliminado = (idEliminado) => {
    setEjercicios((prev) => prev.filter((ej) => ej.id !== idEliminado))
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-sm text-text-muted">Biblioteca</p>
          <h1 className="text-2xl font-serif font-bold mt-1">Ejercicios</h1>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-primary text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-field pl-10 pr-10"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-6 px-6 scrollbar-hide">
        {GRUPOS.map((g) => (
          <button
            key={g.value}
            onClick={() => setGrupoActivo(g.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              grupoActivo === g.value
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      {!loading && !error && (
        <p className="text-xs text-text-muted mb-4">
          {ejerciciosFiltrados.length} de {ejercicios.length}{' '}
          {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
        </p>
      )}

      {/* Estados */}
      {loading && (
        <p className="text-center text-text-muted py-12">Cargando ejercicios...</p>
      )}

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {!loading && !error && ejerciciosFiltrados.length === 0 && (
        <div className="card text-center py-12">
          <Dumbbell size={32} className="mx-auto text-text-muted mb-3" />
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm text-text-muted mt-1">
            Probá con otro filtro o búsqueda.
          </p>
        </div>
      )}

      {/* Lista (cada card abre el modal de editar) */}
      {!loading && !error && ejerciciosFiltrados.length > 0 && (
        <div className="space-y-2">
          {ejerciciosFiltrados.map((ej) => (
            <button
              key={ej.id}
              onClick={() => setEjercicioEditando(ej)}
              className="card flex items-center gap-4 hover:border-primary transition-colors w-full text-left"
            >
              <div
                className={`w-12 h-12 ${COLORES_GRUPO[ej.grupo_muscular] || 'bg-border'} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <Dumbbell size={20} className="text-text" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ej.nombre}</p>
                <p className="text-xs text-text-muted capitalize">
                  {ej.grupo_muscular}
                </p>
              </div>
              <span className="text-text-muted">›</span>
            </button>
          ))}
        </div>
      )}

      {/* Modales */}
      {modalAbierto && (
        <NuevoEjercicioModal
          onClose={() => setModalAbierto(false)}
          onCreado={handleEjercicioCreado}
        />
      )}

      {ejercicioEditando && (
        <EditarEjercicioModal
          ejercicio={ejercicioEditando}
          onClose={() => setEjercicioEditando(null)}
          onActualizado={handleEjercicioActualizado}
          onEliminado={handleEjercicioEliminado}
        />
      )}
    </div>
  )
}