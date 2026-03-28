import { useState, useEffect } from 'react'
import { X, Calendar, ExternalLink, Trash2, Save } from 'lucide-react'
import { TEAM_MEMBERS, PRIORITIES } from '../lib/supabase'
import { format } from 'date-fns'

function buildGCalUrl(task) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const title = encodeURIComponent(task.title || 'Task')
  const desc  = encodeURIComponent(task.description || '')
  const date  = task.due_date ? task.due_date.replace(/-/g, '') : ''
  const dates = date ? `&dates=${date}/${date}` : ''
  return `${base}&text=${title}&details=${desc}${dates}`
}

export default function TaskModal({ task, onClose, onSave, onDelete, currentUser }) {
  const isNew = !task?.id
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'set',
    assignee_id: currentUser || 'alex',
    priority: 'medium',
    due_date: '',
    ...task,
  })

  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!task?.id) return
    if (!confirm(`Delete "${task.title}"?`)) return
    await onDelete(task.id)
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} onKeyDown={handleKeyDown}>
      <div className="modal fade-in">
        <h2>
          {isNew ? '+ New Task' : 'Edit Task'}
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </h2>

        <div className="form-group">
          <label>Title *</label>
          <input
            autoFocus
            placeholder="What needs to be done?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Add details..."
            value={form.description || ''}
            onChange={e => set('description', e.target.value)}
            style={{ minHeight: 72 }}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Assigned to</label>
            <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
              {TEAM_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="set">Set (Backlog)</option>
              <option value="doing">Doing (In Progress)</option>
              <option value="done">Done (Completed)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={form.due_date || ''}
              onChange={e => set('due_date', e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Google Calendar link */}
        {form.title && (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: 'var(--green-dim)',
            border: '1px solid rgba(67,233,123,0.2)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color="var(--green)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add to Google Calendar</span>
            </div>
            <a
              href={buildGCalUrl(form)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--green)',
                textDecoration: 'none',
              }}
            >
              Open <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border-2)' }}>
          {!isNew && (
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            <Save size={14} /> {saving ? 'Saving…' : isNew ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
