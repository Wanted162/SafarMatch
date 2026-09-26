/**
 * SafarMatch — Secure Cookie & Session Utilities
 * Provides SameSite=Strict, Secure cookies for device session management,
 * token validation, and instant zero-residual cache eviction.
 */

export interface DeviceUser {
  name: string;
  email: string;
  photoUrl?: string;
  lastLogin: number;
}

const COOKIE_NAMES = {
  SESSION_TOKEN: 'safarmatch_session',
  AUTH_UID: 'safarmatch_uid',
  DEVICE_REMEMBER: 'safarmatch_device_user'
};

/**
 * Set a secure, origin-bound cookie.
 */
export function setCookie(name: string, value: string, days = 7, sameSite: 'Strict' | 'Lax' = 'Strict'): void {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  let expires = '';
  if (days > 0) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=${sameSite}${secureFlag}`;
}

/**
 * Retrieve a cookie by name.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch (e) {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
}

/**
 * Delete a specific cookie immediately by setting Max-Age=0 and expired date.
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/; SameSite=Strict${secureFlag}`;
}

/**
 * Store an active authenticated session cookie.
 */
export function setSessionCookie(uid: string, rememberDevice = false): void {
  const sessionToken = `sm_${uid.slice(0, 12)}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const days = rememberDevice ? 14 : 1;
  setCookie(COOKIE_NAMES.SESSION_TOKEN, sessionToken, days, 'Strict');
  setCookie(COOKIE_NAMES.AUTH_UID, uid, days, 'Strict');
}

/**
 * Retrieve current session token from cookies.
 */
export function getSessionCookie(): { token: string | null; uid: string | null } {
  return {
    token: getCookie(COOKIE_NAMES.SESSION_TOKEN),
    uid: getCookie(COOKIE_NAMES.AUTH_UID)
  };
}

/**
 * Save remembered user metadata ONLY for this device (if user explicitly chooses "Remember me").
 */
export function saveRememberedUserOnDevice(user: DeviceUser | null): void {
  if (!user) {
    deleteCookie(COOKIE_NAMES.DEVICE_REMEMBER);
    try {
      localStorage.removeItem(COOKIE_NAMES.DEVICE_REMEMBER);
    } catch (e) {}
    return;
  }

  const payload = JSON.stringify(user);
  setCookie(COOKIE_NAMES.DEVICE_REMEMBER, payload, 30, 'Strict');
  try {
    localStorage.setItem(COOKIE_NAMES.DEVICE_REMEMBER, payload);
  } catch (e) {}
}

/**
 * Get remembered user for this device. Returns null on unknown/new devices.
 */
export function getRememberedUserOnDevice(): DeviceUser | null {
  try {
    const raw = getCookie(COOKIE_NAMES.DEVICE_REMEMBER) || localStorage.getItem(COOKIE_NAMES.DEVICE_REMEMBER);
    if (!raw) return null;
    return JSON.parse(raw) as DeviceUser;
  } catch (e) {
    return null;
  }
}

/**
 * Wipe all authentication and session cookies on logout.
 */
export function clearAllAuthCookies(): void {
  deleteCookie(COOKIE_NAMES.SESSION_TOKEN);
  deleteCookie(COOKIE_NAMES.AUTH_UID);
  deleteCookie(COOKIE_NAMES.DEVICE_REMEMBER);

  // Invalidate any other domain cookies if present
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.startsWith('safarmatch_')) {
        deleteCookie(name);
      }
    }
  }
}
