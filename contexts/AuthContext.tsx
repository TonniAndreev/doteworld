import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore, storage } from '../services/firebase';
import { serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { uploadFile } from '../services/firebaseStorage';

// ✅ Type definition
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
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
  };

  const register = async (email: string, password: string, displayName: string, phone: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName });

    const userData = {
      displayName,
      phone,
      achievementCount: 0,
      friends: [],
      createdAt: serverTimestamp()
    };

    await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);

    const fullUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName,
      ...userData
    };

    setUser(fullUserData);
    await AsyncStorage.setItem('doteUser', JSON.stringify(fullUserData));
    return fullUserData;
  };

  const updateDogProfile = async (dogName: string, dogBreed: string, dogPhoto: string | null) => {
    if (!user?.uid) throw new Error('No authenticated user');

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

    await updateDoc(doc(firestore, 'users', user.uid), dogData);
    const updatedUser = { ...user, ...dogData };
    setUser(updatedUser);
    await AsyncStorage.setItem('doteUser', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    await AsyncStorage.removeItem('doteUser');
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
