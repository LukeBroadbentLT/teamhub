import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const TEAM_MEMBERS = [
  { id: 'alex',   name: 'Alex',   color: '#6c63ff', initials: 'AL', role: 'Frontend Dev' },
  { id: 'jordan', name: 'Jordan', color: '#43e97b', initials: 'JO', role: 'Backend Dev' },
  { id: 'sam',    name: 'Sam',    color: '#f9ca24', initials: 'SA', role: 'Designer' },
  { id: 'riley',  name: 'Riley',  color: '#ff6584', initials: 'RI', role: 'Product Manager' },
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

export function getMember(id) {
  return TEAM_MEMBERS.find(m => m.id === id) || TEAM_MEMBERS[0]
}
