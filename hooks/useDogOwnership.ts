import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

interface DogOwner {
  profile_id: string;
  role: 'owner' | 'co-owner' | 'caretaker';
  permissions: {
    edit: boolean;
    delete: boolean;
    share: boolean;
  };
  ownership_since: string;
  invited_by?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface DogOwnershipInvite {
  id: string;
  dog_id: string;
  inviter_id: string;
  invitee_id: string;
  role: 'co-owner' | 'caretaker';
  permissions: {
    edit: boolean;
    delete: boolean;
    share: boolean;
  };
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  created_at: string;
  expires_at: string;
  inviter_name: string;
  dog_name: string;
}

export function useDogOwnership() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshUserData } = useAuth();

  const getDogOwners = async (dogId: string): Promise<DogOwner[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('dog_owners_view')
        .select('*')
        .eq('dog_id', dogId);

      if (error) {
        console.error('Error fetching dog owners:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching dog owners:', error);
      return [];
    }
  };

  const getMyDogInvites = async (): Promise<DogOwnershipInvite[]> => {
    if (!user) return [];

    try {
      console.log('Fetching dog invites for user:', user.id);
      
      const { data, error } = await supabase
        .from('dog_ownership_invites')
        .select(`
          *,
          inviter:profiles!dog_ownership_invites_inviter_id_fkey(first_name, last_name),
          dog:dogs(name)
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching dog invites:', error.message, error.details);
        return [];
      }

      console.log('Dog invites data:', data);
      
      return (data || []).map(invite => ({
        id: invite.id,
        dog_id: invite.dog_id,
        inviter_id: invite.inviter_id,
        invitee_id: invite.invitee_id,
        role: invite.role,
        permissions: invite.permissions,
        status: invite.status,
        message: invite.message,
        created_at: invite.created_at,
        expires_at: invite.expires_at,
        inviter_name: `${invite.inviter?.first_name || ''} ${invite.inviter?.last_name || ''}`.trim() || 'Unknown',
        dog_name: invite.dog?.name || 'Unknown Dog',
      }));
    } catch (error) {
      console.error('Error fetching dog invites:', error);
      return [];
    }
  };

  const inviteCoOwner = async (
    dogId: string, 
    inviteeEmail: string, 
    role: 'co-owner' | 'caretaker' = 'co-owner',
    message?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      // First, find the user by email
      const { data: inviteeProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .ilike('email', inviteeEmail)
        .single();

      if (profileError || !inviteeProfile) {
        return { success: false, error: 'User not found with that email address' };
      }

      // Check if user already has access to this dog
      const { data: existingAccess } = await supabase
        .from('profile_dogs')
        .select('id')
        .eq('dog_id', dogId)
        .eq('profile_id', inviteeProfile.id)
        .single();

      if (existingAccess) {
        return { success: false, error: 'User already has access to this dog' };
      }

      // Check if there's already a pending invite
      const { data: existingInvite } = await supabase
        .from('dog_ownership_invites')
        .select('id')
        .eq('dog_id', dogId)
        .eq('invitee_id', inviteeProfile.id)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        return { success: false, error: 'Invite already sent to this user' };
      }

      // Set permissions based on role
      const permissions = role === 'co-owner' 
        ? { edit: true, delete: false, share: true }
        : { edit: false, delete: false, share: false };

      // Create the invite
      const { error: inviteError } = await supabase
        .from('dog_ownership_invites')
        .insert({
          dog_id: dogId,
          inviter_id: user.id,
          invitee_id: inviteeProfile.id,
          role,
          permissions,
          message,
        });

      if (inviteError) {
        console.error('Error creating invite:', inviteError);
        return { success: false, error: 'Failed to send invite' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error inviting co-owner:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('accept_dog_ownership_invite', {
        invite_id: inviteId
      });

      if (error || !data) {
        console.error('Error accepting invite:', error);
        return { success: false, error: 'Failed to accept invite' };
      }

      // Refresh user data to include new dog
      await refreshUserData();

      return { success: true };
    } catch (error) {
      console.error('Error accepting invite:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const declineInvite = async (inviteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('decline_dog_ownership_invite', {
        invite_id: inviteId
      });

      if (error || !data) {
        console.error('Error declining invite:', error);
        return { success: false, error: 'Failed to decline invite' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error declining invite:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoOwner = async (dogId: string, profileId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('remove_dog_co_owner', {
        dog_id_param: dogId,
        profile_id_param: profileId
      });

      if (error || !data) {
        console.error('Error removing co-owner:', error);
        return { success: false, error: 'Failed to remove co-owner' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing co-owner:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateDogData = async (dogId: string, updates: any): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      // Ensure we're writing to database, not cache
      const { error } = await supabase
        .from('dogs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dogId);

      if (error) {
        console.error('Error updating dog data:', error);
        return { success: false, error: 'Failed to update dog information' };
      }

      // Force refresh of user data to ensure consistency
      await refreshUserData();

      return { success: true };
    } catch (error) {
      console.error('Error updating dog data:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getDogOwners,
    getMyDogInvites,
    inviteCoOwner,
    acceptInvite,
    declineInvite,
    removeCoOwner,
    updateDogData,
  };
}