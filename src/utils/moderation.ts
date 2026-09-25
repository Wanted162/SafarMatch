/**
 * SafarMatch — Message & Content Moderation Engine
 * Anti-bypass filter blocking profanity, Indian phone numbers, UPI handles, and external contact exchange.
 */

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

export function moderateMessageText(text: string): ModerationResult {
  if (!text || typeof text !== 'string') return { allowed: true };

  const genericBlockedMessage = "Message blocked. SafarMatch strictly prohibits abusive language, off-platform contact sharing, and financial solicitation.";

  // 1. Vulgarity / Abusive / Sexually Explicit Slang (English & Hindi / Hinglish)
  const abusivePatterns = [
    /\b(fuck|fucking|fucker|shit|bitch|bastard|asshole|cunt|dick|pussy|boobs|tits|nude|nudes|hookup|escort|prostitute|porn|xxx|slut|whore|rape)\b/i,
    /\b(chut|chutiya|choot|lund|lauda|loda|gaand|gand|bhenchod|behenchod|benchod|madarchod|madarchodh|bsdk|bhosdike|bhosadi|randi|raand|harami|kamina)\b/i,
    /(?:^|\s)(bc|mc|bsdk)(?:\s|$|[!?,.])/i
  ];
  for (const pat of abusivePatterns) {
    if (pat.test(text)) {
      return { allowed: false, reason: genericBlockedMessage };
    }
  }

  // 2. Indian Phone numbers (10+ digits with spaces, dashes, dots, +91, 0 prefix)
  const phoneDigits = text.replace(/\D/g, '');
  if (phoneDigits.length >= 10) {
    if (/(?:(?:\+|0{0,2})91[\s-]*)?[6789]\d{9}/.test(phoneDigits) || /(?:^|\D)[6789]\d{9}(?:\D|$)/.test(phoneDigits)) {
      return { allowed: false, reason: genericBlockedMessage };
    }
  }

  if (/[6-9][\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d[\s.,\-_*]{1,3}\d/.test(text)) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  // 3. Spelled-out numbers (English & Hindi)
  const numWordPattern = /(?:zero|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|chaar|paanch|chhe|saat|aath|nau|double|triple)/i;
  const wordTokens = text.toLowerCase().split(/[\s,\-_.]+/).filter(Boolean);
  let numWordCount = 0;
  for (const tok of wordTokens) {
    if (numWordPattern.test(tok)) {
      numWordCount++;
      if (numWordCount >= 3) {
        return { allowed: false, reason: genericBlockedMessage };
      }
    } else {
      numWordCount = 0;
    }
  }

  // 4. Indian UPI VPAs & Payment Handles
  const upiRegex = /[a-zA-Z0-9._-]+@(upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|barodampay|postbank|federal)/i;
  if (upiRegex.test(text) || /(gpay|phonepe|paytm)\s*[:=]\s*[a-zA-Z0-9]/i.test(text)) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  // 5. Social handles & external links
  const socialRegex = /(wa\.me|t\.me|telegram|whatsapp|instagram|snapchat|facebook|fb\.me|tiktok|twitter\.com|x\.com|https?:\/\/|www\.)/i;
  if (socialRegex.test(text) || /(?:insta|snap|fb)\s*[:@]\s*[a-zA-Z0-9_.]+/i.test(text) || /@[a-zA-Z0-9_]{3,}/.test(text)) {
    return { allowed: false, reason: genericBlockedMessage };
  }

  return { allowed: true };
}
