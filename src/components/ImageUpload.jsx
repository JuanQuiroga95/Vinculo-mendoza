import { useState, useRef } from 'react'
import { uploadImage } from '../utils/auth'
import { Camera, Loader, X } from 'lucide-react'

export default function ImageUpload({ currentUrl, onUploaded, label = 'foto', shape = 'circle' }) {
  const [preview,   setPreview]   = useState(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen debe pesar menos de 5MB'); return }

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploading(true); setError('')
    try {
      const url = await uploadImage(file)
      onUploaded(url)
    } catch (err) {
      setError(err.message)
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const size   = shape === 'circle' ? 96 : 110
  const radius = shape === 'circle' ? '50%' : 'var(--r-md)'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ position:'relative', width:size, height:size, borderRadius:radius, overflow:'hidden',
          border:'2px solid var(--wine)', background:'var(--ink-soft)', cursor:'pointer', flexShrink:0 }}
        title={`Cambiar ${label}`}
      >
        {preview
          ? <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--smoke)' }}>
              <Camera size={28} />
            </div>
        }
        {/* Overlay */}
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex',
          alignItems:'center', justifyContent:'center',
          opacity: uploading ? 1 : 0, transition:'opacity 0.2s' }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = '0' }}
        >
          {uploading
            ? <Loader size={22} style={{ color:'#fff', animation:'spin 1s linear infinite' }} />
            : <Camera size={20} style={{ color:'#fff' }} />
          }
        </div>
      </div>

      <button type="button" className="btn btn-outline btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{ fontSize:'0.8rem', padding:'5px 14px' }}
      >
        {uploading ? 'Subiendo...' : `Cambiar ${label}`}
      </button>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display:'none' }} onChange={handleFile} />

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--wine-light)', fontSize:'0.78rem' }}>
          <X size={12} /> {error}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
