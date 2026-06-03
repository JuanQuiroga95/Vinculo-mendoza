// src/pages/PreceptorDashboard.jsx — Dashboard del Preceptor
// Control ICE (escolaridad) + Siniestros laborales
import { useState, useEffect, useMemo } from 'react'
import {
  Users, Lock, Unlock, AlertTriangle, CheckCircle, Clock,
  Search, LogOut, Plus, X, Shield, FileWarning,
} from 'lucide-react'
import { clearAuth, getToken } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

// ─── API ──────────────────────────────────────────────────────────────────────
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

const ACCIDENT_TYPES = {
  accidente_trabajo: 'Accidente de trabajo',
  accidente_in_itinere: 'Accidente in itinere',
  enfermedad_profesional: 'Enfermedad profesional',
}

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

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',    label: 'Resumen',       icon: Shield },
  { id: 'ice',        label: 'Control ICE',   icon: Lock },
  { id: 'siniestros', label: 'Siniestros',    icon: AlertTriangle },
]

// ─── RESUMEN ──────────────────────────────────────────────────────────────────
function ResumenTab({ students, accidents }) {
  const iceCount = students.filter(s => s.ice).length
  const activeCount = students.filter(s => s.pasantia_status === 'active').length
  const totalStudents = students.length
  const overdueAccidents = accidents.filter(a => !a.sent_to_dge && (Date.now() - new Date(a.occurred_at).getTime()) > 48 * 3600000).length
  const pendingAccidents = accidents.filter(a => !a.sent_to_dge).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <StatCard icon={Users} label="Alumnos totales" value={totalStudents} sub="Registrados en el sistema" color="var(--gold)" />
        <StatCard icon={CheckCircle} label="Pasantías activas" value={activeCount} sub={`${totalStudents ? Math.round(activeCount / totalStudents * 100) : 0}% del total`} color="#4ade80" />
        <StatCard icon={Lock} label="ICE activos" value={iceCount} sub="Bloqueados por escolaridad" color="#f87171" alert={iceCount > 0} />
        <StatCard icon={AlertTriangle} label="Siniestros pendientes" value={pendingAccidents} sub={overdueAccidents > 0 ? `⚠ ${overdueAccidents} vencido(s)` : 'Todo al día'} color="#fbbf24" alert={overdueAccidents > 0} />
      </div>

      {/* Alumnos bloqueados */}
      {iceCount > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.88rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} /> Alumnos en condición ICE
          </div>
          {students.filter(s => s.ice).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.05)', borderRadius: 8, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{s.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: 2 }}>{s.ice_reason || 'Sin motivo registrado'} · {s.company_name || 'Sin empresa'}</div>
              </div>
              <Badge status="blocked" />
            </div>
          ))}
        </div>
      )}

      {/* Alertas siniestros */}
      {overdueAccidents > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, color: '#fca5a5' }}>
          <AlertTriangle size={18} />
          <div>
            <div style={{ fontWeight: 600 }}>¡Alerta! {overdueAccidents} siniestro(s) superó las 48hs sin ser enviado a DGE</div>
            <div style={{ fontSize: '0.8rem', marginTop: 2 }}>El límite legal es 72 horas. Actuá de inmediato.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CONTROL ICE ──────────────────────────────────────────────────────────────
