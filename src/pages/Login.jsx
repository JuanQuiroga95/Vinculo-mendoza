import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, setToken, setUser, setProfile } from '../utils/auth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await authAPI.login(form)
      setToken(data.token)
      setUser(data.user)
      setProfile(data.profile)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink)', position: 'relative', overflow: 'hidden'
    }}>
      {/* BG decoration */}
      <div style={{ position: 'absolute', top: '-20%', right: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,29,47,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, padding: 24, position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: 'var(--wine)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>V</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--cream)' }}>
              Vínculo <span style={{ color: 'var(--gold)' }}>Mendoza</span>
            </span>
          </Link>
          <p style={{ color: 'var(--smoke)', fontSize: '0.9rem', marginTop: 8 }}>Ingresá a tu cuenta</p>
        </div>

        <div style={{
          background: 'var(--ink-soft)', border: '1px solid rgba(250,245,237,0.1)',
          borderRadius: 'var(--r-xl)', padding: 36
        }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="tu@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" style={{ paddingRight: 44 }}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Ingresando...' : <><LogIn size={16} /> Ingresar</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--smoke)' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" style={{ color: 'var(--gold)', fontWeight: 600 }}>Registrate</Link>
          </p>
        </div>

        {/* Demo logins */}
        <div style={{ marginTop: 24, padding: 16, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 'var(--r-md)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>Demo — usuarios de prueba</p>
          {[
            { label: '🔑 Admin', email: 'admin@demo.com', pass: 'demo1234' },
            { label: '👨‍🎓 Alumno', email: 'alumno@demo.com', pass: 'demo1234' },
            { label: '🏢 Empresa', email: 'empresa@demo.com', pass: 'demo1234' },
            { label: '👩‍🏫 Docente', email: 'docente@demo.com', pass: 'demo1234' },
          ].map(d => (
            <button key={d.email} onClick={() => setForm({ email: d.email, password: d.pass })}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.83rem', padding: '4px 0', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--cream)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}
            >
              {d.label} → {d.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
