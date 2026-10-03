/**
 * SafarMatch — Interactive Map Controller
 * Official Google Maps Platform integration with dynamic Timezone-Aware Solar Shading.
 * Harmonizes Day and Night modes on the same Google Map with continuous solar transitions.
 * 
 * Source: Google Maps Platform Code Assist
 */

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { getAllTravelers, inspectTravelerFromMap } from '../services/travelerService';
import { getCurrentProfile } from '../services/profileService';
import { getBlockedUsers } from '../utils/storage';
import { INDIAN_CIRCUITS_LOOKUP } from '../config/constants';
import { DEFAULT_AVATAR } from '../services/profileService';
import { showToast } from '../utils/toast';
import { escapeHtml } from '../utils/security';
import type { Traveler } from '../types';

declare const google: any;
declare const L: any; // Graceful Leaflet fallback if offline

// Google Maps API Key provisioned via Google Maps Demo Key / AI Studio
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBVBsoIYOIBEuIsqw3YeNyfI3uk6CVCgOw';

export type SolarShadePhase = 'dawn' | 'day' | 'golden' | 'dusk' | 'night';

// ==================== GOOGLE MAPS THEMATIC COLOR PALETTES ====================

// 1. Daylight Palette (High-contrast, crisp roads, natural greens & crystal blue water)
const DAY_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e7f8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fef08a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#facc15' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] }
];

// 2. Golden Hour Palette (Warm amber dusk, golden hue over roads and terrain)
const GOLDEN_HOUR_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#fef9ee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#93c5fd' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#fffbeb' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#fde68a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fbbf24' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d97706' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#78350f' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#92400e' }] }
];

// 3. Dusk / Sunset Palette (Sandhya — Twilight amethyst, copper horizon, deep water)
const DUSK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#2a2838' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a1d36' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3d3852' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#231f33' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f59e0b' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#b45309' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#223832' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#fde047' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a24' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#312e47' }] }
];

// 4. Midnight Night Palette (Google Maps Night Mode — Deep slate, luminous highlights)
const NIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

// 5. Dawn Palette (Brahma Muhurta / Morning Twilight — Soft pastel lavender & fresh rose)
const DAWN_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f3f7' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e9d5ff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fed7aa' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#fb923c' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e0f2fe' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b21a8' }] }
];

// ==================== STATE MANAGEMENT ====================

let googleMapsSdkPromise: Promise<typeof google.maps> | null = null;
let googleMapsLoaded = false;
let googleMapInstance: google.maps.Map | null = null;
let homeCityGoogleMap: google.maps.Map | null = null;
let homeCityGoogleMarker: google.maps.Marker | null = null;
let landingGoogleMap: google.maps.Map | null = null;

let activeInfoWindow: google.maps.InfoWindow | null = null;
let overlayMarkers: any[] = [];
let landingOverlayMarkers: any[] = [];

// Fallback Leaflet references (if offline)
let leafletMapInstance: any = null;
let leafletMarkersLayer: any = null;
let leafletHomeCityMiniMap: any = null;
let leafletHomeCityMiniMarker: any = null;
let leafletLandingMapInstance: any = null;
let leafletLandingMarkersLayer: any = null;

let currentCircuitFilter = 'all';

// Solar Timezone Shade State
let activeShadeMode: 'auto' | SolarShadePhase = 'auto';
let simulatedMinutes: number | null = null;
let shadeIntervalTimer: any = null;

// ==================== TIMEZONE & SOLAR SHADE ENGINE ====================

/**
 * Calculates current India Standard Time (IST: UTC+5:30) and solar phase.
 */
