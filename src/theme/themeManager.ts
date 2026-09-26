/**
 * SafarMatch — Tri-Mode Theme Manager
 * Controls 'light', 'safarbloom' (pleasantly balanced twilight bloom), and 'dark'.
 * Persists user choice in both SameSite=Strict cookies and localStorage across all devices.
 */

import { setCookie, getCookie } from '../utils/cookieUtils';

export type ThemeMode = 'light' | 'safarbloom' | 'dark';

const THEME_STORAGE_KEY = 'safarmatch_theme';
const THEME_COOKIE_NAME = 'safarmatch_theme';

export const THEME_CONFIGS: Record<ThemeMode, { name: string; icon: string; emoji: string; desc: string }> = {
  light: {
    name: 'Daylight',
    icon: 'sun',
    emoji: '☀️',
    desc: 'Clean, crisp daylight travel view'
  },
  safarbloom: {
    name: 'SafarBloom',
    icon: 'sparkles',
    emoji: '🌸',
    desc: 'Balanced twilight bloom — gentle on the eyes with soothing rose hues'
  },
  dark: {
    name: 'Midnight',
    icon: 'moon',
    emoji: '🌙',
    desc: 'Deep obsidian night mode for stargazers'
  }
};

/**
 * Retrieve saved theme preference. Defaults to 'safarbloom' for optimal visual comfort.
 */
export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'safarbloom';

  try {
    const fromCookie = getCookie(THEME_COOKIE_NAME) as ThemeMode | null;
    if (fromCookie && (fromCookie === 'light' || fromCookie === 'safarbloom' || fromCookie === 'dark')) {
      return fromCookie;
    }

    const fromStorage = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (fromStorage && (fromStorage === 'light' || fromStorage === 'safarbloom' || fromStorage === 'dark')) {
      return fromStorage;
    }
  } catch (e) {
    console.warn("Theme read warning:", e);
  }

  // Default to SafarBloom mode
  return 'safarbloom';
}

/**
 * Apply the selected theme to the DOM and persist across storage & cookies.
 */
export function setTheme(theme: ThemeMode, notify = false): void {
  if (typeof document === 'undefined') return;

  const validTheme: ThemeMode = (theme === 'light' || theme === 'dark' || theme === 'safarbloom') 
    ? theme 
    : 'safarbloom';

  // Apply to root elements
  document.documentElement.setAttribute('data-theme', validTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', validTheme);
  }

  // Save to Cookie (1 year duration, SameSite=Strict)
  try {
    setCookie(THEME_COOKIE_NAME, validTheme, 365, 'Strict');
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  } catch (e) {
    console.warn("Theme save error:", e);
  }

  // Update UI Switcher states
  updateThemeSwitcherUI(validTheme);

  // Re-hydrate Lucide icons if available
  if ((window as any).lucide?.createIcons) {
    try {
      (window as any).lucide.createIcons();
    } catch (e) {}
  }

  if (notify && (window as any).showToast) {
    const config = THEME_CONFIGS[validTheme];
    (window as any).showToast(`${config.emoji} Switched to ${config.name} Mode (${config.desc})`, "info");
  }
}

/**
 * Cycles between the three modes: Light -> SafarBloom -> Dark -> Light
 */
export function cycleTheme(): ThemeMode {
  const current = getSavedTheme();
  let next: ThemeMode = 'safarbloom';
  if (current === 'light') next = 'safarbloom';
  else if (current === 'safarbloom') next = 'dark';
  else next = 'light';

  setTheme(next, true);
  return next;
}

/**
 * Synchronize all theme toggle buttons and indicators in the DOM.
 */
export function updateThemeSwitcherUI(activeTheme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const themes: ThemeMode[] = ['light', 'safarbloom', 'dark'];

  themes.forEach(t => {
    // Top nav segment buttons
    const btns = document.querySelectorAll(`[data-theme-btn="${t}"]`);
    btns.forEach(btn => {
      const el = btn as HTMLElement;
      if (t === activeTheme) {
        el.classList.add('bg-white', 'text-rose-600', 'shadow-xs', 'font-bold');
        el.classList.remove('text-slate-500', 'hover:text-slate-800');
        if (t === 'safarbloom') {
          el.style.backgroundColor = '#fb7185';
          el.style.color = '#ffffff';
        } else if (t === 'dark') {
          el.style.backgroundColor = '#1e293b';
          el.style.color = '#f8fafc';
        } else {
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#0f172a';
        }
      } else {
        el.classList.remove('bg-white', 'text-rose-600', 'shadow-xs', 'font-bold');
        el.classList.add('text-slate-500');
        el.style.backgroundColor = 'transparent';
        el.style.color = '';
      }
    });

    // Sidebar theme radio options
    const sidebarBtns = document.querySelectorAll(`[data-sidebar-theme="${t}"]`);
    sidebarBtns.forEach(btn => {
      const el = btn as HTMLElement;
      if (t === activeTheme) {
        el.classList.add('border-rose-500', 'ring-2', 'ring-rose-400/30', 'bg-rose-50/50');
      } else {
        el.classList.remove('border-rose-500', 'ring-2', 'ring-rose-400/30', 'bg-rose-50/50');
      }
    });
  });

  // Update quick cycle button icon/emoji if present
  const quickIndicator = document.getElementById('theme-quick-indicator');
  if (quickIndicator) {
    quickIndicator.textContent = THEME_CONFIGS[activeTheme].emoji;
  }
}

/**
 * Initialize theme listeners and apply saved theme immediately.
 */
export function initTheme(): void {
  const initialTheme = getSavedTheme();
  setTheme(initialTheme, false);

  // Set up global click delegation for any [data-set-theme] buttons
  if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-set-theme]') as HTMLElement | null;
      if (target) {
        const theme = target.getAttribute('data-set-theme') as ThemeMode | null;
        if (theme && (theme === 'light' || theme === 'safarbloom' || theme === 'dark')) {
          setTheme(theme, true);
        }
      }
    });
  }
}
