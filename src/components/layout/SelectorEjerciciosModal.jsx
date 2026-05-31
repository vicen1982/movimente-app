import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Search, Dumbbell, Check } from 'lucide-react'

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

export default function SelectorEjerciciosModal({ onClose, onAgregar, ejerciciosYaAgregados = [] }) {
  const [ejercicios, setEjercicios] = useState([])
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEjercicios()
  }, [])

  const cargarEjercicios = async () => {
    const { data } = await supabase
      .from('ejercicios')
      .select('*')
      .order('nombre', { ascending: true })
    setEjercicios(data || [])
    setLoading(false)
  }

  const ejerciciosFiltrados = useMemo(() => {
    return ejercicios.filter((ej) =>
      ej.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      !ejerciciosYaAgregados.includes(ej.id)
    )
  }, [ejercicios, busqueda, ejerciciosYaAgregados])

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  const handleAgregar = () => {
    const ejerciciosAEnviar = ejercicios.filter((e) => seleccionados.has(e.id))
    onAgregar(ejerciciosAEnviar)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg">Agregar ejercicios</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>

        {/* Buscador */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Lista scrolleable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <p className="text-center text-text-muted py-8 text-sm">Cargando...</p>
          )}

          {!loading && ejerciciosFiltrados.length === 0 && (
            <p className="text-center text-text-muted py-8 text-sm">
              {ejerciciosYaAgregados.length > 0
                ? 'No hay más ejercicios para agregar'
                : 'Sin resultados'}
            </p>
          )}

          <div className="space-y-2">
            {ejerciciosFiltrados.map((ej) => {
              const seleccionado = seleccionados.has(ej.id)
              return (
                <button
                  key={ej.id}
                  onClick={() => toggleSeleccion(ej.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    seleccionado
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-surface hover:border-primary'
                  }`}
                >
                  <div className={`w-10 h-10 ${COLORES_GRUPO[ej.grupo_muscular]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Dumbbell size={16} className="text-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ej.nombre}</p>
                    <p className="text-xs text-text-muted capitalize">{ej.grupo_muscular}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    seleccionado ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {seleccionado && <Check size={14} className="text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleAgregar}
            disabled={seleccionados.size === 0}
            className="btn-primary"
          >
            Agregar {seleccionados.size > 0 && `(${seleccionados.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}