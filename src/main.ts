/**
 * SafarMatch — Enterprise Application Entry Point
 * Orchestrates modules, manages global event bindings, and connects UI with services.
 */

import './index.css';
import { createIcons, icons } from 'lucide';

// Ensure bundled Lucide icons are immediately available globally without network dependency
(window as any).lucide = {
  createIcons: (options: any = {}) => {
    try {
      createIcons({
        icons,
        attrs: {
          'stroke-width': '2',
          ...options.attrs
        },
        ...options
      });
    } catch (e) {
      console.warn("createIcons error:", e);
    }
  },
  icons
};

// Immediate icon hydration
try {
  (window as any).lucide.createIcons();
} catch (e) {}

import { isLiveFirebase, db, auth } from './config/firebase';
import { getDocs, collection } from 'firebase/firestore';


// Types & Config
import { UPI_CONFIG, INDIAN_CIRCUITS_LOOKUP } from './config/constants';

// Services
import { 
  getCurrentUser, 
  loginWithGoogle, 
  signOutUser, 
  initAuthListener,
  authenticateWithGoogleIdentity,
  openGoogleSignInModal,
  closeGoogleSignInModal
} from './services/authService';

import {
  getCurrentProfile,
  setCurrentProfile,
  initProfileState,
  updateProfileCompletionUI,
  updateJourneyStatusUI,
  updateVerificationBadgeUI,
  attachProfileRealtimeListener,
  showVerificationApprovedCelebration,
  closeVerificationApprovedModal,
  showVerificationRejectedModal,
  closeVerificationRejectedModal,
  showPaymentApprovedCelebration,
  closePaymentApprovedModal,
  showPaymentRejectedModal,
  closePaymentRejectedModal,
  openSelfieModal,
  closeSelfieModal,
  captureSelfieFrame,
  retakeSelfieFrame,
  uploadCapturedSelfie,
  handleSelfieFileSelected,
  handleGovIdFileSelected
} from './services/profileService';

import {
  getAllTravelers,
  setAllTravelers,
  initTravelersCache,
  inspectTravelerFromMap,
  closeTravelerDetailModal,
  reportInspectedTraveler,
  openReportModalFromChat,
  closeReportBlockModal,
  submitReportAndBlock
} from './services/travelerService';

import {
  getAllTrips,
  setAllTrips,
  initTripsCache,
  handlePostTripClick,
  closeCreateTripModal,
  handleCreateTripSubmit,
  handleJoinTripClick
} from './services/tripService';

import {
  getActiveChatPartner,
  getExistingChatPartnerIds,
  recordChatPartner,
  cleanupChatListeners
} from './services/chatService';

import {
  getMonthlyConnects,
  setMonthlyConnects,
  consumeMonthlyConnect,
  hasActiveExplorerPass,
  isStep1Complete,
  checkConnectQuotaOrPaywall,
  openPaywallModal,
  closePaywallModal,
  openUpiModal,
  closeUpiModal,
  handleMobileUpiIntentClick,
  copyUpiId,
  submitUtrVerification,
  openCabSplitModal,
  closeCabSplitModal,
  applySplitPreset,
  calculateSplit,
  copySplitSummary
} from './services/paymentService';

import {
  toggleSurakshaMode,
  openSurakshaEmergencyModal,
  closeSurakshaEmergencyModal,
  copyMyLocationSummary
} from './services/surakshaService';

// UI Controllers
import {
  switchView,
  getCurrentView,
  showLandingPage,
  hideLandingPage
} from './ui/navigation';

import {
  initMap,
  renderTravelerPins,
  filterMapCircuit,
  resetMapCenter,
  flyToDestination,
  locateUserPosition,
  initHomeCityMiniMap
} from './ui/mapController';

import {
  renderConversationList,
  renderMessagesList,
  openChatWithTraveler,
  openChatWithTravelerById,
  showActiveChatOnMobile,
  backToConversationList,
  setChatTheme,
  toggleChatThemeDropdown,
  setChatFilter,
  handleSendMessage
} from './ui/chatController';

