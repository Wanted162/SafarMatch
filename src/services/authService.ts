/**
 * SafarMatch — Authentication Service
 * Fully functional native Google Sign-In with official Google OAuth permissions prompt.
 * Zero manual text boxes: obtains real verified identity, email, and avatar directly from Google.
 */

import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  type User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS, clearAllSessionAndCacheData } from '../utils/storage';
import { setSessionCookie, getSessionCookie, clearAllAuthCookies } from '../utils/cookieUtils';
import { showToast } from '../utils/toast';
import type { UserProfile } from '../types';

let currentUser: any = null;
let authStateListeners: Array<(user: User | null) => void> = [];

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

/**
 * Triggers native Google Sign-In popup with Google's permission & account consent screen.
 * Automatically saves verified Google profile, syncs to Firestore, and sets origin-bound cookies.
 */
export async function loginWithGoogle(
  currentProfile: UserProfile, 
  onProfileMerged: (updated: UserProfile) => void
): Promise<User | null> {
  if (!isLiveFirebase || !auth) {
    showToast("Firebase Auth is initializing. Please try again in a moment.", "warning");
    return null;
  }

  try {
    // Open real Google account picker & permission consent prompt
    const res = await signInWithPopup(auth, googleProvider);
    const googleUser = res.user;
    currentUser = googleUser;

    const updatedProfile: UserProfile = {
      ...currentProfile,
      uid: googleUser.uid,
      name: googleUser.displayName || currentProfile.name || "Explorer",
      photoUrl: googleUser.photoURL || currentProfile.photoUrl,
      verificationStatus: 'verified'
    };

    // 1. Sync verified profile with Firestore
    if (db) {
      try {
        const docRef = doc(db, "profiles", googleUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          Object.assign(updatedProfile, docSnap.data(), { 
            uid: googleUser.uid, 
            name: googleUser.displayName || updatedProfile.name,
            photoUrl: googleUser.photoURL || updatedProfile.photoUrl
          });
        } else {
          await setDoc(docRef, updatedProfile, { merge: true });
        }
      } catch (e) {
        console.warn("Firestore profile sync notice:", e);
      }
    }

    // 2. Set origin-bound secure session cookie (SameSite=Strict)
    setSessionCookie(googleUser.uid, true);

    // 3. Save session in localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify({
        uid: googleUser.uid,
        displayName: googleUser.displayName,
        email: googleUser.email,
        photoURL: googleUser.photoURL
      }));
    } catch (e) {
      console.error("Storage error:", e);
    }

    onProfileMerged(updatedProfile);
    setCurrentUser(googleUser);

    // 4. Update header UI
    const authBtnText = document.getElementById('btn-auth-text');
    if (authBtnText) authBtnText.textContent = "Sign Out";
    const headerUserName = document.getElementById('header-user-name');
    if (headerUserName && googleUser.displayName) {
      headerUserName.textContent = googleUser.displayName.split(' ')[0];
    }
    const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
    if (headerUserAvatar && googleUser.photoURL) {
      headerUserAvatar.src = googleUser.photoURL;
    }

    // 5. Hide landing overlay
    const landing = document.getElementById('landing-page') || document.getElementById('landing-overlay');
    if (landing) {
      landing.classList.add('hidden');
      landing.style.display = 'none';
    }

    showToast(`Namaste, ${googleUser.displayName || 'Explorer'}! Signed in with Google.`, "success");
    return googleUser;

  } catch (err: any) {
    console.warn("Google sign-in response:", err.code, err.message);

    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      showToast("Google sign-in was cancelled.", "info");
      return null;
    }

    // If popup was blocked by browser or mobile Webview, try redirect flow
    if (err.code === 'auth/popup-blocked') {
      showToast("Redirecting to Google for sign-in...", "info");
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        showToast("Unable to open Google login. Please allow popups.", "error");
      }
      return null;
    }

    if (err.code === 'auth/unauthorized-domain') {
      showToast(
        `Domain ${window.location.hostname} not authorized in Firebase Console > Authentication > Settings > Authorized domains.`, 
        "error"
      );
      return null;
    }

    showToast(err.message || "Google sign-in error. Please try again.", "error");
    return null;
  }
}

/**
 * Signs out the current user, clears all session cookies, and completely wipes all local & session caches.
 */
export async function signOutUser(): Promise<void> {
  // 1. Firebase signout
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Firebase sign out warning:", e);
    }
  }

  // 2. Clear all authentication & session cookies (SameSite=Strict, Max-Age=0)
  clearAllAuthCookies();

  // 3. Purge all user cache, local storage keys, session storage, and cache API
  await clearAllSessionAndCacheData();

  // 4. Wipe runtime in-memory user
  currentUser = null;
  setCurrentUser(null);
  
  // 5. Reset header & sidebar UI to Guest state
  const authBtnText = document.getElementById('btn-auth-text');
  if (authBtnText) authBtnText.textContent = "Sign In";
  const sidebarAuthBtnText = document.getElementById('sidebar-btn-auth-text');
  if (sidebarAuthBtnText) sidebarAuthBtnText.textContent = "Sign In";
  const profileSignoutBtn = document.getElementById('profile-signout-btn');
  if (profileSignoutBtn) profileSignoutBtn.classList.add('hidden');
  const headerUserName = document.getElementById('header-user-name');
  if (headerUserName) headerUserName.textContent = "Guest";
  const headerUserAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  if (headerUserAvatar) {
    headerUserAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  }
}

/**
 * Listens for auth state changes, checks session cookies, and captures any redirect result.
 */
export function initAuthListener(onUserDetected: (user: User | null) => void): void {
  // 1. Handle redirect result if user returned from Google redirect flow
  if (isLiveFirebase && auth) {
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        currentUser = result.user;
        setSessionCookie(result.user.uid, true);
        onUserDetected(result.user);
      }
    }).catch((e) => {
      console.warn("Redirect result check:", e);
    });
  }

  // 2. Check cached session against active session cookie
  const sessionCookie = getSessionCookie();
  let cachedUser: any = null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
    if (stored && sessionCookie.token) {
      cachedUser = JSON.parse(stored);
      currentUser = cachedUser;
      onUserDetected(cachedUser);

      // Restore header & sidebar UI
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign Out";
      const sidebarAuthBtnText = document.getElementById('sidebar-btn-auth-text');
      if (sidebarAuthBtnText) sidebarAuthBtnText.textContent = "Sign Out";
      const profileSignoutBtn = document.getElementById('profile-signout-btn');
      if (profileSignoutBtn) profileSignoutBtn.classList.remove('hidden');
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

  // 3. Listen to real Firebase Auth state changes
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