export function getIndiaStandardTime(overrideMinutes?: number): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  timeString: string;
  solarPhase: SolarShadePhase;
  phaseName: string;
  phaseEmoji: string;
} {
  let hours: number;
  let minutes: number;
  let totalMinutes: number;

  if (overrideMinutes !== undefined && overrideMinutes !== null) {
    totalMinutes = Math.max(0, Math.min(1439, Math.floor(overrideMinutes)));
    hours = Math.floor(totalMinutes / 60);
    minutes = totalMinutes % 60;
  } else {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    hours = istDate.getHours();
    minutes = istDate.getMinutes();
    totalMinutes = hours * 60 + minutes;
  }

  let solarPhase: SolarShadePhase = 'day';
  let phaseName = 'Bright Daylight';
  let phaseEmoji = '☀️';

  if (totalMinutes >= 300 && totalMinutes < 420) {
    // 05:00 - 06:59
    solarPhase = 'dawn';
    phaseName = 'Dawn (Brahma Muhurta)';
    phaseEmoji = '🌅';
  } else if (totalMinutes >= 420 && totalMinutes < 990) {
    // 07:00 - 16:29
    solarPhase = 'day';
    phaseName = 'Bright Daylight';
    phaseEmoji = '☀️';
  } else if (totalMinutes >= 990 && totalMinutes < 1110) {
    // 16:30 - 18:29
    solarPhase = 'golden';
    phaseName = 'Golden Hour (Godhuli)';
    phaseEmoji = '✨';
  } else if (totalMinutes >= 1110 && totalMinutes < 1200) {
    // 18:30 - 19:59
    solarPhase = 'dusk';
    phaseName = 'Dusk & Sunset (Sandhya)';
    phaseEmoji = '🌆';
  } else {
    // 20:00 - 04:59
    solarPhase = 'night';
    phaseName = 'Midnight Night Mode';
    phaseEmoji = '🌙';
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const timeString = `${displayHours}:${displayMinutes} ${ampm} IST`;

  return { hours, minutes, totalMinutes, timeString, solarPhase, phaseName, phaseEmoji };
}

/**
 * Returns the active Google Maps MapTypeStyle array based on phase.
 */
export function getStylesForPhase(phase: SolarShadePhase): google.maps.MapTypeStyle[] {
  switch (phase) {
    case 'dawn':
      return DAWN_MAP_STYLES;
    case 'day':
      return DAY_MAP_STYLES;
    case 'golden':
      return GOLDEN_HOUR_MAP_STYLES;
    case 'dusk':
      return DUSK_MAP_STYLES;
    case 'night':
    default:
      return NIGHT_MAP_STYLES;
  }
}

/**
 * Determines current active phase considering auto-sync or manual override.
 */
export function getCurrentActivePhase(): {
  phase: SolarShadePhase;
  phaseName: string;
  phaseEmoji: string;
  timeString: string;
  totalMinutes: number;
} {
  const ist = getIndiaStandardTime(simulatedMinutes ?? undefined);

  if (activeShadeMode !== 'auto') {
    const phaseNames: Record<SolarShadePhase, { name: string; emoji: string }> = {
      dawn: { name: 'Dawn (Sunrise)', emoji: '🌅' },
      day: { name: 'Bright Daylight', emoji: '☀️' },
      golden: { name: 'Golden Hour', emoji: '✨' },
      dusk: { name: 'Dusk & Sunset', emoji: '🌆' },
      night: { name: 'Midnight Night Mode', emoji: '🌙' }
    };
    return {
      phase: activeShadeMode,
      phaseName: phaseNames[activeShadeMode].name,
      phaseEmoji: phaseNames[activeShadeMode].emoji,
      timeString: ist.timeString,
      totalMinutes: ist.totalMinutes
    };
  }

  return {
    phase: ist.solarPhase,
    phaseName: ist.phaseName,
    phaseEmoji: ist.phaseEmoji,
    timeString: ist.timeString,
    totalMinutes: ist.totalMinutes
  };
}

/**
 * Applies the calculated shade to map instances and CSS classes.
 */
export function syncMapTileTheme(isDark?: boolean): void {
  const isDocDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const dark = isDark !== undefined ? isDark : isDocDark;

  // If user explicitly toggled global dark mode and shade mode is 'auto', harmonize
  let activePhaseInfo = getCurrentActivePhase();
  if (activeShadeMode === 'auto' && isDark !== undefined) {
    // If dark mode was toggled on, shift to night palette; if off, shift to day
    if (dark && activePhaseInfo.phase === 'day') {
      activeShadeMode = 'night';
      activePhaseInfo = getCurrentActivePhase();
    } else if (!dark && activePhaseInfo.phase === 'night') {
      activeShadeMode = 'day';
      activePhaseInfo = getCurrentActivePhase();
    }
  }

  const styles = getStylesForPhase(activePhaseInfo.phase);
  const shadeClass = `map-shade-${activePhaseInfo.phase}`;

  // Update Main Google Map
  if (googleMapInstance) {
    try {
      googleMapInstance.setOptions({ styles });
    } catch (e) {}
  }

  // Update Mini Map
  if (homeCityGoogleMap) {
    try {
      homeCityGoogleMap.setOptions({ styles });
    } catch (e) {}
  }

  // Update Landing Google Map
  if (landingGoogleMap) {
    try {
      landingGoogleMap.setOptions({ styles });
    } catch (e) {}
  }

  // Apply CSS transition filter class to map container
  const mapContainers = ['map', 'home-city-mini-map', 'landing-interactive-map'];
  mapContainers.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove(
        'map-shade-dawn',
        'map-shade-day',
        'map-shade-golden',
        'map-shade-dusk',
        'map-shade-night'
      );
      el.classList.add(shadeClass);
    }
  });

  // Update UI Widget labels
  updateTimezoneWidgetUI(activePhaseInfo);

  // Fallback Leaflet Tile synchronization if offline
  if (typeof L !== 'undefined') {
    syncLeafletFallbackTiles(dark);
  }
}
(window as any).syncMapTileTheme = syncMapTileTheme;

/**
 * Updates the floating Timezone & Solar Shade Controller Widget in the UI.
 */
function updateTimezoneWidgetUI(info: {
  phase: SolarShadePhase;
  phaseName: string;
  phaseEmoji: string;
  timeString: string;
  totalMinutes: number;
}): void {
  const timeDisplay = document.getElementById('map-time-display');
  if (timeDisplay) timeDisplay.textContent = info.timeString;

  const phaseLabel = document.getElementById('map-shade-phase-label');
  if (phaseLabel) phaseLabel.textContent = `${info.phaseName}`;

  const solarIcon = document.getElementById('map-solar-icon');
  if (solarIcon) solarIcon.textContent = info.phaseEmoji;

  const autoBtn = document.getElementById('map-shade-auto-btn');
  if (autoBtn) {
    if (activeShadeMode === 'auto') {
      autoBtn.className =
        'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-safar-600 text-white shadow-xs cursor-pointer flex-shrink-0';
      autoBtn.textContent = '⚡ Auto';
    } else {
      autoBtn.className =
        'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer flex-shrink-0';
      autoBtn.textContent = 'Manual';
    }
  }

  const scrubber = document.getElementById('map-time-scrubber') as HTMLInputElement | null;
  if (scrubber && activeShadeMode === 'auto') {
    scrubber.value = String(info.totalMinutes);
  }

  // Update Preset button styles
  const presetBtns = document.querySelectorAll('.shade-preset-btn');
  presetBtns.forEach((btn) => {
    const phase = btn.getAttribute('data-phase');
    if (phase === info.phase) {
      btn.className =
        'shade-preset-btn flex-1 py-1 rounded-lg text-[10px] font-bold bg-safar-600 text-white shadow-xs text-center cursor-pointer transition';
    } else {
      btn.className =
        'shade-preset-btn flex-1 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-center cursor-pointer transition';
    }
  });
}

