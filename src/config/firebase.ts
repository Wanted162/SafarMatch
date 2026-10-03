/**
 * SafarMatch — Firebase Integration Config
 * Configured for Firebase Authentication, Firestore, and Storage with graceful fallbacks.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { initializeFirestore, setLogLevel, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// 1. Suppress internal SDK connection retry messages when backend is offline or unprovisioned
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore if setLogLevel is not supported in certain runtimes
}

// Check for runtime injected configuration or custom project
const runtimeConfig = (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__) || null;
const storedConfig = (typeof window !== 'undefined' && localStorage.getItem('safarmatch_firebase_config'))
  ? JSON.parse(localStorage.getItem('safarmatch_firebase_config')!)
  : null;

export const firebaseConfig = runtimeConfig || storedConfig || {
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

// Determine if a real provisioned project is supplied
const isProvisionedProject = Boolean(
  (runtimeConfig && runtimeConfig.projectId) ||
  (storedConfig && storedConfig.projectId) ||
  firebaseConfig.projectId
);

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  storage = getStorage(app);

  if (isProvisionedProject) {
    // Only initialize Firestore network channels if a verified backend is provisioned
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
    isLiveFirebase = true;
  } else {
    // Graceful offline operation with local encrypted storage and seed data
    db = null;
    isLiveFirebase = false;
  }
} catch (e) {
  console.warn("Firebase initialization notice (running in resilient local mode):", e);
  db = null;
  isLiveFirebase = false;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, storage, isLiveFirebase };

