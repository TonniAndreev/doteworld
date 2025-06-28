import { useState, useEffect } from 'react';
import { supabase, logActiveChannels, safelyCreateChannel } from '@/utils/supabase';

type SubscriptionEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
type SubscriptionCallback = (payload: any) => void;

interface SubscriptionConfig {
  table: string;
  schema?: string;
  event: SubscriptionEventType;
  filter?: string;
}

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
    // Debug channel status at start
    logActiveChannels();
    
    let channel: any = null;
    
    try {
      // Create channel safely (checks if it already exists)
      channel = safelyCreateChannel(channelName);
      
      // Set up the subscription
      channel.on(
        'postgres_changes',
        {
          event: config.event,
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        callback
      ).subscribe((status: string) => {
        console.log(`Channel ${channelName} status: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
        setError(status === 'CHANNEL_ERROR' ? 'Subscription error' : null);
      });
      
      console.log(`Created subscription to ${config.table} on channel ${channelName}`);
    } catch (err) {
      console.error(`Error setting up subscription to ${config.table}:`, err);
      setError(err instanceof Error ? err.message : 'Subscription error');
      setIsConnected(false);
    }
    
    // Return cleanup function to unsubscribe
    return () => {
      try {
        if (channel) {
          console.log(`Removing channel ${channelName}`);
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.error(`Error removing channel ${channelName}:`, err);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, config.table, config.event, config.filter, ...dependencies]);

  return { isConnected, error };
}