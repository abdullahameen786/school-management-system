// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyCV3jJV5Fpl1nhBWg3a5VZaaEHJgOB9jEk",
  authDomain: "school-management-system-928be.firebaseapp.com",
  projectId: "school-management-system-928be",
  storageBucket: "school-management-system-928be.firebasestorage.app",
  messagingSenderId: "1047857423631",
  appId: "1:1047857423631:web:45d1b662dbdaa90b87ca7a",
  measurementId: "G-E6SKRBP6JS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

export default app;