/**
 * Switch to a specific solar phase preset (Dawn, Day, Golden, Dusk, Night).
 */
export function setMapShadePreset(phase: SolarShadePhase): void {
  activeShadeMode = phase;
  simulatedMinutes = null;
  syncMapTileTheme();
  showToast(`Shade set to ${phase.toUpperCase()} mode`, 'info');
}
(window as any).setMapShadePreset = setMapShadePreset;

/**
 * Toggle real-time automatic timezone synchronization.
 */
export function toggleTimezoneAutoSync(): void {
  if (activeShadeMode === 'auto') {
    activeShadeMode = 'day';
    showToast('Switched to manual shade mode', 'info');
  } else {
    activeShadeMode = 'auto';
    simulatedMinutes = null;
    showToast('Timezone Auto-Sync enabled (IST)', 'success');
  }
  syncMapTileTheme();
}
(window as any).toggleTimezoneAutoSync = toggleTimezoneAutoSync;

/**
 * Handles slider scrubbing across 24 hours (0 to 1439 minutes).
 */
export function handleMapTimeScrub(minutesVal: string | number): void {
  const val = Number(minutesVal);
  if (isNaN(val)) return;
  activeShadeMode = 'auto'; // Will calculate phase from minutes
  simulatedMinutes = val;
  syncMapTileTheme();
}
(window as any).handleMapTimeScrub = handleMapTimeScrub;

// ==================== GOOGLE MAPS SDK LOADER ====================

/**
 * Loads the official Google Maps JavaScript API via @googlemaps/js-api-loader.
 */
export function loadGoogleMapsSDK(): Promise<any> {
  if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
    googleMapsLoaded = true;
    return Promise.resolve(google.maps);
  }

  if (!googleMapsSdkPromise) {
    try {
      setOptions({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry'],
        internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio']
      } as any);

      googleMapsSdkPromise = Promise.all([
        importLibrary('maps'),
        importLibrary('marker')
      ])
        .then(() => {
          googleMapsLoaded = true;
          return (window as any).google?.maps || (typeof google !== 'undefined' ? google.maps : null);
        })
        .catch((err: any) => {
          console.warn('Google Maps SDK failed to load, activating Leaflet fallback:', err);
          throw err;
        });
    } catch (e: any) {
      console.warn('Google Maps setOptions error:', e);
      return Promise.reject(e);
    }
  }

  return googleMapsSdkPromise;
}

// ==================== CUSTOM HTML OVERLAY MARKER CLASS ====================

/**
 * Google Maps OverlayView for rich, custom HTML pins (Traveler avatars, pulse rings, shields).
 */
class SafarMapOverlayMarker {
  private overlay: google.maps.OverlayView;
  private container: HTMLDivElement;
  private position: google.maps.LatLng;
  private map: google.maps.Map;

  constructor(map: google.maps.Map, position: { lat: number; lng: number }, element: HTMLDivElement) {
    this.map = map;
    this.position = new google.maps.LatLng(position.lat, position.lng);
    this.container = element;

    this.overlay = new google.maps.OverlayView();

    this.overlay.onAdd = () => {
      const panes = this.overlay.getPanes();
      if (panes && panes.overlayMouseTarget) {
        panes.overlayMouseTarget.appendChild(this.container);
      }
    };

    this.overlay.draw = () => {
      const projection = this.overlay.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.container.style.position = 'absolute';
        this.container.style.left = `${point.x}px`;
        this.container.style.top = `${point.y}px`;
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.zIndex = '10';
      }
    };

    this.overlay.onRemove = () => {
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    };

    this.overlay.setMap(map);
  }

  public setPosition(pos: { lat: number; lng: number }) {
    this.position = new google.maps.LatLng(pos.lat, pos.lng);
    this.overlay.draw();
  }

  public getPosition(): google.maps.LatLng {
    return this.position;
  }

  public destroy() {
    this.overlay.setMap(null);
  }
}

// ==================== MAP INITIALIZATION ====================

/**
 * Initializes the main interactive Google Map on #map.
 */
export function initMap(): void {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Start background 60s solar shade tick timer
  if (!shadeIntervalTimer) {
    shadeIntervalTimer = setInterval(() => {
      if (activeShadeMode === 'auto' && simulatedMinutes === null) {
        syncMapTileTheme();
      }
    }, 60000);
  }

  if (googleMapInstance) {
    try {
      google.maps.event.trigger(googleMapInstance, 'resize');
    } catch (e) {}
    return;
  }

  loadGoogleMapsSDK()
    .then((maps) => {
      const activePhase = getCurrentActivePhase();
      const styles = getStylesForPhase(activePhase.phase);

      googleMapInstance = new maps.Map(mapEl, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: maps.ControlPosition.RIGHT_CENTER
        },
        styles,
        gestureHandling: 'greedy'
      });

      // Close open InfoWindows on canvas click
      if (googleMapInstance) {
        googleMapInstance.addListener('click', () => {
          if (activeInfoWindow) {
            activeInfoWindow.close();
            activeInfoWindow = null;
          }
        });
      }

      syncMapTileTheme();
      renderTravelerPins(currentCircuitFilter);
    })
    .catch(() => {
      // Graceful fallback to Leaflet if network prevents Google Maps script
      initLeafletFallbackMap();
    });
}
(window as any).initMap = initMap;

