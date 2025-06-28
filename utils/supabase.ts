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
    flowType: 'pkce',
    debug: __DEV__, // Enable debug logs in development
  },
  realtime: {
    params: {
      eventsPerSecond: 5,
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
})

// Helper function to log active channels - useful for debugging
export function logActiveChannels() {
  const channels = supabase.getChannels();
  console.log(`Active channels (${channels.length}):`, 
    channels.map(c => ({
      topic: c.topic,
      state: c._state,
      subscriptions: c._subscriptions?.length || 0
    }))
  );
  return channels;
}

// Helper function to remove all channels - useful for cleanup
export function removeAllChannels() {
  const channels = supabase.getChannels();
  channels.forEach(channel => {
    try {
      supabase.removeChannel(channel);
    } catch (error) {
      console.error(`Failed to remove channel ${channel.topic}:`, error);
    }
  });
  return true;
}

// Create a storage bucket if it doesn't exist
export async function createStorageBucketIfNeeded(bucketName: string, options: any = {}) {
  try {
    // Check if bucket exists
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error && error.message.includes('not found')) {
      // Create bucket if it doesn't exist
      console.log(`Creating bucket ${bucketName}...`);
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        ...options
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
      return true;
    }
    
    console.log(`Bucket ${bucketName} already exists`);
    return true;
  } catch (error) {
    console.error(`Error checking/creating bucket ${bucketName}:`, error);
    return false;
  }
}