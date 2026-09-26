/**
 * SafarMatch — Interactive Map Controller
 * Manages Leaflet & Google Maps renderers, traveler pins, circuit filters, and mini-map.
 */

import { getAllTravelers, inspectTravelerFromMap } from '../services/travelerService';
import { getCurrentProfile } from '../services/profileService';
import { getBlockedUsers } from '../utils/storage';
import { INDIAN_CIRCUITS_LOOKUP } from '../config/constants';
import { DEFAULT_AVATAR } from '../services/profileService';
import { showToast } from '../utils/toast';
import type { Traveler } from '../types';

declare const L: any;

let mapInstance: any = null;
let mapMarkersLayer: any = null;
let currentCircuitFilter = "all";
let homeCityMiniMap: any = null;
let homeCityMiniMarker: any = null;

export function initMap(): void {
  const mapEl = document.getElementById('map');
  if (!mapEl || mapInstance) return;

  if (typeof L === 'undefined') {
    console.warn("Leaflet library not loaded yet.");
    return;
  }

  mapInstance = L.map('map', {
    center: [20.5937, 78.9629],
    zoom: 5,
    zoomControl: false,
    attributionControl: true
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance);

  L.control.zoom({ position: 'topright' }).addTo(mapInstance);
  mapMarkersLayer = L.layerGroup().addTo(mapInstance);

  renderTravelerPins(currentCircuitFilter);
}

export function renderTravelerPins(filterCircuit = "all"): void {
  currentCircuitFilter = filterCircuit;
  const currentProfile = getCurrentProfile();
  const genderFilter = (document.getElementById('map-filter-gender') as HTMLSelectElement)?.value || 'all';
  const intentFilter = (document.getElementById('map-filter-intent') as HTMLSelectElement)?.value || 'all';
  const isSurakshaActive = !!(currentProfile && (currentProfile as any).surakshaShield);
  const isSoloWomanSafe = isSurakshaActive && (currentProfile.gender === 'Female');
  const blockedUsers = getBlockedUsers();

  const travelersList = [...getAllTravelers()];

  if (currentProfile && currentProfile.name && currentProfile.name.trim().length >= 2 && currentProfile.homeLat && currentProfile.homeLng) {
    if (!travelersList.some(t => t.uid === currentProfile.uid)) {
      travelersList.push({
        uid: currentProfile.uid,
        name: currentProfile.name,
        age: currentProfile.age,
        gender: currentProfile.gender,
        city: currentProfile.homeCity,
        lat: currentProfile.homeLat,
        lng: currentProfile.homeLng,
        currentCircuit: currentProfile.currentCircuit,
        vibe: currentProfile.vibe,
        travelStyle: currentProfile.travelStyles,
        intent: currentProfile.intent,
        photo: currentProfile.photoUrl,
        verified: currentProfile.verificationStatus === 'verified',
        verificationStatus: currentProfile.verificationStatus,
        bio: currentProfile.bio,
        upcomingDestination: currentProfile.upcomingDestination,
        isCurrentUser: true
      });
    }
  }

  const filteredTravelers = travelersList.filter(traveler => {
    if (!traveler) return false;
    let lat = Number(traveler.lat);
    let lng = Number(traveler.lng);

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      const fallback = INDIAN_CIRCUITS_LOOKUP[(traveler as any).upcomingCircuit] || INDIAN_CIRCUITS_LOOKUP[traveler.city] || INDIAN_CIRCUITS_LOOKUP["Goa"];
      if (fallback) {
        traveler.lat = fallback.lat;
        traveler.lng = fallback.lng;
        lat = fallback.lat;
        lng = fallback.lng;
      } else {
        return false;
      }
    }

    if (isSurakshaActive && !traveler.isCurrentUser) {
      if (isSoloWomanSafe && traveler.gender === 'Male') return false;
      if (traveler.verificationStatus && traveler.verificationStatus !== 'verified') return false;
    }

    if (blockedUsers.includes(traveler.uid)) return false;

    // Circuit Filter
    if (filterCircuit !== 'all') {
      const matchCircuit = ((traveler as any).upcomingCircuit || traveler.currentCircuit || '').toLowerCase().includes(filterCircuit.toLowerCase());
      const matchHome = ((traveler as any).homeCity || traveler.city || '').toLowerCase().includes(filterCircuit.toLowerCase());
      const matchBio = (traveler.bio || '').toLowerCase().includes(filterCircuit.toLowerCase());
      if (!matchCircuit && !matchHome && !matchBio) return false;
    }

    // Gender Filter
    if (genderFilter !== 'all' && traveler.gender !== genderFilter) return false;

    // Intent Filter
    if (intentFilter !== 'all' && ((traveler as any).travelIntent || traveler.intent) !== intentFilter) return false;

    return true;
  });

  const countBadge = document.getElementById('map-live-travelers-count');
  if (countBadge) countBadge.textContent = `${filteredTravelers.length} Active Explorers`;

  if (mapMarkersLayer && typeof L !== 'undefined') {
    mapMarkersLayer.clearLayers();

    filteredTravelers.forEach(traveler => {
      const isVerified = traveler.verificationStatus === "verified";
      const shieldBadgeHtml = isVerified
        ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">✓</span>`
        : traveler.verificationStatus === "pending"
        ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⏳</span>`
        : ``;

      const photo = (traveler as any).photoUrl || traveler.photo || DEFAULT_AVATAR;
      const ringBorder = traveler.isCurrentUser ? 'border-amber-500 ring-2 ring-amber-300' : isVerified ? 'border-emerald-500' : 'border-rose-500';

      const iconHtml = `
        <div class="relative cursor-pointer group custom-avatar-pin" style="width: 44px; height: 44px;">
          <div class="absolute inset-0 rounded-full ${traveler.isCurrentUser ? 'bg-amber-400/30' : 'bg-rose-500/20'} pin-pulse"></div>
          <div class="w-10 h-10 rounded-full border-2 ${ringBorder} bg-white overflow-hidden shadow-lg transform transition group-hover:scale-110 flex items-center justify-center">
            <img src="${photo}" alt="${traveler.name}" class="w-full h-full object-cover" />
          </div>
          ${traveler.isCurrentUser ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 font-extrabold text-[8px] px-1 rounded-full shadow-xs">YOU</span>' : shieldBadgeHtml}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-avatar-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const tLat = Number(traveler.lat);
      const tLng = Number(traveler.lng);
      if (isNaN(tLat) || isNaN(tLng) || !isFinite(tLat) || !isFinite(tLng)) return;

      const marker = L.marker([tLat, tLng], { icon: customIcon });
      const bioSnippet = traveler.bio ? (traveler.bio.length > 95 ? traveler.bio.substring(0, 95) + '...' : traveler.bio) : 'Traveler exploring India.';

      const popupContent = `
        <div class="p-3.5 max-w-[240px] text-xs font-sans">
          <div class="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <img src="${photo}" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
            <div>
              <div class="flex items-center gap-1">
                <h4 class="font-bold text-slate-900">${traveler.name} ${traveler.isCurrentUser ? '(You)' : ''}</h4>
                ${isVerified ? '<span class="text-emerald-600 font-bold">✓</span>' : ''}
              </div>
              <p class="text-[11px] text-slate-500">${(traveler as any).upcomingCircuit || traveler.currentCircuit || 'India'} • ${traveler.gender || 'Traveler'}</p>
            </div>
          </div>
          <p class="text-[11px] text-slate-600 py-2 leading-relaxed">${bioSnippet}</p>
          <div class="pt-1 flex gap-1.5">
            ${traveler.isCurrentUser ? `
              <button onclick="window.switchView('profile')" class="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer">
                Edit Profile
              </button>
            ` : `
              <button onclick="window.inspectTravelerFromMap('${traveler.uid}')" class="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer">
                View Profile
              </button>
            `}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      mapMarkersLayer.addLayer(marker);
    });
  }
}

export function filterMapCircuit(circuit: string): void {
  const pills = document.querySelectorAll('.circuit-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-circuit') === circuit) {
      p.className = "circuit-pill px-3 py-1 rounded-full text-xs font-bold bg-safar-600 text-white shadow-xs transition flex-shrink-0 cursor-pointer";
    } else {
      p.className = "circuit-pill px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:border-safar-300 transition flex-shrink-0 cursor-pointer";
    }
  });

  renderTravelerPins(circuit);

  if (circuit !== 'all' && INDIAN_CIRCUITS_LOOKUP[circuit]) {
    const coords = INDIAN_CIRCUITS_LOOKUP[circuit];
    flyToDestination(coords.lat, coords.lng, circuit, 8);
  }
}

export function resetMapCenter(): void {
  if (mapInstance) {
    mapInstance.flyTo([20.5937, 78.9629], 5);
  }
}

export function flyToDestination(lat: number, lng: number, label = "", zoomLevel = 10): void {
  const safeLat = Number(lat);
  const safeLng = Number(lng);
  if (isNaN(safeLat) || isNaN(safeLng) || !isFinite(safeLat) || !isFinite(safeLng)) return;

  if (mapInstance) {
    mapInstance.flyTo([safeLat, safeLng], zoomLevel, { duration: 1.5 });
    if (label) showToast(`📍 Flying to ${label}`, "info");
  }
}

export function locateUserPosition(): void {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.", "error");
    return;
  }
  showToast("Detecting your GPS location...", "info");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      flyToDestination(lat, lng, "Your GPS Position", 12);
    },
    (err) => {
      console.warn("Geolocation denied/failed:", err);
      showToast("Could not retrieve GPS location.", "error");
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

export function initHomeCityMiniMap(initialLat: number, initialLng: number): void {
  const miniEl = document.getElementById('home-city-mini-map') || document.getElementById('profile-home-minimap');
  if (!miniEl || typeof L === 'undefined') return;

  const lat = (initialLat && !isNaN(Number(initialLat))) ? Number(initialLat) : 18.5204;
  const lng = (initialLng && !isNaN(Number(initialLng))) ? Number(initialLng) : 73.8567;

  const targetId = miniEl.id;

  if (homeCityMiniMap) {
    homeCityMiniMap.invalidateSize();
    homeCityMiniMap.setView([lat, lng], 10);
    if (homeCityMiniMarker) homeCityMiniMarker.setLatLng([lat, lng]);
    return;
  }

  homeCityMiniMap = L.map(targetId, {
    center: [lat, lng],
    zoom: 10,
    zoomControl: false,
    attributionControl: false
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18
  }).addTo(homeCityMiniMap);

  homeCityMiniMarker = L.marker([lat, lng], { draggable: true }).addTo(homeCityMiniMap);

  const coordsLabel = document.getElementById('home-city-coords-text');
  if (coordsLabel) {
    coordsLabel.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }

  homeCityMiniMarker.on('dragend', (e: any) => {
    const position = e.target.getLatLng();
    if (coordsLabel) {
      coordsLabel.textContent = `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`;
    }
  });

  homeCityMiniMap.on('click', (e: any) => {
    if (homeCityMiniMarker) {
      homeCityMiniMarker.setLatLng(e.latlng);
    }
    if (coordsLabel) {
      coordsLabel.textContent = `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`;
    }
  });
}
