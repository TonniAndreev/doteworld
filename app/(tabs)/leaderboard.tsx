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
        {!isLoading && leaderboardData.length > 0 && (
          <View style={styles.top3Container}>
            {leaderboardData.slice(0, 3).map((user, index) => (
              <View key={user.id} style={[styles.topUser, styles[`top${index + 1}`]]}>
                <View style={styles.crownContainer}>
                  {index === 0 && <Crown size={24} color={COLORS.gold} />}
                </View>
                <View style={[styles.avatar, styles[`avatar${index + 1}`]]}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>
                <Text style={styles.topUserName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.topUserScore}>
                  {activeTab === 'territory' ? `${user.territorySize} km²` : 
                   activeTab === 'distance' ? `${user.totalDistance} km` : 
                   activeTab === 'achievements' ? `${user.achievementCount}` : 
                   `${user.pawsBalance}`}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  topRankContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  top3Container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 140,
  },
  topUser: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  top1: {
    height: 140,
    zIndex: 3,
  },
  top2: {
    height: 110,
    zIndex: 2,
  },
  top3: {
    height: 90,
    zIndex: 1,
  },
  crownContainer: {
    height: 24,
    marginBottom: 4,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
  },
  avatar1: {
    width: 80,
    height: 80,
  },
  avatar2: {
    width: 60,
    height: 60,
  },
  avatar3: {
    width: 50,
    height: 50,
  },
  avatarText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 24,
    color: COLORS.primary,
  },
  topUserName: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginTop: 8,
    width: 80,
    textAlign: 'center',
  },
  topUserScore: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
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
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
  },
});