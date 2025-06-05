import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  unit: string;
  pawsReward: number;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // In a real app, this would fetch from Firebase
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Early Bird',
        description: 'Complete 5 walks before 8 AM',
        imageUrl: 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: true,
        currentValue: 5,
        targetValue: 5,
        unit: 'walks',
        pawsReward: 100,
      },
      {
        id: '2',
        title: 'Territory King',
        description: 'Claim 10 km² of territory',
        imageUrl: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: false,
        currentValue: 7.5,
        targetValue: 10,
        unit: 'km²',
        pawsReward: 200,
      },
      {
        id: '3',
        title: 'Marathon Runner',
        description: 'Walk a total of 42.2 kilometers',
        imageUrl: 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: false,
        currentValue: 28.4,
        targetValue: 42.2,
        unit: 'km',
        pawsReward: 500,
      },
      {
        id: '4',
        title: 'Social Butterfly',
        description: 'Make 5 dog walking friends',
        imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: true,
        currentValue: 5,
        targetValue: 5,
        unit: 'friends',
        pawsReward: 150,
      },
      {
        id: '5',
        title: 'Night Owl',
        description: 'Complete 3 evening walks after sunset',
        imageUrl: 'https://images.pexels.com/photos/849835/pexels-photo-849835.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: false,
        currentValue: 1,
        targetValue: 3,
        unit: 'walks',
        pawsReward: 75,
      },
      {
        id: '6',
        title: 'Weekend Warrior',
        description: 'Walk for 2 hours on weekends',
        imageUrl: 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: true,
        currentValue: 2,
        targetValue: 2,
        unit: 'hours',
        pawsReward: 120,
      },
      {
        id: '7',
        title: 'Explorer',
        description: 'Visit 10 different parks',
        imageUrl: 'https://images.pexels.com/photos/1246956/pexels-photo-1246956.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: false,
        currentValue: 6,
        targetValue: 10,
        unit: 'parks',
        pawsReward: 250,
      },
      {
        id: '8',
        title: 'Consistency King',
        description: 'Walk every day for 30 days',
        imageUrl: 'https://images.pexels.com/photos/1564506/pexels-photo-1564506.jpeg?auto=compress&cs=tinysrgb&w=300',
        completed: false,
        currentValue: 22,
        targetValue: 30,
        unit: 'days',
        pawsReward: 300,
      },
    ];

    // Simulate API call delay
    const loadAchievements = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAchievements(mockAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  return {
    achievements,
    isLoading,
  };
}