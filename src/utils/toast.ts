/**
 * SafarMatch — Toast Notification Utility
 */

export function showToast(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass =
    type === 'success' ? 'bg-emerald-600 text-white' :
    type === 'error' ? 'bg-rose-600 text-white' :
    type === 'warning' ? 'bg-amber-600 text-white' :
    'bg-slate-900 text-white';

  toast.className = `${bgClass} px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center space-x-2 transition transform duration-200 pointer-events-auto max-w-sm animate-fade-in`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
