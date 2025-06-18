import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload a local file (fileUri) to Firebase Storage and return the download URL.
 * @param storagePath - Path inside Firebase Storage where file will be saved
 * @param fileUri - Local file URI (usually file://...)
 */
export async function uploadFile(storagePath: string, fileUri: string): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
