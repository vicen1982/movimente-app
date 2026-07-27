import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Ruler, Activity, Plus, X, ClipboardCheck } from 'lucide-react'

const GRUPOS_ANTRO = [
  {
    titulo: 'Básicas',
    campos: [
      { key: 'peso_kg', label: 'Peso', unidad: 'kg' },
      { key: 'altura_cm', label: 'Altura', unidad: 'cm' },
    ],
  },
  {
    titulo: 'Composición corporal',
    campos: [
      { key: 'grasa_pct', label: 'Grasa corporal', unidad: '%' },
      { key: 'masa_muscular_kg', label: 'Masa muscular', unidad: 'kg' },
    ],
  },
  {
    titulo: 'Perímetros',
    campos: [
      { key: 'per_pecho_cm', label: 'Pecho', unidad: 'cm' },
      { key: 'per_cintura_cm', label: 'Cintura', unidad: 'cm' },
      { key: 'per_cadera_cm', label: 'Cadera', unidad: 'cm' },
      { key: 'per_brazo_cm', label: 'Brazo', unidad: 'cm' },
      { key: 'per_muslo_cm', label: 'Muslo', unidad: 'cm' },
      { key: 'per_pantorrilla_cm', label: 'Pantorrilla', unidad: 'cm' },
    ],
  },
  {
    titulo: 'Pliegues cutáneos',
    campos: [
      { key: 'pliegue_tricipital_mm', label: 'Tricipital', unidad: 'mm' },
      { key: 'pliegue_subescapular_mm', label: 'Subescapular', unidad: 'mm' },
      { key: 'pliegue_suprailiaco_mm', label: 'Suprailíaco', unidad: 'mm' },
      { key: 'pliegue_abdominal_mm', label: 'Abdominal', unidad: 'mm' },
    ],
  },
]

const TESTS_FUNCIONALES = [
  { tipo: 'Flexiones máximas', unidad: 'reps' },
  { tipo: 'Sentadillas máximas', unidad: 'reps' },
  { tipo: 'Plancha', unidad: 'seg' },
  { tipo: 'Tocar puntas de pie', unidad: 'cm' },
  { tipo: 'Movilidad de hombro', unidad: 'cm' },
  { tipo: 'Caminata/trote 6 minutos', unidad: 'm' },
  { tipo: 'Burpees en 1 minuto', unidad: 'reps' },
]

