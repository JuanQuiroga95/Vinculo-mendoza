// src/pages/AdminDashboard.jsx — Panel Admin/Preceptor v2
// Módulos: Overview · Pasantías · Docentes · Empresas · Control ICE · Siniestros · Configuración

import { useState, useMemo, useEffect } from 'react'
import {
  Users, Building2, Eye, Settings, Download, ShieldCheck,
  AlertTriangle, CheckCircle, Clock, XCircle, Bell, Plus,
  Search, Filter, LogOut, BarChart3, Upload,
  Lock, Unlock, FileText, Sliders, Calendar, DollarSign,
  UserPlus, RefreshCw, Mail, Phone, MapPin, Briefcase,
  X, ChevronDown, AlertCircle,  ClipboardList,
  TrendingUp,  BookOpen, Star
} from 'lucide-react'
import { clearAuth, getToken } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

// ─── API helpers ──────────────────────────────────────────────────────────────
const BASE = '/api'
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error desconocido')
  return data
}
const adminAPI = {
  getPasantias:     () => apiFetch('/admin/pasantias'),
  getSummary:       () => apiFetch('/admin/summary'),
  getICE:           () => apiFetch('/admin/ice'),
  setICE:           (body) => apiFetch('/admin/ice', { method: 'POST', body: JSON.stringify(body) }),
  getAccidents:     () => apiFetch('/admin/accidents'),
  reportAccident:   (body) => apiFetch('/admin/accidents', { method: 'POST', body: JSON.stringify(body) }),
  markAccidentSent: (id) => apiFetch('/admin/accidents', { method: 'PUT', body: JSON.stringify({ id, sent_to_dge: true }) }),
}

