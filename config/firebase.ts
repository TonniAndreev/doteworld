import { Platform } from 'react-native';
import { initializeApp, getApp, getApps } from 'firebase/app';

// Web configuration
const webConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// iOS configuration
const iosConfig = {
  apiKey: "YOUR_IOS_API_KEY",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.appspot.com",
  messagingSenderId: "640161399442",
  appId: "YOUR_IOS_APP_ID",
  clientId: "YOUR_IOS_CLIENT_ID", // Add your iOS client ID
  iosBundleId: "com.yourcompany.doteapp",
};

// Android configuration
const androidConfig = {
  apiKey: "YOUR_ANDROID_API_KEY",
  authDomain: "dote-world.firebaseapp.com",
  projectId: "dote-world",
  storageBucket: "dote-world.appspot.com",
  messagingSenderId: "640161399442",
  appId: "YOUR_ANDROID_APP_ID",
  clientId: "YOUR_ANDROID_CLIENT_ID", // Add your Android client ID
  androidPackageName: "com.yourcompany.doteapp",
};

// Select configuration based on platform
export const firebaseConfig = Platform.select({
  ios: iosConfig,
  android: androidConfig,
  default: webConfig,
});

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export { app };