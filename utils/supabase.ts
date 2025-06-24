import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uufihbvqnvniaszmfufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZmloYnZxbnZuaWFzem1mdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMjg0ODksImV4cCI6MjA2NTkwNDQ4OX0.SVn8NRLjBrtcqXJ6uUsaVEhWxYA07L7d61iAhrBrarw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})