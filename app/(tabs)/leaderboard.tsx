import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Crown, Map, Route, Award, Coins } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import NotificationsButton from '@/components/common/NotificationsButton';
import LeaderboardItem from '@/components/leaderboard/LeaderboardItem';
import UserAvatar from '@/components/common/UserAvatar';
import UserProfileModal from '@/components/leaderboard/UserProfileModal';
import { fetchLeaderboard } from '@/services/leaderboardService';
import { useAuth } from '@/contexts/AuthContext';

type LeaderboardTab = 'territory' | 'distance' | 'achievements' | 'paws';

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('territory');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const { user } = useAuth();

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboardData();
  }, [activeTab]);

  const loadLeaderboardData = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchLeaderboard(activeTab);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadLeaderboardData(true);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleUserPress = (userData) => {
    setSelectedUser(userData);
    setUserModalVisible(true);
  };

  const closeUserModal = () => {
    setUserModalVisible(false);
    setSelectedUser(null);
  };

  // Find current user's position in the full leaderboard
  const currentUserRank = leaderboardData.findIndex(item => item.id === user?.id) + 1;
  const currentUserData = leaderboardData.find(item => item.id === user?.id);

  // Filter data based on search query
  const getFilteredData = () => {
    if (searchQuery.trim() === '') {
      // No search - show top 10
      return leaderboardData.slice(0, 10);
    } else {
      // Search mode - show all matching results
      return leaderboardData.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dogName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const filteredData = getFilteredData();

  // Check if current user is in the visible list
  const isCurrentUserVisible = filteredData.some(item => item.id === user?.id);

  const renderTopThree = () => {
    if (!leaderboardData || leaderboardData.length < 3 || searchQuery.trim() !== '') return null;

    const [first, second, third] = leaderboardData.slice(0, 3);

    const getValue = (user) => {
      switch (activeTab) {
        case 'territory':
          return `${user.territorySize} km²`;
        case 'distance':
          return `${user.totalDistance} km`;
        case 'achievements':
          return `${user.achievementCount}`;
        case 'paws':
          return `${user.pawsBalance}`;
        default:
          return '';
      }
    };

    const isCurrentUser = (userId) => userId === user?.id;

    return (
      <View style={styles.top3Container}>
        {/* Second Place - Left */}
        <TouchableOpacity 
          style={[
            styles.topUser, 
            styles.top2,
            isCurrentUser(second.id) && styles.highlightedUser
          ]}
          onPress={() => handleUserPress(second)}
        >
          <View style={styles.crownContainer}>
            {/* Empty space for alignment */}
          </View>
          <UserAvatar
            userId={second.id}
            photoURL={second.photoURL}
            userName={second.name}
            size={52}
            style={[
              styles.avatarImage,
              isCurrentUser(second.id) && styles.highlightedAvatar
            ]}
          />
          <View style={styles.nameAndDogContainer}>
            <Text style={[
              styles.topUserName,
              isCurrentUser(second.id) && styles.highlightedText
            ]} numberOfLines={1}>{second.name}</Text>
            <Text style={[
              styles.topDogName,
              isCurrentUser(second.id) && styles.highlightedDogText
            ]} numberOfLines={1}>{second.dogName}</Text>
          </View>
          <Text style={[
            styles.topUserScore,
            isCurrentUser(second.id) && styles.highlightedScore
          ]}>
            {getValue(second)}
          </Text>
        </TouchableOpacity>

        {/* First Place - Center */}
        <TouchableOpacity 
          style={[
            styles.topUser, 
            styles.top1, 
            styles.highlightedTop1,
            isCurrentUser(first.id) && styles.highlightedUser
          ]}
          onPress={() => handleUserPress(first)}
        >
          <View style={styles.crownContainer}>
            <Crown size={28} color={COLORS.accentDark} />
          </View>
          <UserAvatar
            userId={first.id}
            photoURL={first.photoURL}
            userName={first.name}
            size={64}
            style={[
              styles.avatarImage, 
              styles.highlightedAvatar1,
              isCurrentUser(first.id) && styles.highlightedAvatar
            ]}
          />
          <View style={styles.nameAndDogContainer}>
            <Text style={[
              styles.topUserName, 
              styles.firstPlaceName,
              isCurrentUser(first.id) && styles.highlightedText
            ]} numberOfLines={1}>{first.name}</Text>
            <Text style={[
              styles.topDogName, 
              styles.firstPlaceDogName,
              isCurrentUser(first.id) && styles.highlightedDogText
            ]} numberOfLines={1}>{first.dogName}</Text>
          </View>
          <Text style={[
            styles.topUserScore, 
            styles.firstPlaceScore,
            isCurrentUser(first.id) && styles.highlightedScore
          ]}>
            {getValue(first)}
          </Text>
        </TouchableOpacity>

        {/* Third Place - Right */}
        <TouchableOpacity 
          style={[
            styles.topUser, 
            styles.top3,
            isCurrentUser(third.id) && styles.highlightedUser
          ]}
          onPress={() => handleUserPress(third)}
        >
          <View style={styles.crownContainer}>
            {/* Empty space for alignment */}
          </View>
          <UserAvatar
            userId={third.id}
            photoURL={third.photoURL}
            userName={third.name}
            size={44}
            style={[
              styles.avatarImage,
              isCurrentUser(third.id) && styles.highlightedAvatar
            ]}
          />
          <View style={styles.nameAndDogContainer}>
            <Text style={[
              styles.topUserName,
              isCurrentUser(third.id) && styles.highlightedText
            ]} numberOfLines={1}>{third.name}</Text>
            <Text style={[
              styles.topDogName,
              isCurrentUser(third.id) && styles.highlightedDogText
            ]} numberOfLines={1}>{third.dogName}</Text>
          </View>
          <Text style={[
            styles.topUserScore,
            isCurrentUser(third.id) && styles.highlightedScore
          ]}>
            {getValue(third)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentUserPosition = () => {
    // Only show if user is not in top 10 and not searching
    if (searchQuery.trim() !== '' || !currentUserData || currentUserRank <= 10) {
      return null;
    }

    return (
      <View style={styles.currentUserSection}>
        <Text style={styles.currentUserLabel}>Your Position</Text>
        <LeaderboardItem 
          rank={currentUserRank}
          user={currentUserData} 
          category={activeTab}
          isCurrentUser={true}
          onPress={() => handleUserPress(currentUserData)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <NotificationsButton />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.neutralDark} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users or dogs..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={COLORS.neutralMedium}
        />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'territory' && styles.activeTab]}
          onPress={() => setActiveTab('territory')}
        >
          <Map size={20} color={activeTab === 'territory' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'territory' && styles.activeTabText]}>Territory</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'distance' && styles.activeTab]}
          onPress={() => setActiveTab('distance')}
        >
          <Route size={20} color={activeTab === 'distance' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'distance' && styles.activeTabText]}>Distance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Award size={20} color={activeTab === 'achievements' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Badges</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'paws' && styles.activeTab]}
          onPress={() => setActiveTab('paws')}
        >
          <Coins size={20} color={activeTab === 'paws' ? COLORS.primary : COLORS.neutralDark} />
          <Text style={[styles.tabText, activeTab === 'paws' && styles.activeTabText]}>Paws</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topRankContainer}>
        {!isLoading && leaderboardData.length > 0 && renderTopThree()}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={searchQuery.trim() === '' ? filteredData.slice(3) : filteredData}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const rank = searchQuery.trim() === '' ? index + 4 : leaderboardData.findIndex(u => u.id === item.id) + 1;
              return (
                <LeaderboardItem 
                  rank={rank}
                  user={item} 
                  category={activeTab}
                  isCurrentUser={item.id === user?.id}
                  onPress={() => handleUserPress(item)}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.trim() !== '' ? 'No results found' : 'No leaderboard data'}
                </Text>
              </View>
            }
            ListFooterComponent={renderCurrentUserPosition}
          />
        </>
      )}

      <UserProfileModal
        visible={userModalVisible}
        onClose={closeUserModal}
        user={selectedUser}
      />
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
  topRankContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  top3Container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  topUser: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 8,
    paddingTop: 16,
    backgroundColor: COLORS.neutralExtraLight,
    borderRadius: 16,
    marginHorizontal: 4,
    width: 100,
  },
  top1: {
    height: 180,
    zIndex: 3,
    backgroundColor: COLORS.primaryExtraLight,
  },
  top2: {
    height: 150,
    zIndex: 2,
  },
  top3: {
    height: 130,
    zIndex: 1,
  },
  highlightedTop1: {
    borderWidth: 2,
    borderColor: COLORS.accentDark,
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  highlightedUser: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryExtraLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  crownContainer: {
    height: 32,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    marginBottom: 8,
  },
  highlightedAvatar1: {
    borderWidth: 3,
    borderColor: COLORS.accentDark,
  },
  highlightedAvatar: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  nameAndDogContainer: {
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  topUserName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  firstPlaceName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.accentDark, // Darkest shade of yellow
  },
  highlightedText: {
    color: COLORS.primary,
    fontFamily: 'Inter-Bold',
  },
  topDogName: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
  firstPlaceDogName: {
    fontSize: 11,
    color: COLORS.accentDark, // Darkest shade of yellow
    fontFamily: 'Inter-Medium',
  },
  highlightedDogText: {
    color: COLORS.primary,
  },
  topUserScore: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: COLORS.primary,
    textAlign: 'center',
  },
  firstPlaceScore: {
    fontSize: 13,
    color: COLORS.accentDark, // Darkest shade of yellow
  },
  highlightedScore: {
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
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
  currentUserSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralLight,
  },
  currentUserLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 12,
    textAlign: 'center',
  },
});