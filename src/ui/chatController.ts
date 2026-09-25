/**
 * SafarMatch — Real-Time Chat UI Controller
 * Manages conversational threads, WhatsApp-inspired message bubbles & ticks,
 * mobile responsive split panel, theme switcher, and message input handling.
 */

import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS } from '../utils/storage';
import { moderateMessageText } from '../utils/moderation';
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
  cleanupChatListeners
} from '../services/chatService';
import { getAllTravelers } from '../services/travelerService';
import { getCurrentProfile, DEFAULT_AVATAR } from '../services/profileService';
import { hasActiveExplorerPass, getMonthlyConnects, consumeMonthlyConnect, openPaywallModal } from '../services/paymentService';
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

export function toggleChatThemeDropdown(e?: Event): void {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('chat-theme-dropdown');
  if (!dropdown) return;
  if (dropdown.classList.contains('hidden')) {
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
  const container = document.getElementById('chat-conversation-items');
  if (!container) return;

  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const activeChatPartner = getActiveChatPartner();

  const allList = getAllTravelers().length > 0 ? getAllTravelers() : (SEED_INDIAN_TRAVELERS as unknown as Traveler[]);
  const otherTravelers = allList.filter(t => t.uid !== myUid);

  let travelers = otherTravelers;
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
      <div class="text-center py-10 px-4 text-slate-400 text-xs">
        <p class="font-medium">No conversations found</p>
      </div>
    `;
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
            <p class="text-xs leading-relaxed break-words whitespace-pre-wrap">${m.text}</p>
            <div class="flex items-center justify-end space-x-1 mt-0.5">
              <span class="text-[9px] text-emerald-100 opacity-80">${m.timestamp || ''}</span>
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
            <p class="text-xs leading-relaxed break-words whitespace-pre-wrap">${m.text}</p>
            <div class="flex items-center justify-end space-x-1 mt-0.5">
              <span class="text-[9px] text-slate-400">${m.timestamp || ''}</span>
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

  // Update Chat Header Bar
  const headerAvatar = document.getElementById('chat-partner-avatar') as HTMLImageElement | null;
  const headerName = document.getElementById('chat-partner-name');
  const headerCircuit = document.getElementById('chat-partner-circuit');
  const headerBadge = document.getElementById('chat-partner-badge');

  if (headerAvatar) headerAvatar.src = traveler.photoUrl || traveler.photo || DEFAULT_AVATAR;
  if (headerName) headerName.textContent = traveler.name || 'Traveler';
  if (headerCircuit) headerCircuit.textContent = `${traveler.upcomingCircuit || traveler.currentCircuit || 'India'} Circuit • Active Now`;

  if (headerBadge) {
    if (traveler.verificationStatus === 'verified' || traveler.verified) {
      headerBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1";
      headerBadge.innerHTML = `<i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i> Verified`;
    } else {
      headerBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1";
      headerBadge.innerHTML = `⚪ Unverified`;
    }
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

  // Show thread on mobile
  if (window.innerWidth < 768) {
    showActiveChatOnMobile();
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export async function handleSendMessage(e: Event): Promise<void> {
  e.preventDefault();
  const activeChatPartner = getActiveChatPartner();
  if (!activeChatPartner) {
    showToast("Select a traveler from the list to start messaging.", "info");
    return;
  }

  const currentProfile = getCurrentProfile();
  const myUid = currentProfile ? currentProfile.uid : 'guest';
  const partnerUid = activeChatPartner.uid;
  const chatId = [myUid, partnerUid].sort().join('_');

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

  if (isFirstMessage && !hasActiveExplorerPass(currentProfile)) {
    const remaining = getMonthlyConnects();
    if (remaining <= 0) {
      openPaywallModal("You've used your 2 free companion connects for this month! Activate the Explorer Pass (₹299/mo) for unlimited chats, trip postings, and live GPS matching.");
      return;
    }
    consumeMonthlyConnect(currentProfile);
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

  const meta = {
    initiatorUid: myUid,
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

  // Tick progression: Pending -> Sent at 400ms
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
  }, 400);

  // Delivered at 1000ms
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
  }, 1000);

  // Read at 1800ms
  setTimeout(() => {
    const liveMsgs = getMessagesForPartner(partnerUid);
    liveMsgs.forEach(m => {
      if (m.sender === 'me') m.status = 'read';
    });
    saveMessagesForPartner(partnerUid, liveMsgs);
    if (getActiveChatPartner()?.uid === partnerUid) {
      renderMessagesList(liveMsgs);
    }
  }, 1800);

  // Contextual simulated reply
  setTimeout(() => {
    const liveMsgs = getMessagesForPartner(partnerUid);
    const replyText = `Hey! Thanks for reaching out about traveling together. Let's coordinate our itinerary!`;
    const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    liveMsgs.push({
      id: "reply_" + Date.now(),
      sender: "partner",
      senderUid: partnerUid,
      text: replyText,
      timestamp: replyTime,
      status: "read"
    });
    saveMessagesForPartner(partnerUid, liveMsgs);
    if (getActiveChatPartner()?.uid === partnerUid) {
      renderMessagesList(liveMsgs);
    }
    renderConversationList();
  }, 2800);
}
