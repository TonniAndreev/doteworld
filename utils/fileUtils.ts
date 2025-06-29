// Utility functions for file handling and uploads

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
 * @returns Promise resolving to an object with blob data and content type
 */
export async function prepareFileForUpload(uri: string): Promise<{ 
  data: Blob, 
  contentType: string 
}> {
  try {
    // Get file extension and determine MIME type
    const fileExt = getFileExtension(uri);
    const contentType = getMimeType(fileExt);
    
    // Fetch the file as a blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // If blob has a type, use it; otherwise use our determined contentType
    const finalContentType = blob.type || contentType;
    
    return {
      data: blob,
      contentType: finalContentType
    };
  } catch (error) {
    console.error('Error preparing file for upload:', error);
    throw error;
  }
}