/**
 * Initializes the landing page Google Map preview on #landing-interactive-map.
 */
export function initLandingMap(): void {
  const landingMapEl = document.getElementById('landing-interactive-map');
  if (!landingMapEl) return;

  if (landingGoogleMap) {
    try {
      google.maps.event.trigger(landingGoogleMap, 'resize');
    } catch (e) {}
    return;
  }

  loadGoogleMapsSDK()
    .then((maps) => {
      const activePhase = getCurrentActivePhase();
      const styles = getStylesForPhase(activePhase.phase);

      landingGoogleMap = new maps.Map(landingMapEl, {
        center: { lat: 21.5, lng: 78.9629 },
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        disableDefaultUI: true,
        zoomControl: true,
        styles,
        gestureHandling: 'greedy'
      });

      syncMapTileTheme();
      renderLandingTravelerPins();
    })
    .catch(() => {
      initLeafletLandingFallback();
    });
}
(window as any).initLandingMap = initLandingMap;

/**
 * Renders traveler pins on the main interactive Google Map.
 */
export function renderTravelerPins(filterCircuit = 'all'): void {
  currentCircuitFilter = filterCircuit;
  const currentProfile = getCurrentProfile();
  const genderFilter = (document.getElementById('map-filter-gender') as HTMLSelectElement)?.value || 'all';
  const intentFilter = (document.getElementById('map-filter-intent') as HTMLSelectElement)?.value || 'all';
  const isSurakshaActive = !!(currentProfile && (currentProfile as any).surakshaShield);
  const isSoloWomanSafe = isSurakshaActive && currentProfile?.gender === 'Female';
  const blockedUsers = getBlockedUsers();

  const travelersList = [...getAllTravelers()];

  // Include current user pin if profile exists
  if (
    currentProfile &&
    currentProfile.name &&
    currentProfile.name.trim().length >= 2 &&
    currentProfile.homeLat &&
    currentProfile.homeLng
  ) {
    if (!travelersList.some((t) => t.uid === currentProfile.uid)) {
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

  const filteredTravelers = travelersList.filter((traveler) => {
    if (!traveler) return false;
    let lat = Number(traveler.lat);
    let lng = Number(traveler.lng);

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      const fallback =
        INDIAN_CIRCUITS_LOOKUP[(traveler as any).upcomingCircuit] ||
        INDIAN_CIRCUITS_LOOKUP[traveler.city] ||
        INDIAN_CIRCUITS_LOOKUP['Goa'];
      if (fallback) {
        traveler.lat = fallback.lat;
        traveler.lng = fallback.lng;
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
      const matchCircuit = ((traveler as any).upcomingCircuit || traveler.currentCircuit || '')
        .toLowerCase()
        .includes(filterCircuit.toLowerCase());
      const matchHome = ((traveler as any).homeCity || traveler.city || '')
        .toLowerCase()
        .includes(filterCircuit.toLowerCase());
      const matchBio = (traveler.bio || '').toLowerCase().includes(filterCircuit.toLowerCase());
      if (!matchCircuit && !matchHome && !matchBio) return false;
    }

    // Gender Filter
    if (genderFilter !== 'all' && traveler.gender !== genderFilter) return false;

    // Intent Filter
    if (intentFilter !== 'all' && ((traveler as any).travelIntent || traveler.intent) !== intentFilter)
      return false;

    return true;
  });

  const countBadge =
    document.getElementById('map-traveler-count-pill') || document.getElementById('map-live-travelers-count');
  if (countBadge) countBadge.textContent = `${filteredTravelers.length} Explorers`;

  // Render on Google Maps if active
  if (googleMapInstance && googleMapsLoaded) {
    // Clear old overlays
    overlayMarkers.forEach((marker) => marker.destroy());
    overlayMarkers = [];

    filteredTravelers.forEach((traveler) => {
      const tLat = Number(traveler.lat);
      const tLng = Number(traveler.lng);
      if (isNaN(tLat) || isNaN(tLng)) return;

      const isVerified = traveler.verificationStatus === 'verified';
      const shieldBadgeHtml = isVerified
        ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">✓</span>`
        : traveler.verificationStatus === 'pending'
        ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⏳</span>`
        : ``;

      const photo = (traveler as any).photoUrl || traveler.photo || DEFAULT_AVATAR;
      const ringBorder = traveler.isCurrentUser
        ? 'border-amber-500 ring-2 ring-amber-300'
        : isVerified
        ? 'border-emerald-500'
        : 'border-rose-500';

      const container = document.createElement('div');
      container.className = 'custom-avatar-pin';
      container.style.width = '44px';
      container.style.height = '44px';
      container.innerHTML = `
        <div class="relative cursor-pointer group" style="width: 44px; height: 44px;">
          <div class="absolute inset-0 rounded-full ${
            traveler.isCurrentUser ? 'bg-amber-400/30' : 'bg-rose-500/20'
          } pin-pulse"></div>
          <div class="w-10 h-10 rounded-full border-2 ${ringBorder} bg-white overflow-hidden shadow-lg transform transition group-hover:scale-110 flex items-center justify-center">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(traveler.name)}" class="w-full h-full object-cover" />
          </div>
          ${
            traveler.isCurrentUser
              ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 font-extrabold text-[8px] px-1 rounded-full shadow-xs">YOU</span>'
              : shieldBadgeHtml
          }
        </div>
      `;

      const bioSnippet = traveler.bio
        ? traveler.bio.length > 95
          ? traveler.bio.substring(0, 95) + '...'
          : traveler.bio
        : 'Traveler exploring India.';

      const popupContent = `
        <div class="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-[240px] text-xs font-sans text-black">
          <div class="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <img src="${escapeHtml(photo)}" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
            <div class="min-w-0 flex-1">
              <div class="font-extrabold text-black truncate">${escapeHtml(traveler.name)}</div>
              <div class="text-[11px] text-black font-medium truncate">${escapeHtml(
                (traveler as any).upcomingCircuit || traveler.currentCircuit || 'India'
              )}</div>
            </div>
          </div>
          <p class="text-[11px] text-black py-2 leading-relaxed line-clamp-2 font-normal">${escapeHtml(
            bioSnippet
          )}</p>
          <button onclick="${
            traveler.isCurrentUser
              ? "switchView('profile')"
              : "inspectTravelerFromMap('" + escapeHtml(traveler.uid) + "')"
          }" class="w-full py-1.5 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs transition cursor-pointer">
            ${traveler.isCurrentUser ? 'Edit Profile' : 'View Profile'}
          </button>
        </div>
      `;

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
        if (googleMapInstance) {
          activeInfoWindow = new google.maps.InfoWindow({
            content: popupContent,
            position: { lat: tLat, lng: tLng },
            pixelOffset: new google.maps.Size(0, -25)
          });
          activeInfoWindow?.open(googleMapInstance);
        }
      });

      const overlayMarker = new SafarMapOverlayMarker(googleMapInstance as any, { lat: tLat, lng: tLng }, container);
      overlayMarkers.push(overlayMarker);
    });
  }

  // Also update Leaflet markers if fallback is running
  if (leafletMarkersLayer && typeof L !== 'undefined') {
    renderLeafletTravelerPins(filteredTravelers);
  }
}
(window as any).renderTravelerPins = renderTravelerPins;

/**
 * Renders traveler pins for the public landing preview map.
 */
export function renderLandingTravelerPins(filterCircuit = 'all'): void {
  const travelersList = [...getAllTravelers()];
  const filtered =
    filterCircuit === 'all'
      ? travelersList
      : travelersList.filter((t) => {
          const matchCircuit = ((t as any).upcomingCircuit || t.currentCircuit || '')
            .toLowerCase()
            .includes(filterCircuit.toLowerCase());
          const matchHome = ((t as any).homeCity || t.city || '').toLowerCase().includes(filterCircuit.toLowerCase());
          return matchCircuit || matchHome;
        });

  const countBadge = document.getElementById('landing-map-explorers-count');
  if (countBadge) countBadge.textContent = `${filtered.length} Live Explorers`;

  if (landingGoogleMap && googleMapsLoaded) {
    landingOverlayMarkers.forEach((m) => m.destroy());
    landingOverlayMarkers = [];

    filtered.forEach((traveler) => {
      const tLat = Number(traveler.lat);
      const tLng = Number(traveler.lng);
      if (isNaN(tLat) || isNaN(tLng)) return;

      const isVerified = traveler.verificationStatus === 'verified';
      const shieldBadgeHtml = isVerified
        ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">✓</span>`
        : `<span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⏳</span>`;

      const photo = (traveler as any).photoUrl || traveler.photo || DEFAULT_AVATAR;
      const ringBorder = isVerified ? 'border-emerald-500' : 'border-rose-500';

      const container = document.createElement('div');
      container.className = 'custom-avatar-pin';
      container.style.width = '44px';
      container.style.height = '44px';
      container.innerHTML = `
        <div class="relative cursor-pointer group" style="width: 44px; height: 44px;">
          <div class="absolute inset-0 rounded-full bg-rose-500/20 pin-pulse"></div>
          <div class="w-10 h-10 rounded-full border-2 ${ringBorder} bg-white overflow-hidden shadow-lg transform transition group-hover:scale-110 flex items-center justify-center">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(traveler.name)}" class="w-full h-full object-cover" />
          </div>
          ${shieldBadgeHtml}
        </div>
      `;

      const bioSnippet = traveler.bio
        ? traveler.bio.length > 90
          ? traveler.bio.substring(0, 90) + '...'
          : traveler.bio
        : 'Traveler exploring India.';

      const popupContent = `
        <div class="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-[240px] text-xs font-sans text-black">
          <div class="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <img src="${escapeHtml(photo)}" class="w-9 h-9 rounded-xl object-cover border border-slate-200" />
            <div class="min-w-0">
              <h4 class="font-bold text-black text-xs truncate">${escapeHtml(traveler.name)}</h4>
              <p class="text-[10px] text-black font-medium">${escapeHtml(
                (traveler as any).upcomingCircuit || traveler.currentCircuit || 'India'
              )}</p>
            </div>
          </div>
          <p class="text-[11px] text-black py-1.5 leading-snug line-clamp-2 font-normal">${escapeHtml(
            bioSnippet
          )}</p>
          <button onclick="loginWithGoogleFromLanding()" class="w-full py-1.5 rounded-lg bg-safar-600 hover:bg-safar-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center justify-center gap-1">
            <span>Connect via Google</span>
          </button>
        </div>
      `;

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeInfoWindow) activeInfoWindow.close();
        if (landingGoogleMap) {
          activeInfoWindow = new google.maps.InfoWindow({
            content: popupContent,
            position: { lat: tLat, lng: tLng },
            pixelOffset: new google.maps.Size(0, -25)
          });
          activeInfoWindow?.open(landingGoogleMap);
        }
      });

      const overlayMarker = new SafarMapOverlayMarker(landingGoogleMap as any, { lat: tLat, lng: tLng }, container);
      landingOverlayMarkers.push(overlayMarker);
    });
  }
}
(window as any).renderLandingTravelerPins = renderLandingTravelerPins;

