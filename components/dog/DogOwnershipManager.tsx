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
  TextInput,
} from 'react-native';
import { X, Crown, Shield, Eye, UserX, UserPlus, Mail, Send } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useDogOwnership } from '@/hooks/useDogOwnership';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';

interface DogOwnershipManagerProps {
  dogId: string;
  dogName: string;
  visible: boolean;
  onClose: () => void;
}

export default function DogOwnershipManager({ dogId, dogName, visible, onClose }: DogOwnershipManagerProps) {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const { user } = useAuth();
  const { getDogOwners, removeCoOwner, inviteCoOwner } = useDogOwnership();

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

  const handleInviteOwner = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteCoOwner(dogId, inviteEmail.trim(), 'co-owner');
      
      if (result.success) {
        Alert.alert('Success', 'Invitation sent successfully!');
        setInviteEmail('');
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsInviting(false);
    }
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
        size={48}
        style={styles.ownerAvatar}
      />
      
      <View style={styles.ownerInfo}>
        <Text style={styles.ownerName}>
          {`${owner.first_name || ''} ${owner.last_name || ''}`.trim()}
        </Text>
        
        <View style={styles.ownerRole}>
          {getRoleIcon(owner.role)}
          <Text style={[styles.roleText, { color: getRoleColor(owner.role) }]}>
            Owner
          </Text>
        </View>
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
              <View style={styles.inviteSection}>
                <View style={styles.inputWithIcon}>
                  <Mail size={20} color={COLORS.neutralMedium} />
                  <TextInput
                    style={styles.textInput}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="Enter email address"
                    placeholderTextColor={COLORS.neutralMedium}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={handleInviteOwner}
                  disabled={isInviting || !inviteEmail.trim()}
                >
                  {isInviting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Send size={20} color={COLORS.white} />
                      <Text style={styles.inviteButtonText}>Invite Owner</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.ownersSection}>
              <Text style={styles.sectionTitle}>Current Owners ({owners.length}/4)</Text>
              
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
      </View>
    </Modal>
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
    maxHeight: '80%',
    overflow: 'hidden',
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
    maxHeight: '80%',
  },
  inviteSection: {
    marginBottom: 24,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  ownersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 16,
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
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
    gap: 6,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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