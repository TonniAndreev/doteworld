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

// Keep track of active channel names to prevent duplicate subscriptions
const activeChannels = new Set<string>();

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
    // Skip if this channel is already active
    if (activeChannels.has(channelName)) {
      console.log(`Channel ${channelName} already exists, skipping subscription`);
      return () => {};
    }

    // Add to active channels
    activeChannels.add(channelName);
    console.log(`Creating new subscription for channel: ${channelName}`);
    
    // Get existing channels
    const existingChannels = supabase.getChannels();
    
    // Check if channel already exists
    const existingChannel = existingChannels.find(
      channel => channel.topic === channelName
    );
    
    // If channel exists but is in CLOSED state, remove it first
    if (existingChannel && existingChannel._state === 'closed') {
      console.log(`Removing closed channel: ${channelName}`);
      supabase.removeChannel(existingChannel);
    }
    
    let channel;
    
    try {
      // Create a new channel with the subscription
      channel = supabase.channel(channelName);
      
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
      
      console.log(`Successfully created subscription to ${config.table} on channel ${channelName}`);
    } catch (err) {
      console.error(`Error setting up subscription to ${config.table}:`, err);
      setError(err instanceof Error ? err.message : 'Subscription error');
      setIsConnected(false);
      activeChannels.delete(channelName);
    }
    
    // Return cleanup function to unsubscribe and remove from active channels
    return () => {
      try {
        if (channel) {
          console.log(`Removing channel ${channelName}`);
          supabase.removeChannel(channel);
        }
        activeChannels.delete(channelName);
      } catch (err) {
        console.error(`Error removing channel ${channelName}:`, err);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, config.table, config.event, config.filter, ...dependencies]);

  return { isConnected, error };
}