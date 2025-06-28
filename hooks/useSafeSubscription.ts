import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

type SubscriptionEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
type SubscriptionCallback = (payload: any) => void;

interface SubscriptionConfig {
  table: string;
  schema?: string;
  event: SubscriptionEventType;
  filter?: string;
}

// Global registry of active channels to prevent duplicate subscriptions
const activeChannels = new Map<string, { count: number, channel: any }>();

/**
 * Hook to safely create and manage Supabase Realtime subscriptions
 * Prevents the "tried to subscribe multiple times" error
 */
export function useSafeSubscription(
  channelName: string,
  config: SubscriptionConfig,
  callback: SubscriptionCallback,
  dependencies: any[] = []
): { isConnected: boolean; error: string | null } {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;
    let cleanupRequired = false;
    
    const setupSubscription = async () => {
      try {
        // Check if this channel is already in our registry
        if (activeChannels.has(channelName)) {
          // Increment the reference count
          const entry = activeChannels.get(channelName)!;
          entry.count++;
          channel = entry.channel;
          console.log(`Reusing existing channel ${channelName}, reference count: ${entry.count}`);
          
          // If channel is already subscribed, we're good to go
          if (channel._isJoined) {
            setIsConnected(true);
            return;
          }
          
          // Otherwise we'll set up a new subscription below
        } else {
          // First check if this channel already exists in Supabase
          const existingChannels = supabase.getChannels();
          const existingChannel = existingChannels.find(c => c.topic === channelName);
          
          if (existingChannel) {
            // Remove existing channel if it exists but isn't tracked
            console.log(`Found untracked channel ${channelName}, removing it first`);
            await supabase.removeChannel(existingChannel);
          }
          
          // Create a new channel
          channel = supabase.channel(channelName);
          
          // Add to our registry with reference count 1
          activeChannels.set(channelName, { count: 1, channel });
          console.log(`Created new channel ${channelName}, reference count: 1`);
          cleanupRequired = true;
        }
        
        // Set up the subscription
        channel
          .on(
            'postgres_changes',
            {
              event: config.event,
              schema: config.schema || 'public',
              table: config.table,
              filter: config.filter,
            },
            callback
          )
          .subscribe((status: string) => {
            console.log(`Channel ${channelName} status: ${status}`);
            setIsConnected(status === 'SUBSCRIBED');
            setError(status === 'CHANNEL_ERROR' ? 'Subscription error' : null);
          });
          
      } catch (err) {
        console.error(`Error setting up subscription to ${config.table} on ${channelName}:`, err);
        setError(err instanceof Error ? err.message : 'Subscription error');
        setIsConnected(false);
        
        // If we created a new channel, remove it from registry
        if (cleanupRequired && activeChannels.has(channelName)) {
          activeChannels.delete(channelName);
        }
      }
    };
    
    setupSubscription();
    
    // Return cleanup function
    return () => {
      if (activeChannels.has(channelName)) {
        const entry = activeChannels.get(channelName)!;
        entry.count--;
        
        if (entry.count <= 0) {
          // If this is the last reference, remove the channel
          console.log(`Removing channel ${channelName} (reference count zero)`);
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            console.error(`Error removing channel ${channelName}:`, e);
          }
          activeChannels.delete(channelName);
        } else {
          console.log(`Decremented reference count for ${channelName} to ${entry.count}`);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, config.table, config.event, config.filter, ...dependencies]);

  return { isConnected, error };
}