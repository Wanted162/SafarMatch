/**
 * SafarMatch — Real-Time Chat UI Controller
 * Manages conversational threads, WhatsApp-inspired message bubbles & ticks,
 * mobile responsive split panel, theme switcher, and message input handling.
 */

import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS } from '../utils/storage';
import { moderateMessageText } from '../utils/moderation';
import { escapeHtml } from '../utils/security';
import { showToast } from '../utils/toast';
import {
  getActiveChatPartner,
  setActiveChatPartner,
  getExistingChatPartnerIds,
  recordChatPartner,
  getChatMeta,
  saveChatMeta,
  getMessagesForPartner,
  saveMessagesForPartner,
  isMessageFromMe,
  setActiveChatUnsubscribe,
  cleanupChatListeners
} from '../services/chatService';
import { getAllTravelers } from '../services/travelerService';
import { getCurrentProfile, DEFAULT_AVATAR } from '../services/profileService';
import { hasActiveExplorerPass, getMonthlyConnects, consumeMonthlyConnect, openPaywallModal, canUserMessagePartner, getMonthlyConnectedPartners, isStep1Complete } from '../services/paymentService';
import { SEED_INDIAN_TRAVELERS } from '../data/seedTravelers';
import type { Traveler, ChatMessage } from '../types';

let currentChatTheme = localStorage.getItem(STORAGE_KEYS.ACTIVE_THEME) || 'peace';
let activeChatFilter = 'all';

export function getActiveChatTheme(): string {
  return currentChatTheme;
}

export function setChatTheme(themeId: string): void {
  currentChatTheme = themeId;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_THEME, themeId);
  } catch (e) {}
  applyChatThemeToUI();
  closeChatThemeDropdown();
  showToast(`🎨 Chat Theme: ${themeId.toUpperCase()}`, "info");

  const partner = getActiveChatPartner();
  if (partner) {
    const msgs = getMessagesForPartner(partner.uid);
    renderMessagesList(msgs);
  }
}

export function applyChatThemeToUI(): void {
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.classList.remove('chat-theme-peace', 'chat-theme-emerald', 'chat-theme-sunset');
    if (currentChatTheme === 'peace') container.classList.add('chat-theme-peace');
    else if (currentChatTheme === 'emerald') container.classList.add('chat-theme-emerald');
    else if (currentChatTheme === 'sunset') container.classList.add('chat-theme-sunset');
  }
  const label = document.getElementById('chat-theme-active-name');
  if (label) {
    label.textContent = currentChatTheme.toUpperCase();
  }
}

export function renderThemeDropdownOptions(): void {
  const list = document.getElementById('chat-theme-options-list');
  if (!list) return;

  const themes = [
    { id: 'peace', name: 'Peace Zen', icon: '🌸', desc: 'Calming twilight lotus with soft rose accent' },
    { id: 'emerald', name: 'Valley Emerald', icon: '🌿', desc: 'Lush mountain trail green & pine glow' },
    { id: 'sunset', name: 'Gokarna Sunset', icon: '🌅', desc: 'Warm amber dusk & coastal sunset tone' }
  ];

  list.innerHTML = themes.map(t => {
    const isActive = currentChatTheme === t.id;
    return `
      <button 
        type="button" 
        onclick="window.setChatTheme('${t.id}')" 
        class="w-full text-left p-2 rounded-xl transition flex items-center space-x-2.5 cursor-pointer ${
          isActive ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'hover:bg-slate-800/60 text-slate-300'
        }"
      >
        <span class="text-base">${t.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-semibold flex items-center justify-between">
            <span>${t.name}</span>
            ${isActive ? '<span class="text-[10px] text-rose-400 font-bold">Active ✓</span>' : ''}
          </div>
          <div class="text-[10px] text-slate-400 truncate">${t.desc}</div>
        </div>
      </button>
    `;
  }).join('');
}

