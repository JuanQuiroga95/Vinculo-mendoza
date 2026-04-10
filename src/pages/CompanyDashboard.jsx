import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getProfile, vacancyAPI, applicationAPI, STATUS_LABELS, STATUS_BADGE } from '../utils/auth'
import { LayoutDashboard, Briefcase, Users, Plus, X, Clock, MapPin, ChevronDown, Star, Check, UserX } from 'lucide-react'

const STATUS_NEXT = { pending: 'reviewed', reviewed: 'interview', interview: 'accepted' }
const STATUS_BTN_LABEL = { pending: 'Marcar revisado', reviewed: 'Llamar a entrevista', interview: 'Aceptar pasante' }

export default function CompanyDashboard() {
  const [tab, setTab] = useState('inicio')
  const [vacancies, setVacancies] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ tags: '' })
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const profile = getProfile()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [v, a] = await Promise.allSettled([vacancyAPI.getAll(), applicationAPI.getMine()])
      if (v.status === 'fulfilled') {
        // filter to own company
        const all = v.value.vacancies || []
        setVacancies(all.filter(vac => vac.company_id === profile?.id))
      }
      if (a.status === 'fulfilled') setApplications(a.value.applications || [])
    } finally { setLoading(false) }
  }

  async function createVacancy() {
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      await vacancyAPI.create({ ...form, tags, hours_per_week: Number(form.hours_per_week) || 15 })
      setModal(null); setForm({ tags: '' }); setMsg('¡Vacante publicada!')
      loadAll()
    } catch (e) { setMsg(e.message) }
  }

  async function updateStatus(app, status) {
    try {
      await applicationAPI.update({ application_id: app.id, status })
      setMsg(`Estado actualizado: ${STATUS_LABELS[status]}`)
      const a = await applicationAPI.getMine(); setApplications(a.applications || [])
    } catch (e) { setMsg(e.message) }
  }

  const myVacIds = new Set(vacancies.map(v => v.id))
  const myApps = applications.filter(a => myVacIds.has(a.vacancy_id))
  const filteredApps = filter === 'all' ? myApps : myApps.filter(a => a.status === filter)

  const counts = { pending: 0, reviewed: 0, interview: 0, accepted: 0, rejected: 0 }
  myApps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: <LayoutDashboard size={16} /> },
    { id: 'vacantes', label: 'Mis vacantes', icon: <Briefcase size={16} />, count: vacancies.length },
    { id: 'postulantes', label: 'Postulantes', icon: <Users size={16} />, count: counts.pending },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--gold)" />

      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }} onClick={() => setMsg('')}>{msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} /></div>}

        {/* ── INICIO ── */}
        {tab === 'inicio' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="dashboard-header">
              <h2>{profile?.company_name || 'Mi empresa'}</h2>
              <p>{profile?.sector} · {profile?.location}</p>
            </div>

            <div className="grid-4" style={{ marginBottom: 36 }}>
              {[
                { val: vacancies.length, label: 'Vacantes activas', color: 'var(--gold)' },
                { val: myApps.length, label: 'Total postulantes', color: 'var(--wine-light)' },
                { val: counts.pending, label: 'Sin revisar', color: 'var(--muted)' },
                { val: counts.accepted, label: 'Pasantes aceptados', color: 'var(--teal)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Status funnel */}
            <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Embudo de postulaciones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
              {[
                { label: 'Pendientes', key: 'pending', color: 'var(--gold)' },
                { label: 'En revisión', key: 'reviewed', color: 'var(--muted)' },
                { label: 'Entrevista', key: 'interview', color: 'var(--teal)' },
                { label: 'Aceptados', key: 'accepted', color: '#4CAF50' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 90, fontSize: '0.82rem', color: 'var(--smoke)', textAlign: 'right' }}>{s.label}</div>
                  <div style={{ flex: 1, height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%', background: s.color, opacity: 0.7, borderRadius: 6,
                      width: myApps.length ? `${(counts[s.key] / myApps.length) * 100}%` : '0%',
                      transition: 'width 0.6s ease', minWidth: counts[s.key] ? 28 : 0,
                      display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)'
                    }}>
                      {counts[s.key] > 0 && counts[s.key]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ marginBottom: 16, color: 'var(--cream)' }}>Acciones rápidas</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-gold" onClick={() => setModal('vacancy')}><Plus size={16} /> Publicar vacante</button>
                <button className="btn btn-outline" onClick={() => setTab('postulantes')}>Ver postulantes <ChevronDown size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* ── VACANTES ── */}
        {tab === 'vacantes' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2>Mis vacantes</h2>
                <p>Publicaciones activas para pasantías</p>
              </div>
              <button className="btn btn-gold" onClick={() => setModal('vacancy')}><Plus size={16} /> Nueva vacante</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {vacancies.map(v => {
                const appCount = myApps.filter(a => a.vacancy_id === v.id).length
                return (
                  <div key={v.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ color: 'var(--cream)', marginBottom: 6, fontFamily: 'var(--font-display)' }}>{v.title}</h3>
                        {v.description && <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>{v.description}</p>}
                        <div className="vacancy-meta">
                          {v.hours_per_week && <span className="badge badge-smoke"><Clock size={11} /> {v.hours_per_week}h/sem</span>}
                          {v.location && <span className="badge badge-smoke"><MapPin size={11} /> {v.location}</span>}
                          {v.orientation_required && <span className="badge badge-wine">{v.orientation_required}</span>}
                          {(v.tags || []).map(t => <span key={t} className="badge badge-gold">{t}</span>)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{appCount}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>postulantes</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {!vacancies.length && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)' }}>
                  <Briefcase size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No tenés vacantes publicadas todavía.</p>
                  <button className="btn btn-gold" style={{ marginTop: 16 }} onClick={() => setModal('vacancy')}><Plus size={16} /> Publicar primera vacante</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── POSTULANTES ── */}
        {tab === 'postulantes' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div><h2>Postulantes</h2><p>Revisá perfiles y gestioná los candidatos</p></div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[['all', 'Todos'], ['pending', 'Pendientes'], ['reviewed', 'En revisión'], ['interview', 'Entrevista'], ['accepted', 'Aceptados'], ['rejected', 'Rechazados']].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 14px' }}>
                  {l} {k !== 'all' && counts[k] > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '1px 6px', marginLeft: 4, fontSize: '0.75rem' }}>{counts[k]}</span>}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredApps.map(a => (
                <div key={a.id} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--wine), var(--wine-light))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--cream)', fontSize: '1rem'
                        }}>{a.full_name?.charAt(0) || '?'}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{a.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--teal)' }}>{a.school} · {a.orientation}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--smoke)', marginBottom: 8 }}>
                        Para: <span style={{ color: 'var(--muted)' }}>{a.vacancy_title}</span>
                      </div>
                      {a.bio && <p style={{ fontSize: '0.88rem', marginBottom: 8 }}>{a.bio}</p>}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(a.interests || []).map(i => <span key={i} className="badge badge-smoke">{i}</span>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      <span className={`badge ${STATUS_BADGE[a.status] || 'badge-smoke'}`}>{STATUS_LABELS[a.status]}</span>
                      {STATUS_NEXT[a.status] && (
                        <button className="btn btn-teal btn-sm" onClick={() => updateStatus(a, STATUS_NEXT[a.status])}>
                          <Check size={13} /> {STATUS_BTN_LABEL[a.status]}
                        </button>
                      )}
                      {a.status !== 'rejected' && a.status !== 'accepted' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(124,29,47,0.2)', color: 'var(--wine-light)', border: '1px solid rgba(124,29,47,0.4)' }} onClick={() => updateStatus(a, 'rejected')}>
                          <UserX size={13} /> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!filteredApps.length && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--smoke)' }}>
                  <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No hay postulantes en este estado aún.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: New vacancy ── */}
      {modal === 'vacancy' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--cream)' }}>Publicar nueva vacante</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              <div className="form-group"><label>Título del puesto *</label>
                <input className="input" placeholder="Ej: Pasante de Redes Sociales" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="form-group"><label>Descripción</label>
                <textarea className="input" rows={3} placeholder="¿Qué va a hacer el pasante?" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Orientación requerida</label>
                  <input className="input" placeholder="Ej: Comunicación" value={form.orientation_required || ''} onChange={e => setForm({ ...form, orientation_required: e.target.value })} /></div>
                <div className="form-group"><label>Horas por semana (máx. 20)</label>
                  <input className="input" type="number" min={1} max={20} placeholder="15" value={form.hours_per_week || ''} onChange={e => setForm({ ...form, hours_per_week: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Localidad</label>
                  <input className="input" placeholder="Ej: Capital, Godoy Cruz" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div className="form-group"><label>Vacantes disponibles</label>
                  <input className="input" type="number" min={1} placeholder="1" value={form.slots || ''} onChange={e => setForm({ ...form, slots: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Etiquetas (separadas por coma)</label>
                <input className="input" placeholder="Ej: Marketing, Redes, Diseño" value={form.tags || ''} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button className="btn btn-gold" onClick={createVacancy} style={{ flex: 1, justifyContent: 'center' }}>Publicar vacante</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
