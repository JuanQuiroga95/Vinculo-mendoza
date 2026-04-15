// src/pages/AdminDashboard.jsx — Panel Master Admin
// Datos demo basados en Escuela Nº 4-012 "Ing. Ricardo Videla" - 5to 3ra

import { useState, useMemo } from 'react'
import {
  Users, Building2, Eye, Settings, Download, ShieldCheck,
  AlertTriangle, CheckCircle, Clock, XCircle, Bell, Plus,
  Search, Filter, ChevronDown, LogOut, BarChart3, Upload,
  Lock, Unlock, FileText, Sliders, Calendar, DollarSign,
  UserPlus, RefreshCw, Mail, Phone, MapPin, Briefcase
} from 'lucide-react'
import { clearAuth } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

// ─── DATOS DEMO (basados en asignación real 5to 3ra) ─────────────────────────

const DEMO_TEACHERS = [
  { id: 't1', name: 'VIDELA, Eliana',       email: 'evidela@escola.edu.ar',  school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
  { id: 't2', name: 'MARTÍN, Cecilia',      email: 'cmartin@escola.edu.ar',  school: 'Ing. Ricardo Videla', students: 4,  visits: 5, pending: 1 },
  { id: 't3', name: 'CULTRERA, Laura',      email: 'lcultrera@escola.edu.ar', school: 'Ing. Ricardo Videla', students: 2,  visits: 1, pending: 1 },
  { id: 't4', name: 'ESCUDERO, Mauricio',   email: 'mescudero@escola.edu.ar', school: 'Ing. Ricardo Videla', students: 3,  visits: 6, pending: 0 },
  { id: 't5', name: 'GRECO, Marisol',       email: 'mgreco@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 3,  visits: 0, pending: 3 },
  { id: 't6', name: 'SILVA, Alejandro',     email: 'asilva@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 3,  visits: 4, pending: 0 },
  { id: 't7', name: 'LENI, Fabio',          email: 'fleni@escola.edu.ar',     school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
  { id: 't8', name: 'VECCHIUTTI, Yamila',   email: 'yvecchiutti@escola.edu.ar',school: 'Ing. Ricardo Videla',students: 3,  visits: 3, pending: 0 },
  { id: 't9', name: 'SPAMPINATO, Jésica',   email: 'jspampinato@escola.edu.ar',school: 'Ing. Ricardo Videla',students: 2,  visits: 2, pending: 0 },
  { id: 't10',name: 'ERMACORA, Sebastián',  email: 'sermacora@escola.edu.ar', school: 'Ing. Ricardo Videla', students: 3,  visits: 1, pending: 2 },
  { id: 't11',name: 'TORRES, Vanina',       email: 'vtorres@escola.edu.ar',   school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
]

const DEMO_STUDENTS = [
  // VIDELA
  { id: 's1',  name: 'ALVAREZ CORTEZ, Juan Ignacio',       teacher: 't1', company: 'Ferretería Silvestrini',           status: 'active',    hours: 72,  visits: 2, ice: false },
  // MARTÍN
  { id: 's2',  name: 'ARANCIBIA CASTRO, Agostina Ailén',   teacher: 't2', company: 'CEPA S.R.L.',                      status: 'active',    hours: 60,  visits: 1, ice: false },
  { id: 's3',  name: 'ARRIETA LEON, Lourdes Yamile',       teacher: 't2', company: 'CEPA S.R.L.',                      status: 'active',    hours: 55,  visits: 1, ice: false },
  { id: 's4',  name: 'REVOLLO HUANCA, Camila Sabrina',     teacher: 't2', company: 'Farmacia El Pino',                 status: 'active',    hours: 80,  visits: 2, ice: false },
  { id: 's5',  name: 'ROBLEDO SALAZAR, María Agustina',    teacher: 't2', company: 'Farmacia El Pino',                 status: 'simulation',hours: 40,  visits: 1, ice: false },
  // CULTRERA
  { id: 's6',  name: 'CORREA, Ana Paula',                  teacher: 't3', company: 'Corralón Luján S.A.',              status: 'active',    hours: 100, visits: 1, ice: false },
  { id: 's7',  name: 'LUCERO VIDELA, Ignacio',             teacher: 't3', company: 'Estudio Contable Yamin',           status: 'active',    hours: 88,  visits: 0, ice: false },
  // ESCUDERO
  { id: 's8',  name: 'VEDIA JANCO, Magali Anabella',       teacher: 't4', company: 'DISVEC Representaciones',          status: 'active',    hours: 95,  visits: 2, ice: false },
  { id: 's9',  name: 'GIRÓN VEDIA, Milagros Elizabeth',    teacher: 't4', company: 'DISVEC Representaciones',          status: 'active',    hours: 90,  visits: 2, ice: false },
  { id: 's10', name: 'JOFRE GOMEZ, Leonel Valentín',       teacher: 't4', company: 'Aguerre Ferretería',               status: 'active',    hours: 78,  visits: 2, ice: false },
  // GRECO — ⚠️ 0 visitas
  { id: 's11', name: 'RODRIGUEZ NAVARRO, Mara Agostina',   teacher: 't5', company: 'H30 Ferretería Express',           status: 'active',    hours: 45,  visits: 0, ice: false },
  { id: 's12', name: 'NOROÑA, Sofía Macarena',             teacher: 't5', company: 'H30 Ferretería Express',           status: 'active',    hours: 50,  visits: 0, ice: false },
  { id: 's13', name: 'VELAZQUEZ, Santiago',                teacher: 't5', company: 'Estudio Jurídico Cicilotto',        status: 'active',    hours: 30,  visits: 0, ice: true  },
  // SILVA
  { id: 's14', name: 'PEÑALOZA, Agustín David',            teacher: 't6', company: 'Expreso Luján',                   status: 'active',    hours: 65,  visits: 2, ice: false },
  { id: 's15', name: 'CUEVAS BUSTAMANTE, Lorena Mariela',  teacher: 't6', company: 'Nexo Seguros',                    status: 'active',    hours: 70,  visits: 2, ice: false },
  { id: 's16', name: 'ROJAS, Mariángel',                   teacher: 't6', company: 'Nexo Seguros',                    status: 'active',    hours: 60,  visits: 0, ice: false },
  // LENI
  { id: 's17', name: 'PONCE, Lautaro Uriel',               teacher: 't7', company: 'Farmacia Santa Cruz',              status: 'active',    hours: 85,  visits: 2, ice: false },
  // VECCHIUTTI
  { id: 's18', name: 'TALQUENCA, Alelí Marisol',           teacher: 't8', company: 'Café y Delicatessen (Entre Dos)',  status: 'active',    hours: 55,  visits: 1, ice: false },
  { id: 's19', name: 'LEYES ELIZONDO, Alexis Miguel',      teacher: 't8', company: 'Café y Delicatessen (Entre Dos)',  status: 'active',    hours: 60,  visits: 1, ice: false },
  { id: 's20', name: 'PEDERNERA, Simón Alfonso',           teacher: 't8', company: 'Inmobiliaria Romero Suñer',        status: 'active',    hours: 75,  visits: 1, ice: false },
  // SPAMPINATO
  { id: 's21', name: 'VERDIER, Valentina',                 teacher: 't9', company: 'Estudio Jurídico Cicilotto',       status: 'active',    hours: 90,  visits: 2, ice: false },
  { id: 's22', name: 'IRIBARREN, Morena Marianela',        teacher: 't9', company: 'TEMIS S.A.',                       status: 'active',    hours: 82,  visits: 2, ice: false },
  // ERMACORA
  { id: 's23', name: 'MENDEZ-GOMEZ, Alexander Eduardo',    teacher: 't10',company: 'Dique Potrerillos S.A.',           status: 'active',    hours: 40,  visits: 1, ice: false },
  { id: 's24', name: 'REINOSO RIQUELME, Lautaro Andrés',   teacher: 't10',company: 'Dique Potrerillos S.A.',           status: 'active',    hours: 38,  visits: 0, ice: false },
  { id: 's25', name: 'SANTANDER, Brian Emanuel',           teacher: 't10',company: '(Sin empresa asignada)',           status: 'none',      hours: 0,   visits: 0, ice: false },
  // TORRES
  { id: 's26', name: 'ORTEGOZA, Valentina Lorenza',        teacher: 't11',company: 'JARMAYAL S.A.S.',                  status: 'active',    hours: 30,  visits: 2, ice: false },
]

const DEMO_COMPANIES = [
  { id: 'c1',  name: 'Ferretería Silvestrini',          cuit: '30-71234567-1', verified: true,  sector: 'Comercio', students: 1, contact: 'Víctor Silvestrini', phone: '2614987644' },
  { id: 'c2',  name: 'CEPA S.R.L.',                     cuit: '30-68901234-5', verified: true,  sector: 'Servicios', students: 2, contact: 'Sylvia Retamales',  phone: '2615150349' },
  { id: 'c3',  name: 'Farmacia El Pino',                cuit: '20-12345678-9', verified: true,  sector: 'Salud',    students: 2, contact: 'Martín D. Segura',  phone: '' },
  { id: 'c4',  name: 'Corralón Luján S.A.',             cuit: '30-45678901-2', verified: true,  sector: 'Comercio', students: 1, contact: 'Córdoba M. del Valle', phone: '2615996249' },
  { id: 'c5',  name: 'Estudio Contable Yamin',          cuit: '20-98765432-1', verified: true,  sector: 'Contabilidad', students: 1, contact: 'Alejandra Yamin', phone: '2614683805' },
  { id: 'c6',  name: 'DISVEC Representaciones',         cuit: '30-55443322-7', verified: true,  sector: 'Comercio', students: 2, contact: 'Cintia B. Cazón',   phone: '2612056520' },
  { id: 'c7',  name: 'Aguerre Ferretería',              cuit: '20-33221100-4', verified: false, sector: 'Comercio', students: 1, contact: 'Federico Di Santo',  phone: '2615071541' },
  { id: 'c8',  name: 'H30 Ferretería Express',          cuit: '30-77665544-3', verified: true,  sector: 'Comercio', students: 2, contact: 'Ricardo Bologna',    phone: '2616930773' },
  { id: 'c9',  name: 'Estudio Jurídico Cicilotto',      cuit: '20-44332211-8', verified: true,  sector: 'Legal',    students: 2, contact: 'Cicilotto Cristian', phone: '2614984054' },
  { id: 'c10', name: 'Expreso Luján',                   cuit: '30-12398765-5', verified: true,  sector: 'Transporte', students: 1, contact: 'Roxana Duscio',   phone: '2612183679' },
  { id: 'c11', name: 'Nexo Seguros',                    cuit: '30-87654321-0', verified: false, sector: 'Seguros',  students: 2, contact: 'Gabriela Quiroga',  phone: '2616664775' },
  { id: 'c12', name: 'Farmacia Santa Cruz',             cuit: '20-56781234-6', verified: true,  sector: 'Salud',    students: 1, contact: 'Martín D. Segura',  phone: '2615692380' },
  { id: 'c13', name: 'Café y Delicatessen (Entre Dos)', cuit: '30-23456789-3', verified: true,  sector: 'Gastronomía', students: 2, contact: 'Alonso José',   phone: '2616110040' },
  { id: 'c14', name: 'Inmobiliaria Romero Suñer',       cuit: '20-65432187-2', verified: true,  sector: 'Inmobiliaria', students: 1, contact: 'María C. Romero', phone: '' },
  { id: 'c15', name: 'TEMIS S.A.',                      cuit: '30-34567890-9', verified: true,  sector: 'Servicios', students: 1, contact: 'Milca Galat Giorgi', phone: '2612053029' },
  { id: 'c16', name: 'Dique Potrerillos S.A.',          cuit: '30-67890123-4', verified: false, sector: 'Turismo',  students: 2, contact: 'Ignacio Robello',   phone: '2615071541' },
  { id: 'c17', name: 'JARMAYAL S.A.S.',                 cuit: '30-11223344-6', verified: true,  sector: 'Agroindustria', students: 1, contact: 'Luis Amaya',  phone: '2612505826' },
]

const DEMO_SETTINGS = {
  smvm: 234315,
  incentive_pct: 85,
  max_hours_day: 4,
  max_hours_week: 20,
  time_from: '08:00',
  time_to: '18:00',
  total_hours_goal: 100,
  min_visits: 2,
  calendar: [
    { course: '5° 1°', label: 'Tanda 1', from: '2025-08-04', to: '2025-08-15' },
    { course: '5° 2°', label: 'Tanda 1', from: '2025-08-18', to: '2025-08-29' },
    { course: '5° 3°', label: 'Tanda 1', from: '2025-09-01', to: '2025-09-12' },
  ]
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const statusLabel = { active: 'En Proceso', completed: 'Finalizada', simulation: 'Simulación', none: 'Sin Pasantía', blocked: 'Bloqueada' }
const statusColor = { active: '#4ade80', completed: '#60a5fa', simulation: '#f59e0b', none: '#6b7280', blocked: '#f87171' }

function Badge({ status }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
      background: statusColor[status] + '22', color: statusColor[status], border: `1px solid ${statusColor[status]}44`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[status] }} />
      {statusLabel[status] || status}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--wine)', alert }) {
  return (
    <div style={{
      background: 'var(--ink-soft)', border: `1px solid ${alert ? '#f8717133' : 'rgba(250,245,237,0.08)'}`,
      borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative', overflow: 'hidden'
    }}>
      {alert && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#f87171' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: alert ? '#f87171' : 'var(--cream)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{sub}</div>}
    </div>
  )
}

// ─── TABS ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'monitor',  label: 'Monitor Global', icon: BarChart3 },
  { id: 'teachers', label: 'Docentes',        icon: Users },
  { id: 'companies',label: 'Empresas',        icon: Building2 },
  { id: 'settings', label: 'Configuración',   icon: Settings },
  { id: 'export',   label: 'Exportar GEM',    icon: Download },
]

// ─── MONITOR TAB ─────────────────────────────────────────────────────────────

function MonitorTab({ students, teachers }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]))
  const alertTeachers = teachers.filter(t => t.students > 0 && t.visits === 0)

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalHoursAvg = Math.round(students.reduce((a, s) => a + s.hours, 0) / students.length)
  const completedCount = students.filter(s => s.hours >= 100).length
  const iceCount = students.filter(s => s.ice).length
  const noneCount = students.filter(s => s.status === 'none').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <StatCard icon={Users} label="Alumnos totales" value={students.length} sub="5to 3ra - Ing. Ricardo Videla" color="var(--gold)" />
        <StatCard icon={CheckCircle} label="100hs completadas" value={completedCount} sub={`${Math.round(completedCount/students.length*100)}% del curso`} color="#4ade80" />
        <StatCard icon={Clock} label="Promedio horas" value={`${totalHoursAvg}hs`} sub="Meta: 100 horas" color="#60a5fa" />
        <StatCard icon={AlertTriangle} label="Sin empresa" value={noneCount} sub="Requieren acción" color="#f87171" alert={noneCount > 0} />
        <StatCard icon={Lock} label="Condición ICE" value={iceCount} sub="Bloqueados del sistema" color="#f87171" alert={iceCount > 0} />
      </div>

      {/* Alertas docentes */}
      {alertTeachers.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={16} /> ALERTA: Docentes sin visitas registradas con alumnos activos
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {alertTeachers.map(t => (
              <span key={t.id} style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: '0.82rem', color: '#fca5a5' }}>
                {t.name} ({t.students} alumnos sin visitar)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cumplimiento docente */}
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(250,245,237,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={15} color="var(--gold)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--cream)' }}>Cumplimiento Docente</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Profesor/a', 'Alumnos', 'Visitas', 'Pendientes', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => {
                const ok = t.students === 0 || t.visits >= t.students * 2
                const warn = !ok && t.visits > 0
                const danger = t.students > 0 && t.visits === 0
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--cream)', fontWeight: 500 }}>{t.name}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--smoke)' }}>{t.students}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--smoke)' }}>{t.visits}</td>
                    <td style={{ padding: '10px 16px', color: t.pending > 0 ? '#f87171' : 'var(--smoke)' }}>{t.pending > 0 ? `⚠ ${t.pending}` : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {danger ? <span style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>🔴 SIN VISITAS</span>
                       : warn  ? <span style={{ color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 }}>🟡 PARCIAL</span>
                       : <span style={{ color: '#4ade80', fontSize: '0.78rem', fontWeight: 600 }}>✅ OK</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de trayectorias */}
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(250,245,237,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={15} color="var(--gold)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--cream)' }}>Mapa de Trayectorias</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno..."
                style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 8, padding: '6px 10px 6px 30px', color: 'var(--cream)', fontSize: '0.82rem', width: 160 }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 8, padding: '6px 10px', color: 'var(--cream)', fontSize: '0.82rem' }}>
              <option value="all">Todos</option>
              <option value="active">En Proceso</option>
              <option value="simulation">Simulación</option>
              <option value="completed">Finalizada</option>
              <option value="none">Sin Pasantía</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Alumno/a', 'Docente Tutor', 'Empresa', 'Horas', 'Visitas', 'ICE', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: s.ice ? 'rgba(248,113,113,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                  <td style={{ padding: '9px 14px', color: 'var(--cream)', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '9px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{teacherMap[s.teacher]?.name.split(',')[0] || '—'}</td>
                  <td style={{ padding: '9px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.company}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 4, borderRadius: 2, background: 'rgba(250,245,237,0.1)' }}>
                        <div style={{ width: `${Math.min(s.hours, 100)}%`, height: '100%', borderRadius: 2, background: s.hours >= 100 ? '#4ade80' : 'var(--gold)' }} />
                      </div>
                      <span style={{ color: s.hours >= 100 ? '#4ade80' : 'var(--smoke)' }}>{s.hours}hs</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 14px', color: s.visits < 2 ? '#f87171' : '#4ade80', fontWeight: 600 }}>{s.visits}/2</td>
                  <td style={{ padding: '9px 14px' }}>{s.ice ? <span style={{ color: '#f87171', fontWeight: 700 }}>ICE</span> : <span style={{ color: 'var(--smoke)' }}>—</span>}</td>
                  <td style={{ padding: '9px 14px' }}><Badge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(250,245,237,0.06)', color: 'var(--smoke)', fontSize: '0.78rem' }}>
          {filtered.length} de {students.length} alumnos
        </div>
      </div>
    </div>
  )
}

// ─── TEACHERS TAB ─────────────────────────────────────────────────────────────

function TeachersTab({ teachers, setTeachers }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', school: 'Ing. Ricardo Videla', subject: '' })
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  function addTeacher() {
    if (!newTeacher.name || !newTeacher.email) return
    const t = { id: `t${Date.now()}`, ...newTeacher, students: 0, visits: 0, pending: 0 }
    setTeachers(prev => [...prev, t])
    setShowAdd(false)
    setNewTeacher({ name: '', email: '', school: 'Ing. Ricardo Videla', subject: '' })
    setMsg(`✅ Docente ${t.name} creado. Credenciales temporales enviadas a ${t.email}`)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {msg && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 16px', color: '#4ade80', fontSize: '0.85rem' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar docente..."
            style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--wine)', border: 'none', borderRadius: 10, padding: '9px 18px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          <UserPlus size={15} /> Nuevo Docente
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 10, padding: '9px 14px', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          <Upload size={14} /> Importar CSV
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'rgba(250,245,237,0.04)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 4 }}>Crear cuenta docente</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'name', label: 'Nombre completo (APELLIDO, Nombre)', placeholder: 'GARCÍA, María' },
              { key: 'email', label: 'Email institucional', placeholder: 'mgarcia@escola.edu.ar' },
              { key: 'school', label: 'Escuela', placeholder: 'Ing. Ricardo Videla' },
              { key: 'subject', label: 'Materia / Especialidad', placeholder: 'Proyecto Vocacional' },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{f.label}</label>
                <input value={newTeacher[f.key]} onChange={e => setNewTeacher(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.12)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={addTeacher} style={{ background: 'var(--wine)', border: 'none', borderRadius: 8, padding: '8px 18px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              Crear + enviar credenciales
            </button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: '1px solid rgba(250,245,237,0.15)', borderRadius: 8, padding: '8px 14px', color: 'var(--smoke)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Docente', 'Email', 'Alumnos', 'Visitas', 'Cumplimiento', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const pct = t.students === 0 ? 100 : Math.min(100, Math.round(t.visits / (t.students * 2) * 100))
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cream)' }}>{t.name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{t.email}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--smoke)' }}>{t.students}</td>
                    <td style={{ padding: '12px 16px', color: t.visits === 0 && t.students > 0 ? '#f87171' : 'var(--smoke)', fontWeight: t.visits === 0 && t.students > 0 ? 700 : 400 }}>
                      {t.visits === 0 && t.students > 0 ? '⚠ 0' : t.visits}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(250,245,237,0.1)' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: pct >= 100 ? '#4ade80' : pct > 50 ? '#f59e0b' : '#f87171' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button title="Enviar recordatorio" style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 6, padding: '4px 8px', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.75rem' }}>
                          <Mail size={12} />
                        </button>
                        <button title="Ver perfil" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: '4px 8px', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem' }}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── COMPANIES TAB ────────────────────────────────────────────────────────────

function CompaniesTab({ companies, setCompanies }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.cuit.includes(search)
    const matchFilter = filter === 'all' || (filter === 'pending' && !c.verified) || (filter === 'verified' && c.verified)
    return matchSearch && matchFilter
  })

  function verify(id) {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, verified: true } : c))
  }

  const pending = companies.filter(c => !c.verified).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {pending > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} color="#f59e0b" />
          <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>{pending} empresa{pending > 1 ? 's' : ''} pendiente{pending > 1 ? 's' : ''} de verificación CUIT/ATM</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa o CUIT..."
            style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 14px', color: 'var(--cream)', fontSize: '0.85rem' }}>
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="verified">Verificadas</option>
        </select>
      </div>

      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Empresa', 'CUIT', 'Sector', 'Referente', 'Alumnos', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--cream)' }}>{c.name}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--smoke)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.cuit}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{c.sector}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{c.contact}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--smoke)' }}>{c.students}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {c.verified
                      ? <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.78rem' }}>✅ Verificada</span>
                      : <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.78rem' }}>⏳ Pendiente</span>}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {!c.verified && (
                      <button onClick={() => verify(c.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 7, padding: '5px 12px', color: '#4ade80', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        <ShieldCheck size={12} /> Aprobar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [cfg, setCfg] = useState(DEMO_SETTINGS)
  const [saved, setSaved] = useState(false)

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const incentive = Math.round(cfg.smvm * (cfg.incentive_pct / 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
      {saved && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 16px', color: '#4ade80', fontSize: '0.85rem' }}>✅ Configuración guardada</div>}

      {/* SMVM */}
      <Section icon={DollarSign} title="Incentivo Económico (SMVM)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="SMVM actual ($)" value={cfg.smvm} onChange={v => setCfg(p => ({ ...p, smvm: +v }))} type="number" />
          <Field label="% Incentivo (Programa Enlace)" value={cfg.incentive_pct} onChange={v => setCfg(p => ({ ...p, incentive_pct: +v }))} type="number" />
        </div>
        <div style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--smoke)' }}>Incentivo mensual calculado: </span>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1rem' }}>${incentive.toLocaleString('es-AR')}</span>
        </div>
      </Section>

      {/* Reglas de asistencia */}
      <Section icon={Clock} title="Reglas de Asistencia (DGE Res. 1850/2022)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Máx. horas/día" value={cfg.max_hours_day} onChange={v => setCfg(p => ({ ...p, max_hours_day: +v }))} type="number" />
          <Field label="Máx. horas/semana" value={cfg.max_hours_week} onChange={v => setCfg(p => ({ ...p, max_hours_week: +v }))} type="number" />
          <Field label="Horario desde" value={cfg.time_from} onChange={v => setCfg(p => ({ ...p, time_from: v }))} type="time" />
          <Field label="Horario hasta" value={cfg.time_to} onChange={v => setCfg(p => ({ ...p, time_to: v }))} type="time" />
          <Field label="Meta total de horas" value={cfg.total_hours_goal} onChange={v => setCfg(p => ({ ...p, total_hours_goal: +v }))} type="number" />
          <Field label="Visitas mínimas obligatorias" value={cfg.min_visits} onChange={v => setCfg(p => ({ ...p, min_visits: +v }))} type="number" />
        </div>
      </Section>

      {/* Calendario de tandas */}
      <Section icon={Calendar} title="Calendario de Tandas">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cfg.calendar.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 10, alignItems: 'end' }}>
              <Field label="Curso" value={t.course} onChange={v => setCfg(p => ({ ...p, calendar: p.calendar.map((c, j) => j === i ? { ...c, course: v } : c) }))} />
              <Field label="Etiqueta" value={t.label} onChange={v => setCfg(p => ({ ...p, calendar: p.calendar.map((c, j) => j === i ? { ...c, label: v } : c) }))} />
              <Field label="Desde" value={t.from} onChange={v => setCfg(p => ({ ...p, calendar: p.calendar.map((c, j) => j === i ? { ...c, from: v } : c) }))} type="date" />
              <Field label="Hasta" value={t.to} onChange={v => setCfg(p => ({ ...p, calendar: p.calendar.map((c, j) => j === i ? { ...c, to: v } : c) }))} type="date" />
            </div>
          ))}
          <button onClick={() => setCfg(p => ({ ...p, calendar: [...p.calendar, { course: '', label: 'Tanda', from: '', to: '' }] }))}
            style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed rgba(212,168,67,0.4)', borderRadius: 8, padding: '6px 14px', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.82rem' }}>
            + Agregar tanda
          </button>
        </div>
      </Section>

      {/* Rúbrica */}
      <Section icon={Sliders} title="Editor de Rúbrica (12 puntos)">
        <div style={{ color: 'var(--smoke)', fontSize: '0.84rem', lineHeight: 1.6 }}>
          <p>La rúbrica evalúa 4 criterios de 1–3 puntos cada uno (total: 4–12).</p>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Asistencia y puntualidad', 'Presentación y uniforme', 'Conocimientos técnicos', 'Informe final'].map((crit, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250,245,237,0.04)', padding: '8px 14px', borderRadius: 8 }}>
                <span style={{ color: 'var(--cream)' }}>{crit}</span>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>1–3 pts</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--smoke)' }}>
            Escala: 12→10.0 · 8→7.0 · 4→3.0 (interpolación lineal entre rangos)
          </div>
        </div>
      </Section>

      <button onClick={save} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--wine)', border: 'none', borderRadius: 10, padding: '11px 24px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
        <RefreshCw size={14} /> Guardar configuración
      </button>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(250,245,237,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={15} color="var(--gold)" />
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--cream)' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.77rem', color: 'var(--smoke)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.12)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
    </div>
  )
}

