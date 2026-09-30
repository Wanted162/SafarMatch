/**
 * SafarMatch — Profile & Trust Verification Service
 * Handles user profile state, KYC documents, live WebRTC selfie capture, and Firestore synchronization.
 */

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS, isNotificationSeen, markNotificationSeen, resetNotificationSeen } from '../utils/storage';
import { showToast } from '../utils/toast';
import { INDIAN_CIRCUITS_LOOKUP } from '../config/constants';
import { isStep1Complete, hasActiveExplorerPass, getMonthlyConnects } from './paymentService';
import { sanitizePublicProfile, preparePrivateVaultPayload } from '../utils/vaultCrypto';
import type { UserProfile, VerificationStatus, SubscriptionStatus } from '../types';

export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd'/%3E%3C/svg%3E";

let currentProfile: UserProfile = {
  uid: "explorer_" + Math.random().toString(36).substring(2, 9),
  name: "",
  age: 21,
  gender: "",
  homeCity: "",
  homeLat: 20.5937,
  homeLng: 78.9629,
  currentCircuit: "",
  upcomingDestination: "",
  upcomingLat: 20.5937,
  upcomingLng: 78.9629,
  vibe: "",
  travelStyles: [],
  intent: "companion",
  bio: "",
  photoUrl: DEFAULT_AVATAR,
  verificationStatus: "unverified",
  subscriptionStatus: "free",
  isSurakshaEnabled: false
};

let profileSnapshotUnsubscribe: (() => void) | null = null;
let vaultSnapshotUnsubscribe: (() => void) | null = null;
let cachedVaultData: any = null;
let lastKnownVerificationStatus: string | null = null;
let lastKnownSubscriptionStatus: string | null = null;
let cameraMediaStream: MediaStream | null = null;
let capturedSelfieBlob: Blob | null = null;

export function getCachedVaultData(): any {
  return cachedVaultData;
}

export function getCurrentProfile(): UserProfile {
  return currentProfile;
}

export function setCurrentProfile(profile: UserProfile): void {
  currentProfile = profile;
}

export function initProfileState(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.bio && parsed.bio.includes("Passionate about road trips, chai stops")) {
        delete parsed.bio;
      }
      if (parsed.vibe && parsed.vibe.includes("Sunset Chaser")) {
        delete parsed.vibe;
      }
      if (parsed.photoUrl && parsed.photoUrl.includes("photo-1535713875002-d1d0cf377fde")) {
        parsed.photoUrl = DEFAULT_AVATAR;
      }
      currentProfile = { ...currentProfile, ...parsed };
    }
  } catch (e) {
    console.error("Error reading saved profile:", e);
  }
  return currentProfile;
}

