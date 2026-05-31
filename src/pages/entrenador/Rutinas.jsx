import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ClipboardList, Plus } from 'lucide-react'
import NuevaRutinaModal from '../../components/layout/NuevaRutinaModal'

const OBJETIVO_COLORES = {
  fuerza: 'bg-pecho text-text',
  hipertrofia: 'bg-brazos text-text',
  resistencia: 'bg-piernas text-text',
  funcional: 'bg-hombros text-text',
  otro: 'bg-border text-text',
}

const OBJETIVO_LABELS = {
  fuerza: 'Fuerza',
  hipertrofia: 'Hipertrofia',
  resistencia: 'Resistencia',
  funcional: 'Funcional',
  otro: 'Otro',
}

export default function Rutinas() {
  const navigate = useNavigate()
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    cargarRutinas()
  }, [])

  const cargarRutinas = async () => {
    try {
      const { data, error } = await supabase
        .from('rutinas')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setRutinas(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRutinaCreada = (nueva) => {
    setRutinas((prev) => [nueva, ...prev])
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-sm text-text-muted">Mis</p>
          <h1 className="text-2xl font-serif font-bold mt-1">Rutinas</h1>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-primary text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Contador */}
      {!loading && !error && rutinas.length > 0 && (
        <p className="text-xs text-text-muted mb-4">
          {rutinas.length} {rutinas.length === 1 ? 'rutina' : 'rutinas'}
        </p>
      )}

      {/* Estados */}
      {loading && (
        <p className="text-center text-text-muted py-12">Cargando rutinas...</p>
      )}

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && rutinas.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-piernas rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-text" />
          </div>
          <p className="font-medium mb-1">No tenés rutinas todavía</p>
          <p className="text-sm text-text-muted max-w-xs mx-auto mb-6">
            Creá tu primera rutina combinando ejercicios de la biblioteca.
          </p>
          <button
            onClick={() => setModalAbierto(true)}
            className="btn-primary max-w-xs mx-auto"
          >
            <Plus size={18} className="inline mr-1" />
            Crear primera rutina
          </button>
        </div>
      )}

      {/* Lista (cards clickeables que llevan al detalle) */}
      {!loading && !error && rutinas.length > 0 && (
        <div className="space-y-3">
          {rutinas.map((rutina) => (
            <button
              key={rutina.id}
              onClick={() => navigate(`/rutinas/${rutina.id}`)}
              className="card cursor-pointer hover:border-primary transition-colors w-full text-left"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{rutina.nombre}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OBJETIVO_COLORES[rutina.objetivo] || 'bg-border'}`}>
                  {OBJETIVO_LABELS[rutina.objetivo] || 'Otro'}
                </span>
              </div>
              {rutina.descripcion && (
                <p className="text-xs text-text-muted">{rutina.descripcion}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <NuevaRutinaModal
          onClose={() => setModalAbierto(false)}
          onCreada={handleRutinaCreada}
        />
      )}
    </div>
  )
}