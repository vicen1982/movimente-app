import { useEffect, useState, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Calendar, Clock, Activity, ChevronRight, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const OBJETIVO_COLORES = {
  fuerza: 'bg-pecho',
  hipertrofia: 'bg-brazos',
  resistencia: 'bg-piernas',
  funcional: 'bg-hombros',
  otro: 'bg-border',
}

function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr)
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const diffDias = Math.floor((inicioHoy - inicioFecha) / (1000 * 60 * 60 * 24))

  if (diffDias === 0) return 'Hoy'
  if (diffDias === 1) return 'Ayer'
  if (diffDias < 7) return `Hace ${diffDias} días`

  const opciones = { day: 'numeric', month: 'long' }
  return fecha.toLocaleDateString('es-AR', opciones)
}

function formatearHora(fechaStr) {
  const fecha = new Date(fechaStr)
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// Obtiene el lunes de la semana de una fecha
function obtenerInicioSemana(fecha) {
  const f = new Date(fecha)
  const dia = f.getDay()
  const diff = f.getDate() - dia + (dia === 0 ? -6 : 1) // ajuste si es domingo
  return new Date(f.getFullYear(), f.getMonth(), diff)
}

// Etiqueta de semana: "12 May" (lunes de esa semana)
function etiquetaSemana(fecha) {
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// Tooltip custom para el gráfico
function TooltipCustom({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="bg-secondary text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium">Semana del {data.semana}</p>
      <p className="text-white/80">{data.volumen.toFixed(0)} kg de volumen</p>
      <p className="text-white/60">{data.sesiones} sesion{data.sesiones !== 1 ? 'es' : ''}</p>
    </div>
  )
}

export default function Historial() {
  const { profile } = useOutletContext()
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [statsSesiones, setStatsSesiones] = useState({})
  const [volumenPorSesion, setVolumenPorSesion] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.id) cargarHistorial()
  }, [profile?.id])

  const cargarHistorial = async () => {
    try {
      const { data: sesionesData, error: errSesiones } = await supabase
        .from('sesiones')
        .select('*, rutina:rutinas(*)')
        .eq('socio_id', profile.id)
        .eq('completada', true)
        .order('fecha', { ascending: false })

      if (errSesiones) throw errSesiones
      setSesiones(sesionesData || [])

      if (sesionesData && sesionesData.length > 0) {
        const sesionIds = sesionesData.map((s) => s.id)
        const { data: registrosData } = await supabase
          .from('registros')
          .select('sesion_id, ejercicio_id, peso_kg, reps_realizadas')
          .in('sesion_id', sesionIds)

        const stats = {}
        const volPorSesion = {}
        ;(registrosData || []).forEach((r) => {
          if (!stats[r.sesion_id]) {
            stats[r.sesion_id] = { series: 0, ejercicios: new Set() }
            volPorSesion[r.sesion_id] = 0
          }
          stats[r.sesion_id].series++
          stats[r.sesion_id].ejercicios.add(r.ejercicio_id)
          volPorSesion[r.sesion_id] += (r.peso_kg || 0) * (r.reps_realizadas || 0)
        })

        Object.keys(stats).forEach((id) => {
          stats[id] = {
            series: stats[id].series,
            ejercicios: stats[id].ejercicios.size,
          }
        })

        setStatsSesiones(stats)
        setVolumenPorSesion(volPorSesion)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar volumen por semana (últimas 6 semanas)
  const datosGrafico = useMemo(() => {
    if (sesiones.length === 0) return []

    const semanasMap = {}
    const hoy = new Date()
    const inicioSemanaActual = obtenerInicioSemana(hoy)

    // Generar las últimas 6 semanas como placeholders
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(inicioSemanaActual)
      inicio.setDate(inicio.getDate() - i * 7)
      const key = inicio.toISOString().split('T')[0]
      semanasMap[key] = {
        key,
        semana: etiquetaSemana(inicio),
        volumen: 0,
        sesiones: 0,
        fecha: inicio,
      }
    }

    // Sumar volumen por semana
    sesiones.forEach((s) => {
      const inicio = obtenerInicioSemana(new Date(s.fecha))
      const key = inicio.toISOString().split('T')[0]
      if (semanasMap[key]) {
        semanasMap[key].volumen += volumenPorSesion[s.id] || 0
        semanasMap[key].sesiones += 1
      }
    })

    return Object.values(semanasMap).sort((a, b) => a.fecha - b.fecha)
  }, [sesiones, volumenPorSesion])

  // Encontrar el índice de la semana actual para resaltarla
  const indiceSemanaActual = datosGrafico.length - 1

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-text-muted py-12">Cargando historial...</p>
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

  if (sesiones.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-text-muted">Tu</p>
          <h1 className="text-2xl font-serif font-bold mt-1">Historial</h1>
        </div>

        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-piernas rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-text" />
          </div>
          <p className="font-medium mb-1">Sin entrenamientos todavía</p>
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            Cuando completes tu primer entrenamiento, vas a ver todo tu progreso acá.
          </p>
        </div>
      </div>
    )
  }

  const totalMinutos = sesiones.reduce((acc, s) => acc + (s.duracion_min || 0), 0)
  const volumenTotalAcumulado = Object.values(volumenPorSesion).reduce((acc, v) => acc + v, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-text-muted">Tu</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Historial</h1>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="card">
          <Calendar size={14} className="text-primary mb-1" />
          <p className="text-xl font-bold">{sesiones.length}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">sesiones</p>
        </div>
        <div className="card">
          <Clock size={14} className="text-primary mb-1" />
          <p className="text-xl font-bold">{totalMinutos}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">min</p>
        </div>
        <div className="card">
          <BarChart3 size={14} className="text-primary mb-1" />
          <p className="text-xl font-bold">{volumenTotalAcumulado.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">kg total</p>
        </div>
      </div>

      {/* Gráfico de volumen semanal */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
              Volumen semanal
            </p>
            <p className="text-sm font-medium mt-0.5">Últimas 6 semanas</p>
          </div>
          <BarChart3 size={18} className="text-primary" />
        </div>

        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={datosGrafico} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="semana"
                tick={{ fontSize: 10, fill: '#6B6B6B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<TooltipCustom />} cursor={{ fill: 'rgba(232, 90, 12, 0.05)' }} />
              <Bar dataKey="volumen" radius={[6, 6, 0, 0]}>
                {datosGrafico.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === indiceSemanaActual ? '#E85A0C' : '#FDE4D2'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-text-muted text-center mt-2">
          Cada barra representa el peso total (kg) levantado en una semana
        </p>
      </div>

      {/* Lista timeline */}
      <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
        Todas tus sesiones
      </p>

      <div className="space-y-3">
        {sesiones.map((sesion) => {
          const stats = statsSesiones[sesion.id] || { series: 0, ejercicios: 0 }
          const rutina = sesion.rutina

          return (
            <button
              key={sesion.id}
              onClick={() => navigate(`/sesion/${sesion.id}`)}
              className="card flex items-start gap-3 w-full text-left hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full bg-primary mb-1"></div>
                <div className="text-xs text-text-muted text-center leading-tight">
                  {formatearFecha(sesion.fecha)}
                </div>
              </div>

              <div className="w-px bg-border self-stretch ml-1 mr-1"></div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rutina?.nombre || 'Rutina'}</p>
                    <p className="text-xs text-text-muted">
                      {formatearHora(sesion.fecha)}
                    </p>
                  </div>
                  {rutina?.objetivo && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${OBJETIVO_COLORES[rutina.objetivo]} flex-shrink-0`}>
                      {rutina.objetivo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted">
                  {sesion.duracion_min && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{sesion.duracion_min} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Activity size={12} />
                    <span>{stats.ejercicios} ejercicios</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{stats.series}</span>
                    <span>series</span>
                  </div>
                </div>
              </div>

              <ChevronRight size={18} className="text-text-muted flex-shrink-0 mt-1" />
            </button>
          )
        })}
      </div>
    </div>
  )
}