import {
  renderTripsFeed,
  filterTripsFeed,
  searchTripsFeedByText
} from './ui/tripController';

import {
  populateProfileForm,
  triggerAvatarUpload,
  handleAvatarFileSelected,
  selectTravelIntent,
  toggleStyleTag,
  handleSaveProfile
} from './ui/profileController';

import {
  openFeedbackModal,
  closeFeedbackModal,
  selectFeedbackCategory,
  setFeedbackRating,
  updateFeedbackMailtoLink,
  submitUserFeedback
} from './ui/feedbackController';

import { showToast } from './utils/toast';
import { moderateMessageText } from './utils/moderation';

// ==================== BIND GLOBAL WINDOW OBJECT FOR HTML ONCLICK COMPATIBILITY ====================
const globalObj = window as any;

// Navigation & Auth
globalObj.switchView = (view: string) => {
  switchView(view, {
    onMapOpen: () => {
      initMap();
      renderTravelerPins();
    },
    onTripsOpen: () => {
      renderTripsFeed();
    },
    onChatOpen: () => {
      renderConversationList();
    },
    onProfileOpen: () => {
      populateProfileForm();
      const prof = getCurrentProfile();
      initHomeCityMiniMap(prof.homeLat, prof.homeLng);
    }
  });
};

globalObj.navigateToChatTab = () => {
  if (window.innerWidth < 768) {
    backToConversationList();
  }
  globalObj.switchView('chat');
};

globalObj.showLandingPage = showLandingPage;
globalObj.hideLandingPage = hideLandingPage;

globalObj.openGoogleSignInModal = openGoogleSignInModal;
globalObj.closeGoogleSignInModal = closeGoogleSignInModal;

globalObj.authenticateWithGoogleIdentity = (name: string, email: string, photoUrl?: string) => {
  const profile = getCurrentProfile();
  const user = authenticateWithGoogleIdentity(name, email, photoUrl, profile, (merged) => {
    setCurrentProfile(merged);
    populateProfileForm();
    updateJourneyStatusUI();
    updateVerificationBadgeUI(merged.verificationStatus);
  });
  if (user) {
    attachProfileRealtimeListener(user.uid);
  }
};

globalObj.handleCustomGoogleSignIn = (e: Event) => {
  e.preventDefault();
  const nameInput = document.getElementById('google-custom-name') as HTMLInputElement | null;
  const emailInput = document.getElementById('google-custom-email') as HTMLInputElement | null;
  const name = nameInput?.value.trim() || 'Google Traveler';
  const email = emailInput?.value.trim() || 'traveler@gmail.com';
  globalObj.authenticateWithGoogleIdentity(name, email);
};

globalObj.loginWithGoogleFromLanding = async () => {
  const mainBtn = document.getElementById('landing-google-btn-main') as HTMLButtonElement | null;
  const btnText = document.getElementById('landing-google-btn-text');
  const spinner = document.getElementById('landing-google-spinner');
  if (btnText) btnText.textContent = "Connecting to Google...";
  if (spinner) spinner.classList.remove('hidden');
  if (mainBtn) mainBtn.disabled = true;

  try {
    const profile = getCurrentProfile();
    const user = await loginWithGoogle(profile, (merged) => {
      setCurrentProfile(merged);
      populateProfileForm();
      updateJourneyStatusUI();
      updateVerificationBadgeUI(merged.verificationStatus);
    });

    if (user) {
      attachProfileRealtimeListener(user.uid);
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign Out";
      hideLandingPage();
      showToast(`Namaste, ${user.displayName || 'Explorer'}! Welcome to SafarMatch.`, "success");
    }
  } catch (err: any) {
    console.warn("Google sign-in flow:", err);
  } finally {
    if (btnText) btnText.textContent = "Sign in with Google ID";
    if (spinner) spinner.classList.add('hidden');
    if (mainBtn) mainBtn.disabled = false;
  }
};

globalObj.handleGuestLoginFromLanding = () => {
  hideLandingPage();
  showToast("Exploring SafarMatch in Preview Mode. Sign in with Google anytime to save your profile.", "info");
};

