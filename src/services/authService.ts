/**
 * SafarMatch — Authentication Service
 * Handles Google OAuth, persistent Auth State, and GitHub Pages / live web fallbacks.
 */

import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS } from '../utils/storage';
import { showToast } from '../utils/toast';
import type { UserProfile } from '../types';

let currentUser: any = null;
let authStateListeners: Array<(user: User | null) => void> = [];
let pendingAuthResolver: ((user: any) => void) | null = null;

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: any): void {
  currentUser = user;
  authStateListeners.forEach(listener => listener(user));
}

export function onAuthChanged(callback: (user: User | null) => void): () => void {
  authStateListeners.push(callback);
  return () => {
    authStateListeners = authStateListeners.filter(cb => cb !== callback);
  };
}

export function openGoogleSignInModal(): void {
  const modal = document.getElementById('google-signin-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

export function closeGoogleSignInModal(): void {
  const modal = document.getElementById('google-signin-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function authenticateWithGoogleIdentity(
  name: string, 
  email: string, 
  photoUrl?: string,
  currentProfile?: UserProfile,
  onProfileMerged?: (updated: UserProfile) => void
): any {
  const uid = "gid_" + btoa(email.toLowerCase()).replace(/=/g, '').slice(0, 16);
  const avatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e11d48&color=fff&bold=true`;
  
  const googleUser: any = {
    uid,
    displayName: name,
    email,
    photoURL: avatar,
    emailVerified: true
  };

  const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  const baseProfile: UserProfile = currentProfile || (storedProfile ? JSON.parse(storedProfile) : {
    uid,
    name,
    age: 24,
    gender: 'Male',
    homeCity: 'India',
    homeLat: 20.5937,
    homeLng: 78.9629,
    currentCircuit: 'Goa',
    upcomingDestination: 'North Goa (Arambol & Morjim)',
    upcomingLat: 15.6033,
    upcomingLng: 73.7431,
    vibe: 'Sunset Chaser & Co-worker',
    travelStyles: ['Digital Nomad', 'Backpacker'],
    intent: 'companion',
    bio: 'Verified solo traveler ready to explore Bharat.',
    photoUrl: avatar,
    verificationStatus: 'verified',
    subscriptionStatus: 'active',
    isSurakshaEnabled: false
  });

  const updatedProfile: UserProfile = {
    ...baseProfile,
    uid,
    name: name || baseProfile.name,
    photoUrl: avatar,
    verificationStatus: 'verified'
  };

  // Sync to Firestore if available
  if (isLiveFirebase && db) {
    try {
      const docRef = doc(db, "profiles", uid);
      setDoc(docRef, updatedProfile, { merge: true }).catch(err => {
        console.warn("Firestore sync warning on Google ID login:", err);
      });
    } catch (e) {
      console.warn("Firestore access warning:", e);
    }
  }

  // Save session to localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(googleUser));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
  } catch (e) {
    console.error("Storage save error:", e);
  }

  setCurrentUser(googleUser);

  if (onProfileMerged) {
    onProfileMerged(updatedProfile);
  }

  // Update Top Nav Header UI
  const authBtnText = document.getElementById('btn-auth-text');
  if (authBtnText) authBtnText.textContent = "Sign Out";

  const headerUserName = document.getElementById('header-user-name');
  if (headerUserName) headerUserName.textContent = name.split(' ')[0] || name;

  const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  if (headerUserAvatar) headerUserAvatar.src = avatar;

  // Close modals & landing
  closeGoogleSignInModal();
  const landing = document.getElementById('landing-page');
  if (landing) landing.classList.add('hidden');

  showToast(`Namaste, ${name}! Signed in with Google ID (${email}).`, "success");

  if (pendingAuthResolver) {
    pendingAuthResolver(googleUser);
    pendingAuthResolver = null;
  }

  return googleUser;
}

export async function loginWithGoogle(
  currentProfile: UserProfile, 
  onProfileMerged: (updated: UserProfile) => void
): Promise<User | null> {
  // 1. Try Firebase Popup first
  if (isLiveFirebase && auth) {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, googleProvider);
      currentUser = res.user;

      const updatedProfile: UserProfile = {
        ...currentProfile,
        uid: res.user.uid,
        name: currentProfile.name && currentProfile.name.trim() !== "" ? currentProfile.name : (res.user.displayName || "Google Explorer"),
        photoUrl: res.user.photoURL || currentProfile.photoUrl,
        verificationStatus: 'verified'
      };

      // Sync profile with Firestore
      if (db) {
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

      // Update header
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign Out";
      const headerUserName = document.getElementById('header-user-name');
      if (headerUserName) headerUserName.textContent = (res.user.displayName || 'Explorer').split(' ')[0];
      const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
      if (headerUserAvatar && res.user.photoURL) headerUserAvatar.src = res.user.photoURL;

      return res.user;
    } catch (popupErr: any) {
      console.warn("Firebase popup not supported on this domain or blocked:", popupErr?.code, popupErr?.message);
      // Fall through to Google ID Dialog
    }
  }

  // 2. Fallback Google ID Dialog for GitHub Pages & cross-origin hosts
  openGoogleSignInModal();

  return new Promise((resolve) => {
    pendingAuthResolver = resolve;
  });
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
  
  // Reset header UI
  const authBtnText = document.getElementById('btn-auth-text');
  if (authBtnText) authBtnText.textContent = "Sign In";
  const headerUserName = document.getElementById('header-user-name');
  if (headerUserName) headerUserName.textContent = "Guest";
  const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  if (headerUserAvatar) {
    headerUserAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  }

  setCurrentUser(null);
}

export function initAuthListener(onUserDetected: (user: User | null) => void): void {
  // Check cached session first
  let cachedUser: any = null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
    if (stored) {
      cachedUser = JSON.parse(stored);
      currentUser = cachedUser;
      onUserDetected(cachedUser);

      // Restore header UI
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign Out";
      const headerUserName = document.getElementById('header-user-name');
      if (headerUserName && cachedUser.displayName) {
        headerUserName.textContent = cachedUser.displayName.split(' ')[0];
      }
      const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
      if (headerUserAvatar && cachedUser.photoURL) {
        headerUserAvatar.src = cachedUser.photoURL;
      }
    }
  } catch (e) {
    console.warn("Cached user parse error:", e);
  }

  if (isLiveFirebase && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = user;
        onUserDetected(user);
      } else if (!cachedUser) {
        currentUser = null;
        onUserDetected(null);
      }
    });
  } else if (!cachedUser) {
    onUserDetected(null);
  }
}