// ==================== CIRCUIT FILTERS & NAVIGATION ====================

export function filterMapCircuit(circuit: string): void {
  const pills = document.querySelectorAll('.circuit-pill');
  pills.forEach((p) => {
    if (p.getAttribute('data-circuit') === circuit) {
      p.className =
        'circuit-pill px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold bg-safar-600 text-white flex-shrink-0 shadow-xs text-[11px] cursor-pointer';
    } else {
      p.className =
        'circuit-pill px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0 text-[11px] cursor-pointer border border-slate-200 dark:border-slate-700 transition';
    }
  });

  renderTravelerPins(circuit);

  if (circuit !== 'all' && INDIAN_CIRCUITS_LOOKUP[circuit]) {
    const coords = INDIAN_CIRCUITS_LOOKUP[circuit];
    flyToDestination(coords.lat, coords.lng, circuit, 8);
  }
}
(window as any).filterMapCircuit = filterMapCircuit;

export function filterLandingMapCircuit(circuit: string): void {
  const pills = document.querySelectorAll('.landing-circuit-pill');
  pills.forEach((p) => {
    if (p.getAttribute('data-circuit') === circuit) {
      p.className =
        'landing-circuit-pill px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs transition flex-shrink-0 cursor-pointer';
    } else {
      p.className =
        'landing-circuit-pill px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-white/10 hover:border-white/30 transition flex-shrink-0 cursor-pointer';
    }
  });

  renderLandingTravelerPins(circuit);

  if (circuit !== 'all' && INDIAN_CIRCUITS_LOOKUP[circuit] && landingGoogleMap) {
    const coords = INDIAN_CIRCUITS_LOOKUP[circuit];
    landingGoogleMap.panTo({ lat: coords.lat, lng: coords.lng });
    landingGoogleMap.setZoom(8);
  } else if (circuit === 'all' && landingGoogleMap) {
    landingGoogleMap.panTo({ lat: 21.5, lng: 78.9629 });
    landingGoogleMap.setZoom(5);
  }
}
(window as any).filterLandingMapCircuit = filterLandingMapCircuit;

