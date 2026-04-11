import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ProfileEditor from '../components/ProfileEditor'
import { getProfile, getUser, teacherAPI, adminAPI, profileAPI, setProfile, STATUS_LABELS, STATUS_BADGE } from '../utils/auth'
import { LayoutDashboard, Users, Award, BookOpen, X, Plus, Check, User, GraduationCap, CheckCircle } from 'lucide-react'

const SKILLS = ['Trabajo en equipo','Liderazgo','Comunicación oral','Comunicación escrita','Resolución de problemas','Responsabilidad','Proactividad','Capacidad analítica','Creatividad','Puntualidad','Adaptabilidad']
const ORIENTATIONS = ['Comunicación','Arte','Economía','Informática','Ciencias Naturales','Ciencias Sociales','Humanidades','Técnica General','Eléctrica','Electrónica','Mecánica','Construcciones','Química']
const GRADES = ['1er año','2do año','3er año','4to año','5to año','6to año','7mo año']

export default function TeacherDashboard() {
  const [tab, setTab] = useState('inicio')
  const [students, setStudents] = useState([])
  const [logbook, setLogbook]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({})
  const [msg, setMsg]           = useState('')
  const [profileData, setProfileData] = useState(null)
  const user    = getUser()
  const profile = getProfile()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [sd, pd] = await Promise.allSettled([teacherAPI.getStudents(), profileAPI.get()])
      if (sd.status === 'fulfilled') setStudents(sd.value.students || [])
      if (pd.status === 'fulfilled') { setProfileData(pd.value.profile); setProfile(pd.value.profile) }
    } finally { setLoading(false) }
  }

  async function createStudent() {
    try {
      await adminAPI.createUser({ ...form, role:'student', school_id: profileData?.school_id })
      setMsg('✅ Alumno creado correctamente'); setModal(null); setForm({})
      loadData()
    } catch(e) { setMsg(e.message) }
  }

  async function validateSkill() {
    try {
      await teacherAPI.validateSkill({ student_id: selected.id, skill: form.skill, note: form.note })
      setMsg(`✅ Habilidad "${form.skill}" validada`); setModal(null); setForm({})
    } catch(e) { setMsg(e.message) }
  }

  const pendingLogbook = logbook.filter(e => !e.approved_by_teacher).length

  const navItems = [
    { id:'inicio',      label:'Panel general',    icon:<LayoutDashboard size={16}/> },
    { id:'alumnos',     label:'Mis alumnos',       icon:<Users size={16}/>, count:students.length },
    { id:'validaciones',label:'Validar habilidades',icon:<Award size={16}/> },
    { id:'perfil',      label:'Mi perfil',          icon:<User size={16}/> },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--teal)" />
      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.startsWith('✅')?'alert-success':'alert-error'}`} style={{marginBottom:20}} onClick={()=>setMsg('')}>{msg}<X size={14} style={{marginLeft:'auto',cursor:'pointer'}}/></div>}

        {/* INICIO */}
        {tab==='inicio' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header">
              <h2>{profileData?.full_name || profile?.full_name || 'Docente'}</h2>
              <p>{profileData?.school||profileData?.school_name} {profileData?.subject ? `· ${profileData.subject}` : ''}</p>
            </div>
            <div className="grid-4" style={{marginBottom:32}}>
              {[
                {val:students.length,       label:'Alumnos tutorados', color:'var(--teal)',       icon:<Users size={18}/>},
                {val:students.filter(s=>Number(s.application_count||0)>0).length, label:'Con postulaciones', color:'var(--wine-light)', icon:<GraduationCap size={18}/>},
                {val:students.reduce((a,s)=>a+Number(s.skill_count||0),0), label:'Habilidades validadas', color:'var(--gold)', icon:<Award size={18}/>},
                {val:students.reduce((a,s)=>a+Number(s.portfolio_count||0),0), label:'Items en portafolio', color:'var(--muted)', icon:<BookOpen size={18}/>},
              ].map(s=>(
                <div key={s.label} className="stat-card">
                  <div style={{color:s.color}}>{s.icon}</div>
                  <div className="stat-value" style={{color:s.color}}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h3 style={{color:'var(--cream)'}}>Alumnos recientes</h3>
              <button className="btn btn-primary btn-sm" onClick={()=>{setForm({});setModal('student')}}><Plus size={16}/> Nuevo alumno</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {students.slice(0,5).map(s=>(
                <div key={s.id} className="card" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
                  {s.avatar_url
                    ? <img src={s.avatar_url} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                    : <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(27,186,170,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--teal)',fontWeight:700,flexShrink:0}}>{s.full_name?.charAt(0)||'A'}</div>
                  }
                  <div style={{flex:1}}>
                    <div style={{color:'var(--cream)',fontWeight:600,fontSize:'0.95rem'}}>{s.full_name}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--smoke)'}}>{s.orientation} · {s.grade}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    {Number(s.portfolio_count||0)>0 && <span className="badge badge-smoke">{s.portfolio_count} proyectos</span>}
                    {Number(s.application_count||0)>0 && <span className="badge badge-wine">{s.application_count} postulac.</span>}
                    <button className="btn btn-outline btn-sm" onClick={()=>{setSelected(s);setModal('validate')}}>Validar</button>
                  </div>
                </div>
              ))}
              {!students.length && <div style={{textAlign:'center',padding:40,color:'var(--smoke)'}}>No creaste alumnos aún. ¡Empezá registrando tu primer alumno!</div>}
            </div>
          </div>
        )}

        {/* ALUMNOS */}
        {tab==='alumnos' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div><h2>Mis alumnos</h2><p>Alumnos que creaste y supervisás</p></div>
              <button className="btn btn-primary btn-sm" onClick={()=>{setForm({});setModal('student')}}><Plus size={16}/> Nuevo alumno</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {students.map(s=>(
                <div key={s.id} className="card">
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                      : <div style={{width:44,height:44,borderRadius:'50%',background:'rgba(27,186,170,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--teal)',fontWeight:700,fontSize:'1.1rem',flexShrink:0}}>{s.full_name?.charAt(0)||'A'}</div>
                    }
                    <div style={{flex:1}}>
                      <div style={{color:'var(--cream)',fontWeight:600}}>{s.full_name}</div>
                      <div style={{fontSize:'0.82rem',color:'var(--smoke)',marginTop:2}}>{s.email} · {s.orientation} · {s.grade}</div>
                      {s.bio && <div style={{fontSize:'0.82rem',color:'var(--muted)',marginTop:4,fontStyle:'italic'}}>"{s.bio}"</div>}
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={()=>{setSelected(s);setModal('validate')}}>
                      <Award size={14}/> Validar habilidad
                    </button>
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                    {Number(s.application_count||0)>0 && <span className="badge badge-wine">{s.application_count} postulaciones</span>}
                    {Number(s.portfolio_count||0)>0  && <span className="badge badge-smoke">{s.portfolio_count} proyectos</span>}
                    {Number(s.skill_count||0)>0      && <span className="badge badge-teal"><CheckCircle size={10}/> {s.skill_count} habilidades validadas</span>}
                    {(s.interests||[]).slice(0,3).map(i=><span key={i} className="badge badge-gold">{i}</span>)}
                  </div>
                </div>
              ))}
              {!students.length && <div style={{textAlign:'center',padding:60,color:'var(--smoke)'}}><Users size={40} style={{opacity:0.3,marginBottom:12}}/><p>Todavía no tenés alumnos. Creá el primero con el botón de arriba.</p></div>}
            </div>
          </div>
        )}

        {/* VALIDACIONES */}
        {tab==='validaciones' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header"><h2>Validar habilidades</h2><p>Certificá competencias de tus alumnos</p></div>
            <div className="grid-3">
              {students.map(s=>(
                <div key={s.id} className="card card-glow" style={{cursor:'pointer'}} onClick={()=>{setSelected(s);setModal('validate')}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(27,186,170,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--teal)',fontWeight:700,flexShrink:0}}>{s.full_name?.charAt(0)}</div>
                    <div>
                      <div style={{color:'var(--cream)',fontWeight:600,fontSize:'0.95rem'}}>{s.full_name}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--smoke)'}}>{s.orientation}</div>
                    </div>
                  </div>
                  {Number(s.skill_count||0)>0 && <p style={{fontSize:'0.82rem',color:'var(--teal)'}}><Check size={12}/> {s.skill_count} habilidades ya validadas</p>}
                  <button className="btn btn-outline btn-sm" style={{width:'100%',justifyContent:'center',marginTop:8}}><Award size={14}/> Validar habilidad</button>
                </div>
              ))}
              {!students.length && <div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--smoke)'}}>Primero creá alumnos para poder validar sus habilidades.</div>}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {tab==='perfil' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header"><h2>Mi perfil docente</h2><p>Actualizá tu información personal y profesional</p></div>
            <ProfileEditor role="teacher" initialData={profileData||profile} onSaved={p=>{setProfileData(p);setMsg('✅ Perfil actualizado')}}/>
          </div>
        )}
      </main>

      {/* MODAL: nuevo alumno */}
      {modal==='student' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{color:'var(--cream)'}}>Nuevo alumno</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="form-group"><label>Nombre completo *</label>
                <input className="input" placeholder="Ej: Valentina Pérez" value={form.full_name||''} onChange={e=>setForm({...form,full_name:e.target.value})}/></div>
              <div className="form-group"><label>Email *</label>
                <input className="input" type="email" placeholder="alumno@correo.com" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div className="form-group"><label>Contraseña inicial *</label>
                <input className="input" type="password" placeholder="Mín. 8 caracteres" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="form-group"><label>Orientación</label>
                  <select className="input" value={form.orientation||''} onChange={e=>setForm({...form,orientation:e.target.value})}>
                    <option value="">Seleccionar</option>
                    {ORIENTATIONS.map(o=><option key={o} value={o}>{o}</option>)}
                  </select></div>
                <div className="form-group"><label>Año</label>
                  <select className="input" value={form.grade||''} onChange={e=>setForm({...form,grade:e.target.value})}>
                    <option value="">Seleccionar</option>
                    {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
                  </select></div>
              </div>
              <div className="form-group"><label>Localidad</label>
                <input className="input" placeholder="Ej: Capital" value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})}/></div>
            </div>
            <div style={{display:'flex',gap:12,marginTop:16}}>
              <button className="btn btn-outline" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
              <button className="btn btn-primary" onClick={createStudent} style={{flex:1,justifyContent:'center'}}>Crear alumno</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: validar habilidad */}
      {modal==='validate' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div><h3 style={{color:'var(--cream)'}}>Validar habilidad</h3><p style={{fontSize:'0.85rem',color:'var(--teal)'}}>{selected.full_name}</p></div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group"><label>Habilidad a validar</label>
                <select className="input" value={form.skill||''} onChange={e=>setForm({...form,skill:e.target.value})}>
                  <option value="">Seleccionar habilidad</option>
                  {SKILLS.map(s=><option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="form-group"><label>Nota o comentario (opcional)</label>
                <textarea className="input" rows={3} placeholder="¿Por qué validás esta habilidad?" value={form.note||''} onChange={e=>setForm({...form,note:e.target.value})} style={{resize:'vertical'}}/></div>
              <div style={{display:'flex',gap:12}}>
                <button className="btn btn-outline" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
                <button className="btn btn-teal" onClick={validateSkill} style={{flex:1,justifyContent:'center'}}><Check size={16}/> Validar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
