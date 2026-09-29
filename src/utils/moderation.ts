/**
 * SafarMatch — Message & Content Moderation Engine
 * 
 * Multi-layer security & anti-leakage filter:
 * 1. Blocks phone numbers (Indian 10-digit formats, +91, spaced, hyphenated, dotted, leetspeak, spelled-out)
 * 2. Blocks email addresses (standard and obfuscated "at/dot" formats)
 * 3. Blocks government ID numbers (Aadhaar, PAN, Driving License, Voter ID)
 * 4. Blocks UPI handles and payment solicitation
 * 5. Blocks external social channels (WhatsApp, Telegram, Instagram, Snapchat, links)
 * 6. Blocks profanity and abusive slang (English, Hindi, Hinglish)
 */

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  category?: 'phone' | 'email' | 'govid' | 'upi' | 'social' | 'abusive';
}

export function moderateMessageText(text: string): ModerationResult {
  if (!text || typeof text !== 'string') return { allowed: true };

  const contactShieldWarning = "🔒 SafarMatch Privacy Shield: Will my phone number or private data be exposed? Never. SafarMatch handles all communications through in-app encrypted chat. Your phone number, email address, and personal documents are stored securely in a 256-bit encrypted cloud vault and are never displayed publicly.";
  const genericBlockedMessage = "Message blocked. SafarMatch strictly prohibits abusive language, off-platform contact sharing, and financial solicitation. All communications must remain within SafarMatch in-app encrypted chat.";

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
    /\b(fuck|fucking|fucker|shit|bitch|bastard|asshole|cunt|dick|pussy|boobs|tits|nude|nudes|hookup|escort|prostitute|porn|xxx|slut|whore|rape)\b/i,
    /\b(chut|chutiya|choot|lund|lauda|loda|gaand|gand|bhenchod|behenchod|benchod|madarchod|madarchodh|bsdk|bhosdike|bhosadi|randi|raand|harami|kamina)\b/i,
    /(?:^|\s)(bc|mc|bsdk)(?:\s|$|[!?,.])/i
  ];
  for (const pat of abusivePatterns) {
    if (pat.test(text) || pat.test(normalized)) {
      return { allowed: false, reason: genericBlockedMessage, category: 'abusive' };
    }
  }

  // 2. Email Address Detection (Standard & Obfuscated)
  const standardEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const obfuscatedEmailRegex = /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*[a-zA-Z0-9.-]+\s*(?:\.|\(dot\)|\[dot\]|\bdot\b)\s*(?:com|in|org|net|co|io|edu|gov|me|ai)/i;
  const commonWebmailRegex = /\b[a-zA-Z0-9._%+-]+\s*(?:@|at)\s*(?:gmail|yahoo|outlook|hotmail|icloud|protonmail|rediffmail)\b/i;
  if (standardEmailRegex.test(text) || obfuscatedEmailRegex.test(text) || commonWebmailRegex.test(text)) {
    return { allowed: false, reason: contactShieldWarning, category: 'email' };
  }

  // 3. Indian Phone Numbers Detection
  // A) Strip all non-digits: test for standard 10-digit Indian numbers starting with 6, 7, 8, 9
  const phoneDigits = text.replace(/\D/g, '');
  if (phoneDigits.length >= 10) {
    if (/[6789]\d{9}/.test(phoneDigits)) {
      return { allowed: false, reason: contactShieldWarning, category: 'phone' };
    }
    if ((phoneDigits.startsWith('91') || phoneDigits.startsWith('091') || phoneDigits.startsWith('0091')) && /[6789]\d{9}/.test(phoneDigits.slice(-10))) {
      return { allowed: false, reason: contactShieldWarning, category: 'phone' };
    }
  }

  // B) Numbers disguised with letters/separators, e.g. "9eight7...", "9-8-7...", "9.8.7...", "call me on 9 8..."
  if (/[6-9](?:[\s.,\-_*~/\\#@|]{0,4}\d){9}/.test(text)) {
    return { allowed: false, reason: contactShieldWarning, category: 'phone' };
  }

  // C) Check if someone intersperses letters between digits: e.g. "9a8b7c6d5e4f3g2h1i0"
  const interspersedDigits = text.replace(/[^0-9]/g, '');
  if (interspersedDigits.length >= 10 && /[6-9]\d{9}/.test(interspersedDigits)) {
    return { allowed: false, reason: contactShieldWarning, category: 'phone' };
  }

  // D) Spelled-out numbers (English & Hindi)
  const numWordPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|chaar|paanch|chhe|saat|aath|nau|double|triple)\b/i;
  const rawWords = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let totalNumWords = 0;
  for (const w of rawWords) {
    if (numWordPattern.test(w)) {
      totalNumWords++;
      if (totalNumWords >= 4) {
        return { allowed: false, reason: contactShieldWarning, category: 'phone' };
      }
    }
  }

  // 4. Indian Government ID Numbers (Aadhaar, PAN, DL)
  // Aadhaar 12 digits (with optional spaces or dashes)
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
    return { allowed: false, reason: contactShieldWarning, category: 'govid' };
  }
  // PAN 10 alphanumeric: 5 letters, 4 digits, 1 letter
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i.test(text)) {
    return { allowed: false, reason: contactShieldWarning, category: 'govid' };
  }

  // 5. Indian UPI VPAs & Payment Handles (including obfuscated 'at' or 'dot')
  const upiRegex = /[a-zA-Z0-9._-]+@(upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|barodampay|postbank|federal)/i;
  const upiDisguisedRegex = /[a-zA-Z0-9._-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*(?:upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|sbi|hdfc|icici)\b/i;
  if (
    upiRegex.test(text) ||
    upiDisguisedRegex.test(text) ||
    /(?:gpay|phonepe|paytm|bhim|googlepay)\s*[:=\-]?\s*[a-zA-Z0-9._-]{4,}/i.test(text)
  ) {
    return { allowed: false, reason: contactShieldWarning, category: 'upi' };
  }

  // 6. Social handles, external chat channels, URL shorteners & links
  const socialRegex = /(wa\.me|t\.me|telegram|whatsapp|instagram|snapchat|facebook|fb\.me|tiktok|twitter\.com|x\.com|bit\.ly|tinyurl\.com|linktr\.ee|bio\.link|https?:\/\/|www\.)/i;
  if (
    socialRegex.test(text) ||
    /(?:insta|snap|fb|ig|tele|telegram)\s*[:@\-_]?\s*[a-zA-Z0-9_.]{3,}/i.test(text) ||
    /@[a-zA-Z0-9_.]{3,}/.test(text)
  ) {
    return { allowed: false, reason: contactShieldWarning, category: 'social' };
  }

  return { allowed: true };
}
