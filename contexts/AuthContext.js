import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore, storage } from '../services/firebase';
import { serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { uploadFile } from '../services/firebaseStorage';
import { Platform } from 'react-native';

// Create type for context (optional but good for TS)
interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string, phone: string) => Promise<any>;
  updateDogProfile: (dogName: string, dogBreed: string, dogPhoto: string | null) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithFacebook: () => Promise<any>;
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
    try {
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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        let userData = userDoc.data();

        // If user doesn't exist, create a new user document
        if (!userData) {
          userData = {
            displayName: firebaseUser.displayName,
            phone: '',
            achievementCount: 0,
            friends: [],
            createdAt: serverTimestamp()
          };
          await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);
        }

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
        console.error('Google login error:', error);
        throw error;
      }
    } else {
      // For mobile platforms, you would need to implement Google Sign-In
      // using @react-native-google-signin/google-signin or similar
      throw new Error('Google Sign-In not implemented for mobile platforms');
    }
  };

  const loginWithFacebook = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        let userData = userDoc.data();

        // If user doesn't exist, create a new user document
        if (!userData) {
          userData = {
            displayName: firebaseUser.displayName,
            phone: '',
            achievementCount: 0,
            friends: [],
            createdAt: serverTimestamp()
          };
          await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);
        }

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
        console.error('Facebook login error:', error);
        throw error;
      }
    } else {
      // For mobile platforms, you would need to implement Facebook Login
      // using react-native-fbsdk-next or similar
      throw new Error('Facebook Sign-In not implemented for mobile platforms');
    }
  };

  const register = async (email: string, password: string, displayName: string, phone: string) => {
    try {
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

      await updateDoc(doc(firestore, 'users', user.uid), dogData);

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
      await signOut(auth);
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
    loginWithGoogle,
    loginWithFacebook,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};