# CLAUDE.md — Contexto del proyecto Movimente App

> Este archivo lo lee Claude Code automáticamente al abrir el proyecto.
> Contiene el contexto completo: producto, diseño, código, convenciones y reglas.
> **Antes de proponer cualquier cambio, leé este archivo entero.**

---

## 🎯 1. Producto

**Movimente** es una web app de gestión de entrenamiento para el gimnasio **Movimente** (Argentina).

**Propósito:** Permitir que los entrenadores creen rutinas y se las asignen a sus socios, y que los socios registren sus entrenamientos serie por serie y vean su progreso en el tiempo.

**Estado actual:** MVP funcional, deployado en producción. Pruebas piloto pendientes con el profe **Julio** y ~10-20 socios reales.

**NO es:** una página web del gym, ni una app de fitness genérica, ni un marketplace. Es una herramienta interna de entrenamiento para socios + entrenadores ya inscritos.

---

## 👥 2. Roles del sistema

| Rol | Permisos |
|---|---|
| **`socio`** | Ve su rutina asignada, registra entrenamientos, ve su historial y progreso |
| **`entrenador`** | Todo lo del socio + CRUD de ejercicios, rutinas, asignaciones, ver progreso de cualquier socio |
| **`admin`** | (Reservado, no implementado en MVP) Todo lo del entrenador + gestión de usuarios |

⚠️ **Regla CRÍTICA de UX:** Cada rol ve una interfaz distinta:
- Los entrenadores tienen 4 íconos en el bottom nav: `Inicio`, `Ejercicios`, `Rutinas`, `Socios`
- Los socios tienen 2 íconos: `Mi Rutina`, `Historial` (y próximamente `Progreso`)
- `Layout.jsx` bloquea automáticamente rutas cruzadas (un socio no puede entrar a `/ejercicios`, lo redirige a `/mi-rutina`).

---

## 🛠️ 3. Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| **Frontend** | React 18 + Vite | NO usar Next.js, NO usar Create React App |
| **Estilos** | Tailwind CSS | Solo clases utilitarias + clases custom en `index.css` |
| **Routing** | React Router v6 | Rutas declaradas en `App.jsx` |
| **Estado** | React hooks (`useState`, `useEffect`, `useMemo`) + Context vía `useOutletContext` | **NO usar Redux, ni Zustand, ni Jotai** para este MVP |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) | Cliente único en `src/lib/supabase.js` |
| **Gráficos** | Recharts | NO usar Chart.js, NO usar D3 directo |
| **Iconos** | `lucide-react` | NO usar `react-icons`, NO usar emojis para iconos en UI |
| **Hosting** | Vercel (Hobby tier, gratis) | Deploy automático al hacer push a `main` |
| **CI/CD** | GitHub + Vercel | Cada push a `main` dispara redeploy |

---

## 🎨 4. Sistema de diseño (CRÍTICO — leer siempre antes de tocar estilos)

### Identidad de marca
Movimente es un gimnasio argentino. Su logo es **un ícono naranja sobre fondo negro**. Eso define toda la paleta.

### Paleta de colores oficial

Estos colores están definidos en `tailwind.config.js` y se acceden vía clases utilitarias de Tailwind. **NUNCA hardcodear valores hex distintos a estos en componentes** (especialmente importante en Recharts).

```
PRIMARIOS:
- bg-primary / text-primary / stroke-primary       → #E85A0C (naranja Movimente, color principal)
- bg-primary-light                                 → #FDE4D2 (naranja claro, fondos suaves)
- bg-primary-dark                                  → #B8430A (naranja oscuro)

SECUNDARIO:
- bg-secondary / text-secondary                    → #0F0F0F (negro del header)

ACCENT (logros, PRs, destacados):
- text-accent / bg-accent                          → #BA7517 (ámbar)
- bg-accent-light                                  → #FAEEDA

NEUTROS:
- bg-bg                                            → #FAFAF7 (off-white cálido, fondo general)
- bg-surface                                       → #FFFFFF (cards, inputs)
- text-text                                        → #1A1A1A (texto principal)
- text-text-muted                                  → #6B6B6B (texto secundario)
- border-border                                    → #D6D6D0 (bordes)

GRUPOS MUSCULARES (avatares de ejercicios):
- bg-pecho     → #F5C4B3 (rosa salmón)
- bg-espalda   → #B5D4F4 (celeste)
- bg-piernas   → #9FE1CB (verde menta)
- bg-hombros   → #FAC775 (amarillo cálido)
- bg-brazos    → #CECBF6 (violeta claro)
- bg-core      → #F4C0D1 (rosa)
- bg-cardio    → #FFD4A3 (naranja claro)
```

