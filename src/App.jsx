import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Layout from './components/layout/Layout'
import DashboardEntrenador from './pages/entrenador/Dashboard'
import Ejercicios from './pages/entrenador/Ejercicios'
import Rutinas from './pages/entrenador/Rutinas'
import DetalleRutina from './pages/entrenador/DetalleRutina'
import Socios from './pages/entrenador/Socios'
import DashboardSocio from './pages/socio/Dashboard'
import Historial from './pages/socio/Historial'
import DetalleSesion from './pages/socio/DetalleSesion'
import Entrenar from './pages/socio/Entrenar'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/entrenar/:rutinaId" element={<Entrenar />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardEntrenador />} />
          <Route path="/ejercicios" element={<Ejercicios />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/rutinas/:id" element={<DetalleRutina />} />
          <Route path="/socios" element={<Socios />} />
          <Route path="/mi-rutina" element={<DashboardSocio />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/sesion/:sesionId" element={<DetalleSesion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}