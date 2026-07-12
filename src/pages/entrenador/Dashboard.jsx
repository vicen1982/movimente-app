import { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Dumbbell, ClipboardList, Users, TrendingUp, Activity } from 'lucide-react'

export default function DashboardEntrenador() {
  const { profile } = useOutletContext()
  const [stats, setStats] = useState({ socios: 0, rutinas: 0, sesionesSemana: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarStats()
  }, [])

  const cargarStats = async () => {
    try {
      const inicioSemana = new Date()
      const dia = inicioSemana.getDay()
      inicioSemana.setDate(inicioSemana.getDate() - dia + (dia === 0 ? -6 : 1))
      inicioSemana.setHours(0, 0, 0, 0)

      const [sociosRes, rutinasRes, sesionesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rol', 'socio').eq('active', true),
        supabase.from('rutinas').select('id', { count: 'exact', head: true }),
        supabase.from('sesiones').select('id', { count: 'exact', head: true }).eq('completada', true).gte('fecha', inicioSemana.toISOString()),
      ])

      if (sociosRes.error) throw sociosRes.error
      if (rutinasRes.error) throw rutinasRes.error
      if (sesionesRes.error) throw sesionesRes.error

      setStats({
        socios: sociosRes.count || 0,
        rutinas: rutinasRes.count || 0,
        sesionesSemana: sesionesRes.count || 0,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const acciones = [
    {
      to: '/ejercicios',
      icon: Dumbbell,
      titulo: 'Biblioteca de ejercicios',
      descripcion: 'Ver y crear ejercicios',
      color: 'bg-pecho',
    },
    {
      to: '/rutinas',
      icon: ClipboardList,
      titulo: 'Rutinas',
      descripcion: 'Crear y editar rutinas',
      color: 'bg-piernas',
    },
    {
      to: '/socios',
      icon: Users,
      titulo: 'Socios',
      descripcion: 'Asignar rutinas y ver progreso',
      color: 'bg-brazos',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-text-muted">¡Hola entrenador!</p>
        <h1 className="text-2xl font-serif font-bold mt-1">
          {profile?.nombre} {profile?.apellido}
        </h1>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm mb-6">
          Error: {error}
        </div>
      )}

      {/* Resumen con stats reales */}
      <div className="bg-secondary text-white rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary" />
          <p className="text-xs uppercase tracking-wider text-white/60 font-medium">
            Tu gimnasio hoy
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-2xl font-bold">{loading ? '—' : stats.socios}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50">socios activos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? '—' : stats.rutinas}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50">rutinas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{loading ? '—' : stats.sesionesSemana}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50">sesiones esta semana</p>
          </div>
        </div>
      </div>

      <p className="label-caps mb-3">Accesos rápidos</p>

      <div className="space-y-3">
        {acciones.map(({ to, icon: Icon, titulo, descripcion, color }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-4 hover:border-primary transition-all active:scale-[0.98]"
          >
            <div
              className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <Icon size={22} className="text-text" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{titulo}</p>
              <p className="text-xs text-text-muted">{descripcion}</p>
            </div>
            <span className="text-text-muted">›</span>
          </Link>
        ))}
      </div>

      {!loading && stats.sesionesSemana === 0 && !error && (
        <div className="card mt-6 flex items-center gap-3 bg-primary-light/40 border-primary/20">
          <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity size={18} className="text-primary" />
          </div>
          <p className="text-xs text-text-muted">
            Todavía no hay sesiones esta semana. Los entrenamientos de tus socios van a aparecer acá.
          </p>
        </div>
      )}
    </div>
  )
}
