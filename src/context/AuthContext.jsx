// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("Auth observed valid user session:", firebaseUser.email);
          
          // 🚀 Hardcoded Super Admin Override for Safety
          let detectedRole = firebaseUser.email === 'admin@school.com' ? 'admin' : 'student';

          let userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: detectedRole // Safe fallback assignment
          };

          try {
            const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email.trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const firestoreData = userDoc.data();
              
              userData = {
                ...userData,
                ...firestoreData,
                role: firestoreData.role || detectedRole // Ensure role is never empty
              };
            }
          } catch (firestoreError) {
            console.warn("Firestore look-up skipped or restricted:", firestoreError);
          }

          console.log("Setting Final Global User Context:", userData);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Critical Auth Sync Error:", error);
        setUser(null);
      } finally {
        setLoading(false); // 🚨 Loop explicitly broken here
      }
    }, (error) => {
      console.error("Auth observer failure:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);