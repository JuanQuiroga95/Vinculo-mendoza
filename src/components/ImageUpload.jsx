// src/components/ImageUpload.jsx
import { useState, useRef } from 'react'
import { getToken } from '../utils/auth'
import { Upload, X, Camera, Loader } from 'lucide-react'

export default function ImageUpload({ currentUrl, onUploaded, label = 'foto', shape = 'circle' }) {
  const [preview,   setPreview]   = useState(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe pesar menos de 5MB')
      return
    }

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Subir al servidor
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')

      onUploaded(data.url)
    } catch (err) {
      setError(err.message)
      setPreview(currentUrl || null) // revertir preview si falla
    } finally {
      setUploading(false)
    }
  }

  const isCircle  = shape === 'circle'
  const size      = isCircle ? 96 : 120
  const radius    = isCircle ? '50%' : 'var(--r-md)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Avatar / preview */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          border: '2px solid var(--wine)',
          background: 'var(--ink-soft)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        title={`Cambiar ${label}`}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--smoke)' }}>
            <Camera size={28} />
          </div>
        )}

        {/* Overlay al hacer hover o mientras sube */}
        <div style={{
          position: 'absolute', inset: 0,
          background: uploading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'rgba(0,0,0,0.45)' }}
          onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = 'rgba(0,0,0,0)' }}
        >
          {uploading
            ? <Loader size={22} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
            : <Upload size={18} style={{ color: '#fff', opacity: 0 }} className="upload-icon" />
          }
        </div>
      </div>

      {/* Botón texto */}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
      >
        {uploading ? 'Subiendo...' : `Cambiar ${label}`}
      </button>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--wine-light)', fontSize: '0.8rem' }}>
          <X size={12} /> {error}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        div:hover .upload-icon { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
