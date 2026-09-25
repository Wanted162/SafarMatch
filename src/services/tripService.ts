/**
 * SafarMatch — Trip Board & Itinerary Service
 * Handles live Indian trips, circuit feeds, creation gating, and companion join requests.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { SEED_INDIAN_TRIPS } from '../data/seedTrips';
import { getStoredTrips, saveStoredTrips } from '../utils/storage';
import { showToast } from '../utils/toast';
import { isStep1Complete, hasActiveExplorerPass, consumeMonthlyConnect, checkConnectQuotaOrPaywall } from './paymentService';
import { DEFAULT_AVATAR } from './profileService';
import type { Trip, UserProfile, Traveler } from '../types';

let allTripsCache: any[] = [];
let currentTripCircuitFilter = "all";

export function getAllTrips(): any[] {
  return allTripsCache;
}

export function setAllTrips(trips: any[]): void {
  allTripsCache = trips;
}

export function initTripsCache(): any[] {
  const stored = getStoredTrips();
  if (stored && stored.length > 0) {
    allTripsCache = stored;
  } else {
    allTripsCache = [...SEED_INDIAN_TRIPS];
  }
  return allTripsCache;
}

export function handlePostTripClick(profile: UserProfile | null, onOpenProfile: () => void, onOpenPaywall: () => void): void {
  if (!isStep1Complete(profile)) {
    showToast("⚠️ Step 1 Required: Complete your 2-minute travel profile first.", "error");
    onOpenProfile();
    return;
  }
  if (!hasActiveExplorerPass(profile)) {
    showToast("🔒 Explorer Pass Required: Activate the ₹299 pass to publish live itineraries.", "error");
    onOpenPaywall();
    return;
  }
  const modal = document.getElementById('create-trip-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeCreateTripModal(): void {
  const modal = document.getElementById('create-trip-modal');
  if (modal) modal.classList.add('hidden');
}

export async function handleCreateTripSubmit(
  e: Event,
  profile: UserProfile | null,
  onTripCreated: () => void
): Promise<void> {
  e.preventDefault();
  const title = (document.getElementById('trip-input-title') as HTMLInputElement)?.value.trim();
  const destination = (document.getElementById('trip-input-destination') as HTMLInputElement)?.value.trim();
  const circuit = (document.getElementById('trip-input-circuit') as HTMLSelectElement)?.value;
  const startDate = (document.getElementById('trip-input-start-date') as HTMLInputElement)?.value;
  const duration = (document.getElementById('trip-input-duration') as HTMLInputElement)?.value.trim();
  const budget = (document.getElementById('trip-input-budget') as HTMLInputElement)?.value;
  const style = (document.getElementById('trip-input-style') as HTMLSelectElement)?.value;
  const itinerary = (document.getElementById('trip-input-itinerary') as HTMLTextAreaElement)?.value.trim();

  const newTrip = {
    id: "trip_" + Date.now(),
    title,
    destination,
    circuit,
    startDate,
    duration,
    budget,
    style,
    itinerary,
    creatorUid: profile ? profile.uid : "guest_user",
    creatorName: profile ? profile.name : "Active Traveler",
    creatorPhoto: profile && profile.photoUrl && profile.photoUrl !== DEFAULT_AVATAR ? profile.photoUrl : DEFAULT_AVATAR,
    creatorGender: profile ? profile.gender : "Male",
    creatorVerification: profile ? profile.verificationStatus : "pending_review",
    createdAt: new Date().toISOString()
  };

  if (isLiveFirebase && db) {
    try {
      await addDoc(collection(db, "trips"), {
        ...newTrip,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore trip write error, saved locally:", err);
    }
  }

  allTripsCache.unshift(newTrip);
  saveStoredTrips(allTripsCache);
  closeCreateTripModal();
  showToast("🎉 Trip plan published! Travelers in this circuit can now request to join.", "success");
  onTripCreated();
}

export function handleJoinTripClick(
  tripId: string,
  profile: UserProfile | null,
  onOpenProfile: () => void,
  onOpenChat: (traveler: Partial<Traveler>) => void
): void {
  if (!isStep1Complete(profile)) {
    showToast("⚠️ Step 1 Required: Complete your travel profile to connect with trip hosts.", "error");
    onOpenProfile();
    return;
  }
  if (!hasActiveExplorerPass(profile)) {
    if (!checkConnectQuotaOrPaywall(profile, onOpenProfile)) return;
    consumeMonthlyConnect(profile);
  }
  const trip = (allTripsCache || []).find(t => t.id === tripId);
  if (trip) {
    showToast(`🤝 Connecting with ${trip.creatorName}! Opening conversation...`, "success");
    onOpenChat({
      uid: trip.creatorUid || "trv_host_" + trip.id,
      name: trip.creatorName,
      photo: trip.creatorPhoto || DEFAULT_AVATAR,
      currentCircuit: trip.circuit,
      verificationStatus: trip.creatorVerification || "verified"
    });
  }
}
