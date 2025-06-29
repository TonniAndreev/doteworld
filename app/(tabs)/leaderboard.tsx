import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, MapPin, Route, Medal } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';

type LeaderboardTab = 'territory' | 'distance' | 'walks';

interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  dogName: string;
  avatar: string;
  dogAvatar: string;
  value: number | string;
  isCurrentUser: boolean;
}

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('territory');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    // In a real app, this would fetch data from an API
    const mockData: LeaderboardItem[] = [
      {
        id: '1',
        rank: 1,
        name: 'Sarah Johnson',
        dogName: 'Max',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        dogAvatar: 'https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=150',
        value: activeTab === 'territory' ? '24,500 m²' : activeTab === 'distance' ? '42.3 km' : '28',
        isCurrentUser: false,
      },
      {
        id: '2',
        rank: 2,
        name: 'Michael Chen',
        dogName: 'Bella',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        dogAvatar: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=150',
        value: activeTab === 'territory' ? '18,750 m²' : activeTab === 'distance' ? '36.8 km' : '24',
        isCurrentUser: true,
      },
      {
        id: '3',
        rank: 3,
        name: 'Emma Wilson',
        dogName: 'Charlie',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        dogAvatar: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=150',
        value: activeTab === 'territory' ? '15,200 m²' : activeTab === 'distance' ? '31.5 km' : '19',
        isCurrentUser: false,
      },
      {
        id: '4',
        rank: 4,
        name: 'David Rodriguez',
        dogName: 'Luna',
        avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
        dogAvatar: 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=150',
        value: activeTab === 'territory' ? '12,800 m²' : activeTab === 'distance' ? '28.2 km' : '17',
        isCurrentUser: false,
      },
      {
        id: '5',
        rank: 5,
        name: 'Olivia Smith',
        dogName: 'Cooper',
        avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
        dogAvatar: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=150',
        value: activeTab === 'territory' ? '10,500 m²' : activeTab === 'distance' ? '25.7 km' : '15',
        isCurrentUser: false,
      },
    ];

    setLeaderboardData(mockData);
  }, [activeTab]);

  const renderLeaderboardItem = ({ item }: { item: LeaderboardItem }) => (
    <TouchableOpacity 
      style={[styles.leaderboardItem, item.isCurrentUser && styles.currentUserItem]}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <View style={styles.rankContainer}>
        {item.rank <= 3 ? (
          <Medal size={24} color={
            item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32'
          } />
        ) : (
          <Text style={styles.rankText}>{item.rank}</Text>
        )}
      </View>
      
      <View style={styles.userContainer}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Image source={{ uri: item.dogAvatar }} style={styles.dogAvatar} />
        </View>
        
        <View style={styles.nameContainer}>
          <Text style={[styles.userName, item.isCurrentUser && styles.currentUserText]}>
            {item.name}
          </Text>
          <Text style={styles.dogName}>{item.dogName}</Text>
        </View>
      </View>
      
      <Text style={[styles.valueText, item.isCurrentUser && styles.currentUserText]}>
        {item.value}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Leaderboard</Text>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'territory' && styles.activeTab]}
          onPress={() => setActiveTab('territory')}
        >
          <MapPin size={16} color={activeTab === 'territory' ? COLORS.primary : COLORS.gray600} />
          <Text style={[styles.tabText, activeTab === 'territory' && styles.activeTabText]}>
            Territory
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'distance' && styles.activeTab]}
          onPress={() => setActiveTab('distance')}
        >
          <Route size={16} color={activeTab === 'distance' ? COLORS.primary : COLORS.gray600} />
          <Text style={[styles.tabText, activeTab === 'distance' && styles.activeTabText]}>
            Distance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'walks' && styles.activeTab]}
          onPress={() => setActiveTab('walks')}
        >
          <Trophy size={16} color={activeTab === 'walks' ? COLORS.primary : COLORS.gray600} />
          <Text style={[styles.tabText, activeTab === 'walks' && styles.activeTabText]}>
            Walks
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
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
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.dark,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.gray700,
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dogAvatar: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 2,
  },
  dogName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray600,
  },
  valueText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  currentUserText: {
    color: COLORS.primary,
  },
});