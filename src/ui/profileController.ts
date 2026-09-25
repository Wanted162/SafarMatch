/**
 * SafarMatch — Profile Editor UI Controller
 * Manages profile form synchronization, travel vibe & style pills, and avatar canvas processing.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { getCurrentProfile, updateJourneyStatusUI, DEFAULT_AVATAR } from '../services/profileService';
import { getAllTravelers, setAllTravelers } from '../services/travelerService';
import { STORAGE_KEYS, saveStoredTravelers } from '../utils/storage';
import { showToast } from '../utils/toast';
import { renderTravelerPins } from './mapController';
import { INDIAN_CIRCUITS_LOOKUP } from '../config/constants';
import type { Traveler } from '../types';

export function populateProfileForm(): void {
  const profile = getCurrentProfile();
  if (!profile) return;

  const nameInput = document.getElementById('input-full-name') as HTMLInputElement | null;
  const ageInput = document.getElementById('input-age') as HTMLInputElement | null;
  const genderInput = document.getElementById('input-gender') as HTMLSelectElement | null;
  const homeCityInput = document.getElementById('input-home-city') as HTMLInputElement | null;
  const circuitInput = document.getElementById('input-upcoming-circuit') as HTMLSelectElement | null;
  const bioInput = document.getElementById('input-bio') as HTMLTextAreaElement | null;
  const intentInput = document.getElementById('input-travel-intent') as HTMLInputElement | null;

  if (nameInput && profile.name) nameInput.value = profile.name;
  if (ageInput && profile.age) ageInput.value = String(profile.age);
  if (genderInput && profile.gender) genderInput.value = profile.gender;
  if (homeCityInput && profile.homeCity) homeCityInput.value = profile.homeCity;
  if (circuitInput && profile.currentCircuit) circuitInput.value = profile.currentCircuit;
  if (bioInput && profile.bio) bioInput.value = profile.bio;
  if (intentInput && profile.intent) intentInput.value = profile.intent;

  // Sync Intent Pills
  document.querySelectorAll('.intent-pill').forEach(pill => {
    const intent = pill.getAttribute('data-intent');
    if (intent === profile.intent) {
      pill.className = "intent-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-safar-700 border border-rose-200 transition cursor-pointer";
    } else {
      pill.className = "intent-pill px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer";
    }
  });

  // Sync Style Pills
  const activeStyles = Array.isArray(profile.travelStyles) ? profile.travelStyles : [];
  document.querySelectorAll('.style-pill').forEach(pill => {
    const style = pill.getAttribute('data-style');
    if (style && activeStyles.includes(style)) {
      pill.className = "style-pill px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-safar-700 border border-rose-200 transition cursor-pointer";
    } else {
      pill.className = "style-pill px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer";
    }
  });

  updateJourneyStatusUI();
}

export function triggerAvatarUpload(): void {
  const input = document.getElementById('profile-avatar-file-input') as HTMLInputElement | null;
  if (input) input.click();
}

export function handleAvatarFileSelected(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files && target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.8);

      const currentProfile = getCurrentProfile();
      if (currentProfile) {
        currentProfile.photoUrl = base64Data;
        try {
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
        } catch (err) {}

        const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
        const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
        if (profileAvatar) profileAvatar.src = base64Data;
        if (headerAvatar) headerAvatar.src = base64Data;

        if (isLiveFirebase && db && currentProfile.uid) {
          setDoc(doc(db, "profiles", currentProfile.uid), {
            photoUrl: base64Data
          }, { merge: true }).catch(err => console.warn("Firestore avatar update error:", err));
        }

        updateJourneyStatusUI();
        showToast("📸 Profile photo updated successfully!", "success");
      }
    };
    img.src = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export function selectTravelIntent(btn: HTMLElement): void {
  if (!btn) return;
  const intent = btn.getAttribute('data-intent') as any;
  if (!intent) return;

  const input = document.getElementById('input-travel-intent') as HTMLInputElement | null;
  if (input) input.value = intent;

  const currentProfile = getCurrentProfile();
  if (currentProfile) currentProfile.intent = intent;

  document.querySelectorAll('.intent-pill').forEach(el => {
    el.className = "intent-pill px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer";
  });
  btn.className = "intent-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-safar-700 border border-rose-200 transition cursor-pointer";

  updateJourneyStatusUI();
}

export function toggleStyleTag(btn: HTMLElement): void {
  if (!btn) return;
  const style = btn.getAttribute('data-style');
  const currentProfile = getCurrentProfile();
  if (!style || !currentProfile) return;

  if (!Array.isArray(currentProfile.travelStyles)) {
    currentProfile.travelStyles = [];
  }

  const idx = currentProfile.travelStyles.indexOf(style);
  if (idx > -1) {
    currentProfile.travelStyles.splice(idx, 1);
    btn.className = "style-pill px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer";
  } else {
    currentProfile.travelStyles.push(style);
    btn.className = "style-pill px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-safar-700 border border-rose-200 transition cursor-pointer";
  }

  updateJourneyStatusUI();
}

export async function handleSaveProfile(e?: Event): Promise<void> {
  if (e && e.preventDefault) e.preventDefault();
  const currentProfile = getCurrentProfile();
  if (!currentProfile) return;

  const name = (document.getElementById('input-full-name') as HTMLInputElement)?.value.trim() || '';
  const age = parseInt((document.getElementById('input-age') as HTMLInputElement)?.value) || 23;
  const gender = (document.getElementById('input-gender') as HTMLSelectElement)?.value as any || 'Male';
  const homeCity = (document.getElementById('input-home-city') as HTMLInputElement)?.value.trim() || '';
  const upcomingCircuit = (document.getElementById('input-upcoming-circuit') as HTMLSelectElement)?.value || 'Goa';
  const bio = (document.getElementById('input-bio') as HTMLTextAreaElement)?.value.trim() || '';
  const travelIntent = (document.getElementById('input-travel-intent') as HTMLInputElement)?.value as any || 'companion';

  if (!name || name.length < 2) {
    showToast("Please enter your full name (minimum 2 letters).", "error");
    return;
  }
  if (!age || age < 18) {
    showToast("Please enter a valid age (18 or older).", "error");
    return;
  }
  if (!homeCity || homeCity.length < 2) {
    showToast("Please enter your home city.", "error");
    return;
  }

  currentProfile.name = name;
  currentProfile.age = age;
  currentProfile.gender = gender;
  currentProfile.homeCity = homeCity;
  currentProfile.currentCircuit = upcomingCircuit;
  currentProfile.upcomingDestination = upcomingCircuit;
  currentProfile.bio = bio;
  currentProfile.intent = travelIntent;

  if (INDIAN_CIRCUITS_LOOKUP[upcomingCircuit]) {
    currentProfile.homeLat = INDIAN_CIRCUITS_LOOKUP[upcomingCircuit].lat;
    currentProfile.homeLng = INDIAN_CIRCUITS_LOOKUP[upcomingCircuit].lng;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
  } catch (err) {}

  const allList = [...getAllTravelers()];
  const existingIdx = allList.findIndex(t => t.uid === currentProfile.uid);
  const selfTraveler: Traveler = {
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
    allList[existingIdx] = selfTraveler;
  } else {
    allList.unshift(selfTraveler);
  }
  setAllTravelers(allList);
  saveStoredTravelers(allList);

  if (isLiveFirebase && db && currentProfile.uid) {
    try {
      await setDoc(doc(db, "profiles", currentProfile.uid), {
        ...currentProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore profile save error:", err);
    }
  }

  updateJourneyStatusUI();
  renderTravelerPins();
  showToast("✅ Profile saved! Your backpacker passport is updated.", "success");
}
