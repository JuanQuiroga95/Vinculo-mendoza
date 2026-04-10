import { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { isLoggedIn } from '../utils/auth'
import {
  Briefcase, GraduationCap, BookOpen, ChevronRight,
  Star, Shield, Zap, Users, Award, ArrowRight
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)

  useEffect(() => {
    if (isLoggedIn()) navigate('/dashboard')
  }, [])

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(18,12,15,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(250,245,237,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--wine)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>V</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600 }}>
            Vínculo <span style={{ color: 'var(--gold)' }}>Mendoza</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="btn btn-outline btn-sm">Ingresar</Link>
          <Link to="/registro" className="btn btn-gold btn-sm">Registrarse</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 80
      }}>
        {/* Background grape/wine gradient circles */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,29,47,0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        {/* Grid lines decoration */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(250,245,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,245,237,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 780, animation: 'fadeUp 0.8s ease forwards' }}>
            <div className="badge badge-wine" style={{ marginBottom: 24 }}>
              <Star size={12} /> Primera super-app de empleabilidad juvenil de Mendoza
            </div>

            <h1 style={{ marginBottom: 24, color: 'var(--cream)' }}>
              El puente entre<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--wine-light), var(--gold))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>el aula y el mundo real</span>
            </h1>

            <p style={{ fontSize: '1.15rem', maxWidth: 560, marginBottom: 40, color: 'var(--muted)' }}>
              Conectamos estudiantes de escuelas mendocinas con empresas reales.
              Sin burocracia, con respaldo legal completo y una experiencia que transforma
              el último año del secundario.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/registro')}>
                Comenzar gratis <ArrowRight size={18} />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                Ya tengo cuenta
              </button>
            </div>

            <div style={{ display: 'flex', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
              {[['3 roles', 'Alumno, Empresa, Docente'], ['0 papeles', 'Todo digital y legal'], ['100%', 'Gratuito para escuelas']].map(([val, label]) => (
                <div key={val}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>{val}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES SECTION ── */}
      <section className="section" style={{ background: 'var(--ink-soft)', borderTop: '1px solid rgba(250,245,237,0.06)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="badge badge-gold" style={{ marginBottom: 16, display: 'inline-flex' }}>Tres perspectivas, un ecosistema</div>
            <h2>Diseñado para todos los actores</h2>
            <div className="divider" style={{ margin: '16px auto' }} />
          </div>

          <div className="grid-3">
            {[
              {
                icon: <GraduationCap size={28} />,
                color: 'var(--wine-light)',
                bg: 'rgba(124,29,47,0.15)',
                border: 'rgba(124,29,47,0.4)',
                title: 'Alumno',
                subtitle: '16 a 18 años',
                desc: 'Construí tu portafolio con proyectos reales, encontrá pasantías que coincidan con tu vocación y dejá de competir con la "experiencia previa".',
                features: ['Portafolio de proyectos escolares', 'Búsqueda de pasantías por orientación', 'Bitácora digital de horas', 'Visibilidad igual para todos'],
                cta: 'Soy alumno',
                role: 'student'
              },
              {
                icon: <Briefcase size={28} />,
                color: 'var(--gold)',
                bg: 'rgba(212,168,67,0.1)',
                border: 'rgba(212,168,67,0.3)',
                title: 'Empresa',
                subtitle: 'Pymes, bodegas, estudios',
                desc: 'Accedé a talento fresco sin papeles. La plataforma gestiona todos los convenios legales, seguros y límites horarios automáticamente.',
                features: ['Publicación de vacantes fácil', 'Panel de candidatos con portafolio', 'Firma digital de convenios', 'Seguimiento de la pasantía'],
                cta: 'Soy empresa',
                role: 'company'
              },
              {
                icon: <BookOpen size={28} />,
                color: 'var(--teal)',
                bg: 'rgba(27,186,170,0.1)',
                border: 'rgba(27,186,170,0.3)',
                title: 'Docente / Tutor',
                subtitle: 'Escuelas orientadas y técnicas',
                desc: 'Supervisá el progreso de tus alumnos, validá sus habilidades blandas y cumplí con los requisitos curriculares sin papeleo.',
                features: ['Panel de todos tus alumnos', 'Validación de habilidades', 'Revisión de la bitácora', 'Seguimiento curricular'],
                cta: 'Soy docente',
                role: 'teacher'
              }
            ].map((r) => (
              <div key={r.role} className="card card-glow" style={{
                borderColor: r.border, background: r.bg,
                display: 'flex', flexDirection: 'column', gap: 16
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: r.color
                }}>{r.icon}</div>
                <div>
                  <h3 style={{ color: r.color, marginBottom: 4 }}>{r.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--smoke)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.subtitle}</span>
                </div>
                <p style={{ fontSize: '0.92rem' }}>{r.desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0' }}>
                  {r.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: 'var(--cream)' }}>
                      <span style={{ color: r.color, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className="btn"
                  style={{ background: r.color, color: 'var(--ink)', marginTop: 'auto' }}
                  onClick={() => navigate(`/registro?rol=${r.role}`)}
                >
                  {r.cta} <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2>Tecnología al servicio<br />de la <span style={{ color: 'var(--gold)' }}>justicia educativa</span></h2>
            <div className="divider" style={{ margin: '16px auto' }} />
          </div>

          <div className="grid-2" style={{ gap: 32, alignItems: 'start' }}>
            {[
              { icon: <Zap size={22} />, title: 'Match Inteligente', desc: 'Algoritmo que cruza intereses del alumno, orientación escolar y cercanía geográfica para sugerir las vacantes más relevantes.' },
              { icon: <Shield size={22} />, title: 'Firma Digital Legal', desc: 'Convenios firmados digitalmente por escuela, empresa y padres. Compatible con Ley 25.506. Validez legal completa.' },
              { icon: <Users size={22} />, title: 'Validación Docente', desc: 'Los docentes validan habilidades blandas: liderazgo, trabajo en equipo, capacidad analítica. Un CV real desde el secundario.' },
              { icon: <Award size={22} />, title: 'Portafolio de Evidencias', desc: 'El alumno carga proyectos de clase: planes de marketing, cortometrajes, herbarios digitales. El talento habla por sí solo.' },
            ].map(f => (
              <div key={f.title} style={{
                display: 'flex', gap: 20, padding: 24,
                borderRadius: 'var(--r-lg)', border: '1px solid rgba(250,245,237,0.07)',
                transition: 'border-color 0.3s', cursor: 'default'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,168,67,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(250,245,237,0.07)'}
              >
                <div style={{
                  width: 48, height: 48, flexShrink: 0, borderRadius: 12,
                  background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)'
                }}>{f.icon}</div>
                <div>
                  <h4 style={{ color: 'var(--cream)', marginBottom: 8 }}>{f.title}</h4>
                  <p style={{ fontSize: '0.9rem' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--wine-deep) 0%, var(--ink-soft) 100%)',
        borderTop: '1px solid rgba(124,29,47,0.3)', borderBottom: '1px solid rgba(124,29,47,0.3)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>¿Listo para conectar?</h2>
          <p style={{ maxWidth: 480, margin: '0 auto 40px', fontSize: '1.05rem' }}>
            Mendoza necesita este puente. Empezá hoy — es gratuito.
          </p>
          <button className="btn btn-gold btn-lg" onClick={() => navigate('/registro')}>
            Crear cuenta gratis <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '32px 48px', borderTop: '1px solid rgba(250,245,237,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          Vínculo <span style={{ color: 'var(--gold)' }}>Mendoza</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--smoke)' }}>
          © 2025 Vínculo Mendoza · Plataforma Integral de Vinculación Educativo-Productiva
        </p>
        <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--smoke)' }}>
          <Link to="/login" style={{ color: 'var(--smoke)' }}>Ingresar</Link>
          <Link to="/registro" style={{ color: 'var(--gold)' }}>Registrarse</Link>
        </div>
      </footer>
    </div>
  )
}
