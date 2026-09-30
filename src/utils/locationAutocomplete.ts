/**
 * SafarMatch — Real-Time Indian Location Autocomplete & Map Pinning
 * Zero-Cost, Leaflet.js Geocoding & Hybrid OSM Nominatim Query Engine
 */

export interface LocationSuggestion {
  displayName: string;
  name: string;
  subtext: string;
  lat: number;
  lng: number;
}

// 65+ Top Indian Backpacking & Nomad Destinations with Pre-Calibrated Coordinates
export const INDIAN_DESTINATIONS_DIRECTORY: LocationSuggestion[] = [
  { name: "Kasol", subtext: "Parvati Valley, Kullu, Himachal Pradesh", displayName: "Kasol, Himachal Pradesh", lat: 32.0100, lng: 77.3150 },
  { name: "Tosh", subtext: "Parvati Valley, Kullu, Himachal Pradesh", displayName: "Tosh, Himachal Pradesh", lat: 32.0154, lng: 77.4528 },
  { name: "Kheerganga", subtext: "Parvati Valley, Kullu, Himachal Pradesh", displayName: "Kheerganga, Himachal Pradesh", lat: 31.9897, lng: 77.5097 },
  { name: "Manali", subtext: "Kullu Valley, Himachal Pradesh", displayName: "Manali, Himachal Pradesh", lat: 32.2432, lng: 77.1892 },
  { name: "Old Manali", subtext: "Kullu Valley, Himachal Pradesh", displayName: "Old Manali, Himachal Pradesh", lat: 32.2571, lng: 77.1772 },
  { name: "Jibhi", subtext: "Tirthan Valley, Banjar, Himachal Pradesh", displayName: "Jibhi, Himachal Pradesh", lat: 31.6366, lng: 77.3486 },
  { name: "Bir Billing", subtext: "Kangra District, Himachal Pradesh", displayName: "Bir Billing, Himachal Pradesh", lat: 32.0469, lng: 76.7188 },
  { name: "Dharamshala", subtext: "Kangra Valley, Himachal Pradesh", displayName: "Dharamshala, Himachal Pradesh", lat: 32.2190, lng: 76.3234 },
  { name: "McLeod Ganj", subtext: "Upper Dharamshala, Himachal Pradesh", displayName: "McLeod Ganj, Himachal Pradesh", lat: 32.2426, lng: 76.3213 },
  { name: "Spiti Valley", subtext: "Lahaul and Spiti, Himachal Pradesh", displayName: "Spiti Valley, Himachal Pradesh", lat: 32.2461, lng: 78.0349 },
  { name: "Kaza", subtext: "Spiti Sub-Division, Himachal Pradesh", displayName: "Kaza, Himachal Pradesh", lat: 32.2268, lng: 78.0722 },
  { name: "Shimla", subtext: "Capital Region, Himachal Pradesh", displayName: "Shimla, Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
  { name: "Kalpa", subtext: "Kinnaur District, Himachal Pradesh", displayName: "Kalpa, Himachal Pradesh", lat: 31.5383, lng: 78.2562 },
  { name: "Rishikesh", subtext: "Dehradun / Tehri Garhwal, Uttarakhand", displayName: "Rishikesh, Uttarakhand", lat: 30.0869, lng: 78.2676 },
  { name: "Mussoorie", subtext: "Dehradun District, Uttarakhand", displayName: "Mussoorie, Uttarakhand", lat: 30.4598, lng: 78.0644 },
  { name: "Auli", subtext: "Chamoli District, Uttarakhand", displayName: "Auli, Uttarakhand", lat: 30.5284, lng: 79.5658 },
  { name: "Nainital", subtext: "Kumaon Region, Uttarakhand", displayName: "Nainital, Uttarakhand", lat: 29.3919, lng: 79.4542 },
  { name: "Kasar Devi", subtext: "Almora District, Uttarakhand", displayName: "Kasar Devi, Uttarakhand", lat: 29.6385, lng: 79.6738 },
  { name: "Chopta", subtext: "Rudraprayag District, Uttarakhand", displayName: "Chopta, Uttarakhand", lat: 30.4852, lng: 79.1824 },
  { name: "Dehradun", subtext: "Capital City, Uttarakhand", displayName: "Dehradun, Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { name: "North Goa", subtext: "Anjuna, Vagator, Arambol, Morjim, Goa", displayName: "North Goa, Goa", lat: 15.5491, lng: 73.7535 },
  { name: "Anjuna", subtext: "North Goa Coastline, Goa", displayName: "Anjuna, Goa", lat: 15.5804, lng: 73.7425 },
  { name: "Arambol", subtext: "Pernem Sub-district, North Goa", displayName: "Arambol, Goa", lat: 15.6865, lng: 73.7042 },
  { name: "Palolem", subtext: "Canacona, South Goa", displayName: "Palolem, Goa", lat: 15.0100, lng: 74.0232 },
  { name: "South Goa", subtext: "Colva, Benaulim, Agonda, Palolem, Goa", displayName: "South Goa, Goa", lat: 15.2832, lng: 73.9862 },
  { name: "Panaji", subtext: "Capital City, North Goa", displayName: "Panaji, Goa", lat: 15.4909, lng: 73.8278 },
  { name: "Gokarna", subtext: "Uttara Kannada, Karnataka", displayName: "Gokarna, Karnataka", lat: 14.5479, lng: 74.3188 },
  { name: "Hampi", subtext: "Vijayanagara District, Karnataka", displayName: "Hampi, Karnataka", lat: 15.3350, lng: 76.4600 },
  { name: "Coorg", subtext: "Kodagu District, Karnataka", displayName: "Coorg (Madikeri), Karnataka", lat: 12.3375, lng: 75.8069 },
  { name: "Chikmagalur", subtext: "Western Ghats, Karnataka", displayName: "Chikmagalur, Karnataka", lat: 13.3161, lng: 75.7720 },
  { name: "Bengaluru", subtext: "Silicon Valley, Karnataka", displayName: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Varkala", subtext: "Thiruvananthapuram, Kerala", displayName: "Varkala, Kerala", lat: 8.7379, lng: 76.7163 },
  { name: "Kochi", subtext: "Fort Kochi & Ernakulam, Kerala", displayName: "Kochi, Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Munnar", subtext: "Idukki District, Western Ghats, Kerala", displayName: "Munnar, Kerala", lat: 10.0889, lng: 77.0595 },
  { name: "Alleppey", subtext: "Alappuzha Backwaters, Kerala", displayName: "Alleppey, Kerala", lat: 9.4981, lng: 76.3388 },
  { name: "Wayanad", subtext: "Kalpetta, Kerala", displayName: "Wayanad, Kerala", lat: 11.6854, lng: 76.1320 },
  { name: "Pushkar", subtext: "Ajmer District, Rajasthan", displayName: "Pushkar, Rajasthan", lat: 26.4897, lng: 74.5511 },
  { name: "Jaipur", subtext: "Pink City, Rajasthan", displayName: "Jaipur, Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Udaipur", subtext: "City of Lakes, Rajasthan", displayName: "Udaipur, Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Jodhpur", subtext: "Blue City, Rajasthan", displayName: "Jodhpur, Rajasthan", lat: 26.2389, lng: 73.0243 },
  { name: "Jaisalmer", subtext: "Golden City & Thar Desert, Rajasthan", displayName: "Jaisalmer, Rajasthan", lat: 26.9157, lng: 70.9083 },
  { name: "Leh", subtext: "Leh District, Ladakh", displayName: "Leh, Ladakh", lat: 34.1526, lng: 77.5771 },
  { name: "Nubra Valley", subtext: "Diskit & Hunder Dunes, Ladakh", displayName: "Nubra Valley, Ladakh", lat: 34.6863, lng: 77.5673 },
  { name: "Pangong Tso", subtext: "Changthang Plateau, Ladakh", displayName: "Pangong Tso, Ladakh", lat: 33.7595, lng: 78.6674 },
  { name: "Zanskar", subtext: "Padum, Kargil District, Ladakh", displayName: "Zanskar, Ladakh", lat: 33.4912, lng: 76.8775 },
  { name: "Mumbai", subtext: "Financial Capital, Maharashtra", displayName: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", subtext: "Cultural Hub, Maharashtra", displayName: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi NCR", subtext: "National Capital Region, Delhi", displayName: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
  { name: "Pondicherry", subtext: "White Town & Auroville, Puducherry", displayName: "Pondicherry, Puducherry", lat: 11.9416, lng: 79.8083 },
  { name: "Varanasi", subtext: "Ghats & Kashi, Uttar Pradesh", displayName: "Varanasi, Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Shillong", subtext: "East Khasi Hills, Meghalaya", displayName: "Shillong, Meghalaya", lat: 25.5788, lng: 91.8933 },
  { name: "Cherrapunji", subtext: "Sohra, Meghalaya", displayName: "Cherrapunji (Sohra), Meghalaya", lat: 25.2986, lng: 91.7324 },
  { name: "Gangtok", subtext: "East Sikkim, Sikkim", displayName: "Gangtok, Sikkim", lat: 27.3389, lng: 88.6065 },
  { name: "Tawang", subtext: "Tawang District, Arunachal Pradesh", displayName: "Tawang, Arunachal Pradesh", lat: 27.5861, lng: 91.8665 },
  { name: "Ziro Valley", subtext: "Lower Subansiri, Arunachal Pradesh", displayName: "Ziro Valley, Arunachal Pradesh", lat: 27.5946, lng: 93.8385 },
  { name: "Hyderabad", subtext: "Telangana Capital, Telangana", displayName: "Hyderabad, Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Chennai", subtext: "Tamil Nadu Capital, Tamil Nadu", displayName: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", subtext: "West Bengal Capital, West Bengal", displayName: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad", subtext: "Gujarat Heritage City, Gujarat", displayName: "Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714 }
];

const debounceTimers: Record<string, any> = {};

/**
 * Attaches an interactive floating autocomplete dropdown to a target input element.
 */
export function setupLocationAutocomplete(
  inputElement: HTMLInputElement,
  onLocationSelected: (location: LocationSuggestion) => void
): void {
  if (!inputElement) return;

  const inputId = inputElement.id || `loc-input-${Math.random().toString(36).substring(2, 8)}`;
  inputElement.id = inputId;

  // Retrieve or create dynamic dropdown container
  let dropdown = document.getElementById(`${inputId}-dropdown`);
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = `${inputId}-dropdown`;
    dropdown.className = "hidden absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 transition-all text-slate-900 dark:text-slate-100";

    const parent = inputElement.parentElement;
    if (parent) {
      if (window.getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(dropdown);
    }
  }

  // Render formatted suggestions list
  const renderSuggestions = (items: LocationSuggestion[]) => {
    if (!dropdown) return;
    if (!items || items.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    dropdown.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = "w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-start space-x-2.5 cursor-pointer text-slate-800 dark:text-slate-100 group border-b border-slate-100 dark:border-slate-800/60 last:border-0";
      btn.innerHTML = `
        <span class="w-6 h-6 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
          📍
        </span>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-slate-900 dark:text-white truncate">${item.name}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${item.subtext}</div>
        </div>
      `;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputElement.value = item.name;
        dropdown?.classList.add('hidden');
        onLocationSelected(item);
      };
      dropdown.appendChild(btn);
    });
    dropdown.classList.remove('hidden');
  };

  // Hybrid Query Engine: Instant Local Match (Tier 1) + OpenStreetMap Nominatim Fallback (Tier 2)
  const handleQuery = async (query: string) => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      dropdown?.classList.add('hidden');
      return;
    }

    // Tier 1: Instant local dictionary matches
    const localMatches = INDIAN_DESTINATIONS_DIRECTORY.filter(d => 
      d.name.toLowerCase().includes(q) || d.subtext.toLowerCase().includes(q)
    ).slice(0, 5);

    if (localMatches.length > 0) {
      renderSuggestions(localMatches);
    }

    // Tier 2: Debounced (300ms) Live OSM Nominatim query if length >= 3
    if (q.length >= 3) {
      clearTimeout(debounceTimers[inputId]);
      debounceTimers[inputId] = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const apiItems: LocationSuggestion[] = data.map((item: any) => {
                const parts = (item.display_name || '').split(',');
                const primaryName = parts[0]?.trim() || item.name || query;
                const sub = parts.slice(1, 4).map((p: string) => p.trim()).join(', ');
                const rawLat = parseFloat(item.lat);
                const rawLng = parseFloat(item.lon);
                return {
                  displayName: item.display_name,
                  name: primaryName,
                  subtext: sub || "India",
                  lat: (!isNaN(rawLat) && rawLat !== 0) ? rawLat : 20.5937,
                  lng: (!isNaN(rawLng) && rawLng !== 0) ? rawLng : 78.9629
                };
              });

              // Merge unique suggestions
              const combined = [...localMatches];
              apiItems.forEach(ai => {
                if (!combined.some(c => c.name.toLowerCase() === ai.name.toLowerCase())) {
                  combined.push(ai);
                }
              });
              renderSuggestions(combined.slice(0, 6));
            }
          }
        } catch (err) {
          // Graceful fallback: local matches remain displayed
        }
      }, 300);
    }
  };

  inputElement.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    handleQuery(val);
  });

  inputElement.addEventListener('focus', () => {
    if (inputElement.value.trim().length >= 2) {
      handleQuery(inputElement.value);
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!inputElement.contains(e.target as Node) && !dropdown?.contains(e.target as Node)) {
      dropdown?.classList.add('hidden');
    }
  });
}

