/**
 * SafarMatch — Firebase Integration Config
 * Configured for Firebase Authentication, Firestore, and Storage with graceful fallbacks.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyDXvfZbtmjFSBZeMKJ9dTOX928cYBVcBDU",
  authDomain: "safarmatch-live.firebaseapp.com",
  projectId: "safarmatch-live",
  storageBucket: "safarmatch-live.firebasestorage.app",
  messagingSenderId: "562476673285",
  appId: "1:562476673285:web:b3a72f197add3c30722f6c",
  measurementId: "G-FGS2XCP866"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isLiveFirebase = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isLiveFirebase = true;
} catch (e) {
  console.warn("Firebase initialization warning (using local fallback state):", e);
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db, storage, isLiveFirebase };
