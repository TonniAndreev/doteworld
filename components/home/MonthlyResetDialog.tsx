import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { X } from 'lucide-react-native';

interface MonthlyResetDialogProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MonthlyResetDialog({ visible, onClose }: MonthlyResetDialogProps) {
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
            source={require('@/assets/images/New-month.jpg')}
            style={styles.image}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>A new month began</Text>
          
          <Text style={styles.message}>
            Territories are being reset. Get your doggo hooman and make it even bigger now!
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Alright</Text>
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
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    maxWidth: 250,
    maxHeight: 250,
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