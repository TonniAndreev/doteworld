import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uufihbvqnvniaszmfufi.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZmloYnZxbnZuaWFzem1mdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMjg0ODksImV4cCI6MjA2NTkwNDQ4OX0.SVn8NRLjBrtcqXJ6uUsaVEhWxYA07L7d61iAhrBrarw'

// Log the Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Using environment variables:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Disable email confirmation
    flowType: 'pkce',
  },
})