import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, storage } from '@/services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
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

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
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

  const register = async (email, password, displayName, phone) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile in Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: displayName
      });
      
      // Create user document in Firestore
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

  const updateDogProfile = async (dogName, dogBreed, dogPhoto) => {
    if (!user?.uid) throw new Error('No authenticated user');

    try {
      let photoURL = null;
      
      if (dogPhoto) {
        // Upload photo to Firebase Storage
        const photoRef = ref(storage, `dogs/${user.uid}/${Date.now()}`);
        const response = await fetch(dogPhoto);
        const blob = await response.blob();
        await uploadBytes(photoRef, blob);
        photoURL = await getDownloadURL(photoRef);
      }
      
      const dogData = {
        dogName,
        dogBreed,
        ...(photoURL && { dogPhoto: photoURL })
      };
      
      // Update Firestore document
      await setDoc(doc(firestore, 'users', user.uid), dogData, { merge: true });
      
      const updatedUser = {
        ...user,
        ...dogData
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

  const value = {
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

export const useAuth = () => useContext(AuthContext);