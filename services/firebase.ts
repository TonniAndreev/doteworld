import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAwjs7_i08L_cJVar9fPHCsFGfzE6rbteM",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.appspot.com",  // ✅ double-check your storageBucket URL (fixing small typo you had earlier)
  messagingSenderId: "640161399442",
  appId: "1:640161399442:web:f341ad3931da83c18a1c4b"
};

// Prevent re-initializing app (safe for Expo Fast Refresh)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
const auth = Platform.select({
  web: () => getAuth(app),
  default: () => initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  }),
})();

// ✅ Only initialize Firestore once
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache(),
  experimentalForceLongPolling: true,
});

// Initialize Storage
const storage = getStorage(app);

export { auth, firestore, storage };
