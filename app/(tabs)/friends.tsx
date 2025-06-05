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
import { COLORS } from '@/constants/theme';
import { useFriends } from '@/hooks/useFriends';
import UserCard from '@/components/friends/UserCard';
import FriendRequestItem from '@/components/friends/FriendRequestItem';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { 
    friends, 
    friendRequests, 
    searchUsers, 
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    isLoading
  } = useFriends();

  // Filtered friends list based on search query
  const filteredFriends = searchQuery.trim() === ''
    ? friends
    : friends.filter(friend => 
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.dogName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleUserPress = (user) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const closeUserModal = () => {
    setUserModalVisible(false);
    setSelectedUser(null);
  };

  const handleSendRequest = () => {
    if (selectedUser) {
      sendFriendRequest(selectedUser.id);
      closeUserModal();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No friend requests</Text>
                </View>
              }
            />
          )}

          {activeTab === 'discover' && (
            <FlatList
              data={searchUsers(searchQuery)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserCard 
                  user={item} 
                  onPress={() => handleUserPress(item)} 
                  isFriend={false}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim() !== '' 
                      ? 'No users found' 
                      : 'Search for users to add as friends'}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={userModalVisible}
        onRequestClose={closeUserModal}
      >
        {selectedUser && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeUserModal}>
                <X size={24} color={COLORS.neutralDark} />
              </TouchableOpacity>
              
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{selectedUser.name.charAt(0)}</Text>
              </View>
              
              <Text style={styles.userName}>{selectedUser.name}</Text>
              
              <View style={styles.dogInfoContainer}>
                <Text style={styles.dogName}>{selectedUser.dogName}</Text>
                <Text style={styles.dogBreed}>{selectedUser.dogBreed}</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedUser.territorySize} km²</Text>
                  <Text style={styles.statLabel}>Territory</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedUser.achievementCount}</Text>
                  <Text style={styles.statLabel}>Badges</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedUser.totalDistance} km</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
              </View>
              
              {!selectedUser.isFriend && !selectedUser.requestSent && (
                <TouchableOpacity style={styles.addFriendButton} onPress={handleSendRequest}>
                  <UserPlus size={20} color={COLORS.white} />
                  <Text style={styles.addFriendButtonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
              
              {!selectedUser.isFriend && selectedUser.requestSent && (
                <View style={styles.requestSentContainer}>
                  <Clock size={20} color={COLORS.neutralDark} />
                  <Text style={styles.requestSentText}>Request Sent</Text>
                </View>
              )}
              
              {selectedUser.isFriend && (
                <View style={styles.friendStatusContainer}>
                  <UserCheck size={20} color={COLORS.primary} />
                  <Text style={styles.friendStatusText}>Friends</Text>
                </View>
              )}
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontFamily: 'SF-Pro-Display-Bold',
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
    fontFamily: 'SF-Pro-Display-Regular',
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
    fontFamily: 'SF-Pro-Display-Medium',
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
    fontFamily: 'SF-Pro-Display-Medium',
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
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 14,
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatarText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 32,
    color: COLORS.primary,
  },
  userName: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  dogInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dogName: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
  dogBreed: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 16,
    marginBottom: 24,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.neutralMedium,
  },
  statValue: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
  },
  statLabel: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  addFriendButtonText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  requestSentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  requestSentText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginLeft: 8,
  },
  friendStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  friendStatusText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
});