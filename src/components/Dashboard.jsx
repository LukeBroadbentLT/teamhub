import { useMemo } from 'react'
import { CheckCircle2, Circle, AlertCircle, Clock, TrendingUp, Users, Zap, Calendar } from 'lucide-react'
import { TEAM_MEMBERS, PRIORITIES, getMember } from '../lib/supabase'
import { format, isPast, isToday, parseISO } from 'date-fns'

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80,
        borderRadius: '50%',
        background: `${color}18`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <div style={{ color, background: `${color}18`, padding: 8, borderRadius: 8 }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'DM Mono' }}>{sub}</p>}
      </div>
    </div>
  )
}

function MemberCard({ member, tasks }) {
  const myTasks  = tasks.filter(t => t.assignee_id === member.id)
  const done     = myTasks.filter(t => t.status === 'done').length
  const doing    = myTasks.filter(t => t.status === 'doing').length
  const set      = myTasks.filter(t => t.status === 'set').length
  const total    = myTasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const overdue = myTasks.filter(t =>
    t.due_date && t.status !== 'done' && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
  ).length

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar" style={{ background: member.color, width: 44, height: 44, fontSize: 14 }}>
          {member.initials}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{member.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{member.role}</p>
        </div>
        {overdue > 0 && (
          <span style={{ marginLeft: 'auto', background: 'var(--pink-dim)', color: 'var(--pink)', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono' }}>
            {overdue} overdue
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{done}/{total} tasks done</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: member.color, fontFamily: 'DM Mono' }}>{progress}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${member.color}80, ${member.color})`,
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Task counts */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Set',   count: set,   color: 'var(--text-dim)' },
          { label: 'Doing', count: doing, color: 'var(--yellow)' },
          { label: 'Done',  count: done,  color: 'var(--green)' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center',
            background: 'var(--bg-hover)',
            borderRadius: 8,
            padding: '6px 4px',
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'DM Mono' }}>{count}</p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentTask({ task }) {
  const member = getMember(task.assignee_id)
  const p = PRIORITIES[task.priority] || PRIORITIES.medium
  const due = task.due_date ? parseISO(task.due_date) : null
  const isOverdue = due && isPast(due) && !isToday(due) && task.status !== 'done'
  const isDueToday = due && isToday(due)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid var(--border-2)',
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: task.status === 'done' ? 'var(--green)' : task.status === 'doing' ? 'var(--yellow)' : 'var(--text-dim)',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{task.title}</p>
        {due && (
          <p style={{ fontSize: 11, fontFamily: 'DM Mono', color: isOverdue ? 'var(--pink)' : isDueToday ? 'var(--yellow)' : 'var(--text-dim)', marginTop: 2 }}>
            {isOverdue ? 'Overdue · ' : isDueToday ? 'Due today · ' : ''}{format(due, 'MMM d')}
          </p>
        )}
      </div>
      <span className="badge" style={{ color: p.color, background: p.bg }}>{p.label}</span>
      <div className="avatar" style={{ background: member.color, width: 24, height: 24, fontSize: 10 }}>{member.initials}</div>
    </div>
  )
}

export default function Dashboard({ tasks, currentUser, onNavigate }) {
  const stats = useMemo(() => {
    const total   = tasks.length
    const done    = tasks.filter(t => t.status === 'done').length
    const doing   = tasks.filter(t => t.status === 'doing').length
    const overdue = tasks.filter(t =>
      t.due_date && t.status !== 'done' &&
      isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
    ).length
    const dueToday = tasks.filter(t =>
      t.due_date && t.status !== 'done' && isToday(parseISO(t.due_date))
    ).length
    return { total, done, doing, overdue, dueToday }
  }, [tasks])

  const recentTasks = useMemo(() =>
    [...tasks].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)).slice(0, 8),
    [tasks]
  )

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Welcome bar */}
      <div style={{
        marginBottom: 24,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(67,233,123,0.08) 100%)',
        border: '1px solid rgba(108,99,255,0.25)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{format(new Date(), 'EEEE, MMMM d')}</p>
          <h2 style={{ fontSize: 20, marginTop: 2 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span style={{ color: 'var(--purple)' }}>{getMember(currentUser).name}</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => onNavigate('kanban')} style={{ gap: 6 }}>
            <Zap size={14} /> Open Kanban
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Circle size={18} />}       label="Total Tasks"  value={stats.total}    color="var(--purple)" sub={`${stats.doing} in progress`} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Completed"    value={stats.done}     color="var(--green)"  sub={stats.total > 0 ? `${Math.round((stats.done/stats.total)*100)}% completion` : '—'} />
        <StatCard icon={<AlertCircle size={18} />}  label="Overdue"      value={stats.overdue}  color="var(--pink)"   sub="need attention" />
        <StatCard icon={<Clock size={18} />}        label="Due Today"    value={stats.dueToday} color="var(--yellow)" sub="scheduled today" />
      </div>

      {/* Team + Recent Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Team overview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Users size={16} color="var(--purple)" />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Team Overview</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {TEAM_MEMBERS.map(m => <MemberCard key={m.id} member={m} tasks={tasks} />)}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={16} color="var(--green)" />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Tasks</h3>
          </div>
          <div className="card" style={{ padding: '4px 16px' }}>
            {recentTasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24, fontSize: 13 }}>No tasks yet</p>
            ) : recentTasks.map(t => <RecentTask key={t.id} task={t} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