function formatearFecha(fechaStr) {
  return new Date(fechaStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function calcularIMC(peso, altura) {
  if (!peso || !altura) return null
  const alturaM = altura / 100
  return (peso / (alturaM * alturaM)).toFixed(1)
}

export default function EvaluacionesSocio() {
  const { socioId } = useParams()
  const navigate = useNavigate()
  const { profile } = useOutletContext()

  const [socio, setSocio] = useState(null)
  const [tab, setTab] = useState('antro')
  const [evalAntro, setEvalAntro] = useState([])
  const [evalFunc, setEvalFunc] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formAntro, setFormAntro] = useState({})
  const [formFunc, setFormFunc] = useState({ tipo: TESTS_FUNCIONALES[0].tipo, resultado: '', notas: '' })
  const [tipoCustom, setTipoCustom] = useState('')
  const [unidadCustom, setUnidadCustom] = useState('reps')

  useEffect(() => {
    cargarDatos()
  }, [socioId])

  const cargarDatos = async () => {
    try {
      const { data: perfil, error: errPerfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', socioId)
        .single()
      if (errPerfil) throw errPerfil
      setSocio(perfil)

      const [antroRes, funcRes] = await Promise.all([
        supabase
          .from('evaluaciones_antropometricas')
          .select('*')
          .eq('socio_id', socioId)
          .order('fecha', { ascending: false }),
        supabase
          .from('evaluaciones_funcionales')
          .select('*')
          .eq('socio_id', socioId)
          .order('fecha', { ascending: false }),
      ])

      if (antroRes.error) throw antroRes.error
      if (funcRes.error) throw funcRes.error
      setEvalAntro(antroRes.data || [])
      setEvalFunc(funcRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const guardarAntro = async () => {
    if (!formAntro.peso_kg) {
      setError('El peso es obligatorio')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const datos = { socio_id: socioId, evaluador_id: profile.id }
      GRUPOS_ANTRO.forEach((g) =>
        g.campos.forEach((c) => {
          if (formAntro[c.key]) datos[c.key] = parseFloat(formAntro[c.key])
        })
      )
      if (formAntro.notas) datos.notas = formAntro.notas

      const { error: errIns } = await supabase
        .from('evaluaciones_antropometricas')
        .insert(datos)
      if (errIns) throw errIns

      setFormAntro({})
      setMostrarForm(false)
      cargarDatos()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const guardarFunc = async () => {
    const esCustom = formFunc.tipo === 'otro'
    const tipo = esCustom ? tipoCustom.trim() : formFunc.tipo
    const unidad = esCustom
      ? unidadCustom
      : TESTS_FUNCIONALES.find((t) => t.tipo === formFunc.tipo)?.unidad

    if (!tipo || !formFunc.resultado) {
      setError('Completá el test y el resultado')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const { error: errIns } = await supabase.from('evaluaciones_funcionales').insert({
        socio_id: socioId,
        evaluador_id: profile.id,
        tipo,
        resultado: parseFloat(formFunc.resultado),
        unidad,
        notas: formFunc.notas || null,
      })
      if (errIns) throw errIns

      setFormFunc({ tipo: TESTS_FUNCIONALES[0].tipo, resultado: '', notas: '' })
      setTipoCustom('')
      setMostrarForm(false)
      cargarDatos()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-text-muted py-12">Cargando evaluaciones...</p>
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
        <p className="text-sm text-text-muted">Evaluaciones de</p>
        <h1 className="text-2xl font-serif font-bold mt-1">
          {socio?.nombre} {socio?.apellido}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface border border-border rounded-xl p-1 mb-5">
        <button
          onClick={() => { setTab('antro'); setMostrarForm(false); setError('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'antro' ? 'bg-primary text-white shadow-sm' : 'text-text-muted'
          }`}
        >
          <Ruler size={15} />
          Antropometría
        </button>
        <button
          onClick={() => { setTab('func'); setMostrarForm(false); setError('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'func' ? 'bg-primary text-white shadow-sm' : 'text-text-muted'
          }`}
        >
          <Activity size={15} />
          Funcionales
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm mb-4">
          Error: {error}
        </div>
      )}

      {/* Botón nueva evaluación */}
      {!mostrarForm && (
        <button
          onClick={() => setMostrarForm(true)}
          className="btn-primary flex items-center justify-center gap-2 mb-5"
        >
          <Plus size={18} />
          Nueva evaluación {tab === 'antro' ? 'antropométrica' : 'funcional'}
        </button>
      )}

      {/* Formulario antropométrico */}
      {mostrarForm && tab === 'antro' && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Nueva medición</p>
            <button onClick={() => setMostrarForm(false)} className="text-text-muted hover:text-text">
              <X size={18} />
            </button>
          </div>

          {GRUPOS_ANTRO.map((grupo) => (
            <div key={grupo.titulo} className="mb-4">
              <p className="label-caps mb-2">{grupo.titulo}</p>
              <div className="grid grid-cols-2 gap-2">
                {grupo.campos.map((c) => (
                  <div key={c.key}>
                    <label className="text-xs text-text-muted block mb-1">
                      {c.label} ({c.unidad})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={formAntro[c.key] || ''}
                      onChange={(e) => setFormAntro({ ...formAntro, [c.key]: e.target.value })}
                      className="input-field !py-2"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4">
            <p className="label-caps mb-2">Notas</p>
            <textarea
              value={formAntro.notas || ''}
              onChange={(e) => setFormAntro({ ...formAntro, notas: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Observaciones del entrenador..."
            />
          </div>

          {formAntro.peso_kg && formAntro.altura_cm && (
            <p className="text-sm text-text-muted mb-4">
              IMC calculado:{' '}
              <span className="font-bold text-text">
                {calcularIMC(parseFloat(formAntro.peso_kg), parseFloat(formAntro.altura_cm))}
              </span>
            </p>
          )}

          <button onClick={guardarAntro} disabled={guardando} className="btn-primary">
            {guardando ? 'Guardando...' : 'Guardar medición'}
          </button>
        </div>
      )}

      {/* Formulario funcional */}
      {mostrarForm && tab === 'func' && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Nuevo test</p>
            <button onClick={() => setMostrarForm(false)} className="text-text-muted hover:text-text">
              <X size={18} />
            </button>
          </div>

          <div className="mb-3">
            <p className="label-caps mb-2">Test</p>
            <select
              value={formFunc.tipo}
              onChange={(e) => setFormFunc({ ...formFunc, tipo: e.target.value })}
              className="input-field"
            >
              {TESTS_FUNCIONALES.map((t) => (
                <option key={t.tipo} value={t.tipo}>
                  {t.tipo} ({t.unidad})
                </option>
              ))}
              <option value="otro">Otro test...</option>
            </select>
          </div>

          {formFunc.tipo === 'otro' && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="text"
                value={tipoCustom}
                onChange={(e) => setTipoCustom(e.target.value)}
                className="input-field"
                placeholder="Nombre del test"
              />
              <select
                value={unidadCustom}
                onChange={(e) => setUnidadCustom(e.target.value)}
                className="input-field"
              >
                <option value="reps">reps</option>
                <option value="seg">seg</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="kg">kg</option>
              </select>
            </div>
          )}

          <div className="mb-3">
            <p className="label-caps mb-2">Resultado</p>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={formFunc.resultado}
              onChange={(e) => setFormFunc({ ...formFunc, resultado: e.target.value })}
              className="input-field"
              placeholder="Ej: 25"
            />
          </div>

          <div className="mb-4">
            <p className="label-caps mb-2">Notas</p>
            <textarea
              value={formFunc.notas}
              onChange={(e) => setFormFunc({ ...formFunc, notas: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Observaciones..."
            />
          </div>

          <button onClick={guardarFunc} disabled={guardando} className="btn-primary">
            {guardando ? 'Guardando...' : 'Guardar test'}
          </button>
        </div>
      )}

      {/* Historial antropométrico */}
      {tab === 'antro' && (
        evalAntro.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-hombros rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ruler size={28} className="text-text" />
            </div>
            <p className="font-medium mb-1">Sin mediciones todavía</p>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              Cargá la primera medición para empezar a seguir la evolución física de {socio?.nombre}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {evalAntro.map((ev) => {
              const imc = calcularIMC(ev.peso_kg, ev.altura_cm)
              return (
                <div key={ev.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">{formatearFecha(ev.fecha)}</p>
                    {imc && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary-light text-primary-dark">
                        IMC {imc}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                    {GRUPOS_ANTRO.flatMap((g) => g.campos)
                      .filter((c) => ev[c.key] != null)
                      .map((c) => (
                        <div key={c.key}>
                          <p className="text-sm font-bold">
                            {ev[c.key]} <span className="text-xs font-normal text-text-muted">{c.unidad}</span>
                          </p>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">{c.label}</p>
                        </div>
                      ))}
                  </div>
                  {ev.notas && (
                    <p className="text-xs text-text-muted italic mt-3 pt-3 border-t border-border">
                      {ev.notas}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Historial funcional */}
      {tab === 'func' && (
        evalFunc.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-piernas rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck size={28} className="text-text" />
            </div>
            <p className="font-medium mb-1">Sin tests todavía</p>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              Registrá el primer test funcional para medir el punto de partida de {socio?.nombre}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {evalFunc.map((ev) => (
              <div key={ev.id} className="card flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ev.tipo}</p>
                  <p className="text-xs text-text-muted">{formatearFecha(ev.fecha)}</p>
                  {ev.notas && (
                    <p className="text-xs text-text-muted italic mt-1 truncate">{ev.notas}</p>
                  )}
                </div>
                <p className="text-xl font-bold flex-shrink-0">
                  {ev.resultado}{' '}
                  <span className="text-xs font-normal text-text-muted">{ev.unidad}</span>
                </p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
