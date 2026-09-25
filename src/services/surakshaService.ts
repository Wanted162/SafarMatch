/**
 * SafarMatch — Suraksha Shield (भारत सुरक्षा शील्ड) Service
 * Women-only companion safety filters, emergency beacon, and SOS modal.
 */

import { doc, setDoc } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS } from '../utils/storage';
import { showToast } from '../utils/toast';
import type { UserProfile } from '../types';

let isSurakshaShieldActive = false;

export function getSurakshaState(): boolean {
  return isSurakshaShieldActive;
}

export function setSurakshaState(val: boolean): void {
  isSurakshaShieldActive = val;
}

export function toggleSurakshaMode(
  enabled: boolean,
  profile: UserProfile | null,
  onStateChanged: () => void
): void {
  isSurakshaShieldActive = !!enabled;
  if (profile) {
    profile.isSurakshaEnabled = !!enabled;
    (profile as any).surakshaShield = !!enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {}
    if (isLiveFirebase && db && profile.uid) {
      try {
        setDoc(doc(db, "profiles", profile.uid), {
          surakshaShield: !!enabled
        }, { merge: true }).catch(err => console.warn("Firestore suraksha update error:", err));
      } catch (e) {}
    }
  }

  // Synchronize toggle inputs
  ['sidebar-suraksha-toggle', 'profile-suraksha-toggle', 'modal-suraksha-toggle'].forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.checked = !!enabled;
  });

  // Map toggle button
  const mapBtn = document.getElementById('map-suraksha-toggle');
  if (mapBtn) {
    mapBtn.className = enabled
      ? "px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs flex items-center space-x-1 cursor-pointer transition flex-shrink-0"
      : "px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center space-x-1 cursor-pointer transition flex-shrink-0";
  }

  // Mobile toggle button
  const mobBtn = document.getElementById('mobile-suraksha-toggle');
  if (mobBtn) {
    mobBtn.className = enabled
      ? "flex-1 flex items-center justify-center space-x-1 text-xs font-bold py-1.5 px-2 rounded-xl bg-rose-600 text-white shadow-xs transition cursor-pointer"
      : "flex-1 flex items-center justify-center space-x-1 text-xs font-semibold py-1.5 px-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 transition cursor-pointer";
  }

  // Map floating banner
  const mapBanner = document.getElementById('map-suraksha-banner');
  if (mapBanner) {
    if (enabled) mapBanner.classList.remove('hidden');
    else mapBanner.classList.add('hidden');
  }

  // Status badges
  const surakshaBadge = document.getElementById('suraksha-status-badge');
  if (surakshaBadge) {
    if (enabled) {
      surakshaBadge.textContent = "Safe Mode Active 🛡️";
      surakshaBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200";
    } else {
      surakshaBadge.textContent = "Standard Mode";
      surakshaBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200";
    }
  }

  onStateChanged();

  showToast(
    enabled
      ? "🛡️ Suraksha Shield Active: Safe Mode enabled! Only verified & female companion profiles are shown."
      : "Suraksha Shield set to standard explorer mode.",
    "info"
  );
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function openSurakshaEmergencyModal(profile: UserProfile | null): void {
  const modal = document.getElementById('suraksha-emergency-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const modalToggle = document.getElementById('modal-suraksha-toggle') as HTMLInputElement | null;
  if (modalToggle && profile) {
    modalToggle.checked = !!(profile as any).surakshaShield;
  }

  const locPreview = document.getElementById('suraksha-location-preview');
  if (locPreview && profile) {
    const circuit = profile.upcomingDestination || profile.currentCircuit || 'Bharat Explorer Circuit';
    const coords = (profile.homeLat && profile.homeLng) ? `(GPS: ${Number(profile.homeLat).toFixed(4)}° N, ${Number(profile.homeLng).toFixed(4)}° E)` : '';
    locPreview.textContent = `Current Circuit: ${circuit} ${coords}`;
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeSurakshaEmergencyModal(): void {
  const modal = document.getElementById('suraksha-emergency-modal');
  if (modal) modal.classList.add('hidden');
}

export function copyMyLocationSummary(profile: UserProfile | null): void {
  const name = profile && profile.name ? profile.name : "Safar Traveler";
  const circuit = profile && (profile.upcomingDestination || profile.currentCircuit) ? (profile.upcomingDestination || profile.currentCircuit) : "Goa";
  const lat = profile && profile.homeLat ? Number(profile.homeLat).toFixed(4) : "15.2993";
  const lng = profile && profile.homeLng ? Number(profile.homeLng).toFixed(4) : "74.1240";
  const summary = `🚨 SafarMatch Suraksha Emergency Beacon: ${name} is traveling in ${circuit} circuit (GPS: ${lat}° N, ${lng}° E). Live coordination beacon shared for verified traveler safety.`;

  navigator.clipboard.writeText(summary).then(() => {
    showToast("📋 Location Beacon copied! Paste to send via WhatsApp or SMS.", "success");
  }).catch(() => {
    showToast(`Beacon: ${summary}`, "info");
  });
}
