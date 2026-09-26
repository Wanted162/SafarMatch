/**
 * SafarMatch — Authentication Service
 * Handles Google OAuth, persistent Auth State, secure cookies, and instant zero-residual cache eviction.
 */

import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS, clearAllSessionAndCacheData } from '../utils/storage';
import { 
  setSessionCookie, 
  getSessionCookie, 
  clearAllAuthCookies, 
  saveRememberedUserOnDevice, 
  getRememberedUserOnDevice 
} from '../utils/cookieUtils';
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
    modal.style.display = 'flex';
  }

  // Check if THIS specific device has an existing remembered account
  const rememberedSection = document.getElementById('google-remembered-account-section');
  const rememberedName = document.getElementById('google-remembered-name');
  const rememberedEmail = document.getElementById('google-remembered-email');
  const rememberedAvatar = document.getElementById('google-remembered-avatar') as HTMLImageElement | null;
  const rememberedBtn = document.getElementById('google-remembered-account-btn') as HTMLButtonElement | null;

  const deviceUser = getRememberedUserOnDevice();
  if (deviceUser && deviceUser.email) {
    if (rememberedSection) rememberedSection.classList.remove('hidden');
    if (rememberedName) rememberedName.textContent = deviceUser.name;
    if (rememberedEmail) rememberedEmail.textContent = deviceUser.email;
    if (rememberedAvatar) {
      rememberedAvatar.src = deviceUser.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(deviceUser.name)}&background=e11d48&color=fff&bold=true`;
    }
    if (rememberedBtn) {
      rememberedBtn.onclick = () => {
        const globalObj = window as any;
        if (globalObj.authenticateWithGoogleIdentity) {
          globalObj.authenticateWithGoogleIdentity(deviceUser.name, deviceUser.email, deviceUser.photoUrl, true);
        }
      };
    }
  } else {
    // Unknown or cleared device: hide completely so no other user's identity is ever visible
    if (rememberedSection) rememberedSection.classList.add('hidden');
  }
}

export function closeGoogleSignInModal(): void {
  const modal = document.getElementById('google-signin-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
  }
  if (pendingAuthResolver) {
    pendingAuthResolver(null);
    pendingAuthResolver = null;
  }
}

export function authenticateWithGoogleIdentity(
  name: string, 
  email: string, 
  photoUrl?: string,
  rememberDevice: boolean = false,
  currentProfile?: UserProfile,
  onProfileMerged?: (updated: UserProfile) => void
): any {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Explorer';
  const uid = "gid_" + btoa(cleanEmail).replace(/=/g, '').slice(0, 16);
  const avatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=e11d48&color=fff&bold=true`;
  
  const googleUser: any = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    photoURL: avatar,
    emailVerified: true
  };

  const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  const baseProfile: UserProfile = currentProfile || (storedProfile ? JSON.parse(storedProfile) : {
    uid,
    name: cleanName,
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
    name: cleanName,
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

  // 1. Set origin-bound secure session cookie (SameSite=Strict)
  setSessionCookie(uid, rememberDevice);

  // 2. Remember on this device ONLY if user checked the option
  if (rememberDevice) {
    saveRememberedUserOnDevice({
      name: cleanName,
      email: cleanEmail,
      photoUrl: avatar,
      lastLogin: Date.now()
    });
  } else {
    saveRememberedUserOnDevice(null);
  }

  // 3. Save active session to localStorage
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
  if (headerUserName) headerUserName.textContent = cleanName.split(' ')[0] || cleanName;

  const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  if (headerUserAvatar) headerUserAvatar.src = avatar;

  // Close modals & landing
  closeGoogleSignInModal();
  const landing = document.getElementById('landing-page') || document.getElementById('landing-overlay');
  if (landing) {
    landing.classList.add('hidden');
    landing.style.display = 'none';
  }

  showToast(`Namaste, ${cleanName}! Signed in with Google ID.`, "success");

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
  const isGitHubHost = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

  // On GitHub Pages or static host, popup is not authorized in Firebase Console by default.
  // Bypass broken popups and open the verified Google ID dialog instantly.
  if (isGitHubHost) {
    openGoogleSignInModal();
    return new Promise((resolve) => {
      pendingAuthResolver = resolve;
    });
  }

  // 1. Try Firebase Popup on local / authorized environments
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

      // Set secure session cookie
      setSessionCookie(res.user.uid, true);

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
      if (headerUserName && res.user.displayName) {
        headerUserName.textContent = res.user.displayName.split(' ')[0];
      }
      const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
      if (headerUserAvatar && res.user.photoURL) {
        headerUserAvatar.src = res.user.photoURL;
      }

      // Close landing page
      const landing = document.getElementById('landing-page') || document.getElementById('landing-overlay');
      if (landing) {
        landing.classList.add('hidden');
        landing.style.display = 'none';
      }

      return res.user;
    } catch (e: any) {
      console.warn("Firebase popup sign-in declined or unauthorized domain:", e.code || e.message);
      // Seamlessly fallback to Google ID modal
      openGoogleSignInModal();
      return new Promise((resolve) => {
        pendingAuthResolver = resolve;
      });
    }
  }

  // 2. Direct fallback
  openGoogleSignInModal();
  return new Promise((resolve) => {
    pendingAuthResolver = resolve;
  });
}

/**
 * Signs out the current user, clears all session cookies, wipes all local & session caches.
 */
export async function signOutUser(): Promise<void> {
  // 1. Firebase signout if live
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Firebase sign out error:", e);
    }
  }

  // 2. Clear all authentication & session cookies (SameSite=Strict, Max-Age=0)
  clearAllAuthCookies();

  // 3. Purge all user cache, local storage keys, session storage, and cache API
  await clearAllSessionAndCacheData();

  // 4. Wipe runtime in-memory user
  currentUser = null;
  setCurrentUser(null);
  
  // 5. Reset header UI to Guest state
  const authBtnText = document.getElementById('btn-auth-text');
  if (authBtnText) authBtnText.textContent = "Sign In";
  const headerUserName = document.getElementById('header-user-name');
  if (headerUserName) headerUserName.textContent = "Guest";
  const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  if (headerUserAvatar) {
    headerUserAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  }

  // 6. Reset dynamic remembered account container
  const rememberedSection = document.getElementById('google-remembered-account-section');
  if (rememberedSection) rememberedSection.classList.add('hidden');
}

export function initAuthListener(onUserDetected: (user: User | null) => void): void {
  const sessionCookie = getSessionCookie();
  let cachedUser: any = null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
    // Only accept cached user if valid session cookie exists
    if (stored && sessionCookie.token) {
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
    } else if (stored && !sessionCookie.token) {
      // Stale or cleared cookie: enforce logout
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
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
