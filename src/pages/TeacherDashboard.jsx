// src/pages/TeacherDashboard.jsx — v2.0
// Módulo del Docente Tutor: Visitas + Rúbrica + GEM + Validaciones
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getProfile } from '../utils/auth'
import {
  LayoutDashboard, Users, Star, ClipboardList,
  Plus, X, Check, Search, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Lock, FileText,
} from 'lucide-react'

// ─── Constantes ────────────────────────────────────────────────────────────

const ASPECTS = [
  { key: 'asp_puntualidad',      label: 'Puntualidad',           desc: 'Llegada en tiempo y forma' },
  { key: 'asp_uniforme',         label: 'Presentación/Uniforme', desc: 'Vestimenta adecuada al ámbito' },
  { key: 'asp_actitud',          label: 'Actitud',               desc: 'Predisposición y motivación' },
  { key: 'asp_comunicacion',     label: 'Comunicación',          desc: 'Expresión verbal y escucha activa' },
  { key: 'asp_responsabilidad',  label: 'Responsabilidad',       desc: 'Cumplimiento de tareas asignadas' },
  { key: 'asp_adaptabilidad',    label: 'Adaptabilidad',         desc: 'Integración al ámbito laboral' },
  { key: 'asp_aprendizaje',      label: 'Aprendizaje',           desc: 'Incorporación de nuevos saberes' },
  { key: 'asp_reglamentos',      label: 'Respeto a Reglamentos', desc: 'Cumplimiento de normas internas' },
]

const RUBRIC_CRITERIA = [
  { key: 'crit_asistencia',    label: 'Asistencia y Puntualidad',  desc: 'Regularidad y respeto del horario durante toda la pasantía' },
  { key: 'crit_presentacion',  label: 'Presentación Personal',      desc: 'Cuidado del uniforme, higiene y presencia profesional' },
  { key: 'crit_conocimientos', label: 'Conocimientos Aplicados',    desc: 'Aplicación de saberes escolares en el contexto laboral' },
  { key: 'crit_informe',       label: 'Informe Final del Alumno',   desc: 'Calidad y reflexión del informe entregado por el alumno' },
]

const LEVELS = [
  { val: 1, label: 'Básico',    color: '#f87171' },
  { val: 2, label: 'Esperado',  color: '#fbbf24' },
  { val: 3, label: 'Destacado', color: '#4ade80' },
]

