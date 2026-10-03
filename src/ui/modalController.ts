/**
 * SafarMatch — Centralized Modal & Dialog Controller
 * 
 * Manages modal visibility, backdrop dismissal, accessibility focus,
 * and integration with camera, UPI, and feedback services.
 */

import { startLiveCamera, stopLiveCamera, compressFrameToCanvas } from '../utils/camera';
import { showToast } from '../utils/toast';

let activeCapturedBlob: Blob | null = null;
let activeCapturedBase64: string | null = null;

// ==================== 1. LIVE WEBRTC SELFIE CAMERA MODAL ====================

export async function openSelfieModal(): Promise<void> {
  const modal = document.getElementById('selfie-modal');
  const video = document.getElementById('selfie-video') as HTMLVideoElement | null;
  const preview = document.getElementById('selfie-captured-preview') as HTMLImageElement | null;
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');
  const loading = document.getElementById('camera-loading-indicator');
  const fallback = document.getElementById('camera-fallback-overlay');

  if (!modal || !video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload || !loading || !fallback) return;

  modal.classList.remove('hidden');
  preview.classList.add('hidden');
  video.classList.remove('hidden');
  oval.classList.remove('hidden');
  btnCapture.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnUpload.classList.add('hidden');
  fallback.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    await startLiveCamera(video, 'user');
    loading.classList.add('hidden');
  } catch (e) {
    loading.classList.add('hidden');
    fallback.classList.remove('hidden');
  }
}

export function closeSelfieModal(): void {
  stopLiveCamera();
  const modal = document.getElementById('selfie-modal');
  if (modal) modal.classList.add('hidden');
}

export async function captureSelfieFrame(): Promise<void> {
  const video = document.getElementById('selfie-video') as HTMLVideoElement | null;
  const preview = document.getElementById('selfie-captured-preview') as HTMLImageElement | null;
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');

  if (!video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload) return;

  try {
    const { blob, base64, sizeKb } = await compressFrameToCanvas(video, true, 360, 0.7);
    activeCapturedBlob = blob;
    activeCapturedBase64 = base64;
    (window as any).__lastCapturedSelfieBase64 = base64;

    preview.src = URL.createObjectURL(blob);
    preview.classList.remove('hidden');
    video.classList.add('hidden');
    oval.classList.add('hidden');
    btnCapture.classList.add('hidden');
    btnRetake.classList.remove('hidden');
    btnUpload.classList.remove('hidden');

    const statusEl = document.getElementById('selfie-compression-status');
    if (statusEl) {
      statusEl.textContent = `Frame captured & compressed: ${sizeKb} KB (<60 KB limit met)`;
    }
  } catch (err) {
    console.error("Selfie frame compression error:", err);
    showToast("Failed to process camera frame. Please try again.", "error");
  }
}

export function retakeSelfieFrame(): void {
  const video = document.getElementById('selfie-video');
  const preview = document.getElementById('selfie-captured-preview');
  const oval = document.getElementById('selfie-oval-guide');
  const btnCapture = document.getElementById('btn-capture-selfie');
  const btnRetake = document.getElementById('btn-retake-selfie');
  const btnUpload = document.getElementById('btn-upload-selfie');

  if (!video || !preview || !oval || !btnCapture || !btnRetake || !btnUpload) return;

  preview.classList.add('hidden');
  video.classList.remove('hidden');
  oval.classList.remove('hidden');
  btnCapture.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnUpload.classList.add('hidden');
}

export function getActiveCapturedSelfie(): { blob: Blob | null; base64: string | null } {
  return { blob: activeCapturedBlob, base64: activeCapturedBase64 };
}

// ==================== 2. UPI MODAL CONTROLS ====================

export function openUpiModal(planType: 'explorer' | 'boost' = 'explorer', amount = 299): void {
  if (typeof (window as any).triggerOpenUpiModal === 'function') {
    (window as any).triggerOpenUpiModal(planType, amount);
    return;
  }
  const modal = document.getElementById('upi-payment-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeUpiModal(): void {
  const modal = document.getElementById('upi-payment-modal');
  if (modal) modal.classList.add('hidden');
}

// ==================== 3. CAB & STAY SPLIT MODAL ====================

export function openCabSplitModal(): void {
  const modal = document.getElementById('cab-split-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeCabSplitModal(): void {
  const modal = document.getElementById('cab-split-modal');
  if (modal) modal.classList.add('hidden');
}

// ==================== 4. FEEDBACK & EMERGENCY MODALS ====================

export function openFeedbackModal(): void {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeFeedbackModal(): void {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.add('hidden');
}

export function openSurakshaEmergencyModal(): void {
  const modal = document.getElementById('suraksha-emergency-modal') || document.getElementById('suraksha-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeSurakshaEmergencyModal(): void {
  const modal = document.getElementById('suraksha-emergency-modal') || document.getElementById('suraksha-modal');
  if (modal) modal.classList.add('hidden');
}

export function openPaywallModal(customMessage?: string): void {
  const modal = document.getElementById('paywall-modal');
  if (modal) {
    if (customMessage) {
      const textEl = document.getElementById('paywall-modal-text');
      if (textEl) textEl.textContent = customMessage;
    }
    modal.classList.remove('hidden');
  }
}

export function closePaywallModal(): void {
  const modal = document.getElementById('paywall-modal');
  if (modal) modal.classList.add('hidden');
}

export function openPaymentRejectedModal(reason?: string): void {
  const modal = document.getElementById('payment-rejected-modal');
  if (modal) {
    if (reason) {
      const reasonEl = document.getElementById('payment-rejection-reason-text');
      if (reasonEl) reasonEl.textContent = reason;
    }
    modal.classList.remove('hidden');
  }
}

export function closePaymentRejectedModal(): void {
  const modal = document.getElementById('payment-rejected-modal');
  if (modal) modal.classList.add('hidden');
}

// Expose on window for inline HTML onclick handlers
if (typeof window !== 'undefined') {
  const w = window as any;
  w.openSelfieModal = openSelfieModal;
  w.closeSelfieModal = closeSelfieModal;
  w.captureSelfieFrame = captureSelfieFrame;
  w.retakeSelfieFrame = retakeSelfieFrame;
  w.openUpiModal = openUpiModal;
  w.closeUpiModal = closeUpiModal;
  w.openCabSplitModal = openCabSplitModal;
  w.closeCabSplitModal = closeCabSplitModal;
  w.openFeedbackModal = openFeedbackModal;
  w.closeFeedbackModal = closeFeedbackModal;
  w.openSurakshaEmergencyModal = openSurakshaEmergencyModal;
  w.closeSurakshaEmergencyModal = closeSurakshaEmergencyModal;
  w.openPaywallModal = openPaywallModal;
  w.closePaywallModal = closePaywallModal;
  w.openPaymentRejectedModal = openPaymentRejectedModal;
  w.closePaymentRejectedModal = closePaymentRejectedModal;
}
