import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Static fallback — used before profiles load from DB
export const TEAM_MEMBERS = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Corey Turner',    avatar_color: '#6c63ff', initials: 'CT', role: 'Team Member', email: 'corey@livingstonetemple.com' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', name: 'David Onaolapo',  avatar_color: '#43e97b', initials: 'DO', role: 'Team Member', email: 'david@livingstonetemple.com' },
  { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', name: 'Lenin Manirajah', avatar_color: '#f9ca24', initials: 'LM', role: 'Team Member', email: 'lenin@livingstonetemple.com' },
  { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', name: 'Luke Broadbent',  avatar_color: '#ff6584', initials: 'LB', role: 'Team Member', email: 'luke@livingstonetempleton.com' },
]

export const CHANNELS = [
  { id: 'general',       name: 'general',       icon: '#', description: 'General team discussion' },
  { id: 'tasks',         name: 'tasks',         icon: '#', description: 'Task updates and coordination' },
  { id: 'random',        name: 'random',        icon: '#', description: 'Off-topic chat' },
  { id: 'announcements', name: 'announcements', icon: '@', description: 'Important announcements' },
]

export const PRIORITIES = {
  low:    { label: 'Low',    color: '#43e97b', bg: 'rgba(67,233,123,0.15)' },
  medium: { label: 'Medium', color: '#f9ca24', bg: 'rgba(249,202,36,0.15)' },
  high:   { label: 'High',   color: '#ff6584', bg: 'rgba(255,101,132,0.15)' },
  urgent: { label: 'Urgent', color: '#ff4757', bg: 'rgba(255,71,87,0.2)'   },
}

// Static fallback — components should prefer getProfile() from AuthContext
export function getMember(id, profiles) {
  const list = profiles || TEAM_MEMBERS
  return (
    list.find(m => m.id === id) ||
    TEAM_MEMBERS.find(m => m.id === id) ||
    { id, name: 'Unknown', initials: '??', avatar_color: '#555577', role: '' }
  )
}
