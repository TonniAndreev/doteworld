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
import LeaderboardItem from '@/components/leaderboard/LeaderboardItem';
import { fetchLeaderboard } from '@/services/leaderboardService';

type LeaderboardTab = 'territory' | 'distance' | 'achievements' | 'paws';

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('territory');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const filteredData = searchQuery.trim() === ''
    ? leaderboardData
    : leaderboardData.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dogName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const renderTopThree = () => {
    if (!leaderboardData || leaderboardData.length < 3) return null;

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

    return (
      <View style={styles.top3Container}>
        {/* Second Place - Left */}
        <View style={[styles.topUser, styles.top2]}>
          <View style={styles.crownContainer}>
            {/* Empty space for alignment */}
          </View>
          <View style={[styles.avatar, styles.avatar2]}>
            <Text style={styles.avatarText}>{second.name.charAt(0)}</Text>
          </View>
          <View style={styles.nameAndDogContainer}>
            <Text style={styles.topUserName} numberOfLines={1}>{second.name}</Text>
            <Text style={styles.topDogName} numberOfLines={1}>{second.dogName}</Text>
          </View>
          <Text style={styles.topUserScore}>
            {getValue(second)}
          </Text>
        </View>

        {/* First Place - Center */}
        <View style={[styles.topUser, styles.top1, styles.highlightedTop1]}>
          <View style={styles.crownContainer}>
            <Crown size={28} color={COLORS.accent} />
          </View>
          <View style={[styles.avatar, styles.avatar1, styles.highlightedAvatar1]}>
            <Text style={[styles.avatarText, styles.firstPlaceAvatarText]}>{first.name.charAt(0)}</Text>
          </View>
          <View style={styles.nameAndDogContainer}>
            <Text style={[styles.topUserName, styles.firstPlaceName]} numberOfLines={1}>{first.name}</Text>
            <Text style={[styles.topDogName, styles.firstPlaceDogName]} numberOfLines={1}>{first.dogName}</Text>
          </View>
          <Text style={[styles.topUserScore, styles.firstPlaceScore]}>
            {getValue(first)}
          </Text>
        </View>

        {/* Third Place - Right */}
        <View style={[styles.topUser, styles.top3]}>
          <View style={styles.crownContainer}>
            {/* Empty space for alignment */}
          </View>
          <View style={[styles.avatar, styles.avatar3]}>
            <Text style={styles.avatarText}>{third.name.charAt(0)}</Text>
          </View>
          <View style={styles.nameAndDogContainer}>
            <Text style={styles.topUserName} numberOfLines={1}>{third.name}</Text>
            <Text style={styles.topDogName} numberOfLines={1}>{third.dogName}</Text>
          </View>
          <Text style={styles.topUserScore}>
            {getValue(third)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
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
        <FlatList
          data={filteredData.slice(3)} // Skip the top 3
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <LeaderboardItem 
              rank={index + 4} // +4 because we skipped the top 3
              user={item} 
              category={activeTab}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
        />
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
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crownContainer: {
    height: 32,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 8,
  },
  avatar1: {
    width: 64,
    height: 64,
  },
  avatar2: {
    width: 52,
    height: 52,
  },
  avatar3: {
    width: 44,
    height: 44,
  },
  highlightedAvatar1: {
    borderWidth: 3,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.primary,
  },
  firstPlaceAvatarText: {
    fontSize: 24,
    color: COLORS.accent,
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
    color: COLORS.accent,
  },
  topDogName: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
  firstPlaceDogName: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontFamily: 'Inter-Medium',
  },
  topUserScore: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: COLORS.primary,
    textAlign: 'center',
  },
  firstPlaceScore: {
    fontSize: 13,
    color: COLORS.accent,
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
});