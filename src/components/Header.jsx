import { useState, useRef, useEffect } from 'react'
import { Bell, BellRing, Check, Trash2, AlertTriangle, Clock, UserPlus } from 'lucide-react'
import { TEAM_MEMBERS, getMember } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

const NOTIF_ICONS = {
  overdue: <AlertTriangle size={14} color="#ff6584" />,
  today:   <Clock size={14} color="#f9ca24" />,
  assign:  <UserPlus size={14} color="#6c63ff" />,
}

export default function Header({ currentUser, setCurrentUser, notifications, markAllRead, clearAll, requestPermission, permission, pageTitle }) {
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifsRef = useRef(null)
  const userRef = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClick(e) {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const member = getMember(currentUser)

  return (
    <header style={{
      height: 60,
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>{pageTitle}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Notification Bell */}
        <div ref={notifsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs(v => !v); if (unread > 0) markAllRead() }}
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: showNotifs ? 'var(--purple-dim)' : 'var(--bg-card)',
              border: '1px solid var(--border-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: unread > 0 ? 'var(--purple)' : 'var(--text-muted)',
            }}
          >
            {unread > 0 ? <BellRing size={16} /> : <Bell size={16} />}
            {unread > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--pink)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 10,
                padding: '0 4px',
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'DM Mono',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 340,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              overflow: 'hidden',
            }} className="fade-in">
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {permission !== 'granted' && (
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={requestPermission}>
                      Enable push
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={clearAll}>
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                    <Check size={20} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    All caught up!
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-2)',
                    display: 'flex',
                    gap: 10,
                    background: n.read ? 'transparent' : 'rgba(108,99,255,0.05)',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{ marginTop: 2 }}>{NOTIF_ICONS[n.type] || <Bell size={14} />}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.body}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'DM Mono' }}>
                        {formatDistanceToNow(n.time, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: showUserMenu ? 'var(--bg-hover)' : 'var(--bg-card)',
              border: '1px solid var(--border-2)',
              color: 'var(--text)',
            }}
          >
            <div className="avatar" style={{ background: member.color, width: 28, height: 28, fontSize: 11 }}>
              {member.initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{member.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{member.role}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-muted)' }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 200,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              overflow: 'hidden',
            }} className="fade-in">
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-2)', fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Switch User
              </div>
              {TEAM_MEMBERS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setCurrentUser(m.id); setShowUserMenu(false) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: currentUser === m.id ? 'var(--purple-dim)' : 'transparent',
                    color: currentUser === m.id ? 'var(--purple)' : 'var(--text)',
                    fontSize: 14,
                    fontWeight: currentUser === m.id ? 700 : 400,
                  }}
                  onMouseEnter={e => { if (currentUser !== m.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (currentUser !== m.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="avatar" style={{ background: m.color, width: 28, height: 28, fontSize: 11 }}>{m.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{m.role}</div>
                  </div>
                  {currentUser === m.id && <Check size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
