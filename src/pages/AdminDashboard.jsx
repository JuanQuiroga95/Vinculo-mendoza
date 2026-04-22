// src/pages/AdminDashboard.jsx — v2.1 (clean rebuild)
import { useState, useMemo, useEffect } from 'react'
import {
  Users, Building2, Eye, Settings, Download, ShieldCheck,
  AlertTriangle, CheckCircle, Clock, Bell, Plus,
  Search, LogOut, BarChart3, Upload,
  Lock, Unlock, FileText, Sliders, Calendar, DollarSign,
  UserPlus, RefreshCw, Mail, X,
} from 'lucide-react'
import { clearAuth, getToken } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

// ─── API ──────────────────────────────────────────────────────────────────────
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_TEACHERS = [
  { id: 't1',  name: 'VIDELA, Eliana',       email: 'evidela@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
  { id: 't2',  name: 'MARTÍN, Cecilia',       email: 'cmartin@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 4,  visits: 5, pending: 1 },
  { id: 't3',  name: 'CULTRERA, Laura',        email: 'lcultrera@escola.edu.ar',  school: 'Ing. Ricardo Videla', students: 2,  visits: 1, pending: 1 },
  { id: 't4',  name: 'ESCUDERO, Mauricio',     email: 'mescudero@escola.edu.ar',  school: 'Ing. Ricardo Videla', students: 3,  visits: 6, pending: 0 },
  { id: 't5',  name: 'GRECO, Marisol',         email: 'mgreco@escola.edu.ar',     school: 'Ing. Ricardo Videla', students: 3,  visits: 0, pending: 3 },
  { id: 't6',  name: 'SILVA, Alejandro',       email: 'asilva@escola.edu.ar',     school: 'Ing. Ricardo Videla', students: 3,  visits: 4, pending: 0 },
  { id: 't7',  name: 'LENI, Fabio',            email: 'fleni@escola.edu.ar',      school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
  { id: 't8',  name: 'VECCHIUTTI, Yamila',     email: 'yvecchiutti@escola.edu.ar',school: 'Ing. Ricardo Videla', students: 3,  visits: 3, pending: 0 },
  { id: 't9',  name: 'SPAMPINATO, Jésica',     email: 'jspampinato@escola.edu.ar',school: 'Ing. Ricardo Videla', students: 2,  visits: 2, pending: 0 },
  { id: 't10', name: 'ERMACORA, Sebastián',    email: 'sermacora@escola.edu.ar',  school: 'Ing. Ricardo Videla', students: 3,  visits: 1, pending: 2 },
  { id: 't11', name: 'TORRES, Vanina',         email: 'vtorres@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
]

const DEMO_STUDENTS_BASE = [
  { id: 's1',  name: 'ALVAREZ CORTEZ, Juan Ignacio',      teacher: 't1',  company: 'Ferretería Silvestrini',          status: 'active',     hours: 72,  visits: 2 },
  { id: 's2',  name: 'ARANCIBIA CASTRO, Agostina Ailén',  teacher: 't2',  company: 'CEPA S.R.L.',                     status: 'active',     hours: 60,  visits: 1 },
  { id: 's3',  name: 'ARRIETA LEON, Lourdes Yamile',      teacher: 't2',  company: 'CEPA S.R.L.',                     status: 'active',     hours: 55,  visits: 1 },
  { id: 's4',  name: 'REVOLLO HUANCA, Camila Sabrina',    teacher: 't2',  company: 'Farmacia El Pino',                status: 'active',     hours: 80,  visits: 2 },
  { id: 's5',  name: 'ROBLEDO SALAZAR, María Agustina',   teacher: 't2',  company: 'Farmacia El Pino',                status: 'simulation', hours: 40,  visits: 1 },
  { id: 's6',  name: 'CORREA, Ana Paula',                  teacher: 't3',  company: 'Corralón Luján S.A.',             status: 'active',     hours: 100, visits: 1 },
  { id: 's7',  name: 'LUCERO VIDELA, Ignacio',             teacher: 't3',  company: 'Estudio Contable Yamin',          status: 'active',     hours: 88,  visits: 0 },
  { id: 's8',  name: 'VEDIA JANCO, Magali Anabella',       teacher: 't4',  company: 'DISVEC Representaciones',         status: 'active',     hours: 95,  visits: 2 },
  { id: 's9',  name: 'GIRÓN VEDIA, Milagros Elizabeth',    teacher: 't4',  company: 'DISVEC Representaciones',         status: 'active',     hours: 90,  visits: 2 },
  { id: 's10', name: 'JOFRE GOMEZ, Leonel Valentín',       teacher: 't4',  company: 'Aguerre Ferretería',              status: 'active',     hours: 78,  visits: 2 },
  { id: 's11', name: 'RODRIGUEZ NAVARRO, Mara Agostina',   teacher: 't5',  company: 'H30 Ferretería Express',          status: 'active',     hours: 45,  visits: 0 },
  { id: 's12', name: 'NOROÑA, Sofía Macarena',             teacher: 't5',  company: 'H30 Ferretería Express',          status: 'active',     hours: 50,  visits: 0 },
  { id: 's13', name: 'VELAZQUEZ, Santiago',                teacher: 't5',  company: 'Estudio Jurídico Cicilotto',      status: 'active',     hours: 30,  visits: 0 },
  { id: 's14', name: 'PEÑALOZA, Agustín David',            teacher: 't6',  company: 'Expreso Luján',                   status: 'active',     hours: 65,  visits: 2 },
  { id: 's15', name: 'CUEVAS BUSTAMANTE, Lorena Mariela',  teacher: 't6',  company: 'Nexo Seguros',                    status: 'active',     hours: 70,  visits: 2 },
  { id: 's16', name: 'ROJAS, Mariángel',                   teacher: 't6',  company: 'Nexo Seguros',                    status: 'active',     hours: 60,  visits: 0 },
  { id: 's17', name: 'PONCE, Lautaro Uriel',               teacher: 't7',  company: 'Farmacia Santa Cruz',             status: 'active',     hours: 85,  visits: 2 },
  { id: 's18', name: 'TALQUENCA, Alelí Marisol',           teacher: 't8',  company: 'Café y Delicatessen (Entre Dos)', status: 'active',     hours: 55,  visits: 1 },
  { id: 's19', name: 'LEYES ELIZONDO, Alexis Miguel',      teacher: 't8',  company: 'Café y Delicatessen (Entre Dos)', status: 'active',     hours: 60,  visits: 1 },
  { id: 's20', name: 'PEDERNERA, Simón Alfonso',           teacher: 't8',  company: 'Inmobiliaria Romero Suñer',       status: 'active',     hours: 75,  visits: 1 },
  { id: 's21', name: 'VERDIER, Valentina',                 teacher: 't9',  company: 'Estudio Jurídico Cicilotto',      status: 'active',     hours: 90,  visits: 2 },
  { id: 's22', name: 'IRIBARREN, Morena Marianela',        teacher: 't9',  company: 'TEMIS S.A.',                      status: 'active',     hours: 82,  visits: 2 },
  { id: 's23', name: 'MENDEZ-GOMEZ, Alexander Eduardo',    teacher: 't10', company: 'Dique Potrerillos S.A.',          status: 'active',     hours: 40,  visits: 1 },
  { id: 's24', name: 'REINOSO RIQUELME, Lautaro Andrés',   teacher: 't10', company: 'Dique Potrerillos S.A.',          status: 'active',     hours: 38,  visits: 0 },
  { id: 's25', name: 'SANTANDER, Brian Emanuel',           teacher: 't10', company: '(Sin empresa asignada)',          status: 'none',       hours: 0,   visits: 0 },
  { id: 's26', name: 'ORTEGOZA, Valentina Lorenza',        teacher: 't11', company: 'JARMAYAL S.A.S.',                 status: 'active',     hours: 30,  visits: 2 },
]

const DEMO_COMPANIES = [
  { id: 'c1',  name: 'Ferretería Silvestrini',          cuit: '30-71234567-1', verified: true,  sector: 'Comercio',      students: 1, contact: 'Víctor Silvestrini',   phone: '2614987644' },
  { id: 'c2',  name: 'CEPA S.R.L.',                     cuit: '30-68901234-5', verified: true,  sector: 'Servicios',     students: 2, contact: 'Sylvia Retamales',     phone: '2615150349' },
  { id: 'c3',  name: 'Farmacia El Pino',                cuit: '20-12345678-9', verified: true,  sector: 'Salud',         students: 2, contact: 'Martín D. Segura',     phone: '' },
  { id: 'c4',  name: 'Corralón Luján S.A.',             cuit: '30-45678901-2', verified: true,  sector: 'Comercio',      students: 1, contact: 'Córdoba M. del Valle', phone: '2615996249' },
  { id: 'c5',  name: 'Estudio Contable Yamin',          cuit: '20-98765432-1', verified: true,  sector: 'Contabilidad',  students: 1, contact: 'Alejandra Yamin',      phone: '2614683805' },
  { id: 'c6',  name: 'DISVEC Representaciones',         cuit: '30-55443322-7', verified: true,  sector: 'Comercio',      students: 2, contact: 'Cintia B. Cazón',      phone: '2612056520' },
  { id: 'c7',  name: 'Aguerre Ferretería',              cuit: '20-33221100-4', verified: false, sector: 'Comercio',      students: 1, contact: 'Federico Di Santo',    phone: '2615071541' },
  { id: 'c8',  name: 'H30 Ferretería Express',          cuit: '30-77665544-3', verified: true,  sector: 'Comercio',      students: 2, contact: 'Ricardo Bologna',      phone: '2616930773' },
  { id: 'c9',  name: 'Estudio Jurídico Cicilotto',      cuit: '20-44332211-8', verified: true,  sector: 'Legal',         students: 2, contact: 'Cicilotto Cristian',   phone: '2614984054' },
  { id: 'c10', name: 'Expreso Luján',                   cuit: '30-12398765-5', verified: true,  sector: 'Transporte',    students: 1, contact: 'Roxana Duscio',        phone: '2612183679' },
  { id: 'c11', name: 'Nexo Seguros',                    cuit: '30-87654321-0', verified: false, sector: 'Seguros',       students: 2, contact: 'Gabriela Quiroga',     phone: '2616664775' },
  { id: 'c12', name: 'Farmacia Santa Cruz',             cuit: '20-56781234-6', verified: true,  sector: 'Salud',         students: 1, contact: 'Martín D. Segura',     phone: '2615692380' },
  { id: 'c13', name: 'Café y Delicatessen (Entre Dos)', cuit: '30-23456789-3', verified: true,  sector: 'Gastronomía',   students: 2, contact: 'Alonso José',          phone: '2616110040' },
  { id: 'c14', name: 'Inmobiliaria Romero Suñer',       cuit: '20-65432187-2', verified: true,  sector: 'Inmobiliaria',  students: 1, contact: 'María C. Romero',      phone: '' },
  { id: 'c15', name: 'TEMIS S.A.',                      cuit: '30-34567890-9', verified: true,  sector: 'Servicios',     students: 1, contact: 'Milca Galat Giorgi',   phone: '2612053029' },
  { id: 'c16', name: 'Dique Potrerillos S.A.',          cuit: '30-67890123-4', verified: false, sector: 'Turismo',       students: 2, contact: 'Ignacio Robello',      phone: '2615071541' },
  { id: 'c17', name: 'JARMAYAL S.A.S.',                 cuit: '30-11223344-6', verified: true,  sector: 'Agroindustria', students: 1, contact: 'Luis Amaya',           phone: '2612505826' },
]

const DEMO_SETTINGS = {
  smvm: 234315, incentive_pct: 85, max_hours_day: 4, max_hours_week: 20,
  time_from: '08:00', time_to: '18:00', total_hours_goal: 100, min_visits: 2,
  calendar: [
    { course: '5° 1°', label: 'Tanda 1', from: '2025-08-04', to: '2025-08-15' },
    { course: '5° 2°', label: 'Tanda 1', from: '2025-08-18', to: '2025-08-29' },
    { course: '5° 3°', label: 'Tanda 1', from: '2025-09-01', to: '2025-09-12' },
  ],
}

const INITIAL_ICE = { s13: { blocked: true, reason: 'Condición condicional por materias previas', set_at: '10/04/2025' } }
const ACCIDENT_TYPES = { accidente_trabajo: 'Accidente de trabajo', accidente_in_itinere: 'Accidente in itinere', enfermedad_profesional: 'Enfermedad profesional' }
const statusLabel = { active: 'En proceso', completed: 'Finalizada', simulation: 'Simulación', none: 'Sin pasantía', blocked: 'Bloqueada' }
const statusColor = { active: '#4ade80', completed: '#60a5fa', simulation: '#f59e0b', none: '#6b7280', blocked: '#f87171' }

// ─── UI atoms ────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const col = statusColor[status] || '#6b7280'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: col + '22', color: col, border: `1px solid ${col}44` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />
      {statusLabel[status] || status}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--wine)', alert }) {
  return (
    <div style={{ background: 'var(--ink-soft)', border: `1px solid ${alert ? '#f8717133' : 'rgba(250,245,237,0.08)'}`, borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden' }}>
      {alert && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#f87171' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: alert ? '#f87171' : 'var(--cream)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>{sub}</div>}
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

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'monitor',    label: 'Monitor Global', icon: BarChart3 },
  { id: 'ice',        label: 'Control ICE',    icon: Lock },
  { id: 'siniestros', label: 'Siniestros',     icon: AlertTriangle },
  { id: 'abm',        label: 'Usuarios',       icon: UserPlus },
  { id: 'teachers',   label: 'Docentes',       icon: Users },
  { id: 'companies',  label: 'Empresas',       icon: Building2 },
  { id: 'import',     label: 'Importar datos', icon: Upload },
  { id: 'settings',   label: 'Configuración',  icon: Settings },
  { id: 'export',     label: 'Exportar GEM',   icon: Download },
]


// ─── ABM DE USUARIOS ─────────────────────────────────────────────────────────
function ABMTab() {
  const [section, setSection] = useState('students')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // 'add_student' | 'add_teacher' | 'add_company' | 'confirm_delete'
  const [form, setForm] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [msg, setMsg] = useState('')
  const [teachers, setTeachers] = useState([])
  const [companies, setCompanies] = useState([])

  useEffect(() => { loadList() }, [section])
  useEffect(() => {
    // Cargar docentes y empresas para el select de asignación
    fetch('/api/admin/users?type=teachers', { headers: authHeaders() }).then(r => r.json()).then(d => setTeachers(d.teachers || [])).catch(() => {})
    fetch('/api/admin/users?type=companies', { headers: authHeaders() }).then(r => r.json()).then(d => setCompanies(d.companies || [])).catch(() => {})
  }, [])

  async function loadList() {
    setLoading(true)
    try {
      const data = await fetch(`/api/admin/users?type=${section}`, { headers: authHeaders() }).then(r => r.json())
      setList(data.students || data.teachers || data.companies || [])
    } catch { setList([]) }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    setMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ type: section === 'students' ? 'student' : section === 'teachers' ? 'teacher' : 'company', ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      let msg = `✓ ${section === 'students' ? 'Alumno' : section === 'teachers' ? 'Docente' : 'Empresa'} creado`
      if (data.generated_password) msg += ` · Contraseña generada: ${data.generated_password}`
      setMsg(msg)
      setModal(null); setForm({}); loadList()
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  async function handleDelete() {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE', headers: authHeaders(),
        body: JSON.stringify({ user_id: deleteTarget.user_id })
      })
      if (!res.ok) throw new Error('Error al eliminar')
      setMsg(`✓ Usuario eliminado`)
      setDeleteTarget(null); setModal(null); loadList()
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  const sectionConfig = {
    students:  { label: 'Alumnos',  addLabel: 'Nuevo alumno',  icon: Users },
    teachers:  { label: 'Docentes', addLabel: 'Nuevo docente', icon: Users },
    companies: { label: 'Empresas', addLabel: 'Nueva empresa', icon: Building2 },
  }

  const FIELDS = {
    students: [
      { key: 'full_name',   label: 'Apellido y Nombre *', placeholder: 'GARCIA, María' },
      { key: 'email',       label: 'Email (usuario) *',   placeholder: 'mgarcia@gmail.com' },
      { key: 'password',    label: 'Contraseña (vacío = auto)', placeholder: 'Dejar vacío para generar' },
      { key: 'school',      label: 'Escuela',             placeholder: 'Ing. Ricardo Videla' },
      { key: 'orientation', label: 'Orientación',         placeholder: 'Contabilidad' },
      { key: 'grade',       label: 'Curso',               placeholder: '5to 3ra' },
      { key: 'location',    label: 'Localidad',           placeholder: 'Luján de Cuyo' },
    ],
    teachers: [
      { key: 'full_name', label: 'Apellido y Nombre *', placeholder: 'MARTIN, Cecilia' },
      { key: 'email',     label: 'Email (usuario) *',   placeholder: 'cmartin@escola.edu.ar' },
      { key: 'password',  label: 'Contraseña (vacío = auto)', placeholder: 'Dejar vacío para generar' },
      { key: 'school',    label: 'Escuela',             placeholder: 'Ing. Ricardo Videla' },
      { key: 'subject',   label: 'Materia',             placeholder: 'Proyecto Vocacional' },
    ],
    companies: [
      { key: 'company_name',  label: 'Razón social *',  placeholder: 'Ferretería Silvestrini' },
      { key: 'email',         label: 'Email',           placeholder: 'contacto@empresa.com' },
      { key: 'cuit',          label: 'CUIT',            placeholder: '30712345671' },
      { key: 'sector',        label: 'Sector',          placeholder: 'Comercio' },
      { key: 'contact_name',  label: 'Referente',       placeholder: 'Víctor Silvestrini' },
      { key: 'location',      label: 'Localidad',       placeholder: 'Luján de Cuyo' },
    ],
  }

  return (
    <div>
      {msg && (
        <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }} onClick={() => setMsg('')}>
          {msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} />
        </div>
      )}

      {/* Selector de sección */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.entries(sectionConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => { setSection(key); setMsg('') }}
            style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', background: section === key ? 'var(--wine)' : 'rgba(255,255,255,0.06)', color: section === key ? 'white' : 'var(--smoke)' }}>
            {cfg.label}
          </button>
        ))}
        <button onClick={() => { setForm({}); setModal('add') }}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', background: 'var(--teal)', color: 'var(--ink)' }}>
          <Plus size={15} /> {sectionConfig[section].addLabel}
        </button>
      </div>

      {/* Tabla */}
      {loading
        ? <div style={{ textAlign: 'center', padding: 50, color: 'var(--smoke)' }}>Cargando…</div>
        : (
          <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                    {section === 'students' && ['Alumno/a', 'Email', 'Escuela', 'Curso', 'Docente tutor', 'Empresa', 'Horas', 'ICE', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                    {section === 'teachers' && ['Docente', 'Email', 'Escuela', 'Materia', 'Alumnos', 'Visitas', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                    {section === 'companies' && ['Empresa', 'Email', 'CUIT', 'Sector', 'Referente', 'Alumnos', 'Verificada', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--smoke)' }}>No hay registros todavía.</td></tr>
                  )}
                  {section === 'students' && list.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i%2===0?'transparent':'rgba(250,245,237,0.02)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--cream)', fontWeight: 500 }}>{s.full_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.email}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.school || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.grade || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.teacher_name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.company_name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: s.total_hours >= 100 ? '#4ade80' : 'var(--smoke)' }}>{s.total_hours || 0}hs</td>
                      <td style={{ padding: '10px 14px' }}>{s.ice ? <span style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700 }}>● ICE</span> : <span style={{ color: 'var(--smoke)' }}>—</span>}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => { setDeleteTarget({ user_id: s.user_id, name: s.full_name }); setModal('confirm_delete') }}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '4px 10px', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {section === 'teachers' && list.map((t, i) => (
                    <tr key={t.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i%2===0?'transparent':'rgba(250,245,237,0.02)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--cream)', fontWeight: 500 }}>{t.full_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{t.email}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{t.school || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{t.subject || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)' }}>{t.student_count || 0}</td>
                      <td style={{ padding: '10px 14px', color: t.visit_count === 0 && t.student_count > 0 ? '#f87171' : 'var(--smoke)' }}>{t.visit_count || 0}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => { setDeleteTarget({ user_id: t.user_id, name: t.full_name }); setModal('confirm_delete') }}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '4px 10px', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {section === 'companies' && list.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i%2===0?'transparent':'rgba(250,245,237,0.02)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--cream)', fontWeight: 500 }}>{c.company_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{c.email}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.cuit || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{c.sector || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{c.contact_name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)' }}>{c.student_count || 0}</td>
                      <td style={{ padding: '10px 14px' }}>{c.verified ? <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>✅</span> : <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⏳</span>}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => { setDeleteTarget({ user_id: c.user_id, name: c.company_name }); setModal('confirm_delete') }}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '4px 10px', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Modal agregar */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>
                {sectionConfig[section].addLabel}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--smoke)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FIELDS[section].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} type={f.key === 'password' ? 'password' : 'text'}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }} />
                </div>
              ))}
              {/* Si es alumno, selector de docente tutor y empresa */}
              {section === 'students' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Docente tutor asignado</label>
                    <select value={form.teacher_id || ''} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }}>
                      <option value="">Sin asignar</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Empresa asignada</label>
                    <select value={form.company_id || ''} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }}>
                      <option value="">Sin asignar</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Fecha inicio pasantía</label>
                    <input type="date" value={form.start_date || ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--muted)' }}>
                    <input type="checkbox" checked={!!form.is_simulation} onChange={e => setForm(p => ({ ...p, is_simulation: e.target.checked }))} />
                    Proyecto de simulación (sin empresa real)
                  </label>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-teal btn-sm" onClick={handleCreate}>✓ Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {modal === 'confirm_delete' && deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ color: '#f87171', fontFamily: 'var(--font-display)', marginBottom: 16 }}>⚠ Confirmar eliminación</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>¿Estás seguro de que querés eliminar a:</p>
            <p style={{ fontSize: '1rem', color: 'var(--cream)', fontWeight: 600, marginBottom: 20 }}>{deleteTarget.name}</p>
            <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, marginBottom: 20, fontSize: '0.82rem', color: '#fca5a5' }}>
              Esta acción eliminará al usuario y todos sus datos asociados (pasantías, asistencias, etc.). No se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setModal(null); setDeleteTarget(null) }}>Cancelar</button>
              <button onClick={handleDelete} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: '#f87171', color: 'white' }}>
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MONITOR ──────────────────────────────────────────────────────────────────
function MonitorTab({ students, teachers }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]))
  const alertTeachers = teachers.filter(t => t.students > 0 && t.visits === 0)
  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })
  const completedCount = students.filter(s => s.hours >= 100).length
  const iceCount = students.filter(s => s.ice).length
  const noneCount = students.filter(s => s.status === 'none').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <StatCard icon={Users} label="Alumnos totales" value={students.length} sub="5to 3ra — Ing. Ricardo Videla" color="var(--gold)" />
        <StatCard icon={CheckCircle} label="100hs completadas" value={completedCount} sub={`${students.length ? Math.round(completedCount / students.length * 100) : 0}% del curso`} color="#4ade80" />
        <StatCard icon={Clock} label="Promedio horas" value={`${students.length ? Math.round(students.reduce((a, s) => a + s.hours, 0) / students.length) : 0}hs`} sub="Meta: 100 horas" color="#60a5fa" />
        <StatCard icon={AlertTriangle} label="Sin empresa" value={noneCount} sub="Requieren acción" color="#f87171" alert={noneCount > 0} />
        <StatCard icon={Lock} label="Condición ICE" value={iceCount} sub="Bloqueados" color="#f87171" alert={iceCount > 0} />
      </div>
      {alertTeachers.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={16} /> Docentes sin visitas con alumnos activos
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {alertTeachers.map(t => (
              <span key={t.id} style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: '0.82rem', color: '#fca5a5' }}>
                {t.name} ({t.students} alumnos)
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno o empresa…"
            style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 14px', color: 'var(--cream)', fontSize: '0.85rem' }}>
          <option value="all">Todos</option>
          <option value="active">En proceso</option>
          <option value="simulation">Simulación</option>
          <option value="none">Sin pasantía</option>
          <option value="blocked">Bloqueado ICE</option>
        </select>
      </div>
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Alumno/a', 'Docente', 'Empresa', 'Horas', 'Visitas', 'ICE', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--cream)', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{teacherMap[s.teacher]?.name?.split(',')[0] || '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.company}</td>
                  <td style={{ padding: '10px 16px', color: s.hours >= 100 ? '#4ade80' : 'var(--smoke)', fontWeight: s.hours >= 100 ? 700 : 400 }}>{s.hours}hs</td>
                  <td style={{ padding: '10px 16px', color: s.visits >= 2 ? '#4ade80' : s.visits === 0 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{s.visits}</td>
                  <td style={{ padding: '10px 16px' }}>{s.ice ? <span style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700 }}>● ICE</span> : <span style={{ color: 'var(--smoke)' }}>—</span>}</td>
                  <td style={{ padding: '10px 16px' }}><Badge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── ICE ──────────────────────────────────────────────────────────────────────
function IceTab({ students, iceMap, onToggleIce }) {
  const [modal, setModal] = useState(null)
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const blocked = students.filter(s => s.ice)
  const filtered = students.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))

  async function confirmToggle() {
    onToggleIce(modal.student.id, modal.action === 'block', reason)
    setMsg(`${modal.action === 'block' ? 'ICE activado' : 'ICE levantado'} para ${modal.student.name} ✓`)
    setModal(null); setReason('')
    try {
      await fetch('/api/admin?_resource=dashboard&action=toggle_ice', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ student_id: modal.student.id, block: modal.action === 'block', reason })
      })
    } catch (e) { console.warn('ICE API:', e) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Lock} label="ICE activos" value={blocked.length} sub="Bloqueados del sistema" color="#f87171" alert={blocked.length > 0} />
        <StatCard icon={Users} label="Habilitados" value={students.filter(s => !s.ice && s.status !== 'none').length} sub="Pueden continuar" color="#4ade80" />
        <StatCard icon={Clock} label="Sin pasantía" value={students.filter(s => s.status === 'none').length} sub="Pendientes de ubicación" color="#fbbf24" />
      </div>
      {msg && <div className="alert alert-success" style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg}</div>}
      {blocked.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.88rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} /> Alumnos en condición ICE
          </div>
          {blocked.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.05)', borderRadius: 8, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: 2 }}>{iceMap[s.id]?.reason || 'Sin motivo'} · {iceMap[s.id]?.set_at}</div>
              </div>
              <button onClick={() => { setModal({ student: s, action: 'unblock' }); setReason('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '6px 14px', color: '#4ade80', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <Unlock size={13} /> Levantar ICE
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…"
          style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
      </div>
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Alumno/a', 'Empresa', 'Horas', 'Estado', 'ICE', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: s.ice ? 'rgba(248,113,113,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--cream)', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.company}</td>
                  <td style={{ padding: '10px 16px', color: s.hours >= 100 ? '#4ade80' : 'var(--smoke)' }}>{s.hours}hs</td>
                  <td style={{ padding: '10px 16px' }}><Badge status={s.status} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    {s.ice
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 99, padding: '2px 10px', fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}><Lock size={11} /> Bloqueado</span>
                      : <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {s.ice
                      ? <button onClick={() => { setModal({ student: s, action: 'unblock' }); setReason('') }} style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 7, padding: '5px 12px', color: '#4ade80', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}><Unlock size={11} /> Levantar</button>
                      : s.status !== 'none' && <button onClick={() => { setModal({ student: s, action: 'block' }); setReason('') }} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 7, padding: '5px 12px', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}><Lock size={11} /> Aplicar ICE</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: modal.action === 'block' ? '#f87171' : '#4ade80', fontFamily: 'var(--font-display)' }}>
                {modal.action === 'block' ? '⚠ Aplicar condición ICE' : '✓ Levantar condición ICE'}
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', marginBottom: 16 }}>Alumno/a: <strong style={{ color: 'var(--cream)' }}>{modal.student.name}</strong></p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>
                {modal.action === 'block' ? 'Motivo del bloqueo (requerido)' : 'Motivo del levantamiento (opcional)'}
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder={modal.action === 'block' ? 'Ej: Materias previas sin regularizar…' : 'Ej: Regularizó situación académica…'}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.88rem' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancelar</button>
              <button onClick={confirmToggle} disabled={modal.action === 'block' && !reason.trim()}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: modal.action === 'block' ? '#f87171' : '#4ade80', color: modal.action === 'block' ? 'white' : '#1a1a1a', opacity: modal.action === 'block' && !reason.trim() ? 0.5 : 1 }}>
                {modal.action === 'block' ? '⚠ Confirmar bloqueo' : '✓ Confirmar levantamiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SINIESTROS ───────────────────────────────────────────────────────────────
function SiniestrosTab({ students }) {
  const [accidents, setAccidents] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ student_id: '', report_type: 'accidente_trabajo', occurred_at: '', description: '' })
  const [msg, setMsg] = useState('')
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  function hoursFrom(a) { return Math.floor((Date.now() - new Date(a.occurred_at).getTime()) / 3600000) }
  function isOverdue(a) { return !a.sent_to_dge && hoursFrom(a) > 48 }

  function markSent(id) {
    setAccidents(prev => prev.map(a => a.id === id ? { ...a, sent_to_dge: true, sent_at: new Date().toISOString() } : a))
    setMsg('Siniestro marcado como enviado a DGE ✓')
  }

  function addAccident() {
    setAccidents(prev => [{ id: `a${Date.now()}`, ...form, reported_at: new Date().toISOString(), sent_to_dge: false, sent_at: null }, ...prev])
    setModal(false)
    setForm({ student_id: '', report_type: 'accidente_trabajo', occurred_at: '', description: '' })
    setMsg('Denuncia de siniestro registrada ✓')
  }

  const overdueCount = accidents.filter(a => isOverdue(a)).length
  const pendingCount = accidents.filter(a => !a.sent_to_dge).length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={AlertTriangle} label="Siniestros totales" value={accidents.length} sub="Histórico del ciclo" color="#fbbf24" />
        <StatCard icon={Clock} label="Pendientes de envío" value={pendingCount} sub="Antes de 72hs" color="#f87171" alert={pendingCount > 0} />
        <StatCard icon={AlertTriangle} label="Vencidos +48hs" value={overdueCount} sub="Acción urgente" color="#ef4444" alert={overdueCount > 0} />
      </div>
      {overdueCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, marginBottom: 20, color: '#fca5a5' }}>
          <AlertTriangle size={18} />
          <div>
            <div style={{ fontWeight: 600 }}>¡Alerta! {overdueCount} siniestro(s) superó las 48hs sin ser enviado a DGE</div>
            <div style={{ fontSize: '0.8rem', marginTop: 2 }}>El límite legal es 72 horas. Actuá de inmediato.</div>
          </div>
        </div>
      )}
      {msg && <div className="alert alert-success" style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Nueva denuncia</button>
      </div>
      {accidents.map(a => {
        const hrs = hoursFrom(a); const overdue = isOverdue(a); const student = studentMap[a.student_id]
        return (
          <div key={a.id} style={{ padding: '18px 20px', background: overdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${overdue ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 99, background: 'rgba(212,168,67,0.15)', color: 'var(--gold)', fontWeight: 600 }}>{ACCIDENT_TYPES[a.report_type]}</span>
                  {overdue && <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 700 }}>⚠ VENCIDO {hrs}hs</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{student?.name || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 2 }}>{student?.company} · {new Date(a.occurred_at).toLocaleString('es-AR')}</div>
              </div>
              <div>
                {a.sent_to_dge
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: '0.78rem', color: '#4ade80', fontWeight: 600 }}><CheckCircle size={12} /> Enviado a DGE</span>
                  : <button onClick={() => markSent(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: overdue ? '#ef4444' : 'var(--wine)', border: 'none', borderRadius: 8, padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}><CheckCircle size={13} /> Marcar enviado</button>
                }
              </div>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--smoke)', lineHeight: 1.5, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>{a.description}</div>
          </div>
        )
      })}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Registrar Denuncia de Siniestro</h3>
              <p style={{ fontSize: '0.82rem', marginTop: 4, color: '#fca5a5' }}>⚠ Debe enviarse a DGE antes de las 72hs del ocurrido.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Alumno/a</label>
                <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }}>
                  <option value="">Seleccioná…</option>
                  {students.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Tipo</label>
                <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }}>
                  {Object.entries(ACCIDENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Fecha y hora del ocurrido</label>
              <input type="datetime-local" value={form.occurred_at} onChange={e => setForm(f => ({ ...f, occurred_at: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                placeholder="Qué ocurrió, dónde, cómo y qué lesiones se produjeron…"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.88rem' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={addAccident} disabled={!form.student_id || !form.occurred_at || !form.description}>✓ Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DOCENTES ────────────────────────────────────────────────────────────────
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
    setShowAdd(false); setNewTeacher({ name: '', email: '', school: 'Ing. Ricardo Videla', subject: '' })
    setMsg(`✅ Docente ${t.name} creado. Credenciales enviadas a ${t.email}`)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {msg && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 16px', color: '#4ade80', fontSize: '0.85rem' }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar docente…"
            style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--wine)', border: 'none', borderRadius: 10, padding: '9px 18px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          <UserPlus size={15} /> Nuevo Docente
        </button>
      </div>
      {showAdd && (
        <div style={{ background: 'rgba(250,245,237,0.04)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 14 }}>Crear cuenta docente</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'name', label: 'Nombre completo (APELLIDO, Nombre)', placeholder: 'GARCÍA, María' },
              { key: 'email', label: 'Email institucional', placeholder: 'mgarcia@escola.edu.ar' },
              { key: 'school', label: 'Escuela', placeholder: 'Ing. Ricardo Videla' },
              { key: 'subject', label: 'Materia / Especialidad', placeholder: 'Proyecto Vocacional' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.78rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input value={newTeacher[f.key]} onChange={e => setNewTeacher(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.12)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={addTeacher} style={{ background: 'var(--wine)', border: 'none', borderRadius: 8, padding: '8px 18px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Crear + enviar credenciales</button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: '1px solid rgba(250,245,237,0.15)', borderRadius: 8, padding: '8px 14px', color: 'var(--smoke)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
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
                        <button title="Enviar recordatorio" style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 6, padding: '4px 8px', color: 'var(--gold)', cursor: 'pointer' }}><Mail size={12} /></button>
                        <button title="Ver perfil" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: '4px 8px', color: '#60a5fa', cursor: 'pointer' }}><Eye size={12} /></button>
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

// ─── EMPRESAS ────────────────────────────────────────────────────────────────
function CompaniesTab({ companies, setCompanies }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.cuit.includes(search)
    const matchFilter = filter === 'all' || (filter === 'pending' && !c.verified) || (filter === 'verified' && c.verified)
    return matchSearch && matchFilter
  })
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa o CUIT…"
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
                      <button onClick={() => setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, verified: true } : x))}
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

// ─── IMPORTAR ────────────────────────────────────────────────────────────────
function ImportTab() {
  const [step, setStep] = useState(null)
  const [sheets, setSheets] = useState({})
  const [activeSheet, setActiveSheet] = useState('alumnos')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState({})
  const [msg, setMsg] = useState('')
  const [fileName, setFileName] = useState('')

  const SHEET_KEYS = { alumnos: 'Alumnos', docentes: 'Docentes', empresas: 'Empresas', asignaciones: 'Asignaciones' }
  const SHEET_ORDER = ['alumnos', 'docentes', 'empresas', 'asignaciones']

  async function handleFile(file) {
    if (!file) return
    setFileName(file.name); setStep('uploading'); setMsg('')
    const sheetNameMap = { alumnos: 'Alumnos', docentes: 'Docentes', empresas: 'Empresas', asignaciones: 'Asignaciones' }
    try {
      const buffer = await file.arrayBuffer()
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
      const parsed = {}
      for (const [key, sheetName] of Object.entries(sheetNameMap)) {
        const ws = wb.Sheets[sheetName]
        if (!ws) { parsed[key] = []; continue }
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        const headers = raw[4] // fila 5 (índice 4) son los headers
        if (!headers) { parsed[key] = []; continue }
        const dataRows = raw.slice(8).filter(r => r.some(c => c !== ''))
        parsed[key] = dataRows.map(r => {
          const obj = {}
          headers.forEach((h, i) => { if (h) obj[String(h).replace(/^\* /, '')] = r[i] ?? '' })
          return obj
        })
      }
      setSheets(parsed); setStep('preview')
    } catch (e) { setMsg('Error al leer el archivo: ' + e.message); setStep(null) }
  }

  async function importSheet(sheetKey) {
    const rows = sheets[sheetKey]
    if (!rows || rows.length === 0) { setMsg(`La hoja "${sheetKey}" está vacía.`); return }
    setImporting(true); setMsg('')
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ sheet: sheetKey, rows })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(prev => ({ ...prev, [sheetKey]: data }))
      setMsg(`${SHEET_KEYS[sheetKey]} importada ✓`)
    } catch (e) { setMsg('Error: ' + e.message) }
    finally { setImporting(false) }
  }

  async function importAll() {
    for (const key of SHEET_ORDER) {
      if ((sheets[key] || []).length > 0) await importSheet(key)
    }
    setStep('result')
  }

  const totalRows = Object.values(sheets).reduce((s, r) => s + r.length, 0)

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: 12, marginBottom: 24 }}>
        <Download size={18} color="var(--gold)" />
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600 }}>Descargar templates oficiales</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>Un archivo separado por entidad. No modificar columnas ni nombres.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Alumnos',      file: 'alumnos_template.xlsx' },
            { label: 'Docentes',     file: 'docentes_template.xlsx' },
            { label: 'Empresas',     file: 'empresas_template.xlsx' },
            { label: 'Asignaciones', file: 'asignaciones_template.xlsx' },
          ].map(t => (
            <a key={t.file} href={`/${t.file}`} download
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.4)', color: 'var(--gold)', padding: '6px 12px', borderRadius: 8, fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none' }}>
              <Download size={12} /> {t.label}
            </a>
          ))}
        </div>
      </div>
      {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }} onClick={() => setMsg('')}>{msg}</div>}
      {step === null && (
        <label style={{ display: 'block', cursor: 'pointer' }}>
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 14, padding: '50px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <Upload size={40} style={{ opacity: 0.3, marginBottom: 14 }} />
            <div style={{ fontSize: '1rem', color: 'var(--cream)', marginBottom: 6 }}>Hacé clic para seleccionar el Excel</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>Formatos: .xlsx · Un archivo por vez</div>
          </div>
        </label>
      )}
      {step === 'uploading' && <div style={{ textAlign: 'center', padding: 50, color: 'var(--smoke)' }}>Leyendo archivo…</div>}
      {step === 'preview' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>📎 {fileName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>{totalRows} filas detectadas</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setStep(null); setSheets({}); setResults({}) }}>✕ Cancelar</button>
              <button className="btn btn-gold btn-sm" onClick={importAll} disabled={importing}>
                {importing ? 'Importando…' : `↑ Importar (${totalRows} filas)`}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {SHEET_ORDER.map(key => (
              <button key={key} onClick={() => setActiveSheet(key)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeSheet === key ? 'var(--wine)' : 'transparent', color: activeSheet === key ? 'white' : 'var(--smoke)', position: 'relative' }}>
                {SHEET_KEYS[key]} <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '1px 6px', fontSize: '0.72rem' }}>{sheets[key]?.length || 0}</span>
                {results[key] && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: results[key].errors?.length ? '#f87171' : '#4ade80' }} />}
              </button>
            ))}
          </div>
          {(() => {
            const rows = sheets[activeSheet] || []
            const headers = rows[0] ? Object.keys(rows[0]) : []
            const res = results[activeSheet]
            return (
              <div>
                {res && (
                  <div style={{ padding: '10px 14px', background: res.errors?.length ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)', border: `1px solid ${res.errors?.length ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`, borderRadius: 10, marginBottom: 12, fontSize: '0.85rem' }}>
                    <strong style={{ color: res.errors?.length ? '#f87171' : '#4ade80' }}>✓ {res.created} creados · {res.updated} actualizados · {res.errors?.length || 0} errores</strong>
                    {res.errors?.map((e, i) => <div key={i} style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: 4 }}>⚠ {e.message}</div>)}
                  </div>
                )}
                {rows.length === 0
                  ? <div style={{ textAlign: 'center', padding: 30, color: 'var(--smoke)', fontSize: '0.85rem' }}>Esta hoja está vacía.</div>
                  : (
                    <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--ink-soft)', zIndex: 1 }}>
                          <tr>
                            {['#', ...headers].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 50).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '7px 12px', color: 'var(--smoke)', fontSize: '0.75rem' }}>{i + 9}</td>
                              {headers.map(h => <td key={h} style={{ padding: '7px 12px', color: 'var(--cream)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(row[h] ?? '')}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rows.length > 50 && <div style={{ textAlign: 'center', padding: 10, fontSize: '0.78rem', color: 'var(--smoke)' }}>Mostrando 50 de {rows.length} filas</div>}
                    </div>
                  )
                }
                {rows.length > 0 && !res && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => importSheet(activeSheet)} disabled={importing}>
                      {importing ? 'Importando…' : `↑ Importar solo ${SHEET_KEYS[activeSheet]}`}
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
          {Object.values(results).some(r => r.passwords?.length) && (
            <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(27,186,170,0.08)', border: '1px solid rgba(27,186,170,0.3)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--teal)', fontWeight: 600, marginBottom: 10 }}>🔑 Contraseñas generadas automáticamente — guardá esta información</div>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{['Nombre', 'Email', 'Contraseña temporal'].map(h => <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--smoke)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {Object.values(results).flatMap(r => r.passwords || []).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 12px', color: 'var(--cream)' }}>{p.nombre}</td>
                      <td style={{ padding: '6px 12px', color: 'var(--smoke)' }}>{p.email}</td>
                      <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: 'var(--gold)', fontWeight: 600 }}>{p.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
function SettingsTab() {
  const [cfg, setCfg] = useState(DEMO_SETTINGS)
  const [saved, setSaved] = useState(false)
  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const incentive = Math.round(cfg.smvm * (cfg.incentive_pct / 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
      {saved && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 16px', color: '#4ade80', fontSize: '0.85rem' }}>✅ Configuración guardada</div>}
      <Section icon={DollarSign} title="Incentivo Económico (SMVM)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="SMVM actual ($)" value={cfg.smvm} onChange={v => setCfg(p => ({ ...p, smvm: +v }))} type="number" />
          <Field label="% Incentivo (Programa Enlace)" value={cfg.incentive_pct} onChange={v => setCfg(p => ({ ...p, incentive_pct: +v }))} type="number" />
        </div>
        <div style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10, padding: '12px 16px', marginTop: 14, fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--smoke)' }}>Incentivo mensual calculado: </span>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1rem' }}>${incentive.toLocaleString('es-AR')}</span>
        </div>
      </Section>
      <Section icon={Clock} title="Reglas de Asistencia (DGE Res. 1850/2022)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Máx. horas/día" value={cfg.max_hours_day} onChange={v => setCfg(p => ({ ...p, max_hours_day: +v }))} type="number" />
          <Field label="Máx. horas/semana" value={cfg.max_hours_week} onChange={v => setCfg(p => ({ ...p, max_hours_week: +v }))} type="number" />
          <Field label="Horario desde" value={cfg.time_from} onChange={v => setCfg(p => ({ ...p, time_from: v }))} type="time" />
          <Field label="Horario hasta" value={cfg.time_to} onChange={v => setCfg(p => ({ ...p, time_to: v }))} type="time" />
          <Field label="Meta total de horas" value={cfg.total_hours_goal} onChange={v => setCfg(p => ({ ...p, total_hours_goal: +v }))} type="number" />
          <Field label="Visitas mínimas" value={cfg.min_visits} onChange={v => setCfg(p => ({ ...p, min_visits: +v }))} type="number" />
        </div>
      </Section>
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
      <Section icon={Sliders} title="Escala de Rúbrica (DGE)">
        <div style={{ color: 'var(--smoke)', fontSize: '0.84rem', lineHeight: 1.6 }}>
          <p>4 criterios · 1–3 puntos cada uno · Total: 4–12 puntos</p>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Asistencia y puntualidad', 'Presentación y uniforme', 'Conocimientos técnicos aplicados', 'Informe final del alumno'].map((crit, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(250,245,237,0.04)', padding: '8px 14px', borderRadius: 8 }}>
                <span style={{ color: 'var(--cream)' }}>{crit}</span>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>1–3 pts</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.78rem' }}>Escala: 12→10.0 · 8→7.0 · 4→3.0 (interpolación lineal)</div>
        </div>
      </Section>
      <button onClick={save} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--wine)', border: 'none', borderRadius: 10, padding: '11px 24px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
        <RefreshCw size={14} /> Guardar configuración
      </button>
    </div>
  )
}

