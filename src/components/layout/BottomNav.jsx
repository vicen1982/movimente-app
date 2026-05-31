import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, ClipboardList, Users, TrendingUp } from 'lucide-react'

const NAV_ENTRENADOR = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { to: '/rutinas', label: 'Rutinas', icon: ClipboardList },
  { to: '/socios', label: 'Socios', icon: Users },
]

const NAV_SOCIO = [
  { to: '/mi-rutina', label: 'Mi Rutina', icon: ClipboardList },
  { to: '/historial', label: 'Historial', icon: TrendingUp },
]

export default function BottomNav({ rol }) {
  const items = rol === 'entrenador' || rol === 'admin' ? NAV_ENTRENADOR : NAV_SOCIO

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}