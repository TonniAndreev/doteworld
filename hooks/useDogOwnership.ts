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

      // First, check if the dog already has 4 owners
      const { data: existingOwners, error: ownersError } = await supabase
        .from('profile_dogs')
        .select('profile_id')
        .eq('dog_id', dogId);

      if (ownersError) {
        console.error('Error checking existing owners:', ownersError);
        return { success: false, error: 'Failed to check existing owners' };
      }

      if (existingOwners && existingOwners.length >= 4) {
        return { success: false, error: 'This dog already has the maximum number of owners (4)' };
      }

      // Find the user by email
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
        return { success: false, error: 'Failed to remove owner' };
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

  // Function to update dog ownership permissions
  const updateDogPermissions = async (
    dogId: string, 
    profileId: string, 
    newPermissions: { edit?: boolean; share?: boolean; delete?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      // First get current permissions
      const { data: currentData, error: fetchError } = await supabase
        .from('profile_dogs')
        .select('permissions')
        .eq('dog_id', dogId)
        .eq('profile_id', profileId)
        .single();

      if (fetchError) {
        console.error('Error fetching current permissions:', fetchError);
        return { success: false, error: 'Failed to fetch current permissions' };
      }

      // Merge current permissions with new ones
      const updatedPermissions = {
        ...currentData.permissions,
        ...newPermissions
      };

      // Update permissions
      const { error: updateError } = await supabase
        .from('profile_dogs')
        .update({
          permissions: updatedPermissions
        })
        .eq('dog_id', dogId)
        .eq('profile_id', profileId);

      if (updateError) {
        console.error('Error updating permissions:', updateError);
        return { success: false, error: 'Failed to update permissions' };
      }

      // Refresh user data to ensure consistency
      await refreshUserData();

      return { success: true };
    } catch (error) {
      console.error('Error updating dog permissions:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle deep link invites
  const handleDeepLinkInvite = async (inviteToken: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);
      
      // In a real implementation, you would validate the invite token with your backend
      // For now, we'll simulate a successful invite acceptance
      
      // Parse the token to extract dog ID
      const parts = inviteToken.split('_');
      if (parts.length < 3) {
        return { success: false, error: 'Invalid invite token' };
      }
      
      const dogId = parts[0];
      
      // Check if the dog exists
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('id', dogId)
        .single();
        
      if (dogError || !dog) {
        return { success: false, error: 'Dog not found' };
      }
      
      // Create a direct link between user and dog
      const { error: linkError } = await supabase
        .from('profile_dogs')
        .insert({
          profile_id: user.id,
          dog_id: dogId,
          role: 'co-owner',
          permissions: { edit: true, delete: false, share: true }
        });
        
      if (linkError) {
        return { success: false, error: 'Failed to link dog to your profile' };
      }
      
      // Refresh user data
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error('Error handling deep link invite:', error);
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
    updateDogPermissions,
    handleDeepLinkInvite,
  };
}