⚠️ **REGLA DE ORO PARA RECHARTS:**
Recharts no acepta clases de Tailwind. Cuando uses `stroke=` o `fill=` en gráficos, usar los valores hex **EXACTOS** de arriba.
- ✅ Correcto: `stroke="#E85A0C"`, `fill="#E85A0C"`, `stroke="#BA7517"` (para líneas de PR)
- ❌ INCORRECTO: `stroke="#0F6E56"` (verde teal — NO es de la marca)
- ❌ INCORRECTO: `stroke="#3B82F6"` (azul genérico)

### Tipografía

- **Headings:** `font-serif` (familia serif del sistema, da un toque editorial-deportivo) + `font-bold`
- **Body:** font del sistema (sans-serif por defecto)
- **Números grandes (stats):** `font-bold` y tamaños prominentes (`text-2xl`, `text-3xl`)

### Clases custom definidas en `src/index.css`

Usar estas clases en vez de inventar combinaciones nuevas:

```css
.btn-primary       → botón naranja con texto blanco, full width por defecto
.btn-secondary     → botón con borde, fondo blanco
.btn-ghost         → botón sin fondo, solo texto
.input-field       → input estandarizado con borde y padding
.card              → contenedor con fondo blanco, borde, padding, rounded-xl
```

### Principios de diseño

1. **Mobile-first.** Layout pensado para celular primero. `max-w-md mx-auto` es el contenedor principal.
2. **Cards con suficiente padding.** El espacio respira.
3. **Datos grandes, labels chicos.** Los números importantes (peso, reps) van con `text-2xl` o `text-3xl font-bold`. Los labels van con `text-xs uppercase tracking-wider text-text-muted`.
4. **Color como semántica.** Naranja = acción principal. Ámbar = logro/PR. Rojo = error/eliminar. Cada grupo muscular tiene su color asignado.
5. **Estado vacío amigable.** Toda pantalla con listas debe tener un estado vacío con ícono en cuadrado redondeado de color + mensaje + acción siguiente.

---

## 🗂️ 5. Estructura del proyecto

```
movimente-app/
├── src/
│   ├── App.jsx                          # Router principal
│   ├── main.jsx                         # Entry point
│   ├── index.css                        # Tailwind + clases custom
│   ├── lib/
│   │   └── supabase.js                  # Cliente Supabase (singleton)
│   ├── components/
│   │   └── layout/
│   │       ├── Layout.jsx               # Header + Outlet + BottomNav + redirect por rol
│   │       ├── BottomNav.jsx            # Nav inferior rol-aware (4 íconos entrenador / 2 socio)
│   │       ├── NuevoEjercicioModal.jsx
│   │       ├── EditarEjercicioModal.jsx
│   │       ├── SelectorEjerciciosModal.jsx        # Multi-select para agregar a rutinas
│   │       ├── EditarEjercicioRutinaModal.jsx     # Config series/reps/peso/descanso
│   │       ├── NuevaRutinaModal.jsx
│   │       ├── EditarRutinaModal.jsx
│   │       └── AsignarRutinaModal.jsx             # Multi-select rutinas a socio
│   └── pages/
│       ├── auth/
│       │   └── Login.jsx                # Login + Registro con tabs
│       ├── entrenador/
│       │   ├── Dashboard.jsx
│       │   ├── Ejercicios.jsx           # CRUD biblioteca
│       │   ├── Rutinas.jsx              # Lista
│       │   ├── DetalleRutina.jsx        # Detalle + ejercicios + config
│       │   └── Socios.jsx               # Lista + asignación
│       └── socio/
│           ├── Dashboard.jsx            # "Mi Rutina" — vista del socio
│           ├── Entrenar.jsx             # Pantalla de entrenamiento en vivo (~470 líneas)
│           ├── Historial.jsx            # Timeline de sesiones + gráfico volumen semanal
│           ├── DetalleSesion.jsx        # Detalle de una sesión pasada
│           └── Progreso.jsx             # NUEVA — récord personal por ejercicio
```

### Rutas declaradas en `App.jsx`

```
PÚBLICAS:
/login                          → Login.jsx

FULLSCREEN (sin Layout, sin BottomNav):
/entrenar/:rutinaId             → Entrenar.jsx

CON LAYOUT (header + bottom nav):
/dashboard                      → Dashboard entrenador
/ejercicios                     → Lista de ejercicios
/rutinas                        → Lista de rutinas
/rutinas/:id                    → Detalle de rutina
/socios                         → Lista de socios
/mi-rutina                      → Dashboard socio
/historial                      → Historial sesiones (socio)
/sesion/:sesionId               → Detalle sesión
/progreso                       → Progreso por ejercicio (socio)
```

