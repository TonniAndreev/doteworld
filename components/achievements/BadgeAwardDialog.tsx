import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Share,
  Platform,
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { X, Share2, Award, Star } from 'lucide-react-native';

interface BadgeAwardDialogProps {
  visible: boolean;
  onClose: () => void;
  badge: {
    id: string;
    title: string;
    description: string;
    icon_url: string;
  } | null;
}

export default function BadgeAwardDialog({
  visible,
  onClose,
  badge,
}: BadgeAwardDialogProps) {
  if (!badge) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just earned the "${badge.title}" badge on Dote! Walking my dog has never been more fun.`,
        url: Platform.OS === 'web' ? window.location.origin : undefined,
        title: 'Badge Earned on Dote',
      });
    } catch (error) {
      console.error('Error sharing badge:', error);
    }
  };

  const handleSocialShare = () => {
    // In a real app, this would open a more detailed social sharing dialog
    // with options for different platforms
    handleShare();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={COLORS.neutralDark} />
          </TouchableOpacity>

          <View style={styles.badgeContainer}>
            <Image
              source={{ uri: badge.icon_url }}
              style={styles.badgeImage}
              resizeMode="cover"
            />
            <View style={styles.starBadge}>
              <Star size={24} color={COLORS.accent} fill={COLORS.accent} />
            </View>
          </View>

          <View style={styles.confettiContainer}>
            <Award size={32} color={COLORS.primary} />
            <Text style={styles.congratsText}>Hooray!</Text>
          </View>

          <Text style={styles.title}>You've earned {badge.title}</Text>

          <Text style={styles.description}>{badge.description}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
              <Share2 size={20} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSocialShare}
            >
              <Text style={styles.secondaryButtonText}>Share to social media</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  badgeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  starBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confettiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  congratsText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.primary,
    marginLeft: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.primary,
  },
});