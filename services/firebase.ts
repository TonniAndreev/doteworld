import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, firestore, storage };
