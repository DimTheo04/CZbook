import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export type Profile = {
  id: string
  full_name: string | null
  phone_number: string | null
  created_at: string
}

export type Appointment = {
  id: string
  user_id: string
  start_time: string
  end_time: string
  status: 'booked' | 'cancelled'
  created_at: string
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)