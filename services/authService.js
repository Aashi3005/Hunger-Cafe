// Polyfill fetch for older devices
import 'whatwg-fetch';

// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from '../firebaseConfig';

// Current user key for local storage
const CURRENT_USER_KEY = 'current_user';

// Sign up function with enhanced error handling
export const signUpUser = async (email, password) => {
  try {

    // Create user with Firebase Web SDK
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created successfully:', userCredential.user)
    const user = userCredential.user;
    
    // Save current user locally for quick access
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    
    console.log('✅ User created successfully:', user.uid);
    
    return { 
      success: true, 
      user: userData
    };
  } catch (error) {
    console.error('❌ Sign up error:', error);
    
    // Enhanced error handling
    let errorMessage = error.message;
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please use a different email or try logging in.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters long.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password authentication is not enabled. Please contact support.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign in function with enhanced error handling
export const signInUser = async (email, password) => {
  try {
    console.log('🔐 Attempting to sign in user with email:', email);
    // Sign in with Firebase Web SDK
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save current user locally for quick access
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      lastSignIn: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    
    
    console.log('✅ User signed in successfully:', user.uid);
    
    return { 
      success: true, 
      user: userData
    };
  } catch (error) {
    
    console.error('❌ Sign in error:', error);
    
    // Enhanced error handling
    let errorMessage = error.message;
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password authentication is not enabled. Please contact support.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign out function with Firebase Web SDK
export const signOutUser = async () => {
  try {
    console.log('🔐 Attempting to sign out user');
    
    // Sign out from Firebase Web SDK
    await signOut(auth);
    
    // Remove current user from local storage
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('✅ User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error.message);
    return { success: false, error: error.message };
  }
};

// Get current user (Firebase Web SDK + local storage)
export const getCurrentUser = async () => {
  try {
    // First check Firebase current user
    const firebaseUser = auth.currentUser;
    console.log('🔍 Checking current user in Firebase:', firebaseUser);
    
    if (firebaseUser) {
      // Firebase user exists, return user data
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      };
      
      // Update local storage with fresh data
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      
      return userData;
    }
    
    // If no Firebase user, check local storage
    const localUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return localUser ? JSON.parse(localUser) : null;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};

// Check if user is authenticated
export const isUserAuthenticated = async () => {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
};

// Get Firebase user instance
export const getFirebaseUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};
