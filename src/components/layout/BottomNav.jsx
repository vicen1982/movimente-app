import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, ClipboardList, Users, TrendingUp, LineChart } from 'lucide-react'

const NAV_ENTRENADOR = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { to: '/rutinas', label: 'Rutinas', icon: ClipboardList },
  { to: '/socios', label: 'Socios', icon: Users },
]

const NAV_SOCIO = [
  { to: '/mi-rutina', label: 'Mi Rutina', icon: ClipboardList },
  { to: '/historial', label: 'Historial', icon: TrendingUp },
  { to: '/progreso', label: 'Progreso', icon: LineChart },
]

export default function BottomNav({ rol }) {
  const items = rol === 'entrenador' || rol === 'admin' ? NAV_ENTRENADOR : NAV_SOCIO

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-border z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                    isActive ? 'bg-primary-light' : ''
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span className="text-[11px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}