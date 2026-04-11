import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { adminAPI, getProfile } from '../utils/auth'
import { LayoutDashboard, Building2, Users, Plus, X, School, Briefcase, BookOpen, GraduationCap, Pencil, Globe, Phone, MapPin, Mail } from 'lucide-react'

const ROLE_LABELS = { student:'Alumno', teacher:'Docente', company:'Empresa', admin:'Admin' }
const ROLE_BADGE  = { student:'badge-wine', teacher:'badge-teal', company:'badge-gold', admin:'badge-smoke' }
const ORIENTATIONS = ['Comunicación','Arte','Economía','Informática','Ciencias Naturales','Ciencias Sociales','Humanidades','Técnica General']
const GRADES = ['1er año','2do año','3er año','4to año','5to año','6to año','7mo año']
const SECTORS = ['Tecnología / TIC','Agroindustria / Vitivinicultura','Salud','Educación','Turismo','Construcción','Comercio','Servicios','Industria','Otro']

export default function AdminDashboard() {
  const [tab, setTab] = useState('inicio')
  const [users, setUsers] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // 'school'|'user'|'edit-school'
  const [form, setForm] = useState({})
  const [editTarget, setEditTarget] = useState(null)
  const [msg, setMsg] = useState('')
  const profile = getProfile()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [u, s] = await Promise.allSettled([adminAPI.getUsers(), adminAPI.getSchools()])
      if (u.status === 'fulfilled') setUsers(u.value.users || [])
      if (s.status === 'fulfilled') setSchools(s.value.schools || [])
    } finally { setLoading(false) }
  }

  async function createSchool() {
    try {
      await adminAPI.createSchool(form)
      setMsg('✅ Escuela creada'); setModal(null); setForm({})
      loadAll()
    } catch(e) { setMsg(e.message) }
  }

  async function updateSchool() {
    try {
      await adminAPI.updateSchool({ school_id: editTarget.id, ...form })
      setMsg('✅ Escuela actualizada'); setModal(null); setForm({}); setEditTarget(null)
      loadAll()
    } catch(e) { setMsg(e.message) }
  }

  async function createUser() {
    try {
      await adminAPI.createUser(form)
      setMsg(`✅ ${ROLE_LABELS[form.role] || 'Usuario'} creado`); setModal(null); setForm({})
      loadAll()
    } catch(e) { setMsg(e.message) }
  }

  const counts = { student:0, teacher:0, company:0, admin:0 }
  users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++ })

  const navItems = [
    { id:'inicio',   label:'Panel general',   icon:<LayoutDashboard size={16}/> },
    { id:'escuelas', label:'Escuelas',         icon:<School size={16}/>, count:schools.length },
    { id:'empresas', label:'Empresas',         icon:<Briefcase size={16}/>, count:counts.company },
    { id:'docentes', label:'Docentes',         icon:<BookOpen size={16}/>, count:counts.teacher },
    { id:'usuarios', label:'Todos los usuarios', icon:<Users size={16}/>, count:users.length },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar items={navItems} active={tab} onSelect={setTab} accentColor="var(--smoke)" />
      <main className="dashboard-main">
        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success':'alert-error'}`} style={{marginBottom:20}} onClick={()=>setMsg('')}>{msg} <X size={14} style={{marginLeft:'auto',cursor:'pointer'}}/></div>}

        {/* INICIO */}
        {tab === 'inicio' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header">
              <h2>Panel de Administración</h2>
              <p>Gestioná toda la plataforma desde acá</p>
            </div>
            <div className="grid-4" style={{marginBottom:32}}>
              {[
                {val:schools.length,   label:'Escuelas',  color:'var(--teal)',  icon:<School size={18}/>},
                {val:counts.teacher,   label:'Docentes',  color:'var(--teal)',  icon:<BookOpen size={18}/>},
                {val:counts.student,   label:'Alumnos',   color:'var(--wine-light)', icon:<GraduationCap size={18}/>},
                {val:counts.company,   label:'Empresas',  color:'var(--gold)',  icon:<Briefcase size={18}/>},
              ].map(s=>(
                <div key={s.label} className="stat-card">
                  <div style={{color:s.color}}>{s.icon}</div>
                  <div className="stat-value" style={{color:s.color}}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <button className="card" style={{textAlign:'left',cursor:'pointer',border:'1.5px dashed var(--wine)'}} onClick={()=>{setForm({});setModal('school')}}>
                <School size={24} style={{color:'var(--teal)',marginBottom:8}}/>
                <h4 style={{color:'var(--cream)',marginBottom:4}}>Nueva escuela</h4>
                <p style={{fontSize:'0.85rem'}}>Registrá una escuela para que sus docentes puedan crear alumnos.</p>
              </button>
              <button className="card" style={{textAlign:'left',cursor:'pointer',border:'1.5px dashed var(--gold)'}} onClick={()=>{setForm({role:'company'});setModal('user')}}>
                <Briefcase size={24} style={{color:'var(--gold)',marginBottom:8}}/>
                <h4 style={{color:'var(--cream)',marginBottom:4}}>Nueva empresa</h4>
                <p style={{fontSize:'0.85rem'}}>Registrá una empresa para que pueda publicar vacantes.</p>
              </button>
              <button className="card" style={{textAlign:'left',cursor:'pointer',border:'1.5px dashed var(--teal)'}} onClick={()=>{setForm({role:'teacher'});setModal('user')}}>
                <BookOpen size={24} style={{color:'var(--teal)',marginBottom:8}}/>
                <h4 style={{color:'var(--cream)',marginBottom:4}}>Nuevo docente</h4>
                <p style={{fontSize:'0.85rem'}}>Creá un docente vinculado a una escuela existente.</p>
              </button>
              <button className="card" style={{textAlign:'left',cursor:'pointer',border:'1.5px dashed var(--wine-light)'}} onClick={()=>setTab('usuarios')}>
                <Users size={24} style={{color:'var(--wine-light)',marginBottom:8}}/>
                <h4 style={{color:'var(--cream)',marginBottom:4}}>Ver todos los usuarios</h4>
                <p style={{fontSize:'0.85rem'}}>{users.length} usuarios registrados en la plataforma.</p>
              </button>
            </div>
          </div>
        )}

        {/* ESCUELAS */}
        {tab === 'escuelas' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div><h2>Escuelas</h2><p>Gestioná las instituciones educativas</p></div>
              <button className="btn btn-primary btn-sm" onClick={()=>{setForm({});setModal('school')}}><Plus size={16}/> Nueva escuela</button>
            </div>
            <div className="grid-3">
              {schools.map(s=>(
                <div key={s.id} className="card card-glow">
                  {s.logo_url && <img src={s.logo_url} alt={s.name} style={{width:56,height:56,borderRadius:'var(--r-md)',objectFit:'cover',marginBottom:12}}/>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <h4 style={{color:'var(--cream)',fontSize:'1rem',flex:1}}>{s.name}</h4>
                    <button onClick={()=>{setEditTarget(s);setForm({...s});setModal('edit-school')}} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer',padding:4}}><Pencil size={14}/></button>
                  </div>
                  <span className="badge badge-smoke" style={{marginBottom:8}}>{s.type}</span>
                  {s.city && <p style={{fontSize:'0.82rem',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/> {s.city}{s.department ? `, ${s.department}`:''}</p>}
                  {s.director_name && <p style={{fontSize:'0.82rem',marginTop:4}}>Dir: {s.director_name}</p>}
                  {s.email && <p style={{fontSize:'0.82rem',color:'var(--teal)',marginTop:4,display:'flex',alignItems:'center',gap:4}}><Mail size={11}/> {s.email}</p>}
                </div>
              ))}
              {!schools.length && <div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--smoke)'}}><School size={40} style={{opacity:0.3,marginBottom:12}}/><p>Todavía no hay escuelas registradas.</p></div>}
            </div>
          </div>
        )}

        {/* EMPRESAS */}
        {tab === 'empresas' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div><h2>Empresas</h2><p>Empresas registradas en la plataforma</p></div>
              <button className="btn btn-gold btn-sm" onClick={()=>{setForm({role:'company'});setModal('user')}}><Plus size={16}/> Nueva empresa</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {users.filter(u=>u.role==='company').map(u=>(
                <div key={u.id} className="card" style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:44,height:44,borderRadius:'var(--r-md)',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>🏢</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'var(--font-display)',color:'var(--cream)',fontSize:'1.1rem'}}>{u.display_name}</div>
                    <div style={{fontSize:'0.82rem',color:'var(--smoke)',marginTop:2}}>{u.detail} · {u.email}</div>
                  </div>
                  <span className="badge badge-gold">Empresa</span>
                </div>
              ))}
              {!users.filter(u=>u.role==='company').length && <div style={{textAlign:'center',padding:40,color:'var(--smoke)'}}>No hay empresas aún.</div>}
            </div>
          </div>
        )}

        {/* DOCENTES */}
        {tab === 'docentes' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div><h2>Docentes</h2><p>Tutores registrados por escuela</p></div>
              <button className="btn btn-primary btn-sm" onClick={()=>{setForm({role:'teacher'});setModal('user')}}><Plus size={16}/> Nuevo docente</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {users.filter(u=>u.role==='teacher').map(u=>(
                <div key={u.id} className="card" style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(27,186,170,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--teal)',fontWeight:700,flexShrink:0}}>
                    {u.display_name?.charAt(0)||'D'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:'var(--cream)',fontWeight:600}}>{u.display_name}</div>
                    <div style={{fontSize:'0.82rem',color:'var(--smoke)'}}>{u.school_name||u.detail} · {u.email}</div>
                  </div>
                  <span className="badge badge-teal">Docente</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TODOS LOS USUARIOS */}
        {tab === 'usuarios' && (
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div className="dashboard-header"><h2>Todos los usuarios</h2><p>{users.length} registrados</p></div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {users.map(u=>(
                <div key={u.id} className="card" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--cream)',fontSize:'0.85rem',flexShrink:0}}>
                    {(u.display_name||u.email||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:'var(--cream)',fontWeight:600,fontSize:'0.95rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.display_name||'—'}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--smoke)'}}>{u.email} {u.school_name ? `· ${u.school_name}`:''}</div>
                  </div>
                  <span className={`badge ${ROLE_BADGE[u.role]||'badge-smoke'}`}>{ROLE_LABELS[u.role]||u.role}</span>
                  <div style={{fontSize:'0.75rem',color:'var(--smoke)',flexShrink:0}}>{new Date(u.created_at).toLocaleDateString('es-AR')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Nueva/editar escuela */}
      {(modal==='school'||modal==='edit-school') && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{color:'var(--cream)'}}>{modal==='school'?'Nueva escuela':'Editar escuela'}</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label>Nombre de la institución *</label>
                <input className="input" placeholder="Ej: EMETA N°1 - Mendoza" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div className="form-group"><label>CUE</label>
                <input className="input" placeholder="Código único" value={form.cue||''} onChange={e=>setForm({...form,cue:e.target.value})}/></div>
              <div className="form-group"><label>Tipo</label>
                <select className="input" value={form.type||'orientada'} onChange={e=>setForm({...form,type:e.target.value})}>
                  <option value="orientada">Orientada</option>
                  <option value="tecnica">Técnica</option>
                  <option value="mixta">Mixta</option>
                </select></div>
              <div className="form-group"><label>Ciudad</label>
                <input className="input" placeholder="Ej: Ciudad" value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})}/></div>
              <div className="form-group"><label>Departamento</label>
                <input className="input" placeholder="Ej: Capital" value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></div>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label>Dirección</label>
                <input className="input" placeholder="Ej: Av. San Martín 1200" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
              <div className="form-group"><label>Director/a</label>
                <input className="input" placeholder="Nombre completo" value={form.director_name||''} onChange={e=>setForm({...form,director_name:e.target.value})}/></div>
              <div className="form-group"><label>Teléfono</label>
                <input className="input" placeholder="0261-..." value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
              <div className="form-group"><label>Email institucional</label>
                <input className="input" type="email" placeholder="escuela@mendoza.edu.ar" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div className="form-group"><label>Sitio web</label>
                <input className="input" placeholder="https://..." value={form.website||''} onChange={e=>setForm({...form,website:e.target.value})}/></div>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label>URL del logo</label>
                <input className="input" placeholder="https://... (imagen cuadrada recomendada)" value={form.logo_url||''} onChange={e=>setForm({...form,logo_url:e.target.value})}/></div>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label>Descripción</label>
                <textarea className="input" rows={2} placeholder="Breve descripción de la institución" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical'}}/></div>
            </div>
            <div style={{display:'flex',gap:12,marginTop:8}}>
              <button className="btn btn-outline" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
              <button className="btn btn-primary" onClick={modal==='school'?createSchool:updateSchool} style={{flex:1,justifyContent:'center'}}>
                {modal==='school'?'Crear escuela':'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo usuario */}
      {modal==='user' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{color:'var(--cream)'}}>Nuevo {ROLE_LABELS[form.role]||'usuario'}</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'var(--smoke)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',gap:8,marginBottom:4}}>
                {['company','teacher'].map(r=>(
                  <button key={r} className={`btn btn-sm ${form.role===r?'btn-primary':'btn-outline'}`} onClick={()=>setForm({...form,role:r})} style={{flex:1,justifyContent:'center'}}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              <div className="form-group"><label>{form.role==='company'?'Razón social':'Nombre completo'} *</label>
                <input className="input" placeholder={form.role==='company'?'Ej: Bodega Zuccardi':'Ej: Prof. Juan Pérez'} value={form.full_name||''} onChange={e=>setForm({...form,full_name:e.target.value})}/></div>
              <div className="form-group"><label>Email *</label>
                <input className="input" type="email" placeholder="correo@ejemplo.com" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div className="form-group"><label>Contraseña inicial *</label>
                <input className="input" type="password" placeholder="Mín. 8 caracteres" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})}/></div>

              {form.role==='teacher' && (<>
                <div className="form-group"><label>Escuela</label>
                  <select className="input" value={form.school_id||''} onChange={e=>setForm({...form,school_id:e.target.value})}>
                    <option value="">Sin asignar</option>
                    {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div className="form-group"><label>Materia</label>
                  <input className="input" placeholder="Ej: Proyecto Vocacional" value={form.subject||''} onChange={e=>setForm({...form,subject:e.target.value})}/></div>
              </>)}

              {form.role==='company' && (<>
                <div className="form-group"><label>Sector</label>
                  <select className="input" value={form.sector||''} onChange={e=>setForm({...form,sector:e.target.value})}>
                    <option value="">Seleccionar sector</option>
                    {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group"><label>Ciudad</label>
                    <input className="input" placeholder="Ej: Capital" value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})}/></div>
                  <div className="form-group"><label>Departamento</label>
                    <input className="input" placeholder="Ej: Capital" value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></div>
                </div>
                <div className="form-group"><label>Nombre del contacto</label>
                  <input className="input" placeholder="Persona de contacto en RRHH" value={form.contact_name||''} onChange={e=>setForm({...form,contact_name:e.target.value})}/></div>
              </>)}
            </div>
            <div style={{display:'flex',gap:12,marginTop:16}}>
              <button className="btn btn-outline" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
              <button className="btn btn-primary" onClick={createUser} style={{flex:1,justifyContent:'center'}}>Crear {ROLE_LABELS[form.role]||'usuario'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
