// src/components/PasantiasModules.jsx
// Módulos nuevos para el Sistema Integral de Pasantías v3
// Incluye: Convenios, Autorización Familiar, Evaluación Empresa,
//          Lista Cotejo, Autoevaluación, Informe Guiado, Calendario,
//          Notas Oficiales, Setup Wizard

import { useState, useEffect } from 'react'
import {
  FileText, CheckCircle, AlertTriangle, X, Plus, Clock,
  Download, ChevronDown, ChevronUp, Lock, Calendar,
  Building2, Users, Star, Shield, Send, Printer,
  BookOpen, ClipboardList, Briefcase, Check,
} from 'lucide-react'

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('vm_token')}`, 'Content-Type': 'application/json' }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ═══════════════════════════════════════════════════════
// 1. MÓDULO DE CONVENIOS Y ACTAS
// ═══════════════════════════════════════════════════════

const AGREEMENT_TYPES = {
  marco: { label: 'Acuerdo Marco de Cooperación', icon: '📜', color: '#60a5fa', desc: 'Convenio institucional entre escuela y organización' },
  convenio_empresa: { label: 'Convenio de Pasantías', icon: '🤝', color: 'var(--gold)', desc: 'Marco legal general con la empresa' },
  acta_individual: { label: 'Acta Acuerdo Individual', icon: '📋', color: 'var(--teal)', desc: 'Acuerdo por cada alumno pasante' },
}

const AGREEMENT_STATUS = {
  borrador: { label: 'Borrador', color: '#6b7280' },
  pendiente_firma: { label: 'Pendiente de firma', color: '#fbbf24' },
  firmado: { label: 'Firmado', color: '#60a5fa' },
  vigente: { label: 'Vigente', color: '#4ade80' },
  vencido: { label: 'Vencido', color: '#f87171' },
  rescindido: { label: 'Rescindido', color: '#ef4444' },
}

const ACTA_CLAUSES = [
  'El presente convenio se enmarca en el CONVENIO GENERAL DE PASANTÍAS suscripto entre las partes.',
  'LA PASANTÍA tendrá una duración de 10 (diez) días hábiles.',
  'LA UNIDAD EDUCATIVA y LA ORGANIZACIÓN manifiestan que se encuentran cubiertas por los seguros establecidos.',
  'Las partes declaran conocer y aceptar el PLAN DE PASANTÍA adjunto.',
  'EL PASANTE se compromete a cumplir con las directivas laborales, técnicas y de seguridad.',
  'Las partes convienen que EL PASANTE y LA UNIDAD EDUCATIVA se liberan de responsabilidad por deterioro en condiciones normales.',
  'EL PASANTE deberá considerar información confidencial toda la que reciba con motivo de la pasantía.',
  'El incumplimiento por parte del PASANTE será considerado falta grave.',
  'Cualquiera de las partes podrá rescindir el presente convenio comunicando los motivos.',
  'Este convenio no generará ninguna relación laboral entre EL PASANTE y LA ORGANIZACIÓN.',
  'LA ORGANIZACIÓN podrá otorgar al PASANTE los mismos beneficios regulares que acuerda a su personal.',
  'La coordinación, seguimiento y evaluación estarán a cargo del TUTOR y el INSTRUCTOR designados.',
  'El TUTOR y el INSTRUCTOR elaborarán informes de seguimiento incorporados al legajo del estudiante.',
  'EL PASANTE manifiesta conocer y aceptar la normativa aplicable.',
]

export function AgreementsTab({ companies = [], students = [], teachers = [] }) {
  const [agreements, setAgreements] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { loadAgreements() }, [])

  async function loadAgreements() {
    try {
      const res = await fetch('/api/agreements', { headers: authHeader() })
      const data = await res.json()
      setAgreements(data.agreements || [])
    } catch { setAgreements([]) }
  }

  async function saveAgreement() {
    try {
      const res = await fetch('/api/agreements', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Convenio creado correctamente ✓')
      setModal(null); setForm({}); loadAgreements()
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  async function updateStatus(id, status) {
    try {
      await fetch('/api/agreements', {
        method: 'PUT', headers: authHeader(),
        body: JSON.stringify({ id, status, [`sig_${status === 'firmado' ? 'director' : 'company'}`]: 'Firmado digitalmente', [`sig_${status === 'firmado' ? 'director' : 'company'}_at`]: new Date().toISOString() })
      })
      loadAgreements()
      setMsg('Estado actualizado ✓')
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  const filtered = filter === 'all' ? agreements : agreements.filter(a => a.type === filter)

  const stats = {
    total: agreements.length,
    vigentes: agreements.filter(a => a.status === 'vigente').length,
    pendientes: agreements.filter(a => a.status === 'pendiente_firma').length,
    borradores: agreements.filter(a => a.status === 'borrador').length,
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { val: stats.total, label: 'Total convenios', color: 'var(--gold)' },
          { val: stats.vigentes, label: 'Vigentes', color: '#4ade80' },
          { val: stats.pendientes, label: 'Pendientes firma', color: '#fbbf24' },
          { val: stats.borradores, label: 'Borradores', color: '#6b7280' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'marco', 'convenio_empresa', 'acta_individual'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: filter === f ? 'var(--wine)' : 'rgba(255,255,255,0.06)', color: filter === f ? 'white' : 'var(--smoke)' }}>
            {f === 'all' ? 'Todos' : AGREEMENT_TYPES[f].label}
          </button>
        ))}
        <button className="btn btn-teal btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setForm({ type: 'acta_individual', clauses: ACTA_CLAUSES }); setModal('new') }}>
          <Plus size={14} /> Nuevo convenio
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <FileText size={36} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p style={{ color: 'var(--smoke)' }}>No hay convenios registrados. Creá uno para comenzar.</p>
        </div>
      ) : filtered.map(a => {
        const t = AGREEMENT_TYPES[a.type] || {}
        const s = AGREEMENT_STATUS[a.status] || {}
        const isOpen = expanded === a.id
        return (
          <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(isOpen ? null : a.id)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cream)' }}>{a.title || t.label}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--smoke)', marginTop: 2 }}>
                  {a.company_name && `${a.company_name} · `}{a.student_name && `${a.student_name} · `}{fmtDate(a.created_at)}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: s.color + '22', color: s.color, border: `1px solid ${s.color}44` }}>{s.label}</span>
              {isOpen ? <ChevronUp size={16} color="var(--smoke)" /> : <ChevronDown size={16} color="var(--smoke)" />}
            </div>
            {isOpen && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14, fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--smoke)' }}>Inicio:</span> <span style={{ color: 'var(--cream)' }}>{fmtDate(a.start_date)}</span></div>
                  <div><span style={{ color: 'var(--smoke)' }}>Fin:</span> <span style={{ color: 'var(--cream)' }}>{fmtDate(a.end_date)}</span></div>
                  <div><span style={{ color: 'var(--smoke)' }}>Horario:</span> <span style={{ color: 'var(--cream)' }}>{a.schedule_hours || '—'}</span></div>
                  <div><span style={{ color: 'var(--smoke)' }}>Instructor:</span> <span style={{ color: 'var(--cream)' }}>{a.instructor_name || '—'}</span></div>
                </div>
                {/* Firmas */}
                <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--smoke)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Firmas</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['director', 'company', 'student', 'parent', 'teacher'].map(role => (
                      <span key={role} style={{ padding: '4px 10px', borderRadius: 8, background: a[`sig_${role}`] ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a[`sig_${role}`] ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`, color: a[`sig_${role}`] ? '#4ade80' : 'var(--smoke)' }}>
                        {a[`sig_${role}`] ? '✓' : '○'} {role === 'director' ? 'Directora' : role === 'company' ? 'Empresa' : role === 'student' ? 'Alumno/a' : role === 'parent' ? 'Padre/Madre' : 'Docente'}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {a.status === 'borrador' && <button className="btn btn-gold btn-sm" onClick={() => updateStatus(a.id, 'pendiente_firma')}>Enviar a firma</button>}
                  {a.status === 'pendiente_firma' && <button className="btn btn-teal btn-sm" onClick={() => updateStatus(a.id, 'firmado')}>Marcar como firmado</button>}
                  {a.status === 'firmado' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(a.id, 'vigente')}>Activar convenio</button>}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal nuevo convenio */}
      {modal === 'new' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Nuevo Convenio / Acta</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--smoke)' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 6 }}>Tipo de convenio</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(AGREEMENT_TYPES).map(([key, t]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', border: form.type === key ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.1)', background: form.type === key ? t.color + '15' : 'transparent', color: form.type === key ? t.color : 'var(--smoke)', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{t.icon}</div>
                    {t.label.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {form.type === 'acta_individual' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Alumno/a</label>
                    <select value={form.student_id || ''} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }}>
                      <option value="">Seleccionar…</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Empresa</label>
                    <select value={form.company_id || ''} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }}>
                      <option value="">Seleccionar…</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Docente tutor</label>
                    <select value={form.teacher_id || ''} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }}>
                      <option value="">Seleccionar…</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Instructor (empresa)</label>
                    <input value={form.instructor_name || ''} onChange={e => setForm(f => ({ ...f, instructor_name: e.target.value }))} placeholder="Nombre del instructor" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </>
            )}

            {(form.type === 'marco' || form.type === 'convenio_empresa') && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Empresa / Organización</label>
                <select value={form.company_id || ''} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }}>
                  <option value="">Seleccionar…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Fecha inicio</label>
                <input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Fecha fin</label>
                <input type="date" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Horario de pasantía</label>
              <input value={form.schedule_hours || ''} onChange={e => setForm(f => ({ ...f, schedule_hours: e.target.value }))} placeholder="ej: 08:00 a 12:00" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
            </div>

            {form.type === 'acta_individual' && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(27,186,170,0.06)', border: '1px solid rgba(27,186,170,0.2)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--teal)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cláusulas del Acta (Decreto 1374/11)
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--smoke)', maxHeight: 150, overflowY: 'auto' }}>
                  {ACTA_CLAUSES.map((c, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: 'var(--teal)', fontWeight: 700, marginRight: 6 }}>{i + 1}.</span> {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-teal btn-sm" onClick={saveAgreement}>✓ Crear convenio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 2. AUTORIZACIÓN FAMILIAR DIGITAL
// ═══════════════════════════════════════════════════════

const LEGAL_TEXT = 'AUTORIZO a mi hijo/a o estudiante bajo mi responsabilidad a participar en el Proyecto de Pasantías Educativas, en el marco de lo dispuesto por la Ley Nacional de Educación N° 26.206, la Ley Provincial de Educación, la Resolución N° 558/2019 y normativa complementaria vigente. La presente autorización alcanza a la realización de las pasantías en los lugares consignados en los contratos suscriptos por la escuela con las instituciones y empresas que forman parte del proyecto, comprendiendo que la experiencia tiene fines exclusivamente educativos y no implica relación laboral alguna.'

export function AuthorizationForm({ pasantia, profile, onSave }) {
  const [form, setForm] = useState({})
  const [existing, setExisting] = useState(null)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAuth() }, [])

  async function loadAuth() {
    try {
      const res = await fetch('/api/students/authorization?_resource=authorization', { headers: authHeader() })
      const data = await res.json()
      if (data && data.id) { setExisting(data); setForm(data) }
    } catch { }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/students/authorization?_resource=authorization', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExisting(data)
      setMsg('Autorización guardada ✓')
      if (onSave) onSave(data)
    } catch (e) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  const isComplete = form.parent_name && form.parent_dni && form.parent_phone && form.authorized && form.legal_text_accepted
  const isValidated = existing?.status === 'validada'

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: `1px solid ${isValidated ? 'rgba(74,222,128,0.3)' : existing?.status === 'completada' ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.08)'}`, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Shield size={20} color={isValidated ? '#4ade80' : 'var(--gold)'} />
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cream)' }}>Autorización Familiar para Pasantías 2025</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>Ley 26.206 · Res. 558/2019</div>
        </div>
        {isValidated && <span className="badge badge-teal" style={{ marginLeft: 'auto' }}>✓ Validada por admin</span>}
        {existing?.status === 'completada' && !isValidated && <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>Pendiente validación</span>}
      </div>

      {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }} onClick={() => setMsg('')}>{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Datos alumno (autocompletados) */}
        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Datos del/la estudiante</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--smoke)' }}>Nombre:</span> <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{profile?.full_name || '—'}</span></div>
            <div><span style={{ color: 'var(--smoke)' }}>Curso:</span> <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{profile?.grade || '—'}</span></div>
          </div>
        </div>

        {/* Datos responsable */}
        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos del responsable</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Nombre completo *</label>
            <input value={form.parent_name || ''} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} placeholder="Apellido y Nombre" disabled={isValidated} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>DNI *</label>
            <input value={form.parent_dni || ''} onChange={e => setForm(f => ({ ...f, parent_dni: e.target.value }))} placeholder="12345678" disabled={isValidated} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Parentesco</label>
            <select value={form.parent_relationship || 'madre/padre'} onChange={e => setForm(f => ({ ...f, parent_relationship: e.target.value }))} disabled={isValidated} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }}>
              <option value="madre/padre">Madre / Padre</option>
              <option value="tutor">Tutor legal</option>
              <option value="otro">Otro responsable</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Teléfono de contacto *</label>
            <input value={form.parent_phone || ''} onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))} placeholder="261-1234567" disabled={isValidated} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
          </div>
        </div>

        {/* Texto legal */}
        <div style={{ padding: '14px 16px', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--smoke)', lineHeight: 1.6 }}>
          {LEGAL_TEXT}
        </div>

        {!isValidated && (
          <>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--cream)' }}>
              <input type="checkbox" checked={!!form.legal_text_accepted} onChange={e => setForm(f => ({ ...f, legal_text_accepted: e.target.checked }))} style={{ marginTop: 3 }} />
              <span>Declaro haber leído y acepto las condiciones establecidas en el texto legal precedente.</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--cream)' }}>
              <input type="checkbox" checked={!!form.authorized} onChange={e => setForm(f => ({ ...f, authorized: e.target.checked }))} style={{ marginTop: 3 }} />
              <span><strong>AUTORIZO</strong> la participación de mi hijo/a en el Proyecto de Pasantías Educativas 2025.</span>
            </label>

            <button className="btn btn-primary" onClick={save} disabled={saving || !isComplete} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Guardando…' : existing ? '↻ Actualizar autorización' : '✓ Enviar autorización'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 4. EVALUACIÓN EMPRESARIAL DEL PASANTE
// ═══════════════════════════════════════════════════════

const COMPANY_EVAL_CRITERIA = [
  { key: 'crit_puntualidad', label: 'Puntualidad', desc: 'Llegada en tiempo y forma' },
  { key: 'crit_presentacion', label: 'Presentación personal', desc: 'Vestimenta e higiene adecuadas' },
  { key: 'crit_responsabilidad', label: 'Responsabilidad', desc: 'Cumplimiento de tareas' },
  { key: 'crit_actitud', label: 'Actitud y predisposición', desc: 'Motivación y buena disposición' },
  { key: 'crit_comunicacion', label: 'Comunicación', desc: 'Expresión verbal y escucha' },
  { key: 'crit_trabajo_equipo', label: 'Trabajo en equipo', desc: 'Integración con compañeros' },
  { key: 'crit_iniciativa', label: 'Iniciativa', desc: 'Proactividad y propuestas' },
  { key: 'crit_aprendizaje', label: 'Capacidad de aprendizaje', desc: 'Incorporación de nuevos saberes' },
  { key: 'crit_normas', label: 'Respeto a normas', desc: 'Cumplimiento del reglamento interno' },
  { key: 'crit_calidad_trabajo', label: 'Calidad del trabajo', desc: 'Resultado de las tareas realizadas' },
]

const EVAL_LEVELS = [
  { val: 1, label: 'Insuficiente', color: '#ef4444' },
  { val: 2, label: 'Regular', color: '#f87171' },
  { val: 3, label: 'Bueno', color: '#fbbf24' },
  { val: 4, label: 'Muy bueno', color: '#60a5fa' },
  { val: 5, label: 'Excelente', color: '#4ade80' },
]

export function CompanyEvaluationForm({ students = [], companyId }) {
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [evaluations, setEvaluations] = useState([])

  useEffect(() => { loadEvaluations() }, [])

  async function loadEvaluations() {
    try {
      const res = await fetch('/api/company/evaluations', { headers: authHeader() })
      const data = await res.json()
      setEvaluations(data.evaluations || [])
    } catch { }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/company/evaluations', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ ...form, student_id: selected.id || selected.student_id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Evaluación guardada ✓')
      setSelected(null); setForm({}); loadEvaluations()
    } catch (e) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  const allFilled = COMPANY_EVAL_CRITERIA.every(c => form[c.key] > 0)
  const total = COMPANY_EVAL_CRITERIA.reduce((sum, c) => sum + (form[c.key] || 0), 0)
  const avg = allFilled ? (total / COMPANY_EVAL_CRITERIA.length).toFixed(1) : null

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Evaluación del desempeño de pasantes</div>

      {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }} onClick={() => setMsg('')}>{msg}</div>}

      {!selected ? (
        <div>
          <p style={{ fontSize: '0.88rem', marginBottom: 16, color: 'var(--smoke)' }}>Seleccioná un/a pasante para evaluar su desempeño.</p>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--smoke)' }}>No hay pasantes asignados a tu empresa.</div>
          ) : students.map(s => {
            const evExists = evaluations.find(e => e.student_id === (s.id || s.student_id))
            return (
              <div key={s.id || s.student_id} onClick={() => !evExists && setSelected(s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8, cursor: evExists ? 'default' : 'pointer' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{s.full_name || s.student_name || s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>{s.grade || ''}</div>
                </div>
                {evExists
                  ? <span className="badge badge-teal">✓ Evaluado ({evExists.avg || '—'})</span>
                  : <button className="btn btn-gold btn-sm">Evaluar</button>}
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{selected.full_name || selected.student_name || selected.name}</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>Evaluación de desempeño · {COMPANY_EVAL_CRITERIA.length} criterios</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => { setSelected(null); setForm({}) }}>← Volver</button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Su nombre (evaluador/a)</label>
            <input value={form.evaluator_name || ''} onChange={e => setForm(f => ({ ...f, evaluator_name: e.target.value }))} placeholder="Nombre del evaluador/a" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
          </div>

          {COMPANY_EVAL_CRITERIA.map(c => (
            <div key={c.key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500 }}>{c.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--smoke)' }}>{c.desc}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {EVAL_LEVELS.map(lv => (
                  <button key={lv.val} onClick={() => setForm(f => ({ ...f, [c.key]: lv.val }))} style={{ flex: 1, padding: '7px 2px', borderRadius: 8, cursor: 'pointer', border: form[c.key] === lv.val ? `2px solid ${lv.color}` : '1px solid rgba(255,255,255,0.1)', background: form[c.key] === lv.val ? lv.color + '20' : 'transparent', color: form[c.key] === lv.val ? lv.color : 'var(--smoke)', fontSize: '0.72rem', fontWeight: 600, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{lv.val}</div>
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {allFilled && avg && (
            <div style={{ padding: '14px 18px', background: 'rgba(27,186,170,0.08)', border: '1px solid rgba(27,186,170,0.3)', borderRadius: 12, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--smoke)' }}>Promedio general:</span>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--teal)' }}>{avg}</span>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Fortalezas observadas</label>
            <textarea value={form.fortalezas || ''} onChange={e => setForm(f => ({ ...f, fortalezas: e.target.value }))} rows={2} placeholder="¿Qué aspectos positivos destacaría del pasante?" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.85rem' }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Áreas de mejora</label>
            <textarea value={form.areas_mejora || ''} onChange={e => setForm(f => ({ ...f, areas_mejora: e.target.value }))} rows={2} placeholder="¿Qué aspectos debería mejorar?" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.85rem' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--cream)', marginTop: 14 }}>
            <input type="checkbox" checked={!!form.recomendaria} onChange={e => setForm(f => ({ ...f, recomendaria: e.target.checked }))} />
            ¿Recomendaría recibir pasantes nuevamente?
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button className="btn btn-teal" onClick={save} disabled={saving || !allFilled}>
              {saving ? 'Guardando…' : '✓ Enviar evaluación'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 5. LISTA DE COTEJO DEL DOCENTE
// ═══════════════════════════════════════════════════════

const CHECKLIST_INDICATORS = [
  { key: 'ind_asiste_regularmente', label: 'Asiste regularmente' },
  { key: 'ind_cumple_horario', label: 'Cumple el horario establecido' },
  { key: 'ind_vestimenta_adecuada', label: 'Vestimenta adecuada al ámbito' },
  { key: 'ind_respeta_normas', label: 'Respeta las normas internas' },
  { key: 'ind_muestra_interes', label: 'Muestra interés y motivación' },
  { key: 'ind_cumple_tareas', label: 'Cumple las tareas asignadas' },
  { key: 'ind_se_integra_equipo', label: 'Se integra al equipo de trabajo' },
  { key: 'ind_comunicacion_adecuada', label: 'Comunicación adecuada' },
  { key: 'ind_aplica_saberes', label: 'Aplica saberes escolares' },
  { key: 'ind_autonomia', label: 'Muestra autonomía progresiva' },
]

const COTEJO_OPTIONS = [
  { val: 'S', label: 'Sí', color: '#4ade80' },
  { val: 'P', label: 'Parcial', color: '#fbbf24' },
  { val: 'N', label: 'No', color: '#f87171' },
]

export function TeacherChecklistTab({ pasantias }) {
  const [selected, setSelected] = useState(null)
  const [checklists, setChecklists] = useState([])
  const [form, setForm] = useState({ week_number: 1 })
  const [modal, setModal] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadChecklists(pasantiaId) {
    try {
      const res = await fetch(`/api/teachers/checklist?pasantia_id=${pasantiaId}`, { headers: authHeader() })
      const data = await res.json()
      setChecklists(data.checklists || [])
    } catch { setChecklists([]) }
  }

  function selectPasantia(p) { setSelected(p); loadChecklists(p.id) }

  function openModal() {
    const nextWeek = checklists.length + 1
    const init = { week_number: nextWeek, week_start: new Date().toISOString().slice(0, 10), observations: '' }
    CHECKLIST_INDICATORS.forEach(i => { init[i.key] = '' })
    setForm(init); setModal(true)
  }

  async function saveChecklist() {
    setSaving(true)
    try {
      const res = await fetch('/api/teachers/checklist', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ pasantia_id: selected.id, ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Grilla de seguimiento guardada ✓')
      setModal(false); loadChecklists(selected.id)
    } catch (e) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, minHeight: 400 }}>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Seleccioná un alumno</div>
        {pasantias.length === 0
          ? <div style={{ color: 'var(--smoke)', fontSize: '0.85rem', textAlign: 'center', padding: 30 }}>Sin alumnos activos.</div>
          : pasantias.map(p => (
            <div key={p.id} onClick={() => selectPasantia(p)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, border: selected?.id === p.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.07)', background: selected?.id === p.id ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cream)' }}>{p.student_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>{p.company_name || 'Sin empresa'}</div>
            </div>
          ))}
      </div>
      <div>
        {!selected
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--smoke)' }}><ClipboardList size={40} style={{ opacity: 0.3, marginBottom: 12 }} /><p>Seleccioná un alumno para ver la grilla.</p></div>
          : <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{selected.student_name}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>{selected.company_name} · {checklists.length} semana(s) registradas</span>
              </div>
              <button className="btn btn-gold btn-sm" onClick={openModal}><Plus size={14} /> Nueva semana</button>
            </div>

            {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }} onClick={() => setMsg('')}>{msg}</div>}

            {checklists.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--smoke)', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>Sin registros. Agregá la primera semana de seguimiento.</div>
              : <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 500, fontSize: '0.75rem' }}>Indicador</th>
                      {checklists.map(cl => (
                        <th key={cl.id} style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--gold)', fontWeight: 600, fontSize: '0.75rem' }}>Sem {cl.week_number}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHECKLIST_INDICATORS.map(ind => (
                      <tr key={ind.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--cream)' }}>{ind.label}</td>
                        {checklists.map(cl => {
                          const val = cl[ind.key]
                          const opt = COTEJO_OPTIONS.find(o => o.val === val)
                          return (
                            <td key={cl.id} style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {opt ? <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: opt.color + '20', color: opt.color }}>{opt.label}</span> : <span style={{ color: 'var(--smoke)' }}>—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </>
        }
      </div>

      {/* Modal nueva semana */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Grilla de Seguimiento — Semana {form.week_number}</h3>
                <p style={{ fontSize: '0.82rem', marginTop: 4, color: 'var(--smoke)' }}>{selected?.student_name} · {selected?.company_name}</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--smoke)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Fecha inicio de semana</label>
              <input type="date" value={form.week_start || ''} onChange={e => setForm(f => ({ ...f, week_start: e.target.value }))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)' }} />
            </div>

            {CHECKLIST_INDICATORS.map(ind => (
              <div key={ind.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--cream)', flex: 1 }}>{ind.label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COTEJO_OPTIONS.map(o => (
                    <button key={o.val} onClick={() => setForm(f => ({ ...f, [ind.key]: o.val }))} style={{ padding: '5px 14px', borderRadius: 8, cursor: 'pointer', border: form[ind.key] === o.val ? `2px solid ${o.color}` : '1px solid rgba(255,255,255,0.1)', background: form[ind.key] === o.val ? o.color + '20' : 'transparent', color: form[ind.key] === o.val ? o.color : 'var(--smoke)', fontWeight: 600, fontSize: '0.8rem' }}>{o.label}</button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Observaciones</label>
              <textarea value={form.observations || ''} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={3} placeholder="Observaciones de la semana…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.85rem' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-gold btn-sm" onClick={saveChecklist} disabled={saving}>{saving ? 'Guardando…' : '✓ Guardar semana'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 6. AUTOEVALUACIÓN DEL ALUMNO
// ═══════════════════════════════════════════════════════

const SELF_EVAL_CRITERIA = [
  { key: 'crit_puntualidad', label: 'Puntualidad', desc: '¿Llegué siempre a horario?' },
  { key: 'crit_responsabilidad', label: 'Responsabilidad', desc: '¿Cumplí con las tareas asignadas?' },
  { key: 'crit_actitud', label: 'Actitud', desc: '¿Tuve buena predisposición?' },
  { key: 'crit_relaciones', label: 'Relaciones interpersonales', desc: '¿Me integré con el equipo?' },
  { key: 'crit_aprendizaje', label: 'Aprendizaje', desc: '¿Incorporé nuevos saberes?' },
  { key: 'crit_comunicacion', label: 'Comunicación', desc: '¿Me expresé de forma clara?' },
  { key: 'crit_presentacion', label: 'Presentación personal', desc: '¿Mi vestimenta fue adecuada?' },
  { key: 'crit_normas', label: 'Normas', desc: '¿Respeté las reglas del lugar?' },
]

const SELF_LEVELS = [
  { val: 1, label: 'Regular', color: '#f87171', emoji: '😐' },
  { val: 2, label: 'Bueno', color: '#fbbf24', emoji: '🙂' },
  { val: 3, label: 'Muy bueno', color: '#4ade80', emoji: '😊' },
]

export function SelfEvaluationTab({ pasantiaId }) {
  const [form, setForm] = useState({})
  const [existing, setExisting] = useState(null)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSelfEval() }, [pasantiaId])

  async function loadSelfEval() {
    if (!pasantiaId) return
    try {
      const res = await fetch(`/api/students/self-evaluation?pasantia_id=${pasantiaId}`, { headers: authHeader() })
      const data = await res.json()
      if (data && data.id) { setExisting(data); setForm(data) }
    } catch { }
  }

  async function save(status = 'borrador') {
    setSaving(true)
    try {
      const res = await fetch('/api/students/self-evaluation', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ ...form, pasantia_id: pasantiaId, status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExisting(data)
      setMsg(status === 'enviada' ? 'Autoevaluación enviada al docente ✓' : 'Borrador guardado ✓')
    } catch (e) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  const allFilled = SELF_EVAL_CRITERIA.every(c => form[c.key] > 0)
  const allReflexion = form.que_aprendi?.trim() && form.que_mejoraria?.trim()
  const isSubmitted = existing?.status === 'enviada'

  return (
    <div>
      {!pasantiaId ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)' }}><Star size={36} style={{ opacity: 0.25, marginBottom: 12 }} /><p>No tenés pasantía activa para autoevaluar.</p></div>
      ) : (
        <>
          {isSubmitted && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}><CheckCircle size={14} /> Autoevaluación enviada al docente. No podés modificarla.</div>
          )}

          {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }} onClick={() => setMsg('')}>{msg}</div>}

          {/* Progress */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {SELF_EVAL_CRITERIA.map(c => <div key={c.key} style={{ width: 18, height: 5, borderRadius: 99, background: form[c.key] > 0 ? 'var(--teal)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />)}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>
              {SELF_EVAL_CRITERIA.filter(c => form[c.key] > 0).length} / {SELF_EVAL_CRITERIA.length}
            </span>
          </div>

          {/* Criteria */}
          <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>¿Cómo evaluarías tu desempeño?</div>

          {SELF_EVAL_CRITERIA.map(c => (
            <div key={c.key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{c.label}</span>
                <span style={{ fontSize: '0.76rem', color: 'var(--smoke)' }}>{c.desc}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SELF_LEVELS.map(lv => (
                  <button key={lv.val} onClick={() => !isSubmitted && setForm(f => ({ ...f, [c.key]: lv.val }))} disabled={isSubmitted} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: isSubmitted ? 'default' : 'pointer', border: form[c.key] === lv.val ? `2px solid ${lv.color}` : '1px solid rgba(255,255,255,0.1)', background: form[c.key] === lv.val ? lv.color + '20' : 'transparent', color: form[c.key] === lv.val ? lv.color : 'var(--smoke)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem' }}>{lv.emoji}</div>
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Reflexión */}
          <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 12px' }}>Reflexión personal</div>
          {[
            { key: 'que_aprendi', label: '¿Qué aprendí en esta experiencia?', ph: 'Mencioná lo más importante que te llevás…' },
            { key: 'que_mejoraria', label: '¿Qué mejoraría de mi desempeño?', ph: 'Si pudieras repetir la experiencia, ¿qué harías diferente?' },
            { key: 'lo_mejor', label: '¿Qué fue lo mejor de la pasantía?', ph: 'Contá lo que más disfrutaste…' },
            { key: 'lo_mas_dificil', label: '¿Qué fue lo más difícil?', ph: '¿Tuviste alguna situación complicada?' },
          ].map(q => (
            <div key={q.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cream)', display: 'block', marginBottom: 6 }}>{q.label}</label>
              <textarea value={form[q.key] || ''} onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))} rows={2} placeholder={q.ph} disabled={isSubmitted} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.85rem' }} />
            </div>
          ))}

          {!isSubmitted && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={() => save('borrador')} disabled={saving} className="btn btn-outline btn-sm">{saving ? 'Guardando…' : 'Guardar borrador'}</button>
              <button onClick={() => save('enviada')} disabled={saving || !allFilled || !allReflexion} className="btn btn-primary">
                <Send size={14} /> Enviar al docente
              </button>
              {(!allFilled || !allReflexion) && <span style={{ fontSize: '0.8rem', color: 'var(--smoke)', alignSelf: 'center' }}>Completá todos los criterios y reflexiones para enviar.</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 8. CALENDARIO DE TANDAS
// ═══════════════════════════════════════════════════════

export function CalendarTab({ settings }) {
  const calendar = settings?.calendar || [
    { course: '5° 1°', label: 'Tanda 1', from: '2025-08-04', to: '2025-08-15' },
    { course: '5° 2°', label: 'Tanda 1', from: '2025-08-18', to: '2025-08-29' },
    { course: '5° 3°', label: 'Tanda 1', from: '2025-09-01', to: '2025-09-12' },
  ]

  const today = new Date()
  const COLORS = ['#60a5fa', 'var(--gold)', 'var(--teal)', '#a78bfa', '#fb923c']

  function getStatus(from, to) {
    const f = new Date(from), t = new Date(to)
    if (today > t) return { label: 'Finalizada', color: '#4ade80', icon: '✓' }
    if (today >= f && today <= t) return { label: 'En curso', color: '#fbbf24', icon: '▶' }
    const daysUntil = Math.ceil((f - today) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 7) return { label: `En ${daysUntil} días`, color: '#f87171', icon: '⚡' }
    return { label: 'Programada', color: '#6b7280', icon: '○' }
  }

  // Calculate timeline range
  const allDates = calendar.flatMap(c => [new Date(c.from), new Date(c.to)])
  const minDate = new Date(Math.min(...allDates))
  const maxDate = new Date(Math.max(...allDates))
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24) + 14

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { val: calendar.filter(c => getStatus(c.from, c.to).label === 'En curso').length, label: 'Tandas en curso', color: '#fbbf24' },
          { val: calendar.filter(c => getStatus(c.from, c.to).label === 'Finalizada').length, label: 'Finalizadas', color: '#4ade80' },
          { val: calendar.filter(c => !['Finalizada', 'En curso'].includes(getStatus(c.from, c.to).label)).length, label: 'Próximas', color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline visual */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Timeline de Pasantías 2025</div>
        {calendar.map((c, i) => {
          const status = getStatus(c.from, c.to)
          const color = COLORS[i % COLORS.length]
          const fromDate = new Date(c.from), toDate = new Date(c.to)
          const left = Math.max(0, ((fromDate - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100)
          const width = Math.max(5, ((toDate - fromDate) / (1000 * 60 * 60 * 24)) / totalDays * 100)

          return (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cream)' }}>{c.course}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>— {c.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{fmtDate(c.from)} → {fmtDate(c.to)}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, background: status.color + '20', color: status.color }}>{status.icon} {status.label}</span>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: 'all 0.5s ease' }} />
              </div>
            </div>
          )
        })}
        {/* Today marker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--gold)' }}>
          <Calendar size={13} /> Hoy: {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {calendar.map((c, i) => {
          const status = getStatus(c.from, c.to)
          const color = COLORS[i % COLORS.length]
          const days = Math.ceil((new Date(c.to) - new Date(c.from)) / (1000 * 60 * 60 * 24)) + 1
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${color}33`, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{c.course}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{c.label}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: status.color + '22', color: status.color }}>{status.icon} {status.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.82rem' }}>
                <div><span style={{ color: 'var(--smoke)' }}>Inicio:</span> <span style={{ color: 'var(--cream)' }}>{fmtDate(c.from)}</span></div>
                <div><span style={{ color: 'var(--smoke)' }}>Fin:</span> <span style={{ color: 'var(--cream)' }}>{fmtDate(c.to)}</span></div>
                <div><span style={{ color: 'var(--smoke)' }}>Duración:</span> <span style={{ color: 'var(--cream)' }}>{days} días hábiles</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 9. NOTAS OFICIALES
// ═══════════════════════════════════════════════════════

const NOTE_TYPES = {
  presentacion_empresa: { label: 'Nota de presentación a empresa', icon: '📩', template: 'La Directora de la Esc. N° 4-012 Ing. Ricardo Videla se dirige a Ud. con el fin de presentar el Proyecto de Pasantías Educativas y solicitar la participación de su empresa/organización como entidad oferente de prácticas para nuestros alumnos de 5° año.' },
  solicitud_municipio: { label: 'Solicitud a Municipalidad', icon: '🏛️', template: 'La Directora de la Esc. N° 4-012 Ing. Ricardo Videla se dirige a Ud. con el fin de solicitar autorización para que nuestros alumnos puedan realizar las Pasantías en el Municipio.' },
  comunicacion_dge: { label: 'Comunicación a DGE', icon: '📋', template: 'Nos dirigimos a Ud. a los fines de comunicar el desarrollo del Proyecto de Pasantías Educativas correspondiente al ciclo lectivo vigente, en el marco de la Resolución N° 1136-DGE-2012 y el Decreto Nacional 1374/11.' },
  nota_supervision: { label: 'Nota a Supervisión', icon: '📄', template: 'Se comunica a la Supervisión la puesta en marcha del Proyecto de Pasantías para los alumnos de 5° año de la institución.' },
  otra: { label: 'Otra nota oficial', icon: '✉️', template: '' },
}

export function OfficialNotesTab() {
  const [notes, setNotes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ school_name: 'Esc. N° 4-012 Ing. Ricardo Videla', director_name: 'Prof. Marcela Lubelchik', school_address: 'XX de Setiembre 132 - Luján de Cuyo' })
  const [msg, setMsg] = useState('')

  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    try {
      const res = await fetch('/api/admin/notes', { headers: authHeader() })
      const data = await res.json()
      setNotes(data.notes || [])
    } catch { setNotes([]) }
  }

  async function saveNote() {
    try {
      const res = await fetch('/api/admin/notes', { method: 'POST', headers: authHeader(), body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Nota guardada ✓'); setModal(false); setForm({ school_name: 'Esc. N° 4-012 Ing. Ricardo Videla', director_name: 'Prof. Marcela Lubelchik', school_address: 'XX de Setiembre 132 - Luján de Cuyo' })
      loadNotes()
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  function selectType(type) {
    const t = NOTE_TYPES[type]
    setForm(f => ({ ...f, type, body: t.template, subject: t.label }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>{notes.length} notas registradas</span>
        <button className="btn btn-gold btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Nueva nota oficial</button>
      </div>

      {msg && <div className={`alert ${msg.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }} onClick={() => setMsg('')}>{msg}</div>}

      {notes.length === 0
        ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}><FileText size={36} style={{ opacity: 0.25, marginBottom: 12 }} /><p>Sin notas oficiales. Creá una para comenzar.</p></div>
        : notes.map(n => {
          const t = NOTE_TYPES[n.type] || {}
          return (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
              <span style={{ fontSize: '1.3rem' }}>{t.icon || '📄'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{n.subject || t.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--smoke)' }}>{n.recipient_name && `Para: ${n.recipient_name} · `}{fmtDate(n.created_at)}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: n.status === 'enviada' ? '#4ade8022' : n.status === 'respondida' ? '#60a5fa22' : '#6b728022', color: n.status === 'enviada' ? '#4ade80' : n.status === 'respondida' ? '#60a5fa' : '#6b7280' }}>
                {n.status === 'enviada' ? '✓ Enviada' : n.status === 'respondida' ? '↩ Respondida' : 'Borrador'}
              </span>
            </div>
          )
        })
      }

      {/* Modal nueva nota */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Nueva Nota Oficial</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--smoke)' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 8 }}>Tipo de nota</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(NOTE_TYPES).filter(([k]) => k !== 'otra').map(([key, t]) => (
                  <button key={key} onClick={() => selectType(key)} style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', border: form.type === key ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: form.type === key ? 'rgba(212,168,67,0.1)' : 'transparent', color: form.type === key ? 'var(--gold)' : 'var(--smoke)', textAlign: 'center', fontSize: '0.76rem', fontWeight: 600 }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Destinatario (nombre)</label>
                <input value={form.recipient_name || ''} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Sr./Sra. Director/a…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Organización</label>
                <input value={form.recipient_org || ''} onChange={e => setForm(f => ({ ...f, recipient_org: e.target.value }))} placeholder="Municipalidad / DGE / Empresa…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Asunto</label>
              <input value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: '0.85rem' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--smoke)', display: 'block', marginBottom: 5 }}>Cuerpo de la nota</label>
              <textarea value={form.body || ''} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'var(--cream)', resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.6 }} />
            </div>

            {/* Datos institucionales */}
            <div style={{ padding: '10px 14px', background: 'rgba(27,186,170,0.06)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--teal)', marginBottom: 14 }}>
              📌 Datos autocompletados: {form.school_name} · {form.director_name} · {form.school_address}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-gold btn-sm" onClick={saveNote}>✓ Guardar nota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 10. SETUP WIZARD / CHECKLIST DE PUESTA EN MARCHA
// ═══════════════════════════════════════════════════════

export function SetupWizard({ stats }) {
  const steps = [
    { id: 'companies', label: 'Cargar empresas con convenio', desc: 'Registrar las empresas que recibirán pasantes', icon: '🏢', check: () => (stats?.companies || 0) > 0, count: stats?.companies || 0, target: 'Al menos 5 empresas' },
    { id: 'teachers', label: 'Registrar docentes tutores', desc: 'Crear cuentas para los docentes que supervisarán', icon: '👩‍🏫', check: () => (stats?.teachers || 0) > 0, count: stats?.teachers || 0, target: 'Al menos 3 docentes' },
    { id: 'students', label: 'Cargar alumnos de 5° año', desc: 'Registrar todos los alumnos que realizarán pasantías', icon: '👨‍🎓', check: () => (stats?.students || 0) > 0, count: stats?.students || 0, target: '25-30 alumnos' },
    { id: 'assignments', label: 'Asignar alumnos a docentes', desc: 'Vincular cada alumno con su docente tutor', icon: '🔗', check: () => (stats?.assigned || 0) > 0, count: stats?.assigned || 0, target: '100% asignados' },
    { id: 'company_assign', label: 'Asignar alumnos a empresas', desc: 'Definir dónde hará la pasantía cada alumno', icon: '🏭', check: () => (stats?.company_assigned || 0) > 0, count: stats?.company_assigned || 0, target: '100% con empresa' },
    { id: 'agreements', label: 'Generar Actas Individuales', desc: 'Crear los convenios formales por cada alumno', icon: '📋', check: () => (stats?.agreements || 0) > 0, count: stats?.agreements || 0, target: '1 por alumno' },
    { id: 'authorizations', label: 'Verificar autorizaciones familiares', desc: 'Confirmar que todos los padres firmaron', icon: '✅', check: () => (stats?.authorizations || 0) > 0, count: stats?.authorizations || 0, target: '100% autorizados' },
    { id: 'insurance', label: 'Verificar seguros escolares', desc: 'Comprobar que todos tienen seguro vigente', icon: '🛡️', check: () => (stats?.insurance || 0) > 0, count: stats?.insurance || 0, target: '100% asegurados' },
    { id: 'calendar', label: 'Configurar calendario de tandas', desc: 'Definir fechas de inicio y fin por curso', icon: '📅', check: () => (stats?.calendar_set || false), count: stats?.calendar_set ? 1 : 0, target: 'Fechas definidas' },
    { id: 'start', label: 'Iniciar pasantías', desc: '¡Todo listo para comenzar!', icon: '🚀', check: () => (stats?.started || false), count: stats?.started ? 1 : 0, target: 'Activar sistema' },
  ]

  const completed = steps.filter(s => s.check()).length
  const pct = Math.round((completed / steps.length) * 100)

  return (
    <div>
      {/* Progress header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,29,47,0.2), rgba(212,168,67,0.1))', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 4 }}>🎯 Puesta en Marcha del Sistema de Pasantías</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--smoke)', margin: 0 }}>Completá cada paso para tener todo listo. Seguí el orden recomendado.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: pct === 100 ? '#4ade80' : 'var(--gold)', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{completed}/{steps.length} pasos</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : 'linear-gradient(90deg, var(--wine), var(--gold))', borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, i) => {
          const done = step.check()
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: done ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${done ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.3s' }}>
              {/* Step number */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? '1.2rem' : '0.9rem', fontWeight: 700, flexShrink: 0, background: done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', color: done ? '#4ade80' : 'var(--smoke)', border: `1.5px solid ${done ? '#4ade80' : 'rgba(255,255,255,0.12)'}` }}>
                {done ? '✓' : i + 1}
              </div>
              {/* Icon */}
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{step.icon}</span>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: done ? '#4ade80' : 'var(--cream)', textDecoration: done ? 'none' : 'none' }}>{step.label}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--smoke)', marginTop: 2 }}>{step.desc}</div>
              </div>
              {/* Status */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {done
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}><Check size={12} /> Completo</span>
                  : <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{step.count > 0 ? `${step.count} registrados` : 'Pendiente'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>Meta: {step.target}</div>
                  </div>
                }
              </div>
            </div>
          )
        })}
      </div>

      {pct === 100 && (
        <div style={{ marginTop: 24, padding: '20px 24px', background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,211,238,0.1))', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>¡Sistema listo para operar!</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--smoke)' }}>Todos los pasos están completos. El sistema de pasantías está en marcha.</div>
        </div>
      )}
    </div>
  )
}
