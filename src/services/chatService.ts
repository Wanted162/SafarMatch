/**
 * SafarMatch — Real-Time Chat Service
 * Handles direct messaging, Firestore sync, WhatsApp delivery ticks (sent/delivered/read),
 * simulated travel companion auto-replies, and message state.
 */

import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isLiveFirebase } from '../config/firebase';
import { STORAGE_KEYS } from '../utils/storage';
import { moderateMessageText } from '../utils/moderation';
import { showToast } from '../utils/toast';
import { hasActiveExplorerPass, getMonthlyConnects, consumeMonthlyConnect, openPaywallModal } from './paymentService';
import { DEFAULT_AVATAR } from './profileService';
import type { Traveler, UserProfile, ChatMessage, ChatMetadata } from '../types';

let activeChatPartner: Traveler | null = null;
let activeChatUnsubscribe: (() => void) | null = null;
let activeChatDocUnsubscribe: (() => void) | null = null;
let globalChatsUnsubscribe: (() => void) | null = null;

export function getActiveChatPartner(): Traveler | null {
  return activeChatPartner;
}

export function setActiveChatPartner(partner: Traveler | null): void {
  activeChatPartner = partner;
}

export function getExistingChatPartnerIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_PARTNERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function recordChatPartner(partnerUid: string): void {
  if (!partnerUid) return;
  try {
    const list = getExistingChatPartnerIds();
    if (!list.includes(partnerUid)) {
      list.push(partnerUid);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_PARTNERS, JSON.stringify(list));
    }
  } catch (e) {}
}

export function getChatMeta(chatId: string): any {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATMETA_PREFIX + chatId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveChatMeta(chatId: string, data: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHATMETA_PREFIX + chatId, JSON.stringify(data));
  } catch (e) {}
}

export function getAllChatMetas(): Record<string, any> {
  const res: Record<string, any> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_KEYS.CHATMETA_PREFIX)) {
        const id = k.replace(STORAGE_KEYS.CHATMETA_PREFIX, '');
        try {
          res[id] = JSON.parse(localStorage.getItem(k) || '{}');
        } catch (e) {}
      }
    }
  } catch (e) {}
  return res;
}

export function getMessagesForPartner(partnerUid: string): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES_PREFIX + partnerUid);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

export function saveMessagesForPartner(partnerUid: string, msgs: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES_PREFIX + partnerUid, JSON.stringify(msgs));
  } catch (e) {
    console.error("Error saving messages:", e);
  }
}

export function isMessageFromMe(msg: any, myUid: string, partnerUid: string): boolean {
  if (msg.sender === 'partner') return false;
  if (msg.senderUid === partnerUid) return false;
  if (msg.senderUid && msg.senderUid === myUid) return true;
  if (msg.sender === 'me') return true;
  return false;
}

export function cleanupChatListeners(): void {
  if (activeChatUnsubscribe) {
    try { activeChatUnsubscribe(); } catch (e) {}
    activeChatUnsubscribe = null;
  }
  if (activeChatDocUnsubscribe) {
    try { activeChatDocUnsubscribe(); } catch (e) {}
    activeChatDocUnsubscribe = null;
  }
}
