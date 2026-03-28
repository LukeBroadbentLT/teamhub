import { useState } from 'react'
import { Mail, Lock, LogIn, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const TEAM_HINTS = [
  { name: 'Corey Turner',    email: 'corey@livingstonetemple.com',   initials: 'CT', color: '#6c63ff' },
  { name: 'David Onaolapo',  email: 'david@livingstonetemple.com',   initials: 'DO', color: '#43e97b' },
  { name: 'Lenin Manirajah', email: 'lenin@livingstonetemple.com',   initials: 'LM', color: '#f9ca24' },
  { name: 'Luke Broadbent',  email: 'luke@livingstonetempleton.com', initials: 'LB', color: '#ff6584' },
]

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return
    setLoading(true)
    const { error } = await signIn(email.trim().toLowerCase(), password)
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Try your work email + TeamHub2024!'
        : error.message)
    }
    setLoading(false)
  }

  function fillEmail(e) {
    setEmail(e)
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 32px rgba(108,99,255,0.4)',
          }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Team<span style={{ color: 'var(--purple)' }}>Hub</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Sign in with your work account
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => fillEmail(e.target.value)}
                  placeholder="you@livingstonetemple.com"
                  autoComplete="email"
                  required
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', color: 'var(--text-dim)',
                    padding: 4,
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: 'rgba(255,101,132,0.1)',
                border: '1px solid rgba(255,101,132,0.25)',
                borderRadius: 8,
                color: 'var(--pink)',
                fontSize: 13,
              }}>
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '11px 16px',
                fontSize: 15,
                opacity: loading || !email || !password ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={15} /> Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Team members hint */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 12, fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your team
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEAM_HINTS.map(m => (
              <button
                key={m.email}
                onClick={() => fillEmail(m.email)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: email === m.email ? 'var(--purple-dim)' : 'var(--bg-panel)',
                  border: `1px solid ${email === m.email ? 'rgba(108,99,255,0.4)' : 'var(--border-2)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (email !== m.email) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (email !== m.email) e.currentTarget.style.background = 'var(--bg-panel)' }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                  fontFamily: 'DM Mono',
                }}>
                  {m.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                </div>
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 12, fontFamily: 'DM Mono' }}>
            Default password: <span style={{ color: 'var(--text-muted)' }}>TeamHub2024!</span>
          </p>
        </div>
      </div>
    </div>
  )
}
