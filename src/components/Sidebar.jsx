import { LayoutDashboard, Kanban, MessageSquare, Settings, Zap } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'kanban',    label: 'Kanban',     icon: Kanban },
  { id: 'chat',      label: 'Team Chat',  icon: MessageSquare },
]

export default function Sidebar({ active, setActive }) {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-2)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      gap: 4,
    }}>
      {/* Logo */}
      <div style={{
        padding: '0 20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--purple)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow)',
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Team<span style={{ color: 'var(--purple)' }}>Hub</span>
        </span>
      </div>

      <div style={{ padding: '0 12px', flex: 1 }}>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 8 }}>
          Navigation
        </p>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: active === id ? 'var(--purple-dim)' : 'transparent',
              color: active === id ? 'var(--purple)' : 'var(--text-muted)',
              fontWeight: active === id ? 700 : 500,
              fontSize: 14,
              border: active === id ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
              marginBottom: 2,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (active !== id) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }
            }}
            onMouseLeave={e => {
              if (active !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-2)', marginTop: 'auto' }}>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>v1.0.0 · TeamHub</p>
      </div>
    </aside>
  )
}
