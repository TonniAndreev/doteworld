import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBkkFF0XhNZeWuDmOfEhsgdfX1VBG7WTas",
  authDomain: "doteapp-dev.firebaseapp.com",
  projectId: "doteapp-dev",
  storageBucket: "doteapp-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;