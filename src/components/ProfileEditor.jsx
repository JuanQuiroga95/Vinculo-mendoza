import { useState } from 'react'
import { profileAPI, setProfile } from '../utils/auth'
import ImageUpload from './ImageUpload'
import { Save, X, Globe, Phone, MapPin, BookOpen } from 'lucide-react'

const INTERESTS    = ['Diseño Gráfico','Marketing','Redes Sociales','Programación','Análisis de Datos','Comunicación','Fotografía','Video','Química','Biología','Administración','Contabilidad','Turismo','Gastronomía','Construcción','Electricidad','Mecánica','Electrónica']
const ORIENTATIONS = ['Comunicación','Arte','Economía','Informática','Ciencias Naturales','Ciencias Sociales','Humanidades','Técnica General','Eléctrica','Electrónica','Mecánica','Construcciones','Química','Informática Técnica']
const GRADES       = ['1er año','2do año','3er año','4to año','5to año','6to año','7mo año']
const SECTORS      = ['Tecnología / TIC','Agroindustria / Vitivinicultura','Salud','Educación','Turismo','Construcción','Comercio','Servicios','Industria','Otro']

export default function ProfileEditor({ role, initialData, onSaved }) {
  const [form,    setForm]    = useState(initialData || {})
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleInterest(i) {
    const cur = form.interests || []
    set('interests', cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i])
  }

  // Cuando ImageUpload termina de subir, guarda la URL en el form
  function handleAvatarUploaded(url) {
    const key = role === 'company' ? 'logo_url' : 'avatar_url'
    set(key, url)
  }

  async function save() {
    setLoading(true); setMsg('')
    try {
      const { profile } = await profileAPI.update(form)
      setProfile(profile)
      setMsg('✅ Perfil actualizado')
      if (onSaved) onSaved(profile)
    } catch (e) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  const avatarUrl = role === 'company' ? (form.logo_url || null) : (form.avatar_url || null)
  const avatarLabel = role === 'company' ? 'logo' : 'foto'

  return (
    <div style={{ maxWidth: 640 }}>
      {msg && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }} onClick={() => setMsg('')}>
          {msg} <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} />
        </div>
      )}

      {/* Foto / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, padding: 20, background: 'var(--ink)', borderRadius: 'var(--r-md)' }}>
        <ImageUpload
          currentUrl={avatarUrl}
          onUploaded={handleAvatarUploaded}
          label={avatarLabel}
          shape={role === 'company' ? 'square' : 'circle'}
        />
        <div>
          <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>
            {form.full_name || form.company_name || 'Sin nombre'}
          </div>
          <div style={{ color: 'var(--smoke)', fontSize: '0.82rem' }}>
            {role === 'student' && `${form.school || ''} · ${form.orientation || ''}`}
            {role === 'company' && `${form.sector || ''} · ${form.location || ''}`}
            {role === 'teacher' && `${form.school || ''} · ${form.subject || ''}`}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 6 }}>
            Hacé click en la {role === 'company' ? 'imagen' : 'foto'} o en el botón para cambiarla.<br/>
            Formatos: JPG, PNG, WebP · Máx. 5MB
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* ── ALUMNO ── */}
        {role === 'student' && (<>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Nombre completo</label>
            <input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} /></div>
          <div className="form-group"><label>Orientación escolar</label>
            <select className="input" value={form.orientation || ''} onChange={e => set('orientation', e.target.value)}>
              <option value="">Seleccionar</option>
              {ORIENTATIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select></div>
          <div className="form-group"><label>Año que cursás</label>
            <select className="input" value={form.grade || ''} onChange={e => set('grade', e.target.value)}>
              <option value="">Seleccionar</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select></div>
          <div className="form-group"><label><Phone size={12} /> Teléfono</label>
            <input className="input" placeholder="2614123456" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
          <div className="form-group"><label><MapPin size={12} /> Localidad</label>
            <input className="input" placeholder="Ej: Capital" value={form.location || ''} onChange={e => set('location', e.target.value)} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>LinkedIn (opcional)</label>
            <input className="input" placeholder="https://linkedin.com/in/..." value={form.linkedin_url || ''} onChange={e => set('linkedin_url', e.target.value)} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Bio / Presentación</label>
            <textarea className="input" rows={3} placeholder="Contá quién sos y qué buscás en tu primera experiencia laboral..." value={form.bio || ''} onChange={e => set('bio', e.target.value)} style={{ resize: 'vertical' }} /></div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: '0.88rem', color: 'var(--muted)', fontWeight: 500 }}>Áreas de interés vocacional</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INTERESTS.map(i => (
                <button key={i} type="button"
                  className={`badge ${(form.interests || []).includes(i) ? 'badge-wine' : 'badge-smoke'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontSize: '0.82rem' }}
                  onClick={() => toggleInterest(i)}>{i}</button>
              ))}
            </div>
          </div>
        </>)}

        {/* ── EMPRESA ── */}
        {role === 'company' && (<>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Nombre de la empresa</label>
            <input className="input" value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} /></div>
          <div className="form-group"><label>Sector / Rubro</label>
            <select className="input" value={form.sector || ''} onChange={e => set('sector', e.target.value)}>
              <option value="">Seleccionar</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div className="form-group"><label>Nombre del contacto (RRHH)</label>
            <input className="input" placeholder="Persona de contacto" value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} /></div>
          <div className="form-group"><label><MapPin size={12} /> Ciudad</label>
            <input className="input" placeholder="Ej: Capital" value={form.location || ''} onChange={e => set('location', e.target.value)} /></div>
          <div className="form-group"><label>Departamento</label>
            <input className="input" placeholder="Ej: Capital" value={form.department || ''} onChange={e => set('department', e.target.value)} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Dirección</label>
            <input className="input" placeholder="Calle, número, piso..." value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
          <div className="form-group"><label><Phone size={12} /> Teléfono</label>
            <input className="input" placeholder="0261-..." value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
          <div className="form-group"><label><Globe size={12} /> Sitio web</label>
            <input className="input" placeholder="https://..." value={form.website || ''} onChange={e => set('website', e.target.value)} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Descripción de la empresa</label>
            <textarea className="input" rows={4} placeholder="¿A qué se dedica la empresa? ¿Qué buscan en los pasantes?" value={form.description || ''} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} /></div>
        </>)}

        {/* ── DOCENTE ── */}
        {role === 'teacher' && (<>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Nombre completo</label>
            <input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} /></div>
          <div className="form-group"><label><BookOpen size={12} /> Materia</label>
            <input className="input" placeholder="Ej: Proyecto Vocacional" value={form.subject || ''} onChange={e => set('subject', e.target.value)} /></div>
          <div className="form-group"><label><Phone size={12} /> Teléfono</label>
            <input className="input" placeholder="2614..." value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Bio / Presentación</label>
            <textarea className="input" rows={3} placeholder="Tu experiencia docente, especialización..." value={form.bio || ''} onChange={e => set('bio', e.target.value)} style={{ resize: 'vertical' }} /></div>
        </>)}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          <Save size={16} /> {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
