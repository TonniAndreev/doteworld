import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the available colors for friend territories
const TERRITORY_COLORS = [
  '#7584F2', // Blue-purple
  '#FFCE00', // Yellow
  '#F12E82', // Pink
  '#7F2EF1', // Purple
  '#2E89F1', // Blue
  '#14BDB7', // Teal
  '#3FD914'  // Green
];

// Primary color for user's own territory
export const USER_TERRITORY_COLOR = '#F1662E'; // Orange-red from COLORS.primary

// Interface for color assignments
interface ColorAssignments {
  [userId: string]: string;
}

// Get a consistent color for a user based on their ID
export async function getFriendTerritoryColor(userId: string): Promise<string> {
  try {
    // Try to get existing color assignments from storage
    const storedAssignments = await AsyncStorage.getItem('dote_territory_colors');
    let colorAssignments: ColorAssignments = {};
    
    if (storedAssignments) {
      colorAssignments = JSON.parse(storedAssignments);
    }
    
    // If this user already has an assigned color, return it
    if (colorAssignments[userId]) {
      return colorAssignments[userId];
    }
    
    // Otherwise, assign a new color based on the hash of the user ID
    const colorIndex = getConsistentColorIndex(userId, TERRITORY_COLORS.length);
    const assignedColor = TERRITORY_COLORS[colorIndex];
    
    // Save the assignment for future use
    colorAssignments[userId] = assignedColor;
    await AsyncStorage.setItem('dote_territory_colors', JSON.stringify(colorAssignments));
    
    return assignedColor;
  } catch (error) {
    console.error('Error getting friend territory color:', error);
    // Fallback to a deterministic color based on user ID if storage fails
    return getColorFromUserId(userId);
  }
}

// Generate a consistent color index based on user ID
function getConsistentColorIndex(userId: string, numColors: number): number {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number and within range of available colors
  return Math.abs(hash) % numColors;
}

// Fallback function to get color directly from user ID
function getColorFromUserId(userId: string): string {
  const colorIndex = getConsistentColorIndex(userId, TERRITORY_COLORS.length);
  return TERRITORY_COLORS[colorIndex];
}

// Get color with opacity
export function getColorWithOpacity(color: string, opacity: number): string {
  // If color is already in rgba format, modify the opacity
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1, $2, $3, ${opacity})`);
  }
  
  // If color is in hex format, convert to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // If color is in rgb format, convert to rgba
  if (color.startsWith('rgb')) {
    return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, `rgba($1, $2, $3, ${opacity})`);
  }
  
  // Default fallback
  return color;
}