import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Create a custom storage implementation with better error handling
class CustomAsyncStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
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
      eventsPerSecond: 5,  // Reduce to avoid rate limits
      realtimeTimeout: 30000, // Increase timeout to 30 seconds
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'dote-app-mobile',
    },
  },
  db: {
    schema: 'public',
  },
  // Disable cache to always fetch fresh data
  auth: {
    storage: new CustomAsyncStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Disable email confirmation
    flowType: 'pkce',
    debug: __DEV__, // Enable debug logs in development
  },
})

// Add helper function to log all active channels
export function logActiveChannels() {
  const channels = supabase.getChannels();
  console.log(`Active channels (${channels.length}):`, 
    channels.map(c => ({
      topic: c.topic,
      state: c._state
    }))
  );
}

// Add helper function to check if a channel exists
export function channelExists(channelName: string): boolean {
  const channels = supabase.getChannels();
  return channels.some(channel => channel.topic === channelName);
}

// Add helper function to safely create a channel
export function safelyCreateChannel(channelName: string) {
  const existingChannel = supabase.getChannels().find(
    channel => channel.topic === channelName
  );
  
  if (existingChannel) {
    // If channel exists and is in a closed state, remove it first
    if (existingChannel._state === 'closed') {
      supabase.removeChannel(existingChannel);
    } else {
      return existingChannel; // Return existing channel if it's active
    }
  }
  return supabase.channel(channelName); // Create a new channel
}