### `RUTAS_SOCIO` y `RUTAS_ENTRENADOR` en `Layout.jsx`

⚠️ **REGLA CRÍTICA:** Cada vez que agregues una ruta nueva, actualizá los arrays `RUTAS_SOCIO` o `RUTAS_ENTRENADOR` del Layout. Si no, el redirect automático bloquea al usuario.

---

## 🗄️ 6. Modelo de datos (Supabase / PostgreSQL)

Tablas existentes (NO crear nuevas sin preguntar):

```sql
profiles            (id UUID, nombre, apellido, rol, avatar_url, active, created_at)
ejercicios          (id, nombre, grupo_muscular, descripcion, imagen_url, creado_por)
rutinas             (id, nombre, descripcion, objetivo, creada_por, updated_at)
rutina_ejercicios   (id, rutina_id, ejercicio_id, orden, series_sugeridas,
                     reps_sugeridas, peso_sugerido, descanso_seg, notas)
asignaciones        (id, rutina_id, socio_id, asignada_por, fecha_asignacion, activa)
sesiones            (id, socio_id, rutina_id, fecha, duracion_min, completada, notas)
registros           (id, sesion_id, ejercicio_id, numero_serie, peso_kg, reps_realizadas, notas)
```

### Convenciones de datos

- **`grupo_muscular`** enum: `pecho | espalda | piernas | hombros | brazos | core | cardio | otro`
- **`rol`** enum: `socio | entrenador | admin`
- **`objetivo`** (rutinas) enum: `fuerza | hipertrofia | resistencia | funcional | otro`
- **Joins** se hacen con la sintaxis Supabase: `select('*, ejercicio:ejercicios(*)')`
- **RLS activado** en todas las tablas. Las queries respetan automáticamente el usuario logueado.

### URL del proyecto Supabase

```
https://uejdlxzpevxrsppjkctn.supabase.co
```
Región: `sa-east-1` (São Paulo).

---

## 💻 7. Convenciones de código

### Estilo general

- **Nombres en español** para el dominio del negocio (`rutina`, `ejercicio`, `serieActual`, `descanso`)
- **Nombres en inglés** para conceptos técnicos (`handleSubmit`, `loading`, `useEffect`)
- **Comillas simples** para JS: `'string'`, NO `"string"`
- **No usar punto y coma al final** (estilo standard)
- **Componentes en PascalCase**, funciones en camelCase
- **Un componente por archivo**, default export

### Patrón de página (template a seguir)

```jsx
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { IconoX } from 'lucide-react'

export default function NombrePagina() {
  const { profile } = useOutletContext()
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data, error } = await supabase
        .from('tabla')
        .select('*')
        .eq('campo', valor)

      if (error) throw error
      setDatos(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-center text-text-muted py-12">Cargando...</p>
  if (error) return <div className="card bg-red-50 border-red-200 text-red-700 text-sm">Error: {error}</div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-text-muted">Mis</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Título</h1>
      </div>
      {/* contenido */}
    </div>
  )
}
```

### Patrón de query Supabase (SIEMPRE try-catch)

```jsx
try {
  const { data, error } = await supabase.from('x').select('*')
  if (error) throw error
  setData(data || [])
} catch (err) {
  setError(err.message)
} finally {
  setLoading(false)
}
```

### Patrón de modal

Modales se manejan con `useState` para apertura. Se pasan handlers `onClose` y `onActualizado/onCreado` para callback al padre. Diseño base:

```jsx
<div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
  <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
    {/* contenido */}
  </div>
</div>
```

---

## 🚨 8. Reglas duras (cosas que NO se hacen)

1. ❌ **NO hardcodear colores** que no estén en la paleta oficial de la sección 4
2. ❌ **NO usar emojis como íconos en UI** (usar `lucide-react`)
3. ❌ **NO instalar librerías nuevas** sin consultar primero
4. ❌ **NO renombrar la app a "Mover"**, ni a ningún otro nombre — es **"Movimente"** siempre
5. ❌ **NO crear archivos `.env` nuevos**, ya hay uno configurado
6. ❌ **NO subir el archivo `.env`** a Git — está en `.gitignore` por seguridad
7. ❌ **NO usar Tailwind v4** ni cambiar el `tailwind.config.js` sin avisar
8. ❌ **NO usar `localStorage` para datos persistentes** — todo va a Supabase
9. ❌ **NO duplicar lógica** que ya existe (ej: si Historial.jsx ya tiene gráfico de volumen, no hacer otro en Progreso.jsx)
10. ❌ **NO usar `<form>` con `action=`** — manejo de submits siempre con `onClick` o `onSubmit` controlado
11. ❌ **NO crear archivos de prueba/seed** sin pedirlos
12. ❌ **NO modificar Login.jsx** sin avisar — es la puerta de entrada y debe quedar estable

