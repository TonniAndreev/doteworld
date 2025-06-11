import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwjs7_i08L_cJVar9fPHCsFGfzE6rbteM",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.firebasestorage.app",
  messagingSenderId: "640161399442",
  appId: "1:640161399442:ios:f341ad3931da83c18a1c4b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, firestore, storage };