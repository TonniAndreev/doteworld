import storage from '@react-native-firebase/storage';

/**
 * Upload a local file (fileUri) to Firebase Storage and return the download URL.
 * @param storagePath - Path inside Firebase Storage where file will be saved
 * @param fileUri - Local file URI (usually file://...)
 */
export async function uploadFile(storagePath: string, fileUri: string): Promise<string> {
  const reference = storage().ref(storagePath);
  await reference.putFile(fileUri);
  const downloadURL = await reference.getDownloadURL();
  return downloadURL;
}