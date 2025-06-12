import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ✅ Use singleton pattern so app doesn't initialize multiple times in development
const firebaseConfig = {
  apiKey: "AIzaSyAwjs7_i08L_cJVar9fPHCsFGfzE6rbteM",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.firebasestorage.app",
  messagingSenderId: "640161399442",
  appId: "1:640161399442:web:f341ad3931da83c18a1c4b"
};

// Prevent re-initializing the app in Expo's Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth (web vs native)
const auth = Platform.select({
  web: () => getAuth(app),
  default: () => initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  }),
})();

// Initialize Firestore and Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
