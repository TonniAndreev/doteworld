import { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, MapPin, Route, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: string;
  avatar: string;
  stats: {
    territory: string;
    walks: number;
    distance: string;
  };
}

export default function DogsScreen() {
  const [dogs, setDogs] = useState<Dog[]>([
    {
      id: '1',
      name: 'Baxter',
      breed: 'Golden Retriever',
      age: '3 years',
      avatar: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=300',
      stats: {
        territory: '18,750 m²',
        walks: 24,
        distance: '36.8 km',
      },
    },
    {
      id: '2',
      name: 'Luna',
      breed: 'Border Collie',
      age: '2 years',
      avatar: 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300',
      stats: {
        territory: '12,300 m²',
        walks: 18,
        distance: '27.5 km',
      },
    },
  ]);

  const renderDogItem = ({ item }: { item: Dog }) => (
    <TouchableOpacity 
      style={styles.dogCard}
      onPress={() => router.push(`/dog/${item.id}`)}
    >
      <View style={styles.dogHeader}>
        <Image source={{ uri: item.avatar }} style={styles.dogAvatar} />
        <View style={styles.dogInfo}>
          <Text style={styles.dogName}>{item.name}</Text>
          <Text style={styles.dogBreed}>{item.breed}</Text>
          
          <View style={styles.ageContainer}>
            <Calendar size={14} color={COLORS.gray600} />
            <Text style={styles.dogAge}>{item.age}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/dog/edit/${item.id}`)}
        >
          <Pencil size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{item.stats.territory}</Text>
          <Text style={styles.statLabel}>Territory</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Route size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{item.stats.distance}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Plus size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{item.stats.walks}</Text>
          <Text style={styles.statLabel}>Walks</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>My Dogs</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/dog/add')}
      >
        <Plus size={20} color={COLORS.white} />
        <Text style={styles.addButtonText}>Add Dog</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300' }} 
        style={styles.emptyImage} 
      />
      <Text style={styles.emptyTitle}>No Dogs Added Yet</Text>
      <Text style={styles.emptyText}>
        Add your furry friend to start tracking walks and conquering territory!
      </Text>
      <TouchableOpacity 
        style={styles.addDogButton}
        onPress={() => router.push('/dog/add')}
      >
        <Plus size={20} color={COLORS.white} />
        <Text style={styles.addDogButtonText}>Add Your First Dog</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={dogs}
        renderItem={renderDogItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.dark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  dogCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dogHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  dogAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  dogInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dogName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.dark,
    marginBottom: 4,
  },
  dogBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray700,
    marginBottom: 6,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dogAge: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.gray100,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.dark,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray300,
    marginHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addDogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addDogButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
});