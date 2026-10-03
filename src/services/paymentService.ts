/**
 * SafarMatch — UPI Payment Engine & Connect Quotas
 * Handles direct 0% fee UPI (pisalpranit1-1@oksbi), monthly free connects, UTR verification & cab split calculator.
 * Strictly limits free users to connecting and messaging with at most 2 companion connections per calendar month.
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

/**
 * Returns the list of partner UIDs connected this calendar month for free users.
 */
export function getMonthlyConnectedPartners(): string[] {
  const thisMonth = new Date().toISOString().slice(0, 7);
  try {
    const raw = localStorage.getItem('safarmatch_monthly_partner_ids');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.month === thisMonth && Array.isArray(parsed.partnerIds)) {
        return parsed.partnerIds;
      }
    }
  } catch (e) {}
  return [];
}

/**
 * Records a partner UID in the monthly connections list.
 */
export function recordMonthlyConnectedPartner(partnerUid: string): void {
  if (!partnerUid) return;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const currentPartners = getMonthlyConnectedPartners();
  if (!currentPartners.includes(partnerUid)) {
    currentPartners.push(partnerUid);
    try {
      localStorage.setItem('safarmatch_monthly_partner_ids', JSON.stringify({
        month: thisMonth,
        partnerIds: currentPartners
      }));
    } catch (e) {}
    // Also keep remaining count in sync
    const remaining = Math.max(0, FREE_CONNECTS_LIMIT - currentPartners.length);
    setMonthlyConnects(remaining);
  }
}

/**
 * Returns whether a given partner is already among the user's active connections this month.
 */
export function isPartnerAlreadyConnected(partnerUid: string): boolean {
  if (!partnerUid) return false;
  const partners = getMonthlyConnectedPartners();
  return partners.includes(partnerUid);
}

