/**
 * SafarMatch — Message & Content Moderation Engine
 * Anti-bypass filter blocking profanity, Indian phone numbers, UPI handles, URL shorteners, and external contact exchange.
 */

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

export function moderateMessageText(text: string): ModerationResult {
  if (!text || typeof text !== 'string') return { allowed: true };

  const genericBlockedMessage = "Message blocked. SafarMatch strictly prohibits abusive language, off-platform contact sharing, and financial solicitation.";

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
      return { allowed: false, reason: genericBlockedMessage };
    }
  }

  // 2. Indian Phone numbers detection
  // A) Strip all non-digits: test for standard 10-digit Indian numbers starting with 6, 7, 8, 9
  const phoneDigits = text.replace(/\D/g, '');
  if (phoneDigits.length >= 10) {
    if (/[6789]\d{9}/.test(phoneDigits)) {
      return { allowed: false, reason: genericBlockedMessage };
    }
    if (phoneDigits.length >= 10 && (phoneDigits.startsWith('91') || phoneDigits.startsWith('091') || phoneDigits.startsWith('0091'))) {
      return { allowed: false, reason: genericBlockedMessage };
    }
  }

  // B) Numbers disguised with letters/separators, e.g. "9eight7...", "9-8-7...", "9.8.7...", "call me on 9 8..."
  if (/[6-9](?:[\s.,\-_*~/\\#@|]{0,4}\d){9}/.test(text)) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  // C) Check if someone intersperses letters between digits: e.g. "9a8b7c6d5e4f3g2h1i0"
  const interspersedDigits = text.replace(/[^0-9]/g, '');
  if (interspersedDigits.length >= 10 && /[6-9]\d{9}/.test(interspersedDigits)) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  // 3. Spelled-out numbers (English & Hindi)
  const numWordPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|chaar|paanch|chhe|saat|aath|nau|double|triple)\b/i;
  const rawWords = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let totalNumWords = 0;
  for (const w of rawWords) {
    if (numWordPattern.test(w)) {
      totalNumWords++;
      if (totalNumWords >= 4) {
        return { allowed: false, reason: genericBlockedMessage };
      }
    }
  }

  // 4. Indian UPI VPAs & Payment Handles (including obfuscated 'at' or 'dot')
  const upiRegex = /[a-zA-Z0-9._-]+@(upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|barodampay|postbank|federal)/i;
  const upiDisguisedRegex = /[a-zA-Z0-9._-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*(?:upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|sbi|hdfc|icici)\b/i;
  if (
    upiRegex.test(text) ||
    upiDisguisedRegex.test(text) ||
    /(?:gpay|phonepe|paytm|bhim|googlepay)\s*[:=\-]?\s*[a-zA-Z0-9._-]{4,}/i.test(text)
  ) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  // 5. Social handles, external chat channels, URL shorteners & links
  const socialRegex = /(wa\.me|t\.me|telegram|whatsapp|instagram|snapchat|facebook|fb\.me|tiktok|twitter\.com|x\.com|bit\.ly|tinyurl\.com|linktr\.ee|bio\.link|https?:\/\/|www\.)/i;
  if (
    socialRegex.test(text) ||
    /(?:insta|snap|fb|ig|tele|telegram)\s*[:@\-_]?\s*[a-zA-Z0-9_.]{3,}/i.test(text) ||
    /@[a-zA-Z0-9_.]{3,}/.test(text)
  ) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  return { allowed: true };
}
