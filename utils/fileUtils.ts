import * as FileSystem from 'expo-file-system';

/**
 * Get the MIME type based on file extension
 * @param extension File extension (without the dot)
 * @returns MIME type string
 */
export function getMimeType(extension: string): string {
  const ext = extension.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'heic': 'image/heic',
    'heif': 'image/heif',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Safely extract file extension from a URI or filename
 * @param uri File URI or filename
 * @returns File extension (without the dot)
 */
export function getFileExtension(uri: string): string {
  // Remove query parameters if present
  const cleanUri = uri.split('?')[0];
  // Get the part after the last dot
  const extension = cleanUri.split('.').pop() || '';
  return extension.toLowerCase();
}

/**
 * Prepare file data for upload to Supabase Storage
 * @param uri File URI
 * @returns Promise resolving to an object with ArrayBuffer data and content type
 */
export async function prepareFileForUpload(uri: string): Promise<{ 
  data: ArrayBuffer;
  contentType: string;
}> {
  try {
    // Get file extension and determine content type
    const extension = getFileExtension(uri);
    const contentType = getMimeType(extension);
    
    // Read file as ArrayBuffer using expo-file-system
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return {
      data: bytes.buffer,
      contentType
    };
  } catch (error) {
    console.error('Error preparing file for upload:', error);
    throw error;
  }
}