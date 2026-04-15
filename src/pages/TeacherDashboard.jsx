import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getProfile, teacherAPI, STATUS_LABELS, STATUS_BADGE } from '../utils/auth'
import { LayoutDashboard, Users, Award, BookOpen, X, Plus, Check, Search } from 'lucide-react'

const SKILLS = ['Trabajo en equipo', 'Liderazgo', 'Comunicación oral', 'Comunicación escrita', 'Resolución de problemas', 'Responsabilidad', 'Proactividad', 'Capacidad analítica', 'Creatividad', 'Puntualidad', 'Adaptabilidad']

export default function TeacherDashboard() {
  const [tab, setTab] = useState('inicio')
  const [students, setStudents] = useState([])
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const profile = getProfile()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const data = await teacherAPI.getStudents()
      setStudents(data.students || [])
      setTeacher(data.teacher || null)
    } catch (e) {
      // API not available in demo — use mock
      setStudents([])
    } finally { setLoading(false) }
  }

  async function validateSkill() {
    try {
      await teacherAPI.validateSkill({ student_id: selected.id, skill: form.skill, note: form.note })
      setMsg(`Habilidad "${form.skill}" validada para ${selected.full_name}`)
      setModal(null); setForm({})
      loadData()
    } catch (e) { setMsg(e.message) }
  }

  const filtered = students.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.orientation?.toLowerCase().includes(search.toLowerCase())
  )

  const totalApps = students.reduce((acc, s) => acc + Number(s.application_count || 0), 0)
  const totalPortfolio = students.reduce((acc, s) => acc + Number(s.portfolio_count || 0), 0)

  const navItems = [
    { id: 'inicio', label: 'Panel general', icon: <LayoutDashboard size={16} /> },
    { id: 'alumnos', label: 'Mis alumnos', icon: <Users size={16} />, count: students.length },
    { id: 'validaciones', label: 'Validar habilidades', icon: <Award size={16} /> },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--teal)" />

      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.includes('validada') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}

        {/* ── INICIO ── */}
        {tab === 'inicio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Bienvenido/a, {profile?.full_name?.split(' ').slice(-1)[0] || 'Docente'}</h2>
              <p>{profile?.school} · {profile?.subject}</p>
            </div>

            <div className="grid-4" style={{ marginBottom: 36 }}>
              {[
                { val: students.length, label: 'Alumnos en tu escuela', color: 'var(--teal)' },
                { val: totalApps, label: 'Postulaciones activas', color: 'var(--gold)' },
                { val: totalPortfolio, label: 'Proyectos en portafolio', color: 'var(--wine-light)' },
                { val: students.reduce((a, s) => a + (s.validations?.length || 0), 0), label: 'Habilidades validadas', color: 'var(--muted)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Resumen de tu grupo</h3>
            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)', background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Los alumnos de tu escuela aparecerán aquí cuando se registren en la plataforma.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {students.slice(0, 5).map(s => (
                  <StudentRow key={s.id} s={s} onValidate={() => { setSelected(s); setModal('validate'); setTab('validaciones') }} />
                ))}
                {students.length > 5 && (
                  <button className="btn btn-outline btn-sm" onClick={() => setTab('alumnos')} style={{ alignSelf: 'flex-start' }}>Ver todos ({students.length})</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ALUMNOS ── */}
        {tab === 'alumnos' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div><h2>Mis alumnos</h2><p>Alumnos registrados de {profile?.school || 'tu escuela'}</p></div>
            </div>

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--smoke)' }} />
              <input className="input" placeholder="Buscar por nombre u orientación..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(s => (
                <StudentRow key={s.id} s={s} expanded onValidate={() => { setSelected(s); setModal('validate') }} />
              ))}
              {!filtered.length && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)' }}>
                  <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>{search ? 'No se encontraron alumnos con ese criterio.' : 'No hay alumnos registrados de tu escuela aún.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VALIDACIONES ── */}
        {tab === 'validaciones' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Validar habilidades</h2>
              <p>Reconocé las competencias blandas de tus alumnos</p>
            </div>

            <div style={{ background: 'rgba(27,186,170,0.08)', border: '1px solid rgba(27,186,170,0.25)', borderRadius: 'var(--r-md)', padding: 20, marginBottom: 28 }}>
              <h4 style={{ color: 'var(--teal)', marginBottom: 8 }}>¿Qué es una validación?</h4>
              <p style={{ fontSize: '0.9rem' }}>Al validar una habilidad blanda de un alumno, estás certificando que observaste esa competencia en el aula. Esto enriquece su perfil y lo hace más visible para las empresas. Es el equivalente digital de una recomendación docente.</p>
            </div>

            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Seleccioná un alumno para validar</h3>
            <div className="grid-3">
              {students.map(s => (
                <button key={s.id} onClick={() => { setSelected(s); setModal('validate') }}
                  style={{
                    background: selected?.id === s.id ? 'rgba(27,186,170,0.15)' : 'var(--bg-card)',
                    border: `1px solid ${selected?.id === s.id ? 'var(--teal)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 'var(--r-md)', padding: 16, cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = selected?.id === s.id ? 'var(--teal)' : 'rgba(255,255,255,0.08)'}
                >
                  <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{s.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--smoke)' }}>{s.orientation} · {s.grade}</div>
                  {(s.validations || []).length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(s.validations || []).slice(0, 3).map(v => (
                        <span key={v.id} className="badge badge-teal" style={{ fontSize: '0.7rem' }}><Check size={10} /> {v.skill}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {!students.length && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--smoke)' }}>No hay alumnos para validar aún.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: Validate skill ── */}
      {modal === 'validate' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: 'var(--cream)' }}>Validar habilidad</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--teal)' }}>{selected.full_name}</p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>Habilidad a validar</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SKILLS.map(skill => (
                    <button key={skill} onClick={() => setForm({ ...form, skill })}
                      className={`badge ${form.skill === skill ? 'badge-teal' : 'badge-smoke'}`}
                      style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>
                      {form.skill === skill && <Check size={11} />} {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Observación (opcional)</label>
                <textarea className="input" rows={3} placeholder="Ej: Demostró liderazgo al coordinar el trabajo grupal en el proyecto final..." value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button className="btn btn-teal" onClick={validateSkill} disabled={!form.skill} style={{ flex: 1, justifyContent: 'center' }}>
                  <Award size={16} /> Validar habilidad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StudentRow({ s, expanded, onValidate }) {
  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--teal-dark), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', fontSize: '1rem'
        }}>{s.full_name?.charAt(0) || '?'}</div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{s.full_name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--smoke)' }}>{s.orientation} · {s.grade}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="badge badge-smoke"><BookOpen size={11} /> {s.portfolio_count || 0} proyectos</span>
        <span className="badge badge-smoke"><Award size={11} /> {(s.validations || []).length} validaciones</span>
        <button className="btn btn-teal btn-sm" onClick={onValidate}><Plus size={13} /> Validar</button>
      </div>
    </div>
  )
}
