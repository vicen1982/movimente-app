import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Search, X } from 'lucide-react'
import AsignarRutinaModal from '../../components/layout/AsignarRutinaModal'

const COLORES_AVATAR = [
  'bg-pecho',
  'bg-espalda',
  'bg-piernas',
  'bg-hombros',
  'bg-brazos',
  'bg-core',
  'bg-cardio',
]

const OBJETIVO_COLORES = {
  fuerza: 'bg-pecho',
  hipertrofia: 'bg-brazos',
  resistencia: 'bg-piernas',
  funcional: 'bg-hombros',
  otro: 'bg-border',
}

function obtenerColorAvatar(id) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORES_AVATAR[hash % COLORES_AVATAR.length]
}

function obtenerIniciales(nombre, apellido) {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
}

export default function Socios() {
  const [socios, setSocios] = useState([])
  // Mapa: socio_id → array de asignaciones con rutina
  const [asignacionesPorSocio, setAsignacionesPorSocio] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [socioAsignando, setSocioAsignando] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: sociosData, error: sociosError } = await supabase
        .from('profiles')
        .select('*')
        .eq('rol', 'socio')
        .eq('active', true)
        .order('nombre', { ascending: true })

      if (sociosError) throw sociosError
      setSocios(sociosData || [])

      const { data: asignData, error: asignError } = await supabase
        .from('asignaciones')
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq('activa', true)

      if (asignError) throw asignError

      // Agrupar por socio_id (array por socio)
      const mapa = {}
      ;(asignData || []).forEach((a) => {
        if (!mapa[a.socio_id]) mapa[a.socio_id] = []
        mapa[a.socio_id].push(a)
      })
      setAsignacionesPorSocio(mapa)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sociosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return socios.filter((s) =>
      `${s.nombre} ${s.apellido}`.toLowerCase().includes(q)
    )
  }, [socios, busqueda])

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-text-muted">Mis</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Socios</h1>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar socio..."
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

      {!loading && !error && (
        <p className="text-xs text-text-muted mb-4">
          {sociosFiltrados.length} de {socios.length}{' '}
          {socios.length === 1 ? 'socio' : 'socios'}
        </p>
      )}

      {loading && (
        <p className="text-center text-text-muted py-12">Cargando socios...</p>
      )}

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {!loading && !error && socios.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-brazos rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-text" />
          </div>
          <p className="font-medium mb-1">Sin socios todavía</p>
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            Cuando un socio se registre, va a aparecer acá.
          </p>
        </div>
      )}

      {!loading && !error && socios.length > 0 && sociosFiltrados.length === 0 && (
        <div className="card text-center py-12">
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm text-text-muted mt-1">Probá con otro nombre.</p>
        </div>
      )}

      {!loading && !error && sociosFiltrados.length > 0 && (
        <div className="space-y-2">
          {sociosFiltrados.map((socio) => {
            const asignaciones = asignacionesPorSocio[socio.id] || []
            return (
              <button
                key={socio.id}
                onClick={() => setSocioAsignando(socio)}
                className="card flex items-start gap-4 w-full text-left hover:border-primary transition-colors"
              >
                <div className={`w-12 h-12 ${obtenerColorAvatar(socio.id)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="font-bold text-sm text-text">
                    {obtenerIniciales(socio.nombre, socio.apellido)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {socio.nombre} {socio.apellido}
                  </p>
                  {asignaciones.length === 0 ? (
                    <p className="text-xs text-text-muted">Sin rutinas asignadas</p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-text-muted">
                        {asignaciones.length} rutina{asignaciones.length !== 1 ? 's' : ''}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {asignaciones.map((a) => (
                          <span
                            key={a.id}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${OBJETIVO_COLORES[a.rutina?.objetivo] || 'bg-border'}`}
                          >
                            {a.rutina?.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-text-muted">›</span>
              </button>
            )
          })}
        </div>
      )}

      {socioAsignando && (
        <AsignarRutinaModal
          socio={socioAsignando}
          asignacionesActuales={asignacionesPorSocio[socioAsignando.id] || []}
          onClose={() => setSocioAsignando(null)}
          onCambioAsignaciones={cargarDatos}
        />
      )}
    </div>
  )
}