globalObj.handleAuthAction = () => {
  const user = getCurrentUser();
  if (user) {
    signOutUser().then(() => {
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign In";
      showToast("Signed out. Switched to landing page.", "info");
      showLandingPage();
    });
  } else {
    globalObj.loginWithGoogleFromLanding();
  }
};

// Map
globalObj.initMap = initMap;
globalObj.renderTravelerPins = renderTravelerPins;
globalObj.filterMapCircuit = filterMapCircuit;
globalObj.resetMapCenter = resetMapCenter;
globalObj.flyToDestination = flyToDestination;
globalObj.locateUserPosition = locateUserPosition;
globalObj.handleMapSearchSubmit = () => {
  const input = document.getElementById('map-destination-search-input') as HTMLInputElement | null;
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  filterMapCircuit(val);
};
globalObj.clearMapDestinationSearch = () => {
  const input = document.getElementById('map-destination-search-input') as HTMLInputElement | null;
  if (input) input.value = '';
  filterMapCircuit('all');
};

// Trips
globalObj.renderTripsFeed = renderTripsFeed;
globalObj.filterTripsFeed = filterTripsFeed;
globalObj.searchTripsFeedByText = searchTripsFeedByText;
globalObj.handlePostTripClick = () => {
  handlePostTripClick(
    getCurrentProfile(),
    () => globalObj.switchView('profile'),
    () => openPaywallModal()
  );
};
globalObj.closeCreateTripModal = closeCreateTripModal;
globalObj.handleCreateTripSubmit = (e: Event) => {
  handleCreateTripSubmit(e, getCurrentProfile(), () => {
    renderTripsFeed();
  });
};
globalObj.handleJoinTripClick = (tripId: string) => {
  handleJoinTripClick(
    tripId,
    getCurrentProfile(),
    () => globalObj.switchView('profile'),
    (trv) => {
      globalObj.switchView('chat');
      openChatWithTraveler(trv);
    }
  );
};

// Chat
globalObj.renderConversationList = renderConversationList;
globalObj.openChatWithTraveler = openChatWithTraveler;
globalObj.openChatWithTravelerById = openChatWithTravelerById;
globalObj.showActiveChatOnMobile = showActiveChatOnMobile;
globalObj.backToConversationList = backToConversationList;
globalObj.closeActiveChat = backToConversationList;
globalObj.setChatTheme = setChatTheme;
globalObj.toggleChatThemeDropdown = toggleChatThemeDropdown;
globalObj.setChatFilter = setChatFilter;
globalObj.handleSendMessage = handleSendMessage;
globalObj.getExistingChatPartnerIds = getExistingChatPartnerIds;
globalObj.recordChatPartner = recordChatPartner;
globalObj.startChatWithInspectedTraveler = () => {
  const inspected = globalObj.inspectedTraveler || getActiveChatPartner();
  closeTravelerDetailModal();
  if (inspected) {
    globalObj.switchView('chat');
    openChatWithTraveler(inspected);
  }
};
globalObj.sendQuickChatMessage = (text: string) => {
  const input = document.getElementById('chat-message-input') as HTMLInputElement | null;
  if (input) {
    input.value = text;
    const fakeEvent = new Event('submit', { cancelable: true });
    handleSendMessage(fakeEvent);
  }
};

// Profile & Verification
globalObj.populateProfileForm = populateProfileForm;
globalObj.triggerAvatarUpload = triggerAvatarUpload;
globalObj.handleAvatarFileSelected = handleAvatarFileSelected;
globalObj.selectTravelIntent = selectTravelIntent;
globalObj.toggleStyleTag = toggleStyleTag;
globalObj.handleSaveProfile = handleSaveProfile;
globalObj.openSelfieModal = openSelfieModal;
globalObj.closeSelfieModal = closeSelfieModal;
globalObj.captureSelfieFrame = captureSelfieFrame;
globalObj.retakeSelfieFrame = retakeSelfieFrame;
globalObj.uploadCapturedSelfie = uploadCapturedSelfie;
globalObj.handleSelfieFileSelected = handleSelfieFileSelected;
globalObj.handleGovIdFileSelected = handleGovIdFileSelected;
globalObj.handleRetakeVerificationPhotos = () => {
  closeVerificationRejectedModal();
  globalObj.switchView('profile');
  setTimeout(() => openSelfieModal(), 200);
};