// ─── EXPORTAR GEM ─────────────────────────────────────────────────────────────
function ExportTab({ students, teachers }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]))

  function exportCSV() {
    setLoading(true)
    setTimeout(() => {
      const rows = [
        ['Alumno', 'Docente Tutor', 'Empresa', 'Horas', 'Visitas', 'Estado', 'Nota Final (simulada)'],
        ...students.map(s => [s.name, teacherMap[s.teacher]?.name || '', s.company, s.hours, s.visits, statusLabel[s.status] || s.status, s.visits >= 2 && s.hours >= 100 ? '8.5' : '—'])
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
      <Section icon={Download} title="Reporte de Notas — GEM">
        <p style={{ color: 'var(--smoke)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>CSV con notas finales de rúbrica. Formato listo para importar en GEM.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(250,245,237,0.04)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80' }}>{readyCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>Con nota posible</div>
          </div>
          <div style={{ background: 'rgba(250,245,237,0.04)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{students.length - readyCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>Sin condiciones aún</div>
          </div>
        </div>
        {done && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '8px 14px', color: '#4ade80', fontSize: '0.83rem', marginBottom: 12 }}>✅ Descargado: GEM_notas_5to3ra.csv</div>}
        <button onClick={exportCSV} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: loading ? 'rgba(124,29,47,0.4)' : 'var(--wine)', border: 'none', borderRadius: 10, padding: '11px 22px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
          <Download size={15} /> {loading ? 'Generando…' : 'Descargar CSV para GEM'}
        </button>
      </Section>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('monitor')
  const [teachers, setTeachers] = useState([])
  const [companies, setCompanies] = useState([])
  const [studentsRaw, setStudentsRaw] = useState([])
  const [iceMap, setIceMap] = useState({})
  const [loadingDashboard, setLoadingDashboard] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoadingDashboard(true)
      try {
        const [sRes, tRes, cRes] = await Promise.all([
          fetch('/api/admin/users?type=students',  { headers: authHeaders() }).then(r => r.json()),
          fetch('/api/admin/users?type=teachers',  { headers: authHeaders() }).then(r => r.json()),
          fetch('/api/admin/users?type=companies', { headers: authHeaders() }).then(r => r.json()),
        ])
        const rawStudents = (sRes.students || []).map(s => ({
          id: s.id,
          name: s.full_name,
          teacher: s.pasantia_id ? s.teacher_id : null,  // usado por MonitorTab
          company: s.company_name || '(Sin empresa asignada)',
          status: s.pasantia_status || 'none',
          hours: Number(s.total_hours) || 0,
          visits: Number(s.visit_count) || 0,
          ice: s.ice === true || s.ice === 'true',
          // campos extra para ABMTab
          user_id: s.user_id,
          email: s.email,
          school: s.school,
          grade: s.grade,
          teacher_name: s.teacher_name,
          company_name: s.company_name,
          total_hours: Number(s.total_hours) || 0,
        }))
        setStudentsRaw(rawStudents)
        // Reconstruir iceMap desde los datos del backend
        const ice = {}
        rawStudents.filter(s => s.ice).forEach(s => { ice[s.id] = { blocked: true } })
        setIceMap(ice)
        setTeachers((tRes.teachers || []).map(t => ({
          id: t.id, name: t.full_name, email: t.email,
          school: t.school, subject: t.subject,
          students: parseInt(t.student_count) || 0,
          visits: parseInt(t.visit_count) || 0,
          pending: 0,
          user_id: t.user_id,
          full_name: t.full_name,
          student_count: parseInt(t.student_count) || 0,
          visit_count: parseInt(t.visit_count) || 0,
        })))
        setCompanies((cRes.companies || []).map(c => ({
          id: c.id, name: c.company_name, company_name: c.company_name,
          cuit: c.cuit || '', email: c.email, sector: c.sector || '',
          contact: c.contact_name || '', contact_name: c.contact_name || '',
          students: parseInt(c.student_count) || 0,
          student_count: parseInt(c.student_count) || 0,
          verified: c.verified, user_id: c.user_id,
        })))
      } catch (e) {
        console.error('Error cargando dashboard:', e)
      } finally {
        setLoadingDashboard(false)
      }
    }
    loadAll()
  }, [])

  const students = useMemo(() => studentsRaw.map(s => ({
    ...s,
    ice: !!iceMap[s.id]?.blocked,
    status: iceMap[s.id]?.blocked ? 'blocked' : s.status,
  })), [studentsRaw, iceMap])

  async function toggleIce(studentId, block, reason) {
    setIceMap(prev => ({
      ...prev,
      [studentId]: block
        ? { blocked: true, reason, set_at: new Date().toLocaleDateString('es-AR') }
        : { blocked: false, reason: '', lifted_at: new Date().toLocaleDateString('es-AR') }
    }))
    try {
      await fetch('/api/admin?_resource=dashboard&action=toggle_ice', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ student_id: studentId, block, reason })
      })
    } catch (e) { console.warn('ICE API:', e) }
  }

  function logout() { clearAuth(); navigate('/login') }

  const iceCount = students.filter(s => s.ice).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: 'var(--font-ui)' }}>
      <div style={{ background: 'var(--ink-soft)', borderBottom: '1px solid rgba(250,245,237,0.08)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, background: 'var(--wine)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>V</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--cream)' }}>Vínculo Mendoza</span>
              <span style={{ marginLeft: 8, fontSize: '0.75rem', background: 'rgba(124,29,47,0.4)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 6, padding: '1px 8px', color: 'var(--gold)' }}>🛡 MASTER ADMIN</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {iceCount > 0 && (
              <div onClick={() => setTab('ice')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                <Lock size={13} /> {iceCount} ICE activo{iceCount > 1 ? 's' : ''}
              </div>
            )}
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(250,245,237,0.12)', borderRadius: 8, padding: '6px 12px', color: 'var(--smoke)', cursor: 'pointer', fontSize: '0.8rem' }}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        {loadingDashboard ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--smoke)', fontSize: '0.95rem' }}>
            Cargando datos…
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(250,245,237,0.04)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s', background: tab === t.id ? 'var(--wine)' : 'transparent', color: tab === t.id ? 'white' : 'var(--smoke)', position: 'relative' }}>
                  <t.icon size={14} />
                  {t.label}
                  {t.id === 'ice' && iceCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />}
                </button>
              ))}
            </div>
            <div style={{ animation: 'fadeUp 0.35s ease' }}>
              {tab === 'abm'        && <ABMTab />}
              {tab === 'monitor'    && <MonitorTab students={students} teachers={teachers} />}
              {tab === 'ice'        && <IceTab students={students} iceMap={iceMap} onToggleIce={toggleIce} />}
              {tab === 'siniestros' && <SiniestrosTab students={students} />}
              {tab === 'teachers'   && <TeachersTab teachers={teachers} setTeachers={setTeachers} />}
              {tab === 'companies'  && <CompaniesTab companies={companies} setCompanies={setCompanies} />}
              {tab === 'import'     && <ImportTab />}
              {tab === 'settings'   && <SettingsTab />}
              {tab === 'export'     && <ExportTab students={students} teachers={teachers} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
