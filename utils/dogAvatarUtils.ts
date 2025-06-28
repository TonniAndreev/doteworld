// Dog avatar utility functions for breed-specific avatars

interface BreedAvatarMap {
  [key: string]: any;
}

// Map dog breeds to Pexels images of typical dogs of that breed
const BREED_AVATARS: BreedAvatarMap = {
  // Popular breeds with specific images
  'labrador retriever': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'golden retriever': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'german shepherd': 'https://images.pexels.com/photos/333083/pexels-photo-333083.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'french bulldog': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'beagle': 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'poodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'standard poodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'boxer': 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'dachshund': 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'siberian husky': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'border collie': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'chihuahua': 'https://images.pexels.com/photos/39317/chihuahua-dog-puppy-cute-39317.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'pomeranian': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'yorkshire terrier': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'maltese': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'pug': 'https://images.pexels.com/photos/374906/pexels-photo-374906.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'shih tzu': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'cavalier king charles spaniel': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'boston terrier': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'cocker spaniel': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'australian shepherd': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'rottweiler': 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'doberman pinscher': 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'great dane': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'saint bernard': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'mastiff': 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'newfoundland': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'bernese mountain dog': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'jack russell terrier': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'west highland white terrier': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'corgi': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'pembroke welsh corgi': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'cardigan welsh corgi': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'whippet': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'greyhound': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'basset hound': 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'bloodhound': 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'english bulldog': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'american bulldog': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'dalmatian': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'akita': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'shiba inu': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'samoyed': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'alaskan malamute': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'weimaraner': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'vizsla': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'pointer': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'brittany': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'english springer spaniel': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'portuguese water dog': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'bichon frise': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'havanese': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'papillon': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'italian greyhound': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'chinese crested': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'japanese chin': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'pekingese': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'lhasa apso': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'miniature pinscher': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'scottish terrier': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'wire fox terrier': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'soft coated wheaten terrier': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'bull terrier': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'staffordshire bull terrier': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'american staffordshire terrier': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'australian cattle dog': 'https://images.pexels.com/photos/551628/pexels-photo-551628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'old english sheepdog': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'keeshond': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'chow chow': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'shar pei': 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'basenji': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'rhodesian ridgeback': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'norwegian elkhound': 'https://images.pexels.com/photos/605494/pexels-photo-605494.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'irish wolfhound': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'great pyrenees': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'leonberger': 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'anatolian shepherd': 'https://images.pexels.com/photos/333083/pexels-photo-333083.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'tibetan mastiff': 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  
  // Designer/Mixed breeds
  'labradoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'goldendoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'cockapoo': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'schnoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'yorkipoo': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'puggle': 'https://images.pexels.com/photos/374906/pexels-photo-374906.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'bernedoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'saint berdoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'aussiedoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'sheepadoodle': 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  
  // Fallback for unknown breeds
  'mixed breed': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
  'unknown breed': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
};

// Default fallback images for different sizes
const DEFAULT_AVATARS = {
  small: { uri: 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=300&h=300' },
  medium: { uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300' },
  large: { uri: 'https://images.pexels.com/photos/552598/pexels-photo-552598.jpeg?auto=compress&cs=tinysrgb&w=300&h=300' },
  giant: { uri: 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=300&h=300' },
};

/**
 * Get a breed-specific avatar URL for a dog
 * @param breed - The dog's breed
 * @param sizeCategory - Optional size category for fallback
 * @returns URL to a breed-appropriate dog image
 */
export function getDogBreedAvatar(breed: string, sizeCategory?: string): string {
  if (!breed) {
    return DEFAULT_AVATARS.medium;
  }

  // Normalize breed name for lookup
  const normalizedBreed = breed.toLowerCase().trim();
  
  // Try exact match first
  if (BREED_AVATARS[normalizedBreed]) {
    return { uri: BREED_AVATARS[normalizedBreed] };
  }
  
  // Try partial matches for common breed variations
  const breedKeys = Object.keys(BREED_AVATARS);
  const partialMatch = breedKeys.find(key => 
    normalizedBreed.includes(key) || key.includes(normalizedBreed)
  );
  
  if (partialMatch) {
    return { uri: BREED_AVATARS[partialMatch] };
  }
  
  // Fallback based on size category
  if (sizeCategory && DEFAULT_AVATARS[sizeCategory as keyof typeof DEFAULT_AVATARS]) {
    return DEFAULT_AVATARS[sizeCategory as keyof typeof DEFAULT_AVATARS];
  }
  
  // Final fallback
  return DEFAULT_AVATARS.medium; 
}

/**
 * Get avatar source for UserAvatar component
 * @param dogId - Dog's ID
 * @param photoURL - Custom photo URL if available
 * @param breed - Dog's breed for fallback avatar
 * @param sizeCategory - Size category for better fallback
 * @returns Image source object
 */
export function getDogAvatarSource(
  dogId: string, 
  photoURL?: string | null, 
  breed?: string,
  sizeCategory?: string
) {
  if (photoURL) {
    return { uri: photoURL };
  }

  // Return the breed-specific avatar object
  return getDogBreedAvatar(breed || '', sizeCategory);
}