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
import { Search, Crown, Map, Route, Award } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import NotificationsButton from '@/components/common/NotificationsButton';
import LeaderboardItem from '@/components/leaderboard/LeaderboardItem';
import CitySelector from '@/components/leaderboard/CitySelector';
import UserAvatar from '@/components/common/UserAvatar';
import { fetchLeaderboard } from '@/services/leaderboardService';
import { getUserCities, findNearestCity, reverseGeocodeToCity, getOrCreateCityInSupabase } from '@/utils/geocoding';
import { useAuth } from '@/contexts/AuthContext';
import * as Location from 'expo-location';

type LeaderboardTab = 'territory' | 'distance' | 'achievements';

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  territorySize?: number;
}

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('territory');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userCities, setUserCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  
  const { user } = useAuth();

  // Load user cities
  useEffect(() => {
    const loadUserCities = async () => {
      if (!user) return;
      
      setIsLoadingCities(true);
      try {
        // Get cities where user has territory
        const cities = await getUserCities();
        setUserCities(cities);
        
        // If user has cities, select the first one
        if (cities.length > 0) {
          setSelectedCity(cities[0]);
        } else if (user.current_city_id && user.current_city_name) {
          // If user has a current city but no territories, use that
          setSelectedCity({
            id: user.current_city_id,
            name: user.current_city_name,
            state: null,
            country: 'Unknown'
          });
        } else {
          // If no cities at all, try to get current location and find nearest city
          await findUserCity();
        }
      } catch (error) {
        console.error('Error loading user cities:', error);
      } finally {
        setIsLoadingCities(false);
      }
    };
    
    loadUserCities();
  }, [user]);

  // Find user's city based on current location
  const findUserCity = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      // Try to find nearest city first (faster)
      const nearestCity = await findNearestCity(
        location.coords.latitude,
        location.coords.longitude
      );
      
      if (nearestCity) {
        setSelectedCity(nearestCity);
        return;
      }
      
      // If no nearest city found, try reverse geocoding
      const cityDetails = await reverseGeocodeToCity(
        location.coords.latitude,
        location.coords.longitude
      );
      
      if (cityDetails) {
        const cityId = await getOrCreateCityInSupabase(cityDetails);
        if (cityId) {
          setSelectedCity({
            id: cityId,
            name: cityDetails.name,
            state: cityDetails.state,
            country: cityDetails.country
          });
        }
      }
    } catch (error) {
      console.error('Error finding user city:', error);
    }
  };

  // Load leaderboard data
  useEffect(() => {
    if (selectedCity) {
      loadLeaderboardData();
    }
  }, [activeTab, selectedCity]);

  const loadLeaderboardData = async (refresh = false) => {
    if (!selectedCity) return;
    
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      console.log('Loading leaderboard data for category:', activeTab, 'in city:', selectedCity.name);
      const data = await fetchLeaderboard(activeTab, selectedCity.id);
      console.log('Received leaderboard data:', data.length, 'users');
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setLeaderboardData([]);
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
    // Navigate directly to the public profile page
    router.push(`/user/${userData.id}`);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
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
          return `${(user.territorySize * 1000000).toFixed(0)} m²`;
        case 'distance':
          return `${user.totalDistance} km`;
        case 'achievements':
          return `${user.badgeCount}`;
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

      {/* City Selector */}
      <CitySelector
        cities={userCities}
        selectedCity={selectedCity}
        isLoading={isLoadingCities}
        onSelectCity={handleCitySelect}
      />

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
              !isLoading && leaderboardData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim() !== '' ? 'No results found' : selectedCity ? `No leaderboard data for ${selectedCity.name}` : 'No leaderboard data'}
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={renderCurrentUserPosition}
          />
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
    color: COLORS.accentDark,
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
    color: COLORS.accentDark,
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
    color: COLORS.accentDark,
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