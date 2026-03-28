import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Calendar, ExternalLink, AlertTriangle, Clock } from 'lucide-react'
import { PRIORITIES } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format, isPast, isToday, parseISO } from 'date-fns'
import TaskModal from './TaskModal'

const COLUMNS = [
  { id: 'set',   label: 'Set',   color: 'var(--text-dim)',  emoji: '📋', accent: '#55577a' },
  { id: 'doing', label: 'Doing', color: 'var(--yellow)',    emoji: '⚡', accent: '#f9ca24' },
  { id: 'done',  label: 'Done',  color: 'var(--green)',     emoji: '✅', accent: '#43e97b' },
]

function buildGCalUrl(task) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const title = encodeURIComponent(task.title || 'Task')
  const desc  = encodeURIComponent(task.description || '')
  const date  = task.due_date ? task.due_date.replace(/-/g, '') : ''
  const dates = date ? `&dates=${date}/${date}` : ''
  return `${base}&text=${title}&details=${desc}${dates}`
}

function TaskCard({ task, onEdit, getProfile }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task.id })
  const member  = getProfile(task.assignee_id)
  const p       = PRIORITIES[task.priority] || PRIORITIES.medium
  const due     = task.due_date ? parseISO(task.due_date) : null
  const overdue = due && isPast(due) && !isToday(due) && task.status !== 'done'
  const today   = due && isToday(due) && task.status !== 'done'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(task)}
      className="fade-in"
    >
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${overdue ? 'rgba(255,101,132,0.35)' : today ? 'rgba(249,202,36,0.3)' : 'var(--border-2)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = overdue ? 'rgba(255,101,132,0.35)' : today ? 'rgba(249,202,36,0.3)' : 'var(--border-2)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'var(--text-dim)',
            cursor: 'grab',
            opacity: 0,
            transition: 'opacity 0.15s',
            padding: 2,
          }}
          onMouseEnter={e => e.currentTarget.parentElement.style.opacity = '1'}
          className="drag-handle"
        >
          <GripVertical size={14} />
        </div>

        {/* Priority + Calendar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="badge" style={{ color: p.color, background: p.bg }}>{p.label}</span>
          <a
            href={buildGCalUrl(task)}
            target="_blank"
            rel="noopener noreferrer"
            title="Add to Google Calendar"
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--text-dim)', opacity: 0.6, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          >
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
          marginBottom: 10,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)',
        }}>
          {task.title}
        </p>

        {task.description && (
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 10,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}>
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="avatar" style={{ background: member.avatar_color || '#6c63ff', width: 24, height: 24, fontSize: 10 }}>
            {member.initials}
          </div>
          {due && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontFamily: 'DM Mono',
              color: overdue ? 'var(--pink)' : today ? 'var(--yellow)' : 'var(--text-dim)',
            }}>
              {overdue ? <AlertTriangle size={11} /> : today ? <Clock size={11} /> : <Calendar size={11} />}
              {format(due, 'MMM d')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Column({ col, tasks, onEdit, onAddTask, getProfile }) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      style={{
        flex: '0 0 300px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-panel)',
        border: `1px solid ${isOver ? col.accent + '60' : 'var(--border-2)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
      onDragOver={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => setIsOver(false)}
    >
      {/* Column header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${col.accent}10 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{col.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: col.color }}>{col.label}</span>
          <span style={{
            background: `${col.accent}20`,
            color: col.color,
            borderRadius: 20,
            padding: '1px 8px',
            fontSize: 12,
            fontFamily: 'DM Mono',
            fontWeight: 600,
          }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(col.id)}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: `${col.accent}15`,
            color: col.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${col.accent}30`}
          onMouseLeave={e => e.currentTarget.style.background = `${col.accent}15`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} getProfile={getProfile} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              fontSize: 13,
              padding: 24,
              gap: 8,
              border: '2px dashed var(--border-2)',
              borderRadius: 'var(--radius)',
              minHeight: 100,
            }}
          >
            <span style={{ fontSize: 24 }}>{col.emoji}</span>
            <span>No tasks here</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks, currentUser, createTask, updateTask, deleteTask, moveTask, addNotification }) {
  const { allProfiles, getProfile } = useAuth()
  const [editTask, setEditTask]   = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeId, setActiveId]   = useState(null)
  const [filterUser, setFilterUser] = useState('all')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredTasks = tasks.filter(t => filterUser === 'all' || t.assignee_id === filterUser)

  const columns = COLUMNS.map(col => ({
    ...col,
    tasks: filteredTasks.filter(t => t.status === col.id),
  }))

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const task = tasks.find(t => t.id === active.id)
    if (!task) return

    const targetCol = COLUMNS.find(c => c.id === over.id)
    if (targetCol && task.status !== targetCol.id) {
      moveTask(task.id, targetCol.id)
      return
    }

    const targetTask = tasks.find(t => t.id === over.id)
    if (targetTask && task.status !== targetTask.status) {
      moveTask(task.id, targetTask.status)
    }
  }

  function handleDragOver({ active, over }) {
    if (!over) return
    const task = tasks.find(t => t.id === active.id)
    if (!task) return
    const targetTask = tasks.find(t => t.id === over.id)
    if (targetTask && task.status !== targetTask.status) {
      moveTask(task.id, targetTask.status)
    }
  }

  function openNewTask(status) {
    setEditTask({ status, assignee_id: currentUser })
    setModalOpen(true)
  }

  function openEdit(task) {
    setEditTask(task)
    setModalOpen(true)
  }

  async function handleSave(form) {
    if (form.id) {
      await updateTask(form.id, form)
    } else {
      const { data } = await createTask({ ...form, created_by: currentUser })
      if (data) {
        addNotification({
          type: 'assign',
          title: 'Task Created',
          body: `"${form.title}" assigned to ${getProfile(form.assignee_id).name}`,
        })
      }
    }
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        background: 'var(--bg-panel)',
      }}>
        <button className="btn btn-primary" onClick={() => openNewTask('set')}>
          <Plus size={15} /> New Task
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filter:</span>
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
          >
            <option value="all">All Team</option>
            {allProfiles.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>
          {filteredTasks.length} tasks
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: 20 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div style={{ display: 'flex', gap: 16, height: '100%', minWidth: 'fit-content' }}>
            {columns.map(col => (
              <Column
                key={col.id}
                col={col}
                tasks={col.tasks}
                onEdit={openEdit}
                onAddTask={openNewTask}
                getProfile={getProfile}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(108,99,255,0.5)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-lg), var(--glow)',
                opacity: 0.95,
                rotate: '2deg',
                width: 280,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {modalOpen && (
        <TaskModal
          task={editTask}
          currentUser={currentUser}
          onClose={() => { setModalOpen(false); setEditTask(null) }}
          onSave={handleSave}
          onDelete={deleteTask}
        />
      )}
    </div>
  )
}