export function resetMapCenter(): void {
  if (googleMapInstance) {
    googleMapInstance.panTo({ lat: 20.5937, lng: 78.9629 });
    googleMapInstance.setZoom(5);
  } else if (leafletMapInstance) {
    leafletMapInstance.flyTo([20.5937, 78.9629], 5);
  }
}
(window as any).resetMapCenter = resetMapCenter;

export function invalidateMapSize(): void {
  if (googleMapInstance) {
    google.maps.event.trigger(googleMapInstance, 'resize');
  }
  if (leafletMapInstance) {
    try {
      leafletMapInstance.invalidateSize();
    } catch (e) {}
  }
}
(window as any).invalidateMapSize = invalidateMapSize;

export function flyToDestination(lat: number, lng: number, label = '', zoomLevel = 10): void {
  const safeLat = Number(lat);
  const safeLng = Number(lng);
  if (isNaN(safeLat) || isNaN(safeLng) || !isFinite(safeLat) || !isFinite(safeLng)) return;

  if (googleMapInstance) {
    googleMapInstance.panTo({ lat: safeLat, lng: safeLng });
    googleMapInstance.setZoom(zoomLevel);
    if (label) showToast(`📍 Flying to ${label}`, 'info');
  } else if (leafletMapInstance) {
    leafletMapInstance.flyTo([safeLat, safeLng], zoomLevel, { duration: 1.5 });
    if (label) showToast(`📍 Flying to ${label}`, 'info');
  }
}
(window as any).flyToDestination = flyToDestination;

export function locateUserPosition(): void {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }
  showToast('Detecting your GPS location...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      flyToDestination(lat, lng, 'Your GPS Position', 12);
    },
    (err) => {
      console.warn('Geolocation denied/failed:', err);
      showToast('Could not retrieve GPS location.', 'error');
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}
(window as any).locateUserPosition = locateUserPosition;

// ==================== PROFILE HOME CITY MINI-MAP ====================

/**
 * Initializes the draggable home city mini-map on #home-city-mini-map.
 */
