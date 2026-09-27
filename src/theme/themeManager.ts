/**
 * SafarMatch — Permanent Bloom Visual System
 * Dark and light modes have been removed completely.
 * The application operates exclusively with the signature soothing Bloom palette.
 */

export type ThemeMode = 'safarbloom';

export function getSavedTheme(): ThemeMode {
  return 'safarbloom';
}

export function setTheme(_theme?: string, _notify = false): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', 'safarbloom');
  if (document.body) {
    document.body.setAttribute('data-theme', 'safarbloom');
  }
}

export function initTheme(): void {
  setTheme('safarbloom');
}

export function cycleTheme(): ThemeMode {
  setTheme('safarbloom');
  return 'safarbloom';
}

export function updateThemeSwitcherUI(_activeTheme?: string): void {
  // Theme switcher is omitted since Bloom is the unified permanent palette
}
