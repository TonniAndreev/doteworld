import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Share, 
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Share2 } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import NotificationsButton from '@/components/common/NotificationsButton';
import { useAchievements } from '@/hooks/useAchievements';

type AchievementCategory = 'available' | 'completed';

export default function AchievementsScreen() {
  const [category, setCategory] = useState<AchievementCategory>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { achievements, isLoading } = useAchievements();

  const filteredAchievements = achievements
    .filter(achievement => 
      (category === 'completed' ? achievement.completed : !achievement.completed) &&
      (achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       achievement.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const handleAchievementPress = (achievement: any) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };

  const shareAchievement = async () => {
    if (selectedAchievement && selectedAchievement.completed) {
      try {
        await Share.share({
          message: `I just earned the "${selectedAchievement.title}" badge on Dote! Walking my dog has never been more fun.`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAchievement(null);
  };

  const renderAchievementItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.achievementCard,
        item.completed && styles.completedCard
      ]} 
      onPress={() => handleAchievementPress(item)}
    >
      <Image source={{ uri: item.icon_url }} style={styles.achievementImage} />
      <Text style={styles.achievementTitle} numberOfLines={1}>{item.title}</Text>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${Math.min(100, (item.currentValue / item.targetValue) * 100)}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {item.completed ? 'Completed!' : `${item.currentValue}/${item.targetValue}`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <NotificationsButton />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.neutralDark} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search achievements..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.neutralMedium}
        />
      </View>

      <View style={styles.categoryContainer}>
        <TouchableOpacity 
          style={[styles.categoryTab, category === 'available' && styles.activeCategory]}
          onPress={() => setCategory('available')}
        >
          <Text style={[styles.categoryText, category === 'available' && styles.activeCategoryText]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.categoryTab, category === 'completed' && styles.activeCategory]}
          onPress={() => setCategory('completed')}
        >
          <Text style={[styles.categoryText, category === 'completed' && styles.activeCategoryText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.achievementsList}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading 
                ? 'Loading achievements...' 
                : 'No achievements found'}
            </Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        {selectedAchievement && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={COLORS.neutralDark} />
              </TouchableOpacity>
              
              <Image 
                source={{ uri: selectedAchievement.icon_url }} 
                style={styles.modalImage} 
              />
              
              <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
              <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
              
              <View style={styles.modalProgressContainer}>
                <View 
                  style={[
                    styles.modalProgressBar, 
                    { 
                      width: `${Math.min(100, (selectedAchievement.currentValue / selectedAchievement.targetValue) * 100)}%` 
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.modalProgressText}>
                {selectedAchievement.completed 
                  ? 'Completed!' 
                  : `${selectedAchievement.currentValue}/${selectedAchievement.targetValue} ${selectedAchievement.unit}`}
              </Text>
              
              <Text style={styles.rewardText}>
                Reward: {selectedAchievement.pawsReward} Paws
              </Text>
              
              {selectedAchievement.completed && (
                <TouchableOpacity style={styles.shareButton} onPress={shareAchievement}>
                  <Share2 size={20} color={COLORS.white} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
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
  categoryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: COLORS.neutralLight,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeCategory: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
  activeCategoryText: {
    color: COLORS.primary,
  },
  achievementsList: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: COLORS.primaryLight,
  },
  achievementImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
    borderRadius: 40,
  },
  achievementTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.white,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
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
  modalImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.neutralLight,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  modalProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  modalProgressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  rewardText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
});