import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Crown, Shield, Eye, UserX, UserPlus } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useDogOwnership } from '@/hooks/useDogOwnership';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';
import DogInviteModal from '@/components/dog/DogInviteModal';

interface DogOwnershipManagerProps {
  dogId: string;
  dogName: string;
  visible: boolean;
  onClose: () => void;
}

export default function DogOwnershipManager({ dogId, dogName, visible, onClose }: DogOwnershipManagerProps) {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { user } = useAuth();
  const { getDogOwners, removeCoOwner } = useDogOwnership();

  useEffect(() => {
    if (visible) {
      loadOwners();
    }
  }, [visible, dogId]);

  const loadOwners = async () => {
    setIsLoadingOwners(true);
    try {
      const ownersData = await getDogOwners(dogId);
      setOwners(ownersData);
    } catch (error) {
      console.error('Error loading owners:', error);
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const handleRemoveOwner = async (profileId: string, ownerName: string) => {
    Alert.alert(
      'Remove Owner',
      `Are you sure you want to remove ${ownerName} as an owner of ${dogName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeCoOwner(dogId, profileId);
            if (result.success) {
              Alert.alert('Success', 'Owner removed successfully');
              loadOwners();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove owner');
            }
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} color={COLORS.accent} />;
      case 'co-owner':
        return <Shield size={16} color={COLORS.primary} />;
      case 'caretaker':
        return <Eye size={16} color={COLORS.secondary} />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return COLORS.accent;
      case 'co-owner':
        return COLORS.primary;
      case 'caretaker':
        return COLORS.secondary;
      default:
        return COLORS.neutralMedium;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Alpha Owner';
      case 'co-owner':
        return 'Owner';
      case 'caretaker':
        return 'Caretaker';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const canRemoveOwner = (owner: any) => {
    if (!user) return false;
    
    // Can't remove yourself
    if (owner.profile_id === user.id) return false;
    
    // Can't remove the original owner
    if (owner.role === 'owner') return false;
    
    // Check if current user has share permissions
    const currentUserOwnership = owners.find(o => o.profile_id === user.id);
    return currentUserOwnership?.permissions?.share === true;
  };

  const canInviteOwners = () => {
    if (!user) return false;
    const currentUserOwnership = owners.find(o => o.profile_id === user.id);
    return currentUserOwnership?.permissions?.share === true;
  };

  const renderOwner = ({ item: owner }: { item: any }) => (
    <View style={styles.ownerItem}>
      <UserAvatar
        userId={owner.profile_id}
        photoURL={owner.avatar_url}
        userName={`${owner.first_name} ${owner.last_name}`}
        size={40}
        style={styles.ownerAvatar}
      />
      
      <View style={styles.ownerInfo}>
        <Text style={styles.ownerName}>
          {`${owner.first_name || ''} ${owner.last_name || ''}`.trim()}
        </Text>
        
        <View style={styles.ownerRole}>
          {getRoleIcon(owner.role)}
          <Text style={[styles.roleText, { color: getRoleColor(owner.role) }]}>
            {getRoleDisplayName(owner.role)}
          </Text>
        </View>
        
        <Text style={styles.ownershipDate}>
          Since {new Date(owner.ownership_since).toLocaleDateString()}
        </Text>
      </View>
      
      {canRemoveOwner(owner) && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveOwner(owner.profile_id, `${owner.first_name} ${owner.last_name}`)}
        >
          <UserX size={20} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage {dogName}'s Owners</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {canInviteOwners() && (
                <TouchableOpacity 
                  style={styles.inviteButton}
                  onPress={() => {
                    onClose();
                    // Short delay to avoid modal animation conflicts
                    setTimeout(() => setShowInviteModal(true), 300);
                  }}
                >
                  <UserPlus size={20} color={COLORS.white} />
                  <Text style={styles.inviteButtonText}>Add New Owner</Text>
                </TouchableOpacity>
              )}

              <View style={styles.ownersCountContainer}>
                <Text style={styles.ownersCountText}>
                  {owners.length} of 4 owners
                </Text>
              </View>

              {isLoadingOwners ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading owners...</Text>
                </View>
              ) : (
                <FlatList
                  data={owners}
                  renderItem={renderOwner}
                  keyExtractor={(item) => item.profile_id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.ownersList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No owners found</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      <DogInviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        dogId={dogId}
        dogName={dogName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: '80vh',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  inviteButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  ownersCountContainer: {
    backgroundColor: COLORS.neutralExtraLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  ownersCountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  ownersList: {
    paddingBottom: 20,
  },
  ownerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownerAvatar: {
    marginRight: 16,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  ownerRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 6,
  },
  ownershipDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
});