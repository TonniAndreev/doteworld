import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { X, Map, Route, Award } from 'lucide-react-native';
import { formatArea, formatDistance } from '@/utils/formatUtils';

interface ConquestSummaryDialogProps {
  visible: boolean;
  onClose: () => void;
  territoryGained: number; // in km²
  distanceWalked: number; // in km
  localRanking: number | null;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ConquestSummaryDialog({
  visible,
  onClose,
  territoryGained,
  distanceWalked,
  localRanking,
}: ConquestSummaryDialogProps) {
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

          <Image
            source={require('@/assets/images/corgi_empty.jpg')} // Using an existing image, replace if a specific "conquest" image is available
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>Congrats on your conquest!</Text>

          <Text style={styles.message}>This is what you've earned.</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Map size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>
                {formatArea(territoryGained * 1000000)}
              </Text>
              <Text style={styles.statLabel}>New Territory</Text>
            </View>
            <View style={styles.statItem}>
              <Route size={24} color={COLORS.secondary} />
              <Text style={styles.statValue}>
                {formatDistance(distanceWalked * 1000)}
              </Text>
              <Text style={styles.statLabel}>New Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={24} color={COLORS.accent} />
              <Text style={styles.statValue}>
                {localRanking !== null ? `#${localRanking}` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Local Ranking</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Well done, hooman!</Text>
          </TouchableOpacity>
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
  image: {
    width: screenWidth * 0.5,
    height: screenWidth * 0.5,
    maxWidth: 200,
    maxHeight: 200,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.neutralDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLORS.neutralDark,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.neutralMedium,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});