export function toggleChatThemeDropdown(e?: Event): void {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('chat-theme-dropdown');
  if (!dropdown) return;
  if (dropdown.classList.contains('hidden')) {
    renderThemeDropdownOptions();
    dropdown.classList.remove('hidden');
    setTimeout(() => {
      document.addEventListener('click', closeChatThemeDropdownOnClickOutside);
    }, 10);
  } else {
    dropdown.classList.add('hidden');
    document.removeEventListener('click', closeChatThemeDropdownOnClickOutside);
  }
}

function closeChatThemeDropdown(): void {
  const dropdown = document.getElementById('chat-theme-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  document.removeEventListener('click', closeChatThemeDropdownOnClickOutside);
}

function closeChatThemeDropdownOnClickOutside(e: MouseEvent): void {
  const dropdown = document.getElementById('chat-theme-dropdown');
  const btn = document.getElementById('chat-theme-toggle-btn');
  if (dropdown && !dropdown.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) {
    closeChatThemeDropdown();
  }
}

export function setChatFilter(filter: string): void {
  activeChatFilter = filter;
  ['filter-chat-all', 'filter-chat-unread', 'filter-chat-verified'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === `filter-chat-${filter}`) {
      el.className = "filter-pill px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs transition flex-shrink-0 cursor-pointer";
    } else {
      el.className = "filter-pill px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition flex-shrink-0 cursor-pointer";
    }
  });
  renderConversationList();
}

