import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  UserPlus, 
  Users, 
  UserCheck, 
  X, 
  Check, 
  UserX,
  Clock 
} from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useFriends } from '@/hooks/useFriends';
import NotificationsButton from '@/components/common/NotificationsButton';
import UserCard from '@/components/friends/UserCard';
import FriendRequestItem from '@/components/friends/FriendRequestItem';
import UserAvatar from '@/components/common/UserAvatar';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Handle search with debouncing
  useEffect(() => {
    if (activeTab !== 'discover') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

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
  }, [searchQuery, activeTab]);

  // Filtered friends list based on search query
  const filteredFriends = searchQuery.trim() === ''
    ? friends
    : friends.filter(friend => 
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.dogName.toLowerCase().includes(searchQuery.toLowerCase())
      );

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <NotificationsButton />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.neutralDark} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'friends' ? "Search friends..." : "Find new friends..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.neutralMedium}
        />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Users size={20} color={activeTab === 'friends' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <UserPlus size={20} color={activeTab === 'requests' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests {friendRequests.length > 0 ? `(${friendRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <UserPlus size={20} color={activeTab === 'discover' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {activeTab === 'friends' && (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserCard 
                  user={item} 
                  onPress={() => handleUserPress(item)} 
                  isFriend={true}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim() !== '' 
                      ? 'No friends match your search' 
                      : 'You have no friends yet'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.addFriendsButton}
                    onPress={() => setActiveTab('discover')}
                  >
                    <Text style={styles.addFriendsButtonText}>Find Friends</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}

          {activeTab === 'requests' && (
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FriendRequestItem 
                  request={item}
                  onAccept={() => acceptFriendRequest(item.id)}
                  onDecline={() => declineFriendRequest(item.id)}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No friend requests</Text>
                </View>
              }
            />
          )}

          {activeTab === 'discover' && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserCard 
                  user={item} 
                  onPress={() => handleUserPress(item)} 
                  isFriend={false}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {isSearching 
                      ? 'Searching...'
                      : searchQuery.trim() !== '' 
                      ? 'No users found' 
                      : 'Search for users to add as friends'}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: COLORS.neutralLight,
  },
  activeTab: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    marginLeft: 4,
    color: COLORS.neutralDark,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  addFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addFriendsButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
  },
});