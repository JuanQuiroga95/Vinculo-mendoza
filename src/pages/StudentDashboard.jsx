// src/pages/StudentDashboard.jsx — Alumno Dashboard v2
// Módulos: Inicio · Pasantías · Mis postulaciones · Portafolio · Bitácora
//          Asistencia (clock-in/out + 100hs) · Informe Final · Carpeta

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import {
  getProfile, getToken,
  vacancyAPI, applicationAPI, portfolioAPI, logbookAPI,
  STATUS_LABELS, STATUS_BADGE, calcMatchScore
} from '../utils/auth'
import {
  LayoutDashboard, Search, FolderOpen, BookOpen, Briefcase,
  ChevronRight, Plus, X, Clock, MapPin, FileText, Upload,
  CheckCircle, AlertTriangle, Timer, TrendingUp, Folder,
  LogIn, LogOut as LogOutIcon, Star
} from 'lucide-react'

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
const attendanceAPI = {
  get:  (pasantia_id) => apiFetch(`/students/attendance?pasantia_id=${pasantia_id}&_resource=attendance`),
  post: (body) => apiFetch('/students/attendance?_resource=attendance', { method: 'POST', body: JSON.stringify(body) }),
}
const reportAPI = {
  get:  (pasantia_id) => apiFetch(`/students/report?pasantia_id=${pasantia_id}&_resource=report`),
  save: (body) => apiFetch('/students/report?_resource=report', { method: 'POST', body: JSON.stringify(body) }),
}

const PREGUNTAS = [
  { key: 'q_expectativas',  label: 'Expectativas previas', ph: '¿Qué esperabas antes de empezar?' },
  { key: 'q_sentimientos',  label: 'Sentimientos al llegar', ph: '¿Cómo te sentiste el primer día?' },
  { key: 'q_aprendizajes',  label: 'Aprendizajes clave', ph: '¿Qué aprendiste que no hubieras aprendido en el aula?' },
  { key: 'q_conflictos',    label: 'Situaciones difíciles', ph: '¿Tuviste algún conflicto? ¿Cómo lo resolviste?' },
  { key: 'q_saberes',       label: 'Saberes escolares aplicados', ph: 'ej: IVA, ficha de stock, comunicación escrita...' },
  { key: 'q_mejoras',       label: 'Propuestas de mejora', ph: '¿Qué mejorarías de tu desempeño?' },
  { key: 'q_relaciones',    label: 'Vínculos y relaciones', ph: '¿Cómo fue tu relación con compañeros y jefes?' },
  { key: 'q_recomendacion', label: '¿Lo recomendarías?', ph: '¿Recomendarías la empresa a otros alumnos?' },
]
const SABERES = ['Ficha de stock','IVA','Facturación','Atención al cliente','Comunicación escrita','Excel / planillas','Contabilidad básica','Nota de pedido','Remito','Marketing digital','Redes sociales','Gestión de inventario','Trámites bancarios','Archivo y documentación']
const DOCS = [
  { key: 'dni',          label: 'DNI (ambos lados)',      hint: 'Foto o escaneo del DNI frente y dorso' },
  { key: 'cuil',         label: 'Constancia de CUIL',     hint: 'Descargable desde AFIP' },
  { key: 'seguro',       label: 'Seguro escolar',          hint: 'Póliza vigente de la escuela' },
  { key: 'autorizacion', label: 'Autorización de padres', hint: 'Firmada por madre, padre o tutor' },
]

