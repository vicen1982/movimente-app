import { useEffect, useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LogOut, Dumbbell } from 'lucide-react'
import BottomNav from './BottomNav'

// Rutas que solo el entrenador puede ver
const RUTAS_ENTRENADOR = ['/dashboard', '/ejercicios', '/rutinas', '/socios']
// Rutas que solo el socio puede ver
const RUTAS_SOCIO = ['/mi-rutina', '/historial', '/sesion', '/progreso']

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    // Cada vez que cambia la URL, verificamos que el rol pueda estar acá
    if (!profile) return
    redirigirSegunRol(profile.rol, location.pathname)
  }, [location.pathname, profile])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)

    // Redirigir según el rol al cargar
    redirigirSegunRol(data?.rol, location.pathname)
  }

  const redirigirSegunRol = (rol, path) => {
    if (rol === 'socio') {
      // Si el socio intenta entrar a rutas del entrenador → mandarlo a mi-rutina
      const enRutaEntrenador = RUTAS_ENTRENADOR.some(r => path === r || path.startsWith(r + '/'))
      if (enRutaEntrenador) {
        navigate('/mi-rutina', { replace: true })
      }
    } else if (rol === 'entrenador' || rol === 'admin') {
      // Si el entrenador entra a mi-rutina → mandarlo al dashboard
      if (path === '/mi-rutina') {
        navigate('/dashboard', { replace: true })
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-muted">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="bg-secondary p-4 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Dumbbell className="text-white" size={20} />
            </div>
            <div>
              <span className="text-white font-serif font-bold text-lg block leading-tight">
                Movimente
              </span>
              <span className="text-white/60 text-xs">
                {profile?.nombre} {profile?.apellido}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto">
        <Outlet context={{ profile }} />
      </main>

      <BottomNav rol={profile?.rol} />
    </div>
  )
}