// Modals: Verification & Payment Approved / Rejected
globalObj.showVerificationApprovedCelebration = showVerificationApprovedCelebration;
globalObj.closeVerificationApprovedModal = closeVerificationApprovedModal;
globalObj.showVerificationRejectedModal = showVerificationRejectedModal;
globalObj.closeVerificationRejectedModal = closeVerificationRejectedModal;
globalObj.showPaymentApprovedCelebration = showPaymentApprovedCelebration;
globalObj.closePaymentApprovedModal = closePaymentApprovedModal;
globalObj.showPaymentRejectedModal = showPaymentRejectedModal;
globalObj.closePaymentRejectedModal = closePaymentRejectedModal;
globalObj.handleResubmitPaymentUtr = () => {
  closePaymentRejectedModal();
  openUpiModal('explorer_monthly', 299);
};

// Traveler Inspection & Reporting
globalObj.inspectTravelerFromMap = inspectTravelerFromMap;
globalObj.closeTravelerDetailModal = closeTravelerDetailModal;
globalObj.reportInspectedTraveler = reportInspectedTraveler;
globalObj.openReportModalFromChat = () => {
  openReportModalFromChat(getActiveChatPartner());
};
globalObj.closeReportBlockModal = closeReportBlockModal;
globalObj.submitReportAndBlock = (blockUser = true) => {
  submitReportAndBlock(getCurrentProfile(), blockUser, (blockedUid) => {
    renderTravelerPins();
    renderConversationList();
    if (getActiveChatPartner()?.uid === blockedUid) {
      backToConversationList();
    }
  });
};

// Suraksha Shield
globalObj.toggleSurakshaMode = (enabled: boolean) => {
  toggleSurakshaMode(enabled, getCurrentProfile(), () => {
    renderTravelerPins();
    renderTripsFeed();
  });
};
globalObj.openSurakshaEmergencyModal = () => {
  openSurakshaEmergencyModal(getCurrentProfile());
};
globalObj.closeSurakshaEmergencyModal = closeSurakshaEmergencyModal;
globalObj.copyMyLocationSummary = () => {
  copyMyLocationSummary(getCurrentProfile());
};

// Payment & Connects
globalObj.getMonthlyConnects = getMonthlyConnects;
globalObj.setMonthlyConnects = setMonthlyConnects;
globalObj.consumeMonthlyConnect = () => consumeMonthlyConnect(getCurrentProfile());
globalObj.getDailyConnects = getMonthlyConnects;
globalObj.setDailyConnects = setMonthlyConnects;
globalObj.consumeDailyConnect = () => consumeMonthlyConnect(getCurrentProfile());
globalObj.checkConnectQuotaOrPaywall = (actionDesc?: string) => {
  return checkConnectQuotaOrPaywall(getCurrentProfile(), () => globalObj.switchView('profile'));
};
globalObj.hasActiveExplorerPass = () => hasActiveExplorerPass(getCurrentProfile());
globalObj.isStep1Complete = () => isStep1Complete(getCurrentProfile());
globalObj.openPaywallModal = openPaywallModal;
globalObj.closePaywallModal = closePaywallModal;
globalObj.openUpiModal = openUpiModal;
globalObj.closeUpiModal = closeUpiModal;
globalObj.handleMobileUpiIntentClick = handleMobileUpiIntentClick;
globalObj.copyUpiId = copyUpiId;
globalObj.submitUtrVerification = () => {
  submitUtrVerification(getCurrentProfile(), () => {
    updateJourneyStatusUI();
  });
};
globalObj.initiateExplorerPassCheckout = (amount = 299) => openUpiModal('explorer', amount);
globalObj.initiateTripBoostCheckout = (amount = 99) => openUpiModal('boost', amount);