export function initHomeCityMiniMap(initialLat: number, initialLng: number): void {
  const miniEl = document.getElementById('home-city-mini-map') || document.getElementById('profile-home-minimap');
  if (!miniEl) return;

  const lat = initialLat && !isNaN(Number(initialLat)) ? Number(initialLat) : 18.5204;
  const lng = initialLng && !isNaN(Number(initialLng)) ? Number(initialLng) : 73.8567;

  loadGoogleMapsSDK()
    .then((maps) => {
      const activePhase = getCurrentActivePhase();
      const styles = getStylesForPhase(activePhase.phase);

      if (homeCityGoogleMap) {
        google.maps.event.trigger(homeCityGoogleMap, 'resize');
        homeCityGoogleMap.setCenter({ lat, lng });
        if (homeCityGoogleMarker) {
          homeCityGoogleMarker.setPosition({ lat, lng });
        }
        return;
      }

      homeCityGoogleMap = new maps.Map(miniEl, {
        center: { lat, lng },
        zoom: 11,
        disableDefaultUI: true,
        zoomControl: true,
        styles,
        gestureHandling: 'greedy'
      });

      // Draggable marker to set exact home location
      homeCityGoogleMarker = new maps.Marker({
        position: { lat, lng },
        map: homeCityGoogleMap,
        draggable: true,
        title: 'Drag to set your home base pin'
      });

      const coordsLabel = document.getElementById('home-city-coords-text');
      if (coordsLabel) {
        coordsLabel.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      }

      if (homeCityGoogleMarker) {
        homeCityGoogleMarker.addListener('dragend', () => {
          const pos = homeCityGoogleMarker?.getPosition();
          if (pos) {
            updateHomeCityMiniMapPosition(pos.lat(), pos.lng());
          }
        });
      }

      if (homeCityGoogleMap) {
        homeCityGoogleMap.addListener('click', (e: any) => {
          if (e && e.latLng) {
            homeCityGoogleMarker?.setPosition(e.latLng);
            updateHomeCityMiniMapPosition(e.latLng.lat(), e.latLng.lng());
          }
        });
      }

      syncMapTileTheme();
    })
    .catch(() => {
      initLeafletHomeMiniMapFallback(lat, lng, miniEl);
    });
}
(window as any).initHomeCityMiniMap = initHomeCityMiniMap;

/**
 * Updates coordinates in inputs and centers mini-map.
 */
export function updateHomeCityMiniMapPosition(lat: number, lng: number): void {
  const safeLat = !isNaN(Number(lat)) && Number(lat) !== 0 ? Number(lat) : 18.5204;
  const safeLng = !isNaN(Number(lng)) && Number(lng) !== 0 ? Number(lng) : 73.8567;

  const latInp = document.getElementById('input-home-lat') as HTMLInputElement | null;
  const lngInp = document.getElementById('input-home-lng') as HTMLInputElement | null;
  if (latInp) latInp.value = String(safeLat);
  if (lngInp) lngInp.value = String(safeLng);

  try {
    const profile = getCurrentProfile();
    if (profile) {
      profile.homeLat = safeLat;
      profile.homeLng = safeLng;
    }
  } catch (err) {}

  if (homeCityGoogleMap) {
    homeCityGoogleMap.panTo({ lat: safeLat, lng: safeLng });
    if (homeCityGoogleMarker) {
      homeCityGoogleMarker.setPosition({ lat: safeLat, lng: safeLng });
    }
  } else if (leafletHomeCityMiniMap) {
    leafletHomeCityMiniMap.flyTo([safeLat, safeLng], 11);
    if (leafletHomeCityMiniMarker) {
      leafletHomeCityMiniMarker.setLatLng([safeLat, safeLng]);
    }
  }

  const coordsLabel = document.getElementById('home-city-coords-text');
  if (coordsLabel) {
    coordsLabel.textContent = `Lat: ${safeLat.toFixed(4)}, Lng: ${safeLng.toFixed(4)}`;
  }
}
(window as any).updateHomeCityMiniMapPosition = updateHomeCityMiniMapPosition;

// ==================== LEAFLET OFFLINE FALLBACK IMPLEMENTATION ====================

const DAY_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const NIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
let currentLeafletTileLayer: any = null;

function syncLeafletFallbackTiles(isDark: boolean) {
  if (typeof L === 'undefined') return;
  const activeUrl = isDark ? NIGHT_TILE_URL : DAY_TILE_URL;
  const options = isDark ? { subdomains: 'abcd', maxZoom: 20 } : { maxZoom: 19 };

  if (leafletMapInstance) {
    if (currentLeafletTileLayer) leafletMapInstance.removeLayer(currentLeafletTileLayer);
    currentLeafletTileLayer = L.tileLayer(activeUrl, options).addTo(leafletMapInstance);
    if (currentLeafletTileLayer.bringToBack) currentLeafletTileLayer.bringToBack();
  }
}

function initLeafletFallbackMap() {
  if (typeof L === 'undefined') return;
  const mapEl = document.getElementById('map');
  if (!mapEl || leafletMapInstance) return;

  leafletMapInstance = L.map('map', {
    center: [20.5937, 78.9629],
    zoom: 5,
    zoomControl: false,
    attributionControl: true
  });
  L.control.zoom({ position: 'topright' }).addTo(leafletMapInstance);
  leafletMarkersLayer = L.layerGroup().addTo(leafletMapInstance);
  const isDark = document.documentElement.classList.contains('dark');
  syncLeafletFallbackTiles(isDark);
  renderTravelerPins(currentCircuitFilter);
}

