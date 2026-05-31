import { useOutletContext, Link } from 'react-router-dom'
import { Dumbbell, ClipboardList, Users, TrendingUp } from 'lucide-react'

export default function DashboardEntrenador() {
  const { profile } = useOutletContext()

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
      <div className="mb-8">
        <p className="text-sm text-text-muted">¡Hola entrenador!</p>
        <h1 className="text-2xl font-serif font-bold mt-1">
          {profile?.nombre} {profile?.apellido}
        </h1>
      </div>

      <div className="card mb-6 bg-secondary text-white border-0">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={18} className="text-primary" />
          <p className="text-xs uppercase tracking-wider text-white/60">
            Resumen del mes
          </p>
        </div>
        <p className="text-sm text-white/80">
          Pronto vas a ver acá tus socios activos, rutinas creadas y sesiones registradas.
        </p>
      </div>

      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Accesos rápidos
        </p>
      </div>

      <div className="space-y-3">
        {acciones.map(({ to, icon: Icon, titulo, descripcion, color }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-4 hover:border-primary transition-colors active:scale-[0.98]"
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
    </div>
  )
}