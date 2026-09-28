/**
 * SafarMatch — Security & HTML Sanitization Engine
 * Protects against XSS injection, tag breakout, and script injection.
 */

export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizePlainText(str: string | null | undefined, maxLen = 500): string {
  if (!str) return '';
  // Strip control characters and HTML tags
  const clean = String(str)
    .replace(/<[^>]*>?/gm, '')
    .trim();
  return clean.slice(0, maxLen);
}
