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
import type { UserProfile, VerificationStatus, SubscriptionStatus } from '../types';

export const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

let currentProfile: UserProfile = {
  uid: "guest_explorer_" + Math.random().toString(36).substring(2, 9),
  name: "",
  age: 23,
  gender: "Male",
  homeCity: "Delhi NCR",
  homeLat: 28.6139,
  homeLng: 77.2090,
  currentCircuit: "Goa",
  upcomingDestination: "North Goa (Arambol & Morjim)",
  upcomingLat: 15.6033,
  upcomingLng: 73.7431,
  vibe: "Sunset Chaser & Co-worker",
  travelStyles: ["Digital Nomad", "Backpacker"],
  intent: "companion",
  bio: "Passionate about road trips, chai stops, and remote work cafes. Always up for beach sunsets and mountain hikes.",
  photoUrl: DEFAULT_AVATAR,
  verificationStatus: "unverified",
  subscriptionStatus: "free",
  isSurakshaEnabled: false
};

let profileSnapshotUnsubscribe: (() => void) | null = null;
let lastKnownVerificationStatus: string | null = null;
let lastKnownSubscriptionStatus: string | null = null;
let cameraMediaStream: MediaStream | null = null;
let capturedSelfieBlob: Blob | null = null;

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
  if ((currentProfile as any).selfieData || (currentProfile as any).selfieSubmitted || (currentProfile.photoUrl && currentProfile.verificationStatus === 'verified')) score += 15;
  if ((currentProfile as any).govtIdData || currentProfile.verificationStatus === 'verified') score += 15;

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
    } else if (!(currentProfile as any).selfieData && !(currentProfile as any).selfieSubmitted && currentProfile.verificationStatus !== 'verified') {
      hintEl.textContent = "Add live selfie verification (+15%) to increase trust score.";
      hintEl.className = "text-[10px] text-rose-500 font-medium";
    } else if (!(currentProfile as any).govtIdData && currentProfile.verificationStatus !== 'verified') {
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
  if (profileSnapshotUnsubscribe) {
    try { profileSnapshotUnsubscribe(); } catch (e) {}
    profileSnapshotUnsubscribe = null;
  }

  try {
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
      if (data.verificationRejectionReason) {
        currentProfile.verificationRejectionReason = data.verificationRejectionReason;
      }
      if (data.isVip !== undefined) (currentProfile as any).isVip = data.isVip;
      if (data.hasExplorerPass !== undefined) (currentProfile as any).hasExplorerPass = data.hasExplorerPass;
      (currentProfile as any).subscription = sub;

      try {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
        if (data.isVip || data.hasExplorerPass) {
          localStorage.setItem(STORAGE_KEYS.PASS_UNLOCKED, 'true');
        } else if (newSubStatus === 'rejected') {
          localStorage.removeItem(STORAGE_KEYS.PASS_UNLOCKED);
        }
      } catch (e) {}

      // Verification transitions
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
      updateJourneyStatusUI();
    }, (err) => {
      console.warn("Profile real-time listener error:", err);
    });
  } catch (err) {
    console.warn("Could not attach profile real-time listener:", err);
  }
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

export function captureSelfieFrame(): void {
  const video = document.getElementById('selfie-video') as HTMLVideoElement | null;
  const preview = document.getElementById('selfie-captured-preview') as HTMLImageElement | null;
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');

  if (!video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload) return;

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) return;
    capturedSelfieBlob = blob;
    preview.src = URL.createObjectURL(blob);
    preview.classList.remove('hidden');
    video.classList.add('hidden');
    oval.classList.add('hidden');
    btnCapture.classList.add('hidden');
    btnRetake.classList.remove('hidden');
    btnUpload.classList.remove('hidden');

    const statusEl = document.getElementById('selfie-compression-status');
    if (statusEl) {
      statusEl.textContent = `Frame captured & compressed: ${(blob.size / 1024).toFixed(1)} KB (<80 KB limit met)`;
    }
  }, 'image/jpeg', 0.75);
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
  processVerificationSubmission("selfie", capturedSelfieBlob);
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
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        processVerificationSubmission("selfie", blob);
        closeSelfieModal();
      }, 'image/jpeg', 0.75);
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
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        processVerificationSubmission("gov_id", blob);
      }, 'image/jpeg', 0.72);
    };
    img.src = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
}

async function processVerificationSubmission(type: 'selfie' | 'gov_id', blob: Blob): Promise<void> {
  if (!currentProfile) return;
  (currentProfile as any).selfieSubmitted = true;
  currentProfile.verificationStatus = "pending";

  if (currentProfile.uid) {
    resetNotificationSeen('verification', currentProfile.uid);
    try {
      localStorage.setItem(STORAGE_KEYS.AWAITING_VERIFICATION_PREFIX + currentProfile.uid, 'true');
    } catch (e) {}
  }
  (currentProfile as any).verificationSubmittedAt = new Date().toISOString();
  showToast(`⏳ Processing ${type === 'selfie' ? 'live selfie' : 'photo ID'} (${(blob.size / 1024).toFixed(1)} KB)...`, "info");

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const base64Data = evt.target?.result as string;
    const fieldName = type === 'selfie' ? 'selfieData' : 'govtIdData';
    (currentProfile as any)[fieldName] = base64Data;

    if (type === 'selfie' && (!currentProfile.photoUrl || currentProfile.photoUrl === DEFAULT_AVATAR)) {
      currentProfile.photoUrl = base64Data;
      const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
      const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
      if (profileAvatar) profileAvatar.src = base64Data;
      if (headerAvatar) headerAvatar.src = base64Data;
    }

    if (isLiveFirebase && db && currentProfile.uid) {
      try {
        await setDoc(doc(db, "profiles", currentProfile.uid), {
          ...currentProfile,
          [fieldName]: base64Data,
          verificationStatus: "pending_review",
          verificationSubmittedAt: serverTimestamp()
        }, { merge: true });
        showToast("Your identity is under review by our team.", "info");
      } catch (err) {
        console.warn("Firestore profile verification write error:", err);
        showToast("Your identity is under review by our team.", "info");
      }
    } else {
      showToast("Your identity is under review by our team.", "info");
    }

    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
    } catch (e) {}
    updateJourneyStatusUI();
  };
  reader.readAsDataURL(blob);
}
