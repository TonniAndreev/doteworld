import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Global channel tracking
const ACTIVE_CHANNELS = new Set<string>();

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

// Add helper functions for channel management
export function logActiveChannels() {
  const channels = supabase.getChannels();
  console.log(`Active channels (${channels.length}):`, 
    channels.map(c => ({
      topic: c.topic,
      state: c._state,
      // Include subscription count if available
      subscriptions: c._subscriptions?.length || 0
    }))
  );
  console.log('Tracked active channels:', Array.from(ACTIVE_CHANNELS));
  return channels;
}

// Add helper function to check if a channel exists
export function channelExists(channelName: string): boolean {
  const channels = supabase.getChannels();
  const exists = channels.some(channel => channel.topic === channelName);
  if (exists) {
    console.log(`Channel ${channelName} already exists`);
  }
  return exists;
}

// Add helper function to safely create a channel
export function safelyCreateChannel(channelName: string) {
  // Check our global tracking first
  if (ACTIVE_CHANNELS.has(channelName)) {
    console.log(`Channel ${channelName} is already tracked as active`);
    
    // Find the actual channel object
    const existingChannel = supabase.getChannels().find(
      channel => channel.topic === channelName
    );
    
    if (existingChannel) {
      return existingChannel;
    }
    
    // If tracked but not found in active channels, remove from tracking
    console.log(`Channel ${channelName} was tracked but not found, removing from tracking`);
    ACTIVE_CHANNELS.delete(channelName);
  }
  
  // Check actual Supabase channels
  const existingChannel = supabase.getChannels().find(
    channel => channel.topic === channelName
  );
  
  if (existingChannel) {
    // Log channel state for debugging
    console.log(`Found existing channel ${channelName} with state: ${existingChannel._state}`);
    
    // If channel exists but is in a non-SUBSCRIBED state, remove it and create a new one
    if (existingChannel._state !== 'SUBSCRIBED') {
      console.log(`Removing non-subscribed channel ${channelName}`);
      supabase.removeChannel(existingChannel);
    } else {      
      // Track the channel as active
      ACTIVE_CHANNELS.add(channelName);
      console.log(`Reusing existing channel ${channelName}`);
      return existingChannel;
    }
  }
  
  // Create a new channel
  console.log(`Creating new channel ${channelName}`);
  const newChannel = supabase.channel(channelName);
  
  // Track the new channel
  ACTIVE_CHANNELS.add(channelName);
  
  return newChannel;
}