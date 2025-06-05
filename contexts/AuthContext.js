import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const savedUser = await AsyncStorage.getItem('doteUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    if (email === 'demo@example.com' && password === 'password') {
      const mockUser = {
        uid: '123456',
        email: email,
        displayName: 'Demo User',
        photoURL: null,
        dogName: 'Buddy',
        dogBreed: 'Golden Retriever',
        achievementCount: 15,
        friends: [
          { id: '1', name: 'John Walker', dogName: 'Rex' },
          { id: '2', name: 'Sarah Miller', dogName: 'Luna' },
        ],
      };
      
      setUser(mockUser);
      await AsyncStorage.setItem('doteUser', JSON.stringify(mockUser));
      return mockUser;
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const loginWithGoogle = async () => {
    const mockUser = {
      uid: '123456',
      email: 'demo@gmail.com',
      displayName: 'Demo Google',
      photoURL: 'https://i.pravatar.cc/300?u=demo',
      dogName: 'Max',
      dogBreed: 'Labrador Retriever',
      achievementCount: 8,
      friends: [
        { id: '1', name: 'John Walker', dogName: 'Rex' },
      ],
    };
    
    setUser(mockUser);
    await AsyncStorage.setItem('doteUser', JSON.stringify(mockUser));
    return mockUser;
  };

  const loginWithFacebook = async () => {
    const mockUser = {
      uid: '123456',
      email: 'demo@facebook.com',
      displayName: 'Demo Facebook',
      photoURL: 'https://i.pravatar.cc/300?u=facebook',
      dogName: 'Charlie',
      dogBreed: 'French Bulldog',
      achievementCount: 5,
      friends: [],
    };
    
    setUser(mockUser);
    await AsyncStorage.setItem('doteUser', JSON.stringify(mockUser));
    return mockUser;
  };

  const register = async (email, password, displayName, phone) => {
    const mockUser = {
      uid: '123456',
      email: email,
      displayName: displayName,
      phone: phone,
      photoURL: null,
      achievementCount: 0,
      friends: [],
    };
    
    setUser(mockUser);
    await AsyncStorage.setItem('doteUser', JSON.stringify(mockUser));
    return mockUser;
  };

  const updateDogProfile = async (dogName, dogBreed, dogPhoto) => {
    const updatedUser = {
      ...user,
      dogName,
      dogBreed,
      dogPhoto,
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('doteUser', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('doteUser');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    loginWithFacebook,
    register,
    updateDogProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);