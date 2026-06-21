import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, TrendingUp, Trophy, ChevronDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'

function formatearFechaCorta(fechaStr) {
  const fecha = new Date(fechaStr)
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function TooltipCustom({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="bg-secondary text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium">{data.fecha}</p>
      <p className="text-white/80">{data.pesoMax} kg</p>
      <p className="text-white/60">{data.reps} reps</p>
    </div>
  )
}

export default function ProgresoSocio() {
  const { socioId } = useParams()
  const navigate = useNavigate()
  const [socio, setSocio] = useState(null)
  const [ejercicios, setEjercicios] = useState([])
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null)
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingRegistros, setLoadingRegistros] = useState(false)
  const [error, setError] = useState('')
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [socioId])

  useEffect(() => {
    if (ejercicioSeleccionado) cargarRegistros(ejercicioSeleccionado.id)
  }, [ejercicioSeleccionado])

  const cargarDatos = async () => {
    try {
      const { data: perfil, error: errPerfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', socioId)
        .single()

      if (errPerfil) throw errPerfil
      setSocio(perfil)

      const { data: sesionesData, error: errSesiones } = await supabase
        .from('sesiones')
        .select('id')
        .eq('socio_id', socioId)
        .eq('completada', true)

      if (errSesiones) throw errSesiones
      if (!sesionesData || sesionesData.length === 0) {
        setLoading(false)
        return
      }

      const sesionIds = sesionesData.map((s) => s.id)

      const { data: registrosData, error: errReg } = await supabase
        .from('registros')
        .select('ejercicio_id, ejercicio:ejercicios(id, nombre, grupo_muscular)')
        .in('sesion_id', sesionIds)

      if (errReg) throw errReg

      const vistos = new Set()
      const ejerciciosUnicos = []
      ;(registrosData || []).forEach((r) => {
        if (r.ejercicio && !vistos.has(r.ejercicio_id)) {
          vistos.add(r.ejercicio_id)
          ejerciciosUnicos.push(r.ejercicio)
        }
      })

      ejerciciosUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre))
      setEjercicios(ejerciciosUnicos)
      if (ejerciciosUnicos.length > 0) setEjercicioSeleccionado(ejerciciosUnicos[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cargarRegistros = async (ejercicioId) => {
    setLoadingRegistros(true)
    try {
      const { data: sesionesData } = await supabase
        .from('sesiones')
        .select('id, fecha')
        .eq('socio_id', socioId)
        .eq('completada', true)
        .order('fecha', { ascending: true })

      const sesionIds = (sesionesData || []).map((s) => s.id)
      const fechaPorSesion = {}
      ;(sesionesData || []).forEach((s) => { fechaPorSesion[s.id] = s.fecha })

      const { data, error: errReg } = await supabase
        .from('registros')
        .select('sesion_id, peso_kg, reps_realizadas')
        .eq('ejercicio_id', ejercicioId)
        .in('sesion_id', sesionIds)

      if (errReg) throw errReg

      const porSesion = {}
      ;(data || []).forEach((r) => {
        const sid = r.sesion_id
        if (!porSesion[sid] || r.peso_kg > porSesion[sid].pesoMax) {
          porSesion[sid] = {
            sesionId: sid,
            pesoMax: r.peso_kg || 0,
            reps: r.reps_realizadas || 0,
            fechaRaw: fechaPorSesion[sid],
            fecha: formatearFechaCorta(fechaPorSesion[sid]),
          }
        }
      })

      const puntos = Object.values(porSesion).sort(
        (a, b) => new Date(a.fechaRaw) - new Date(b.fechaRaw)
      )
      setRegistros(puntos)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingRegistros(false)
    }
  }

  const recordPersonal = useMemo(() => {
    if (registros.length === 0) return null
    return registros.reduce((max, r) => (r.pesoMax > max.pesoMax ? r : max), registros[0])
  }, [registros])

  const tendencia = useMemo(() => {
    if (registros.length < 2) return null
    const primero = registros[0].pesoMax
    const ultimo = registros[registros.length - 1].pesoMax
    const diff = ultimo - primero
    return { diff, porcentaje: primero > 0 ? ((diff / primero) * 100).toFixed(1) : 0 }
  }, [registros])

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-text-muted py-12">Cargando progreso...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/socios')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={16} />
        Volver a socios
      </button>

      <div className="mb-6">
        <p className="text-sm text-text-muted">Progreso de</p>
        <h1 className="text-2xl font-serif font-bold mt-1">
          {socio?.nombre} {socio?.apellido}
        </h1>
      </div>

      {ejercicios.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-piernas rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-text" />
          </div>
          <p className="font-medium mb-1">Sin entrenamientos todavía</p>
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            {socio?.nombre} no completó ningún entrenamiento aún.
          </p>
        </div>
      ) : (
        <>
          {/* Selector de ejercicio */}
          <div className="relative mb-5">
            <button
              onClick={() => setSelectorAbierto((v) => !v)}
              className="w-full card flex items-center justify-between gap-2 text-left"
            >
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-0.5">
                  Ejercicio
                </p>
                <p className="font-medium">{ejercicioSeleccionado?.nombre}</p>
                <p className="text-xs text-text-muted capitalize">
                  {ejercicioSeleccionado?.grupo_muscular}
                </p>
              </div>
              <ChevronDown
                size={18}
                className={`text-text-muted flex-shrink-0 transition-transform ${selectorAbierto ? 'rotate-180' : ''}`}
              />
            </button>

            {selectorAbierto && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                {ejercicios.map((ej) => (
                  <button
                    key={ej.id}
                    onClick={() => {
                      setEjercicioSeleccionado(ej)
                      setSelectorAbierto(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm border-b border-border last:border-b-0 transition-colors ${
                      ej.id === ejercicioSeleccionado?.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-bg'
                    }`}
                  >
                    <p className="font-medium">{ej.nombre}</p>
                    <p className="text-xs text-text-muted capitalize">{ej.grupo_muscular}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingRegistros ? (
            <p className="text-center text-text-muted py-12 text-sm">Cargando datos...</p>
          ) : registros.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-sm text-text-muted">
                No hay registros para este ejercicio todavía.
              </p>
            </div>
          ) : (
            <>
              {/* Récord personal + tendencia */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="card">
                  <Trophy size={14} className="text-accent mb-1" />
                  <p className="text-xl font-bold">{recordPersonal?.pesoMax} kg</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Récord personal</p>
                </div>
                <div className="card">
                  <TrendingUp
                    size={14}
                    className={`mb-1 ${tendencia && tendencia.diff >= 0 ? 'text-primary' : 'text-red-400'}`}
                  />
                  {tendencia ? (
                    <>
                      <p className={`text-xl font-bold ${tendencia.diff >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {tendencia.diff >= 0 ? '+' : ''}{tendencia.diff} kg
                      </p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">
                        {tendencia.diff >= 0 ? '+' : ''}{tendencia.porcentaje}% total
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold">—</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Tendencia</p>
                    </>
                  )}
                </div>
              </div>

              {/* Gráfico */}
              <div className="card mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                      Peso máximo por sesión
                    </p>
                    <p className="text-sm font-medium mt-0.5">{registros.length} registros</p>
                  </div>
                  <TrendingUp size={18} className="text-primary" />
                </div>

                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={registros} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 10, fill: '#6B6B6B' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<TooltipCustom />} />
                      {recordPersonal && (
                        <ReferenceLine
                          y={recordPersonal.pesoMax}
                          stroke="#BA7517"
                          strokeDasharray="4 3"
                          strokeWidth={1.5}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="pesoMax"
                        stroke="#E85A0C"
                        strokeWidth={2.5}
                        dot={{ fill: '#E85A0C', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#E85A0C' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-text-muted text-center mt-2">
                  Línea punteada = récord personal ({recordPersonal?.pesoMax} kg)
                </p>
              </div>

              {/* Historial de cargas */}
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
                Historial de cargas
              </p>
              <div className="space-y-2">
                {[...registros].reverse().map((r) => (
                  <div key={r.sesionId} className="card flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.fecha}</p>
                      <p className="text-xs text-text-muted">{r.reps} reps</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${r.pesoMax === recordPersonal?.pesoMax ? 'text-accent' : 'text-text'}`}>
                        {r.pesoMax} kg
                      </p>
                      {r.pesoMax === recordPersonal?.pesoMax && (
                        <p className="text-[10px] text-accent uppercase tracking-wider font-medium">PR</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
