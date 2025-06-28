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
import { Search, X, Share2, Award, Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import NotificationsButton from '@/components/common/NotificationsButton';
import { useAchievements } from '@/hooks/useAchievements';

export default function AchievementsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { achievements, isLoading } = useAchievements();

  // Filter achievements based on search query
  const filteredAchievements = achievements.filter(achievement => 
    achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort achievements: completed first, then by title
  const sortedAchievements = filteredAchievements.sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return a.title.localeCompare(b.title);
  });

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

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;

  const renderAchievementItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.achievementCard,
        !item.completed && styles.incompleteCard
      ]} 
      onPress={() => handleAchievementPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.achievementImageContainer}>
        <Image 
          source={{ uri: item.icon_url }} 
          style={[
            styles.achievementImage,
            !item.completed && styles.grayscaleImage
          ]} 
        />
        {item.completed && (
          <View style={styles.completedBadge}>
            <Star size={16} color={COLORS.accent} fill={COLORS.accent} />
          </View>
        )}
      </View>
      
      <View style={styles.achievementContent}>
        <Text 
          style={[
            styles.achievementTitle,
            !item.completed && styles.incompleteText
          ]} 
          numberOfLines={2}
        >
          {item.title}
        </Text>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              !item.completed && styles.incompleteProgressBar
            ]}
          >
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, (item.currentValue / item.targetValue) * 100)}%` },
                !item.completed && styles.incompleteProgressFill
              ]} 
            />
          </View>
        </View>
        
        <Text style={[
          styles.progressText,
          !item.completed && styles.incompleteText
        ]}>
          {item.completed ? 'Completed!' : `${item.currentValue}/${item.targetValue}`}
        </Text>

        <View style={styles.rewardContainer}>
          <Text style={[
            styles.rewardText,
            !item.completed && styles.incompleteText
          ]}>
            {item.pawsReward} Paws
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.statsContainer}>
            <Award size={20} color={COLORS.primary} />
            <Text style={styles.statsText}>
              {completedCount}/{totalCount} Completed
            </Text>
          </View>
        </View>
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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <X size={20} color={COLORS.neutralMedium} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sortedAchievements}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.achievementsList}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Award size={64} color={COLORS.neutralMedium} />
            <Text style={styles.emptyText}>
              {isLoading 
                ? 'Loading achievements...' 
                : searchQuery 
                ? 'No achievements match your search'
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
              
              <View style={styles.modalImageContainer}>
                <Image 
                  source={{ uri: selectedAchievement.icon_url }} 
                  style={[
                    styles.modalImage,
                    !selectedAchievement.completed && styles.grayscaleImage
                  ]} 
                />
                {selectedAchievement.completed && (
                  <View style={styles.modalCompletedBadge}>
                    <Star size={24} color={COLORS.accent} fill={COLORS.accent} />
                  </View>
                )}
              </View>
              
              <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
              <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
              
              <View style={styles.modalProgressContainer}>
                <View 
                  style={[
                    styles.modalProgressBar,
                    !selectedAchievement.completed && styles.incompleteProgressBar
                  ]}
                >
                  <View 
                    style={[
                      styles.modalProgressFill, 
                      { 
                        width: `${Math.min(100, (selectedAchievement.currentValue / selectedAchievement.targetValue) * 100)}%` 
                      },
                      !selectedAchievement.completed && styles.incompleteProgressFill
                    ]} 
                  />
                </View>
              </View>
              
              <Text style={styles.modalProgressText}>
                {selectedAchievement.completed 
                  ? 'Completed!' 
                  : `${selectedAchievement.currentValue}/${selectedAchievement.targetValue} ${selectedAchievement.unit}`}
              </Text>
              
              <View style={styles.modalRewardContainer}>
                <Text style={styles.modalRewardLabel}>Reward</Text>
                <Text style={styles.modalRewardText}>
                  {selectedAchievement.pawsReward} Paws
                </Text>
              </View>
              
              {selectedAchievement.completed && (
                <TouchableOpacity style={styles.shareButton} onPress={shareAchievement}>
                  <Share2 size={20} color={COLORS.white} />
                  <Text style={styles.shareButtonText}>Share Achievement</Text>
                </TouchableOpacity>
              )}

              {!selectedAchievement.completed && (
                <View style={styles.incompleteNotice}>
                  <Text style={styles.incompleteNoticeText}>
                    Keep walking to unlock this achievement!
                  </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  achievementsList: {
    padding: 8,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  incompleteCard: {
    opacity: 0.6,
    borderColor: COLORS.neutralLight,
    shadowOpacity: 0.06,
  },
  achievementImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  grayscaleImage: {
    opacity: 0.7,
    // Note: CSS filter grayscale doesn't work in React Native
    // For true grayscale, you'd need to use a library like react-native-image-filter-kit
    // or process images server-side. For now, we use opacity to simulate the effect.
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementContent: {
    alignItems: 'center',
  },
  achievementTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  incompleteText: {
    color: COLORS.neutralMedium,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 6,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  incompleteProgressBar: {
    backgroundColor: COLORS.neutralLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  incompleteProgressFill: {
    backgroundColor: COLORS.neutralMedium,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  rewardContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rewardText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalCompletedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalProgressContainer: {
    width: '100%',
    marginBottom: 12,
  },
  modalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  modalProgressText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 20,
  },
  modalRewardContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  modalRewardLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalRewardText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  incompleteNotice: {
    backgroundColor: COLORS.neutralExtraLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  incompleteNoticeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralMedium,
    textAlign: 'center',
  },
});