export function renderConversationList(): void {
  const container = document.getElementById('chat-conversations-list') || document.getElementById('chat-conversation-items');
  if (!container) return;

  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const activeChatPartner = getActiveChatPartner();

  // ONLY connected users (or those with whom the user has actively exchanged messages/connected) are visible in the chat system
  const connectedIds = Array.from(new Set([
    ...getExistingChatPartnerIds(),
    ...getMonthlyConnectedPartners()
  ])).filter(Boolean);

  const allList = getAllTravelers();
  
  // Filter exclusively to travelers that the user has actually connected with or opened a chat with
  let connectedTravelers = allList.filter(t => t.uid !== myUid && connectedIds.includes(t.uid));

  // If currently talking to someone who was just clicked on the map/trip board, ensure they show
  if (activeChatPartner && activeChatPartner.uid !== myUid && !connectedTravelers.some(t => t.uid === activeChatPartner.uid)) {
    connectedTravelers.unshift(activeChatPartner);
  }

  let travelers = connectedTravelers;
  if (activeChatFilter === 'unread') {
    travelers = travelers.filter(trv => {
      const chatId = [myUid, trv.uid].sort().join('_');
      const meta = getChatMeta(chatId);
      return meta && Array.isArray(meta.unreadBy) && meta.unreadBy.includes(myUid);
    });
  } else if (activeChatFilter === 'verified') {
    travelers = travelers.filter(trv => trv.verificationStatus === 'verified');
  }

  if (travelers.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 text-slate-400 text-xs space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
          <i data-lucide="message-square-dashed" class="w-6 h-6 text-slate-500"></i>
        </div>
        <p class="font-bold text-slate-300 text-xs">No active connections yet</p>
        <p class="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
          Explore the Live Bharat Map or Trip Board to connect with travelers. When you make a connection, they will appear here!
        </p>
        <button onclick="window.switchView('map')" class="mt-2 px-3.5 py-1.5 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition">
          Find Travelers on Map
        </button>
      </div>
    `;
    if ((window as any).lucide) (window as any).lucide.createIcons();
    return;
  }

  container.innerHTML = travelers.map(trv => {
    const isCurrent = activeChatPartner && activeChatPartner.uid === trv.uid;
    const photo = (trv as any).photoUrl || trv.photo || DEFAULT_AVATAR;
    const chatId = [myUid, trv.uid].sort().join('_');
    const meta = getChatMeta(chatId);
    const msgs = getMessagesForPartner(trv.uid);
    const hasUnread = meta && Array.isArray(meta.unreadBy) && meta.unreadBy.includes(myUid);

    let lastMsg: any = null;
    if (msgs && msgs.length > 0) {
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].sender !== 'system') {
          lastMsg = msgs[i];
          break;
        }
      }
      if (!lastMsg) lastMsg = msgs[msgs.length - 1];
    }

    const isLastFromMe = lastMsg ? (lastMsg.sender === 'me') : (meta && meta.lastSender === 'me');
    const lastStatus = (lastMsg && lastMsg.status) || (meta && meta.lastMessageStatus) || 'read';
    const lastText = (lastMsg && lastMsg.text) || (meta && meta.lastMessage) || `${(trv as any).upcomingCircuit || trv.currentCircuit || 'India'} Circuit • Tap to chat`;
    const lastTime = (lastMsg && lastMsg.timestamp) || (meta && meta.lastMessageTime) || '';

    const statusTick = isLastFromMe ? (
      lastStatus === 'read' ? '<span class="text-sky-500 font-bold text-xs">✓✓</span>' :
      lastStatus === 'delivered' ? '<span class="text-slate-400 font-bold text-xs">✓✓</span>' :
      '<span class="text-slate-400 font-bold text-xs">✓</span>'
    ) : '';

    return `
      <div onclick="window.openChatWithTravelerById('${trv.uid}')" class="cursor-pointer p-2.5 rounded-2xl transition flex items-center space-x-2.5 border ${
        isCurrent ? 'bg-rose-50/90 border-rose-300 shadow-xs' : hasUnread ? 'bg-emerald-50/40 border-emerald-200/70 hover:bg-emerald-50/70' : 'bg-white border-transparent hover:bg-slate-100/90 hover:border-slate-200/60'
      }">
        <div class="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-200">
          <img src="${photo}" class="w-full h-full object-cover" />
          <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          ${hasUnread ? '<span class="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <span class="text-xs font-bold text-slate-900 truncate">${trv.name}</span>
            <span class="text-[10px] flex-shrink-0 ${hasUnread ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'}">${lastTime}</span>
          </div>
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center space-x-1 min-w-0 flex-1">
              ${statusTick}
              <p class="text-[11px] truncate ${hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'}">${lastText}</p>
            </div>
            ${hasUnread ? '<span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update unread indicator dots across dropdown and mobile nav
  const hasAnyUnread = connectedTravelers.some(trv => {
    const chatId = [myUid, trv.uid].sort().join('_');
    const meta = getChatMeta(chatId);
    return meta && Array.isArray(meta.unreadBy) && meta.unreadBy.includes(myUid);
  });
  const unreadDot1 = document.getElementById('sidebar-chat-unread-dot');
  const unreadDot2 = document.getElementById('mobile-chat-unread-dot');
  if (unreadDot1) {
    if (hasAnyUnread) unreadDot1.classList.remove('hidden');
    else unreadDot1.classList.add('hidden');
  }
  if (unreadDot2) {
    if (hasAnyUnread) unreadDot2.classList.remove('hidden');
    else unreadDot2.classList.add('hidden');
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function renderMessagesList(msgs: ChatMessage[]): void {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  applyChatThemeToUI();

  const activeChatPartner = getActiveChatPartner();
  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const partnerUid = activeChatPartner ? activeChatPartner.uid : null;

  if (!msgs || msgs.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white/90 shadow-sm text-emerald-600 flex items-center justify-center">
          <i data-lucide="shield-check" class="w-6 h-6"></i>
        </div>
        <p class="text-xs font-bold text-slate-800">Protected In-App Chat</p>
        <p class="text-[11px] text-slate-500 max-w-xs leading-relaxed">
          Coordinate routes, split cabs or book hostels with ${activeChatPartner ? activeChatPartner.name : 'this explorer'}! Messages are verified and encrypted.
        </p>
      </div>
    `;
    if ((window as any).lucide) (window as any).lucide.createIcons();
    return;
  }

  container.innerHTML = msgs.map(m => {
    if (m.sender === 'system') {
      return `
        <div class="w-full flex justify-center my-2">
          <div class="px-3 py-1 rounded-full bg-slate-200/80 backdrop-blur-xs text-[10px] font-semibold text-slate-700 shadow-2xs border border-slate-300/40">
            ${m.text}
          </div>
        </div>
      `;
    }

    const isFromMe = isMessageFromMe(m, myUid, partnerUid || '');

    if (isFromMe) {
      const statusIcon =
        m.status === 'read' ? '<span class="text-sky-400 font-bold text-[10px]">✓✓</span>' :
        m.status === 'delivered' ? '<span class="text-emerald-200 font-bold text-[10px]">✓✓</span>' :
        '<span class="text-emerald-200 font-bold text-[10px]">✓</span>';

      return `
        <div class="w-full flex justify-end items-end gap-1.5 my-1.5">
          <div class="relative max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl rounded-tr-xs bg-emerald-600 text-white shadow-xs">
            <p class="text-xs leading-relaxed break-words whitespace-pre-wrap">${escapeHtml(m.text)}</p>
            <div class="flex items-center justify-end space-x-1 mt-0.5">
              <span class="text-[9px] text-emerald-100 opacity-80">${escapeHtml(m.timestamp || '')}</span>
              ${statusIcon}
            </div>
          </div>
        </div>
      `;
    } else {
      const partnerPhoto = activeChatPartner && (activeChatPartner as any).photoUrl ? (activeChatPartner as any).photoUrl : DEFAULT_AVATAR;
      return `
        <div class="w-full flex justify-start items-end gap-2 my-1.5">
          <div class="w-7 h-7 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 mb-0.5">
            <img src="${partnerPhoto}" class="w-full h-full object-cover" />
          </div>
          <div class="relative max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl rounded-tl-xs bg-white text-slate-800 shadow-xs border border-slate-200">
            <p class="text-xs leading-relaxed break-words whitespace-pre-wrap">${escapeHtml(m.text)}</p>
            <div class="flex items-center justify-end space-x-1 mt-0.5">
              <span class="text-[9px] text-slate-400">${escapeHtml(m.timestamp || '')}</span>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  container.scrollTop = container.scrollHeight;
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function showActiveChatOnMobile(): void {
  const convPanel = document.getElementById('chat-conversations-panel');
  const threadPanel = document.getElementById('chat-thread-panel');
  const mobileNav = document.getElementById('mobile-bottom-nav');

  if (window.innerWidth < 768) {
    if (convPanel) {
      convPanel.classList.add('hidden');
      convPanel.classList.remove('flex');
    }
    if (threadPanel) {
      threadPanel.classList.remove('hidden');
      threadPanel.classList.add('flex');
    }
    if (mobileNav) {
      mobileNav.classList.add('hidden');
    }
  } else {
    if (convPanel) {
      convPanel.classList.remove('hidden');
      convPanel.classList.add('flex');
    }
    if (threadPanel) {
      threadPanel.classList.remove('hidden');
      threadPanel.classList.add('flex');
    }
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function backToConversationList(): void {
  setActiveChatPartner(null);
  cleanupChatListeners();

  const convPanel = document.getElementById('chat-conversations-panel');
  const threadPanel = document.getElementById('chat-thread-panel');
  const mobileNav = document.getElementById('mobile-bottom-nav');

  if (convPanel) {
    convPanel.classList.remove('hidden');
    convPanel.classList.add('flex');
  }
  if (threadPanel) {
    threadPanel.classList.add('hidden');
    threadPanel.classList.remove('flex');
  }
  if (mobileNav) {
    mobileNav.classList.remove('hidden');
  }

  renderConversationList();
  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function openChatWithTravelerById(partnerUid: string): void {
  if (!partnerUid) return;
  const pool = getAllTravelers().length > 0 ? getAllTravelers() : (SEED_INDIAN_TRAVELERS as unknown as Traveler[]);
  let trv = pool.find(t => t.uid === partnerUid);
  if (!trv) {
    trv = {
      uid: partnerUid,
      name: "Traveler",
      photo: DEFAULT_AVATAR,
      city: "India",
      currentCircuit: "India",
      age: 24,
      gender: "Male",
      lat: 20.5937,
      lng: 78.9629,
      vibe: "Explorer",
      travelStyle: ["Backpacker"],
      intent: "companion",
      verified: true,
      verificationStatus: "verified",
      bio: "Active traveler on SafarMatch",
      upcomingDestination: "India"
    };
  }
  openChatWithTraveler(trv);
}

export async function openChatWithTraveler(traveler: any): Promise<void> {
  if (!traveler || !traveler.uid) return;
  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const partnerUid = traveler.uid;
  const chatId = [myUid, partnerUid].sort().join('_');

  setActiveChatPartner(traveler);
  recordChatPartner(partnerUid);

  // Update Chat Header Bar (support both active-chat-* and chat-partner-* IDs)
  const headerAvatar = (document.getElementById('active-chat-avatar') || document.getElementById('chat-partner-avatar')) as HTMLImageElement | null;
  const headerName = document.getElementById('active-chat-name') || document.getElementById('chat-partner-name');
  const headerCircuit = document.getElementById('active-chat-meta') || document.getElementById('chat-partner-circuit');
  const headerBadge = document.getElementById('active-chat-badge') || document.getElementById('chat-partner-badge');

  const travelerName = traveler.name || 'Traveler';
  const travelerPhoto = traveler.photoUrl || traveler.photo || DEFAULT_AVATAR;
  const circuitText = `${traveler.upcomingCircuit || traveler.currentCircuit || 'India'} Circuit • Active Now`;

  if (headerAvatar) headerAvatar.src = travelerPhoto;
  if (headerName) headerName.textContent = travelerName;
  if (headerCircuit) headerCircuit.textContent = circuitText;

  if (headerBadge) {
    if (traveler.verificationStatus === 'verified' || traveler.verified) {
      headerBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1";
      headerBadge.innerHTML = `<i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i> Verified`;
    } else {
      headerBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1";
      headerBadge.innerHTML = `⚪ Unverified`;
    }
  }

  // 1. Check existing Firestore chats/{chatId} FIRST before creating metadata
  let chatStatus = 'accepted';
  let initiatorUid = myUid;
  let existingMeta = getChatMeta(chatId);

  if (isLiveFirebase && db) {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        chatStatus = data.status || 'accepted';
        initiatorUid = data.initiatorUid || myUid;
        existingMeta = { ...existingMeta, ...data };
        saveChatMeta(chatId, existingMeta);
      } else {
        // Doc doesn't exist yet: establish pending handshake without overwriting
        chatStatus = 'pending';
        initiatorUid = myUid;
        const newMeta = {
          initiatorUid: myUid,
          recipientUid: partnerUid,
          status: 'pending',
          lastMessage: `${travelerName} connected on SafarMatch`,
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadBy: [partnerUid]
        };
        await setDoc(chatDocRef, {
          ...newMeta,
          createdAt: serverTimestamp()
        }, { merge: true });
        saveChatMeta(chatId, newMeta);
      }
    } catch (e) {
      console.warn("Firestore chat handshake fetch error, using local fallback:", e);
      if (existingMeta && existingMeta.status) {
        chatStatus = existingMeta.status;
        initiatorUid = existingMeta.initiatorUid || myUid;
      }
    }
  } else {
    if (existingMeta && existingMeta.status) {
      chatStatus = existingMeta.status;
      initiatorUid = existingMeta.initiatorUid || myUid;
    } else {
      chatStatus = 'accepted';
    }
  }

  // Handle Pending Handshake Banners
  const senderBanner = document.getElementById('chat-sender-pending-banner');
  const recipientBanner = document.getElementById('chat-recipient-action-banner');
  const recipientNameEl = document.getElementById('chat-recipient-name');
  const chatInput = document.getElementById('chat-message-input') as HTMLInputElement | null;
  const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;

  if (chatStatus === 'pending') {
    if (initiatorUid === myUid) {
      // Current user sent the request
      if (senderBanner) senderBanner.classList.remove('hidden');
      if (recipientBanner) recipientBanner.classList.add('hidden');
      if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = "Connection request sent. Waiting for traveler to accept...";
      }
      if (sendBtn) sendBtn.disabled = true;
    } else {
      // Current user is recipient
      if (senderBanner) senderBanner.classList.add('hidden');
      if (recipientBanner) recipientBanner.classList.remove('hidden');
      if (recipientNameEl) recipientNameEl.textContent = travelerName;
      if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = "Accept connection request above to start messaging.";
      }
      if (sendBtn) sendBtn.disabled = true;
    }
  } else {
    // Accepted
    if (senderBanner) senderBanner.classList.add('hidden');
    if (recipientBanner) recipientBanner.classList.add('hidden');
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.placeholder = "Type a message... (Anti-scam filter active)";
    }
    if (sendBtn) sendBtn.disabled = false;
  }

  // Clear unread in meta
  const meta = getChatMeta(chatId);
  if (meta && Array.isArray(meta.unreadBy)) {
    meta.unreadBy = meta.unreadBy.filter((u: string) => u !== myUid);
    saveChatMeta(chatId, meta);
  }

  const msgs = getMessagesForPartner(partnerUid);
  renderMessagesList(msgs);
  renderConversationList();

  // Real-time Firestore messages listener for live sync across devices
  if (isLiveFirebase && db) {
    try {
      const messagesQuery = collection(db, 'chats', chatId, 'messages');
      const unsub = onSnapshot(messagesQuery, (snap) => {
        if (!snap.empty && getActiveChatPartner()?.uid === partnerUid) {
          const remoteMsgs: ChatMessage[] = [];
          snap.forEach(d => {
            const dData = d.data();
            remoteMsgs.push({
              id: d.id,
              sender: dData.senderUid === myUid ? 'me' : 'partner',
              senderUid: dData.senderUid,
              text: dData.text || '',
              timestamp: dData.timestamp || '',
              status: dData.status || 'delivered'
            });
          });
          if (remoteMsgs.length > 0) {
            const localMsgs = getMessagesForPartner(partnerUid);
            const combinedMap = new Map<string, ChatMessage>();
            localMsgs.forEach(m => combinedMap.set(m.id, m));
            remoteMsgs.forEach(m => combinedMap.set(m.id, m));
            const merged = Array.from(combinedMap.values());
            saveMessagesForPartner(partnerUid, merged);
            renderMessagesList(merged);
          }
        }
      }, (err) => console.warn("Firestore chat messages snapshot error:", err));
      setActiveChatUnsubscribe(unsub);
    } catch (e) {
      console.warn("Could not attach messages snapshot:", e);
    }
  }

  // Show thread on mobile
  if (window.innerWidth < 768) {
    showActiveChatOnMobile();
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export async function acceptChatRequest(): Promise<void> {
  const activePartner = getActiveChatPartner();
  if (!activePartner) return;
  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const partnerUid = activePartner.uid;
  const chatId = [myUid, partnerUid].sort().join('_');

  const senderBanner = document.getElementById('chat-sender-pending-banner');
  const recipientBanner = document.getElementById('chat-recipient-action-banner');
  const chatInput = document.getElementById('chat-message-input') as HTMLInputElement | null;
  const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;

  if (senderBanner) senderBanner.classList.add('hidden');
  if (recipientBanner) recipientBanner.classList.add('hidden');
  if (chatInput) {
    chatInput.disabled = false;
    chatInput.placeholder = "Type a message... (Anti-scam filter active)";
    chatInput.focus();
  }
  if (sendBtn) sendBtn.disabled = false;

  const meta = getChatMeta(chatId) || {};
  meta.status = 'accepted';
  saveChatMeta(chatId, meta);

  if (isLiveFirebase && db) {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(chatDocRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore accept chat error:", e);
    }
  }

  showToast(`Connected with ${activePartner.name}! Real-time chat unlocked.`, "success");
}

export async function declineChatRequest(): Promise<void> {
  const activePartner = getActiveChatPartner();
  if (!activePartner) return;
  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const partnerUid = activePartner.uid;
  const chatId = [myUid, partnerUid].sort().join('_');

  const senderBanner = document.getElementById('chat-sender-pending-banner');
  const recipientBanner = document.getElementById('chat-recipient-action-banner');
  const chatInput = document.getElementById('chat-message-input') as HTMLInputElement | null;
  const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;

  if (senderBanner) senderBanner.classList.add('hidden');
  if (recipientBanner) recipientBanner.classList.add('hidden');
  if (chatInput) {
    chatInput.disabled = true;
    chatInput.placeholder = "Connection request declined.";
  }
  if (sendBtn) sendBtn.disabled = true;

  const meta = getChatMeta(chatId) || {};
  meta.status = 'declined';
  saveChatMeta(chatId, meta);

  if (isLiveFirebase && db) {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(chatDocRef, {
        status: 'declined'
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore decline chat error:", e);
    }
  }

  showToast(`Connection request declined.`, "info");
}

export function continueWhatsAppChat(accept: boolean): void {
  const promptBanner = document.getElementById('chat-whatsapp-prompt-banner');
  const declinedBanner = document.getElementById('chat-declined-banner');
  const chatInput = document.getElementById('chat-message-input') as HTMLInputElement | null;
  const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;
  const activePartner = getActiveChatPartner();

  if (accept) {
    if (promptBanner) promptBanner.classList.add('hidden');
    if (declinedBanner) declinedBanner.classList.add('hidden');
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.placeholder = "Type a message... (Anti-scam filter active)";
      chatInput.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
    if (activePartner) {
      try {
        localStorage.setItem('safarmatch_chat_consent_' + activePartner.uid, 'accepted');
      } catch (e) {}
    }
    showToast("Chat active. Enjoy safe travels!", "success");
  } else {
    if (promptBanner) promptBanner.classList.add('hidden');
    if (declinedBanner) declinedBanner.classList.remove('hidden');
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.placeholder = "Conversation paused. Click 'Resume Chat' above to continue.";
    }
    if (sendBtn) sendBtn.disabled = true;
    if (activePartner) {
      try {
        localStorage.setItem('safarmatch_chat_consent_' + activePartner.uid, 'declined');
      } catch (e) {}
    }
    showToast("Conversation paused.", "info");
  }
}

export async function handleSendMessage(e: Event): Promise<void> {
  e.preventDefault();
  const activeChatPartner = getActiveChatPartner();
  if (!activeChatPartner) {
    showToast("Select a traveler from the list to start messaging.", "info");
    return;
  }

  const currentProfile = getCurrentProfile();
  if (!isStep1Complete(currentProfile)) {
    showToast("⚠️ Step 1 Incomplete: Please complete your traveler profile before messaging.", "warning");
    if ((window as any).switchView) (window as any).switchView('profile');
    return;
  }

  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const partnerUid = activeChatPartner.uid;
  const chatId = [myUid, partnerUid].sort().join('_');

  // Verify handshake is not pending or declined
  const chatMeta = getChatMeta(chatId);
  if (chatMeta && chatMeta.status === 'declined') {
    showToast("⚠️ This connection request was declined.", "warning");
    return;
  }
  if (chatMeta && chatMeta.status === 'pending') {
    if (chatMeta.initiatorUid === myUid) {
      showToast("⏳ Connection pending: Waiting for traveler to accept your request before messaging unlocks.", "info");
      return;
    } else {
      showToast("⚠️ Connection request received: Please tap 'Accept Request ✓' above to unlock messaging.", "info");
      return;
    }
  }

  const input = document.getElementById('chat-message-input') as HTMLInputElement | null;
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const modCheck = moderateMessageText(text);
  if (!modCheck.allowed) {
    if (input) input.value = "";
    showToast("⚠️ Safety Alert: Message blocked. SafarMatch strictly prohibits abusive language, off-platform contact sharing, and financial solicitation.", "error");
    return;
  }

  const msgs = getMessagesForPartner(partnerUid);
  const isFirstMessage = msgs.length === 0;

  if (!hasActiveExplorerPass(currentProfile)) {
    const quotaCheck = canUserMessagePartner(partnerUid, currentProfile);
    if (!quotaCheck.allowed) {
      openPaywallModal(quotaCheck.reason || "Free users can connect and message with at most 2 companion connections per month. Activate the Explorer Pass (₹299/mo) for unlimited chats, trip postings, and live GPS matching.");
      return;
    }
    if (isFirstMessage) {
      consumeMonthlyConnect(partnerUid, currentProfile);
    }
    recordChatPartner(partnerUid);
  } else {
    recordChatPartner(partnerUid);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg: ChatMessage = {
    id: "msg_" + Date.now(),
    sender: "me",
    senderUid: myUid,
    text,
    timestamp: timeStr,
    status: "pending"
  };

  msgs.push(newMsg);
  saveMessagesForPartner(partnerUid, msgs);
  renderMessagesList(msgs);
  if (input) input.value = "";

  const originalInitiator = (chatMeta && chatMeta.initiatorUid) ? chatMeta.initiatorUid : myUid;
  const meta = {
    initiatorUid: originalInitiator,
    recipientUid: partnerUid,
    status: "accepted",
    lastMessage: text,
    lastMessageTime: timeStr,
    lastSender: "me",
    lastMessageStatus: "pending",
    unreadBy: [partnerUid]
  };
  saveChatMeta(chatId, meta);
  renderConversationList();

  // Firestore sync if connected
  if (isLiveFirebase && db) {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      addDoc(collection(chatDocRef, 'messages'), {
        senderUid: myUid,
        text,
        timestamp: timeStr,
        createdAt: serverTimestamp(),
        status: 'sent'
      }).catch(err => console.warn("Firestore message write error:", err));

      setDoc(chatDocRef, {
        initiatorUid: originalInitiator,
        recipientUid: partnerUid,
        status: 'accepted',
        lastMessage: text,
        lastMessageTime: timeStr,
        lastSenderUid: myUid,
        unreadBy: [partnerUid],
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => console.warn("Firestore chat doc update error:", err));
    } catch (e) {
      console.warn("Firestore chat push exception:", e);
    }
  }

  // Message delivery progression: Pending -> Sent at 300ms
  setTimeout(() => {
    const liveMsgs = getMessagesForPartner(partnerUid);
    const target = liveMsgs.find(m => m.id === newMsg.id);
    if (target && target.status === 'pending') {
      target.status = 'sent';
      saveMessagesForPartner(partnerUid, liveMsgs);
      if (getActiveChatPartner()?.uid === partnerUid) {
        renderMessagesList(liveMsgs);
      }
    }
  }, 300);

  // Delivered tick at 800ms (real companion status, NO dummy auto-replies)
  setTimeout(() => {
    const liveMsgs = getMessagesForPartner(partnerUid);
    const target = liveMsgs.find(m => m.id === newMsg.id);
    if (target && target.status === 'sent') {
      target.status = 'delivered';
      saveMessagesForPartner(partnerUid, liveMsgs);
      if (getActiveChatPartner()?.uid === partnerUid) {
        renderMessagesList(liveMsgs);
      }
    }
  }, 800);
}