function initLeafletLandingFallback() {
  if (typeof L === 'undefined') return;
  const landingEl = document.getElementById('landing-interactive-map');
  if (!landingEl || leafletLandingMapInstance) return;

  leafletLandingMapInstance = L.map('landing-interactive-map', {
    center: [21.5, 78.9629],
    zoom: 5,
    zoomControl: false,
    attributionControl: true
  });
  L.control.zoom({ position: 'topright' }).addTo(leafletLandingMapInstance);
  leafletLandingMarkersLayer = L.layerGroup().addTo(leafletLandingMapInstance);
  const isDark = document.documentElement.classList.contains('dark');
  L.tileLayer(isDark ? NIGHT_TILE_URL : DAY_TILE_URL, { maxZoom: 19 }).addTo(leafletLandingMapInstance);
  renderLandingTravelerPins();
}

function initLeafletHomeMiniMapFallback(lat: number, lng: number, miniEl: HTMLElement) {
  if (typeof L === 'undefined') return;
  if (leafletHomeCityMiniMap) {
    leafletHomeCityMiniMap.setView([lat, lng], 10);
    if (leafletHomeCityMiniMarker) leafletHomeCityMiniMarker.setLatLng([lat, lng]);
    return;
  }

  leafletHomeCityMiniMap = L.map(miniEl.id, {
    center: [lat, lng],
    zoom: 10,
    zoomControl: false,
    attributionControl: false
  });
  const isDark = document.documentElement.classList.contains('dark');
  L.tileLayer(isDark ? NIGHT_TILE_URL : DAY_TILE_URL, { maxZoom: 19 }).addTo(leafletHomeCityMiniMap);
  leafletHomeCityMiniMarker = L.marker([lat, lng], { draggable: true }).addTo(leafletHomeCityMiniMap);

  leafletHomeCityMiniMarker.on('dragend', (e: any) => {
    const pos = e.target.getLatLng();
    updateHomeCityMiniMapPosition(pos.lat, pos.lng);
  });
  leafletHomeCityMiniMap.on('click', (e: any) => {
    if (e && e.latlng) {
      leafletHomeCityMiniMarker?.setLatLng(e.latlng);
      updateHomeCityMiniMapPosition(e.latlng.lat, e.latlng.lng);
    }
  });
}

function renderLeafletTravelerPins(filteredTravelers: Traveler[]) {
  if (!leafletMarkersLayer || typeof L === 'undefined') return;
  leafletMarkersLayer.clearLayers();

  filteredTravelers.forEach((traveler) => {
    const tLat = Number(traveler.lat);
    const tLng = Number(traveler.lng);
    if (isNaN(tLat) || isNaN(tLng)) return;

    const isVerified = traveler.verificationStatus === 'verified';
    const shieldBadgeHtml = isVerified
      ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">✓</span>`
      : traveler.verificationStatus === 'pending'
      ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⏳</span>`
      : ``;

    const photo = (traveler as any).photoUrl || traveler.photo || DEFAULT_AVATAR;
    const ringBorder = (traveler as any).isCurrentUser
      ? 'border-amber-500 ring-2 ring-amber-300'
      : isVerified
      ? 'border-emerald-500'
      : 'border-rose-500';

    const iconHtml = `
      <div class="relative cursor-pointer group custom-avatar-pin" style="width: 44px; height: 44px;">
        <div class="absolute inset-0 rounded-full ${
          (traveler as any).isCurrentUser ? 'bg-amber-400/30' : 'bg-rose-500/20'
        } pin-pulse"></div>
        <div class="w-10 h-10 rounded-full border-2 ${ringBorder} bg-white overflow-hidden shadow-lg transform transition group-hover:scale-110 flex items-center justify-center">
          <img src="${escapeHtml(photo)}" alt="${escapeHtml(traveler.name)}" class="w-full h-full object-cover" />
        </div>
        ${
          (traveler as any).isCurrentUser
            ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 font-extrabold text-[8px] px-1 rounded-full shadow-xs">YOU</span>'
            : shieldBadgeHtml
        }
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-avatar-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -28]
    });

    const marker = L.marker([tLat, tLng], { icon: customIcon });
    const bioSnippet = traveler.bio
      ? traveler.bio.length > 95
        ? traveler.bio.substring(0, 95) + '...'
        : traveler.bio
      : 'Traveler exploring India.';

    const popupContent = `
      <div class="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-[240px] text-xs font-sans text-black">
        <div class="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
          <img src="${escapeHtml(photo)}" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
          <div class="min-w-0 flex-1">
            <div class="font-extrabold text-black truncate">${escapeHtml(traveler.name)}</div>
            <div class="text-[11px] text-black font-medium truncate">${escapeHtml(
              (traveler as any).upcomingCircuit || traveler.currentCircuit || 'India'
            )}</div>
          </div>
        </div>
        <p class="text-[11px] text-black py-2 leading-relaxed line-clamp-2 font-normal">${escapeHtml(
          bioSnippet
        )}</p>
        <button onclick="${
          (traveler as any).isCurrentUser
            ? "switchView('profile')"
            : "inspectTravelerFromMap('" + escapeHtml(traveler.uid) + "')"
        }" class="w-full py-1.5 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs transition cursor-pointer">
          ${(traveler as any).isCurrentUser ? 'Edit Profile' : 'View Profile'}
        </button>
      </div>
    `;

    marker.bindPopup(popupContent, { autoPanPadding: [20, 80], offset: L.point(0, -28) });
    leafletMarkersLayer.addLayer(marker);
  });
}
