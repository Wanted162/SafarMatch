/**
 * SafarMatch — Real-Time Indian Geocoding & Nominatim Autocomplete Engine
 * 
 * Features:
 * - Tier 1: Instant local dictionary matching against 65+ top Indian backpacking circuits
 * - Tier 2: Debounced (300ms) fallback to OpenStreetMap Nominatim API (countrycodes=in&limit=5)
 * - Strict numeric coordinate validation (strictly eliminates NaN / undefined)
 * - Automatic dropdown injection on input elements
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
  { name: "Varanasi", subtext: "Kashi Ghats, Uttar Pradesh", displayName: "Varanasi, Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Agra", subtext: "Taj Mahal, Uttar Pradesh", displayName: "Agra, Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { name: "Shillong", subtext: "Scotland of the East, Meghalaya", displayName: "Shillong, Meghalaya", lat: 25.5788, lng: 91.8933 },
  { name: "Cherrapunji", subtext: "Sohra Living Root Bridges, Meghalaya", displayName: "Cherrapunji (Sohra), Meghalaya", lat: 25.2702, lng: 91.7323 },
  { name: "Dawki", subtext: "Umngot River, West Jaintia Hills, Meghalaya", displayName: "Dawki, Meghalaya", lat: 25.1878, lng: 92.0195 },
  { name: "Tawang", subtext: "Monastery Highlands, Arunachal Pradesh", displayName: "Tawang, Arunachal Pradesh", lat: 27.5861, lng: 91.8654 },
  { name: "Ziro Valley", subtext: "Apatani Plateau, Arunachal Pradesh", displayName: "Ziro, Arunachal Pradesh", lat: 27.5450, lng: 93.8315 },
  { name: "Gangtok", subtext: "East Sikkim, Sikkim", displayName: "Gangtok, Sikkim", lat: 27.3389, lng: 88.6065 },
  { name: "Pelling", subtext: "West Sikkim, Sikkim", displayName: "Pelling, Sikkim", lat: 27.3167, lng: 88.2333 },
  { name: "Darjeeling", subtext: "Queen of the Hills, West Bengal", displayName: "Darjeeling, West Bengal", lat: 27.0410, lng: 88.2663 },
  { name: "Mumbai", subtext: "Financial Capital & Coast, Maharashtra", displayName: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", subtext: "Western Ghats Gateway, Maharashtra", displayName: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Lonavala", subtext: "Sahyadri Hills, Maharashtra", displayName: "Lonavala, Maharashtra", lat: 18.7557, lng: 73.4091 },
  { name: "Alibaug", subtext: "Konkan Coastal Escapes, Maharashtra", displayName: "Alibaug, Maharashtra", lat: 18.6414, lng: 72.8722 },
  { name: "Delhi NCR", subtext: "National Capital Region, New Delhi", displayName: "Delhi NCR, New Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Kolkata", subtext: "Cultural Hub, West Bengal", displayName: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Hyderabad", subtext: "Deccan Plateau, Telangana", displayName: "Hyderabad, Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Chennai", subtext: "Coromandel Coast, Tamil Nadu", displayName: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Pondicherry", subtext: "French Quarter & Auroville, Puducherry", displayName: "Pondicherry, Puducherry", lat: 11.9416, lng: 79.8083 },
  { name: "Ooty", subtext: "Nilgiri Blue Mountains, Tamil Nadu", displayName: "Ooty, Tamil Nadu", lat: 11.4102, lng: 76.6950 },
  { name: "Kodaikanal", subtext: "Princess of Hill Stations, Tamil Nadu", displayName: "Kodaikanal, Tamil Nadu", lat: 10.2381, lng: 77.4892 },
  { name: "Andaman Islands", subtext: "Havelock & Neil Island, Andaman", displayName: "Andaman (Port Blair), India", lat: 11.6234, lng: 92.7265 }
];

const debounceTimers: Record<string, any> = {};

/**
 * Attaches real-time debounced location suggestions dropdown to an input element.
 */
export function attachLocationAutocomplete(
  inputId: string,
  onLocationSelected: (location: LocationSuggestion) => void
): void {
  const inputElement = document.getElementById(inputId) as HTMLInputElement | null;
  if (!inputElement) return;

  const parent = inputElement.parentElement;
  if (!parent) return;

  // Make parent relative so dropdown anchors neatly
  if (!parent.classList.contains('relative')) {
    parent.classList.add('relative');
  }

  const dropdownId = `${inputId}-autocomplete-dropdown`;
  let dropdown = document.getElementById(dropdownId);
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = dropdownId;
    dropdown.className = "hidden absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] max-h-60 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-800";
    parent.appendChild(dropdown);
  }

  const renderSuggestions = (items: LocationSuggestion[]) => {
    if (!dropdown) return;
    if (items.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    dropdown.innerHTML = '';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = "p-2.5 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer transition flex items-center space-x-2 text-left";
      row.innerHTML = `
        <div class="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 text-xs">
          📍
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${item.name}</p>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${item.subtext}</p>
        </div>
      `;

      row.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputElement.value = item.name;
        dropdown?.classList.add('hidden');
        onLocationSelected(item);
      });

      dropdown?.appendChild(row);
    });

    dropdown.classList.remove('hidden');
  };

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
    handleQuery((e.target as HTMLInputElement).value);
  });

  inputElement.addEventListener('focus', () => {
    if (inputElement.value.trim().length >= 2) {
      handleQuery(inputElement.value);
    }
  });

  document.addEventListener('click', (e) => {
    if (!parent.contains(e.target as Node)) {
      dropdown?.classList.add('hidden');
    }
  });
}

/**
 * Initializes and wires up autocompletes across profile inputs, map search bar, and trip creation.
 */
export function setupLocationAutocompletes(): void {
  // 1. Home City Input in Profile View
  attachLocationAutocomplete('input-home-city', (loc) => {
    const latInput = document.getElementById('input-home-lat') as HTMLInputElement | null;
    const lngInput = document.getElementById('input-home-lng') as HTMLInputElement | null;
    if (latInput) latInput.value = loc.lat.toString();
    if (lngInput) lngInput.value = loc.lng.toString();

    const coordsLabel = document.getElementById('home-city-coords-text');
    if (coordsLabel) {
      coordsLabel.textContent = `Home: ${loc.name} (Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)})`;
    }

    if ((window as any).updateHomeCityMiniMapPosition) {
      (window as any).updateHomeCityMiniMapPosition(loc.lat, loc.lng);
    }
  });

  // 2. Upcoming Circuit Input in Profile View
  attachLocationAutocomplete('input-upcoming-circuit', (loc) => {
    const coordsLabel = document.getElementById('home-city-coords-text');
    if (coordsLabel) {
      coordsLabel.textContent = `Upcoming Circuit: ${loc.name} (Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)})`;
    }
  });

  // 3. Floating Destination Search Bar on Explorer Map
  attachLocationAutocomplete('map-destination-search-input', (loc) => {
    if ((window as any).flyToDestination) {
      (window as any).flyToDestination(loc.lat, loc.lng, loc.name, 10);
    }
  });

  // 4. Trip Creation Circuit Input
  attachLocationAutocomplete('trip-input-circuit', (loc) => {
    const tripInput = document.getElementById('trip-input-circuit') as HTMLInputElement | null;
    if (tripInput) tripInput.value = loc.name;
  });
}

export const initAllLocationAutocompletes = setupLocationAutocompletes;

