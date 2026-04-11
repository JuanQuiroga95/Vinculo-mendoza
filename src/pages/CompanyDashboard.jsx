import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ProfileEditor from '../components/ProfileEditor'
import { getProfile, getUser, vacancyAPI, applicationAPI, profileAPI, setProfile, STATUS_LABELS, STATUS_BADGE } from '../utils/auth'
import { LayoutDashboard, Briefcase, Users, Plus, X, Clock, MapPin, Star, Check, UserX, Settings, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

const STATUS_NEXT      = { pending: 'reviewed', reviewed: 'interview', interview: 'accepted' }
const STATUS_BTN_LABEL = { pending: 'Marcar revisado', reviewed: 'Llamar a entrevista', interview: 'Aceptar pasante' }
const ORIENTATIONS = ['Comunicación','Arte','Economía','Informática','Ciencias Naturales','Ciencias Sociales','Humanidades','Técnica General','Eléctrica','Electrónica','Mecánica','Construcciones','Química']

export default function CompanyDashboard() {
  const [tab,          setTab]         = useState('inicio')
  const [vacancies,    setVacancies]   = useState([])
  const [applications, setApplications]= useState([])
  const [profileData,  setProfileData] = useState(null)
  const [loading,      setLoading]     = useState(false)
  const [modal,        setModal]       = useState(null) // 'new-vacancy' | 'edit-vacancy'
  const [editTarget,   setEditTarget]  = useState(null)
  const [form,         setForm]        = useState({ tags: '' })
  const [msg,          setMsg]         = useState('')
  const [filter,       setFilter]      = useState('all')
  const profile = getProfile()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [v, a, p] = await Promise.allSettled([
        vacancyAPI.getAll(), applicationAPI.getMine(), profileAPI.get()
      ])
      if (v.status === 'fulfilled') {
        const all = v.value.vacancies || []
        const myId = (p.status === 'fulfilled' ? p.value.profile?.id : null) || profile?.id
        setVacancies(all.filter(vac => vac.company_id === myId))
      }
      if (a.status === 'fulfilled') setApplications(a.value.applications || [])
      if (p.status === 'fulfilled') { setProfileData(p.value.profile); setProfile(p.value.profile) }
    } finally { setLoading(false) }
  }

  async function createVacancy() {
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      await vacancyAPI.create({ ...form, tags, hours_per_week: Number(form.hours_per_week) || 15 })
      setModal(null); setForm({ tags: '' }); setMsg('✅ Vacante publicada')
      loadAll()
    } catch(e) { setMsg(e.message) }
  }

  async function updateVacancy() {
    try {
      const tags = typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : (form.tags || [])
      await vacancyAPI.update({ ...form, tags, vacancy_id: editTarget.id, hours_per_week: Number(form.hours_per_week) || 15 })
      setModal(null); setForm({ tags: '' }); setEditTarget(null); setMsg('✅ Vacante actualizada')
      loadAll()
    } catch(e) { setMsg(e.message) }
  }

  async function toggleVacancy(v) {
    try {
      await vacancyAPI.update({ vacancy_id: v.id, ...v, tags: v.tags||[], active: !v.active })
      setMsg(`✅ Vacante ${!v.active ? 'activada' : 'desactivada'}`)
      loadAll()
    } catch(e) { setMsg(e.message) }
  }

  async function updateStatus(app, status) {
    try {
      await applicationAPI.update({ application_id: app.id, status })
      setMsg(`✅ Estado actualizado: ${STATUS_LABELS[status]}`)
      const a = await applicationAPI.getMine(); setApplications(a.applications || [])
    } catch(e) { setMsg(e.message) }
  }

  const myVacIds = new Set(vacancies.map(v => v.id))
  const myApps   = applications.filter(a => myVacIds.has(a.vacancy_id))
  const filteredApps = filter === 'all' ? myApps : myApps.filter(a => a.status === filter)
  const counts = { pending:0, reviewed:0, interview:0, accepted:0, rejected:0 }
  myApps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })

  const navItems = [
    { id:'inicio',      label:'Inicio',         icon:<LayoutDashboard size={16}/> },
    { id:'vacantes',    label:'Mis vacantes',    icon:<Briefcase size={16}/>, count:vacancies.length },
    { id:'postulantes', label:'Postulantes',     icon:<Users size={16}/>, count:counts.pending },
    { id:'perfil',      label:'Perfil empresa',  icon:<Settings size={16}/> },
  ]

  // Form helpers
  const VacancyForm = ({ onSubmit, btnLabel }) => (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div className="form-group"><label>Título de la pasantía *</label>
        <input className="input" placeholder="Ej: Pasante de Community Management" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="form-group"><label>Orientación requerida</label>
          <select className="input" value={form.orientation_required||''} onChange={e=>setForm({...form,orientation_required:e.target.value})}>
            <option value="">Cualquier orientación</option>
            {ORIENTATIONS.map(o=><option key={o} value={o}>{o}</option>)}
          </select></div>
        <div className="form-group"><label>Horas por semana (máx. 20)</label>
          <input className="input" type="number" min={1} max={20} value={form.hours_per_week||15} onChange={e=>setForm({...form,hours_per_week:e.target.value})}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="form-group"><label>Horario inicio</label>
          <input className="input" type="time" min="08:00" value={form.schedule_start||'08:00'} onChange={e=>setForm({...form,schedule_start:e.target.value})}/></div>
        <div className="form-group"><label>Horario fin (máx. 18:00)</label>
          <input className="input" type="time" max="18:00" value={form.schedule_end||'14:00'} onChange={e=>setForm({...form,schedule_end:e.target.value})}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="form-group"><label>Localidad</label>
          <input className="input" placeholder="Ej: Capital" value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})}/></div>
        <div className="form-group"><label>Vacantes disponibles</label>
          <input className="input" type="number" min={1} value={form.slots||1} onChange={e=>setForm({...form,slots:e.target.value})}/></div>
      </div>
      <div className="form-group"><label>Descripción</label>
        <textarea className="input" rows={3} placeholder="¿Qué va a hacer el pasante? ¿Qué requisitos son deseables?" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical'}}/></div>
      <div className="form-group"><label>Tags (separados por coma)</label>
        <input className="input" placeholder="Ej: Redes Sociales, Canva, Marketing" value={typeof form.tags==='string'?form.tags:(form.tags||[]).join(', ')} onChange={e=>setForm({...form,tags:e.target.value})}/></div>
      <div style={{display:'flex',gap:12,marginTop:4}}>
        <button className="btn btn-outline" onClick={()=>{setModal(null);setEditTarget(null)}} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
        <button className="btn btn-primary" onClick={onSubmit} style={{flex:1,justifyContent:'center'}}>{btnLabel}</button>
      </div>
    </div>
  )

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--gold)" />
      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.startsWith('✅')?'alert-success':'alert-error'}`} style={{marginBottom:20}} onClick={()=>setMsg('')}>{msg}<X size={14} style={{marginLeft:'auto',cursor:'pointer'}}/></div>}

        {/* INICIO */}
        {tab==='inicio' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header">
              <h2>{profileData?.company_name || profile?.company_name || 'Mi empresa'}</h2>
              <p>{profileData?.sector} {profileData?.location ? `· ${profileData.location}` : ''}</p>
            </div>
            <div className="grid-4" style={{marginBottom:32}}>
              {[
                {val:vacancies.filter(v=>v.active).length, label:'Vacantes activas',  color:'var(--gold)',       icon:<Briefcase size={18}/>},
                {val:myApps.length,                        label:'Postulaciones',      color:'var(--wine-light)', icon:<Users size={18}/>},
                {val:counts.pending,                       label:'Sin revisar',        color:'var(--teal)',       icon:<Star size={18}/>},
                {val:counts.accepted,                      label:'Pasantes aceptados', color:'var(--muted)',      icon:<Check size={18}/>},
              ].map(s=>(
                <div key={s.label} className="stat-card">
                  <div style={{color:s.color}}>{s.icon}</div>
                  <div className="stat-value" style={{color:s.color}}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            {counts.pending > 0 && (
              <div style={{background:'rgba(212,168,67,0.1)',border:'1px solid rgba(212,168,67,0.3)',borderRadius:'var(--r-md)',padding:'12px 16px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{color:'var(--gold)',fontSize:'0.9rem'}}>⚡ Tenés <strong>{counts.pending}</strong> postulacion{counts.pending>1?'es':''} sin revisar</span>
                <button className="btn btn-gold btn-sm" onClick={()=>setTab('postulantes')}>Ver ahora</button>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h3 style={{color:'var(--cream)'}}>Mis vacantes</h3>
              <button className="btn btn-gold btn-sm" onClick={()=>{setForm({tags:''});setModal('new-vacancy')}}><Plus size={16}/> Nueva vacante</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {vacancies.slice(0,4).map(v=>(
                <div key={v.id} className="card" style={{display:'flex',alignItems:'center',gap:12,opacity:v.active?1:0.6}}>
                  <div style={{flex:1}}>
                    <div style={{color:'var(--cream)',fontWeight:600,fontSize:'0.95rem'}}>{v.title}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--smoke)',marginTop:2}}>
                      {v.hours_per_week}h/sem · {v.location} {v.orientation_required?`· ${v.orientation_required}`:''}
                    </div>
                  </div>
                  <span className={v.active?'badge badge-teal':'badge badge-smoke'}>{v.active?'Activa':'Pausada'}</span>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>{setEditTarget(v);setForm({...v,tags:(v.tags||[]).join(', ')});setModal('edit-vacancy')}} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer',padding:4}}><Pencil size={14}/></button>
                    <button onClick={()=>toggleVacancy(v)} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer',padding:4}}>{v.active?<ToggleRight size={18} style={{color:'var(--teal)'}}/>:<ToggleLeft size={18}/>}</button>
                  </div>
                </div>
              ))}
              {!vacancies.length && (
                <div style={{textAlign:'center',padding:40,color:'var(--smoke)'}}>
                  <Briefcase size={40} style={{opacity:0.3,marginBottom:12}}/>
                  <p>Todavía no publicaste ninguna vacante. ¡Empezá ahora!</p>
                  <button className="btn btn-gold btn-sm" style={{marginTop:12}} onClick={()=>{setForm({tags:''});setModal('new-vacancy')}}><Plus size={16}/> Crear primera vacante</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VACANTES */}
        {tab==='vacantes' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div><h2>Mis vacantes</h2><p>Gestioná todas tus publicaciones</p></div>
              <button className="btn btn-gold btn-sm" onClick={()=>{setForm({tags:''});setModal('new-vacancy')}}><Plus size={16}/> Nueva vacante</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {vacancies.map(v=>(
                <div key={v.id} className="card" style={{opacity:v.active?1:0.65}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:8}}>
                    <div style={{flex:1}}>
                      <h4 style={{color:'var(--cream)',fontFamily:'var(--font-display)',marginBottom:4}}>{v.title}</h4>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        <span className="badge badge-smoke"><Clock size={11}/> {v.hours_per_week}h/sem</span>
                        <span className="badge badge-smoke"><MapPin size={11}/> {v.location}</span>
                        {v.orientation_required && <span className="badge badge-wine">{v.orientation_required}</span>}
                        {(v.tags||[]).map(t=><span key={t} className="badge badge-gold">{t}</span>)}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                      <span className={v.active?'badge badge-teal':'badge badge-smoke'}>{v.active?'Activa':'Pausada'}</span>
                      <button onClick={()=>{setEditTarget(v);setForm({...v,tags:(v.tags||[]).join(', ')});setModal('edit-vacancy')}} style={{background:'none',border:'1px solid var(--wine)',color:'var(--muted)',borderRadius:'var(--r-sm)',padding:'4px 8px',cursor:'pointer',fontSize:'0.78rem',display:'flex',alignItems:'center',gap:4}}><Pencil size={12}/> Editar</button>
                      <button onClick={()=>toggleVacancy(v)} style={{background:'none',border:'1px solid var(--wine)',color:'var(--muted)',borderRadius:'var(--r-sm)',padding:'4px 8px',cursor:'pointer',fontSize:'0.78rem'}}>{v.active?'Pausar':'Activar'}</button>
                    </div>
                  </div>
                  {v.description && <p style={{fontSize:'0.85rem',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:8,marginTop:8}}>{v.description}</p>}
                  <div style={{fontSize:'0.78rem',color:'var(--smoke)',marginTop:8}}>
                    Horario: {v.schedule_start?.slice(0,5)||'08:00'} – {v.schedule_end?.slice(0,5)||'18:00'} · {v.slots} vacante{v.slots!==1?'s':''}
                  </div>
                </div>
              ))}
              {!vacancies.length && <div style={{textAlign:'center',padding:60,color:'var(--smoke)'}}><Briefcase size={40} style={{opacity:0.3,marginBottom:12}}/><p>No tenés vacantes aún.</p></div>}
            </div>
          </div>
        )}

        {/* POSTULANTES */}
        {tab==='postulantes' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header"><h2>Postulantes</h2><p>Revisá y gestioná cada candidato</p></div>
            <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
              {['all','pending','reviewed','interview','accepted','rejected'].map(f=>(
                <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline'}`} onClick={()=>setFilter(f)}>
                  {f==='all'?'Todos':STATUS_LABELS[f]} {f!=='all'&&counts[f]>0?`(${counts[f]})`:''}</button>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {filteredApps.map(a=>(
                <div key={a.id} className="card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(212,168,67,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',fontWeight:700,fontSize:'0.85rem',flexShrink:0}}>{a.student_name?.charAt(0)||'A'}</div>
                        <div>
                          <div style={{color:'var(--cream)',fontWeight:600,fontSize:'0.95rem'}}>{a.student_name}</div>
                          <div style={{fontSize:'0.78rem',color:'var(--smoke)'}}>{a.school} · {a.orientation} · {a.grade}</div>
                        </div>
                      </div>
                      <div style={{fontSize:'0.82rem',color:'var(--teal)',marginTop:4}}>Para: {a.vacancy_title}</div>
                      {a.cover_note && <p style={{fontSize:'0.82rem',marginTop:8,fontStyle:'italic',borderLeft:'2px solid var(--wine)',paddingLeft:10}}>"{a.cover_note}"</p>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',flexShrink:0}}>
                      <span className={`badge ${STATUS_BADGE[a.status]||'badge-smoke'}`}>{STATUS_LABELS[a.status]}</span>
                      {STATUS_NEXT[a.status] && (
                        <button className="btn btn-sm btn-primary" style={{fontSize:'0.78rem'}} onClick={()=>updateStatus(a, STATUS_NEXT[a.status])}>
                          <Check size={12}/> {STATUS_BTN_LABEL[a.status]}
                        </button>
                      )}
                      {a.status !== 'rejected' && (
                        <button className="btn btn-sm btn-outline" style={{fontSize:'0.78rem',color:'var(--wine-light)',borderColor:'var(--wine)'}} onClick={()=>updateStatus(a,'rejected')}>
                          <UserX size={12}/> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!filteredApps.length && <div style={{textAlign:'center',padding:60,color:'var(--smoke)'}}><Users size={40} style={{opacity:0.3,marginBottom:12}}/><p>No hay postulantes en este estado.</p></div>}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {tab==='perfil' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header"><h2>Perfil de empresa</h2><p>Completá tu perfil para atraer mejores candidatos</p></div>
            <ProfileEditor role="company" initialData={profileData||profile} onSaved={p=>{setProfileData(p);setProfile(p);setMsg('✅ Perfil actualizado')}}/>
          </div>
        )}
      </main>

      {/* MODAL: Nueva/editar vacante */}
      {(modal==='new-vacancy'||modal==='edit-vacancy') && (
        <div className="modal-overlay" onClick={()=>{setModal(null);setEditTarget(null)}}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{color:'var(--cream)'}}>{modal==='new-vacancy'?'Nueva vacante':'Editar vacante'}</h3>
              <button onClick={()=>{setModal(null);setEditTarget(null)}} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <VacancyForm
              onSubmit={modal==='new-vacancy'?createVacancy:updateVacancy}
              btnLabel={modal==='new-vacancy'?'Publicar vacante':'Guardar cambios'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
