import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Route, Award, Settings, LogOut, Pencil } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300' }} 
              style={styles.profileImage} 
            />
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Pencil size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>Michael Chen</Text>
          <Text style={styles.profileUsername}>@michaelchen</Text>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>18,750 m²</Text>
              <Text style={styles.statLabel}>Territory</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>36.8 km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Walks</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Dogs</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/dogs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dogsScroll}>
            <TouchableOpacity style={styles.dogCard} onPress={() => router.push('/dog/1')}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=300' }} 
                style={styles.dogImage} 
              />
              <Text style={styles.dogName}>Baxter</Text>
              <Text style={styles.dogBreed}>Golden Retriever</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dogCard} onPress={() => router.push('/dog/2')}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300' }} 
                style={styles.dogImage} 
              />
              <Text style={styles.dogName}>Luna</Text>
              <Text style={styles.dogBreed}>Border Collie</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.addDogCard} onPress={() => router.push('/dog/add')}>
              <View style={styles.addDogButton}>
                <Plus size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.addDogText}>Add Dog</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.achievementsContainer}>
            <TouchableOpacity style={styles.achievementCard} onPress={() => router.push('/achievements')}>
              <View style={styles.achievementIconContainer}>
                <Award size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.achievementName}>Early Bird</Text>
              <Text style={styles.achievementDesc}>Complete a walk before 8 AM</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.achievementCard} onPress={() => router.push('/achievements')}>
              <View style={styles.achievementIconContainer}>
                <Route size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.achievementName}>Marathon</Text>
              <Text style={styles.achievementDesc}>Walk 10 km in a single session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.achievementCard} onPress={() => router.push('/achievements')}>
              <View style={styles.achievementIconContainer}>
                <MapPin size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.achievementName}>Conqueror</Text>
              <Text style={styles.achievementDesc}>Claim 10,000 m² of territory</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.dark,
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.dark,
    marginBottom: 4,
  },
  profileUsername: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.gray600,
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
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
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.dark,
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  dogsScroll: {
    marginBottom: 10,
  },
  dogCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  dogImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  dogName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 2,
  },
  dogBreed: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.gray600,
  },
  addDogCard: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDogButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addDogText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 8,
  },
});