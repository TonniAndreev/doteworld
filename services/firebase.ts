import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase with persistence
if (Platform.OS !== 'web') {
  auth().setPersistence('default');
}

export { auth, firestore, storage };