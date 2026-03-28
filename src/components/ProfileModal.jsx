import { useState } from 'react'
import { X, Save, User, Mail, Palette, Briefcase, Hash } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const PRESET_COLORS = [
  '#6c63ff', '#43e97b', '#f9ca24', '#ff6584',
  '#3bc9db', '#ff922b', '#f06595', '#74c0fc',
  '#a9e34b', '#da77f2', '#ff8787', '#63e6be',
]

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(color)}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: color,
        border: selected ? '3px solid #fff' : '3px solid transparent',
        outline: selected ? `2px solid ${color}` : 'none',
        cursor: 'pointer',
        transition: 'transform 0.1s',
        transform: selected ? 'scale(1.15)' : 'scale(1)',
      }}
    />
  )
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export default function ProfileModal({ onClose }) {
  const { profile, updateProfile, session } = useAuth()

  const [form, setForm] = useState({
    name:         profile?.name         || '',
    role:         profile?.role         || '',
    avatar_color: profile?.avatar_color || '#6c63ff',
    initials:     profile?.initials     || '',
  })
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)

  function set(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // Auto-update initials when name changes (unless manually edited)
      if (key === 'name' && !prev._initialsManual) {
        next.initials = getInitials(value)
      }
      return next
    })
  }

  function setInitials(value) {
    setForm(prev => ({ ...prev, initials: value.toUpperCase().slice(0, 3), _initialsManual: true }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await updateProfile({
      name:         form.name.trim(),
      role:         form.role.trim(),
      avatar_color: form.avatar_color,
      initials:     form.initials || getInitials(form.name),
    })
    setSaving(false)
    if (!error) {
      setSuccess(true)
      setTimeout(onClose, 800)
    }
  }

  const initials = form.initials || getInitials(form.name) || '??'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in" style={{ maxWidth: 460 }}>
        <h2 style={{ marginBottom: 24 }}>
          <User size={18} color="var(--purple)" />
          My Profile
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </h2>

        {/* Avatar preview */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          marginBottom: 20,
          border: '1px solid var(--border-2)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: form.avatar_color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'DM Mono',
            boxShadow: `0 0 20px ${form.avatar_color}60`,
            transition: 'background 0.2s, box-shadow 0.2s',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{form.name || 'Your Name'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 2 }}>
              {form.role || 'Team Member'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="form-group">
          <label>
            <User size={12} style={{ marginRight: 4 }} />
            Display Name
          </label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <Briefcase size={12} style={{ marginRight: 4 }} />
              Role / Title
            </label>
            <input
              value={form.role}
              onChange={e => set('role', e.target.value)}
              placeholder="e.g. Designer"
            />
          </div>
          <div className="form-group">
            <label>
              <Hash size={12} style={{ marginRight: 4 }} />
              Initials
            </label>
            <input
              value={form.initials}
              onChange={e => setInitials(e.target.value)}
              placeholder="e.g. CT"
              maxLength={3}
              style={{ fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="form-group">
          <label>
            <Mail size={12} style={{ marginRight: 4 }} />
            Email
          </label>
          <input
            value={session?.user?.email || ''}
            readOnly
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
        </div>

        {/* Color picker */}
        <div className="form-group">
          <label>
            <Palette size={12} style={{ marginRight: 4 }} />
            Avatar Colour
          </label>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius-sm)',
            padding: 14,
          }}>
            {/* Preset swatches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {PRESET_COLORS.map(c => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={form.avatar_color === c}
                  onClick={c => set('avatar_color', c)}
                />
              ))}
            </div>
            {/* Custom colour input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Custom:</span>
              <input
                type="color"
                value={form.avatar_color}
                onChange={e => set('avatar_color', e.target.value)}
                style={{
                  width: 36,
                  height: 28,
                  padding: 2,
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              />
              <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-muted)' }}>
                {form.avatar_color}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border-2)', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              background: success ? 'var(--green)' : 'var(--purple)',
              opacity: saving || !form.name.trim() ? 0.7 : 1,
            }}
          >
            {success ? (
              '✓ Saved!'
            ) : saving ? (
              <>
                <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Saving…
              </>
            ) : (
              <><Save size={14} /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
