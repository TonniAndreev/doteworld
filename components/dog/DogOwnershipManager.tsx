import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { UserPlus, Users, Mail, X, Crown, Shield, Eye, Trash2 } from 'lucide-react-native';
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
  const [activeTab, setActiveTab] = useState<'owners' | 'invite'>('owners');
  const [owners, setOwners] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'co-owner' | 'caretaker'>('co-owner');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  const { user } = useAuth();
  const { 
    isLoading, 
    getDogOwners, 
    inviteCoOwner, 
    removeCoOwner 
  } = useDogOwnership();

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

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const result = await inviteCoOwner(dogId, inviteEmail.trim(), inviteRole, inviteMessage.trim());
    
    if (result.success) {
      Alert.alert('Success', 'Invitation sent successfully!');
      setInviteEmail('');
      setInviteMessage('');
      setActiveTab('owners');
    } else {
      Alert.alert('Error', result.error || 'Failed to send invitation');
    }
  };

  const handleRemoveOwner = async (profileId: string, ownerName: string) => {
    Alert.alert(
      'Remove Co-Owner',
      `Are you sure you want to remove ${ownerName} as a co-owner of ${dogName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeCoOwner(dogId, profileId);
            if (result.success) {
              Alert.alert('Success', 'Co-owner removed successfully');
              loadOwners();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove co-owner');
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

  const renderOwner = ({ item: owner }: { item: any }) => (
    <View style={styles.ownerItem}>
      <UserAvatar
        userId={owner.profile_id}
        photoURL={owner.avatar_url}
        userName={`${owner.first_name} ${owner.last_name}`}
        size={50}
      />
      
      <View style={styles.ownerInfo}>
        <Text style={styles.ownerName}>
          {`${owner.first_name} ${owner.last_name}`.trim()}
        </Text>
        
        <View style={styles.roleContainer}>
          {getRoleIcon(owner.role)}
          <Text style={[styles.roleText, { color: getRoleColor(owner.role) }]}>
            {owner.role.charAt(0).toUpperCase() + owner.role.slice(1)}
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
          <Trash2 size={20} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      animationType="slide"
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

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'owners' && styles.activeTab]}
              onPress={() => setActiveTab('owners')}
            >
              <Users size={20} color={activeTab === 'owners' ? COLORS.primary : COLORS.neutralMedium} />
              <Text style={[styles.tabText, activeTab === 'owners' && styles.activeTabText]}>
                Owners ({owners.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'invite' && styles.activeTab]}
              onPress={() => setActiveTab('invite')}
            >
              <UserPlus size={20} color={activeTab === 'invite' ? COLORS.primary : COLORS.neutralMedium} />
              <Text style={[styles.tabText, activeTab === 'invite' && styles.activeTabText]}>
                Invite
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {activeTab === 'owners' ? (
              <View style={styles.ownersTab}>
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
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No owners found</Text>
                      </View>
                    }
                  />
                )}
              </View>
            ) : (
              <View style={styles.inviteTab}>
                <Text style={styles.sectionTitle}>Invite Co-Owner</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
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
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[styles.roleOption, inviteRole === 'co-owner' && styles.selectedRoleOption]}
                      onPress={() => setInviteRole('co-owner')}
                    >
                      <Shield size={20} color={inviteRole === 'co-owner' ? COLORS.white : COLORS.primary} />
                      <Text style={[styles.roleOptionText, inviteRole === 'co-owner' && styles.selectedRoleOptionText]}>
                        Co-Owner
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleOption, inviteRole === 'caretaker' && styles.selectedRoleOption]}
                      onPress={() => setInviteRole('caretaker')}
                    >
                      <Eye size={20} color={inviteRole === 'caretaker' ? COLORS.white : COLORS.secondary} />
                      <Text style={[styles.roleOptionText, inviteRole === 'caretaker' && styles.selectedRoleOptionText]}>
                        Caretaker
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.messageInput]}
                    value={inviteMessage}
                    onChangeText={setInviteMessage}
                    placeholder="Add a personal message..."
                    placeholderTextColor={COLORS.neutralMedium}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={handleInvite}
                  disabled={isLoading || !inviteEmail.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <UserPlus size={20} color={COLORS.white} />
                      <Text style={styles.inviteButtonText}>Send Invitation</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.roleExplanation}>
                  <Text style={styles.explanationTitle}>Role Permissions:</Text>
                  <Text style={styles.explanationText}>
                    <Text style={styles.boldText}>Co-Owner:</Text> Can edit dog info and invite others
                  </Text>
                  <Text style={styles.explanationText}>
                    <Text style={styles.boldText}>Caretaker:</Text> Can view dog info only
                  </Text>
                </View>
              </View>
            )}
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ownersTab: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  ownerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  ownershipDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  removeButton: {
    padding: 8,
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
  inviteTab: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 12,
  },
  messageInput: {
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.neutralLight,
    gap: 8,
  },
  selectedRoleOption: {
    backgroundColor: COLORS.primary,
  },
  roleOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  selectedRoleOptionText: {
    color: COLORS.white,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  inviteButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  roleExplanation: {
    backgroundColor: COLORS.neutralExtraLight,
    padding: 16,
    borderRadius: 12,
  },
  explanationTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  explanationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 4,
  },
  boldText: {
    fontFamily: 'Inter-Bold',
    color: COLORS.neutralDark,
  },
});