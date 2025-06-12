import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAwjs7_i08L_cJVar9fPHCsFGfzE6rbteM",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.appspot.com",
  messagingSenderId: "640161399442",
  appId: "1:640161399442:web:f341ad3931da83c18a1c4b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth - for web, this automatically uses IndexedDB persistence
const auth = getAuth(app);

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Only connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if we're running in development and not already connected
  try {
    // These will only connect once, subsequent calls are ignored
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Emulators might already be connected, ignore the error
    console.log('Firebase emulators already connected or not available');
  }
}

export { auth, firestore, storage };