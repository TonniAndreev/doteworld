import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Share,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  X, 
  Check,
  Bell,
  Share2,
  Heart
} from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useFriends } from '@/hooks/useFriends';
import UserCard from '@/components/friends/UserCard';
import FriendRequestItem from '@/components/friends/FriendRequestItem';
import NotificationsButton from '@/components/common/NotificationsButton';

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { 
    friends, 
    friendRequests, 
    searchUsersAsync, 
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    refetch,
    isLoading
  } = useFriends();

  // Search for users when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchUsersAsync(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleUserPress = (user) => {
    console.log('Friend card pressed, user data:', user);
    // Navigate directly to the public profile page
    router.push(`/user/${user.id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleInviteFriends = async () => {
    try {
      const message = 'Join me on Dote, the app that makes dog walking more fun! Download it here: https://dote.app/download';
      
      if (Platform.OS === 'web') {
        // Web implementation
        if (navigator.share) {
          await navigator.share({
            title: 'Join me on Dote',
            text: message,
            url: 'https://dote.app/download'
          });
        } else {
          // Fallback for browsers that don't support navigator.share
          setShowInviteModal(true);
        }
      } else {
        // Native implementation
        await Share.share({
          message,
          url: 'https://dote.app/download',
          title: 'Join me on Dote'
        });
      }
    } catch (error) {
      console.error('Error sharing invitation:', error);
    }
  };

  const handleCopyInviteLink = () => {
    // In a real app, this would copy a link to the clipboard
    alert('Invite link copied to clipboard!');
    setShowInviteModal(false);
  };

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      );
    }
    
    if (searchQuery.trim() !== '') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      );
    }
    
    if (friendRequests.length === 0 && friends.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Image 
            source={require('@/assets/images/corgi_empty.jpg')}
            style={styles.emptyStateImage}
          />
          <Text style={styles.emptyStateTitle}>Don't keep your dog alone</Text>
          <Text style={styles.emptyStateText}>
            Invite friends or find one, so you can see their territories and walk together!
          </Text>
          <View style={styles.emptyStateButtons}>
            <TouchableOpacity 
              style={styles.emptyStatePrimaryButton}
              onPress={handleInviteFriends}
            >
              <UserPlus size={20} color={COLORS.white} />
              <Text style={styles.emptyStatePrimaryButtonText}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.emptyStateSecondaryButton}
              onPress={() => setSearchQuery('a')} // Trigger search with a common letter
            >
              <Search size={20} color={COLORS.primary} />
              <Text style={styles.emptyStateSecondaryButtonText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={handleInviteFriends}
          >
            <UserPlus size={20} color={COLORS.primary} />
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
          <NotificationsButton />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.neutralDark} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find new friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.neutralMedium}
        />
      </View>

      <FlatList
        data={searchQuery.trim() !== '' ? searchResults : [...friendRequests, ...friends]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Check if this is a friend request
          if (friendRequests.some(request => request.id === item.id)) {
            return (
              <FriendRequestItem 
                request={item}
                onAccept={() => acceptFriendRequest(item.id)}
                onDecline={() => declineFriendRequest(item.id)}
              />
            );
          }
          
          // Otherwise it's a friend or search result
          return (
            <UserCard 
              user={item} 
              onPress={() => handleUserPress(item)} 
              isFriend={friends.some(friend => friend.id === item.id)}
            />
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          (friendRequests.length === 0 && friends.length === 0 && !isSearching && searchQuery.trim() === '') && styles.fullHeightContent
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Invite Friends Modal (for web fallback) */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Friends</Text>
              <TouchableOpacity 
                onPress={() => setShowInviteModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.neutralDark} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalText}>
              Share this link with your friends to invite them to Dote:
            </Text>
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                https://dote.app/invite/your-unique-code
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleCopyInviteLink}
              >
                <Share2 size={20} color={COLORS.white} />
                <Text style={styles.modalButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  inviteButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    padding: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fullHeightContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginTop: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyStateButtons: {
    width: '100%',
    gap: 12,
  },
  emptyStatePrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  emptyStatePrimaryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  emptyStateSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  emptyStateSecondaryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  closeButton: {
    padding: 4,
  },
  modalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 16,
    lineHeight: 22,
  },
  linkContainer: {
    backgroundColor: COLORS.neutralLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  linkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  modalActions: {
    alignItems: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});