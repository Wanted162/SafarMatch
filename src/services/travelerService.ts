/**
 * SafarMatch — Traveler Data & Inspection Service
 * Manages explorer directory, live caching, blocklist & safety reports.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { SEED_INDIAN_TRAVELERS } from '../data/seedTravelers';
import { getStoredTravelers, saveStoredTravelers, getBlockedUsers, addBlockedUser } from '../utils/storage';
import { showToast } from '../utils/toast';
import { DEFAULT_AVATAR } from './profileService';
import type { Traveler, UserProfile } from '../types';

let allTravelersCache: Traveler[] = [];
let inspectedTraveler: Traveler | null = null;
let currentReportTarget: Traveler | null = null;

export function getAllTravelers(): Traveler[] {
  return allTravelersCache;
}

export function setAllTravelers(travelers: Traveler[]): void {
  allTravelersCache = travelers;
}

export function getInspectedTraveler(): Traveler | null {
  return inspectedTraveler;
}

export function setInspectedTraveler(traveler: Traveler | null): void {
  inspectedTraveler = traveler;
}

export function initTravelersCache(currentProfile?: UserProfile | null): Traveler[] {
  const stored = getStoredTravelers();
  const blocked = getBlockedUsers();

  let combined: Traveler[] = [];
  if (stored && stored.length > 0) {
    combined = stored.filter(t => !blocked.includes(t.uid));
  } else {
    combined = (SEED_INDIAN_TRAVELERS as unknown as Traveler[]).filter(t => !blocked.includes(t.uid));
  }

  if (currentProfile && currentProfile.name && currentProfile.name.trim().length >= 2) {
    const existingIdx = combined.findIndex(t => t.uid === currentProfile.uid);
    const userAsTraveler: Traveler = {
      uid: currentProfile.uid,
      name: currentProfile.name,
      age: currentProfile.age,
      gender: currentProfile.gender,
      city: currentProfile.homeCity,
      lat: currentProfile.homeLat,
      lng: currentProfile.homeLng,
      currentCircuit: currentProfile.currentCircuit,
      vibe: currentProfile.vibe,
      travelStyle: currentProfile.travelStyles,
      intent: currentProfile.intent,
      photo: currentProfile.photoUrl,
      verified: currentProfile.verificationStatus === 'verified',
      verificationStatus: currentProfile.verificationStatus,
      bio: currentProfile.bio,
      upcomingDestination: currentProfile.upcomingDestination,
      isCurrentUser: true
    };
    if (existingIdx >= 0) {
      combined[existingIdx] = userAsTraveler;
    } else {
      combined.unshift(userAsTraveler);
    }
  }

  allTravelersCache = combined;
  return allTravelersCache;
}

export function findTravelerByUid(uid: string): Traveler | undefined {
  return allTravelersCache.find(t => t.uid === uid);
}

export function inspectTravelerFromMap(uid: string): void {
  const traveler = allTravelersCache.find(t => t.uid === uid);
  if (!traveler) return;
  inspectedTraveler = traveler;

  const modal = document.getElementById('traveler-detail-modal');
  const avatar = document.getElementById('modal-traveler-avatar') as HTMLImageElement | null;
  const nameEl = document.getElementById('modal-traveler-name');
  const badgeEl = document.getElementById('modal-traveler-badge');
  const cityEl = document.getElementById('modal-traveler-city');
  const bioEl = document.getElementById('modal-traveler-bio');
  const stylesContainer = document.getElementById('modal-traveler-styles');

  if (avatar) avatar.src = (traveler as any).photoUrl || traveler.photo || DEFAULT_AVATAR;
  if (nameEl) nameEl.textContent = `${traveler.name || 'Traveler'}, ${traveler.age || '24'}`;

  if (badgeEl) {
    if (traveler.verificationStatus === 'verified') {
      badgeEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0";
      badgeEl.textContent = "Verified Explorer ✓";
    } else {
      badgeEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0";
      badgeEl.textContent = "⚪ Unverified";
    }
  }

  if (cityEl) cityEl.textContent = `${(traveler as any).upcomingCircuit || traveler.currentCircuit || 'All India'} • ${(traveler as any).homeCity || traveler.city || 'India'}`;
  if (bioEl) bioEl.textContent = traveler.bio || "Fellow explorer on the Bharat backpacking circuit!";

  if (stylesContainer) {
    stylesContainer.innerHTML = '';
    const styles = Array.isArray((traveler as any).travelStyles || traveler.travelStyle) && ((traveler as any).travelStyles || traveler.travelStyle).length > 0
      ? ((traveler as any).travelStyles || traveler.travelStyle)
      : ['Backpacker', 'Hostels'];
    styles.forEach((s: string) => {
      const span = document.createElement('span');
      span.className = "px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100";
      span.textContent = s;
      stylesContainer.appendChild(span);
    });
  }

  if (modal) modal.classList.remove('hidden');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeTravelerDetailModal(): void {
  const modal = document.getElementById('traveler-detail-modal');
  if (modal) modal.classList.add('hidden');
}

export function reportInspectedTraveler(): void {
  closeTravelerDetailModal();
  if (!inspectedTraveler) return;
  currentReportTarget = inspectedTraveler;
  const nameSpan = document.getElementById('report-user-name');
  if (nameSpan) nameSpan.textContent = inspectedTraveler.name || 'Traveler';
  const modal = document.getElementById('report-block-modal');
  if (modal) modal.classList.remove('hidden');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function openReportModalFromChat(partner: Traveler | null): void {
  if (!partner) return;
  currentReportTarget = partner;
  const nameSpan = document.getElementById('report-user-name');
  if (nameSpan) nameSpan.textContent = partner.name || 'Traveler';
  const modal = document.getElementById('report-block-modal');
  if (modal) modal.classList.remove('hidden');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeReportBlockModal(): void {
  const modal = document.getElementById('report-block-modal');
  if (modal) modal.classList.add('hidden');
  currentReportTarget = null;
}

export async function submitReportAndBlock(
  currentProfile: UserProfile | null,
  blockUser = true,
  onUserBlocked?: (targetUid: string) => void
): Promise<void> {
  if (!currentReportTarget) {
    closeReportBlockModal();
    return;
  }
  const targetUid = currentReportTarget.uid;
  const targetName = currentReportTarget.name || 'Traveler';
  const reasonSelect = document.getElementById('report-reason-select') as HTMLSelectElement | null;
  const detailsInput = document.getElementById('report-details-text') as HTMLTextAreaElement | null;
  const reason = reasonSelect ? reasonSelect.value : 'unspecified';
  const details = detailsInput ? detailsInput.value.trim() : '';

  if (isLiveFirebase && db) {
    try {
      await addDoc(collection(db, "reports"), {
        reporterUid: currentProfile ? currentProfile.uid : 'anonymous',
        reporterName: currentProfile ? currentProfile.name : 'Anonymous',
        reportedUid: targetUid,
        reportedName: targetName,
        reason: reason,
        details: details,
        blockApplied: !!blockUser,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore report submission error:", e);
    }
  }

  if (blockUser && targetUid) {
    addBlockedUser(targetUid);
    allTravelersCache = allTravelersCache.filter(t => t.uid !== targetUid);
    saveStoredTravelers(allTravelersCache);
    showToast(`🚫 ${targetName} blocked & reported. They will no longer appear on your map or chats.`, "success");
    if (onUserBlocked) onUserBlocked(targetUid);
  } else {
    showToast(`🛡️ Safety report submitted for ${targetName}. Our trust & safety team will review it.`, "info");
  }

  if (detailsInput) detailsInput.value = '';
  closeReportBlockModal();
}
