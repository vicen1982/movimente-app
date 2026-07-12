import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/logo.jpeg'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              nombre,
              apellido,
              rol: 'socio',
            })
          if (profileError) throw profileError
        }
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header con logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src={logo}
            alt="Movimente"
            className="w-32 h-32 rounded-2xl object-cover mb-5 shadow-lg shadow-primary/40"
          />
          <p className="text-sm text-primary-light/70 uppercase tracking-widest text-xs">Entrenamientos</p>
        </div>

        {/* Card del formulario */}
        <div className="bg-surface rounded-2xl p-6 shadow-xl">
          {/* Tab switcher */}
          <div className="flex bg-bg border border-border rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' 
                  ? 'bg-surface text-text shadow-sm' 
                  : 'text-text-muted'
              }`}
            >
              Ingresar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'register' 
                  ? 'bg-surface text-text shadow-sm' 
                  : 'text-text-muted'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="input-field"
                  required
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading 
                ? 'Cargando...' 
                : mode === 'login' 
                  ? 'Iniciar sesión' 
                  : 'Crear cuenta'
              }
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-6">
            {mode === 'login' ? '¿Primera vez? ' : '¿Ya tenés cuenta? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary font-medium"
            >
              {mode === 'login' ? 'Crear cuenta' : 'Ingresar'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40 mt-6 uppercase tracking-widest">
          Entrená con propósito
        </p>
      </div>
    </div>
  )
}