import { useEffect, useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LogOut } from 'lucide-react'
import BottomNav from './BottomNav'
import logo from '../../assets/logo.jpeg'

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
      <div className="bg-secondary sticky top-0 z-40 border-b-2 border-primary">
        <div className="max-w-md mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Movimente"
              className="w-10 h-10 rounded-xl object-cover shadow-md shadow-primary/30"
            />
            <div>
              <span className="text-white font-serif font-bold text-lg block leading-tight">
                Movimente
              </span>
              <span className="text-primary-light/80 text-xs">
                {profile?.nombre} {profile?.apellido}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
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