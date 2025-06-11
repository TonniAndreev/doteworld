import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase is automatically initialized with the config files
// (google-services.json for Android and GoogleService-Info.plist for iOS)

export { auth, firestore, storage };
export default firebase;