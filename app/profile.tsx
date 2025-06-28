@@ .. @@
 import { useAuth } from '@/contexts/AuthContext';
 import { usePaws } from '@/contexts/PawsContext';
 import { useTerritory } from '@/contexts/TerritoryContext';
+import * as ImagePicker from 'expo-image-picker';
 import StatsCard from '@/components/profile/StatsCard';
 import BadgesRow from '@/components/profile/BadgesRow';
@@ .. @@
 export default function ProfileScreen() {
   const [editModalVisible, setEditModalVisible] = useState(false);
+  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
   const [showInvites, setShowInvites] = useState(false);
   
-  const { user, logout } = useAuth();
+  const { user, logout, updateUserProfilePhoto } = useAuth();
   const { pawsBalance } = usePaws();
   const { territorySize, totalDistance } = useTerritory();
@@ .. @@
   };
 
+  const handlePhotoUpload = async () => {
+    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
+    
+    if (status !== 'granted') {
+      Alert.alert('Permission Required', 'We need camera roll permissions to upload photos.');
+      return;
+    }
+    
+    const result = await ImagePicker.launchImageLibraryAsync({
+      mediaTypes: ImagePicker.MediaTypeOptions.Images,
+      allowsEditing: true,
+      aspect: [1, 1],
+      quality: 0.8,
+    });
+    
+    if (!result.canceled) {
+      setIsUploadingPhoto(true);
+      
+      try {
+        console.log('Uploading profile photo for user:', user?.id);
+        const uploadResult = await updateUserProfilePhoto(result.assets[0].uri);
+        
+        if (uploadResult.success) {
+          Alert.alert('Success', 'Profile photo updated successfully!');
+        } else {
+          Alert.alert('Error', uploadResult.error || 'Failed to upload photo');
+        }
+      } catch (error) {
+        console.error('Error uploading photo:', error);
+        Alert.alert('Error', 'Failed to upload photo');
+      } finally {
+        setIsUploadingPhoto(false);
+      }
+    }
+  };
+
   if (!user) {
@@ .. @@
             <TouchableOpacity 
               style={styles.editProfileButton}
-              onPress={() => setEditModalVisible(true)}
+              onPress={handlePhotoUpload}
+              disabled={isUploadingPhoto}
             >
-              <Edit size={16} color={COLORS.white} />
+              {isUploadingPhoto ? (
+                <ActivityIndicator size="small" color={COLORS.white} />
+              ) : (
+                <Edit size={16} color={COLORS.white} />
+              )}
             </TouchableOpacity>
           </View>