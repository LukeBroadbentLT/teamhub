import { useState, useEffect, useCallback } from 'react'
import { supabase, getMember } from './supabase'
import { isToday, isPast, parseISO } from 'date-fns'

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error) setTasks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchTasks])

  const createTask = useCallback(async (task) => {
    const { data, error } = await supabase.from('tasks').insert([task]).select().single()
    if (!error) setTasks(prev => [...prev, data])
    return { data, error }
  }, [])

  const updateTask = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (!error) setTasks(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }, [])

  const deleteTask = useCallback(async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
    return { error }
  }, [])

  const moveTask = useCallback(async (id, newStatus) => {
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }, [])

  return { tasks, loading, createTask, updateTask, deleteTask, moveTask, refetch: fetchTasks }
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useMessages(channelId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!channelId) return
    setLoading(true)
    setMessages([])

    supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages(data || [])
        setLoading(false)
      })

    const channel = supabase
      .channel(`messages-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [channelId])

  const sendMessage = useCallback(async (msg) => {
    const { data, error } = await supabase.from('messages').insert([msg]).select().single()
    return { data, error }
  }, [])

  return { messages, loading, sendMessage }
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useNotifications(tasks, currentUserId) {
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState(Notification.permission)

  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{ id: Date.now(), ...notif, read: false, time: new Date() }, ...prev].slice(0, 20))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => setNotifications([]), [])

  useEffect(() => {
    if (!tasks.length) return
    const myTasks = tasks.filter(t => t.assignee_id === currentUserId && t.status !== 'done')

    myTasks.forEach(task => {
      if (!task.due_date) return
      const due = parseISO(task.due_date)
      const key = `notif-${task.id}`
      const already = sessionStorage.getItem(key)
      if (already) return

      if (isPast(due) && !isToday(due)) {
        sessionStorage.setItem(key, '1')
        addNotification({ type: 'overdue', title: 'Overdue Task', body: `"${task.title}" was due ${task.due_date}`, taskId: task.id })
        if (permission === 'granted') new Notification('Overdue Task', { body: `"${task.title}" is overdue`, icon: '/icon.svg' })
      } else if (isToday(due)) {
        sessionStorage.setItem(key, '1')
        addNotification({ type: 'today', title: 'Due Today', body: `"${task.title}" is due today`, taskId: task.id })
        if (permission === 'granted') new Notification('Due Today', { body: `"${task.title}" is due today`, icon: '/icon.svg' })
      }
    })
  }, [tasks, currentUserId, permission, addNotification])

  return { notifications, addNotification, markAllRead, clearAll, requestPermission, permission }
}
