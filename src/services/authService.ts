/**
 * SafarMatch — Authentication Service
 * Handles Google OAuth, Guest Sessions, and persistent Auth State.
 */

import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS } from '../utils/storage';
import { showToast } from '../utils/toast';
import type { UserProfile } from '../types';

let currentUser: User | null = null;
let authStateListeners: Array<(user: User | null) => void> = [];

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
  authStateListeners.forEach(listener => listener(user));
}

export function onAuthChanged(callback: (user: User | null) => void): () => void {
  authStateListeners.push(callback);
  return () => {
    authStateListeners = authStateListeners.filter(cb => cb !== callback);
  };
}

export async function loginWithGoogle(
  currentProfile: UserProfile, 
  onProfileMerged: (updated: UserProfile) => void
): Promise<User | null> {
  if (!isLiveFirebase || !auth) {
    throw new Error("Firebase Auth is not available");
  }

  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const res = await signInWithPopup(auth, googleProvider);
  currentUser = res.user;

  const updatedProfile: UserProfile = {
    ...currentProfile,
    uid: res.user.uid,
    name: currentProfile.name && currentProfile.name.trim() !== "" ? currentProfile.name : (res.user.displayName || ""),
    photoUrl: res.user.photoURL || currentProfile.photoUrl
  };

  // Sync profile with Firestore
  if (isLiveFirebase && db) {
    try {
      const docRef = doc(db, "profiles", res.user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        Object.assign(updatedProfile, docSnap.data(), { uid: res.user.uid });
      } else {
        await setDoc(docRef, updatedProfile, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore profile fetch error on auth:", e);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify({
      uid: res.user.uid,
      displayName: res.user.displayName,
      email: res.user.email,
      photoURL: res.user.photoURL
    }));
  } catch (e) {
    console.error("Storage error:", e);
  }

  onProfileMerged(updatedProfile);
  setCurrentUser(res.user);
  return res.user;
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  }
  currentUser = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
  } catch (e) {}
  setCurrentUser(null);
}

export function initAuthListener(onUserDetected: (user: User | null) => void): void {
  if (isLiveFirebase && auth) {
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      onUserDetected(user);
    });
  } else {
    // Check cached session
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
      if (stored) {
        currentUser = JSON.parse(stored) as User;
        onUserDetected(currentUser);
      } else {
        onUserDetected(null);
      }
    } catch (e) {
      onUserDetected(null);
    }
  }
}
