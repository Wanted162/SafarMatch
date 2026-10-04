/**
 * SafarMatch — Profile Editor UI Controller
 * Manages profile form synchronization, travel vibe & style pills, and avatar canvas processing.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { getCurrentProfile, updateJourneyStatusUI, DEFAULT_AVATAR } from '../services/profileService';
import { getAllTravelers, setAllTravelers } from '../services/travelerService';
import { STORAGE_KEYS, getAccountKeyFromEmail, saveStoredTravelers } from '../utils/storage';
import { showToast } from '../utils/toast';
import { moderateMessageText } from '../utils/moderation';
import { sanitizePlainText } from '../utils/security';
import { sanitizePublicProfile } from '../utils/vaultCrypto';
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
  const emailInput = document.getElementById('input-email') as HTMLInputElement | null;

  if (nameInput) nameInput.value = profile.name || '';
  if (ageInput) ageInput.value = profile.age ? String(profile.age) : '';
  if (genderInput) genderInput.value = profile.gender || '';
  if (homeCityInput) homeCityInput.value = profile.homeCity || '';
  if (circuitInput) circuitInput.value = profile.currentCircuit || '';
  if (bioInput) bioInput.value = profile.bio || '';
  if (intentInput) intentInput.value = profile.intent || '';
  if (emailInput && profile.email) emailInput.value = profile.email;

  const latInp = document.getElementById('input-home-lat') as HTMLInputElement | null;
  const lngInp = document.getElementById('input-home-lng') as HTMLInputElement | null;
  if (latInp && profile.homeLat) latInp.value = String(profile.homeLat);
  if (lngInp && profile.homeLng) lngInp.value = String(profile.homeLng);

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

  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
  if (!isImage) {
    showToast("Please select a valid image file (JPG, PNG, WEBP).", "error");
    target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => {
    showToast("Error reading selected photo file.", "error");
    target.value = '';
  };
  reader.onload = function(evt) {
    const img = new Image();
    img.onerror = () => {
      showToast("Invalid photo format. Please select a valid JPG or PNG image.", "error");
      target.value = '';
    };
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width <= 0 || height <= 0) {
        showToast("Invalid image dimensions.", "error");
        target.value = '';
        return;
      }

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

      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        showToast("Unable to process photo canvas context.", "error");
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.8);

      const currentProfile = getCurrentProfile();
      if (currentProfile) {
        currentProfile.photoUrl = base64Data;
        try {
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
          localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
        } catch (err) {}

        const profileAvatar = document.getElementById('profile-display-avatar') as HTMLImageElement | null;
        const headerAvatar = document.getElementById('header-user-avatar') as HTMLImageElement | null;
        const menuAvatar = document.getElementById('menu-user-avatar') as HTMLImageElement | null;
        if (profileAvatar) profileAvatar.src = base64Data;
        if (headerAvatar) headerAvatar.src = base64Data;
        if (menuAvatar) menuAvatar.src = base64Data;

        // Update in travelers list
        const allList = [...getAllTravelers()];
        const existingIdx = allList.findIndex(t => t.uid === currentProfile.uid);
        if (existingIdx >= 0) {
          allList[existingIdx].photo = base64Data;
          setAllTravelers(allList);
          saveStoredTravelers(allList);
        }

        if (isLiveFirebase && db) {
          if (currentProfile.uid) {
            setDoc(doc(db, "profiles", currentProfile.uid), {
              photoUrl: base64Data,
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(err => console.warn("Firestore avatar update error:", err));
          }
          if (currentProfile.email) {
            const accKey = getAccountKeyFromEmail(currentProfile.email);
            if (accKey !== currentProfile.uid) {
              setDoc(doc(db, "profiles", accKey), {
                photoUrl: base64Data,
                updatedAt: serverTimestamp()
              }, { merge: true }).catch(() => {});
            }
          }
        }

        window.dispatchEvent(new StorageEvent('storage', {
          key: STORAGE_KEYS.USER_PROFILE,
          newValue: JSON.stringify(currentProfile)
        }));

        try {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('safarmatch_sync_channel');
            bc.postMessage({ type: 'AVATAR_UPDATED', uid: currentProfile.uid });
            bc.close();
          }
        } catch (be) {}

        updateJourneyStatusUI();
        showToast("📸 Profile photo updated successfully!", "success");
      }
    };
    img.src = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
  target.value = '';
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

  const rawName = (document.getElementById('input-full-name') as HTMLInputElement)?.value || '';
  const rawAge = parseInt((document.getElementById('input-age') as HTMLInputElement)?.value, 10);
  const rawGender = (document.getElementById('input-gender') as HTMLSelectElement)?.value as any || 'Male';
  const rawHomeCity = (document.getElementById('input-home-city') as HTMLInputElement)?.value || '';
  const rawUpcomingCircuit = (document.getElementById('input-upcoming-circuit') as HTMLSelectElement)?.value || 'Goa';
  const rawBio = (document.getElementById('input-bio') as HTMLTextAreaElement)?.value || '';
  const rawTravelIntent = (document.getElementById('input-travel-intent') as HTMLInputElement)?.value as any || 'companion';

  const name = sanitizePlainText(rawName, 60);
  const homeCity = sanitizePlainText(rawHomeCity, 60);
  const bio = sanitizePlainText(rawBio, 500);
  const upcomingCircuit = sanitizePlainText(rawUpcomingCircuit, 50);
  const travelIntent = sanitizePlainText(rawTravelIntent, 30);
  const gender = (rawGender === 'Female' || rawGender === 'Non-binary') ? rawGender : 'Male';

  if (!name || name.length < 2) {
    showToast("Please enter your full name (minimum 2 letters).", "error");
    return;
  }
  if (isNaN(rawAge) || rawAge < 18 || rawAge > 99) {
    showToast("Please enter a valid age between 18 and 99.", "error");
    return;
  }
  if (!homeCity || homeCity.length < 2) {
    showToast("Please enter your home city.", "error");
    return;
  }

  // Anti-scam moderation on bio and name
  const modCheck = moderateMessageText(`${name} ${bio}`);
  if (!modCheck.allowed) {
    showToast("⚠️ Moderation Alert: Contact numbers, off-platform links, or abusive words are not allowed in profile fields.", "error");
    return;
  }

  currentProfile.name = name;
  currentProfile.age = rawAge;
  currentProfile.gender = gender;
  currentProfile.homeCity = homeCity;
  currentProfile.currentCircuit = upcomingCircuit;
  currentProfile.upcomingDestination = upcomingCircuit;
  currentProfile.bio = bio;
  currentProfile.intent = travelIntent as any;

  const emailInput = document.getElementById('input-email') as HTMLInputElement | null;
  if (emailInput && emailInput.value.trim()) {
    currentProfile.email = emailInput.value.trim().toLowerCase();
  }

  let accKey: string | null = null;
  if (currentProfile.email) {
    accKey = getAccountKeyFromEmail(currentProfile.email);
    if (!currentProfile.uid || currentProfile.uid === 'guest' || currentProfile.uid.startsWith('guest_')) {
      currentProfile.uid = accKey;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify({
        uid: currentProfile.uid,
        email: currentProfile.email,
        displayName: currentProfile.name,
        photoURL: currentProfile.photoUrl
      }));
    } catch (e) {}
  }

  const rawLat = parseFloat((document.getElementById('input-home-lat') as HTMLInputElement)?.value);
  const rawLng = parseFloat((document.getElementById('input-home-lng') as HTMLInputElement)?.value);

  if (!isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0) {
    currentProfile.homeLat = rawLat;
    currentProfile.homeLng = rawLng;
  } else if (INDIAN_CIRCUITS_LOOKUP[homeCity]) {
    currentProfile.homeLat = INDIAN_CIRCUITS_LOOKUP[homeCity].lat;
    currentProfile.homeLng = INDIAN_CIRCUITS_LOOKUP[homeCity].lng;
  } else if (INDIAN_CIRCUITS_LOOKUP[upcomingCircuit]) {
    currentProfile.homeLat = INDIAN_CIRCUITS_LOOKUP[upcomingCircuit].lat;
    currentProfile.homeLng = INDIAN_CIRCUITS_LOOKUP[upcomingCircuit].lng;
  } else {
    currentProfile.homeLat = 18.5204;
    currentProfile.homeLng = 73.8567;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
    localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
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

  if (isLiveFirebase && db) {
    try {
      const fullProfilePayload = {
        uid: currentProfile.uid,
        name: currentProfile.name || '',
        email: currentProfile.email || '',
        age: currentProfile.age || 24,
        gender: currentProfile.gender || 'Male',
        homeCity: currentProfile.homeCity || '',
        homeLat: currentProfile.homeLat || 20.5937,
        homeLng: currentProfile.homeLng || 78.9629,
        currentCircuit: currentProfile.currentCircuit || currentProfile.upcomingDestination || '',
        upcomingDestination: currentProfile.upcomingDestination || currentProfile.currentCircuit || '',
        upcomingLat: currentProfile.upcomingLat || 20.5937,
        upcomingLng: currentProfile.upcomingLng || 78.9629,
        bio: currentProfile.bio || '',
        intent: currentProfile.intent || 'companion',
        vibe: currentProfile.vibe || '',
        travelStyles: currentProfile.travelStyles || [],
        photoUrl: currentProfile.photoUrl || DEFAULT_AVATAR,
        selfieData: currentProfile.selfieData || '',
        govtIdData: currentProfile.govtIdData || '',
        verificationStatus: currentProfile.verificationStatus || 'unverified',
        verificationRejectionReason: currentProfile.verificationRejectionReason || null,
        subscriptionStatus: currentProfile.subscriptionStatus || 'free',
        isSurakshaEnabled: currentProfile.isSurakshaEnabled || false,
        selfieSubmitted: !!(currentProfile.selfieData || (currentProfile as any).selfieSubmitted),
        govtIdSubmitted: !!(currentProfile.govtIdData || (currentProfile as any).govtIdSubmitted),
        updatedAt: serverTimestamp()
      };

      if (currentProfile.uid) {
        await setDoc(doc(db, "profiles", currentProfile.uid), fullProfilePayload, { merge: true });
      }

      if (accKey && accKey !== currentProfile.uid) {
        await setDoc(doc(db, "profiles", accKey), { ...fullProfilePayload, uid: accKey }, { merge: true });
      }
    } catch (err) {
      console.warn("Firestore profile save error:", err);
    }
  }

  try {
    localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentProfile));
  } catch (e) {}

  updateJourneyStatusUI();
  renderTravelerPins();
  showToast("✅ Profile saved! Your backpacker passport is synchronized.", "success");
}
