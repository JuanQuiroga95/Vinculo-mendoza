import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getProfile, vacancyAPI, applicationAPI, portfolioAPI, logbookAPI, STATUS_LABELS, STATUS_BADGE, calcMatchScore } from '../utils/auth'
import { LayoutDashboard, Search, FolderOpen, BookOpen, Star, Plus, X, Clock, MapPin, Briefcase, ChevronRight, Award, FileText } from 'lucide-react'

export default function StudentDashboard() {
  const [tab, setTab] = useState('inicio')
  const [vacancies, setVacancies] = useState([])
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [logbook, setLogbook] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // 'apply' | 'portfolio' | 'logbook'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const profile = getProfile()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [v, a, p, l] = await Promise.allSettled([
        vacancyAPI.getAll(), applicationAPI.getMine(), portfolioAPI.getMine(), logbookAPI.getMine()
      ])
      if (v.status === 'fulfilled') setVacancies(v.value.vacancies || [])
      if (a.status === 'fulfilled') setApplications(a.value.applications || [])
      if (p.status === 'fulfilled') setPortfolio(p.value.items || [])
      if (l.status === 'fulfilled') setLogbook(l.value.entries || [])
    } finally { setLoading(false) }
  }

  async function apply() {
    try {
      await applicationAPI.apply({ vacancy_id: selected.id, cover_note: form.cover_note })
      setMsg('¡Postulación enviada!'); setModal(null); setForm({})
      const a = await applicationAPI.getMine(); setApplications(a.applications || [])
    } catch (e) { setMsg(e.message) }
  }

  async function addPortfolio() {
    try {
      await portfolioAPI.add(form)
      setModal(null); setForm({})
      const p = await portfolioAPI.getMine(); setPortfolio(p.items || [])
    } catch (e) { setMsg(e.message) }
  }

  async function addLogEntry() {
    try {
      await logbookAPI.addEntry({ ...form, application_id: form.application_id })
      setModal(null); setForm({})
      const l = await logbookAPI.getMine(); setLogbook(l.entries || [])
    } catch (e) { setMsg(e.message) }
  }

  const appliedIds = new Set(applications.map(a => a.vacancy_id))
  const sortedVacancies = [...vacancies].sort((a, b) => calcMatchScore(profile || {}, b) - calcMatchScore(profile || {}, a))
  const pendingApps = applications.filter(a => a.status === 'pending').length

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: <LayoutDashboard size={16} /> },
    { id: 'vacantes', label: 'Pasantías', icon: <Search size={16} />, count: vacancies.length },
    { id: 'postulaciones', label: 'Mis postulaciones', icon: <Briefcase size={16} />, count: pendingApps },
    { id: 'portafolio', label: 'Mi portafolio', icon: <FolderOpen size={16} />, count: portfolio.length },
    { id: 'bitacora', label: 'Bitácora', icon: <BookOpen size={16} />, count: logbook.length },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--wine-light)" />

      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}

        {/* ── INICIO ── */}
        {tab === 'inicio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Hola, {profile?.full_name?.split(' ')[0] || 'Alumno'} 👋</h2>
              <p style={{ marginTop: 4 }}>{profile?.school} · {profile?.orientation} · {profile?.grade}</p>
            </div>

            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { val: vacancies.length, label: 'Vacantes activas', color: 'var(--gold)', icon: <Search size={18} /> },
                { val: applications.length, label: 'Postulaciones', color: 'var(--wine-light)', icon: <Briefcase size={18} /> },
                { val: portfolio.length, label: 'Proyectos', color: 'var(--teal)', icon: <FolderOpen size={18} /> },
                { val: logbook.length, label: 'Entradas bitácora', color: 'var(--muted)', icon: <BookOpen size={18} /> },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Vacantes recomendadas para vos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedVacancies.slice(0, 4).map(v => {
                const score = calcMatchScore(profile || {}, v)
                return (
                  <div key={v.id} className="vacancy-card" onClick={() => { setSelected(v); setTab('vacantes') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="vacancy-company">{v.company_name}</div>
                        <div className="vacancy-title">{v.title}</div>
                      </div>
                      {score > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
                          <Star size={13} fill="var(--gold)" /> {score}% match
                        </div>
                      )}
                    </div>
                    <div className="vacancy-meta">
                      {v.hours_per_week && <span className="badge badge-smoke"><Clock size={11} /> {v.hours_per_week}h/sem</span>}
                      {v.location && <span className="badge badge-smoke"><MapPin size={11} /> {v.location}</span>}
                      {v.orientation_required && <span className="badge badge-wine">{v.orientation_required}</span>}
                    </div>
                  </div>
                )
              })}
              {!vacancies.length && !loading && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--smoke)' }}>No hay vacantes disponibles aún.</div>
              )}
            </div>
          </div>
        )}

        {/* ── VACANTES ── */}
        {tab === 'vacantes' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Pasantías disponibles</h2>
              <p>Encontrá la pasantía ideal según tu orientación e intereses</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sortedVacancies.map(v => {
                const score = calcMatchScore(profile || {}, v)
                const applied = appliedIds.has(v.id)
                return (
                  <div key={v.id} className="card" style={{ border: selected?.id === v.id ? '1.5px solid var(--gold)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div className="vacancy-company">{v.company_name} · {v.sector}</div>
                        <h3 style={{ color: 'var(--cream)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{v.title}</h3>
                        {v.description && <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>{v.description}</p>}
                        <div className="vacancy-meta">
                          {v.hours_per_week && <span className="badge badge-smoke"><Clock size={11} /> {v.hours_per_week}h/sem</span>}
                          {v.location && <span className="badge badge-smoke"><MapPin size={11} /> {v.location}</span>}
                          {v.orientation_required && <span className="badge badge-wine">{v.orientation_required}</span>}
                          {(v.tags || []).map(t => <span key={t} className="badge badge-gold">{t}</span>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        {score > 0 && <div style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Star size={13} fill="var(--gold)" /> {score}% match</div>}
                        {applied
                          ? <span className="badge badge-teal"><Award size={11} /> Postulado</span>
                          : <button className="btn btn-primary btn-sm" onClick={() => { setSelected(v); setModal('apply') }}>Postularme <ChevronRight size={14} /></button>
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
              {!vacancies.length && <div style={{ textAlign: 'center', padding: 40, color: 'var(--smoke)' }}>No hay vacantes disponibles aún.</div>}
            </div>
          </div>
        )}

        {/* ── POSTULACIONES ── */}
        {tab === 'postulaciones' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>Mis postulaciones</h2>
              <p>Seguí el estado de cada una</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {applications.map(a => (
                <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', marginBottom: 4 }}>{a.vacancy_title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--teal)' }}>{a.company_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--smoke)', marginTop: 4 }}>{new Date(a.applied_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[a.status] || 'badge-smoke'}`}>{STATUS_LABELS[a.status] || a.status}</span>
                </div>
              ))}
              {!applications.length && <div style={{ textAlign: 'center', padding: 40, color: 'var(--smoke)' }}>Todavía no te postulaste a ninguna vacante. ¡Explorá las pasantías disponibles!</div>}
            </div>
          </div>
        )}

        {/* ── PORTAFOLIO ── */}
        {tab === 'portafolio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2>Mi portafolio</h2>
                <p>Tus proyectos escolares, tu carta de presentación</p>
              </div>
              <button className="btn btn-gold btn-sm" onClick={() => setModal('portfolio')}><Plus size={16} /> Agregar proyecto</button>
            </div>
            <div className="grid-3">
              {portfolio.map(item => (
                <div key={item.id} className="card card-glow">
                  {item.image_url && <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--r-md)', marginBottom: 12 }} />}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {item.category && <span className="badge badge-wine">{item.category}</span>}
                    {item.subject && <span className="badge badge-smoke">{item.subject}</span>}
                  </div>
                  <h4 style={{ color: 'var(--cream)', marginBottom: 6 }}>{item.title}</h4>
                  {item.description && <p style={{ fontSize: '0.85rem' }}>{item.description}</p>}
                  {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 12, display: 'inline-flex' }}><FileText size={14} /> Ver archivo</a>}
                </div>
              ))}
              {!portfolio.length && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--smoke)' }}>
                  <FolderOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>Agregá tus trabajos escolares: planes de marketing, proyectos de ciencias, cortometrajes...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BITÁCORA ── */}
        {tab === 'bitacora' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2>Bitácora digital</h2>
                <p>Registrá tus actividades diarias en la pasantía</p>
              </div>
              {applications.some(a => a.status === 'accepted') && (
                <button className="btn btn-teal btn-sm" onClick={() => setModal('logbook')}><Plus size={16} /> Nueva entrada</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logbook.map(e => (
                <div key={e.id} className="card" style={{ borderLeft: '3px solid var(--teal)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--teal)', fontWeight: 500 }}>{e.company_name} · {e.vacancy_title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>{e.entry_date && new Date(e.entry_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
                    </div>
                    {e.hours_worked && <span className="badge badge-gold"><Clock size={11} /> {e.hours_worked}h</span>}
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{e.content}</p>
                </div>
              ))}
              {!logbook.length && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)' }}>
                  <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>Una vez que tengas una pasantía aceptada, podrás registrar tu actividad diaria aquí.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: Apply ── */}
      {modal === 'apply' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: 'var(--cream)' }}>{selected.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--teal)' }}>{selected.company_name}</p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Nota de presentación (opcional)</label>
              <textarea className="input" rows={4} placeholder="Contale brevemente por qué te interesa esta pasantía..." value={form.cover_note || ''} onChange={e => setForm({ ...form, cover_note: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button className="btn btn-primary" onClick={apply} style={{ flex: 1, justifyContent: 'center' }}>Enviar postulación</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Portfolio ── */}
      {modal === 'portfolio' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)' }}>Agregar proyecto</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label>Título del proyecto</label>
                <input className="input" placeholder="Ej: Plan de marketing para emprendimiento local" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Categoría</label>
                  <input className="input" placeholder="Arte, Diseño, Economía..." value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div className="form-group"><label>Materia</label>
                  <input className="input" placeholder="Ej: Marketing" value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Descripción</label>
                <textarea className="input" rows={3} placeholder="¿De qué se trata el proyecto?" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} /></div>
              <div className="form-group"><label>URL del archivo (Drive, Behance, etc.)</label>
                <input className="input" placeholder="https://..." value={form.file_url || ''} onChange={e => setForm({ ...form, file_url: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button className="btn btn-gold" onClick={addPortfolio} style={{ flex: 1, justifyContent: 'center' }}>Guardar proyecto</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Logbook ── */}
      {modal === 'logbook' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)' }}>Nueva entrada en bitácora</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label>Pasantía</label>
                <select className="input" value={form.application_id || ''} onChange={e => setForm({ ...form, application_id: e.target.value })}>
                  <option value="">Seleccionar pasantía</option>
                  {applications.filter(a => a.status === 'accepted').map(a => (
                    <option key={a.id} value={a.id}>{a.vacancy_title} — {a.company_name}</option>
                  ))}
                </select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Fecha</label>
                  <input className="input" type="date" value={form.entry_date || ''} onChange={e => setForm({ ...form, entry_date: e.target.value })} /></div>
                <div className="form-group"><label>Horas trabajadas</label>
                  <input className="input" type="number" min={0} max={8} step={0.5} placeholder="Ej: 4" value={form.hours_worked || ''} onChange={e => setForm({ ...form, hours_worked: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>¿Qué hiciste hoy?</label>
                <textarea className="input" rows={4} placeholder="Describí las tareas que realizaste..." value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button className="btn btn-teal" onClick={addLogEntry} style={{ flex: 1, justifyContent: 'center' }}>Guardar entrada</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
