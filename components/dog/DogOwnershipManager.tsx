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
import { X, Crown, UserX, UserPlus, Mail, Send, Search } from 'lucide-react-native';
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  
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
      console.log('Loading owners for dog:', dogId);
      const ownersData = await getDogOwners(dogId);
      console.log('Owners data loaded:', ownersData);
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

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteCoOwner(dogId, inviteEmail.trim(), 'co-owner', inviteMessage.trim());
      
      if (result.success) {
        Alert.alert('Success', 'Invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
        setShowInviteForm(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsInviting(false);
    }
  };

  const isAlphaOwner = () => {
    if (!user) return false;
    const currentUserOwnership = owners.find(o => o.profile_id === user.id);
    return currentUserOwnership?.role === 'owner';
  };

  const canRemoveOwner = (owner: any) => {
    if (!user) return false;
    
    // Can't remove yourself
    if (owner.profile_id === user.id) return false;
    
    // Can't remove the original owner
    if (owner.role === 'owner') return false;
    
    // Check if current user is the alpha owner
    return isAlphaOwner();
  };

  // Filter owners based on search query
  const filteredOwners = searchQuery.trim() === '' 
    ? owners 
    : owners.filter(owner => 
        `${owner.first_name} ${owner.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );

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
          <Crown size={16} color={COLORS.accent} />
          <Text style={styles.roleText}>
            {owner.role === 'owner' ? 'Alpha Owner' : 'Owner'}
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
    <>
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

            <View style={styles.content}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.neutralMedium} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search owners..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={COLORS.neutralMedium}
                />
              </View>

              {/* Invite Form Toggle */}
              {isAlphaOwner() && (
                <TouchableOpacity 
                  style={styles.inviteButton}
                  onPress={() => setShowInviteForm(!showInviteForm)}
                >
                  <UserPlus size={20} color={COLORS.white} />
                  <Text style={styles.inviteButtonText}>
                    {showInviteForm ? 'Cancel Invite' : 'Invite Owner'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Invite Form */}
              {showInviteForm && (
                <View style={styles.inviteForm}>
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
                    <Text style={styles.inputLabel}>Message (Optional)</Text>
                    <TextInput
                      style={styles.messageInput}
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
                    style={styles.sendButton}
                    onPress={handleSendInvite}
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Send size={20} color={COLORS.white} />
                        <Text style={styles.sendButtonText}>Send Invitation</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.ownersListContainer}>
                <Text style={styles.sectionTitle}>Current Owners</Text>
                
                {isLoadingOwners ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading owners...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredOwners}
                    renderItem={renderOwner}
                    keyExtractor={(item) => item.profile_id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.ownersList}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          {searchQuery.trim() !== '' 
                            ? 'No owners match your search' 
                            : 'No owners found'}
                        </Text>
                      </View>
                    }
                  />
                )}
              </View>
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
    backgroundColor: '#F8F8F8',
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
    backgroundColor: COLORS.white,
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    paddingVertical: 12,
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
  inviteForm: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  inputGroup: {
    marginBottom: 16,
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
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 12,
  },
  messageInput: {
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  ownersListContainer: {
    flex: 1,
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
    fontSize: 12,
    color: COLORS.accent,
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