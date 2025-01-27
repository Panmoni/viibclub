import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Always use service role key for server-side operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export type User = {
  id: string
  username: string
  created_at: string
  emojis: string[] | null
  country_code: string | null
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})
