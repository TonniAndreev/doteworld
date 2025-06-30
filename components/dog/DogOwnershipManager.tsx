import React, { useState, useEffect, useCallback } from 'react';
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
import { X, Crown, UserX, UserPlus, Mail, Send, Search, Check, ArrowRight, Shield } from 'lucide-react-native';
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
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<any>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  
  const { user } = useAuth();
  const { 
    getDogOwners, 
    removeCoOwner, 
    inviteCoOwner, 
    searchUsersForDogOwnership,
    addExistingOwner,
    transferAlphaOwnership
  } = useDogOwnership();

  useEffect(() => {
    if (visible) {
      loadOwners();
      // Reset all state when modal opens
      setShowInviteForm(false);
      setSearchQuery('');
      setUserSearchQuery('');
      setSearchResults([]);
      setShowTransferConfirm(false);
      setSelectedUserForTransfer(null);
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

  // Search for users as you type
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (userSearchQuery.trim() && userSearchQuery.length >= 2) {
        handleSearchUsers(userSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [userSearchQuery]);

  const handleSearchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsersForDogOwnership(query, dogId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddExistingUser = async (userId: string, userName: string) => {
    try {
      const result = await addExistingOwner(dogId, userId);
      
      if (result.success) {
        Alert.alert('Success', `${userName} has been added as an owner of ${dogName}`);
        setUserSearchQuery('');
        setSearchResults([]);
        loadOwners();
      } else {
        Alert.alert('Error', result.error || 'Failed to add user as owner');
      }
    } catch (error) {
      console.error('Error adding user as owner:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleTransferAlpha = (owner: any) => {
    setSelectedUserForTransfer(owner);
    setShowTransferConfirm(true);
  };

  const confirmTransferAlpha = async () => {
    if (!selectedUserForTransfer) return;
    
    setIsTransferring(true);
    try {
      const result = await transferAlphaOwnership(dogId, selectedUserForTransfer.profile_id);
      
      if (result.success) {
        Alert.alert('Success', `Alpha ownership has been transferred to ${selectedUserForTransfer.first_name} ${selectedUserForTransfer.last_name}`);
        setShowTransferConfirm(false);
        setSelectedUserForTransfer(null);
        loadOwners();
      } else {
        Alert.alert('Error', result.error || 'Failed to transfer Alpha ownership');
      }
    } catch (error) {
      console.error('Error transferring Alpha ownership:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsTransferring(false);
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

  const canTransferAlphaTo = (owner: any) => {
    if (!user || !isAlphaOwner()) return false;
    
    // Can't transfer to yourself (you're already Alpha)
    if (owner.profile_id === user.id) return false;
    
    // Can only transfer to co-owners, not caretakers
    return owner.role === 'co-owner';
  };

  // Filter owners based on search query
  const filteredOwners = searchQuery.trim() === '' 
    ? owners 
    : owners.filter(owner => 
        `${owner.first_name} ${owner.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Sort owners to ensure Alpha is always first
  const sortedOwners = [...filteredOwners].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    return 0;
  });

  const renderOwner = ({ item: owner }: { item: any }) => (
    <View style={[
      styles.ownerItem,
      owner.role === 'owner' && styles.alphaOwnerItem
    ]}>
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
          <Crown size={16} color={owner.role === 'owner' ? COLORS.accent : COLORS.primary} />
          <Text style={[
            styles.roleText,
            owner.role === 'owner' ? styles.alphaRoleText : styles.regularRoleText
          ]}>
            {owner.role === 'owner' ? 'Alpha Owner' : 'Owner'}
          </Text>
        </View>
      </View>
      
      <View style={styles.ownerActions}>
        {canTransferAlphaTo(owner) && (
          <TouchableOpacity
            style={styles.transferButton}
            onPress={() => handleTransferAlpha(owner)}
          >
            <ArrowRight size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        
        {canRemoveOwner(owner) && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveOwner(owner.profile_id, `${owner.first_name} ${owner.last_name}`)}
          >
            <UserX size={16} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSearchResult = ({ item: user }: { item: any }) => (
    <View style={styles.searchResultItem}>
      <UserAvatar
        userId={user.id}
        photoURL={user.avatar_url}
        userName={`${user.first_name} ${user.last_name}`}
        size={40}
        style={styles.searchResultAvatar}
      />
      
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>
          {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
        </Text>
        <Text style={styles.searchResultEmail}>{user.email}</Text>
      </View>
      
      {user.is_already_owner ? (
        <View style={styles.alreadyOwnerBadge}>
          <Check size={16} color={COLORS.success} />
          <Text style={styles.alreadyOwnerText}>Owner</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddExistingUser(user.id, `${user.first_name} ${user.last_name}`)}
        >
          <UserPlus size={16} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add</Text>
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
              {/* Search Bar - Automatically searches as you type */}
              <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.neutralMedium} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  placeholderTextColor={COLORS.neutralMedium}
                  autoCapitalize="none"
                />
              </View>

              {/* Search Results */}
              {userSearchQuery.length >= 2 && (
                <View style={styles.searchResultsContainer}>
                  {isSearching ? (
                    <View style={styles.searchingContainer}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.searchingText}>Searching...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    <FlatList
                      data={searchResults}
                      renderItem={renderSearchResult}
                      keyExtractor={(item) => item.id}
                      style={styles.searchResultsList}
                      contentContainerStyle={styles.searchResultsContent}
                    />
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No users found matching "{userSearchQuery}"
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              {isAlphaOwner() && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.actionButton,
                      showInviteForm && styles.activeActionButton
                    ]}
                    onPress={() => {
                      setShowInviteForm(!showInviteForm);
                    }}
                  >
                    <Mail size={20} color={showInviteForm ? COLORS.white : COLORS.primary} />
                    <Text style={[
                      styles.actionButtonText,
                      showInviteForm && styles.activeActionButtonText
                    ]}>
                      Invite by Email
                    </Text>
                  </TouchableOpacity>
                </View>
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

              {/* Owners List */}
              <View style={styles.ownersListContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Current Owners</Text>
                  <View style={styles.ownerCountBadge}>
                    <Text style={styles.ownerCountText}>{owners.length}</Text>
                  </View>
                </View>
                
                {/* Filter Owners */}
                <View style={styles.filterContainer}>
                  <Search size={16} color={COLORS.neutralMedium} style={styles.filterIcon} />
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Filter owners..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={COLORS.neutralMedium}
                  />
                </View>
                
                {isLoadingOwners ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading owners...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={sortedOwners}
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

              {/* Ownership Levels Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>Ownership Levels</Text>
                <View style={styles.infoItem}>
                  <Crown size={16} color={COLORS.accent} />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoHighlight}>Alpha Owner:</Text> Full management rights, can add/remove owners
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Shield size={16} color={COLORS.primary} />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoHighlight}>Owner:</Text> Can view and interact with profile
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alpha Transfer Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTransferConfirm}
        onRequestClose={() => setShowTransferConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <Text style={styles.confirmTitle}>Transfer Alpha Ownership</Text>
            
            {selectedUserForTransfer && (
              <>
                <Text style={styles.confirmText}>
                  Are you sure you want to transfer Alpha ownership to{' '}
                  <Text style={styles.confirmHighlight}>
                    {selectedUserForTransfer.first_name} {selectedUserForTransfer.last_name}
                  </Text>?
                </Text>
                
                <Text style={styles.confirmWarning}>
                  This action will make them the Alpha Owner with full control over {dogName}'s profile. You will become a regular Owner.
                </Text>
                
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowTransferConfirm(false);
                      setSelectedUserForTransfer(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmTransferAlpha}
                    disabled={isTransferring}
                  >
                    {isTransferring ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.confirmButtonText}>Transfer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  searchResultsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    maxHeight: 200,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  searchingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginLeft: 8,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultsContent: {
    paddingBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  searchResultAvatar: {
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 2,
  },
  searchResultEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  alreadyOwnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  alreadyOwnerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.success,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.white,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  activeActionButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  activeActionButtonText: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginRight: 8,
  },
  ownerCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  ownerCountText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
    paddingVertical: 8,
  },
  ownersListContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
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
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  alphaOwnerItem: {
    borderColor: COLORS.accentLight,
    backgroundColor: COLORS.neutralExtraLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
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
  },
  alphaRoleText: {
    color: COLORS.accent,
  },
  regularRoleText: {
    color: COLORS.primary,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  transferButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  infoContainer: {
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralDark,
    flex: 1,
  },
  infoHighlight: {
    fontFamily: 'Inter-Bold',
  },
  confirmModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmHighlight: {
    fontFamily: 'Inter-Bold',
    color: COLORS.primary,
  },
  confirmWarning: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.warning,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: COLORS.warningLight,
    padding: 12,
    borderRadius: 8,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.neutralLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});