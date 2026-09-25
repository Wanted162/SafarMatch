/**
 * SafarMatch — Trips & Itinerary Feed Controller
 * Renders community trip cards, circuit filters, search keywords, and join actions.
 */

import { getAllTrips } from '../services/tripService';
import { getCurrentProfile, DEFAULT_AVATAR } from '../services/profileService';

let currentTripCircuitFilter = "all";

export function renderTripsFeed(filterCircuit = "all", searchKeyword = ""): void {
  currentTripCircuitFilter = filterCircuit;
  const container = document.getElementById('trips-feed-container');
  if (!container) return;

  const trips = getAllTrips();
  const kw = searchKeyword.trim().toLowerCase();
  const currentProfile = getCurrentProfile();
  const isSurakshaActive = !!(currentProfile && (currentProfile as any).surakshaShield);
  const isFemaleUser = (currentProfile && currentProfile.gender === 'Female');

  const filtered = trips.filter(t => {
    if (isSurakshaActive && t.creatorUid !== (currentProfile ? currentProfile.uid : '')) {
      if (isFemaleUser && t.creatorGender === 'Male') return false;
      if (t.creatorVerification && t.creatorVerification !== 'verified') return false;
    }
    if (filterCircuit !== 'all' && t.circuit !== filterCircuit) return false;
    if (kw) {
      const matchDest = (t.destination || '').toLowerCase().includes(kw);
      const matchTitle = (t.title || '').toLowerCase().includes(kw);
      const matchItin = (t.itinerary || '').toLowerCase().includes(kw);
      const matchCircuit = (t.circuit || '').toLowerCase().includes(kw);
      if (!matchDest && !matchTitle && !matchItin && !matchCircuit) return false;
    }
    return true;
  });

  const countEl = document.getElementById('trips-feed-count');
  if (countEl) {
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'active trip' : 'active trips'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-14 px-6 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center max-w-md mx-auto my-6">
        <div class="w-14 h-14 rounded-2xl bg-rose-50 text-safar-600 flex items-center justify-center mb-3 shadow-xs">
          <i data-lucide="compass" class="w-7 h-7"></i>
        </div>
        <h4 class="text-base font-bold text-slate-900">No Trips for "${kw || (filterCircuit === 'all' ? 'Any Circuit' : filterCircuit)}"</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Be the first to post an upcoming roadtrip, trek, or journey to this destination to find verified travel companions!</p>
        <button onclick="window.handlePostTripClick()" class="mt-5 px-5 py-2.5 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Post First Trip Plan</span>
        </button>
      </div>
    `;
    if ((window as any).lucide) (window as any).lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(trip => {
    const isVerified = trip.creatorVerification === 'verified';
    const photo = (trip.creatorPhoto && trip.creatorPhoto !== DEFAULT_AVATAR) ? trip.creatorPhoto : DEFAULT_AVATAR;

    return `
      <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4">
        <div class="space-y-3">
          <!-- Header with host info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <img src="${photo}" class="w-9 h-9 rounded-full object-cover border border-slate-200" />
              <div>
                <div class="flex items-center space-x-1">
                  <span class="text-xs font-bold text-slate-900">${trip.creatorName}</span>
                  ${isVerified ? '<span class="text-[10px] text-emerald-600 font-bold">✓</span>' : ''}
                </div>
                <span class="text-[10px] text-slate-400 font-medium">${trip.circuit}</span>
              </div>
            </div>
            <span class="text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-safar-700 px-2.5 py-0.5 rounded-full border border-rose-100">
              ${trip.style}
            </span>
          </div>

          <!-- Title & Details -->
          <div>
            <h3 class="text-sm font-bold text-slate-900 leading-snug">${trip.title}</h3>
            <p class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">${trip.itinerary}</p>
          </div>

          <!-- Meta pills -->
          <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
            <div class="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
              <span class="truncate">${trip.destination}</span>
            </div>
            <div class="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>${trip.startDate || 'Upcoming'} (${trip.duration || 'Flexible'})</span>
            </div>
          </div>
        </div>

        <!-- Bottom action row: Join / Connect -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs font-extrabold text-slate-800">${trip.budget || 'Split 50/50'}</span>
          <button onclick="window.handleJoinTripClick('${trip.id}')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>Join Plan</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if ((window as any).lucide) (window as any).lucide.createIcons();
}

export function filterTripsFeed(circuit: string): void {
  currentTripCircuitFilter = circuit;
  document.querySelectorAll('.trip-filter-pill').forEach(btn => {
    if (btn.getAttribute('data-filter') === circuit) {
      btn.className = "trip-filter-pill px-3 py-1 rounded-full font-bold bg-slate-900 text-white flex-shrink-0 cursor-pointer";
    } else {
      btn.className = "trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0 cursor-pointer";
    }
  });
  const searchInput = document.getElementById('trip-feed-search-input') as HTMLInputElement | null;
  const kw = searchInput ? searchInput.value : '';
  renderTripsFeed(circuit, kw);
}

export function searchTripsFeedByText(text: string): void {
  renderTripsFeed(currentTripCircuitFilter, text);
}
