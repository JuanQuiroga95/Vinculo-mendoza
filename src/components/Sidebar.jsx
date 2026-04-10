import { logout, getUser, getProfile } from '../utils/auth'
import { LogOut } from 'lucide-react'

export default function Sidebar({ items, active, onSelect, accentColor = 'var(--wine-light)' }) {
  const user = getUser()
  const profile = getProfile()

  const displayName = profile?.full_name || profile?.company_name || user?.email?.split('@')[0] || 'Usuario'
  const displaySub = user?.role === 'student' ? (profile?.school || 'Alumno')
    : user?.role === 'company' ? (profile?.sector || 'Empresa')
    : (profile?.subject || 'Docente')

  const roleLabel = { student: 'Alumno', company: 'Empresa', teacher: 'Docente' }[user?.role] || ''
  const roleBadgeColor = { student: 'badge-wine', company: 'badge-gold', teacher: 'badge-teal' }[user?.role] || 'badge-smoke'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ width: 32, height: 32, background: 'var(--wine)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>V</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.2 }}>
            Vínculo <span style={{ color: 'var(--gold)' }}>Mza</span>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, var(--wine), ${accentColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--cream)'
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--smoke)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displaySub}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <span className={`badge ${roleBadgeColor}`}>{roleLabel}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => (
          <button key={item.id} className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}>
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {item.label}
            {item.count > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--wine)', color: 'var(--cream)',
                borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                padding: '2px 7px', minWidth: 20, textAlign: 'center'
              }}>{item.count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={logout} className="sidebar-nav-item" style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </aside>
  )
}
