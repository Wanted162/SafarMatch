/**
 * SafarMatch — Header Controller & Quick Action Dropdown Menu
 * Provides a clean, modern, top-tier dropdown menu that consolidates tools,
 * theme controls, journey statuses, safety features, and sign out options.
 */

import { openFeedbackModal } from './feedbackController';
import { openCabSplitModal } from '../services/paymentService';
import { openSurakshaEmergencyModal } from '../services/surakshaService';
import { getCurrentProfile } from '../services/profileService';
import { setTheme, getSavedTheme, ThemeMode } from '../theme/themeManager';

let isHeaderDropdownOpen = false;

export function initHeaderDropdown(): void {
  // Close menu on click outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const dropdown = document.getElementById('header-actions-dropdown');
    const triggerBtn = document.getElementById('header-menu-trigger');
    const profileTrigger = document.getElementById('header-profile-trigger');

    if (
      dropdown &&
      !dropdown.contains(target) &&
      triggerBtn &&
      !triggerBtn.contains(target) &&
      (!profileTrigger || !profileTrigger.contains(target))
    ) {
      closeHeaderDropdown();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isHeaderDropdownOpen) {
      closeHeaderDropdown();
    }
  });

  // Re-sync UI
  syncHeaderDropdownUI();
}

export function toggleHeaderDropdown(event?: Event): void {
  if (event) {
    event.stopPropagation();
  }
  if (isHeaderDropdownOpen) {
    closeHeaderDropdown();
  } else {
    openHeaderDropdown();
  }
}

export function openHeaderDropdown(): void {
  const dropdown = document.getElementById('header-actions-dropdown');
  const triggerBtn = document.getElementById('header-menu-trigger');
  if (!dropdown) return;

  dropdown.classList.remove('hidden');
  dropdown.classList.add('animate-in', 'fade-in-50', 'zoom-in-95');
  isHeaderDropdownOpen = true;

  if (triggerBtn) {
    triggerBtn.setAttribute('aria-expanded', 'true');
    triggerBtn.classList.add('bg-slate-100', 'text-slate-900');
  }

  syncHeaderDropdownUI();
  if ((window as any).lucide?.createIcons) {
    (window as any).lucide.createIcons();
  }
}

export function closeHeaderDropdown(): void {
  const dropdown = document.getElementById('header-actions-dropdown');
  const triggerBtn = document.getElementById('header-menu-trigger');
  if (!dropdown) return;

  dropdown.classList.add('hidden');
  isHeaderDropdownOpen = false;

  if (triggerBtn) {
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.classList.remove('bg-slate-100', 'text-slate-900');
  }
}

export function syncHeaderDropdownUI(): void {
  const prof = getCurrentProfile();
  const currentTheme = getSavedTheme();

  // 1. Update dropdown user info
  const dropAvatar = document.getElementById('menu-user-avatar') as HTMLImageElement | null;
  const dropName = document.getElementById('menu-user-name');
  const dropEmail = document.getElementById('menu-user-email');
  const dropStatus = document.getElementById('menu-user-status');

  if (dropAvatar && prof.photoUrl) dropAvatar.src = prof.photoUrl;
  if (dropName) dropName.textContent = prof.name || 'Traveler';
  if (dropEmail) dropEmail.textContent = prof.currentCircuit ? `📍 ${prof.currentCircuit}` : 'India Explorer';

  if (dropStatus) {
    if (prof.verificationStatus === 'verified') {
      dropStatus.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✓ Govt Verified</span>`;
    } else if (prof.verificationStatus === 'pending') {
      dropStatus.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">⏳ Verification Pending</span>`;
    } else {
      dropStatus.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Unverified</span>`;
    }
  }

  // 2. Sync theme active state inside menu
  const themeBtns = document.querySelectorAll('[data-menu-theme]');
  themeBtns.forEach(btn => {
    const el = btn as HTMLElement;
    const mode = el.getAttribute('data-menu-theme');
    if (mode === currentTheme) {
      el.classList.add('border-rose-400', 'bg-rose-50/70', 'text-rose-700', 'font-bold', 'ring-2', 'ring-rose-400/20');
      el.classList.remove('border-slate-200', 'text-slate-600', 'hover:bg-slate-50');
    } else {
      el.classList.remove('border-rose-400', 'bg-rose-50/70', 'text-rose-700', 'font-bold', 'ring-2', 'ring-rose-400/20');
      el.classList.add('border-slate-200', 'text-slate-600', 'hover:bg-slate-50');
    }
  });
}

// Global actions fired from dropdown items
export function handleDropdownThemeSelect(theme: ThemeMode): void {
  setTheme(theme, true);
  syncHeaderDropdownUI();
}

export function handleDropdownFeedback(): void {
  closeHeaderDropdown();
  openFeedbackModal();
}

export function handleDropdownCabSplit(): void {
  closeHeaderDropdown();
  openCabSplitModal();
}

export function handleDropdownEmergencySOS(): void {
  closeHeaderDropdown();
  openSurakshaEmergencyModal(getCurrentProfile());
}
