/**
 * SafarMatch — Navigation & View Switcher
 * Orchestrates multi-panel routing, responsive mobile bottom navigation bar, and tab indicators.
 */

import { updateJourneyStatusUI, getCurrentProfile } from '../services/profileService';
import { getActiveChatPartner, cleanupChatListeners } from '../services/chatService';

let currentView = 'map';

export function getCurrentView(): string {
  return currentView;
}

export function switchView(
  viewName: string,
  callbacks?: {
    onMapOpen?: () => void;
    onTripsOpen?: () => void;
    onChatOpen?: () => void;
    onProfileOpen?: () => void;
  }
): void {
  currentView = viewName;

  if (viewName !== 'chat') {
    cleanupChatListeners();
  }

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.remove('hidden');

  // Desktop Nav Items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('bg-safar-50', 'text-safar-700');
    btn.classList.add('text-slate-600', 'hover:bg-slate-100');
  });
  const activeNav = document.getElementById(`nav-btn-${viewName}`);
  if (activeNav) {
    activeNav.classList.remove('text-slate-600', 'hover:bg-slate-100');
    activeNav.classList.add('bg-safar-50', 'text-safar-700');
  }

  // Mobile Nav Items
  document.querySelectorAll('.mobile-nav-item').forEach(btn => {
    btn.classList.remove('text-safar-600');
    btn.classList.add('text-slate-400');
  });
  const mobileNav = document.getElementById(`mobile-nav-${viewName}`);
  if (mobileNav) {
    mobileNav.classList.remove('text-slate-400');
    mobileNav.classList.add('text-safar-600');
  }

  // Dispatch domain lifecycle triggers
  if (viewName === 'map' && callbacks?.onMapOpen) {
    callbacks.onMapOpen();
  } else if (viewName === 'trips' && callbacks?.onTripsOpen) {
    callbacks.onTripsOpen();
  } else if (viewName === 'chat' && callbacks?.onChatOpen) {
    callbacks.onChatOpen();
  } else if (viewName === 'profile' && callbacks?.onProfileOpen) {
    callbacks.onProfileOpen();
  }

  // Reset mobile bottom nav visibility if not in dedicated mobile chat thread
  if (viewName !== 'chat') {
    const mobileBottomBar = document.getElementById('mobile-bottom-nav');
    if (mobileBottomBar) mobileBottomBar.classList.remove('hidden');
  }

  updateJourneyStatusUI();
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function showLandingPage(): void {
  const landing = document.getElementById('landing-page') || document.getElementById('landing-overlay');
  if (landing) {
    landing.classList.remove('hidden');
    landing.style.display = 'flex';
  }
}

export function hideLandingPage(): void {
  const landing = document.getElementById('landing-page') || document.getElementById('landing-overlay');
  if (landing) {
    landing.classList.add('hidden');
    landing.style.display = 'none';
  }
}