export function getMonthlyConnects(): number {
  const partners = getMonthlyConnectedPartners();
  return Math.max(0, FREE_CONNECTS_LIMIT - partners.length);
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

export function getMonthlyQuotaUsed(profile?: UserProfile | null): number {
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (profile && profile.connectionsQuota) {
    if (profile.connectionsQuota.month === currentMonth) {
      return profile.connectionsQuota.used || 0;
    }
  }
  const partners = getMonthlyConnectedPartners();
  return partners.length;
}

/**
 * Verifies if user has quota to initiate or message a new connection.
 * If the partner was already connected this month, free chatting is permitted.
 */
export function canUserMessagePartner(partnerUid: string, profile: UserProfile | null): { allowed: boolean; reason?: string } {
  if (hasActiveExplorerPass(profile)) {
    return { allowed: true };
  }

  if (isPartnerAlreadyConnected(partnerUid)) {
    return { allowed: true };
  }

  const used = getMonthlyQuotaUsed(profile);
  if (used >= FREE_CONNECTS_LIMIT) {
    return {
      allowed: false,
      reason: "You have reached your limit of 2 free companion connects for this month. Upgrade to the Explorer Pass (₹299/month) for unlimited travel messaging."
    };
  }

  return { allowed: true };
}

export function consumeMonthlyConnect(partnerUid: string, profile?: UserProfile | null): boolean {
  if (hasActiveExplorerPass(profile)) return true;
  if (!partnerUid) return false;
  
  if (isPartnerAlreadyConnected(partnerUid)) {
    return true;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  let used = getMonthlyQuotaUsed(profile);
  if (used >= FREE_CONNECTS_LIMIT) {
    openPaywallModal("You have reached your limit of 2 free companion connects for this month. Upgrade to the Explorer Pass (₹299/month) for unlimited travel messaging.");
    return false;
  }

  used += 1;
  if (profile) {
    profile.connectionsQuota = { month: currentMonth, used };
    if (isLiveFirebase && db && profile.uid) {
      setDoc(doc(db, "profiles", profile.uid), {
        connectionsQuota: profile.connectionsQuota,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => console.warn("Firestore quota update error:", err));
    }
    try {
      localStorage.setItem('safarmatch_user_profile', JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {}
  }

  recordMonthlyConnectedPartner(partnerUid);
  const remaining = Math.max(0, FREE_CONNECTS_LIMIT - used);
  showToast(`Free connection used! (${remaining} free ${remaining === 1 ? 'connection' : 'connections'} remaining this month)`, "info");
  return true;
}

export function checkConnectQuotaOrPaywall(partnerUid: string, profile: UserProfile | null, onOpenProfile: () => void): boolean {
  if (hasActiveExplorerPass(profile)) return true;
  if (!isStep1Complete(profile)) {
    showToast("⚠️ Please complete your profile (Step 1) before connecting.", "warning");
    onOpenProfile();
    return false;
  }

  const check = canUserMessagePartner(partnerUid, profile);
  if (!check.allowed) {
    openPaywallModal(check.reason || "You have reached your limit of 2 free companion connects for this month. Upgrade to the Explorer Pass (₹299/month) for unlimited travel messaging.");
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

  let planName = "SafarMatch Explorer Pass (1 Month)";
  if (plan === "boost") planName = "Trip Itinerary VIP Priority Boost";
  else if (plan === "cab_split") planName = "Cab / Stay Share Settlement (Direct UPI)";
  const planEl = document.getElementById('upi-plan-name');
  const amountEl = document.getElementById('upi-plan-amount');
  const noteEl = document.getElementById('upi-order-note');
  const vpaEl = document.getElementById('upi-payee-vpa');
  const subtitleEl = document.getElementById('upi-modal-subtitle');
  const mobileBtnText = document.getElementById('upi-mobile-btn-text');

  if (planEl) planEl.textContent = planName;
  if (amountEl) amountEl.textContent = `₹${amount}`;
  if (vpaEl) vpaEl.textContent = UPI_CONFIG.PAYEE_VPA;
  if (subtitleEl) subtitleEl.textContent = `${planName} — ₹${amount}`;
  if (mobileBtnText) mobileBtnText.textContent = `Pay ₹${amount} via Any UPI App (GPay / PhonePe / Paytm)`;

  const orderId = `SAFAR_${Date.now().toString().slice(-6)}`;
  if (noteEl) noteEl.textContent = `Txn Ref: ${orderId}`;

  // Direct NPCI UPI Intent Link (0% Transaction Fee)
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_CONFIG.PAYEE_VPA)}&pn=${encodeURIComponent(UPI_CONFIG.PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(orderId)}`;
  activeUpiUri = upiUrl;

  const qrImg = document.getElementById('upi-qr-image') as HTMLImageElement | null;
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUrl)}&margin=10`;
  }

  const utrInput = (document.getElementById('upi-utr-input') || document.getElementById('input-payment-utr')) as HTMLInputElement | null;
  if (utrInput) utrInput.value = '';

  modal.classList.remove('hidden');
}

export function closeUpiModal(): void {
  const modal = document.getElementById('upi-payment-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleMobileUpiIntentClick(): void {
  if (activeUpiUri) {
    window.location.href = activeUpiUri;
  }
}

export function copyUpiId(): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(UPI_CONFIG.PAYEE_VPA).then(() => {
      showToast("📋 UPI ID copied: " + UPI_CONFIG.PAYEE_VPA, "success");
    });
  }
}

export async function submitUtrVerification(profile: UserProfile | null, onUpdated: () => void): Promise<void> {
  const input = (document.getElementById('upi-utr-input') || document.getElementById('input-payment-utr')) as HTMLInputElement | null;
  const utr = input ? input.value.trim().replace(/\s+/g, '') : '';
  if (!utr || !/^\d{12}$/.test(utr)) {
    showToast("⚠️ Invalid UTR: Please enter the exact 12-digit numeric reference number from Google Pay / PhonePe / Paytm / BHIM.", "error");
    return;
  }

  // Prevent trivial fake UTR exploitation (e.g. 000000000000, 111111111111, 123456789012)
  if (/^(.)\1{11}$/.test(utr) || utr === "123456789012" || utr === "012345678901" || utr === "987654321098") {
    showToast("⚠️ Invalid Reference: Test sequences are rejected. Enter the genuine 12-digit UTR from your UPI app receipt or bank SMS.", "error");
    return;
  }

  if (!profile) {
    showToast("Please complete your traveler profile before submitting payment.", "warning");
    return;
  }
    const paymentRecord = {
      utr,
      plan: activeUpiPlan,
      amount: activeUpiAmount,
      submittedAt: new Date().toISOString(),
      status: "pending_review",
      uid: profile.uid || 'guest',
      userName: profile.name || 'Traveler',
      userEmail: (profile as any).email || 'None'
    };

    try {
      localStorage.setItem(STORAGE_KEYS.AWAITING_PAYMENT_PREFIX + (profile.uid || 'guest'), JSON.stringify(paymentRecord));
    } catch (e) {}

    if (isLiveFirebase && db && profile.uid) {
      try {
        await setDoc(doc(db, "profiles", profile.uid), {
          subscription: {
            status: "pending_review",
            utr,
            utrNumber: utr,
            upiReference: utr,
            plan: activeUpiPlan || "explorer_monthly",
            amount: activeUpiAmount || 299,
            submittedAt: serverTimestamp()
          }
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore subscription write error:", err);
      }
    }

  closeUpiModal();
  showToast("UTR submitted successfully! Our team is verifying with SBI. Your Pass will unlock upon approval.", "success");
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

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Split summary copied for in-app chat!", "success");
    });
  }
}

export function payPerPersonViaUpi(): void {
  const total = parseFloat((document.getElementById('split-total-amount') as HTMLInputElement)?.value) || 0;
  const people = Math.max(1, parseInt((document.getElementById('split-people-count') as HTMLInputElement)?.value) || 1);
  const misc = parseFloat((document.getElementById('split-misc-amount') as HTMLInputElement)?.value) || 0;
  const grandTotal = total + misc;
  const perPerson = Math.ceil(grandTotal / people);
  closeCabSplitModal();
  openUpiModal('cab_split', perPerson);
}

