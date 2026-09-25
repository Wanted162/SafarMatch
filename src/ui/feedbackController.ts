/**
 * SafarMatch — User Feedback & Feature Suggestions Controller
 * Directly connects travelers to safarmatch@gmail.com and Cloud Firestore.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { getCurrentUser } from '../services/authService';
import { getCurrentProfile } from '../services/profileService';
import { showToast } from '../utils/toast';

let activeFeedbackCategory = "feature";
let activeFeedbackRating = 5;

export function openFeedbackModal(): void {
  const modal = document.getElementById('feedback-modal');
  if (!modal) return;

  const currentUser = getCurrentUser();
  const currentProfile = getCurrentProfile();

  const emailInput = document.getElementById('feedback-email-input') as HTMLInputElement | null;
  if (emailInput) {
    if (currentUser && currentUser.email) {
      emailInput.value = currentUser.email;
    } else if (currentProfile && (currentProfile as any).email) {
      emailInput.value = (currentProfile as any).email;
    } else {
      emailInput.value = "";
    }
  }

  const msgInput = document.getElementById('feedback-message-input') as HTMLTextAreaElement | null;
  if (msgInput) msgInput.value = "";

  selectFeedbackCategory('feature');
  setFeedbackRating(5);
  modal.classList.remove('hidden');
  if ((window as any).lucide && (window as any).lucide.createIcons) (window as any).lucide.createIcons();
}

export function closeFeedbackModal(): void {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.add('hidden');
}

export function selectFeedbackCategory(cat: string): void {
  activeFeedbackCategory = cat;
  const pills = document.querySelectorAll('.feedback-cat-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-cat') === cat) {
      p.className = "feedback-cat-pill p-2.5 rounded-xl border border-amber-400 bg-amber-50 font-bold text-amber-900 text-left transition flex items-center space-x-2 cursor-pointer shadow-2xs";
    } else {
      p.className = "feedback-cat-pill p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 text-left transition flex items-center space-x-2 cursor-pointer";
    }
  });
  updateFeedbackMailtoLink();
}

export function setFeedbackRating(rating: number): void {
  activeFeedbackRating = rating;
  const labels: Record<number, string> = {
    1: "1 / 5 — Needs Attention",
    2: "2 / 5 — Fair, Room to Grow",
    3: "3 / 5 — Good Foundation",
    4: "4 / 5 — Really Great!",
    5: "5 / 5 — Loving SafarMatch!"
  };
  const labelEl = document.getElementById('feedback-star-label');
  if (labelEl) labelEl.textContent = labels[rating] || (`${rating} / 5`);

  const buttons = document.querySelectorAll('.star-rating-btn');
  buttons.forEach(btn => {
    const starNum = parseInt(btn.getAttribute('data-star') || "0");
    const icon = btn.querySelector('svg, i');
    if (starNum <= rating) {
      btn.className = "star-rating-btn p-1 text-amber-500 hover:scale-125 transition cursor-pointer";
      if (icon) {
        icon.classList.remove('text-slate-300');
        icon.classList.add('text-amber-500');
        icon.setAttribute('fill', 'currentColor');
      }
    } else {
      btn.className = "star-rating-btn p-1 text-slate-300 hover:scale-125 transition cursor-pointer";
      if (icon) {
        icon.classList.remove('text-amber-500');
        icon.classList.add('text-slate-300');
        icon.setAttribute('fill', 'none');
      }
    }
  });
  updateFeedbackMailtoLink();
}

export function updateFeedbackMailtoLink(): void {
  const directLink = document.getElementById('feedback-direct-mailto') as HTMLAnchorElement | null;
  if (!directLink) return;

  const msg = (document.getElementById('feedback-message-input') as HTMLTextAreaElement)?.value || "";
  const email = (document.getElementById('feedback-email-input') as HTMLInputElement)?.value || "Traveler";
  const catNames: Record<string, string> = { 
    feature: "Feature Request", 
    circuit: "New Circuit Suggestion", 
    bug: "Bug Report", 
    general: "General Feedback" 
  };
  const catName = catNames[activeFeedbackCategory] || "Feedback";
  const subject = encodeURIComponent(`SafarMatch Bharat Feedback: [${catName}]`);
  const body = encodeURIComponent(`Category: ${catName}\nRating: ${activeFeedbackRating}/5 Stars\nFrom: ${email}\n\nFeedback & Details:\n${msg}\n\n--- Sent via SafarMatch Hub`);
  directLink.href = `mailto:safarmatch@gmail.com?subject=${subject}&body=${body}`;
}

export async function submitUserFeedback(): Promise<void> {
  const msgInput = document.getElementById('feedback-message-input') as HTMLTextAreaElement | null;
  const emailInput = document.getElementById('feedback-email-input') as HTMLInputElement | null;
  const message = msgInput ? msgInput.value.trim() : "";
  const currentUser = getCurrentUser();
  const currentProfile = getCurrentProfile();
  const email = emailInput && emailInput.value.trim() ? emailInput.value.trim() : (currentUser && currentUser.email ? currentUser.email : "anonymous@safarmatch.in");
  const userName = currentProfile && currentProfile.name ? currentProfile.name : "Guest Explorer";

  if (message.length < 10) {
    showToast("⚠️ Please enter at least 10 characters so we can understand your idea.", "warning");
    return;
  }

  // 1. Cloud Firestore collection 'feedback'
  if (isLiveFirebase && db) {
    try {
      await addDoc(collection(db, "feedback"), {
        category: activeFeedbackCategory,
        rating: activeFeedbackRating,
        message,
        email,
        userUid: currentUser?.uid || currentProfile?.uid || "guest",
        userName,
        createdAt: serverTimestamp(),
        status: "new"
      });
    } catch (err) {
      console.warn("Firestore feedback write error:", err);
    }
  }

  // 2. Direct Gmail Delivery Engine via FormSubmit
  try {
    fetch("https://formsubmit.co/ajax/safarmatch@gmail.com", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `New SafarMatch Feedback: [${activeFeedbackCategory}] from ${userName}`,
        _captcha: "false",
        Category: activeFeedbackCategory,
        Rating: `${activeFeedbackRating} / 5 Stars`,
        Traveler_Name: userName,
        Traveler_Email: email,
        Message: message,
        Submitted_At: new Date().toLocaleString('en-IN')
      })
    }).catch(function(err) {
      console.warn("FormSubmit background dispatch error:", err);
    });
  } catch (dispatchErr) {
    console.warn("FormSubmit dispatch exception:", dispatchErr);
  }

  if (msgInput) msgInput.value = "";
  if (emailInput && (!currentUser || !currentUser.email)) {
    emailInput.value = "";
  }

  closeFeedbackModal();
  showToast("Thank you! Your feedback has been sent directly to the SafarMatch team.", "success");
}
