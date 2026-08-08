// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Aapki real credentials configuration
const firebaseConfig = {
  apiKey: "AIzaSyCV3jJV5Fpl1nhBWg3a5VZaaEHJgOB9jEk",
  authDomain: "school-management-system-928be.firebaseapp.com",
  projectId: "school-management-system-928be",
  storageBucket: "school-management-system-928be.firebasestorage.app",
  messagingSenderId: "1047857423631",
  appId: "1:1047857423631:web:45d1b662dbdaa90b87ca7a",
  measurementId: "G-E6SKRBP6JS"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and Export required app services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);