// ─── EXPORT TAB ───────────────────────────────────────────────────────────────

function ExportTab({ students, teachers }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]))

  function exportCSV() {
    setLoading(true)
    setTimeout(() => {
      const rows = [
        ['Alumno', 'Docente Tutor', 'Empresa', 'Horas', 'Visitas', 'Estado', 'Nota Final (simulada)'],
        ...students.map(s => [
          s.name, teacherMap[s.teacher]?.name || '', s.company,
          s.hours, s.visits, statusLabel[s.status] || s.status,
          s.visits >= 2 && s.hours >= 100 ? '8.5' : '—'
        ])
      ]
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'GEM_notas_5to3ra.csv'; a.click()
      setLoading(false); setDone(true); setTimeout(() => setDone(false), 3000)
    }, 800)
  }

  const readyCount = students.filter(s => s.visits >= 2 && s.hours >= 100).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Download size={18} color="var(--gold)" />
          <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '1rem' }}>Reporte de Notas — GEM</span>
        </div>
        <p style={{ color: 'var(--smoke)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
          Genera el CSV con las notas finales de rúbrica de todos los alumnos del curso.
          Incluye columnas listas para cargar en el sistema GEM del docente.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(250,245,237,0.04)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80' }}>{readyCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>Alumnos con nota posible</div>
          </div>
          <div style={{ background: 'rgba(250,245,237,0.04)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{students.length - readyCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>Sin condiciones aún</div>
          </div>
        </div>
        {done && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '8px 14px', color: '#4ade80', fontSize: '0.83rem', marginBottom: 12 }}>✅ Archivo descargado: GEM_notas_5to3ra.csv</div>}
        <button onClick={exportCSV} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: loading ? 'rgba(124,29,47,0.4)' : 'var(--wine)', border: 'none', borderRadius: 10, padding: '11px 22px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
          <Download size={15} /> {loading ? 'Generando...' : 'Descargar CSV para GEM'}
        </button>
      </div>

      {/* Firma digital */}
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <ShieldCheck size={18} color="#60a5fa" />
          <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '1rem' }}>Validación de Firmas Digitales</span>
        </div>
        <p style={{ color: 'var(--smoke)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
          Como Master Admin, sos el último paso en la cadena de firma. Verificás la autenticidad de las firmas de padres/tutores antes de liberar la pasantía.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.filter(s => s.hours > 0).slice(0, 5).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250,245,237,0.03)', borderRadius: 8, padding: '8px 14px' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--cream)' }}>{s.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✅ PDF firmado</span>
                <button style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: '3px 10px', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem' }}>
                  Validar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('monitor')
  const [teachers, setTeachers] = useState(DEMO_TEACHERS)
  const [companies, setCompanies] = useState(DEMO_COMPANIES)

  function logout() { clearAuth(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink-soft)', borderBottom: '1px solid rgba(250,245,237,0.08)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, background: 'var(--wine)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>V</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--cream)' }}>Vínculo Mendoza</span>
              <span style={{ marginLeft: 8, fontSize: '0.75rem', background: 'rgba(124,29,47,0.4)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 6, padding: '1px 8px', color: 'var(--gold)' }}>
                🛡 MASTER ADMIN
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>admin@demo.com</span>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(250,245,237,0.12)', borderRadius: 8, padding: '6px 12px', color: 'var(--smoke)', cursor: 'pointer', fontSize: '0.8rem' }}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(250,245,237,0.04)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                background: tab === t.id ? 'var(--wine)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--smoke)',
              }}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'monitor'   && <MonitorTab students={DEMO_STUDENTS} teachers={teachers} />}
        {tab === 'teachers'  && <TeachersTab teachers={teachers} setTeachers={setTeachers} />}
        {tab === 'companies' && <CompaniesTab companies={companies} setCompanies={setCompanies} />}
        {tab === 'settings'  && <SettingsTab />}
        {tab === 'export'    && <ExportTab students={DEMO_STUDENTS} teachers={teachers} />}
      </div>
    </div>
  )
}