---

## ✅ 9. Reglas blandas (preferencias)

1. ✅ Cuando una página crezca a > 400 líneas, considerar partir en componentes hijos
2. ✅ Preferir `useMemo` para cálculos pesados que dependen de estado
3. ✅ Mensajes de error siempre en español argentino, tono cordial
4. ✅ Estados vacíos siempre con ícono en cuadrado redondeado de color + mensaje empático
5. ✅ Botones de acción crítica (eliminar) con confirmación de 2 pasos
6. ✅ Fechas en formato español argentino (`'es-AR'`)
7. ✅ Comentarios SOLO cuando la lógica no es obvia. NO comentar cosas como `// crear estado`
8. ✅ Si vas a tocar `App.jsx` o `Layout.jsx`, mostrar el archivo completo en respuesta (son críticos)

---

## 👤 10. Sobre el usuario (vicen)

- **Es su primer proyecto de programación.** No es un dev senior.
- **Cliente: Movimente Gym** (Argentina). Persona de contacto: profe **Julio** (NO Diego).
- **Habla español argentino**, prefiere tono cercano y analogías deportivas.
- **Prefiere instrucciones paso a paso, directas, sin teoría innecesaria.**
- **Aprende mejor con ejemplos concretos** que con explicaciones abstractas.
- **Le gustan los archivos completos** cuando hay que reemplazar, no diffs parciales.
- **Tip:** Cuando un archivo es muy largo (>300 líneas), preferir crear el archivo entero como descarga en lugar de mostrar el código en el chat (se cortan al copiar).

---

## 🚀 11. Flujo de trabajo

### Desarrollo local
```bash
npm run dev          # Levanta vite en localhost:5173
```

### Deploy a producción
```bash
git add .
git commit -m "Mensaje descriptivo"
git push origin main
# Vercel detecta el push y redespliega automáticamente
```

### URL de producción
```
https://movimente-app.vercel.app
```

### Usuarios de prueba (NO BORRAR de la base de datos)
```
Entrenador principal:    vicentematiasp@gmail.com (vicente peralta)
Entrenador del gym:      julio@movimente.test (Julio Profe) — pwd: movimente123
Socio 1:                 juan.castro@movimente.test    — pwd: movimente123
Socio 2:                 maria.paz@movimente.test      — pwd: movimente123
Socio 3:                 lucas.fernandez@movimente.test — pwd: movimente123
Socio 4:                 ana.rivas@movimente.test      — pwd: movimente123
```

---

## 📝 12. Checklist antes de hacer un PR / push

Antes de proponer un cambio importante, verificar:

- [ ] Los colores usados están en la paleta oficial (sección 4)
- [ ] Si se agregó una ruta nueva, está en `RUTAS_SOCIO` o `RUTAS_ENTRENADOR` de `Layout.jsx`
- [ ] Los nuevos componentes siguen el patrón de página (sección 7)
- [ ] Todas las queries Supabase tienen try-catch
- [ ] Estados de loading y error están manejados
- [ ] No se hardcodearon strings de marca ("Mover", "Gym X", etc.) — siempre "Movimente"
- [ ] No se duplicó lógica que ya existía en otro archivo
- [ ] El componente es responsive (mobile-first)
- [ ] No se introdujeron dependencias nuevas no consultadas

---

## 🎯 13. Pendientes conocidos (no resueltos al momento)

- 🐛 **Bug pendiente:** En algún archivo (probablemente `Layout.jsx` o `index.html`) el nombre de la app aparece como "Mover" en lugar de "Movimente". Buscar `Mover` en todo el proyecto y reemplazar.
- 🆕 **Feature recién agregada:** `Progreso.jsx` (página de récords por ejercicio). Verificar coherencia visual con el resto.
- 📚 **Falta:** Manual de mantenimiento para vicen.
- 🚀 **Próximo:** Migrar al dominio propio cuando Movimente lo decida (actual: vercel.app).

---

**Última actualización:** Junio 2026
**Mantenido por:** Vicen + Claude