// Cab Split
globalObj.openCabSplitModal = openCabSplitModal;
globalObj.closeCabSplitModal = closeCabSplitModal;
globalObj.applySplitPreset = applySplitPreset;
globalObj.calculateSplit = calculateSplit;
globalObj.copySplitSummary = copySplitSummary;

// Feedback Hub
globalObj.openFeedbackModal = openFeedbackModal;
globalObj.closeFeedbackModal = closeFeedbackModal;
globalObj.selectFeedbackCategory = selectFeedbackCategory;
globalObj.setFeedbackRating = setFeedbackRating;
globalObj.updateFeedbackMailtoLink = updateFeedbackMailtoLink;
globalObj.submitUserFeedback = submitUserFeedback;
globalObj.handleFeedbackSubmit = submitUserFeedback;

// Toast & Moderation
globalObj.showToast = showToast;
globalObj.moderateMessageText = moderateMessageText;

// ==================== APP BOOTSTRAP INITIALIZATION ====================
function bootApp(): void {
  // 1. Initialize local cache and session state
  const profile = initProfileState();
  initTravelersCache(profile);
  initTripsCache();

  // 2. Initialize UI views
  populateProfileForm();
  updateJourneyStatusUI();

  // 3. Initialize Auth listener
  initAuthListener((user) => {
    if (user) {
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign Out";
      if (user.uid) {
        attachProfileRealtimeListener(user.uid);
      }
      hideLandingPage();
    } else {
      const authBtnText = document.getElementById('btn-auth-text');
      if (authBtnText) authBtnText.textContent = "Sign In";
    }
  });

  // 4. Initialize Map
  initMap();

  // 5. Fetch live Firestore feeds in background if connected
  if (isLiveFirebase && db) {
    try {
      getDocs(collection(db, "trips")).then(snapshot => {
        const liveTrips: any[] = [];
        snapshot.forEach(docSnap => {
          liveTrips.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (liveTrips.length > 0) {
          setAllTrips(liveTrips);
          if (getCurrentView() === 'trips') renderTripsFeed();
        }
      }).catch(err => console.warn("Firestore trips fetch error:", err));

      getDocs(collection(db, "profiles")).then(snapshot => {
        const liveProfiles: any[] = [];
        snapshot.forEach(docSnap => {
          liveProfiles.push({ uid: docSnap.id, ...docSnap.data() });
        });
        if (liveProfiles.length > 0) {
          setAllTravelers(liveProfiles);
          renderTravelerPins();
        }
      }).catch(err => console.warn("Firestore profiles fetch error:", err));
    } catch (e) {
      console.warn("Background fetch warning:", e);
    }
  }

  // 6. Window resize listener for responsive chat layout
  window.addEventListener('resize', () => {
    if (getCurrentView() === 'chat') {
      const convPanel = document.getElementById('chat-conversations-panel');
      const threadPanel = document.getElementById('chat-thread-panel');
      const mobileNav = document.getElementById('mobile-bottom-nav');

      if (window.innerWidth >= 768) {
        if (convPanel) {
          convPanel.classList.remove('hidden');
          convPanel.classList.add('flex');
        }
        if (threadPanel) {
          threadPanel.classList.remove('hidden');
          threadPanel.classList.add('flex');
        }
        if (mobileNav) mobileNav.classList.remove('hidden');
      } else {
        if (!getActiveChatPartner()) {
          if (convPanel) {
            convPanel.classList.remove('hidden');
            convPanel.classList.add('flex');
          }
          if (threadPanel) {
            threadPanel.classList.add('hidden');
            threadPanel.classList.remove('flex');
          }
          if (mobileNav) mobileNav.classList.remove('hidden');
        } else {
          showActiveChatOnMobile();
        }
      }
    }
  });

  // Reliable icon hydration passes
  if ((window as any).lucide && (window as any).lucide.createIcons) {
    (window as any).lucide.createIcons();
    setTimeout(() => (window as any).lucide?.createIcons(), 50);
    setTimeout(() => (window as any).lucide?.createIcons(), 250);
  }
}

// Start on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

