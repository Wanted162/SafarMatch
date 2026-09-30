/**
 * SafarMatch — Global Dark/Light Theme Manager
 */

export type ThemeMode = 'light' | 'dark';

export function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('safarmatch_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) {}
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function setTheme(theme: ThemeMode, _notify = false): void {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  try {
    localStorage.setItem('safarmatch_theme', theme);
  } catch (e) {}
  updateThemeSwitcherUI(theme);
}

export function initTheme(): void {
  const theme = getSavedTheme();
  setTheme(theme);
}

export function toggleTheme(): ThemeMode {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  setTheme(next, true);
  return next;
}

export function cycleTheme(): ThemeMode {
  return toggleTheme();
}

export function updateThemeSwitcherUI(activeTheme?: string): void {
  const current = activeTheme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const icons = document.querySelectorAll('.theme-toggle-icon');
  icons.forEach(el => {
    if (current === 'dark') {
      el.setAttribute('data-lucide', 'sun');
      el.innerHTML = `<svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    } else {
      el.setAttribute('data-lucide', 'moon');
      el.innerHTML = `<svg class="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    }
  });

  const texts = document.querySelectorAll('.theme-toggle-label');
  texts.forEach(el => {
    el.textContent = current === 'dark' ? 'Light Mode' : 'Dark Mode';
  });

  if ((window as any).lucide) (window as any).lucide.createIcons();
}
