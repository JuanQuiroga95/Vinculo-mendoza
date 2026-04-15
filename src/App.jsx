import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getUser, isLoggedIn } from './utils/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import CompanyDashboard from './pages/CompanyDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, role }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  const user = getUser()
  if (role && user?.role !== role) {
    if (user?.role === 'student')  return <Navigate to="/alumno" replace />
    if (user?.role === 'company')  return <Navigate to="/empresa" replace />
    if (user?.role === 'teacher')  return <Navigate to="/docente" replace />
    if (user?.role === 'admin')    return <Navigate to="/admin" replace />
  }
  return children
}

function DashboardRedirect() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'student')  return <Navigate to="/alumno" replace />
  if (user.role === 'company')  return <Navigate to="/empresa" replace />
  if (user.role === 'teacher')  return <Navigate to="/docente" replace />
  if (user.role === 'admin')    return <Navigate to="/admin" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/registro"  element={<Register />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        <Route path="/alumno" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/empresa" element={
          <ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>
        } />
        <Route path="/docente" element={
          <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
