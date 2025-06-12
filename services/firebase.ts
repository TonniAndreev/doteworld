import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firestore = getFirestore(app);

initializeFirestore(app, {
  localCache: persistentLocalCache(),
  experimentalForceLongPolling: true,
});
// ✅ Firebase config (your working credentials)
const firebaseConfig = {
  apiKey: "AIzaSyAwjs7_i08L_cJVar9fPHCsFGfzE6rbteM",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.firebasestorage.app",
  messagingSenderId: "640161399442",
  appId: "1:640161399442:web:f341ad3931da83c18a1c4b"
};

// ✅ Prevent re-initializing Firebase app on fast refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Auth (persistence for native, normal for web)
const auth = Platform.select({
  web: () => getAuth(app),
  default: () => initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  }),
})();

// ✅ Firestore & Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