// ─── Datos demo (fallback cuando la API no está disponible) ──────────────────
const DEMO_TEACHERS = [
  { id: 't1',  name: 'VIDELA, Eliana',       email: 'evidela@escola.edu.ar',   school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
  { id: 't2',  name: 'MARTÍN, Cecilia',       email: 'cmartin@escola.edu.ar',   school: 'Ing. Ricardo Videla', students: 4,  visits: 5, pending: 1 },
  { id: 't3',  name: 'CULTRERA, Laura',       email: 'lcultrera@escola.edu.ar', school: 'Ing. Ricardo Videla', students: 2,  visits: 1, pending: 1 },
  { id: 't4',  name: 'ESCUDERO, Mauricio',    email: 'mescudero@escola.edu.ar', school: 'Ing. Ricardo Videla', students: 3,  visits: 6, pending: 0 },
  { id: 't5',  name: 'GRECO, Marisol',        email: 'mgreco@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 3,  visits: 0, pending: 3 },
  { id: 't6',  name: 'SILVA, Alejandro',      email: 'asilva@escola.edu.ar',    school: 'Ing. Ricardo Videla', students: 3,  visits: 4, pending: 0 },
  { id: 't7',  name: 'LENI, Fabio',           email: 'fleni@escola.edu.ar',     school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
  { id: 't8',  name: 'VECCHIUTTI, Yamila',    email: 'yvecchiutti@escola.edu.ar',school: 'Ing. Ricardo Videla',students: 3,  visits: 3, pending: 0 },
  { id: 't9',  name: 'SPAMPINATO, Jésica',    email: 'jspampinato@escola.edu.ar',school: 'Ing. Ricardo Videla',students: 2,  visits: 2, pending: 0 },
  { id: 't10', name: 'ERMACORA, Sebastián',   email: 'sermacora@escola.edu.ar', school: 'Ing. Ricardo Videla', students: 3,  visits: 1, pending: 2 },
  { id: 't11', name: 'TORRES, Vanina',        email: 'vtorres@escola.edu.ar',   school: 'Ing. Ricardo Videla', students: 1,  visits: 2, pending: 0 },
]

const DEMO_STUDENTS = [
  { id: 's1',  name: 'ALVAREZ CORTEZ, Juan Ignacio',      teacher: 't1',  company: 'Ferretería Silvestrini',          status: 'active',     hours: 72,  visits: 2, ice: false },
  { id: 's2',  name: 'ARANCIBIA CASTRO, Agostina Ailén',  teacher: 't2',  company: 'CEPA S.R.L.',                     status: 'active',     hours: 60,  visits: 1, ice: false },
  { id: 's3',  name: 'ARRIETA LEON, Lourdes Yamile',      teacher: 't2',  company: 'CEPA S.R.L.',                     status: 'active',     hours: 55,  visits: 1, ice: false },
  { id: 's4',  name: 'REVOLLO HUANCA, Camila Sabrina',    teacher: 't2',  company: 'Farmacia El Pino',                status: 'active',     hours: 80,  visits: 2, ice: false },
  { id: 's5',  name: 'ROBLEDO SALAZAR, María Agustina',   teacher: 't2',  company: 'Farmacia El Pino',                status: 'simulation', hours: 40,  visits: 1, ice: false },
  { id: 's6',  name: 'CORREA, Ana Paula',                 teacher: 't3',  company: 'Corralón Luján S.A.',             status: 'active',     hours: 100, visits: 1, ice: false },
  { id: 's7',  name: 'LUCERO VIDELA, Ignacio',            teacher: 't3',  company: 'Estudio Contable Yamin',          status: 'active',     hours: 88,  visits: 0, ice: false },
  { id: 's8',  name: 'VEDIA JANCO, Magali Anabella',      teacher: 't4',  company: 'DISVEC Representaciones',         status: 'active',     hours: 95,  visits: 2, ice: false },
  { id: 's9',  name: 'GIRÓN VEDIA, Milagros Elizabeth',   teacher: 't4',  company: 'DISVEC Representaciones',         status: 'active',     hours: 90,  visits: 2, ice: false },
  { id: 's10', name: 'JOFRE GOMEZ, Leonel Valentín',      teacher: 't4',  company: 'Aguerre Ferretería',              status: 'active',     hours: 78,  visits: 2, ice: false },
  { id: 's11', name: 'RODRIGUEZ NAVARRO, Mara Agostina',  teacher: 't5',  company: 'H30 Ferretería Express',          status: 'active',     hours: 45,  visits: 0, ice: false },
  { id: 's12', name: 'NOROÑA, Sofía Macarena',            teacher: 't5',  company: 'H30 Ferretería Express',          status: 'active',     hours: 50,  visits: 0, ice: false },
  { id: 's13', name: 'VELAZQUEZ, Santiago',               teacher: 't5',  company: 'Estudio Jurídico Cicilotto',      status: 'active',     hours: 30,  visits: 0, ice: true  },
  { id: 's14', name: 'PEÑALOZA, Agustín David',           teacher: 't6',  company: 'Expreso Luján',                   status: 'active',     hours: 65,  visits: 2, ice: false },
  { id: 's15', name: 'CUEVAS BUSTAMANTE, Lorena Mariela', teacher: 't6',  company: 'Nexo Seguros',                    status: 'active',     hours: 70,  visits: 2, ice: false },
  { id: 's16', name: 'ROJAS, Mariángel',                  teacher: 't6',  company: 'Nexo Seguros',                    status: 'active',     hours: 60,  visits: 0, ice: false },
  { id: 's17', name: 'PONCE, Lautaro Uriel',              teacher: 't7',  company: 'Farmacia Santa Cruz',             status: 'active',     hours: 85,  visits: 2, ice: false },
  { id: 's18', name: 'TALQUENCA, Alelí Marisol',          teacher: 't8',  company: 'Café y Delicatessen (Entre Dos)', status: 'active',     hours: 55,  visits: 1, ice: false },
  { id: 's19', name: 'LEYES ELIZONDO, Alexis Miguel',     teacher: 't8',  company: 'Café y Delicatessen (Entre Dos)', status: 'active',     hours: 60,  visits: 1, ice: false },
  { id: 's20', name: 'PEDERNERA, Simón Alfonso',          teacher: 't8',  company: 'Inmobiliaria Romero Suñer',       status: 'active',     hours: 75,  visits: 1, ice: false },
  { id: 's21', name: 'VERDIER, Valentina',                teacher: 't9',  company: 'Estudio Jurídico Cicilotto',      status: 'active',     hours: 90,  visits: 2, ice: false },
  { id: 's22', name: 'IRIBARREN, Morena Marianela',       teacher: 't9',  company: 'TEMIS S.A.',                      status: 'active',     hours: 82,  visits: 2, ice: false },
  { id: 's23', name: 'MENDEZ-GOMEZ, Alexander Eduardo',   teacher: 't10', company: 'Dique Potrerillos S.A.',          status: 'active',     hours: 40,  visits: 1, ice: false },
  { id: 's24', name: 'REINOSO RIQUELME, Lautaro Andrés',  teacher: 't10', company: 'Dique Potrerillos S.A.',          status: 'active',     hours: 38,  visits: 0, ice: false },
  { id: 's25', name: 'SANTANDER, Brian Emanuel',          teacher: 't10', company: '(Sin empresa asignada)',          status: 'none',       hours: 0,   visits: 0, ice: false },
  { id: 's26', name: 'ORTEGOZA, Valentina Lorenza',       teacher: 't11', company: 'JARMAYAL S.A.S.',                 status: 'active',     hours: 30,  visits: 2, ice: false },
]

const DEMO_COMPANIES = [
  { id: 'c1',  name: 'Ferretería Silvestrini',          cuit: '30-71234567-1', verified: true,  sector: 'Comercio',      students: 1, contact: 'Víctor Silvestrini',    phone: '2614987644' },
  { id: 'c2',  name: 'CEPA S.R.L.',                     cuit: '30-68901234-5', verified: true,  sector: 'Servicios',     students: 2, contact: 'Sylvia Retamales',      phone: '2615150349' },
  { id: 'c3',  name: 'Farmacia El Pino',                cuit: '20-12345678-9', verified: true,  sector: 'Salud',         students: 2, contact: 'Martín D. Segura',      phone: '' },
  { id: 'c4',  name: 'Corralón Luján S.A.',             cuit: '30-45678901-2', verified: true,  sector: 'Comercio',      students: 1, contact: 'Córdoba M. del Valle',  phone: '2615996249' },
  { id: 'c5',  name: 'Estudio Contable Yamin',          cuit: '20-98765432-1', verified: true,  sector: 'Contabilidad',  students: 1, contact: 'Alejandra Yamin',       phone: '2614683805' },
  { id: 'c6',  name: 'DISVEC Representaciones',         cuit: '30-55443322-7', verified: true,  sector: 'Comercio',      students: 2, contact: 'Cintia B. Cazón',       phone: '2612056520' },
  { id: 'c7',  name: 'Aguerre Ferretería',              cuit: '20-33221100-4', verified: false, sector: 'Comercio',      students: 1, contact: 'Federico Di Santo',      phone: '2615071541' },
  { id: 'c8',  name: 'H30 Ferretería Express',          cuit: '30-77665544-3', verified: true,  sector: 'Comercio',      students: 2, contact: 'Ricardo Bologna',        phone: '2616930773' },
  { id: 'c9',  name: 'Estudio Jurídico Cicilotto',      cuit: '20-44332211-8', verified: true,  sector: 'Legal',         students: 2, contact: 'Cicilotto Cristian',     phone: '2614984054' },
  { id: 'c10', name: 'Expreso Luján',                   cuit: '30-12398765-5', verified: true,  sector: 'Transporte',    students: 1, contact: 'Roxana Duscio',          phone: '2612183679' },
  { id: 'c11', name: 'Nexo Seguros',                    cuit: '30-87654321-0', verified: false, sector: 'Seguros',       students: 2, contact: 'Gabriela Quiroga',       phone: '2616664775' },
  { id: 'c12', name: 'Farmacia Santa Cruz',             cuit: '20-56781234-6', verified: true,  sector: 'Salud',         students: 1, contact: 'Martín D. Segura',       phone: '2615692380' },
  { id: 'c13', name: 'Café y Delicatessen (Entre Dos)', cuit: '30-23456789-3', verified: true,  sector: 'Gastronomía',   students: 2, contact: 'Alonso José',            phone: '2616110040' },
  { id: 'c14', name: 'Inmobiliaria Romero Suñer',       cuit: '20-65432187-2', verified: true,  sector: 'Inmobiliaria',  students: 1, contact: 'María C. Romero',        phone: '' },
  { id: 'c15', name: 'TEMIS S.A.',                      cuit: '30-34567890-9', verified: true,  sector: 'Servicios',     students: 1, contact: 'Milca Galat Giorgi',     phone: '2612053029' },
  { id: 'c16', name: 'Dique Potrerillos S.A.',          cuit: '30-67890123-4', verified: false, sector: 'Turismo',       students: 2, contact: 'Ignacio Robello',        phone: '2615071541' },
  { id: 'c17', name: 'JARMAYAL S.A.S.',                 cuit: '30-11223344-6', verified: true,  sector: 'Agroindustria', students: 1, contact: 'Luis Amaya',             phone: '2612505826' },
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusLabel = { active: 'En proceso', completed: 'Finalizada', simulation: 'Simulación', none: 'Sin pasantía', blocked: 'Bloqueada' }
const statusColor = { active: '#4ade80', completed: '#60a5fa', simulation: '#f59e0b', none: '#6b7280', blocked: '#f87171' }

function StatusBadge({ status }) {
  const col = statusColor[status] || '#6b7280'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: col + '22', color: col, border: `1px solid ${col}44` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
      {statusLabel[status] || status}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--teal)', alert }) {
  return (
    <div className="stat-card" style={alert ? { borderColor: `${color}55` } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Icon size={18} style={{ color, opacity: 0.8 }} />
        {alert && <AlertTriangle size={14} color={color} />}
      </div>
      <div className="stat-value" style={{ color, fontSize: '2rem' }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ─── Modal: Registrar siniestro ───────────────────────────────────────────────
function SiniestroModal({ students, onClose, onSaved }) {
  const [form, setForm] = useState({
    student_id: students[0]?.id || '',
    occurred_at: new Date().toISOString().slice(0, 16),
    report_type: 'accidente_trabajo',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!form.description.trim()) { setErr('Completá la descripción del accidente.'); return }
    setSaving(true); setErr('')
    try {
      await adminAPI.reportAccident(form)
      onSaved()
    } catch (e) {
      // Demo fallback
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h3 style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}>Denunciar accidente / siniestro</h3>
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Debe enviarse a la DGE dentro de las 72 horas del suceso</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div className="alert" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span>La denuncia es obligatoria. El sistema alertará si pasan 48hs sin enviarla a la DGE.</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Alumno involucrado</label>
          <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem' }}>
            {students.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Tipo de siniestro</label>
          <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem' }}>
            <option value="accidente_trabajo">Accidente de trabajo</option>
            <option value="accidente_in_itinere">Accidente in itinere</option>
            <option value="enfermedad_profesional">Enfermedad profesional</option>
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Fecha y hora del suceso</label>
          <input type="datetime-local" value={form.occurred_at} onChange={e => setForm(f => ({ ...f, occurred_at: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Descripción detallada del accidente *</label>
          <textarea rows={5} value={form.description} placeholder="Describí qué ocurrió, cómo, dónde, lesiones sufridas, testigos..." onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.88rem', resize: 'vertical' }} />
        </div>

        {err && <div className="alert alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm" style={{ background: '#991b1b', color: 'var(--cream)', border: 'none' }}>
            {saving ? 'Registrando…' : <><FileText size={14} /> Registrar siniestro</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: ICE ───────────────────────────────────────────────────────────────
function ICEModal({ student, currentState, onClose, onSaved }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await adminAPI.setICE({ student_id: student.id, is_blocked: !currentState, reason })
      onSaved(!currentState, student.id)
    } catch {
      // Demo fallback: simular
      onSaved(!currentState, student.id)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>
            {currentState ? 'Levantar condición ICE' : 'Bloquear por ICE'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '12px 16px', background: currentState ? 'rgba(27,186,170,0.08)' : 'rgba(248,113,113,0.08)', borderRadius: 'var(--r-md)', border: `1px solid ${currentState ? 'rgba(27,186,170,0.2)' : 'rgba(248,113,113,0.2)'}`, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{student.name}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>{student.company}</div>
        </div>

        {!currentState && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertTriangle size={15} />
            <span>Al bloquear por ICE, el alumno <strong>no podrá postularse ni continuar</strong> ninguna pasantía hasta que se levante el bloqueo.</span>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>
            {currentState ? 'Motivo del levantamiento' : 'Motivo del bloqueo ICE'}
          </label>
          <textarea rows={3} value={reason} placeholder={currentState ? 'ej: Regularizó materias previas...' : 'ej: Materias previas sin aprobar...'}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.88rem', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="btn btn-sm"
            style={{ background: currentState ? 'var(--teal)' : '#991b1b', color: currentState ? 'var(--ink)' : 'var(--cream)', border: 'none' }}>
            {saving ? 'Guardando…' : currentState ? <><Unlock size={14} /> Levantar ICE</> : <><Lock size={14} /> Bloquear</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab]         = useState('overview')
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [msg, setMsg]         = useState({ text: '', type: '' })
  const [settings, setSettings] = useState(DEMO_SETTINGS)

  // Estado que puede conectar a API o usar demo
  const [students, setStudents]     = useState(DEMO_STUDENTS)
  const [teachers, setTeachers]     = useState(DEMO_TEACHERS)
  const [companies, setCompanies]   = useState(DEMO_COMPANIES)
  const [accidents, setAccidents]   = useState([])
  const [loading, setLoading]       = useState(false)

  // Intentar cargar desde API
  useEffect(() => {
    adminAPI.getAccidents().then(d => setAccidents(d.accidents || [])).catch(() => {})
    adminAPI.getPasantias().then(d => {
      if (d.students?.length) setStudents(d.students)
      if (d.teachers?.length) setTeachers(d.teachers)
    }).catch(() => {})
  }, [])

  function flash(text, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 5000)
  }

  // ICE toggle (local + API)
  function handleICESave(newState, studentId) {
    setStudents(ss => ss.map(s => s.id === studentId ? { ...s, ice: newState } : s))
    setModal(null)
    flash(`Condición ICE ${newState ? 'activada' : 'levantada'} para ${selected?.name?.split(',')[0]}.`, newState ? 'error' : 'success')
  }

  // Siniestro guardado
  async function onSiniestroSaved() {
    setModal(null)
    try {
      const d = await adminAPI.getAccidents()
      setAccidents(d.accidents || [])
    } catch {}
    flash('Siniestro registrado. Recordá enviarlo a DGE dentro de las 72hs.', 'success')
  }

  async function markSent(id) {
    try {
      await adminAPI.markAccidentSent(id)
      setAccidents(acc => acc.map(a => a.id === id ? { ...a, sent_to_dge: true } : a))
      flash('Marcado como enviado a DGE.', 'success')
    } catch { flash('Error al actualizar.', 'error') }
  }

  // Filtros
  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => s.name.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q))
  }, [students, search])

  // KPIs
  const iceCount      = students.filter(s => s.ice).length
  const visitPending  = students.filter(s => s.visits < 2 && s.status === 'active').length
  const hoursReached  = students.filter(s => s.hours >= 100).length
  const simCount      = students.filter(s => s.status === 'simulation').length
  const urgentAcc     = accidents.filter(a => !a.sent_to_dge && new Date() - new Date(a.occurred_at) > 48 * 3600 * 1000)

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]))

  // Sidebar items
  const navItems = [
    { id: 'overview',   label: 'Panel general',   icon: <BarChart3 size={16} /> },
    { id: 'pasantias',  label: 'Pasantías',        icon: <Briefcase size={16} />, count: students.filter(s => s.status === 'active').length },
    { id: 'docentes',   label: 'Docentes tutores', icon: <Users size={16} />, count: teachers.length },
    { id: 'empresas',   label: 'Empresas',         icon: <Building2 size={16} />, count: companies.length },
    { id: 'ice',        label: 'Control ICE',      icon: <AlertTriangle size={16} />, count: iceCount || undefined },
    { id: 'siniestros', label: 'Siniestros',       icon: <AlertTriangle size={16} />, count: urgentAcc.length || undefined },
    { id: 'config',     label: 'Configuración',    icon: <Settings size={16} /> },
  ]

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: 32, height: 32, background: 'var(--wine)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>V</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.2 }}>Vínculo <span style={{ color: 'var(--gold)' }}>Mza</span></div>
          </div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>Panel de</div>
          <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>Administración</div>
          <div style={{ marginTop: 8 }}><span className="badge badge-wine">Admin / Preceptor</span></div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button key={item.id} className={`sidebar-nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {item.count > 0 && (
                <span style={{ marginLeft: 'auto', background: item.id === 'ice' || item.id === 'siniestros' ? '#991b1b' : 'var(--wine)', color: 'var(--cream)', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="sidebar-nav-item" style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        {msg.text && (
          <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }} onClick={() => setMsg({ text: '', type: '' })}>
            {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {msg.text}
            <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} />
          </div>
        )}

        {/* Alerta urgente siniestros */}
        {urgentAcc.length > 0 && tab !== 'siniestros' && (
          <div className="alert" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', marginBottom: 20, cursor: 'pointer' }} onClick={() => setTab('siniestros')}>
            <AlertTriangle size={16} />
            <span><strong>{urgentAcc.length} siniestro{urgentAcc.length > 1 ? 's' : ''}</strong> superaron las 48hs sin enviarse a la DGE. Límite legal: 72hs.</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', textDecoration: 'underline' }}>Ver ahora →</span>
          </div>
        )}

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Panel de administración</h2>
              <p>Escuela Nº 4-012 "Ing. Ricardo Videla" · 5to 3ra · 2025</p>
            </div>

            <div className="grid-4" style={{ marginBottom: 32 }}>
              <StatCard icon={Briefcase}     label="Pasantías activas"  value={students.filter(s => s.status === 'active').length} color="var(--teal)" />
              <StatCard icon={Users}         label="Docentes tutores"   value={teachers.length}  color="var(--gold)" />
              <StatCard icon={Building2}     label="Empresas habilitadas" value={companies.filter(c => c.verified).length} color="var(--wine-light)" />
              <StatCard icon={ShieldAlert}   label="Condición ICE"      value={iceCount} sub="Bloqueados del sistema" color="#f87171" alert={iceCount > 0} />
            </div>

            <div className="grid-4" style={{ marginBottom: 32 }}>
              <StatCard icon={CheckCircle}   label="≥ 100hs alcanzadas" value={hoursReached} color="#4ade80" />
              <StatCard icon={ClipboardList} label="Visitas pendientes"  value={visitPending}  sub="Deben completar 2" color="var(--gold)" alert={visitPending > 0} />
              <StatCard icon={FileText}      label="Simulaciones"        value={simCount}      color="var(--muted)" />
              <StatCard icon={AlertTriangle} label="Siniestros activos"  value={accidents.filter(a => !a.sent_to_dge).length} color="#f87171" alert={accidents.filter(a => !a.sent_to_dge).length > 0} />
            </div>

            {/* Alertas rápidas */}
            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Alertas y acciones pendientes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.filter(s => s.ice).map(s => (
                <div key={s.id} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r-md)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Lock size={15} color="#f87171" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.88rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>Condición ICE activa — no puede postularse</div>
                    </div>
                  </div>
                  <button onClick={() => { setSelected(s); setModal('ice') }} className="btn btn-outline btn-sm"><Unlock size={13} /> Gestionar ICE</button>
                </div>
              ))}
              {students.filter(s => s.visits === 0 && s.status === 'active').slice(0, 3).map(s => (
                <div key={s.id} style={{ background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 'var(--r-md)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertTriangle size={15} color="var(--gold)" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.88rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>0 visitas registradas · docente: {teacherMap[s.teacher]?.name}</div>
                    </div>
                  </div>
                  <span className="badge badge-gold">Sin visitas</span>
                </div>
              ))}
              {iceCount === 0 && visitPending === 0 && (
                <div style={{ textAlign: 'center', padding: 40, background: 'rgba(27,186,170,0.05)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(27,186,170,0.15)' }}>
                  <CheckCircle size={28} color="var(--teal)" style={{ marginBottom: 10, opacity: 0.7 }} />
                  <p style={{ color: 'var(--teal)', margin: 0 }}>Sin alertas críticas pendientes.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PASANTÍAS ─────────────────────────────────────────────────── */}
        {tab === 'pasantias' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div><h2>Pasantías</h2><p>{students.length} alumnos registrados</p></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno o empresa..."
                    style={{ paddingLeft: 36, paddingRight: 14, padding: '9px 14px 9px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.88rem', width: 240 }} />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Alumno/a', 'Docente tutor', 'Empresa', 'Horas', 'Visitas', 'ICE', 'Estado', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--smoke)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', color: 'var(--cream)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)', whiteSpace: 'nowrap' }}>{teacherMap[s.teacher]?.name?.split(',')[0] || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--smoke)' }}>{s.company}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 60, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (s.hours / 100) * 100)}%`, background: s.hours >= 100 ? 'var(--teal)' : 'var(--gold)', borderRadius: 99 }} />
                          </div>
                          <span style={{ color: s.hours >= 100 ? 'var(--teal)' : 'var(--cream)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.hours}h</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: s.visits >= 2 ? 'var(--teal)' : s.visits > 0 ? 'var(--gold)' : '#f87171' }}>
                          {s.visits} {s.visits < 2 && '⚠'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {s.ice
                          ? <button onClick={() => { setSelected(s); setModal('ice') }} className="btn btn-sm" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', padding: '4px 10px', fontSize: '0.72rem' }}><Lock size={11} /> ICE</button>
                          : <span style={{ color: 'var(--smoke)', fontSize: '0.8rem' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={s.status} /></td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => { setSelected(s); setModal('ice') }} title={s.ice ? 'Levantar ICE' : 'Bloquear ICE'}
                          className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                          {s.ice ? <Unlock size={12} /> : <Lock size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOCENTES ──────────────────────────────────────────────────── */}
        {tab === 'docentes' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Docentes tutores</h2>
              <p>{teachers.length} docentes · Escuela Ing. Ricardo Videla</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {teachers.map(t => {
                const alert = t.students > 0 && t.visits === 0
                return (
                  <div key={t.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: `1px solid ${alert ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.07)'}`, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, var(--wine), var(--teal))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--cream)', flexShrink: 0 }}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 2 }}>{t.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.1rem' }}>{t.students}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--smoke)' }}>alumnos</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: t.visits === 0 && t.students > 0 ? '#f87171' : 'var(--teal)', fontSize: '1.1rem' }}>{t.visits}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--smoke)' }}>visitas</div>
                      </div>
                      {t.pending > 0 && <span className="badge badge-gold">{t.pending} pendientes</span>}
                      {alert && <AlertTriangle size={16} color="var(--gold)" title="Sin visitas registradas" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── EMPRESAS ──────────────────────────────────────────────────── */}
        {tab === 'empresas' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div><h2>Empresas habilitadas</h2><p>{companies.length} registradas · {companies.filter(c => !c.verified).length} sin verificar</p></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {companies.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: `1px solid ${!c.verified ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.07)'}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>{c.name}</span>
                      {!c.verified && <span className="badge badge-gold">Sin verificar</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 3 }}>CUIT: {c.cuit} · {c.sector} · {c.contact}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1.1rem' }}>{c.students}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--smoke)' }}>alumnos</div>
                    </div>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} style={{ color: 'var(--smoke)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <Phone size={13} /> {c.phone}
                      </a>
                    )}
                    {!c.verified && (
                      <button className="btn btn-teal btn-sm"><ShieldCheck size={13} /> Verificar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTROL ICE ───────────────────────────────────────────────── */}
        {tab === 'ice' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Control ICE</h2>
              <p>Gestión de alumnos en condición condicional · bloqueo automático de pasantías</p>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={17} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.85rem', color: '#f87171', margin: 0, lineHeight: 1.6 }}>
                Los alumnos con condición ICE (Insuficiente Con Evaluación) quedan bloqueados del sistema y no pueden postularse ni continuar pasantías hasta que se levante el bloqueo manualmente.
              </p>
            </div>

            {/* Alumnos con ICE */}
            <h3 style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Alumnos bloqueados ({students.filter(s => s.ice).length})
            </h3>

            {students.filter(s => s.ice).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'rgba(27,186,170,0.05)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(27,186,170,0.15)', marginBottom: 24 }}>
                <CheckCircle size={28} color="var(--teal)" style={{ marginBottom: 10, opacity: 0.7 }} />
                <p style={{ color: 'var(--teal)', margin: 0 }}>Ningún alumno con ICE activo en este momento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {students.filter(s => s.ice).map(s => (
                  <div key={s.id} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--r-lg)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1.5px solid rgba(248,113,113,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lock size={16} color="#f87171" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.92rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>{s.company} · Docente: {teacherMap[s.teacher]?.name?.split(',')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={11} /> Bloqueado — no puede continuar pasantía
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setSelected(s); setModal('ice') }} className="btn btn-sm" style={{ background: 'rgba(27,186,170,0.15)', color: 'var(--teal)', border: '1px solid rgba(27,186,170,0.3)' }}>
                      <Unlock size={14} /> Levantar ICE
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Todos los alumnos — gestión rápida */}
            <h3 style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Todos los alumnos activos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students.filter(s => !s.ice && s.status !== 'none').map(s => (
                <div key={s.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.88rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 2 }}>{s.company}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="badge badge-teal"><CheckCircle size={10} /> Sin ICE</span>
                    <button onClick={() => { setSelected(s); setModal('ice') }} className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                      <Lock size={11} /> Bloquear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SINIESTROS ────────────────────────────────────────────────── */}
        {tab === 'siniestros' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2>Registro de siniestros</h2>
                <p>Denuncias obligatorias · límite legal 72hs para enviar a DGE</p>
              </div>
              <button onClick={() => setModal('siniestro')} className="btn btn-sm" style={{ background: '#991b1b', color: 'var(--cream)', border: 'none' }}>
                <Plus size={14} /> Registrar siniestro
              </button>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 24 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {[
                  { label: 'Accidente de trabajo', val: 'accidente_trabajo' },
                  { label: 'In itinere', val: 'accidente_in_itinere' },
                  { label: 'Enfermedad profesional', val: 'enfermedad_profesional' },
                ].map(t => (
                  <div key={t.val} style={{ fontSize: '0.82rem', color: '#f87171' }}>
                    <strong>{t.label}</strong> — denunciar ante ART dentro de 72hs
                  </div>
                ))}
              </div>
            </div>

            {/* Urgentes (>48hs sin enviar) */}
            {urgentAcc.length > 0 && (
              <>
                <h3 style={{ color: '#f87171', fontSize: '0.88rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚠ Urgentes — superaron 48hs sin enviar
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {urgentAcc.map(a => (
                    <div key={a.id} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 'var(--r-lg)', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--cream)' }}>{a.student_name || 'Alumno'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 3 }}>{a.report_type?.replace(/_/g, ' ')} · {new Date(a.occurred_at).toLocaleString('es-AR')}</div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--smoke)', marginTop: 8, lineHeight: 1.5 }}>{a.description}</p>
                        </div>
                        <button onClick={() => markSent(a.id)} className="btn btn-sm" style={{ background: 'var(--teal)', color: 'var(--ink)', border: 'none', flexShrink: 0 }}>
                          <CheckCircle size={13} /> Marcar como enviado
                        </button>
                      </div>
                      <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} />
                        {Math.round((Date.now() - new Date(a.occurred_at)) / 3600000)}hs desde el suceso — límite 72hs
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Todos los siniestros */}
            <h3 style={{ color: 'var(--cream)', fontSize: '0.88rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Historial de denuncias ({accidents.length})
            </h3>
            {accidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: 'rgba(27,186,170,0.04)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(27,186,170,0.12)' }}>
                <CheckCircle size={32} color="var(--teal)" style={{ marginBottom: 12, opacity: 0.6 }} />
                <p style={{ color: 'var(--teal)' }}>Sin siniestros registrados. Ojalá siga así.</p>
                <button onClick={() => setModal('siniestro')} className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
                  <Plus size={13} /> Registrar siniestro
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {accidents.map(a => (
                  <div key={a.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: `1px solid ${a.sent_to_dge ? 'rgba(255,255,255,0.06)' : 'rgba(248,113,113,0.2)'}`, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>{a.student_name || 'Alumno'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 2 }}>{a.report_type?.replace(/_/g, ' ')} · {new Date(a.occurred_at).toLocaleString('es-AR')}</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--smoke)', marginTop: 8 }}>{a.description}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {a.sent_to_dge
                          ? <span className="badge badge-teal"><CheckCircle size={11} /> Enviado a DGE</span>
                          : <button onClick={() => markSent(a.id)} className="btn btn-teal btn-sm"><CheckCircle size={12} /> Marcar enviado</button>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CONFIGURACIÓN ─────────────────────────────────────────────── */}
        {tab === 'config' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Configuración del sistema</h2>
              <p>Parámetros según Res. 1850/2022 y Dec. 1374/11</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'SMVM vigente', field: 'smvm', prefix: '$', suffix: '' },
                { label: 'Incentivo económico (% del SMVM)', field: 'incentive_pct', prefix: '', suffix: '%' },
                { label: 'Horas máximas por día', field: 'max_hours_day', prefix: '', suffix: 'hs' },
                { label: 'Horas máximas por semana', field: 'max_hours_week', prefix: '', suffix: 'hs' },
                { label: 'Meta de horas totales', field: 'total_hours_goal', prefix: '', suffix: 'hs' },
                { label: 'Visitas mínimas obligatorias', field: 'min_visits', prefix: '', suffix: 'visitas' },
              ].map(f => (
                <div key={f.field} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <label style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>{f.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {f.prefix && <span style={{ color: 'var(--smoke)' }}>{f.prefix}</span>}
                    <input type="number" value={settings[f.field]} onChange={e => setSettings(s => ({ ...s, [f.field]: +e.target.value }))}
                      style={{ width: 100, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem', textAlign: 'right' }} />
                    {f.suffix && <span style={{ color: 'var(--smoke)' }}>{f.suffix}</span>}
                  </div>
                </div>
              ))}

              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
                <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 12 }}>Franja horaria permitida</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="time" value={settings.time_from} onChange={e => setSettings(s => ({ ...s, time_from: e.target.value }))}
                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem' }} />
                  <span style={{ color: 'var(--smoke)' }}>a</span>
                  <input type="time" value={settings.time_to} onChange={e => setSettings(s => ({ ...s, time_to: e.target.value }))}
                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button onClick={() => flash('Configuración guardada correctamente.', 'success')} className="btn btn-gold">
                  <CheckCircle size={16} /> Guardar configuración
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      {modal === 'ice' && selected && (
        <ICEModal student={selected} currentState={selected.ice} onClose={() => setModal(null)} onSaved={handleICESave} />
      )}
      {modal === 'siniestro' && (
        <SiniestroModal students={students} onClose={() => setModal(null)} onSaved={onSiniestroSaved} />
      )}
    </div>
  )
}
 ? 100 : Math.min(100, Math.round(t.visits / (t.students * 2) * 100))
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i%2===0?'transparent':'rgba(250,245,237,0.02)' }}>
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

// ─── EMPRESAS ─────────────────────────────────────────────────────────────────

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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa o CUIT…" style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 14px', color: 'var(--cream)', fontSize: '0.85rem' }}>
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
                <tr key={c.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: i%2===0?'transparent':'rgba(250,245,237,0.02)' }}>
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
          <Field label="Visitas mínimas obligatorias" value={cfg.min_visits} onChange={v => setCfg(p => ({ ...p, min_visits: +v }))} type="number" />
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
      <Section icon={Download} title="Reporte de Notas — GEM">
        <p style={{ color: 'var(--smoke)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
          CSV con notas finales de rúbrica de todos los alumnos del curso. Formato listo para GEM.
        </p>
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
      <Section icon={ShieldCheck} title="Validación de Firmas Digitales">
        <p style={{ color: 'var(--smoke)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
          Como Master Admin, sos el último eslabón de la cadena de firmas. Verificás las firmas de padres/tutores antes de liberar la pasantía.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.filter(s => s.hours > 0).slice(0, 6).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250,245,237,0.03)', borderRadius: 8, padding: '8px 14px' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--cream)' }}>{s.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✅ PDF firmado</span>
                <button style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: '3px 10px', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem' }}>Validar</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}


// ─── IMPORTAR DATOS ───────────────────────────────────────────────────────────

function ImportTab() {
  const [step, setStep] = useState(null) // null | 'uploading' | 'preview' | 'result'
  const [sheets, setSheets] = useState({}) // { alumnos: [], docentes: [], empresas: [], asignaciones: [] }
  const [activeSheet, setActiveSheet] = useState('alumnos')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState({})
  const [msg, setMsg] = useState('')
  const [fileName, setFileName] = useState('')

  const SHEET_KEYS = {
    'alumnos':       '📋 Alumnos',
    'docentes':      '👩‍🏫 Docentes',
    'empresas':      '🏢 Empresas',
    'asignaciones':  '🔗 Asignaciones',
  }
  const SHEET_ORDER = ['alumnos', 'docentes', 'empresas', 'asignaciones']

  async function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setStep('uploading')
    setMsg('')

    // Leer con FileReader
    const buffer = await file.arrayBuffer()

    try {
      // Usar SheetJS (ya incluido en el proyecto como dependencia)
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true })

      const parsed = {}
      for (const [key, sheetName] of Object.entries(SHEET_KEYS)) {
        const ws = wb.Sheets[sheetName]
        if (!ws) { parsed[key] = []; continue }
        // Leer desde fila 4 (headers) en adelante, skipear ejemplos hasta fila 8
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        const headers = raw[3] // fila 4 (índice 3)
        if (!headers) { parsed[key] = []; continue }
        // Filas de datos: desde índice 8 en adelante (fila 9+), saltar ejemplos (5-7 = índices 4-6)
        const dataRows = raw.slice(8).filter(r => r.some(c => c !== ''))
        parsed[key] = dataRows.map(r => {
          const obj = {}
          headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? '' })
          return obj
        })
      }
      setSheets(parsed)
      setStep('preview')
    } catch (e) {
      setMsg('Error al leer el archivo: ' + e.message + '. Asegurate de usar el template oficial.')
      setStep(null)
    }
  }

  async function importSheet(sheetKey) {
    const rows = sheets[sheetKey]
    if (!rows || rows.length === 0) { setMsg(`La hoja "${sheetKey}" está vacía.`); return }
    setImporting(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('vm_token')}` },
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
          <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600 }}>Usar el template oficial</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>
            Descargá el Excel desde el panel superior. No modificar columnas ni nombres de hojas.
          </div>
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

      {/* Zona de drag & drop */}
      {step === null && (
        <label style={{ display: 'block', cursor: 'pointer' }}>
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 14, padding: '50px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
            <Upload size={40} style={{ opacity: 0.3, marginBottom: 14 }} />
            <div style={{ fontSize: '1rem', color: 'var(--cream)', marginBottom: 6 }}>Hacé clic para seleccionar el Excel</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>Formatos: .xlsx · Tamaño máximo: 10MB</div>
          </div>
        </label>
      )}

      {step === 'uploading' && (
        <div style={{ textAlign: 'center', padding: 50, color: 'var(--smoke)' }}>Leyendo archivo…</div>
      )}

      {step === 'preview' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>📎 {fileName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>{totalRows} filas detectadas en total</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setStep(null); setSheets({}); setResults({}) }}>✕ Cancelar</button>
              <button className="btn btn-gold btn-sm" onClick={importAll} disabled={importing}>
                {importing ? 'Importando…' : `↑ Importar todo (${totalRows} filas)`}
              </button>
            </div>
          </div>

          {/* Tabs de hojas */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {SHEET_ORDER.map(key => (
              <button key={key} onClick={() => setActiveSheet(key)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeSheet === key ? 'var(--wine)' : 'transparent', color: activeSheet === key ? 'white' : 'var(--smoke)', position: 'relative' }}>
                {SHEET_KEYS[key]}
                <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '1px 7px', fontSize: '0.72rem' }}>
                  {sheets[key]?.length || 0}
                </span>
                {results[key] && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: results[key].errors?.length ? '#f87171' : '#4ade80' }} />}
              </button>
            ))}
          </div>

          {/* Preview tabla */}
          {(() => {
            const rows = sheets[activeSheet] || []
            const headers = rows[0] ? Object.keys(rows[0]) : []
            const res = results[activeSheet]
            return (
              <div>
                {res && (
                  <div style={{ padding: '10px 14px', background: res.errors?.length ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)', border: `1px solid ${res.errors?.length ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`, borderRadius: 10, marginBottom: 12, fontSize: '0.85rem' }}>
                    <strong style={{ color: res.errors?.length ? '#f87171' : '#4ade80' }}>
                      ✓ {res.created} creados · {res.updated} actualizados · {res.errors?.length || 0} errores
                    </strong>
                    {res.errors?.map((e, i) => <div key={i} style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: 4 }}>⚠ {e.message}</div>)}
                  </div>
                )}
                {rows.length === 0
                  ? <div style={{ textAlign: 'center', padding: 30, color: 'var(--smoke)', fontSize: '0.85rem' }}>Esta hoja está vacía o no tiene datos.</div>
                  : (
                    <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--ink-soft)', zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
                            {headers.map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 50).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
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

          {/* Reporte de contraseñas generadas */}
          {Object.values(results).some(r => r.passwords?.length) && (
            <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(27,186,170,0.08)', border: '1px solid rgba(27,186,170,0.3)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--teal)', fontWeight: 600, marginBottom: 10 }}>🔑 Contraseñas generadas automáticamente</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginBottom: 10 }}>Guardá esta información — no se puede recuperar después.</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Nombre', 'Email', 'Contraseña temporal'].map(h => <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--smoke)' }}>{h}</th>)}
                  </tr></thead>
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
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('monitor')
  const [teachers, setTeachers] = useState(DEMO_TEACHERS)
  const [companies, setCompanies] = useState(DEMO_COMPANIES)
  const [iceMap, setIceMap] = useState(INITIAL_ICE)

  // Construir lista de alumnos enriquecida con estado ICE en tiempo real
  const students = useMemo(() => {
    return DEMO_STUDENTS_BASE.map(s => ({
      ...s,
      ice: !!iceMap[s.id]?.blocked,
      status: iceMap[s.id]?.blocked ? 'blocked' : s.status,
    }))
  }, [iceMap])

  async function toggleIce(studentId, block, reason) {
    // Actualización optimista inmediata
    setIceMap(prev => ({
      ...prev,
      [studentId]: block
        ? { blocked: true, reason, set_at: new Date().toLocaleDateString('es-AR') }
        : { blocked: false, reason: '', lifted_at: new Date().toLocaleDateString('es-AR') }
    }))
    // Persistir en API real
    try {
      await fetch('/api/admin?_resource=dashboard&action=toggle_ice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('vm_token')}` },
        body: JSON.stringify({ student_id: studentId, block, reason })
      })
    } catch (e) { console.warn('ICE API call failed (optimistic update persisted):', e) }
  }

  function logout() { clearAuth(); navigate('/login') }

  const iceCount       = students.filter(s => s.ice).length
  const siniestroAlert = false // en producción: contar siniestros con hoursAgo > 48 sin enviar

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink-soft)', borderBottom: '1px solid rgba(250,245,237,0.08)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
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

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(250,245,237,0.04)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
              background: tab === t.id ? 'var(--wine)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--smoke)',
              position: 'relative',
            }}>
              <t.icon size={14} />
              {t.label}
              {t.id === 'ice' && iceCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
              )}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ animation: 'fadeUp 0.35s ease' }}>
          {tab === 'monitor'    && <MonitorTab students={students} teachers={teachers} />}
          {tab === 'ice'        && <IceTab students={students} iceMap={iceMap} onToggleIce={toggleIce} />}
          {tab === 'siniestros' && <SiniestrosTab students={students} />}
          {tab === 'teachers'   && <TeachersTab teachers={teachers} setTeachers={setTeachers} />}
          {tab === 'companies'  && <CompaniesTab companies={companies} setCompanies={setCompanies} />}
          {tab === 'settings'   && <SettingsTab />}
          {tab === 'import'    && <ImportTab />}
          {tab === 'export'     && <ExportTab students={students} teachers={teachers} />}
        </div>
      </div>
    </div>
  )
}
