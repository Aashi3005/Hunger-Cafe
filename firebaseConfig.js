// Firebase configuration for Web SDK
// This config is now handled in authService.js
// This file can be removed or kept for reference
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAO7g65tjEMa1XTRXeoSsEAW9Nvr45BxzY",
  authDomain: "hunger-quest-90f60.firebaseapp.com",
  projectId: "hunger-quest-90f60",
  storageBucket: "hunger-quest-90f60.firebasestorage.com",
  messagingSenderId: "559103540810",
  appId: "1:559103540810:ios:b3e24992d2374bf7a670b3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);