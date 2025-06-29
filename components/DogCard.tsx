import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Route, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';

interface DogCardProps {
  dog: {
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
  };
  onPress?: () => void;
}

export default function DogCard({ dog, onPress }: DogCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/dog/${dog.id}`);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <Image source={{ uri: dog.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.breed}>{dog.breed}</Text>
          
          <View style={styles.ageContainer}>
            <Calendar size={14} color={COLORS.gray600} />
            <Text style={styles.age}>{dog.age}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{dog.stats.territory}</Text>
          <Text style={styles.statLabel}>Territory</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Route size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{dog.stats.distance}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dog.stats.walks}</Text>
          <Text style={styles.statLabel}>Walks</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.dark,
    marginBottom: 4,
  },
  breed: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.gray700,
    marginBottom: 6,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  age: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
    marginLeft: 4,
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
});