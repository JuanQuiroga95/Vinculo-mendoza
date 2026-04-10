import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI, setToken, setUser, setProfile } from '../utils/auth'
import { GraduationCap, Briefcase, BookOpen, ArrowLeft, ArrowRight, Check } from 'lucide-react'

const ORIENTATIONS = ['Arte', 'Ciencias Naturales', 'Ciencias Sociales', 'Comunicación', 'Economía y Administración', 'Educación Física', 'Humanidades', 'Informática', 'Lenguas Extranjeras', 'Turismo', 'Agro y Ambiente', 'Técnica - Electrónica', 'Técnica - Mecánica', 'Técnica - Construcciones', 'Técnica - Química']
const SECTORS = ['Tecnología / TIC', 'Agro / Vitivinicultura', 'Turismo y Hotelería', 'Comercio y Retail', 'Industria / Manufactura', 'Salud', 'Educación', 'Estudio Contable / Legal', 'Publicidad y Marketing', 'Gastronomía', 'Construcción', 'Arte y Cultura', 'Otro']
const GRADES = ['4to año', '5to año', '6to año', '7mo año (Técnica)']

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(params.get('rol') || '')
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [profile, setProfileData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.get('rol')) { setRole(params.get('rol')); setStep(2) }
  }, [])

  const up = (k, v) => setProfileData(p => ({ ...p, [k]: v }))

  async function handleSubmit() {
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setError(''); setLoading(true)
    try {
      const data = await authAPI.register({ email: form.email, password: form.password, role, profileData: profile })
      setToken(data.token); setUser(data.user); setProfile(data.profile)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const roles = [
    { id: 'student', icon: <GraduationCap size={32} />, label: 'Alumno', color: 'var(--wine-light)', desc: 'Tengo 16–18 años y busco mi primera experiencia laboral' },
    { id: 'company', icon: <Briefcase size={32} />, label: 'Empresa', color: 'var(--gold)', desc: 'Quiero acceder a talento joven para pasantías' },
    { id: 'teacher', icon: <BookOpen size={32} />, label: 'Docente / Tutor', color: 'var(--teal)', desc: 'Superviso alumnos en prácticas profesionalizantes' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,29,47,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 580, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--wine)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>V</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)' }}>
              Vínculo <span style={{ color: 'var(--gold)' }}>Mendoza</span>
            </span>
          </Link>

          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700,
                  background: step >= s ? 'var(--wine)' : 'rgba(255,255,255,0.08)',
                  color: step >= s ? 'var(--cream)' : 'var(--smoke)',
                  border: step === s ? '2px solid var(--gold)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? 'var(--wine)' : 'rgba(255,255,255,0.1)', borderRadius: 1, transition: 'background 0.3s' }} />}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--smoke)', marginTop: 8 }}>
            {step === 1 ? 'Elegí tu perfil' : step === 2 ? 'Tus datos' : 'Crear cuenta'}
          </p>
        </div>

        <div style={{ background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.1)', borderRadius: 'var(--r-xl)', padding: 36, animation: 'fadeUp 0.4s ease' }}>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          {/* ── STEP 1: Role ── */}
          {step === 1 && (
            <div>
              <h3 style={{ textAlign: 'center', marginBottom: 24, color: 'var(--cream)' }}>¿Quién sos?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {roles.map(r => (
                  <button key={r.id} onClick={() => { setRole(r.id); setStep(2) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                      background: role === r.id ? `rgba(${r.id === 'student' ? '124,29,47' : r.id === 'company' ? '212,168,67' : '27,186,170'},0.15)` : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${role === r.id ? r.color : 'rgba(250,245,237,0.1)'}`,
                      borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = r.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = role === r.id ? r.color : 'rgba(250,245,237,0.1)'}
                  >
                    <div style={{ color: r.color, flexShrink: 0 }}>{r.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--smoke)' }}>{r.desc}</div>
                    </div>
                    <ArrowRight size={18} style={{ marginLeft: 'auto', color: r.color, flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Profile data ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ color: 'var(--cream)', marginBottom: 4 }}>
                {role === 'student' ? 'Tu perfil escolar' : role === 'company' ? 'Datos de la empresa' : 'Datos docentes'}
              </h3>

              {role === 'student' && <>
                <div className="form-group"><label>Nombre completo</label>
                  <input className="input" placeholder="Ej: Valentina Pérez" value={profile.full_name || ''} onChange={e => up('full_name', e.target.value)} required /></div>
                <div className="form-group"><label>Escuela</label>
                  <input className="input" placeholder="Ej: EMETA N°1 - Mendoza" value={profile.school || ''} onChange={e => up('school', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label>Orientación</label>
                    <select className="input" value={profile.orientation || ''} onChange={e => up('orientation', e.target.value)}>
                      <option value="">Seleccionar</option>
                      {ORIENTATIONS.map(o => <option key={o}>{o}</option>)}
                    </select></div>
                  <div className="form-group"><label>Año</label>
                    <select className="input" value={profile.grade || ''} onChange={e => up('grade', e.target.value)}>
                      <option value="">Seleccionar</option>
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select></div>
                </div>
                <div className="form-group"><label>Fecha de nacimiento</label>
                  <input className="input" type="date" value={profile.birth_date || ''} onChange={e => up('birth_date', e.target.value)} /></div>
              </>}

              {role === 'company' && <>
                <div className="form-group"><label>Nombre de la empresa</label>
                  <input className="input" placeholder="Ej: Bodega Aconcagua S.A." value={profile.company_name || ''} onChange={e => up('company_name', e.target.value)} required /></div>
                <div className="form-group"><label>Nombre del responsable</label>
                  <input className="input" placeholder="Tu nombre y apellido" value={profile.contact_name || ''} onChange={e => up('contact_name', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label>Sector</label>
                    <select className="input" value={profile.sector || ''} onChange={e => up('sector', e.target.value)}>
                      <option value="">Seleccionar</option>
                      {SECTORS.map(s => <option key={s}>{s}</option>)}
                    </select></div>
                  <div className="form-group"><label>Localidad</label>
                    <input className="input" placeholder="Ej: Capital, Luján, Maipú" value={profile.location || ''} onChange={e => up('location', e.target.value)} /></div>
                </div>
              </>}

              {role === 'teacher' && <>
                <div className="form-group"><label>Nombre completo</label>
                  <input className="input" placeholder="Prof. María González" value={profile.full_name || ''} onChange={e => up('full_name', e.target.value)} required /></div>
                <div className="form-group"><label>Escuela</label>
                  <input className="input" placeholder="Nombre de la institución" value={profile.school || ''} onChange={e => up('school', e.target.value)} /></div>
                <div className="form-group"><label>Materia / Área</label>
                  <input className="input" placeholder="Ej: Proyecto Vocacional, Economía" value={profile.subject || ''} onChange={e => up('subject', e.target.value)} /></div>
              </>}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ gap: 8 }}><ArrowLeft size={16} /> Atrás</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Email + Password ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ color: 'var(--cream)', marginBottom: 4 }}>Crear tu cuenta</h3>
              <div className="form-group"><label>Email</label>
                <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="form-group"><label>Contraseña</label>
                <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
              <div className="form-group"><label>Confirmar contraseña</label>
                <input className="input" type="password" placeholder="Repetí la contraseña" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required /></div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setStep(2)} style={{ gap: 8 }}><ArrowLeft size={16} /> Atrás</button>
                <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creando cuenta...' : <><Check size={16} /> Crear cuenta</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--smoke)' }}>
          ¿Ya tenés cuenta? <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Ingresar</Link>
        </p>
      </div>
    </div>
  )
}
