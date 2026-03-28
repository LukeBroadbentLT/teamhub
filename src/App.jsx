import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import KanbanBoard from './components/KanbanBoard'
import TeamChat from './components/TeamChat'
import LoginScreen from './components/LoginScreen'
import { useTasks, useNotifications } from './lib/hooks'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  kanban:    'Kanban Board',
  chat:      'Team Chat',
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontFamily: 'DM Mono', fontSize: 13 }}>Loading TeamHub…</span>
    </div>
  )
}

function AppShell() {
  const { session, profile, authLoading } = useAuth()
  const [page, setPage] = useState('dashboard')

  const currentUser = profile?.id || null
  const { tasks, loading, createTask, updateTask, deleteTask, moveTask } = useTasks()
  const { notifications, addNotification, markAllRead, clearAll, requestPermission, permission } = useNotifications(tasks, currentUser)

  if (authLoading) return <Spinner />
  if (!session)    return <LoginScreen />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={page} setActive={setPage} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          notifications={notifications}
          markAllRead={markAllRead}
          clearAll={clearAll}
          requestPermission={requestPermission}
          permission={permission}
          pageTitle={PAGE_TITLES[page]}
        />

        <main style={{ flex: 1, overflow: 'hidden' }}>
          {loading && page !== 'chat' ? (
            <Spinner />
          ) : (
            <>
              {page === 'dashboard' && (
                <Dashboard
                  tasks={tasks}
                  currentUser={currentUser}
                  onNavigate={setPage}
                />
              )}
              {page === 'kanban' && (
                <KanbanBoard
                  tasks={tasks}
                  currentUser={currentUser}
                  createTask={createTask}
                  updateTask={updateTask}
                  deleteTask={deleteTask}
                  moveTask={moveTask}
                  addNotification={addNotification}
                />
              )}
              {page === 'chat' && (
                <TeamChat currentUser={currentUser} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