const SKILLS = [
  'Trabajo en equipo','Liderazgo','Comunicación oral','Comunicación escrita',
  'Resolución de problemas','Responsabilidad','Proactividad','Capacidad analítica',
  'Creatividad','Puntualidad','Adaptabilidad',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToGrade(total) {
  if (total === 12) return { nota: 10.0, label: 'Sobresaliente', color: '#4ade80' }
  if (total >= 8)   return { nota: +(7.0 + ((total - 8) / 4) * 3.0).toFixed(1), label: 'Aprobado', color: '#60a5fa' }
  if (total >= 4)   return { nota: +(3.0 + ((total - 4) / 4) * 4.0).toFixed(1), label: 'Insuficiente', color: '#f87171' }
  return { nota: 1.0, label: 'Insuficiente', color: '#f87171' }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('vm_token')}`, 'Content-Type': 'application/json' }
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function LevelBtn({ val, label, color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '9px 4px', borderRadius: 8, cursor: 'pointer',
        border: selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.12)',
        background: selected ? color + '22' : 'transparent',
        color: selected ? color : 'var(--smoke)',
        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}
    >
      <span style={{ fontSize: '1rem', fontWeight: 700 }}>{val}</span>
      <span>{label}</span>
    </button>
  )
}

function AspectRow({ label, desc, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--smoke)' }}>{desc}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {LEVELS.map(lv => (
          <LevelBtn key={lv.val} {...lv} selected={value === lv.val} onClick={() => onChange(lv.val)} />
        ))}
      </div>
    </div>
  )
}

function RubricRow({ label, desc, value, onChange }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--smoke)', marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {LEVELS.map(lv => (
          <LevelBtn key={lv.val} {...lv} selected={value === lv.val} onClick={() => onChange(lv.val)} />
        ))}
      </div>
    </div>
  )
}

function VisitCard({ visit, idx }) {
  const [open, setOpen] = useState(false)
  const aspects = ASPECTS.map(a => ({ ...a, val: visit[a.key] }))
  const filled = aspects.filter(a => a.val)
  const avg = filled.length ? (filled.reduce((s, a) => s + a.val, 0) / filled.length).toFixed(1) : '—'
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--wine)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--cream)', flexShrink: 0 }}>
          {visit.visit_number || idx + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>Visita N° {visit.visit_number || idx + 1}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{fmtDate(visit.visit_date)}{visit.student_name ? ` · ${visit.student_name}` : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {visit.gem_logged && <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>GEM ✓</span>}
          <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>Prom: {avg}</span>
          {open ? <ChevronUp size={16} color="var(--smoke)" /> : <ChevronDown size={16} color="var(--smoke)" />}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginTop: 12 }}>
            {aspects.map(a => (
              <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--muted)' }}>{a.label}</span>
                <span style={{ color: a.val === 3 ? '#4ade80' : a.val === 2 ? '#fbbf24' : a.val === 1 ? '#f87171' : 'var(--smoke)', fontWeight: 600 }}>
                  {a.val ? LEVELS[a.val - 1].label : '—'}
                </span>
              </div>
            ))}
          </div>
          {visit.observations && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--smoke)' }}>
              <strong style={{ color: 'var(--muted)' }}>Observaciones: </strong>{visit.observations}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: '0.76rem', color: 'var(--smoke)' }}>
            {visit.sig_student && <span>✓ Firma alumno</span>}
            {visit.sig_instructor && <span>✓ Firma instructor</span>}
            {visit.sig_teacher && <span>✓ Firma docente</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TAB: VISITAS ─────────────────────────────────────────────────────────────

function VisitsTab({ pasantias }) {
  const [selected, setSelected] = useState(null)
  const [visits, setVisits] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  async function loadVisits(pasantiaId) {
    setLoading(true)
    try {
      const data = await fetch(`/api/teachers/visits?pasantia_id=${pasantiaId}`, { headers: authHeader() }).then(r => r.json())
      setVisits(data.visits || [])
    } catch { setVisits([]) }
    finally { setLoading(false) }
  }

  function selectPasantia(p) { setSelected(p); setVisits([]); loadVisits(p.id) }

  function openModal() {
    const init = { visit_date: new Date().toISOString().slice(0, 10), observations: '' }
    ASPECTS.forEach(a => { init[a.key] = 2 })
    setForm(init); setModal(true)
  }

  async function saveVisit() {
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/teachers/visits', { method: 'POST', headers: authHeader(), body: JSON.stringify({ pasantia_id: selected.id, ...form }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Visita registrada y volcada al GEM ✓')
      setModal(false); loadVisits(selected.id)
    } catch (e) { setMsg(e.message) }
    finally { setSaving(false) }
  }

  const visitCount = visits.length
  const canGrade = visitCount >= 2

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, minHeight: 500 }}>
      {/* Lista alumnos */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Mis alumnos</div>
        {pasantias.length === 0
          ? <div style={{ color: 'var(--smoke)', fontSize: '0.85rem', textAlign: 'center', padding: 30 }}>No tenés alumnos en pasantía activa.</div>
          : pasantias.map(p => (
            <div key={p.id} onClick={() => selectPasantia(p)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, border: selected?.id === p.id ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.07)', background: selected?.id === p.id ? 'rgba(27,186,170,0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cream)', marginBottom: 3 }}>{p.student_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginBottom: 6 }}>{p.company_name || 'Sin empresa'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, background: (p.visit_count || 0) >= 2 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: (p.visit_count || 0) >= 2 ? '#4ade80' : '#f87171' }}>
                  {(p.visit_count || 0) >= 2 ? '✓' : '✗'} {p.visit_count || 0} visitas
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Panel visitas */}
      <div>
        {!selected
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--smoke)' }}><ClipboardList size={40} style={{ opacity: 0.3, marginBottom: 12 }} /><p>Seleccioná un alumno.</p></div>
          : <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{selected.student_name}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>{selected.company_name} · {visitCount} visita(s)</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {!canGrade
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)' }}><AlertTriangle size={14} /> {2 - visitCount} visita(s) para habilitar nota</div>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(74,222,128,0.3)' }}><CheckCircle size={14} /> Habilitado para calificar</div>
                }
                <button className="btn btn-primary btn-sm" onClick={openModal}><Plus size={14} /> Nueva visita</button>
              </div>
            </div>
            {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}
            {loading
              ? <div style={{ color: 'var(--smoke)', textAlign: 'center', padding: 40 }}>Cargando…</div>
              : visits.length === 0
                ? <div style={{ textAlign: 'center', padding: 50, color: 'var(--smoke)', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}><ClipboardList size={32} style={{ opacity: 0.3, marginBottom: 10 }} /><p>Sin visitas registradas.</p></div>
                : visits.map((v, i) => <VisitCard key={v.id} visit={v} idx={i} />)
            }
          </>
        }
      </div>

      {/* Modal nueva visita */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Planilla de Visita</h3>
                <p style={{ fontSize: '0.82rem', marginTop: 4 }}>{selected?.student_name} · {selected?.company_name}</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--smoke)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Fecha de visita</label>
              <input type="date" value={form.visit_date || ''} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)', width: '100%' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>8 Aspectos de Observación — DGE Res. 1850/2022</div>
            {ASPECTS.map(a => (
              <AspectRow key={a.key} label={a.label} desc={a.desc} value={form[a.key]} onChange={v => setForm(f => ({ ...f, [a.key]: v }))} />
            ))}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Observaciones generales</label>
              <textarea value={form.observations || ''} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={3} placeholder="Describí el desempeño, actitudes destacadas o aspectos a mejorar…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.88rem' }} />
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(27,186,170,0.08)', borderRadius: 10, border: '1px solid rgba(27,186,170,0.2)', fontSize: '0.8rem', color: 'var(--teal)' }}>
              Al guardar, esta visita quedará registrada en el <strong>GEM</strong> con firma docente y timestamp automático.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={saveVisit} disabled={saving}>{saving ? 'Guardando…' : '✓ Guardar y registrar GEM'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TAB: RÚBRICA ─────────────────────────────────────────────────────────────

function RubricTab({ pasantias }) {
  const [selected, setSelected] = useState(null)
  const [visitCount, setVisitCount] = useState(0)
  const [existingGrade, setExistingGrade] = useState(null)
  const [form, setForm] = useState({ crit_asistencia: 0, crit_presentacion: 0, crit_conocimientos: 0, crit_informe: 0, teacher_comments: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  async function selectPasantia(p) {
    setSelected(p); setMsg('')
    try {
      const [gradeRes, visitRes] = await Promise.all([
        fetch(`/api/grades?pasantia_id=${p.id}`, { headers: authHeader() }).then(r => r.json()),
        fetch(`/api/teachers/visits?pasantia_id=${p.id}`, { headers: authHeader() }).then(r => r.json()),
      ])
      setVisitCount(visitRes.visits?.length || 0)
      if (gradeRes && gradeRes.crit_asistencia) {
        setExistingGrade(gradeRes)
        setForm({ crit_asistencia: gradeRes.crit_asistencia, crit_presentacion: gradeRes.crit_presentacion, crit_conocimientos: gradeRes.crit_conocimientos, crit_informe: gradeRes.crit_informe, teacher_comments: gradeRes.teacher_comments || '' })
      } else {
        setExistingGrade(null)
        setForm({ crit_asistencia: 0, crit_presentacion: 0, crit_conocimientos: 0, crit_informe: 0, teacher_comments: '' })
      }
    } catch { setVisitCount(p.visit_count || 0) }
  }

  async function saveGrade() {
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/grades', { method: 'POST', headers: authHeader(), body: JSON.stringify({ pasantia_id: selected.id, ...form }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg(`Calificación guardada ✓ — Nota final: ${data.final_grade}`)
      setExistingGrade({ ...form, total_score: data.total_score, final_grade: data.final_grade })
    } catch (e) { setMsg(e.message) }
    finally { setSaving(false) }
  }

  const total = (form.crit_asistencia || 0) + (form.crit_presentacion || 0) + (form.crit_conocimientos || 0) + (form.crit_informe || 0)
  const allFilled = form.crit_asistencia > 0 && form.crit_presentacion > 0 && form.crit_conocimientos > 0 && form.crit_informe > 0
  const gradeInfo = total > 0 ? scoreToGrade(total) : null
  const canGrade = visitCount >= 2

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
      {/* Lista alumnos */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Seleccioná un alumno</div>
        {pasantias.map(p => (
          <div key={p.id} onClick={() => selectPasantia(p)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, border: selected?.id === p.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.07)', background: selected?.id === p.id ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cream)', marginBottom: 3 }}>{p.student_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginBottom: 6 }}>{p.company_name || 'Sin empresa'}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, background: (p.visit_count || 0) >= 2 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: (p.visit_count || 0) >= 2 ? '#4ade80' : '#f87171' }}>
                {(p.visit_count || 0) >= 2 ? '✓' : '✗'} {p.visit_count || 0} visitas
              </span>
              {p.final_grade && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(27,186,170,0.15)', color: 'var(--teal)' }}>Nota: {p.final_grade}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Panel rúbrica */}
      <div>
        {!selected
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--smoke)' }}><Star size={40} style={{ opacity: 0.3, marginBottom: 12 }} /><p>Seleccioná un alumno para calificar.</p></div>
          : <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{selected.student_name}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>{selected.company_name}</span>
              </div>
              {existingGrade && <span className="badge badge-teal">Calificación guardada</span>}
            </div>

            {!canGrade && (
              <div style={{ padding: '14px 18px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Lock size={16} color="#f87171" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#f87171', fontWeight: 500 }}>Calificación bloqueada</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 2 }}>Se requieren al menos 2 visitas. Hay {visitCount} — faltan {2 - visitCount}.</div>
                </div>
              </div>
            )}

            {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}

            <div style={{ opacity: canGrade ? 1 : 0.4, pointerEvents: canGrade ? 'auto' : 'none' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Rúbrica de evaluación final — 4 criterios (máx. 12 puntos)</div>
              {RUBRIC_CRITERIA.map(c => (
                <RubricRow key={c.key} label={c.label} desc={c.desc} value={form[c.key]} onChange={v => setForm(f => ({ ...f, [c.key]: v }))} />
              ))}

              {allFilled && gradeInfo && (
                <div style={{ padding: '16px 20px', background: `${gradeInfo.color}14`, border: `1px solid ${gradeInfo.color}44`, borderRadius: 12, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--smoke)', marginBottom: 4 }}>Puntaje total: {total}/12</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--smoke)' }}>Escala DGE: 12pts→10 · 8pts→7 · 4pts→3</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.8rem', fontWeight: 700, color: gradeInfo.color, lineHeight: 1 }}>{gradeInfo.nota}</div>
                    <div style={{ fontSize: '0.8rem', color: gradeInfo.color, marginTop: 4 }}>{gradeInfo.label}</div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Comentarios del docente (opcional)</label>
                <textarea value={form.teacher_comments} onChange={e => setForm(f => ({ ...f, teacher_comments: e.target.value }))} rows={3} placeholder="Reflexiones finales sobre el desempeño del alumno…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.88rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-gold btn-sm" onClick={saveGrade} disabled={saving || !allFilled}>
                  {saving ? 'Guardando…' : existingGrade ? '↻ Actualizar calificación' : '✓ Guardar calificación'}
                </button>
              </div>
            </div>
          </>
        }
      </div>
    </div>
  )
}

// ─── TAB: GEM ─────────────────────────────────────────────────────────────────

function GemTab({ pasantias }) {
  const withVisits = pasantias.filter(p => (p.visit_count || 0) > 0)
  const gemOk = pasantias.filter(p => (p.visit_count || 0) >= 2)
  const pending = pasantias.filter(p => (p.visit_count || 0) === 0)
  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Visitas en GEM', val: pasantias.reduce((s, p) => s + (p.visit_count || 0), 0), color: 'var(--teal)' },
          { label: 'Con 2+ visitas (OK)', val: gemOk.length, color: '#4ade80' },
          { label: 'Sin visitas registradas', val: pending.length, color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Registro de asistencia docente para GEM</div>
      {pasantias.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{p.student_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>{p.company_name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{p.visit_count || 0} visitas registradas</span>
            {(p.visit_count || 0) >= 2
              ? <span className="badge badge-teal">GEM OK ✓</span>
              : <span className="badge badge-wine">Incompleto</span>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── TAB: ALUMNOS ─────────────────────────────────────────────────────────────

function StudentsTab({ students, teacher, onValidate }) {
  const [search, setSearch] = useState('')
  const filtered = students.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.orientation?.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…" style={{ width: '100%', paddingLeft: 36, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px 9px 36px', color: 'var(--cream)', fontSize: '0.88rem' }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Alumno/a', 'Orientación', 'Proyectos', 'Habilidades validadas', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', color: 'var(--cream)', fontWeight: 500 }}>{s.full_name}</td>
                <td style={{ padding: '12px 14px', color: 'var(--smoke)' }}>{s.orientation || '—'}</td>
                <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{s.portfolio_count || 0}</td>
                <td style={{ padding: '12px 14px' }}>
                  {s.validations?.length > 0
                    ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {s.validations.slice(0, 3).map(v => <span key={v.id} className="badge badge-teal" style={{ fontSize: '0.7rem' }}>{v.skill}</span>)}
                        {s.validations.length > 3 && <span className="badge badge-smoke" style={{ fontSize: '0.7rem' }}>+{s.validations.length - 3}</span>}
                      </div>
                    : <span style={{ color: 'var(--smoke)', fontSize: '0.78rem' }}>Sin validaciones</span>
                  }
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => onValidate(s)} style={{ fontSize: '0.78rem', padding: '6px 14px' }}>+ Validar habilidad</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const [tab, setTab] = useState('inicio')
  const [students, setStudents] = useState([])
  const [pasantias, setPasantias] = useState([])
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const profile = getProfile()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetch('/api/teachers/validations', { headers: authHeader() }).then(r => r.json())
      setStudents(data.students || []); setTeacher(data.teacher || null)
    } catch { setStudents([]) }
    try {
      const data = await fetch('/api/teachers/visits', { headers: authHeader() }).then(r => r.json())
      const map = {}
      ;(data.visits || []).forEach(v => {
        if (!map[v.pasantia_id]) map[v.pasantia_id] = { id: v.pasantia_id, student_name: v.student_name, company_name: v.company_name, visits: [], visit_count: 0 }
        map[v.pasantia_id].visits.push(v)
        map[v.pasantia_id].visit_count = map[v.pasantia_id].visits.length
      })
      setPasantias(Object.values(map))
    } catch { setPasantias([]) }
    setLoading(false)
  }

  async function validateSkill() {
    try {
      const res = await fetch('/api/teachers/validations', { method: 'POST', headers: authHeader(), body: JSON.stringify({ student_id: selected.id, skill: form.skill, note: form.note }) })
      if (!res.ok) throw new Error('Error al validar')
      setMsg(`Habilidad "${form.skill}" validada para ${selected.full_name}`)
      setModal(null); setForm({}); loadData()
    } catch (e) { setMsg(e.message) }
  }

  const alertPasantias = pasantias.filter(p => (p.visit_count || 0) < 2)
  const readyToGrade   = pasantias.filter(p => (p.visit_count || 0) >= 2)
  const totalVisits    = pasantias.reduce((s, p) => s + (p.visit_count || 0), 0)

  const navItems = [
    { id: 'inicio',  label: 'Panel general',    icon: <LayoutDashboard size={16} /> },
    { id: 'visitas', label: 'Registrar visitas', icon: <ClipboardList size={16} />, count: alertPasantias.length },
    { id: 'rubrica', label: 'Evaluar (rúbrica)', icon: <Star size={16} />, count: readyToGrade.length },
    { id: 'gem',     label: 'Registro GEM',      icon: <FileText size={16} /> },
    { id: 'alumnos', label: 'Mis alumnos',       icon: <Users size={16} />, count: students.length },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--teal)" />
      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}

        {tab === 'inicio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Bienvenido/a, {profile?.full_name?.split(' ').slice(-1)[0] || 'Docente'}</h2>
              <p>{profile?.school} · {profile?.subject}</p>
            </div>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { val: pasantias.length, label: 'Alumnos en pasantía', color: 'var(--teal)' },
                { val: totalVisits,      label: 'Visitas registradas',  color: 'var(--gold)' },
                { val: readyToGrade.length, label: 'Listos para calificar', color: '#4ade80' },
                { val: alertPasantias.length, label: 'Visitas pendientes', color: '#f87171' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {alertPasantias.length > 0 && (
              <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 600, marginBottom: 10 }}>
                  <AlertTriangle size={16} /> Alumnos con visitas insuficientes (mínimo 2)
                </div>
                {alertPasantias.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.05)', borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{p.student_name}</span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>{p.visit_count || 0}/2 visitas</span>
                      <button className="btn btn-primary btn-sm" onClick={() => setTab('visitas')} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>Registrar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Estado general</h3>
            {pasantias.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{p.student_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>{p.company_name || 'Sin empresa'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{p.visit_count || 0} visitas</span>
                  {(p.visit_count || 0) >= 2
                    ? p.final_grade
                      ? <span className="badge badge-teal">Nota: {p.final_grade}</span>
                      : <button className="btn btn-gold btn-sm" onClick={() => setTab('rubrica')} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>Calificar</button>
                    : <span className="badge badge-wine">Bloqueado</span>
                  }
                </div>
              </div>
            ))}
            {pasantias.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 50, color: 'var(--smoke)' }}>No tenés alumnos en pasantía activa.</div>}
          </div>
        )}

        {tab === 'visitas' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Registro de Visitas</h2>
              <p>Planilla de observación · Mínimo 2 visitas obligatorias por alumno (Res. 1850/2022)</p>
            </div>
            <VisitsTab pasantias={pasantias} />
          </div>
        )}

        {tab === 'rubrica' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Evaluación Final por Rúbrica</h2>
              <p>4 criterios · Máximo 12 puntos · Escala: 12→10 · 8→7 · 4→3</p>
            </div>
            <RubricTab pasantias={pasantias} />
          </div>
        )}

        {tab === 'gem' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Registro de Asistencia Docente — GEM</h2>
              <p>Cada visita registrada genera un log de asistencia docente automáticamente.</p>
            </div>
            <GemTab pasantias={pasantias} />
          </div>
        )}

        {tab === 'alumnos' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Mis Alumnos</h2>
              <p>{teacher?.school} · {students.length} alumnos registrados</p>
            </div>
            <StudentsTab students={students} teacher={teacher} onValidate={s => { setSelected(s); setModal('validate') }} />
          </div>
        )}
      </main>

      {modal === 'validate' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Validar habilidad</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--smoke)' }}><X size={20} /></button>
            </div>
            <p style={{ marginBottom: 16, fontSize: '0.9rem' }}>Alumno/a: <strong style={{ color: 'var(--cream)' }}>{selected?.full_name}</strong></p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Habilidad a validar</label>
              <select value={form.skill || ''} onChange={e => setForm(f => ({ ...f, skill: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem' }}>
                <option value="">Seleccioná una habilidad…</option>
                {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Nota / observación (opcional)</label>
              <textarea value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.88rem', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-teal btn-sm" onClick={validateSkill} disabled={!form.skill}><Check size={15} /> Validar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
