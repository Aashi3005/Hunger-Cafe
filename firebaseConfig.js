// Firebase configuration for React Native with AsyncStorage persistence
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAO7g65tjEMa1XTRXeoSsEAW9Nvr45BxzY",
  authDomain: "hunger-quest-90f60.firebaseapp.com",
  projectId: "hunger-quest-90f60",
  storageBucket: "hunger-quest-90f60.firebasestorage.com",
  messagingSenderId: "559103540810",
  appId: "1:559103540810:ios:b3e24992d2374bf7a670b3"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
// Handle the case where auth might already be initialized
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    console.log('⚠️ Firebase Auth already initialized, using existing instance');
    auth = getAuth(app);
  } else {
    console.error('❌ Firebase Auth initialization error:', error);
    // Fallback to default auth
    auth = getAuth(app);
  }
}

export { auth };
export default app;