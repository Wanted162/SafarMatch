/**
 * SafarMatch — Local Storage Persistence Utilities
 */

import type { UserProfile, Traveler, Trip } from '../types';

export const STORAGE_KEYS = {
  USER_PROFILE: 'safarmatch_user_profile',
  LOGGED_IN_USER: 'safarmatch_logged_in_user',
  MONTHLY_CONNECTS: 'safarmatch_monthly_connects',
  PASS_UNLOCKED: 'safarmatch_pass_unlocked',
  ACTIVE_CHAT_PARTNERS: 'safarmatch_active_chat_partners',
  ACTIVE_THEME: 'safarmatch_active_theme',
  BLOCKED_USERS: 'safarmatch_blocked_users',
  ALL_TRAVELERS: 'safarmatch_all_travelers',
  ALL_TRIPS: 'safarmatch_all_trips',
  AWAITING_VERIFICATION_PREFIX: 'safarmatch_awaiting_verification_',
  AWAITING_PAYMENT_PREFIX: 'safarmatch_awaiting_payment_',
  CHAT_MESSAGES_PREFIX: 'safarmatch_chat_',
  CHATMETA_PREFIX: 'safarmatch_chatmeta_'
};

export function getStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Error reading stored profile:", e);
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error("Error saving profile to localStorage:", e);
  }
}

export function getStoredTravelers(): Traveler[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_TRAVELERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredTravelers(travelers: Traveler[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALL_TRAVELERS, JSON.stringify(travelers));
  } catch (e) {
    console.error("Error saving travelers to localStorage:", e);
  }
}

export function getStoredTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_TRIPS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredTrips(trips: Trip[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALL_TRIPS, JSON.stringify(trips));
  } catch (e) {
    console.error("Error saving trips to localStorage:", e);
  }
}

export function getBlockedUsers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addBlockedUser(uid: string): void {
  try {
    const list = getBlockedUsers();
    if (!list.includes(uid)) {
      list.push(uid);
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(list));
    }
  } catch (e) {
    console.error("Error blocking user:", e);
  }
}

export function getNotificationSeenKey(type: string, uid: string | null | undefined, status: string, extra = ''): string {
  const safeUid = uid || 'guest';
  const safeExtra = extra ? '_' + String(extra).slice(0, 30).replace(/[^a-zA-Z0-9]/g, '') : '';
  return 'safarmatch_notif_seen_' + type + '_' + safeUid + '_' + status + safeExtra;
}

export function isNotificationSeen(type: string, uid: string | null | undefined, status: string, extra = ''): boolean {
  try {
    const key = getNotificationSeenKey(type, uid, status, extra);
    return localStorage.getItem(key) === 'true';
  } catch (e) {
    return false;
  }
}

export function markNotificationSeen(type: string, uid: string | null | undefined, status: string, extra = ''): void {
  try {
    const key = getNotificationSeenKey(type, uid, status, extra);
    localStorage.setItem(key, 'true');
  } catch (e) {}
}

export function resetNotificationSeen(type: string, uid: string | null | undefined): void {
  try {
    const safeUid = uid || 'guest';
    const prefix = 'safarmatch_notif_seen_' + type + '_' + safeUid + '_';
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}
}

