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
let landingMapInstance: any = null;
let landingMapMarkersLayer: any = null;

export function initMap(): void {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;
  if (mapInstance) {
    try {
      mapInstance.invalidateSize();
    } catch (e) {}
    return;
  }

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

export function initLandingMap(): void {
  const landingMapEl = document.getElementById('landing-interactive-map');
  if (!landingMapEl) return;
  if (landingMapInstance) {
    try {
      landingMapInstance.invalidateSize();
    } catch (e) {}
    return;
  }

  if (typeof L === 'undefined') {
    setTimeout(initLandingMap, 300);
    return;
  }

  landingMapInstance = L.map('landing-interactive-map', {
    center: [21.5, 78.9629],
    zoom: 5,
    zoomControl: false,
    attributionControl: true
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  }).addTo(landingMapInstance);

  L.control.zoom({ position: 'topright' }).addTo(landingMapInstance);
  landingMapMarkersLayer = L.layerGroup().addTo(landingMapInstance);

  renderLandingTravelerPins();

  setTimeout(() => {
    if (landingMapInstance) {
      landingMapInstance.invalidateSize();
    }
  }, 400);
}

export function renderLandingTravelerPins(filterCircuit = "all"): void {
  if (!landingMapMarkersLayer || typeof L === 'undefined') return;
  landingMapMarkersLayer.clearLayers();

  const travelersList = [...getAllTravelers()];
  const filtered = filterCircuit === 'all' 
    ? travelersList 
    : travelersList.filter(t => {
        const matchCircuit = ((t as any).upcomingCircuit || t.currentCircuit || '').toLowerCase().includes(filterCircuit.toLowerCase());
        const matchHome = ((t as any).homeCity || t.city || '').toLowerCase().includes(filterCircuit.toLowerCase());
        return matchCircuit || matchHome;
      });

  const countBadge = document.getElementById('landing-map-explorers-count');
  if (countBadge) countBadge.textContent = `${filtered.length} Live Explorers`;

  filtered.forEach(traveler => {
    const isVerified = traveler.verificationStatus === "verified";
    const shieldBadgeHtml = isVerified
      ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">✓</span>`
      : `<span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⏳</span>`;

    const photo = (traveler as any).photoUrl || traveler.photo || DEFAULT_AVATAR;
    const ringBorder = isVerified ? 'border-emerald-500' : 'border-rose-500';

    const iconHtml = `
      <div class="relative cursor-pointer group custom-avatar-pin" style="width: 44px; height: 44px;">
        <div class="absolute inset-0 rounded-full bg-rose-500/20 pin-pulse"></div>
        <div class="w-10 h-10 rounded-full border-2 ${ringBorder} bg-white overflow-hidden shadow-lg transform transition group-hover:scale-110 flex items-center justify-center">
          <img src="${photo}" alt="${traveler.name}" class="w-full h-full object-cover" />
        </div>
        ${shieldBadgeHtml}
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
    const bioSnippet = traveler.bio ? (traveler.bio.length > 90 ? traveler.bio.substring(0, 90) + '...' : traveler.bio) : 'Traveler exploring India.';

    const popupContent = `
      <div class="p-3 max-w-[230px] text-xs font-sans text-slate-800">
        <div class="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <img src="${photo}" class="w-9 h-9 rounded-xl object-cover border border-slate-200" />
          <div class="min-w-0">
            <h4 class="font-bold text-slate-900 text-xs truncate">${traveler.name}</h4>
            <p class="text-[10px] text-slate-500">${(traveler as any).upcomingCircuit || traveler.currentCircuit || 'India'}</p>
          </div>
        </div>
        <p class="text-[11px] text-slate-600 py-1.5 leading-snug">${bioSnippet}</p>
        <button onclick="loginWithGoogleFromLanding()" class="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center justify-center gap-1">
          <span>Connect via Google</span>
        </button>
      </div>
    `;

    marker.bindPopup(popupContent);
    landingMapMarkersLayer.addLayer(marker);
  });
}

export function filterLandingMapCircuit(circuit: string): void {
  const pills = document.querySelectorAll('.landing-circuit-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-circuit') === circuit) {
      p.className = "landing-circuit-pill px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs transition flex-shrink-0 cursor-pointer";
    } else {
      p.className = "landing-circuit-pill px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-white/10 hover:border-white/30 transition flex-shrink-0 cursor-pointer";
    }
  });

  renderLandingTravelerPins(circuit);

  if (circuit !== 'all' && INDIAN_CIRCUITS_LOOKUP[circuit] && landingMapInstance) {
    const coords = INDIAN_CIRCUITS_LOOKUP[circuit];
    landingMapInstance.flyTo([coords.lat, coords.lng], 8, { duration: 1.2 });
  } else if (circuit === 'all' && landingMapInstance) {
    landingMapInstance.flyTo([21.5, 78.9629], 5, { duration: 1.2 });
  }
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
