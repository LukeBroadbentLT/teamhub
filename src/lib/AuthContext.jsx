import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

// Fixed UUIDs matching schema.sql seed — used for getProfile fallback
const SEED_PROFILES = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Corey Turner',    initials: 'CT', avatar_color: '#6c63ff', role: 'Team Member', email: 'corey@livingstonetemple.com' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', name: 'David Onaolapo',  initials: 'DO', avatar_color: '#43e97b', role: 'Team Member', email: 'david@livingstonetemple.com' },
  { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', name: 'Lenin Manirajah', initials: 'LM', avatar_color: '#f9ca24', role: 'Team Member', email: 'lenin@livingstonetemple.com' },
  { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', name: 'Luke Broadbent',  initials: 'LB', avatar_color: '#ff6584', role: 'Team Member', email: 'luke@livingstonetempleton.com' },
]

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [allProfiles, setAllProfiles] = useState(SEED_PROFILES)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Fetch this user's profile ─────────────────────────────────────────────
  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
    return data
  }

  // ── Fetch all profiles (for assignee dropdowns, avatars, etc.) ────────────
  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('*')
    if (data && data.length > 0) setAllProfiles(data)
  }

  // ── Bootstrap auth ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), fetchAllProfiles()])
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), fetchAllProfiles()])
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Auth actions ──────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  // ── Profile update (name, role, avatar_color, initials) ───────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!session?.user) return { error: new Error('Not signed in') }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) {
      setProfile(data)
      setAllProfiles(prev => prev.map(p => p.id === data.id ? data : p))
    }
    return { data, error }
  }, [session])

  // ── Helper: look up any user's profile ───────────────────────────────────
  const getProfile = useCallback((userId) => {
    if (!userId) return SEED_PROFILES[0]
    return (
      allProfiles.find(p => p.id === userId) ||
      SEED_PROFILES.find(p => p.id === userId) ||
      { id: userId, name: 'Unknown', initials: '??', avatar_color: '#555577', role: '' }
    )
  }, [allProfiles])

  return (
    <AuthContext.Provider value={{
      session, profile, allProfiles, authLoading,
      signIn, signOut, updateProfile, getProfile,
      refetchProfiles: fetchAllProfiles,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
