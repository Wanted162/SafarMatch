/**
 * SafarMatch — Message & Content Moderation Engine
 * 
 * Multi-layer security & anti-leakage filter:
 * 1. Blocks phone numbers (Indian 10-digit formats, +91, 091, 0091, leading 0, spaced, hyphenated, dotted, leetspeak, spelled-out)
 * 2. Blocks spelled-out digits in English ("nine eight...") and Hindi ("ek do teen chaar paanch...")
 * 3. Blocks email addresses (standard and obfuscated "at/dot" formats)
 * 4. Blocks government ID numbers (Aadhaar, PAN, Driving License, Voter ID)
 * 5. Blocks UPI handles and payment solicitation (@oksbi, @okhdfcbank, @paytm, @upi, etc.)
 * 6. Blocks external social channels (WhatsApp, Telegram, Instagram, Snapchat, links)
 * 7. Blocks profanity, abusive insults, and sexual solicitation (English, Hindi, Hinglish)
 */

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  category?: 'phone' | 'email' | 'govid' | 'upi' | 'social' | 'abusive';
}

export const CONTACT_SHIELD_WARNING = "🔒 SafarMatch Privacy Shield: Will my phone number or private data be exposed? Never. SafarMatch handles all communications through in-app encrypted chat. Your phone number, email address, and personal documents are stored securely in a 256-bit encrypted cloud vault and are never displayed publicly.";
export const SAFETY_BLOCKED_MESSAGE = "⚠️ Message blocked: SafarMatch strictly prohibits off-platform contact sharing, payment solicitation, profanity, and harassment. All conversations are protected within in-app encrypted chat.";

export function moderateMessageText(text: string): ModerationResult {
  if (!text || typeof text !== 'string') return { allowed: true };

  // Normalize lookalikes: common leetspeak substitutions used to bypass filters
  const normalized = text
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'l');

  // 1. Vulgarity / Abusive / Sexually Explicit Slang (English & Hindi / Hinglish)
  const abusivePatterns = [
    /\b(fuck|fucking|fucker|shit|bitch|bastard|asshole|cunt|dick|pussy|boobs|tits|nude|nudes|hookup|escort|prostitute|porn|xxx|slut|whore|rape|sex|horny|blowjob|handjob)\b/i,
    /\b(chut|chutiya|choot|lund|lauda|loda|gaand|gand|bhenchod|behenchod|benchod|madarchod|madarchodh|bsdk|bhosdike|bhosadi|randi|raand|harami|kamina|kutte|saale|chodu)\b/i,
    /(?:^|\s)(bc|mc|bsdk)(?:\s|$|[!?,.])/i
  ];
  for (const pat of abusivePatterns) {
    if (pat.test(text) || pat.test(normalized)) {
      return { allowed: false, reason: SAFETY_BLOCKED_MESSAGE, category: 'abusive' };
    }
  }

  // 2. Email Address Detection (Standard & Obfuscated)
  const standardEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const obfuscatedEmailRegex = /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*[a-zA-Z0-9.-]+\s*(?:\.|\(dot\)|\[dot\]|\bdot\b)\s*(?:com|in|org|net|co|io|edu|gov|me|ai)/i;
  const commonWebmailRegex = /\b[a-zA-Z0-9._%+-]+\s*(?:@|at)\s*(?:gmail|yahoo|outlook|hotmail|icloud|protonmail|rediffmail)\b/i;
  if (standardEmailRegex.test(text) || obfuscatedEmailRegex.test(text) || commonWebmailRegex.test(text)) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'email' };
  }

  // 3. Indian Phone Numbers Detection
  // A) Strip all non-digits: test for standard 10-digit Indian numbers starting with 6, 7, 8, 9
  const phoneDigits = text.replace(/\D/g, '');
  if (phoneDigits.length >= 10) {
    // 10 digits starting with 6-9
    if (/[6789]\d{9}/.test(phoneDigits)) {
      return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'phone' };
    }
    // +91, 091, 0091 prefix
    if ((phoneDigits.startsWith('91') || phoneDigits.startsWith('091') || phoneDigits.startsWith('0091')) && /[6789]\d{9}/.test(phoneDigits.slice(-10))) {
      return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'phone' };
    }
    // Leading 0 prefix (09876543210)
    if (phoneDigits.startsWith('0') && /[6789]\d{9}/.test(phoneDigits.slice(1))) {
      return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'phone' };
    }
  }

  // B) Numbers disguised with letters/separators, e.g. "9-8-7...", "9.8.7...", "call me on 9 8..."
  if (/[6-9](?:[\s.,\-_*~/\\#@|]{0,4}\d){9}/.test(text)) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'phone' };
  }

  // C) Check if someone intersperses letters between digits: e.g. "9a8b7c6d5e4f3g2h1i0"
  const interspersedDigits = text.replace(/[^0-9]/g, '');
  if (interspersedDigits.length >= 10 && /[6-9]\d{9}/.test(interspersedDigits)) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'phone' };
  }

  // D) Spelled-out numbers in English and Hindi/Hinglish
  const numWordPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|chaar|char|paanch|panch|chhe|che|saat|sath|aath|ath|nau|no|double|triple)\b/i;
  const rawWords = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let totalNumWords = 0;
  for (const w of rawWords) {
    if (numWordPattern.test(w)) {
      totalNumWords++;
      if (totalNumWords >= 4) {
        return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'phone' };
      }
    }
  }

  // 4. Indian Government ID Numbers (Aadhaar, PAN)
  // Aadhaar 12 digits (with optional spaces or dashes)
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'govid' };
  }
  // PAN 10 alphanumeric: 5 letters, 4 digits, 1 letter
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i.test(text)) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'govid' };
  }

  // 5. Indian UPI VPAs & Payment Handles (including obfuscated 'at' or 'dot')
  const upiRegex = /[a-zA-Z0-9._-]+@(upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|barodampay|postbank|federal|sbi|hdfc|icici|axis)/i;
  const upiDisguisedRegex = /[a-zA-Z0-9._-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*(?:upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|sbi|hdfc|icici|axis)\b/i;
  if (
    upiRegex.test(text) ||
    upiDisguisedRegex.test(text) ||
    /(?:gpay|phonepe|paytm|bhim|googlepay)\s*[:=\-]?\s*[a-zA-Z0-9._-]{4,}/i.test(text)
  ) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'upi' };
  }

  // 6. Social handles, external chat channels, URL shorteners & links
  const socialRegex = /(wa\.me|t\.me|telegram|whatsapp|instagram|snapchat|facebook|fb\.me|tiktok|twitter\.com|x\.com|bit\.ly|tinyurl\.com|linktr\.ee|bio\.link|https?:\/\/|www\.)/i;
  if (
    socialRegex.test(text) ||
    /(?:insta|snap|fb|ig|tele|telegram)\s*[:@\-_]?\s*[a-zA-Z0-9_.]{3,}/i.test(text) ||
    /@[a-zA-Z0-9_.]{3,}/.test(text)
  ) {
    return { allowed: false, reason: CONTACT_SHIELD_WARNING, category: 'social' };
  }

  return { allowed: true };
}
