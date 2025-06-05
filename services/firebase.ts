import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = Platform.select({
  ios: {
    apiKey: "AIzaSyAwjs7_i08L_cJVar9fPHCsFGfzE6rbteM",
    authDomain: "dote-world.firebaseapp.com",
    projectId: "dote-world",
    storageBucket: "dote-world.firebasestorage.app",
    messagingSenderId: "640161399442",
    appId: "1:640161399442:ios:f341ad3931da83c18a1c4b"
  },
  android: {
    apiKey: "AIzaSyDKflE0HU9fcR5u21MmCnruDg6YvNlrl58",
    authDomain: "dote-world.firebaseapp.com",
    projectId: "dote-world",
    storageBucket: "dote-world.firebasestorage.app",
    messagingSenderId: "640161399442",
    appId: "1:640161399442:android:c86ade579ed3a7eb8a1c4b"
  },
  default: {
    // Web config (fallback)
    apiKey: "AIzaSyDKflE0HU9fcR5u21MmCnruDg6YvNlrl58",
    authDomain: "dote-world.firebaseapp.com",
    projectId: "dote-world",
    storageBucket: "dote-world.firebasestorage.app",
    messagingSenderId: "640161399442",
    appId: "1:640161399442:android:c86ade579ed3a7eb8a1c4b"
  }
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other Firebase services
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
export default app;