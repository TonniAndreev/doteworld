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
  Share,
} from 'react-native';
import { X, Mail, Send } from 'lucide-react-native';
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

  const generateInviteLink = () => {
    // Create a deep link that includes the dog ID and invite token
    const inviteToken = `${dogId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = 'https://dote.app'; // Replace with your actual domain
    const link = `${baseUrl}/invite/${inviteToken}?dogId=${dogId}&dogName=${encodeURIComponent(dogName)}&role=co-owner`;
    return link;
  };

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

  const handleShareLink = async () => {
    const link = generateInviteLink();
    const message = `Hi! I'd like to invite you to be an owner of my dog ${dogName} on Dote. Download the app and click this link to join: ${link}`;
    
    try {
      await Share.share({
        message,
        url: link,
        title: `Invite to own ${dogName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
            <Text style={styles.modalTitle}>Add New Owner</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.neutralDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Invite someone to help care for {dogName}
          </Text>

          <View style={styles.content}>
            {/* Email Invite Section */}
            <View style={styles.inviteSection}>
              <Text style={styles.sectionTitle}>Email Invite</Text>
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
              
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                value={inviteMessage}
                onChangeText={setInviteMessage}
                placeholder="Add a personal message... (optional)"
                placeholderTextColor={COLORS.neutralMedium}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEmailInvite}
                disabled={isLoading || !inviteEmail.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Send size={20} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Send Email Invitation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Explanation */}
            <View style={styles.roleExplanation}>
              <Text style={styles.explanationTitle}>Owner Permissions:</Text>
              <Text style={styles.explanationText}>
                Owners can view and edit dog information, track walks, and manage the dog's profile.
              </Text>
              <Text style={styles.explanationText}>
                After downloading the app, they'll be automatically added as an owner when they click the invite link.
              </Text>
            </View>
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
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralLight,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralMedium,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  content: {
    padding: 20,
    maxHeight: '70%',
    overflow: 'scroll',
  },
  inviteSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.neutralDark,
    flex: 1,
    marginLeft: 12,
  },
  messageInput: {
    backgroundColor: COLORS.neutralLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  linkDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  roleExplanation: {
    backgroundColor: COLORS.neutralExtraLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  explanationTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLORS.neutralDark,
    marginBottom: 12,
  },
  explanationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 8,
  },
});