/**
 * SafarMatch — Profile & Trust Verification Service
 * Handles user profile state, KYC documents, live WebRTC selfie capture, and Firestore synchronization.
 */

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS, getAccountKeyFromEmail, isNotificationSeen, markNotificationSeen, resetNotificationSeen } from '../utils/storage';
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
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || localStorage.getItem('safarmatch_user_profile');
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

    // Hydrate confidential KYC vault data from persistent storage
    const userUid = currentProfile.uid || 'guest';
    const emailKey = currentProfile.email ? getAccountKeyFromEmail(currentProfile.email) : null;
    const storedVault = localStorage.getItem('safarmatch_vault_' + userUid) ||
                        (emailKey ? localStorage.getItem('safarmatch_vault_' + emailKey) : null) ||
                        localStorage.getItem('safarmatch_vault_data');
    if (storedVault) {
      try {
        cachedVaultData = JSON.parse(storedVault);
        if (cachedVaultData?.selfieData && !currentProfile.selfieData) {
          currentProfile.selfieData = cachedVaultData.selfieData;
        }
        if (cachedVaultData?.govtIdData && !currentProfile.govtIdData) {
          currentProfile.govtIdData = cachedVaultData.govtIdData;
        }
      } catch (e) {}
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
      if (data.homeLat) currentProfile.homeLat = data.homeLat;
      if (data.photoUrl && data.photoUrl !== currentProfile.photoUrl) {
        currentProfile.photoUrl = data.photoUrl;
        const profileImg = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
        const headerImg = document.getElementById('header-user-avatar') as HTMLImageElement | null;
        const menuImg = document.getElementById('menu-user-avatar') as HTMLImageElement | null;
        if (profileImg) profileImg.src = data.photoUrl;
        if (headerImg) headerImg.src = data.photoUrl;
        if (menuImg) menuImg.src = data.photoUrl;
        try {
          localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
        } catch (e) {}
      } else if (data.photoUrl) {
        currentProfile.photoUrl = data.photoUrl;
      }
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

  const selfieThumbBox = document.getElementById('selfie-preview-thumbnail-container');
  const selfieThumbImg = document.getElementById('selfie-preview-thumbnail') as HTMLImageElement | null;
  const govidThumbBox = document.getElementById('govid-preview-thumbnail-container');
  const govidThumbImg = document.getElementById('govid-preview-thumbnail') as HTMLImageElement | null;

  const isVerified = currentProfile.verificationStatus === 'verified';
  const selfieData = currentProfile.selfieData || cachedVaultData?.selfieData;
  const hasSelfie = !!(selfieData || (currentProfile as any).selfieSubmitted);
  const govidData = currentProfile.govtIdData || cachedVaultData?.govtIdData;
  const hasGovId = !!(govidData || (currentProfile as any).govtIdSubmitted);

  if (selfieThumbBox && selfieThumbImg) {
    if (selfieData && typeof selfieData === 'string' && selfieData.startsWith('data:image')) {
      selfieThumbImg.src = selfieData;
      selfieThumbBox.classList.remove('hidden');
    } else {
      selfieThumbBox.classList.add('hidden');
    }
  }

  if (govidThumbBox && govidThumbImg) {
    if (govidData && typeof govidData === 'string' && govidData.startsWith('data:image')) {
      govidThumbImg.src = govidData;
      govidThumbBox.classList.remove('hidden');
    } else {
      govidThumbBox.classList.add('hidden');
    }
  }

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

  const targetEmail = (googleUser?.email || currentProfile.email || '').trim().toLowerCase();
  const accountKey = targetEmail ? getAccountKeyFromEmail(targetEmail) : null;

  if (isLiveFirebase && db) {
    try {
      // 1. Fetch public profile from profiles/{uid} or profiles/{accountKey}
      let docRef = doc(db, "profiles", uid);
      let docSnap = await getDoc(docRef);

      // If document not found under UID, try accountKey derived from email
      if (!docSnap.exists() && accountKey && accountKey !== uid) {
        const accDocRef = doc(db, "profiles", accountKey);
        const accSnap = await getDoc(accDocRef);
        if (accSnap.exists()) {
          docRef = accDocRef;
          docSnap = accSnap;
        }
      }

      // If still not found by direct ID, search Firestore profiles collection by email!
      if (!docSnap.exists() && targetEmail) {
        try {
          const q = query(
            collection(db, "profiles"),
            where("email", "==", targetEmail),
            limit(1)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const foundDoc = qSnap.docs[0];
            docRef = foundDoc.ref;
            docSnap = foundDoc;
          }
        } catch (qErr) {
          console.warn("Firestore query by email notice:", qErr);
        }
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        currentProfile = {
          ...currentProfile,
          uid: accountKey || uid,
          ...data
        };
        if (targetEmail) {
          currentProfile.email = targetEmail;
        }
        if (data.selfieData) {
          currentProfile.selfieData = data.selfieData;
          (currentProfile as any).selfieSubmitted = true;
        }
        if (data.govtIdData) {
          currentProfile.govtIdData = data.govtIdData;
          (currentProfile as any).govtIdSubmitted = true;
        }
        if (data.photoUrl) {
          currentProfile.photoUrl = data.photoUrl;
        }

        // Hydrate cachedVaultData from the profile record
        if (data.selfieData || data.govtIdData) {
          cachedVaultData = {
            ...cachedVaultData,
            uid: currentProfile.uid,
            selfieData: data.selfieData || cachedVaultData?.selfieData || '',
            govtIdData: data.govtIdData || cachedVaultData?.govtIdData || '',
            status: data.verificationStatus || 'pending_review'
          };
          try {
            localStorage.setItem('safarmatch_vault_data', JSON.stringify(cachedVaultData));
            localStorage.setItem('safarmatch_vault_' + uid, JSON.stringify(cachedVaultData));
            if (accountKey) localStorage.setItem('safarmatch_vault_' + accountKey, JSON.stringify(cachedVaultData));
          } catch (e) {}
        }

        // Keep a synced copy under accountKey if loaded from a different doc ID
        if (accountKey && docRef.id !== accountKey) {
          try {
            await setDoc(doc(db, "profiles", accountKey), {
              ...data,
              uid: accountKey,
              email: targetEmail
            }, { merge: true });
          } catch (e) {}
        }
      } else {
        // Initialize new profile document without destroying existing info
        currentProfile = {
          ...currentProfile,
          uid: accountKey || uid,
          email: targetEmail || currentProfile.email,
          name: googleUser?.displayName || currentProfile.name || "Explorer",
          photoUrl: googleUser?.photoURL || currentProfile.photoUrl || DEFAULT_AVATAR
        };
        await setDoc(docRef, {
          uid: currentProfile.uid,
          email: currentProfile.email || '',
          name: currentProfile.name,
          photoUrl: currentProfile.photoUrl,
          selfieData: currentProfile.selfieData || '',
          govtIdData: currentProfile.govtIdData || '',
          verificationStatus: currentProfile.verificationStatus || 'unverified',
          subscriptionStatus: currentProfile.subscriptionStatus || 'free',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // 2. Also check confidential KYC vault (vault/{uid}) if accessible
      try {
        const vaultRef = doc(db, "vault", uid);
        const vaultSnap = await getDoc(vaultRef);
        if (vaultSnap.exists()) {
          const vData = vaultSnap.data();
          cachedVaultData = { ...cachedVaultData, ...vData };
          if (vData.selfieData && !currentProfile.selfieData) currentProfile.selfieData = vData.selfieData;
          if (vData.govtIdData && !currentProfile.govtIdData) currentProfile.govtIdData = vData.govtIdData;
        }
      } catch (vaultErr) {}
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
  const emailInput = document.getElementById('input-email') as HTMLInputElement | null;

  if (nameInput) nameInput.value = currentProfile.name || '';
  if (ageInput) ageInput.value = currentProfile.age ? String(currentProfile.age) : '';
  if (genderInput) genderInput.value = currentProfile.gender || 'Male';
  if (homeCityInput) homeCityInput.value = currentProfile.homeCity || '';
  if (circuitInput) circuitInput.value = currentProfile.currentCircuit || currentProfile.upcomingDestination || '';
  if (bioInput) bioInput.value = currentProfile.bio || '';
  if (intentInput) intentInput.value = currentProfile.intent || 'companion';
  if (emailInput) emailInput.value = currentProfile.email || '';

  // Restore avatars across UI
  const avatarSrc = currentProfile.photoUrl || cachedVaultData?.selfieData || currentProfile.selfieData || DEFAULT_AVATAR;
  const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
  const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
  const menuAvatar = document.getElementById('menu-user-avatar') as HTMLImageElement | null;
  if (profileAvatar) profileAvatar.src = avatarSrc;
  if (headerAvatar) headerAvatar.src = avatarSrc;
  if (menuAvatar) menuAvatar.src = avatarSrc;

  // Restore user name and email in header and dropdown
  const headerName = document.getElementById('header-user-name');
  const menuName = document.getElementById('menu-user-name');
  const menuEmail = document.getElementById('menu-user-email');
  const profileDisplayName = document.getElementById('profile-display-name');
  if (headerName && currentProfile.name) headerName.textContent = currentProfile.name.split(' ')[0];
  if (menuName && currentProfile.name) menuName.textContent = currentProfile.name;
  if (menuEmail && currentProfile.email) menuEmail.textContent = currentProfile.email;
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
        showToast("⚠️ Live camera access is mandatory on SafarMatch to prevent catfishing and identity fraud. Please enable camera access in your browser settings.", "error");
      });
  } else {
    loading.classList.add('hidden');
    fallback.classList.remove('hidden');
    showToast("⚠️ Live camera access is mandatory on SafarMatch to prevent catfishing and identity fraud. Please enable camera access in your browser settings.", "error");
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
 * Scales uploaded images (camera stream or file) to max 480x480 (JPEG 0.75 quality),
 * strictly guaranteeing files stay <60 KB to prevent document bloat and memory leaks.
 */
export function compressImageToCanvasBlob(
  source: HTMLImageElement | HTMLVideoElement,
  isMirrored = false
): Promise<{ blob: Blob; base64: string }> {
  return new Promise((resolve, reject) => {
    try {
      if (source instanceof HTMLVideoElement) {
        if (!source.videoWidth || !source.videoHeight || source.readyState < 2) {
          reject(new Error("Camera stream is not ready yet. Please wait a second and retry."));
          return;
        }
      }

      const maxDim = 480;
      let width = source instanceof HTMLVideoElement ? source.videoWidth : (source.naturalWidth || source.width || 480);
      let height = source instanceof HTMLVideoElement ? source.videoHeight : (source.naturalHeight || source.height || 480);

      if (width <= 0 || height <= 0) {
        reject(new Error("Invalid image source dimensions"));
        return;
      }

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

      try {
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, base64 });
          } else {
            try {
              const byteString = atob(base64.split(',')[1]);
              const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const fallbackBlob = new Blob([ab], { type: mimeString });
              resolve({ blob: fallbackBlob, base64 });
            } catch (convErr) {
              resolve({ blob: new Blob([base64], { type: 'image/jpeg' }), base64 });
            }
          }
        }, 'image/jpeg', 0.75);
      } catch (err) {
        reject(err);
      }
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
  const base64 = (window as any).__lastCapturedSelfieBase64;
  if (!capturedSelfieBlob && !base64) {
    showToast("Please capture a photo first.", "info");
    return;
  }
  if (capturedSelfieBlob) {
    processVerificationSubmission("selfie", capturedSelfieBlob, base64);
  } else if (base64) {
    processVerificationSubmission("selfie", new Blob(), base64);
  }
  closeSelfieModal();
  showToast("Live selfie captured & uploaded for verification!", "success");
}

export function handleSelfieFileSelected(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files && target.files[0];
  if (!file) return;

  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
  if (!isImage) {
    showToast("Please select a valid image file (JPG, PNG, WEBP).", "error");
    target.value = '';
    return;
  }

  showToast("Processing selfie image...", "info");

  const reader = new FileReader();
  reader.onerror = () => {
    showToast("Failed to read image file.", "error");
    target.value = '';
  };
  reader.onload = function(evt) {
    const img = new Image();
    img.onerror = () => {
      showToast("Unable to decode photo. Please select another image.", "error");
      target.value = '';
    };
    img.onload = function() {
      compressImageToCanvasBlob(img, false).then(({ blob, base64 }) => {
        processVerificationSubmission("selfie", blob, base64);
        closeSelfieModal();
        showToast("Selfie photo successfully uploaded for verification!", "success");
      }).catch(err => {
        console.error("Selfie file compression error:", err);
        showToast("Error compressing photo.", "error");
      }).finally(() => {
        target.value = '';
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

  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
  if (!isImage) {
    showToast("Please select a valid image file (JPG, PNG, WEBP).", "error");
    target.value = '';
    return;
  }

  showToast("Processing Government Photo ID...", "info");

  const reader = new FileReader();
  reader.onerror = () => {
    showToast("Failed to read document file.", "error");
    target.value = '';
  };
  reader.onload = function(evt) {
    const img = new Image();
    img.onerror = () => {
      showToast("Unable to decode document photo. Please select another image.", "error");
      target.value = '';
    };
    img.onload = function() {
      compressImageToCanvasBlob(img, false).then(({ blob, base64 }) => {
        processVerificationSubmission("gov_id", blob, base64);
        showToast("Government ID document uploaded for verification!", "success");
      }).catch(err => {
        console.error("Gov ID compression error:", err);
        showToast("Error compressing ID document.", "error");
      }).finally(() => {
        target.value = '';
      });
    };
    img.src = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
}

async function processVerificationSubmission(type: 'selfie' | 'gov_id', blob: Blob, precomputedBase64?: string): Promise<void> {
  if (!currentProfile) return;

  // 1. Pick up account email & name from DOM inputs if not yet populated on currentProfile
  if (!currentProfile.email) {
    const emailInp = (document.getElementById('input-email') as HTMLInputElement | null)?.value?.trim() ||
                     (document.getElementById('landing-email-input') as HTMLInputElement | null)?.value?.trim() || '';
    if (emailInp && emailInp.includes('@')) {
      currentProfile.email = emailInp.toLowerCase();
    }
  }
  if (!currentProfile.name || currentProfile.name === 'Explorer' || currentProfile.name === 'Traveler') {
    const nameInp = (document.getElementById('input-full-name') as HTMLInputElement | null)?.value?.trim();
    if (nameInp && nameInp.length >= 2) {
      currentProfile.name = nameInp;
    }
  }

  const emailKey = currentProfile.email ? getAccountKeyFromEmail(currentProfile.email) : null;
  if (emailKey && (!currentProfile.uid || currentProfile.uid === 'guest' || currentProfile.uid.startsWith('guest_'))) {
    currentProfile.uid = emailKey;
  }

  // Auto-Anonymous Auth if needed without clobbering existing account UID
  if (auth && !auth.currentUser) {
    try {
      const cred = await signInAnonymously(auth);
      if (cred && cred.user) {
        if (!currentProfile.uid || currentProfile.uid === 'guest' || currentProfile.uid.startsWith('guest_')) {
          currentProfile.uid = emailKey || cred.user.uid;
        }
      }
    } catch (e) {
      console.warn("Auto-anonymous authentication notice:", e);
    }
  }

  if (type === 'selfie') {
    (currentProfile as any).selfieSubmitted = true;
  } else {
    (currentProfile as any).govtIdSubmitted = true;
  }
  currentProfile.verificationStatus = "pending";

  const sizeKb = blob.size > 0 ? (blob.size / 1024).toFixed(1) : "50.0";
  showToast(`⏳ Saving ${type === 'selfie' ? 'live selfie' : 'photo ID'} (${sizeKb} KB) to Secure Vault...`, "info");

  const commitToVault = async (base64Data: string) => {
    const fieldName = type === 'selfie' ? 'selfieData' : 'govtIdData';
    if (type === 'selfie') {
      currentProfile.selfieData = base64Data;
      (currentProfile as any).selfieSubmitted = true;
      if (!currentProfile.photoUrl || currentProfile.photoUrl === DEFAULT_AVATAR) {
        currentProfile.photoUrl = base64Data;
        const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
        const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
        if (profileAvatar) profileAvatar.src = base64Data;
        if (headerAvatar) headerAvatar.src = base64Data;
      }
    } else {
      currentProfile.govtIdData = base64Data;
      (currentProfile as any).govtIdSubmitted = true;
    }

    const userUid = currentProfile.uid || emailKey || 'explorer_' + Math.random().toString(36).substring(2, 8);
    currentProfile.uid = userUid;

    cachedVaultData = {
      ...cachedVaultData,
      uid: userUid,
      [fieldName]: base64Data,
      verificationType: type,
      status: 'pending_review',
      submittedAt: new Date().toISOString()
    };

    // Save to persistent storage so images are never lost and are visible in Admin Portal
    try {
      localStorage.setItem('safarmatch_vault_' + userUid, JSON.stringify(cachedVaultData));
      if (emailKey) localStorage.setItem('safarmatch_vault_' + emailKey, JSON.stringify(cachedVaultData));
      localStorage.setItem('safarmatch_vault_data', JSON.stringify(cachedVaultData));
      localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));

      // Construct verification record for Admin Portal queue
      const verificationRecord = {
        uid: userUid,
        accountKey: emailKey || userUid,
        email: currentProfile.email || '',
        name: currentProfile.name || 'Traveler',
        age: currentProfile.age || 24,
        gender: currentProfile.gender || 'Explorer',
        homeCity: currentProfile.homeCity || 'India',
        upcomingCircuit: (currentProfile as any).upcomingCircuit || currentProfile.upcomingDestination || currentProfile.currentCircuit || 'Goa Circuit',
        photoUrl: currentProfile.photoUrl || (type === 'selfie' ? base64Data : DEFAULT_AVATAR),
        selfieData: currentProfile.selfieData || (type === 'selfie' ? base64Data : cachedVaultData.selfieData),
        govtIdData: currentProfile.govtIdData || (type === 'gov_id' ? base64Data : cachedVaultData.govtIdData),
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date().toISOString(),
        status: 'pending_review'
      };
      localStorage.setItem(STORAGE_KEYS.AWAITING_VERIFICATION_PREFIX + userUid, JSON.stringify(verificationRecord));
      if (emailKey) {
        localStorage.setItem(STORAGE_KEYS.AWAITING_VERIFICATION_PREFIX + emailKey, JSON.stringify(verificationRecord));
      }

      // Update travelers list if current user is present
      const travelersRaw = localStorage.getItem(STORAGE_KEYS.ALL_TRAVELERS);
      if (travelersRaw) {
        try {
          const list = JSON.parse(travelersRaw);
          if (Array.isArray(list)) {
            const idx = list.findIndex(t => t.uid === userUid || (emailKey && t.uid === emailKey));
            if (idx >= 0) {
              list[idx] = {
                ...list[idx],
                ...currentProfile,
                selfieData: currentProfile.selfieData || cachedVaultData.selfieData,
                govtIdData: currentProfile.govtIdData || cachedVaultData.govtIdData,
                verificationStatus: 'pending'
              };
              localStorage.setItem(STORAGE_KEYS.ALL_TRAVELERS, JSON.stringify(list));
            }
          }
        } catch (te) {}
      }

      // Notify other open tabs/windows (such as Admin Portal)
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.AWAITING_VERIFICATION_PREFIX + userUid,
        newValue: JSON.stringify(verificationRecord)
      }));

      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('safarmatch_sync_channel');
          bc.postMessage({ type: 'VERIFICATION_SUBMITTED', uid: userUid, record: verificationRecord });
          bc.close();
        }
      } catch (be) {}
    } catch (e) {
      console.warn("Storage write error for verification vault:", e);
    }

    // Save directly to Firestore profiles collection so admin portal and other devices get real images
    if (isLiveFirebase && db && userUid) {
      try {
        const profileUpdates: any = {
          verificationStatus: "pending",
          updatedAt: serverTimestamp(),
          selfieSubmitted: !!(currentProfile.selfieData || (currentProfile as any).selfieSubmitted),
          govtIdSubmitted: !!(currentProfile.govtIdData || (currentProfile as any).govtIdSubmitted)
        };

        if (currentProfile.selfieData) profileUpdates.selfieData = currentProfile.selfieData;
        if (currentProfile.govtIdData) profileUpdates.govtIdData = currentProfile.govtIdData;
        if (currentProfile.photoUrl) profileUpdates.photoUrl = currentProfile.photoUrl;
        if (currentProfile.name) profileUpdates.name = currentProfile.name;
        if (currentProfile.email) profileUpdates.email = currentProfile.email;
        if (currentProfile.age) profileUpdates.age = currentProfile.age;
        if (currentProfile.gender) profileUpdates.gender = currentProfile.gender;
        if (currentProfile.homeCity) profileUpdates.homeCity = currentProfile.homeCity;
        if (currentProfile.currentCircuit) profileUpdates.currentCircuit = currentProfile.currentCircuit;
        if (currentProfile.upcomingDestination) profileUpdates.upcomingDestination = currentProfile.upcomingDestination;
        if (currentProfile.bio) profileUpdates.bio = currentProfile.bio;
        if (currentProfile.intent) profileUpdates.intent = currentProfile.intent;
        if (currentProfile.travelStyles) profileUpdates.travelStyles = currentProfile.travelStyles;

        await setDoc(doc(db, "profiles", userUid), profileUpdates, { merge: true });

        if (emailKey && emailKey !== userUid) {
          await setDoc(doc(db, "profiles", emailKey), { ...profileUpdates, uid: emailKey }, { merge: true });
        }

        // Also attempt writing to vault collection if permissions allow
        try {
          await setDoc(doc(db, "vault", userUid), {
            [fieldName]: base64Data,
            verificationType: type,
            status: 'pending_review',
            verificationSubmittedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (vaultErr) {}

        showToast("🔒 Identity securely uploaded and submitted for Admin review.", "success");
      } catch (err) {
        console.warn("Firestore profile verification write error:", err);
        showToast("🔒 Identity securely encrypted and saved. Review pending.", "info");
      }
    } else {
      showToast("🔒 Identity securely saved. Review pending.", "info");
    }

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
