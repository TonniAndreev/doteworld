// Avatar utility functions for managing random avatar assignments

const AVATAR_COUNT = 17; // We have avatars 01.png through 17.png

/**
 * Generate a consistent avatar index based on user ID
 * This ensures the same user always gets the same avatar
 */
export function getAvatarIndex(userId: string): number {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number and within avatar range
  return Math.abs(hash) % AVATAR_COUNT + 1;
}

/**
 * Get the avatar source for a user
 * Returns either their uploaded photo or a random assigned avatar
 */
export function getAvatarSource(userId: string, uploadedPhotoURL?: string | null) {
  if (uploadedPhotoURL) {
    return { uri: uploadedPhotoURL };
  }
  
  const avatarIndex = getAvatarIndex(userId);
  const paddedIndex = avatarIndex.toString().padStart(2, '0');
  
  return require(`@/assets/avatars/${paddedIndex}.png`);
}

/**
 * Get avatar source specifically for display purposes
 * Returns the require() path or URI object
 */
export function getDisplayAvatarSource(userId: string, uploadedPhotoURL?: string | null) {
  return getAvatarSource(userId, uploadedPhotoURL);
}