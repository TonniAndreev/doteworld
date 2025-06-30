import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Check, X, Crown, Shield, Eye, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useDogOwnership } from '@/hooks/useDogOwnership';
import UserAvatar from '@/components/common/UserAvatar';

interface DogOwnershipInvitesProps {
  onInviteHandled?: () => void;
}

export default function DogOwnershipInvites({ onInviteHandled }: DogOwnershipInvitesProps) {
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());

  const { getMyDogInvites, acceptInvite, declineInvite } = useDogOwnership();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setIsLoading(true);
    try {
      console.log('Loading dog ownership invites...');
      const invitesData = await getMyDogInvites();
      console.log('Loaded invites:', invitesData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string, dogName: string) => {
    setProcessingInvites(prev => new Set(prev).add(inviteId));
    
    try {
      const result = await acceptInvite(inviteId);
      
      if (result.success) {
        Alert.alert('Success', `You are now an owner of ${dogName}!`);
        await loadInvites();
        onInviteHandled?.();
      } else {
        Alert.alert('Error', result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
    }
  };

  const handleDeclineInvite = async (inviteId: string, dogName: string) => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to be an owner of ${dogName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingInvites(prev => new Set(prev).add(inviteId));
            
            try {
              const result = await declineInvite(inviteId);
              
              if (result.success) {
                Alert.alert('Declined', 'Invitation declined');
                await loadInvites();
                onInviteHandled?.();
              } else {
                Alert.alert('Error', result.error || 'Failed to decline invitation');
              }
            } catch (error) {
              console.error('Error declining invite:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setProcessingInvites(prev => {
                const newSet = new Set(prev);
                newSet.delete(inviteId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'co-owner':
        return <Shield size={16} color={COLORS.primary} />;
      case 'caretaker':
        return <Eye size={16} color={COLORS.secondary} />;
      default:
        return null;
    }
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    }
  };

  const renderInvite = ({ item: invite }: { item: any }) => {
    const isProcessing = processingInvites.has(invite.id);
    
    return (
      <View style={styles.inviteCard}>
        <View style={styles.inviteHeader}>
          <View style={styles.inviteInfo}>
            <Text style={styles.dogName}>{invite.dog_name}</Text>
            <View style={styles.roleContainer}>
              {getRoleIcon(invite.role)}
              <Text style={styles.roleText}>
                Owner
              </Text>
            </View>
          </View>
          
          <View style={styles.timeContainer}>
            <Clock size={14} color={COLORS.neutralMedium} />
            <Text style={styles.timeText}>{formatTimeLeft(invite.expires_at)}</Text>
          </View>
        </View>

        <Text style={styles.inviterText}>
          Invited by <Text style={styles.inviterName}>{invite.inviter_name}</Text>
        </Text>

        {invite.message && (
          <Text style={styles.messageText}>"{invite.message}"</Text>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptInvite(invite.id, invite.dog_name)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Check size={16} color={COLORS.white} />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineInvite(invite.id, invite.dog_name)}
            disabled={isProcessing}
          >
            <X size={16} color={COLORS.error} />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading invitations...</Text>
      </View>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dog Ownership Invitations</Text>
      
      <FlatList
        data={invites}
        renderItem={renderInvite}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  listContent: {
    gap: 16,
  },
  inviteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inviteInfo: {
    flex: 1,
  },
  dogName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  inviterText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 8,
  },
  inviterName: {
    fontFamily: 'Inter-Bold',
    color: COLORS.neutralDark,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    fontStyle: 'italic',
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primaryLight,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  acceptButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.white,
  },
  declineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  declineButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.error,
  },
});