function IceTab({ students, onToggleIce }) {
  const [modal, setModal] = useState(null)
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const blocked = students.filter(s => s.ice)
  const filtered = students.filter(s => !search || s.full_name.toLowerCase().includes(search.toLowerCase()))

  async function confirmToggle() {
    await onToggleIce(modal.student.id, modal.action === 'block', reason)
    setMsg(`${modal.action === 'block' ? 'ICE activado' : 'ICE levantado'} para ${modal.student.full_name} ✓`)
    setModal(null); setReason('')
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Lock} label="ICE activos" value={blocked.length} sub="Bloqueados del sistema" color="#f87171" alert={blocked.length > 0} />
        <StatCard icon={Users} label="Habilitados" value={students.filter(s => !s.ice && s.pasantia_status).length} sub="Pueden continuar" color="#4ade80" />
        <StatCard icon={Clock} label="Sin pasantía" value={students.filter(s => !s.pasantia_status).length} sub="Pendientes de ubicación" color="#fbbf24" />
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg}</div>}

      {/* Bloqueados */}
      {blocked.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.88rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} /> Alumnos en condición ICE
          </div>
          {blocked.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.05)', borderRadius: 8, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{s.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: 2 }}>{s.ice_reason || 'Sin motivo'} · {s.ice_set_at ? new Date(s.ice_set_at).toLocaleDateString('es-AR') : ''}</div>
              </div>
              <button onClick={() => { setModal({ student: s, action: 'unblock' }); setReason('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '6px 14px', color: '#4ade80', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <Unlock size={13} /> Levantar ICE
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…"
          style={{ width: '100%', background: 'rgba(250,245,237,0.06)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'var(--cream)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(250,245,237,0.04)' }}>
                {['Alumno/a', 'Empresa', 'Docente', 'Horas', 'Estado', 'ICE', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--smoke)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid rgba(250,245,237,0.05)', background: s.ice ? 'rgba(248,113,113,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(250,245,237,0.02)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--cream)', fontWeight: 500 }}>{s.full_name}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.company_name || '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--smoke)', fontSize: '0.8rem' }}>{s.teacher_name || '—'}</td>
                  <td style={{ padding: '10px 16px', color: Number(s.total_hours) >= 100 ? '#4ade80' : 'var(--smoke)' }}>{Number(s.total_hours) || 0}hs</td>
                  <td style={{ padding: '10px 16px' }}><Badge status={s.ice ? 'blocked' : (s.pasantia_status || 'none')} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    {s.ice
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 99, padding: '2px 10px', fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}><Lock size={11} /> Bloqueado</span>
                      : <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {s.ice
                      ? <button onClick={() => { setModal({ student: s, action: 'unblock' }); setReason('') }} style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 7, padding: '5px 12px', color: '#4ade80', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}><Unlock size={11} /> Levantar</button>
                      : s.pasantia_status && <button onClick={() => { setModal({ student: s, action: 'block' }); setReason('') }} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 7, padding: '5px 12px', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}><Lock size={11} /> Aplicar ICE</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ICE */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: modal.action === 'block' ? '#f87171' : '#4ade80', fontFamily: 'var(--font-display)' }}>
                {modal.action === 'block' ? '⚠ Aplicar condición ICE' : '✓ Levantar condición ICE'}
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', marginBottom: 16 }}>Alumno/a: <strong style={{ color: 'var(--cream)' }}>{modal.student.full_name}</strong></p>
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
function SiniestrosTab({ students, accidents, setAccidents }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ student_id: '', report_type: 'accidente_trabajo', occurred_at: '', description: '' })
  const [msg, setMsg] = useState('')

  function hoursFrom(a) { return Math.floor((Date.now() - new Date(a.occurred_at).getTime()) / 3600000) }
  function isOverdue(a) { return !a.sent_to_dge && hoursFrom(a) > 48 }

  async function markSent(id) {
    try {
      await fetch('/api/admin?_resource=dashboard&action=mark_sent', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ id })
      })
      setAccidents(prev => prev.map(a => a.id === id ? { ...a, sent_to_dge: true, sent_at: new Date().toISOString() } : a))
      setMsg('Siniestro marcado como enviado a DGE ✓')
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  async function addAccident() {
    try {
      const res = await fetch('/api/admin?_resource=dashboard&action=add_accident', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAccidents(prev => [data.accident, ...prev])
      setModal(false)
      setForm({ student_id: '', report_type: 'accidente_trabajo', occurred_at: '', description: '' })
      setMsg('Denuncia de siniestro registrada ✓')
    } catch (e) { setMsg('Error: ' + e.message) }
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

      {/* Lista de siniestros */}
      {accidents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--smoke)' }}>
          <FileWarning size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: '0.95rem' }}>No hay siniestros registrados</div>
          <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Los reportes de accidentes laborales aparecerán aquí</div>
        </div>
      )}

      {accidents.map(a => {
        const hrs = hoursFrom(a); const overdue = isOverdue(a)
        return (
          <div key={a.id} style={{ padding: '18px 20px', background: overdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${overdue ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 99, background: 'rgba(212,168,67,0.15)', color: 'var(--gold)', fontWeight: 600 }}>{ACCIDENT_TYPES[a.report_type]}</span>
                  {overdue && <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 700 }}>⚠ VENCIDO {hrs}hs</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>{a.student_name || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', marginTop: 2 }}>{a.company_name || ''} · {new Date(a.occurred_at).toLocaleString('es-AR')}</div>
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

      {/* Modal nueva denuncia */}
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
                  {students.filter(s => s.pasantia_status === 'active' || s.pasantia_status === 'simulation').map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
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

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function PreceptorDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('resumen')
  const [students, setStudents] = useState([])
  const [accidents, setAccidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const [sRes, aRes] = await Promise.all([
          fetch('/api/admin?_resource=dashboard&action=get_students_preceptor', { headers: authHeaders() }).then(r => r.json()),
          fetch('/api/admin?_resource=dashboard&action=get_accidents', { headers: authHeaders() }).then(r => r.json()),
        ])
        setStudents(sRes.students || sRes || [])
        setAccidents(aRes.accidents || [])
      } catch (e) {
        console.error('Error cargando datos preceptor:', e)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  async function toggleIce(studentId, block, reason) {
    try {
      await fetch('/api/admin?_resource=dashboard&action=toggle_ice', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ student_id: studentId, block, reason })
      })
      // Recargar datos
      const sRes = await fetch('/api/admin?_resource=dashboard&action=get_students_preceptor', { headers: authHeaders() }).then(r => r.json())
      setStudents(sRes.students || sRes || [])
    } catch (e) { console.warn('ICE toggle error:', e) }
  }

  function logout() { clearAuth(); navigate('/login') }

  const iceCount = students.filter(s => s.ice).length
  const pendingAccidents = accidents.filter(a => !a.sent_to_dge).length

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
              <span style={{ fontWeight: 700, color: 'var(--cream)' }}>Vínculo Pasantías</span>
              <span style={{ marginLeft: 8, fontSize: '0.75rem', background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6, padding: '1px 8px', color: '#60a5fa' }}>📋 PRECEPTOR</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {iceCount > 0 && (
              <div onClick={() => setTab('ice')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                <Lock size={13} /> {iceCount} ICE activo{iceCount > 1 ? 's' : ''}
              </div>
            )}
            {pendingAccidents > 0 && (
              <div onClick={() => setTab('siniestros')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                <AlertTriangle size={13} /> {pendingAccidents} pendiente{pendingAccidents > 1 ? 's' : ''}
              </div>
            )}
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(250,245,237,0.12)', borderRadius: 8, padding: '6px 12px', color: 'var(--smoke)', cursor: 'pointer', fontSize: '0.8rem' }}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--smoke)', fontSize: '0.95rem' }}>
            Cargando datos…
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(250,245,237,0.04)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s', background: tab === t.id ? 'var(--wine)' : 'transparent', color: tab === t.id ? 'white' : 'var(--smoke)', position: 'relative' }}>
                  <t.icon size={14} />
                  {t.label}
                  {t.id === 'ice' && iceCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />}
                  {t.id === 'siniestros' && pendingAccidents > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />}
                </button>
              ))}
            </div>

            <div style={{ animation: 'fadeUp 0.35s ease' }}>
              {tab === 'resumen'    && <ResumenTab students={students} accidents={accidents} />}
              {tab === 'ice'        && <IceTab students={students} onToggleIce={toggleIce} />}
              {tab === 'siniestros' && <SiniestrosTab students={students} accidents={accidents} setAccidents={setAccidents} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
