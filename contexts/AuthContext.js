import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/services/firebase';
import { uploadFile } from '@/services/firebaseStorage';

// Create type for context (optional but good for TS)
interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string, phone: string) => Promise<any>;
  updateDogProfile: (dogName: string, dogBreed: string, dogPhoto: string | null) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          const userData = userDoc.data();

          const fullUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...userData
          };

          setUser(fullUserData);
          await AsyncStorage.setItem('doteUser', JSON.stringify(fullUserData));
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('doteUser');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
      const userData = userDoc.data();

      const fullUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        ...userData
      };

      setUser(fullUserData);
      await AsyncStorage.setItem('doteUser', JSON.stringify(fullUserData));
      return fullUserData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, phone: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      await firebaseUser.updateProfile({ displayName });

      const userData = {
        displayName,
        phone,
        achievementCount: 0,
        friends: [],
        createdAt: firestore.FieldValue.serverTimestamp()
      };

      await firestore().collection('users').doc(firebaseUser.uid).set(userData);

      const fullUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        ...userData
      };

      setUser(fullUserData);
      await AsyncStorage.setItem('doteUser', JSON.stringify(fullUserData));
      return fullUserData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateDogProfile = async (dogName: string, dogBreed: string, dogPhoto: string | null) => {
  if (!user?.uid) throw new Error('No authenticated user');

  try {
    let photoURL = null;

    if (dogPhoto) {
      const path = `dogs/${user.uid}/${Date.now()}`;
      photoURL = await uploadFile(path, dogPhoto);
    }

    const dogData = {
      dogName,
      dogBreed,
      ...(photoURL && { dogPhoto: photoURL }),
    };

    await firestore().collection('users').doc(user.uid).update(dogData);

    const updatedUser = {
      ...user,
      ...dogData,
    };

    setUser(updatedUser);
    await AsyncStorage.setItem('doteUser', JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error('Error updating dog profile:', error);
    throw error;
  }
};

  const logout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      await AsyncStorage.removeItem('doteUser');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    updateDogProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
