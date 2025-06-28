import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Create a custom storage implementation that handles channel subscriptions better
class CustomAsyncStorage {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}

const supabaseUrl = 'https://uufihbvqnvniaszmfufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZmloYnZxbnZuaWFzem1mdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMjg0ODksImV4cCI6MjA2NTkwNDQ4OX0.SVn8NRLjBrtcqXJ6uUsaVEhWxYA07L7d61iAhrBrarw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new CustomAsyncStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Disable email confirmation
    flowType: 'pkce',
    debug: __DEV__, // Enable debug logs in development
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'dote-app-mobile',
    },
  },
})