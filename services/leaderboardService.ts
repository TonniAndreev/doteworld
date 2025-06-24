// Types for leaderboard data
export type LeaderboardUser = {
  id: string;
  name: string;
  dogName: string;
  photoURL?: string | null;
  territorySize: number;
  totalDistance: number;
  achievementCount: number;
  pawsBalance: number;
};

// Mock data for demonstration - expanded to show more users
const mockLeaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    name: 'Sarah Miller',
    dogName: 'Luna',
    photoURL: null, // Will use random avatar
    territorySize: 12.5,
    totalDistance: 85.2,
    achievementCount: 24,
    pawsBalance: 1250
  },
  {
    id: '2',
    name: 'John Walker',
    dogName: 'Max',
    photoURL: null, // Will use random avatar
    territorySize: 10.8,
    totalDistance: 72.4,
    achievementCount: 18,
    pawsBalance: 980
  },
  {
    id: '3',
    name: 'Emma Davis',
    dogName: 'Bella',
    photoURL: null, // Will use random avatar
    territorySize: 9.2,
    totalDistance: 68.9,
    achievementCount: 15,
    pawsBalance: 850
  },
  {
    id: '4',
    name: 'Michael Chen',
    dogName: 'Rocky',
    photoURL: null, // Will use random avatar
    territorySize: 8.7,
    totalDistance: 61.3,
    achievementCount: 12,
    pawsBalance: 720
  },
  {
    id: '5',
    name: 'Jessica Thompson',
    dogName: 'Charlie',
    photoURL: null, // Will use random avatar
    territorySize: 7.9,
    totalDistance: 55.8,
    achievementCount: 10,
    pawsBalance: 650
  },
  {
    id: '6',
    name: 'David Rodriguez',
    dogName: 'Buddy',
    photoURL: null,
    territorySize: 7.2,
    totalDistance: 52.1,
    achievementCount: 9,
    pawsBalance: 580
  },
  {
    id: '7',
    name: 'Lisa Anderson',
    dogName: 'Milo',
    photoURL: null,
    territorySize: 6.8,
    totalDistance: 48.7,
    achievementCount: 8,
    pawsBalance: 520
  },
  {
    id: '8',
    name: 'Robert Kim',
    dogName: 'Zeus',
    photoURL: null,
    territorySize: 6.3,
    totalDistance: 45.2,
    achievementCount: 7,
    pawsBalance: 480
  },
  {
    id: '9',
    name: 'Amanda Foster',
    dogName: 'Daisy',
    photoURL: null,
    territorySize: 5.9,
    totalDistance: 42.8,
    achievementCount: 6,
    pawsBalance: 440
  },
  {
    id: '10',
    name: 'Chris Martinez',
    dogName: 'Cooper',
    photoURL: null,
    territorySize: 5.5,
    totalDistance: 39.6,
    achievementCount: 5,
    pawsBalance: 400
  },
  {
    id: '11',
    name: 'Rachel Green',
    dogName: 'Bailey',
    photoURL: null,
    territorySize: 5.1,
    totalDistance: 36.4,
    achievementCount: 4,
    pawsBalance: 360
  },
  {
    id: '12',
    name: 'Mark Wilson',
    dogName: 'Oscar',
    photoURL: null,
    territorySize: 4.7,
    totalDistance: 33.2,
    achievementCount: 3,
    pawsBalance: 320
  },
  {
    id: '13',
    name: 'Jennifer Lee',
    dogName: 'Ruby',
    photoURL: null,
    territorySize: 4.3,
    totalDistance: 30.1,
    achievementCount: 2,
    pawsBalance: 280
  },
  {
    id: '14',
    name: 'Kevin Brown',
    dogName: 'Toby',
    photoURL: null,
    territorySize: 3.9,
    totalDistance: 27.5,
    achievementCount: 1,
    pawsBalance: 240
  },
  {
    id: '15',
    name: 'Michelle Taylor',
    dogName: 'Coco',
    photoURL: null,
    territorySize: 3.5,
    totalDistance: 24.8,
    achievementCount: 1,
    pawsBalance: 200
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