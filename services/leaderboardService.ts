// Types for leaderboard data
export type LeaderboardUser = {
  id: string;
  name: string;
  dogName: string;
  territorySize: number;
  totalDistance: number;
  achievementCount: number;
  pawsBalance: number;
};

// Mock data for demonstration
const mockLeaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    name: 'Sarah Miller',
    dogName: 'Luna',
    territorySize: 12.5,
    totalDistance: 85.2,
    achievementCount: 24,
    pawsBalance: 1250
  },
  {
    id: '2',
    name: 'John Walker',
    dogName: 'Max',
    territorySize: 10.8,
    totalDistance: 72.4,
    achievementCount: 18,
    pawsBalance: 980
  },
  {
    id: '3',
    name: 'Emma Davis',
    dogName: 'Bella',
    territorySize: 9.2,
    totalDistance: 68.9,
    achievementCount: 15,
    pawsBalance: 850
  },
  {
    id: '4',
    name: 'Michael Chen',
    dogName: 'Rocky',
    territorySize: 8.7,
    totalDistance: 61.3,
    achievementCount: 12,
    pawsBalance: 720
  },
  {
    id: '5',
    name: 'Jessica Thompson',
    dogName: 'Charlie',
    territorySize: 7.9,
    totalDistance: 55.8,
    achievementCount: 10,
    pawsBalance: 650
  }
];

export async function fetchLeaderboard(category: 'territory' | 'distance' | 'achievements' | 'paws'): Promise<LeaderboardUser[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Sort based on category
  return [...mockLeaderboardData].sort((a, b) => {
    switch (category) {
      case 'territory':
        return b.territorySize - a.territorySize;
      case 'distance':
        return b.totalDistance - a.totalDistance;
      case 'achievements':
        return b.achievementCount - a.achievementCount;
      case 'paws':
        return b.pawsBalance - a.pawsBalance;
      default:
        return 0;
    }
  });
}