/**
 * Initializes autocomplete for all target inputs:
 * 1. #input-home-city (Profile Home City + Mini-map pinning)
 * 2. #input-upcoming-circuit (Profile Upcoming Travel Circuit)
 * 3. #map-destination-search-input (Interactive Map Search)
 */
export function initAllLocationAutocompletes(): void {
  // 1. Home City Autocomplete
  const homeCityInput = document.getElementById('input-home-city') as HTMLInputElement | null;
  if (homeCityInput) {
    setupLocationAutocomplete(homeCityInput, (loc: LocationSuggestion) => {
      homeCityInput.value = loc.name;
      const lat = (!isNaN(Number(loc.lat)) && Number(loc.lat) !== 0) ? Number(loc.lat) : 18.5204;
      const lng = (!isNaN(Number(loc.lng)) && Number(loc.lng) !== 0) ? Number(loc.lng) : 73.8567;

      // Update current profile coordinates
      if ((window as any).currentProfile) {
        (window as any).currentProfile.lat = lat;
        (window as any).currentProfile.lng = lng;
        (window as any).currentProfile.homeLat = lat;
        (window as any).currentProfile.homeLng = lng;
        (window as any).currentProfile.homeCity = loc.name;
      }

      // Pan mini-map & update draggable pin
      if ((window as any).updateHomeCityMiniMapPosition) {
        (window as any).updateHomeCityMiniMapPosition(lat, lng);
      } else if ((window as any).homeCityMiniMap) {
        try {
          (window as any).homeCityMiniMap.flyTo([lat, lng], 11);
          if ((window as any).homeCityMiniMarker) {
            (window as any).homeCityMiniMarker.setLatLng([lat, lng]);
          }
          const coordsLabel = document.getElementById('home-city-coords-text');
          if (coordsLabel) coordsLabel.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        } catch (e) {}
      }
    });
  }

  // 2. Upcoming Circuit Autocomplete
  const circuitInput = document.getElementById('input-upcoming-circuit') as HTMLInputElement | null;
  if (circuitInput) {
    setupLocationAutocomplete(circuitInput, (loc: LocationSuggestion) => {
      circuitInput.value = loc.name;
      if ((window as any).currentProfile) {
        (window as any).currentProfile.currentCircuit = loc.name;
        (window as any).currentProfile.upcomingDestination = loc.name;
      }
    });
  }

  // 3. Map Floating Destination Search Input
  const mapSearchInput = document.getElementById('map-destination-search-input') as HTMLInputElement | null;
  if (mapSearchInput) {
    setupLocationAutocomplete(mapSearchInput, (loc: LocationSuggestion) => {
      mapSearchInput.value = loc.name;
      const lat = (!isNaN(Number(loc.lat)) && Number(loc.lat) !== 0) ? Number(loc.lat) : 18.5204;
      const lng = (!isNaN(Number(loc.lng)) && Number(loc.lng) !== 0) ? Number(loc.lng) : 73.8567;

      if ((window as any).flyToDestination) {
        (window as any).flyToDestination(loc.name, lat, lng);
      }
    });
  }
}

// Bind to window for standalone compatibility
(window as any).setupLocationAutocomplete = setupLocationAutocomplete;
(window as any).initAllLocationAutocompletes = initAllLocationAutocompletes;