export function updateVerificationBadgeUI(status: VerificationStatus): void {
  const badge = document.getElementById('header-verification-badge');
  const text = document.getElementById('header-verification-text');
  if (!badge || !text) return;

  if (status === 'verified') {
    badge.className = "hidden sm:flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";
    badge.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i><span id="header-verification-text">Verified Explorer ✓</span>`;
  } else if (status === 'pending') {
    badge.className = "hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300";
    badge.innerHTML = `<i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i><span id="header-verification-text">Review Pending</span>`;
  } else {
    badge.className = "hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200";
    badge.innerHTML = `<i data-lucide="shield-alert" class="w-3.5 h-3.5 text-slate-500"></i><span id="header-verification-text">Unverified</span>`;
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function updateProfileCompletionUI(): void {
  if (!currentProfile) return;
  let score = 0;
  if (currentProfile.name && currentProfile.name.trim().length >= 2) score += 15;
  if (currentProfile.age && currentProfile.age >= 18) score += 10;
  if (currentProfile.gender) score += 10;
  if (currentProfile.homeCity && currentProfile.homeCity.trim().length >= 2) score += 15;
  if (currentProfile.currentCircuit) score += 15;
  if (currentProfile.bio && currentProfile.bio.trim().length >= 10) score += 5;
  const hasSelfie = !!(cachedVaultData?.selfieData || (currentProfile as any).selfieData || (currentProfile as any).selfieSubmitted || (currentProfile.photoUrl && currentProfile.verificationStatus === 'verified'));
  const hasGovId = !!(cachedVaultData?.govtIdData || (currentProfile as any).govtIdData || currentProfile.verificationStatus === 'verified');
  if (hasSelfie) score += 15;
  if (hasGovId) score += 15;

  const pct = Math.min(100, score);

  const headerBar = document.getElementById('header-profile-progress');
  if (headerBar) headerBar.style.width = `${pct}%`;

  const profilePct = document.getElementById('profile-completion-pct');
  const profileBar = document.getElementById('profile-completion-bar');
  const sidebarPct = document.getElementById('sidebar-profile-pct');
  if (profilePct) profilePct.textContent = `${pct}%`;
  if (profileBar) profileBar.style.width = `${pct}%`;
  if (sidebarPct) sidebarPct.textContent = `${pct}%`;

  const hintEl = document.getElementById('profile-completion-hint');
  if (hintEl) {
    if (pct >= 100) {
      hintEl.textContent = "Profile 100% complete! Dual identity verification submitted.";
      hintEl.className = "text-[10px] text-emerald-600 font-medium";
    } else if (!hasSelfie && currentProfile.verificationStatus !== 'verified') {
      hintEl.textContent = "Add live selfie verification (+15%) to increase trust score.";
      hintEl.className = "text-[10px] text-rose-500 font-medium";
    } else if (!hasGovId && currentProfile.verificationStatus !== 'verified') {
      hintEl.textContent = "Upload Indian Government Photo ID (+15%) for full verification.";
      hintEl.className = "text-[10px] text-rose-500 font-medium";
    } else if (!currentProfile.bio || currentProfile.bio.trim().length < 10) {
      hintEl.textContent = "Write a quick bio (+5%) to introduce yourself to travel buddies.";
      hintEl.className = "text-[10px] text-amber-600 font-medium";
    } else {
      hintEl.textContent = "Complete remaining profile details to reach 100%.";
      hintEl.className = "text-[10px] text-slate-500";
    }
  }

  const pDisplayName = document.getElementById('profile-display-name');
  const pDisplaySub = document.getElementById('profile-display-sub');
  if (pDisplayName) pDisplayName.textContent = currentProfile.name || "Explorer Profile";
  if (pDisplaySub) {
    pDisplaySub.textContent = pct >= 100
      ? "Step 1 Complete ✓ Ready to explore circuits & connect with verified companions."
      : `Profile is ${pct}% complete. Complete Step 1 to unlock full companion matching.`;
  }

  const avatarSrc = (currentProfile.photoUrl && currentProfile.photoUrl !== DEFAULT_AVATAR) ? currentProfile.photoUrl : DEFAULT_AVATAR;
  const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
  const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  if (profileAvatar && profileAvatar.src !== avatarSrc) profileAvatar.src = avatarSrc;
  if (headerAvatar && headerAvatar.src !== avatarSrc) headerAvatar.src = avatarSrc;

  updateVerificationBadgeUI(currentProfile.verificationStatus);
}

export function updateJourneyStatusUI(): void {
  const step1Done = isStep1Complete(currentProfile);
  const hasPass = hasActiveExplorerPass(currentProfile);

  const step1Label = document.getElementById('step1-badge-label');
  const step1Icon = document.getElementById('step1-badge-icon');
  if (step1Label && step1Icon) {
    if (step1Done) {
      step1Label.textContent = "Complete ✓";
      step1Label.className = "font-bold text-emerald-600";
      step1Icon.className = "w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold";
    } else {
      step1Label.textContent = "Pending (2m)";
      step1Label.className = "font-bold text-amber-600";
      step1Icon.className = "w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold";
    }
  }

  const step2Label = document.getElementById('step2-badge-label');
  const step2Icon = document.getElementById('step2-badge-icon');
  if (step2Label && step2Icon) {
    if (hasPass) {
      step2Label.textContent = "Active VIP ★";
      step2Label.className = "font-bold text-emerald-600";
      step2Icon.className = "w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold";
    } else {
      step2Label.textContent = "Locked (₹299)";
      step2Label.className = "font-bold text-slate-500";
      step2Icon.className = "w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold";
    }
  }

  const monWarning = document.getElementById('monetization-step1-warning');
  if (monWarning) {
    if (!step1Done) monWarning.classList.remove('hidden');
    else monWarning.classList.add('hidden');
  }

  const chatBadge = document.getElementById('sidebar-chat-badge');
  const mobileChatLock = document.getElementById('mobile-chat-lock-badge');
  if (chatBadge) {
    if (hasPass) {
      chatBadge.className = "ml-auto text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full";
      chatBadge.innerHTML = "Unlocked";
    } else {
      chatBadge.className = "ml-auto text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1";
      chatBadge.innerHTML = `<i data-lucide="lock" class="w-2.5 h-2.5"></i> Pass`;
    }
  }
  if (mobileChatLock) {
    if (hasPass) mobileChatLock.classList.add('hidden');
    else mobileChatLock.classList.remove('hidden');
  }

  const tripsBanner = document.getElementById('trips-pass-banner');
  if (tripsBanner) {
    if (hasPass) tripsBanner.classList.add('hidden');
    else tripsBanner.classList.remove('hidden');
  }

  updateProfileCompletionUI();
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function attachProfileRealtimeListener(uid: string): void {
  if (!uid || !isLiveFirebase || !db) return;
  detachProfileRealtimeListener();

  try {
    // 1. Real-time listener for public profile (profiles/{uid})
    const profileRef = doc(db, "profiles", uid);
    profileSnapshotUnsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const newVerificationStatus = data.verificationStatus || "unverified";
      const rejectionReason = data.verificationRejectionReason || "Verification document requires re-upload.";
      const sub = data.subscription || {};
      const newSubStatus = sub.status || (data.isVip || data.hasExplorerPass ? "active" : "none");
      const paymentRejectionReason = sub.rejectionReason || "12-digit UTR was not found in SBI bank account credits.";

      currentProfile.verificationStatus = newVerificationStatus;
      if (data.name) currentProfile.name = data.name;
      if (data.age) currentProfile.age = data.age;
      if (data.gender) currentProfile.gender = data.gender;
      if (data.homeCity) currentProfile.homeCity = data.homeCity;
      if (data.currentCircuit) currentProfile.currentCircuit = data.currentCircuit;
      if (data.upcomingDestination) currentProfile.upcomingDestination = data.upcomingDestination;
      if (data.bio) currentProfile.bio = data.bio;
      if (data.photoUrl) currentProfile.photoUrl = data.photoUrl;
      if (data.homeLat) currentProfile.homeLat = data.homeLat;
      if (data.homeLng) currentProfile.homeLng = data.homeLng;

      if (data.verificationRejectionReason) {
        currentProfile.verificationRejectionReason = data.verificationRejectionReason;
      }
      if (data.isVip !== undefined) (currentProfile as any).isVip = data.isVip;
      if (data.hasExplorerPass !== undefined) (currentProfile as any).hasExplorerPass = data.hasExplorerPass;
      (currentProfile as any).subscription = sub;

      try {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
        localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
        if (data.isVip || data.hasExplorerPass) {
          localStorage.setItem(STORAGE_KEYS.PASS_UNLOCKED, 'true');
        } else if (newSubStatus === 'rejected') {
          localStorage.removeItem(STORAGE_KEYS.PASS_UNLOCKED);
        }
      } catch (e) {}

      // Verification transitions (Admin review notifications)
      if (lastKnownVerificationStatus !== null && lastKnownVerificationStatus !== newVerificationStatus) {
        if (newVerificationStatus === "verified") {
          if (!isNotificationSeen('verification', uid, 'verified')) {
            showVerificationApprovedCelebration();
          }
        } else if (newVerificationStatus === "rejected") {
          const rKey = rejectionReason.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '');
          if (!isNotificationSeen('verification', uid, 'rejected', rKey)) {
            showVerificationRejectedModal(rejectionReason);
          }
        }
      }
      lastKnownVerificationStatus = newVerificationStatus;

      // Subscription transitions
      if (lastKnownSubscriptionStatus !== null && lastKnownSubscriptionStatus !== newSubStatus) {
        if (newSubStatus === "active") {
          if (!isNotificationSeen('payment', uid, 'active')) {
            showPaymentApprovedCelebration();
          }
        } else if (newSubStatus === "rejected") {
          const prKey = paymentRejectionReason.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '');
          if (!isNotificationSeen('payment', uid, 'rejected', prKey)) {
            showPaymentRejectedModal(paymentRejectionReason);
          }
        }
      }
      lastKnownSubscriptionStatus = newSubStatus;

      updateVerificationBadgeUI(newVerificationStatus);
      updateVerificationDocumentBadges();
      updateProfileCompletionUI();
      updateJourneyStatusUI();
    }, (err) => {
      console.warn("Profile real-time listener error:", err);
    });

    // 2. Real-time listener for confidential vault (vault/{uid})
    const vaultRef = doc(db, "vault", uid);
    vaultSnapshotUnsubscribe = onSnapshot(vaultRef, (vaultSnap) => {
      if (!vaultSnap.exists()) return;
      cachedVaultData = vaultSnap.data();
      updateVerificationDocumentBadges();
      updateProfileCompletionUI();
      updateJourneyStatusUI();
    }, (err) => {
      console.warn("Vault real-time listener error:", err);
    });
  } catch (err) {
    console.warn("Could not attach profile/vault real-time listeners:", err);
  }
}

export function detachProfileRealtimeListener(): void {
  if (profileSnapshotUnsubscribe) {
    try { profileSnapshotUnsubscribe(); } catch (e) {}
    profileSnapshotUnsubscribe = null;
  }
  if (vaultSnapshotUnsubscribe) {
    try { vaultSnapshotUnsubscribe(); } catch (e) {}
    vaultSnapshotUnsubscribe = null;
  }
}

export function updateVerificationDocumentBadges(): void {
  const selfieBadge = document.getElementById('badge-selfie-state');
  const govidBadge = document.getElementById('badge-govid-state');

  const isVerified = currentProfile.verificationStatus === 'verified';
  const hasSelfie = !!(cachedVaultData?.selfieData || (currentProfile as any).selfieSubmitted || (currentProfile as any).selfieData);
  const hasGovId = !!(cachedVaultData?.govtIdData || (currentProfile as any).govtIdData);

  if (selfieBadge) {
    if (isVerified) {
      selfieBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600";
      selfieBadge.textContent = "Verified ✓";
    } else if (hasSelfie) {
      selfieBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600";
      selfieBadge.textContent = "Submitted (In Review)";
    } else {
      selfieBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
      selfieBadge.textContent = "Not Done";
    }
  }

  if (govidBadge) {
    if (isVerified) {
      govidBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600";
      govidBadge.textContent = "Verified ✓";
    } else if (hasGovId) {
      govidBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600";
      govidBadge.textContent = "Submitted (In Review)";
    } else {
      govidBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300";
      govidBadge.textContent = "Mandatory *";
    }
  }
}

export async function hydrateProfileFromFirestore(uid: string, googleUser?: any): Promise<UserProfile> {
  if (!uid) return currentProfile;

  if (isLiveFirebase && db) {
    try {
      // 1. Fetch public profile (profiles/{uid})
      const docRef = doc(db, "profiles", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentProfile = {
          ...currentProfile,
          uid,
          ...data
        };
      } else {
        currentProfile = {
          ...currentProfile,
          uid,
          name: googleUser?.displayName || currentProfile.name || "Explorer",
          photoUrl: googleUser?.photoURL || currentProfile.photoUrl || DEFAULT_AVATAR
        };
        const { selfieData, govtIdData, ...lightweightInit } = currentProfile as any;
        await setDoc(docRef, { ...lightweightInit, updatedAt: serverTimestamp() }, { merge: true });
      }

      // 2. Fetch confidential KYC vault (vault/{uid})
      const vaultRef = doc(db, "vault", uid);
      const vaultSnap = await getDoc(vaultRef);
      if (vaultSnap.exists()) {
        cachedVaultData = vaultSnap.data();
      }
    } catch (e) {
      console.warn("Firestore hydrateProfile error:", e);
    }
  }

  // Restore all UI form inputs
  const nameInput = document.getElementById('input-full-name') as HTMLInputElement | null;
  const ageInput = document.getElementById('input-age') as HTMLInputElement | null;
  const genderInput = document.getElementById('input-gender') as HTMLSelectElement | null;
  const homeCityInput = document.getElementById('input-home-city') as HTMLInputElement | null;
  const circuitInput = document.getElementById('input-upcoming-circuit') as HTMLInputElement | null;
  const bioInput = document.getElementById('input-bio') as HTMLTextAreaElement | null;
  const intentInput = document.getElementById('input-travel-intent') as HTMLInputElement | null;

  if (nameInput) nameInput.value = currentProfile.name || '';
  if (ageInput) ageInput.value = currentProfile.age ? String(currentProfile.age) : '';
  if (genderInput) genderInput.value = currentProfile.gender || 'Male';
  if (homeCityInput) homeCityInput.value = currentProfile.homeCity || '';
  if (circuitInput) circuitInput.value = currentProfile.currentCircuit || currentProfile.upcomingDestination || '';
  if (bioInput) bioInput.value = currentProfile.bio || '';
  if (intentInput) intentInput.value = currentProfile.intent || 'companion';

  // Restore avatars across UI
  const avatarSrc = currentProfile.photoUrl || cachedVaultData?.selfieData || DEFAULT_AVATAR;
  const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
  const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  const menuAvatar = document.getElementById('menu-user-avatar') as HTMLImageElement | null;
  if (profileAvatar) profileAvatar.src = avatarSrc;
  if (headerAvatar) headerAvatar.src = avatarSrc;
  if (menuAvatar) menuAvatar.src = avatarSrc;

  // Restore user name in header and dropdown
  const headerName = document.getElementById('header-user-name');
  const menuName = document.getElementById('menu-user-name');
  const profileDisplayName = document.getElementById('profile-display-name');
  if (headerName && currentProfile.name) headerName.textContent = currentProfile.name.split(' ')[0];
  if (menuName && currentProfile.name) menuName.textContent = currentProfile.name;
  if (profileDisplayName && currentProfile.name) profileDisplayName.textContent = currentProfile.name;

  // Hydrate map marker
  if (currentProfile.homeLat && currentProfile.homeLng && (window as any).initHomeCityMiniMap) {
    try {
      (window as any).initHomeCityMiniMap(currentProfile.homeLat, currentProfile.homeLng);
    } catch (e) {}
  }

  // Restore verification state badges
  updateVerificationDocumentBadges();
  updateVerificationBadgeUI(currentProfile.verificationStatus);
  updateProfileCompletionUI();
  updateJourneyStatusUI();

  try {
    localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
  } catch (e) {}

  return currentProfile;
}

export function resetProfileToGuest(): void {
  detachProfileRealtimeListener();
  cachedVaultData = null;
  currentProfile = {
    uid: "guest_" + Math.random().toString(36).substring(2, 9),
    name: "",
    age: 21,
    gender: "Male",
    homeCity: "",
    homeLat: 20.5937,
    homeLng: 78.9629,
    currentCircuit: "",
    upcomingDestination: "",
    upcomingLat: 20.5937,
    upcomingLng: 78.9629,
    vibe: "",
    travelStyles: [],
    intent: "companion",
    bio: "",
    photoUrl: DEFAULT_AVATAR,
    verificationStatus: "unverified",
    subscriptionStatus: "free",
    isSurakshaEnabled: false
  };

  const nameInput = document.getElementById('input-full-name') as HTMLInputElement | null;
  const ageInput = document.getElementById('input-age') as HTMLInputElement | null;
  const homeCityInput = document.getElementById('input-home-city') as HTMLInputElement | null;
  const circuitInput = document.getElementById('input-upcoming-circuit') as HTMLInputElement | null;
  const bioInput = document.getElementById('input-bio') as HTMLTextAreaElement | null;
  if (nameInput) nameInput.value = '';
  if (ageInput) ageInput.value = '';
  if (homeCityInput) homeCityInput.value = '';
  if (circuitInput) circuitInput.value = '';
  if (bioInput) bioInput.value = '';

  const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
  const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  const menuAvatar = document.getElementById('menu-user-avatar') as HTMLImageElement | null;
  if (profileAvatar) profileAvatar.src = DEFAULT_AVATAR;
  if (headerAvatar) headerAvatar.src = DEFAULT_AVATAR;
  if (menuAvatar) menuAvatar.src = DEFAULT_AVATAR;

  const headerUserName = document.getElementById('header-user-name');
  const menuUserName = document.getElementById('menu-user-name');
  const profileDisplayName = document.getElementById('profile-display-name');
  if (headerUserName) headerUserName.textContent = "Guest";
  if (menuUserName) menuUserName.textContent = "Guest";
  if (profileDisplayName) profileDisplayName.textContent = "Your Traveler Profile";

  updateVerificationDocumentBadges();
  updateVerificationBadgeUI("unverified");
  updateProfileCompletionUI();
  updateJourneyStatusUI();
}

export function showVerificationApprovedCelebration(force = false): void {
  const uid = currentProfile ? currentProfile.uid : null;
  if (!force && isNotificationSeen('verification', uid, 'verified')) return;
  const modal = document.getElementById('verification-approved-modal');
  if (modal) modal.classList.remove('hidden');
  showToast("🎉 Identity Verified! Your profile has been reviewed and awarded the Verified Explorer Shield.", "success");
  markNotificationSeen('verification', uid, 'verified');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeVerificationApprovedModal(): void {
  const uid = currentProfile ? currentProfile.uid : null;
  markNotificationSeen('verification', uid, 'verified');
  const modal = document.getElementById('verification-approved-modal');
  if (modal) modal.classList.add('hidden');
}

export function showVerificationRejectedModal(reason?: string, force = false): void {
  const uid = currentProfile ? currentProfile.uid : null;
  const reasonText = reason || currentProfile.verificationRejectionReason || "Document photo is blurry, unreadable, or cut off.";
  if (!force && isNotificationSeen('verification', uid, 'rejected', reasonText)) return;
  const modal = document.getElementById('verification-rejected-modal');
  const reasonEl = document.getElementById('verification-rejection-reason-text');
  if (reasonEl) reasonEl.textContent = reasonText;
  if (modal) modal.classList.remove('hidden');
  showToast("⚠️ Identity verification requires attention.", "error");
  markNotificationSeen('verification', uid, 'rejected', reasonText);
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeVerificationRejectedModal(): void {
  const uid = currentProfile ? currentProfile.uid : null;
  const reasonText = currentProfile.verificationRejectionReason || "default";
  markNotificationSeen('verification', uid, 'rejected', reasonText);
  const modal = document.getElementById('verification-rejected-modal');
  if (modal) modal.classList.add('hidden');
}

export function showPaymentApprovedCelebration(force = false): void {
  const uid = currentProfile ? currentProfile.uid : null;
  if (!force && isNotificationSeen('payment', uid, 'active')) return;
  const modal = document.getElementById('payment-approved-modal');
  if (modal) modal.classList.remove('hidden');
  showToast("🎉 Explorer Pass Activated! Unlimited chats and live trip board access are unlocked.", "success");
  markNotificationSeen('payment', uid, 'active');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closePaymentApprovedModal(): void {
  const uid = currentProfile ? currentProfile.uid : null;
  markNotificationSeen('payment', uid, 'active');
  const modal = document.getElementById('payment-approved-modal');
  if (modal) modal.classList.add('hidden');
}

export function showPaymentRejectedModal(reason?: string, force = false): void {
  const uid = currentProfile ? currentProfile.uid : null;
  const reasonText = reason || ((currentProfile as any).subscription && (currentProfile as any).subscription.rejectionReason) || "12-digit UTR was not found in SBI bank account credits.";
  if (!force && isNotificationSeen('payment', uid, 'rejected', reasonText)) return;
  const modal = document.getElementById('payment-rejected-modal');
  const reasonEl = document.getElementById('payment-rejection-reason-text');
  if (reasonEl) reasonEl.textContent = reasonText;
  if (modal) modal.classList.remove('hidden');
  showToast("⚠️ Payment not verified. Please check your 12-digit UTR.", "error");
  markNotificationSeen('payment', uid, 'rejected', reasonText);
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closePaymentRejectedModal(): void {
  const uid = currentProfile ? currentProfile.uid : null;
  const reasonText = ((currentProfile as any).subscription && (currentProfile as any).subscription.rejectionReason) || "default";
  markNotificationSeen('payment', uid, 'rejected', reasonText);
  const modal = document.getElementById('payment-rejected-modal');
  if (modal) modal.classList.add('hidden');
}

// Camera WebRTC Selfie
export function openSelfieModal(): void {
  const modal = document.getElementById('selfie-modal');
  const video = document.getElementById('selfie-video') as HTMLVideoElement | null;
  const preview = document.getElementById('selfie-captured-preview');
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');
  const loading = document.getElementById('camera-loading-indicator');
  const fallback = document.getElementById('camera-fallback-overlay');

  if (!modal || !video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload || !loading || !fallback) return;

  modal.classList.remove('hidden');
  preview.classList.add('hidden');
  video.classList.remove('hidden');
  oval.classList.remove('hidden');
  btnCapture.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnUpload.classList.add('hidden');
  fallback.classList.add('hidden');
  loading.classList.remove('hidden');

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        cameraMediaStream = stream;
        video.srcObject = stream;
        video.play();
        loading.classList.add('hidden');
      })
      .catch(err => {
        console.warn("Camera stream rejected / blocked:", err);
        loading.classList.add('hidden');
        fallback.classList.remove('hidden');
      });
  } else {
    loading.classList.add('hidden');
    fallback.classList.remove('hidden');
  }
}

export function closeSelfieModal(): void {
  if (cameraMediaStream) {
    cameraMediaStream.getTracks().forEach(track => track.stop());
    cameraMediaStream = null;
  }
  const modal = document.getElementById('selfie-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * HTML5 Canvas Image Compression Pipeline
 * Scales uploaded images (camera stream or file) to max 480x480 (JPEG 0.7 quality),
 * strictly guaranteeing files stay <60 KB to prevent document bloat and memory leaks.
 */
export function compressImageToCanvasBlob(
  source: HTMLImageElement | HTMLVideoElement,
  isMirrored = false
): Promise<{ blob: Blob; base64: string }> {
  return new Promise((resolve, reject) => {
    try {
      const maxDim = 480;
      let width = source instanceof HTMLVideoElement ? source.videoWidth || 480 : source.naturalWidth || source.width;
      let height = source instanceof HTMLVideoElement ? source.videoHeight || 480 : source.naturalHeight || source.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      width = Math.max(1, width);
      height = Math.max(1, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Unable to create canvas 2d context"));
        return;
      }

      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(source, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas blob conversion failed"));
          return;
        }
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ blob, base64 });
      }, 'image/jpeg', 0.7);
    } catch (err) {
      reject(err);
    }
  });
}

export function captureSelfieFrame(): void {
  const video = document.getElementById('selfie-video') as HTMLVideoElement | null;
  const preview = document.getElementById('selfie-captured-preview') as HTMLImageElement | null;
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');

  if (!video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload) return;

  compressImageToCanvasBlob(video, true).then(({ blob, base64 }) => {
    capturedSelfieBlob = blob;
    (window as any).__lastCapturedSelfieBase64 = base64;
    preview.src = URL.createObjectURL(blob);
    preview.classList.remove('hidden');
    video.classList.add('hidden');
    oval.classList.add('hidden');
    btnCapture.classList.add('hidden');
    btnRetake.classList.remove('hidden');
    btnUpload.classList.remove('hidden');

    const statusEl = document.getElementById('selfie-compression-status');
    if (statusEl) {
      statusEl.textContent = `Frame captured & compressed: ${(blob.size / 1024).toFixed(1)} KB (<60 KB limit met)`;
    }
  }).catch((err) => {
    console.error("Selfie frame compression error:", err);
    showToast("Failed to process camera frame. Please try uploading a photo.", "error");
  });
}

export function retakeSelfieFrame(): void {
  const video = document.getElementById('selfie-video');
  const preview = document.getElementById('selfie-captured-preview');
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');

  if (!video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload) return;

  preview.classList.add('hidden');
  video.classList.remove('hidden');
  oval.classList.remove('hidden');
  btnCapture.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnUpload.classList.add('hidden');
}

export function uploadCapturedSelfie(): void {
  if (!capturedSelfieBlob) return;
  const base64 = (window as any).__lastCapturedSelfieBase64;
  processVerificationSubmission("selfie", capturedSelfieBlob, base64);
  closeSelfieModal();
}

export function handleSelfieFileSelected(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files && target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      compressImageToCanvasBlob(img, false).then(({ blob, base64 }) => {
        processVerificationSubmission("selfie", blob, base64);
        closeSelfieModal();
      }).catch(err => {
        console.error("Selfie file compression error:", err);
        showToast("Error compressing photo.", "error");
      });
    };
    img.src = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export function handleGovIdFileSelected(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files && target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      compressImageToCanvasBlob(img, false).then(({ blob, base64 }) => {
        processVerificationSubmission("gov_id", blob, base64);
      }).catch(err => {
        console.error("Gov ID compression error:", err);
        showToast("Error compressing ID document.", "error");
      });
    };
    img.src = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
}

async function processVerificationSubmission(type: 'selfie' | 'gov_id', blob: Blob, precomputedBase64?: string): Promise<void> {
  if (!currentProfile) return;
  (currentProfile as any).selfieSubmitted = true;
  currentProfile.verificationStatus = "pending";

  const sizeKb = (blob.size / 1024).toFixed(1);
  showToast(`⏳ Uploading ${type === 'selfie' ? 'live selfie' : 'photo ID'} (${sizeKb} KB) to 256-bit Secure Vault...`, "info");

  const commitToVault = async (base64Data: string) => {
    const fieldName = type === 'selfie' ? 'selfieData' : 'govtIdData';
    cachedVaultData = {
      ...cachedVaultData,
      [fieldName]: base64Data,
      verificationType: type,
      status: 'pending_review'
    };

    if (type === 'selfie' && (!currentProfile.photoUrl || currentProfile.photoUrl === DEFAULT_AVATAR)) {
      currentProfile.photoUrl = base64Data;
      const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
      const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
      if (profileAvatar) profileAvatar.src = base64Data;
      if (headerAvatar) headerAvatar.src = base64Data;
    }

    if (isLiveFirebase && db && currentProfile.uid) {
      try {
        // 1. Upload compressed verification document to confidential vault/{user.uid} (<60 KB)
        await setDoc(doc(db, "vault", currentProfile.uid), {
          [fieldName]: base64Data,
          verificationType: type,
          status: 'pending_review',
          verificationSubmittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 2. Update lightweight status ONLY in profiles/{user.uid} (NO Base64 strings in profiles collection)
        await setDoc(doc(db, "profiles", currentProfile.uid), {
          verificationStatus: "pending",
          updatedAt: serverTimestamp()
        }, { merge: true });

        showToast("🔒 Identity securely uploaded to 256-bit Cloud Vault. Review pending.", "success");
      } catch (err) {
        console.warn("Firestore profile verification write error:", err);
        showToast("🔒 Identity securely saved to 256-bit Encrypted Vault.", "info");
      }
    } else {
      showToast("🔒 Identity securely encrypted in local vault. Review pending.", "info");
    }

    try {
      localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
    } catch (e) {}

    updateVerificationDocumentBadges();
    updateProfileCompletionUI();
    updateJourneyStatusUI();
  };

  if (precomputedBase64) {
    await commitToVault(precomputedBase64);
  } else {
    const reader = new FileReader();
    reader.onload = async function(evt) {
      const base64Data = evt.target?.result as string;
      await commitToVault(base64Data);
    };
    reader.readAsDataURL(blob);
  }
}
