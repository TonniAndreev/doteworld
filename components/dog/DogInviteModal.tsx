import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Mail, Send, UserPlus } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useDogOwnership } from '@/hooks/useDogOwnership';

interface DogInviteModalProps {
  visible: boolean;
  onClose: () => void;
  dogId: string;
  dogName: string;
}

export default function DogInviteModal({ visible, onClose, dogId, dogName }: DogInviteModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { inviteCoOwner } = useDogOwnership();

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await inviteCoOwner(dogId, inviteEmail.trim(), 'co-owner', inviteMessage.trim());
      
      if (result.success) {
        Alert.alert('Success', 'Invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Owner</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.neutralDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Invite someone to help care for {dogName}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={20} color={COLORS.neutralMedium} />
                <TextInput
                  style={styles.textInput}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter email address"
                  placeholderTextColor={COLORS.neutralMedium}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={inviteMessage}
                onChangeText={setInviteMessage}
                placeholder="Add a personal message..."
                placeholderTextColor={COLORS.neutralMedium}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleEmailInvite}
              disabled={isLoading || !inviteEmail.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Send size={20} color={COLORS.white} />
                  <Text style={styles.sendButtonText}>Send Invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 12,
  },
  messageInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    borderWidth: 1,
    borderColor: COLORS.neutralLight,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 8,
  },
  sendButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});