function ProgressRing({ pct, size = 80, stroke = 6, color = 'var(--teal)' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

function HorasWidget({ totalHours, remaining, goalReached }) {
  const pct = Math.min(100, (totalHours / 100) * 100)
  const color = goalReached ? 'var(--teal)' : pct >= 60 ? 'var(--gold)' : 'var(--wine-light)'
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: `1px solid ${goalReached ? 'rgba(27,186,170,0.3)' : 'rgba(255,255,255,0.08)'}`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ProgressRing pct={pct} size={88} stroke={7} color={color} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color, lineHeight: 1 }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color, lineHeight: 1 }}>{Number(totalHours).toFixed(1)}</span>
          <span style={{ fontSize: '1rem', color: 'var(--smoke)' }}>/ 100 horas</span>
        </div>
        {goalReached
          ? <div className="alert alert-success" style={{ padding: '6px 12px', fontSize: '0.82rem', marginTop: 6, display: 'inline-flex' }}><CheckCircle size={13} /> ¡Meta de 100 horas alcanzada!</div>
          : <p style={{ fontSize: '0.85rem', margin: 0 }}>Te faltan <strong style={{ color }}>{Number(remaining).toFixed(1)} horas</strong> para completar la pasantía.</p>
        }
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const [tab, setTab] = useState('inicio')
  const [vacancies, setVacancies]       = useState([])
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio]       = useState([])
  const [logbook, setLogbook]           = useState([])
  const [pasantias, setPasantias]       = useState([])
  const [attendance, setAttendance]     = useState({ entries: [], total_hours: 0, hours_remaining: 100, goal_reached: false })
  const [carpeta, setCarpeta]           = useState({})
  const [reportDraft, setReportDraft]   = useState({})
  const [report, setReport]             = useState(null)
  const [modal, setModal]               = useState(null)
  const [selected, setSelected]         = useState(null)
  const [form, setForm]                 = useState({})
  const [msg, setMsg]                   = useState({ text: '', type: '' })
  const [reportSaving, setReportSaving] = useState(false)
  const profile = getProfile()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [v, a, p, l] = await Promise.allSettled([
        vacancyAPI.getAll(), applicationAPI.getMine(), portfolioAPI.getMine(), logbookAPI.getMine()
      ])
      if (v.status === 'fulfilled') setVacancies(v.value.vacancies || [])
      if (a.status === 'fulfilled') setApplications(a.value.applications || [])
      if (p.status === 'fulfilled') setPortfolio(p.value.items || [])
      if (l.status === 'fulfilled') setLogbook(l.value.entries || [])

      const pasData = await apiFetch('/students/pasantias').catch(() => ({ pasantias: [] }))
      const pList = pasData.pasantias || []
      setPasantias(pList)
      if (pList.length > 0) {
        const att = await attendanceAPI.get(pList[0].id).catch(() => null)
        if (att) setAttendance(att)
        const rep = await reportAPI.get(pList[0].id).catch(() => null)
        if (rep) { setReport(rep); setReportDraft(rep) }
      }
    } catch {}
  }

  function flash(text, type = 'success') {
    setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 4000)
  }

  async function apply() {
    try {
      await applicationAPI.apply({ vacancy_id: selected.id, cover_note: form.cover_note })
      flash('¡Postulación enviada!', 'success'); setModal(null); setForm({})
      const a = await applicationAPI.getMine(); setApplications(a.applications || [])
    } catch (e) { flash(e.message, 'error') }
  }

  async function addPortfolio() {
    try {
      await portfolioAPI.add(form); setModal(null); setForm({})
      const p = await portfolioAPI.getMine(); setPortfolio(p.items || [])
    } catch (e) { flash(e.message, 'error') }
  }

  async function addLogEntry() {
    try {
      await logbookAPI.addEntry(form); setModal(null); setForm({})
      const l = await logbookAPI.getMine(); setLogbook(l.entries || [])
    } catch (e) { flash(e.message, 'error') }
  }

  async function saveAttendance() {
    if (!form.clock_in || !form.clock_out) { flash('Completá entrada y salida.', 'error'); return }
    try {
      await attendanceAPI.post({ ...form, pasantia_id: pasantias[0]?.id })
      setModal(null); setForm({})
      const att = await attendanceAPI.get(pasantias[0].id)
      setAttendance(att); flash('Asistencia registrada.', 'success')
    } catch (e) { flash(e.message, 'error') }
  }

  async function saveReport(status = 'draft') {
    setReportSaving(true)
    try {
      await reportAPI.save({ ...reportDraft, pasantia_id: pasantias[0]?.id, status })
      setReport({ ...reportDraft, status })
      flash(status === 'submitted' ? 'Informe enviado al docente.' : 'Borrador guardado.', 'success')
    } catch (e) { flash(e.message, 'error') }
    setReportSaving(false)
  }

  function toggleSaber(s) {
    setReportDraft(d => {
      const curr = d.saberes_tags || []
      return { ...d, saberes_tags: curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s] }
    })
  }

  function handleFile(key, file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      setCarpeta(c => ({ ...c, [key]: { name: file.name, url: e.target.result, size: file.size } }))
      flash(`${file.name} cargado.`, 'success')
    }
    reader.readAsDataURL(file)
  }

  const appliedIds = new Set(applications.map(a => a.vacancy_id))
  const sortedVac = [...vacancies].sort((a, b) => calcMatchScore(profile || {}, b) - calcMatchScore(profile || {}, a))
  const pendingApps = applications.filter(a => a.status === 'pending').length
  const reportComplete = PREGUNTAS.every(q => reportDraft[q.key]?.trim().length > 0)
  const carpetaCount = DOCS.filter(d => carpeta[d.key]).length

  const horasTotales = form.clock_in && form.clock_out
    ? (() => { const [ih,im] = form.clock_in.split(':').map(Number); const [oh,om] = form.clock_out.split(':').map(Number); return ((oh*60+om)-(ih*60+im))/60 })()
    : null

  const navItems = [
    { id: 'inicio',        label: 'Inicio',            icon: <LayoutDashboard size={16} /> },
    { id: 'vacantes',      label: 'Pasantías',          icon: <Search size={16} />, count: vacancies.length },
    { id: 'postulaciones', label: 'Mis postulaciones',  icon: <Briefcase size={16} />, count: pendingApps },
    { id: 'asistencia',    label: 'Asistencia',         icon: <Timer size={16} /> },
    { id: 'portafolio',    label: 'Mi portafolio',      icon: <FolderOpen size={16} />, count: portfolio.length },
    { id: 'bitacora',      label: 'Bitácora',           icon: <BookOpen size={16} />, count: logbook.length },
    { id: 'informe',       label: 'Informe final',      icon: <FileText size={16} /> },
    { id: 'carpeta',       label: 'Mi carpeta',         icon: <Folder size={16} />, count: carpetaCount || undefined },
  ]

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', color: 'var(--cream)', fontSize: '0.9rem' }
  const taStyle = { ...inputStyle, resize: 'vertical', fontSize: '0.88rem' }

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--wine-light)" />
      <main className="dashboard-main">
        {msg.text && (
          <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }} onClick={() => setMsg({ text:'', type:'' })}>
            {msg.type === 'success' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
            {msg.text} <X size={14} style={{ marginLeft:'auto', cursor:'pointer' }}/>
          </div>
        )}

        {/* INICIO */}
        {tab === 'inicio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Hola, {profile?.full_name?.split(' ')[0] || 'Alumno'} 👋</h2>
              <p>{profile?.school} · {profile?.orientation} · {profile?.grade}</p>
            </div>
            {pasantias.length > 0 && <div style={{ marginBottom: 28 }}><HorasWidget totalHours={attendance.total_hours} remaining={attendance.hours_remaining} goalReached={attendance.goal_reached}/></div>}
            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { val: vacancies.length,    label: 'Vacantes activas', color: 'var(--gold)' },
                { val: applications.length, label: 'Postulaciones',    color: 'var(--wine-light)' },
                { val: portfolio.length,    label: 'Proyectos',        color: 'var(--teal)' },
                { val: logbook.length,      label: 'Bitácora',         color: 'var(--muted)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Vacantes recomendadas</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {sortedVac.slice(0, 3).map(v => (
                <div key={v.id} onClick={() => { setSelected(v); setModal('apply') }}
                  style={{ background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'var(--r-md)', padding:'14px 18px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(212,168,67,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
                  <div>
                    <div style={{ fontWeight:600, color:'var(--cream)', fontSize:'0.9rem' }}>{v.title}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--teal)', marginTop:2 }}>{v.company_name}</div>
                  </div>
                  <ChevronRight size={16} color="var(--smoke)"/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VACANTES */}
        {tab === 'vacantes' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header"><h2>Pasantías disponibles</h2><p>{vacancies.length} vacantes activas</p></div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {sortedVac.map(v => {
                const applied = appliedIds.has(v.id)
                const score = calcMatchScore(profile||{}, v)
                return (
                  <div key={v.id} className="vacancy-card" style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                        <span className="vacancy-company">{v.company_name}</span>
                        {score >= 40 && <span className="badge badge-teal">Match {score}%</span>}
                        {applied && <span className="badge badge-gold">Ya postulado</span>}
                      </div>
                      <div className="vacancy-title">{v.title}</div>
                      <p style={{ fontSize:'0.85rem', marginTop:8 }}>{v.description}</p>
                      <div className="vacancy-meta">
                        {v.location && <span className="badge badge-smoke"><MapPin size={10}/> {v.location}</span>}
                        {v.hours_per_week && <span className="badge badge-smoke"><Clock size={10}/> {v.hours_per_week}h/sem</span>}
                        {(v.tags||[]).map(t => <span key={t} className="badge badge-smoke">{t}</span>)}
                      </div>
                    </div>
                    {!applied && <button onClick={() => { setSelected(v); setModal('apply') }} className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>Postular</button>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* POSTULACIONES */}
        {tab === 'postulaciones' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header"><h2>Mis postulaciones</h2><p>{applications.length} en total · {pendingApps} pendientes</p></div>
            {applications.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <Briefcase size={36} style={{ opacity:0.25, marginBottom:12 }}/>
                <p>Todavía no te postulaste a ninguna pasantía.</p>
                <button onClick={() => setTab('vacantes')} className="btn btn-primary btn-sm" style={{ marginTop:16 }}>Ver vacantes</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {applications.map(a => (
                  <div key={a.id} style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.07)', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                    <div>
                      <div style={{ fontWeight:600, color:'var(--cream)' }}>{a.vacancy_title || 'Pasantía'}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--smoke)', marginTop:2 }}>{a.company_name} · {new Date(a.applied_at).toLocaleDateString('es-AR')}</div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASISTENCIA */}
        {tab === 'asistencia' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div><h2>Mi asistencia</h2><p>Registrá tus entradas y salidas diariamente</p></div>
              {pasantias.length > 0 && <button onClick={() => setModal('asistencia')} className="btn btn-teal btn-sm"><Plus size={14}/> Registrar</button>}
            </div>
            {pasantias.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <Timer size={36} style={{ opacity:0.25, marginBottom:12 }}/>
                <p>No tenés ninguna pasantía activa todavía.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:24 }}><HorasWidget totalHours={attendance.total_hours} remaining={attendance.hours_remaining} goalReached={attendance.goal_reached}/></div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
                  {[
                    { val:'Máx. 4hs', label:'por día', color:'var(--gold)' },
                    { val:'Máx. 20hs', label:'por semana', color:'var(--teal)' },
                    { val:'08:00 – 18:00', label:'franja horaria', color:'var(--muted)' },
                  ].map(r => (
                    <div key={r.val} style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', padding:14, border:'1px solid rgba(255,255,255,0.07)', textAlign:'center' }}>
                      <div style={{ fontWeight:700, color:r.color, fontSize:'0.95rem' }}>{r.val}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--smoke)', marginTop:2 }}>{r.label}</div>
                    </div>
                  ))}
                </div>
                <h3 style={{ marginBottom:12, color:'var(--cream)', fontSize:'1rem' }}>Historial de asistencias</h3>
                {attendance.entries.length === 0 ? (
                  <div style={{ textAlign:'center', padding:40, background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <p>No hay registros aún. Empezá registrando tu primera jornada.</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {attendance.entries.map((e,i) => (
                      <div key={e.id||i} style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                        <div>
                          <div style={{ fontWeight:600, color:'var(--cream)', fontSize:'0.9rem' }}>{e.entry_date}</div>
                          <div style={{ fontSize:'0.78rem', color:'var(--smoke)', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
                            <LogIn size={12}/> {e.clock_in} <span style={{ opacity:0.4 }}>→</span> <LogOutIcon size={12}/> {e.clock_out||'—'}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          {e.hours_worked && <span style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--gold)', fontWeight:700 }}>{parseFloat(e.hours_worked).toFixed(1)}h</span>}
                          {e.verified_by_instructor && <span className="badge badge-teal">Verificado</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PORTAFOLIO */}
        {tab === 'portafolio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div><h2>Mi portafolio</h2><p>{portfolio.length} proyectos</p></div>
              <button onClick={() => setModal('portfolio')} className="btn btn-primary btn-sm"><Plus size={14}/> Agregar</button>
            </div>
            <div className="grid-2">
              {portfolio.map(item => (
                <div key={item.id} style={{ background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.07)', padding:20 }}>
                  <div style={{ fontWeight:600, color:'var(--cream)' }}>{item.title}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--teal)', marginTop:3 }}>{item.category} · {item.subject}</div>
                  <p style={{ fontSize:'0.85rem', marginTop:10 }}>{item.description}</p>
                </div>
              ))}
            </div>
            {portfolio.length === 0 && <div style={{ textAlign:'center', padding:60, background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.06)' }}><FolderOpen size={36} style={{ opacity:0.25, marginBottom:12 }}/><p>Agregá tus proyectos escolares.</p></div>}
          </div>
        )}

        {/* BITÁCORA */}
        {tab === 'bitacora' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div><h2>Bitácora</h2><p>Registrá tus actividades diarias</p></div>
              <button onClick={() => setModal('logbook')} className="btn btn-primary btn-sm"><Plus size={14}/> Nueva entrada</button>
            </div>
            {logbook.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.06)' }}><BookOpen size={36} style={{ opacity:0.25, marginBottom:12 }}/><p>Anotá lo que hacés en cada jornada.</p></div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {logbook.map((e,i) => (
                  <div key={e.id||i} style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.07)', padding:'16px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:'0.78rem', color:'var(--teal)' }}>{e.company_name}</span>
                      <span style={{ fontSize:'0.78rem', color:'var(--smoke)' }}>{e.entry_date} · {e.hours_worked}h</span>
                    </div>
                    <p style={{ fontSize:'0.88rem', color:'var(--cream)', margin:0, lineHeight:1.6 }}>{e.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INFORME FINAL */}
        {tab === 'informe' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div><h2>Informe final</h2><p>8 preguntas de reflexión sobre tu experiencia</p></div>
              {report?.status === 'submitted' && <span className="badge badge-teal"><CheckCircle size={12}/> Enviado</span>}
            </div>
            <div style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.08)', padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:5 }}>
                {PREGUNTAS.map(q => <div key={q.key} style={{ width:20, height:5, borderRadius:99, background: reportDraft[q.key]?.trim() ? 'var(--teal)' : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} title={q.label}/>)}
              </div>
              <span style={{ fontSize:'0.82rem', color:'var(--smoke)' }}>
                {PREGUNTAS.filter(q => reportDraft[q.key]?.trim().length > 0).length} / 8 completadas
              </span>
              {report?.status === 'draft' && <span className="badge badge-gold">Borrador</span>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
              {PREGUNTAS.map((q,i) => (
                <div key={q.key} style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.07)', padding:'16px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background: reportDraft[q.key]?.trim() ? 'rgba(27,186,170,0.2)' : 'rgba(255,255,255,0.05)', border:`1.5px solid ${reportDraft[q.key]?.trim() ? 'var(--teal)' : 'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color: reportDraft[q.key]?.trim() ? 'var(--teal)' : 'var(--smoke)', flexShrink:0 }}>
                      {i+1}
                    </div>
                    <label style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--cream)' }}>{q.label}</label>
                  </div>
                  <textarea rows={3} value={reportDraft[q.key]||''} placeholder={q.ph} disabled={report?.status==='submitted'}
                    onChange={e => setReportDraft(d => ({...d, [q.key]: e.target.value}))}
                    style={taStyle}/>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:'1px solid rgba(255,255,255,0.08)', padding:'18px 20px', marginBottom:24 }}>
              <h3 style={{ color:'var(--cream)', fontSize:'1rem', marginBottom:6 }}>Saberes escolares significativos</h3>
              <p style={{ fontSize:'0.82rem', marginBottom:14 }}>¿Qué conocimientos de la escuela aplicaste en tu pasantía?</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {SABERES.map(s => {
                  const sel = (reportDraft.saberes_tags||[]).includes(s)
                  return (
                    <button key={s} onClick={() => report?.status!=='submitted' && toggleSaber(s)}
                      style={{ padding:'4px 12px', borderRadius:99, fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s', background: sel ? 'rgba(27,186,170,0.2)' : 'rgba(255,255,255,0.04)', border:`1.5px solid ${sel ? 'var(--teal)' : 'rgba(255,255,255,0.1)'}`, color: sel ? 'var(--teal)' : 'var(--smoke)' }}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
            {report?.status !== 'submitted' && (
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button onClick={() => saveReport('draft')} disabled={reportSaving} className="btn btn-outline btn-sm">
                  {reportSaving ? 'Guardando…' : 'Guardar borrador'}
                </button>
                <button onClick={() => saveReport('submitted')} disabled={reportSaving || !reportComplete || pasantias.length===0} className="btn btn-primary">
                  <FileText size={16}/> Enviar al docente
                </button>
                {!reportComplete && <span style={{ fontSize:'0.8rem', color:'var(--smoke)', alignSelf:'center' }}>Completá las 8 preguntas para enviar.</span>}
              </div>
            )}
          </div>
        )}

        {/* CARPETA */}
        {tab === 'carpeta' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Mi carpeta</h2>
              <p>Documentación obligatoria · {carpetaCount} / {DOCS.length} documentos</p>
            </div>
            <div style={{ background:'rgba(212,168,67,0.07)', border:'1px solid rgba(212,168,67,0.2)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}>
              <AlertTriangle size={15} color="var(--gold)" style={{ flexShrink:0, marginTop:2 }}/>
              <p style={{ fontSize:'0.85rem', color:'var(--gold)', margin:0 }}>Requisito obligatorio según Res. 1850/2022 y Dec. 1374/11. Tener todos los documentos antes de comenzar.</p>
            </div>
            <div style={{ background:'var(--bg-card)', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.08)', padding:'12px 16px', marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:6 }}>
                <span style={{ color:'var(--smoke)' }}>Documentos cargados</span>
                <span style={{ color: carpetaCount===DOCS.length ? 'var(--teal)' : 'var(--gold)', fontWeight:700 }}>{carpetaCount} / {DOCS.length}</span>
              </div>
              <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(carpetaCount/DOCS.length)*100}%`, background: carpetaCount===DOCS.length ? 'var(--teal)' : 'var(--gold)', borderRadius:99, transition:'width 0.5s ease' }}/>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {DOCS.map(doc => {
                const up = carpeta[doc.key]
                return (
                  <div key={doc.key} style={{ background:'var(--bg-card)', borderRadius:'var(--r-lg)', border:`1px solid ${up ? 'rgba(27,186,170,0.3)' : 'rgba(255,255,255,0.07)'}`, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                      <div style={{ width:38, height:38, borderRadius:10, background: up ? 'rgba(27,186,170,0.15)' : 'rgba(255,255,255,0.05)', border:`1px solid ${up ? 'rgba(27,186,170,0.3)' : 'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {up ? <CheckCircle size={18} color="var(--teal)"/> : <FileText size={18} color="var(--smoke)"/>}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, color:'var(--cream)', fontSize:'0.9rem' }}>{doc.label}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--smoke)', marginTop:2 }}>{doc.hint}</div>
                        {up && <div style={{ fontSize:'0.72rem', color:'var(--teal)', marginTop:3 }}>{up.name} · {(up.size/1024).toFixed(0)} KB</div>}
                      </div>
                    </div>
                    <label style={{ cursor:'pointer' }}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleFile(doc.key, e.target.files[0])}/>
                      <span className={`btn ${up ? 'btn-outline' : 'btn-primary'} btn-sm`}><Upload size={13}/> {up ? 'Reemplazar' : 'Subir'}</span>
                    </label>
                  </div>
                )
              })}
            </div>
            {carpetaCount === DOCS.length && <div className="alert alert-success" style={{ marginTop:20 }}><CheckCircle size={16}/> ¡Carpeta completa! Todos los documentos están cargados.</div>}
          </div>
        )}
      </main>

      {/* Modales */}
      {modal === 'apply' && selected && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div><div style={{ fontSize:'0.8rem', color:'var(--teal)', marginBottom:4 }}>{selected.company_name}</div><h3 style={{ color:'var(--cream)', fontFamily:'var(--font-display)' }}>{selected.title}</h3></div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--smoke)', cursor:'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize:'0.88rem', marginBottom:16 }}>{selected.description}</p>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:6 }}>Carta de presentación (opcional)</label>
              <textarea rows={4} value={form.cover_note||''} onChange={e => setForm(f => ({...f, cover_note: e.target.value}))} placeholder="¿Por qué te interesa esta pasantía?" style={taStyle}/>
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">Cancelar</button>
              <button onClick={apply} className="btn btn-primary btn-sm">Postularme</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'portfolio' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3 style={{ color:'var(--cream)', fontFamily:'var(--font-display)' }}>Agregar al portafolio</h3><button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--smoke)', cursor:'pointer' }}><X size={20}/></button></div>
            {[{ f:'title', l:'Título *', ph:'ej. Relevamiento de stock' },{ f:'category', l:'Categoría', ph:'ej. Contabilidad' },{ f:'subject', l:'Materia', ph:'ej. Economía y Gestión' }].map(ff => (
              <div key={ff.f} style={{ marginBottom:12 }}>
                <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>{ff.l}</label>
                <input type="text" value={form[ff.f]||''} placeholder={ff.ph} onChange={e => setForm(x => ({...x, [ff.f]: e.target.value}))} style={inputStyle}/>
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>Descripción</label>
              <textarea rows={3} value={form.description||''} placeholder="Describí el trabajo o proyecto..." onChange={e => setForm(x => ({...x, description: e.target.value}))} style={taStyle}/>
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">Cancelar</button>
              <button onClick={addPortfolio} disabled={!form.title} className="btn btn-primary btn-sm"><Plus size={14}/> Agregar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'logbook' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3 style={{ color:'var(--cream)', fontFamily:'var(--font-display)' }}>Nueva entrada en bitácora</h3><button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--smoke)', cursor:'pointer' }}><X size={20}/></button></div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>Pasantía</label>
              <select value={form.application_id||applications[0]?.id||''} onChange={e => setForm(f => ({...f, application_id: e.target.value}))} style={inputStyle}>
                {applications.filter(a => a.status==='accepted').map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>¿Qué hiciste hoy?</label>
              <textarea rows={4} value={form.content||''} placeholder="Describí las actividades del día..." onChange={e => setForm(f => ({...f, content: e.target.value}))} style={taStyle}/>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>Horas trabajadas</label>
              <input type="number" min="0.5" max="4" step="0.5" value={form.hours_worked||''} onChange={e => setForm(f => ({...f, hours_worked: e.target.value}))} style={{ ...inputStyle, width:100 }}/>
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">Cancelar</button>
              <button onClick={addLogEntry} disabled={!form.content} className="btn btn-primary btn-sm"><Plus size={14}/> Guardar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'asistencia' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3 style={{ color:'var(--cream)', fontFamily:'var(--font-display)' }}>Registrar asistencia</h3><button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--smoke)', cursor:'pointer' }}><X size={20}/></button></div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>Fecha</label>
              <input type="date" value={form.entry_date||new Date().toISOString().slice(0,10)} onChange={e => setForm(f => ({...f, entry_date: e.target.value}))} style={inputStyle}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>Entrada</label>
                <input type="time" value={form.clock_in||''} min="08:00" max="18:00" onChange={e => setForm(f => ({...f, clock_in: e.target.value}))} style={inputStyle}/>
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--smoke)', display:'block', marginBottom:5 }}>Salida</label>
                <input type="time" value={form.clock_out||''} min="08:00" max="18:00" onChange={e => setForm(f => ({...f, clock_out: e.target.value}))} style={inputStyle}/>
              </div>
            </div>
            {horasTotales !== null && horasTotales > 0 && (
              <div style={{ background: horasTotales>4 ? 'rgba(124,29,47,0.15)' : 'rgba(27,186,170,0.1)', border:`1px solid ${horasTotales>4 ? 'var(--wine)' : 'rgba(27,186,170,0.3)'}`, borderRadius:'var(--r-md)', padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                {horasTotales>4 ? <AlertTriangle size={14} color="var(--wine-light)"/> : <Clock size={14} color="var(--teal)"/>}
                <span style={{ fontSize:'0.88rem', color: horasTotales>4 ? 'var(--wine-light)' : 'var(--teal)', fontWeight:600 }}>
                  {horasTotales>4 ? `⚠ Superás el límite de 4hs/día (${horasTotales.toFixed(1)}hs)` : `${horasTotales.toFixed(1)} horas a registrar`}
                </span>
              </div>
            )}
            <div style={{ background:'rgba(212,168,67,0.07)', borderRadius:'var(--r-md)', padding:'8px 12px', marginBottom:18, fontSize:'0.75rem', color:'var(--smoke)' }}>
              Franja: 08:00–18:00 · Máx. 4hs/día · 20hs/semana
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">Cancelar</button>
              <button onClick={saveAttendance} className="btn btn-teal btn-sm"><CheckCircle size={14}/> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
