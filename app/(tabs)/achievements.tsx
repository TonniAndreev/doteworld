import { useState, useEffect } from 'react';
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

export default function BadgesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { achievements: badges, isLoading, checkAchievements } = useAchievements();

  // Check for achievements when the screen loads
  useEffect(() => {
    const checkForNewAchievements = async () => {
      await checkAchievements();
    };
    
    checkForNewAchievements();
  }, []);

  // Filter badges based on search query
  const filteredBadges = badges.filter(badge => 
    badge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    badge.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort badges: completed first, then by title
  const sortedBadges = filteredBadges.sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return a.title.localeCompare(b.title);
  });

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const shareBadge = async () => {
    if (selectedBadge && selectedBadge.completed) {
      try {
        await Share.share({
          message: `I just earned the "${selectedBadge.title}" badge on Dote! Walking my dog has never been more fun.`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBadge(null);
  };

  const completedCount = badges.filter(b => b.completed).length;
  const totalCount = badges.length;

  const renderBadgeItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.badgeCard,
        !item.completed && styles.incompleteBadge
      ]} 
      onPress={() => handleBadgePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.badgeImageContainer}>
        <Image 
          source={{ uri: item.icon_url }} 
          style={[
            styles.badgeImage,
            !item.completed && styles.grayscaleImage
          ]} 
        />
        {item.completed && (
          <View style={styles.completedBadge}>
            <Star size={16} color={COLORS.accent} fill={COLORS.accent} />
          </View>
        )}
      </View>
      
      <View style={styles.badgeContent}>
        <Text 
          style={[
            styles.badgeTitle,
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
          {item.completed ? 'Earned!' : `${Math.round(item.currentValue * 100)}%`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Badges</Text>
          <View style={styles.statsContainer}>
            <Award size={20} color={COLORS.primary} />
            <Text style={styles.statsText}>
              {completedCount}/{totalCount} Earned
            </Text>
          </View>
        </View>
        <NotificationsButton />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.neutralDark} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search badges..."
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
        data={sortedBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.badgesList}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Award size={64} color={COLORS.neutralMedium} />
            <Text style={styles.emptyText}>
              {isLoading 
                ? 'Loading badges...' 
                : searchQuery 
                ? 'No badges match your search'
                : 'No badges found'}
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
        {selectedBadge && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={COLORS.neutralDark} />
              </TouchableOpacity>
              
              <View style={styles.modalImageContainer}>
                <Image 
                  source={{ uri: selectedBadge.icon_url }} 
                  style={[
                    styles.modalImage,
                    !selectedBadge.completed && styles.grayscaleImage
                  ]} 
                />
                {selectedBadge.completed && (
                  <View style={styles.modalCompletedBadge}>
                    <Star size={24} color={COLORS.accent} fill={COLORS.accent} />
                  </View>
                )}
              </View>
              
              <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
              <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
              
              <View style={styles.modalProgressContainer}>
                <View 
                  style={[
                    styles.modalProgressBar,
                    !selectedBadge.completed && styles.incompleteProgressBar
                  ]}
                >
                  <View 
                    style={[
                      styles.modalProgressFill, 
                      { 
                        width: `${Math.min(100, (selectedBadge.currentValue / selectedBadge.targetValue) * 100)}%` 
                      },
                      !selectedBadge.completed && styles.incompleteProgressFill
                    ]} 
                  />
                </View>
              </View>
              
              <Text style={styles.modalProgressText}>
                {selectedBadge.completed 
                  ? 'Badge Earned!' 
                  : `${Math.round(selectedBadge.currentValue * 100)}% Complete`}
              </Text>
              
              {selectedBadge.completed && (
                <TouchableOpacity style={styles.shareButton} onPress={shareBadge}>
                  <Share2 size={20} color={COLORS.white} />
                  <Text style={styles.shareButtonText}>Share Badge</Text>
                </TouchableOpacity>
              )}

              {!selectedBadge.completed && (
                <View style={styles.incompleteNotice}>
                  <Text style={styles.incompleteNoticeText}>
                    Keep walking and conquering to earn this badge!
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
  badgesList: {
    padding: 8,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeCard: {
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
  incompleteBadge: {
    opacity: 0.6,
    borderColor: COLORS.neutralLight,
    shadowOpacity: 0.06,
  },
  badgeImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  grayscaleImage: {
    opacity: 0.7,
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
  badgeContent: {
    alignItems: 'center',
  },
  badgeTitle: {
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