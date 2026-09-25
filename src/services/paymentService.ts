/**
 * SafarMatch — UPI Payment Engine & Connect Quotas
 * Handles direct 0% fee UPI (pisalpranit1-1@oksbi), monthly free connects, UTR verification & cab split calculator.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { UPI_CONFIG, FREE_CONNECTS_LIMIT } from '../config/constants';
import { STORAGE_KEYS } from '../utils/storage';
import { showToast } from '../utils/toast';
import type { UserProfile } from '../types';

let activeUpiPlan = "explorer";
let activeUpiAmount = 299;
let activeUpiUri = "";

export function getMonthlyConnects(): number {
  const thisMonth = new Date().toISOString().slice(0, 7);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_CONNECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.month === thisMonth && typeof parsed.remaining === 'number') {
        return parsed.remaining;
      }
    }
  } catch (e) {}
  setMonthlyConnects(FREE_CONNECTS_LIMIT);
  return FREE_CONNECTS_LIMIT;
}

export function setMonthlyConnects(count: number): void {
  const thisMonth = new Date().toISOString().slice(0, 7);
  try {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_CONNECTS, JSON.stringify({ 
      month: thisMonth, 
      remaining: Math.max(0, count) 
    }));
  } catch (e) {}
}

export function hasActiveExplorerPass(profile?: UserProfile | null): boolean {
  if (profile) {
    if ((profile as any).hasExplorerPass === true || (profile as any).isVip === true) return true;
    if (profile.subscriptionStatus === 'active') return true;
    if ((profile as any).subscription && (profile as any).subscription.status === 'active') return true;
  }
  try {
    if (localStorage.getItem(STORAGE_KEYS.PASS_UNLOCKED) === 'true') return true;
  } catch (e) {}
  return false;
}

export function isStep1Complete(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  const hasName = Boolean(profile.name && profile.name.trim().length >= 2);
  const hasCity = Boolean((profile.homeCity && profile.homeCity.trim().length >= 2) || (profile.currentCircuit && profile.currentCircuit.trim().length >= 2));
  const hasPhoto = Boolean(profile.photoUrl && profile.photoUrl.length > 10);
  return hasName && hasCity && hasPhoto;
}

export function consumeMonthlyConnect(profile?: UserProfile | null): boolean {
  if (hasActiveExplorerPass(profile)) return true;
  const current = getMonthlyConnects();
  if (current > 0) {
    const next = current - 1;
    setMonthlyConnects(next);
    showToast(`🤝 Free companion connect used! (${next} free ${next === 1 ? 'connect' : 'connects'} remaining this month)`, "info");
    return true;
  }
  return false;
}

export function checkConnectQuotaOrPaywall(profile: UserProfile | null, onOpenProfile: () => void): boolean {
  if (hasActiveExplorerPass(profile)) return true;
  if (!isStep1Complete(profile)) {
    showToast("⚠️ Please complete your profile (Step 1) before connecting.", "warning");
    onOpenProfile();
    return false;
  }
  const remaining = getMonthlyConnects();
  if (remaining <= 0) {
    openPaywallModal("You have used your 2 free companion connects for this month! Activate the Explorer Pass (₹299/mo) for unlimited chats, trip postings, and live GPS matching.");
    return false;
  }
  return true;
}

export function openPaywallModal(customText = ""): void {
  const modal = document.getElementById('paywall-modal');
  if (!modal) return;
  if (customText) {
    const textEl = document.getElementById('paywall-modal-text');
    if (textEl) textEl.textContent = customText;
  }
  modal.classList.remove('hidden');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closePaywallModal(): void {
  const modal = document.getElementById('paywall-modal');
  if (modal) modal.classList.add('hidden');
}

export function openUpiModal(plan = "explorer", amount = 299): void {
  activeUpiPlan = plan;
  activeUpiAmount = amount;
  const modal = document.getElementById('upi-payment-modal');
  if (!modal) return;

  const planName = plan === 'boost' ? 'TripBoost' : 'ExplorerPass';
  activeUpiUri = `upi://pay?pa=${encodeURIComponent(UPI_CONFIG.PAYEE_VPA)}&pn=${encodeURIComponent(UPI_CONFIG.PAYEE_NAME)}&am=${amount}&cu=INR&tn=${planName}`;

  const subtitle = document.getElementById('upi-modal-subtitle');
  if (subtitle) {
    subtitle.textContent = plan === 'boost' ? `Trip Boost — ₹${amount} for 7 Days` : `Explorer Pass — ₹${amount} for 30 Days`;
  }
  const mobileBtnText = document.getElementById('upi-mobile-btn-text');
  if (mobileBtnText) {
    mobileBtnText.textContent = `Pay ₹${amount} via Any UPI App (GPay / PhonePe / Paytm / BHIM)`;
  }

  const qrImg = document.getElementById('upi-qr-image') as HTMLImageElement | null;
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeUpiUri)}`;
  }
  const utrInput = document.getElementById('upi-utr-input') as HTMLInputElement | null;
  if (utrInput) utrInput.value = "";

  modal.classList.remove('hidden');
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeUpiModal(): void {
  const modal = document.getElementById('upi-payment-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleMobileUpiIntentClick(): void {
  if (!activeUpiUri) return;
  window.location.href = activeUpiUri;
}

export function copyUpiId(): void {
  const vpa = UPI_CONFIG.PAYEE_VPA;
  navigator.clipboard.writeText(vpa).then(() => {
    const btnText = document.getElementById('upi-copy-btn-text');
    if (btnText) {
      btnText.textContent = "Copied!";
      setTimeout(() => { btnText.textContent = "Copy UPI ID"; }, 2500);
    }
    showToast(`📋 UPI ID (${vpa}) copied to clipboard!`, "success");
  }).catch(() => {
    showToast(`UPI ID: ${vpa}`, "info");
  });
}

export async function submitUtrVerification(profile: UserProfile | null, onUpdated: () => void): Promise<void> {
  const input = document.getElementById('upi-utr-input') as HTMLInputElement | null;
  if (!input) return;
  const utr = input.value.trim();
  if (!/^[0-9]{12}$/.test(utr)) {
    showToast("Please enter a valid 12-digit UPI Reference / UTR Number.", "error");
    return;
  }

  if (profile) {
    if (profile.uid) {
      try {
        localStorage.setItem(STORAGE_KEYS.AWAITING_PAYMENT_PREFIX + profile.uid, 'true');
      } catch (e) {}
    }
    (profile as any).subscription = {
      status: "pending_review",
      utr: utr,
      plan: "explorer_monthly",
      activatedAt: new Date().toISOString()
    };
    profile.subscriptionStatus = 'pending_verification';
    profile.subscriptionUtr = utr;

    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {}

    if (isLiveFirebase && db && profile.uid) {
      try {
        await setDoc(doc(db, "profiles", profile.uid), {
          subscription: {
            status: "pending_review",
            utr: utr,
            plan: "explorer_monthly",
            activatedAt: serverTimestamp()
          }
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore subscription write error:", err);
      }
    }
  }

  closeUpiModal();
  showToast("Payment received! Our team is verifying the UTR. Pass will activate shortly.", "info");
  onUpdated();
}

export function openCabSplitModal(): void {
  const modal = document.getElementById('cab-split-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  calculateSplit();
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function closeCabSplitModal(): void {
  const modal = document.getElementById('cab-split-modal');
  if (modal) modal.classList.add('hidden');
}

export function applySplitPreset(amount: number, people: number, misc = 0, label = ""): void {
  const totalInput = document.getElementById('split-total-amount') as HTMLInputElement | null;
  const peopleInput = document.getElementById('split-people-count') as HTMLInputElement | null;
  const miscInput = document.getElementById('split-misc-amount') as HTMLInputElement | null;
  if (totalInput) totalInput.value = String(amount);
  if (peopleInput) peopleInput.value = String(people);
  if (miscInput) miscInput.value = String(misc);
  calculateSplit();
  if (label) showToast(`Applied preset: ${label}`, "info");
}

export function calculateSplit(): void {
  const total = parseFloat((document.getElementById('split-total-amount') as HTMLInputElement)?.value) || 0;
  const people = Math.max(1, parseInt((document.getElementById('split-people-count') as HTMLInputElement)?.value) || 1);
  const misc = parseFloat((document.getElementById('split-misc-amount') as HTMLInputElement)?.value) || 0;
  const grandTotal = total + misc;
  const perPerson = Math.ceil(grandTotal / people);
  const display = document.getElementById('split-per-person-display');
  const summary = document.getElementById('split-summary-text');
  if (display) display.textContent = `₹${perPerson.toLocaleString('en-IN')}`;
  if (summary) summary.textContent = `Total ₹${grandTotal.toLocaleString('en-IN')} divided equally among ${people} explorers`;
}

export function copySplitSummary(): void {
  const total = parseFloat((document.getElementById('split-total-amount') as HTMLInputElement)?.value) || 0;
  const people = Math.max(1, parseInt((document.getElementById('split-people-count') as HTMLInputElement)?.value) || 1);
  const misc = parseFloat((document.getElementById('split-misc-amount') as HTMLInputElement)?.value) || 0;
  const grandTotal = total + misc;
  const perPerson = Math.ceil(grandTotal / people);
  const text = `🚕 *SafarMatch Cab/Stay Split*\n💰 Total Bill: ₹${grandTotal.toLocaleString('en-IN')}\n👥 Explorers: ${people}\n👉 *Each Person Pays: ₹${perPerson.toLocaleString('en-IN')}*\nPay via UPI: ${UPI_CONFIG.PAYEE_VPA}`;

  navigator.clipboard.writeText(text).then(() => {
    const btnText = document.getElementById('split-copy-btn-text');
    if (btnText) {
      btnText.textContent = "Copied to Clipboard!";
      setTimeout(() => { btnText.textContent = "Copy Split Breakdown for WhatsApp"; }, 2500);
    }
    showToast("📋 Split summary copied for WhatsApp!", "success");
  }).catch(() => {
    showToast(`Each person pays: ₹${perPerson}`, "info");
  });
}
