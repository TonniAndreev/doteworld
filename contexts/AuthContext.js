import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
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
      const { user: firebaseUser } = await auth().signInWithEmailAndPassword(email, password);
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

  const register = async (email, password, displayName, phone) => {
    try {
      const { user: firebaseUser } = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update profile in Firebase Auth
      await firebaseUser.updateProfile({
        displayName: displayName
      });
      
      // Create user document in Firestore
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
        const photoRef = storage().ref(`dogs/${user.uid}/${Date.now()}`);
        const response = await fetch(dogPhoto);
        const blob = await response.blob();
        await photoRef.put(blob);
        photoURL = await photoRef.getDownloadURL();
      }
      
      const dogData = {
        dogName,
        dogBreed,
        ...(photoURL && { dogPhoto: photoURL })
      };
      
      // Update Firestore document
      await firestore().collection('users').doc(user.uid).update(dogData);
      
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
      await auth().signOut();
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