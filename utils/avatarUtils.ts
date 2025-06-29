// Avatar utility functions for managing random avatar assignments

const AVATAR_COUNT = 17; // We have avatars 01.png through 17.png

// Static imports for all avatars
const AVATAR_IMAGES = {
  1: require('@/assets/avatars/01.png'),
  2: require('@/assets/avatars/02.png'),
  3: require('@/assets/avatars/03.png'),
  4: require('@/assets/avatars/04.png'),
  5: require('@/assets/avatars/05.png'),
  6: require('@/assets/avatars/06.png'),
  7: require('@/assets/avatars/07.png'),
  8: require('@/assets/avatars/08.png'),
  9: require('@/assets/avatars/09.png'),
  10: require('@/assets/avatars/10.png'),
  11: require('@/assets/avatars/11.png'),
  12: require('@/assets/avatars/12.png'),
  13: require('@/assets/avatars/13.png'),
  14: require('@/assets/avatars/14.png'),
  15: require('@/assets/avatars/15.png'),
  16: require('@/assets/avatars/16.png'),
  17: require('@/assets/avatars/17.png'),
};

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
  
  // Special case for "Dungyov" user - always assign avatar #7
  if (userId.includes('Dungyov') || userId.toLowerCase().includes('dungyov')) {
    return AVATAR_IMAGES[7];
  }
  
  const avatarIndex = getAvatarIndex(userId);
  return AVATAR_IMAGES[avatarIndex as keyof typeof AVATAR_IMAGES];
}

/**
 * Get avatar source specifically for display purposes
 * Returns the require() path or URI object
 */
export function getDisplayAvatarSource(userId: string, uploadedPhotoURL?: string | null) {
  return getAvatarSource(userId, uploadedPhotoURL);
}