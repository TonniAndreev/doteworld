import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { X, Play, Crown, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { usePaws } from '@/contexts/PawsContext';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

interface PawsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PawsModal({ visible, onClose }: PawsModalProps) {
  const { 
    pawsBalance, 
    dailyAdsWatched, 
    maxDailyAds, 
    timeUntilNextPaw,
    watchAd 
  } = usePaws();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const canWatchAd = dailyAdsWatched < maxDailyAds;
  const adsRemaining = maxDailyAds - dailyAdsWatched;

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleWatchAd = async () => {
    const success = await watchAd();
    if (success) {
      onClose();
    }
  };

  const handleSubscribe = () => {
    onClose();
    router.push('/(tabs)/store');
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={COLORS.neutralDark} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Out of Paws!</Text>
            <Text style={styles.subtitle}>
              You need paws to start a conquest. Choose an option below:
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {canWatchAd && (
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={handleWatchAd}
              >
                <View style={styles.optionIcon}>
                  <Play size={24} color={COLORS.white} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Watch Ad {adsRemaining}/2</Text>
                  <Text style={styles.optionDescription}>Get +1 Paw instantly</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.optionButton, styles.premiumButton]}
              onPress={handleSubscribe}
            >
              <View style={[styles.optionIcon, styles.premiumIcon]}>
                <Crown size={24} color={COLORS.white} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Subscribe for Unlimited Paws</Text>
                <Text style={styles.optionDescription}>Never run out of paws again!</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.waitOption}>
              <View style={styles.waitIcon}>
                <Clock size={24} color={COLORS.neutralMedium} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.waitTitle}>Come Back Tomorrow</Text>
                <Text style={styles.waitDescription}>
                  Next free paw in {formatTime(timeUntilNextPaw)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumButton: {
    backgroundColor: COLORS.accent,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  waitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 16,
    padding: 16,
  },
  waitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  waitTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 4,
  },
  waitDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
  },
});