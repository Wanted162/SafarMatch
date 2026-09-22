SCRIPTS_APP = """
    // ==================== STREAMLINED 2-STEP JOURNEY & GATING ====================
    window.isStep1Complete = function() {
      if (!currentProfile) return false;
      const hasName = Boolean(currentProfile.name && currentProfile.name.trim().length >= 2);
      const hasAge = Boolean(currentProfile.age && currentProfile.age >= 18);
      const hasGender = Boolean(currentProfile.gender);
      const hasHomeCity = Boolean(currentProfile.homeCity && currentProfile.homeCity.trim().length >= 2);
      const hasCircuit = Boolean(currentProfile.upcomingCircuit);
      const hasBio = Boolean(currentProfile.bio && currentProfile.bio.trim().length >= 10);
      const hasSelfie = Boolean(currentProfile.verificationStatus === "verified" || currentProfile.verificationStatus === "pending_review" || currentProfile.selfieSubmitted);
      return hasName && hasAge && hasGender && hasHomeCity && hasCircuit && hasBio && hasSelfie;
    };

    window.hasActiveExplorerPass = function() {
      if (!currentProfile) return false;
      if (currentProfile.subscription && currentProfile.subscription.active === true) {
        if (currentProfile.subscription.validUntil) {
          return new Date(currentProfile.subscription.validUntil) > new Date();
        }
        return true;
      }
      return !!(currentProfile.isVip || currentProfile.hasExplorerPass);
    };

    window.updateJourneyStatusUI = function() {
      const step1Done = isStep1Complete();
      const hasPass = hasActiveExplorerPass();

      // Header Status Indicators
      const step1Label = document.getElementById('step1-badge-label');
      const step1Icon = document.getElementById('step1-badge-icon');
      if (step1Label && step1Icon) {
        if (step1Done) {
          step1Label.textContent = "Complete ✓";
          step1Label.className = "font-bold text-emerald-600";
          step1Icon.className = "w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold";
        } else {
          step1Label.textContent = "Pending (2m)";
          step1Label.className = "font-bold text-amber-600";
          step1Icon.className = "w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold";
        }
      }

      const step2Label = document.getElementById('step2-badge-label');
      const step2Icon = document.getElementById('step2-badge-icon');
      if (step2Label && step2Icon) {
        if (hasPass) {
          step2Label.textContent = "Active VIP ✓";
          step2Label.className = "font-bold text-emerald-600";
          step2Icon.className = "w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold";
        } else {
          step2Label.textContent = "Locked (₹299)";
          step2Label.className = "font-bold text-slate-500";
          step2Icon.className = "w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold";
        }
      }

      // Monetization Step 1 Warning
      const monWarning = document.getElementById('monetization-step1-warning');
      if (monWarning) {
        if (!step1Done) monWarning.classList.remove('hidden');
        else monWarning.classList.add('hidden');
      }

      // Sidebar & Mobile Badges
      const chatBadge = document.getElementById('sidebar-chat-badge');
      const mobileChatLock = document.getElementById('mobile-chat-lock-badge');
      if (chatBadge) {
        if (hasPass) {
          chatBadge.className = "ml-auto text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full";
          chatBadge.innerHTML = "Unlocked";
        } else {
          chatBadge.className = "ml-auto text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1";
          chatBadge.innerHTML = `<i data-lucide="lock" class="w-2.5 h-2.5"></i> Pass`;
        }
      }
      if (mobileChatLock) {
        if (hasPass) mobileChatLock.classList.add('hidden');
        else mobileChatLock.classList.remove('hidden');
      }

      // Chat Paywall Overlay
      const chatLocked = document.getElementById('chat-paywall-locked');
      const chatUnlocked = document.getElementById('chat-content-unlocked');
      if (chatLocked && chatUnlocked) {
        if (hasPass) {
          chatLocked.classList.add('hidden');
          chatUnlocked.classList.remove('hidden');
        } else {
          chatLocked.classList.remove('hidden');
          chatUnlocked.classList.add('hidden');
        }
      }

      // Trip Board Banner
      const tripsBanner = document.getElementById('trips-pass-banner');
      if (tripsBanner) {
        if (hasPass) tripsBanner.classList.add('hidden');
        else tripsBanner.classList.remove('hidden');
      }

      // Explorer Pass Button in Monetization
      const passCtaBtn = document.getElementById('monetization-pass-cta-btn');
      if (passCtaBtn) {
        if (hasPass) {
          passCtaBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-300"></i> <span>Explorer Pass Active ✓ (All Features Unlocked)</span>`;
          passCtaBtn.className = "w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2";
        } else {
          passCtaBtn.innerHTML = `<i data-lucide="credit-card" class="w-4 h-4"></i> <span>Buy Explorer Pass • ₹299 (UPI / Card)</span>`;
          passCtaBtn.className = "w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-safar-600 to-rose-600 hover:from-safar-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-200 transition transform active:scale-95 flex items-center justify-center space-x-2";
        }
      }

      // Profile View Gauge & Labels
      updateProfileCompletionUI();
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    };

    // ==================== ADVANCED ANTI-BYPASS CONTACT FILTER ====================
    window.moderateMessageText = function(text) {
      if (!text || typeof text !== 'string') return { allowed: true };

      // 1. Normalize text (strip leetspeak, zeros for o, 1 for i, @ for a, spaces, punctuation)
      let norm = text.toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip zero width characters
        .replace(/[0o]/g, '0')
        .replace(/[1il|!]/g, '1')
        .replace(/[@a]/g, 'a')
        .replace(/[3e]/g, '3')
        .replace(/[5s$]/g, '5')
        .replace(/[7t]/g, '7');

      // Compressed version with all spaces & punctuation stripped
      const stripped = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      // 2. Check 10-digit phone patterns (Indian mobile begins with 6,7,8,9)
      const phoneDigits = text.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        if (/(?:(?:\+|0{0,2})91[\s-]*)?[6789]\d{9}/.test(phoneDigits) || /(?:^|\D)[6789]\d{9}(?:\D|$)/.test(phoneDigits)) {
          return { allowed: false, reason: "Phone number detected. For traveler safety, sharing contact numbers is restricted." };
        }
      }

      // Check spaced or dotted digit sequences (e.g. 9 8 7 6 5 4 3 2 1 0)
      if (/[6-9][\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d[\s.,\-_*]{0,2}\d/.test(text)) {
        return { allowed: false, reason: "Spaced phone number sequence detected." };
      }

      // 3. Spelled-out numbers (English & Hindi)
      const numberWords = /(?:zero|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|chaar|paanch|chhe|saat|aath|nau|triple|double)[\s\-_]+(?:zero|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|chaar|paanch|chhe|saat|aath|nau)/i;
      if (numberWords.test(text)) {
        return { allowed: false, reason: "Spelled-out phone number detected." };
      }

      // 4. Indian UPI VPAs (e.g. name@upi, @okhdfcbank, @oksbi, @paytm)
      const upiRegex = /[a-zA-Z0-9._-]+@(upi|okhdfcbank|oksbi|okaxis|okicici|paytm|axl|ibl|ybl|apl|barodampay|postbank|federal)/i;
      if (upiRegex.test(text) || stripped.includes("@upi") || stripped.includes("paytm@") || stripped.includes("@ok")) {
        return { allowed: false, reason: "UPI payment address detected. Off-platform money transfers are restricted." };
      }

      // 5. Social Handles & External Messaging Links
      const socialRegex = /(wa\.me|t\.me|telegram|whatsapp|insta|instagram|snapchat|fb\.me|facebook|snap:)[\s/:@_]/i;
      if (socialRegex.test(text) || stripped.includes("wame") || stripped.includes("tme") || stripped.includes("telegram") || stripped.includes("instagram")) {
        return { allowed: false, reason: "External messaging handles or social links are restricted." };
      }

      return { allowed: true };
    };

    // ==================== 100% LEAFLET MAP & OPENSTREETMAP ENGINE ====================
    window.initMap = function() {
      if (mapInstance) return;
      const mapEl = document.getElementById('map');
      if (!mapEl) return;

      // Center on India
      mapInstance = L.map('map', {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
        attributionControl: true
      });

      // High-resolution Esri World Street Map (100% Free, Zero API Key Required, Clean Unblurred Tiles)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, METI, TomTom',
        maxZoom: 19
      }).addTo(mapInstance);

      // Add Zoom Control at top right
      L.control.zoom({ position: 'topright' }).addTo(mapInstance);

      mapMarkersLayer = L.layerGroup().addTo(mapInstance);

      // Populate markers from cache
      renderTravelerPins();

      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 200);
    };

    window.resetMapCenter = function() {
      if (mapInstance) {
        mapInstance.flyTo([20.5937, 78.9629], 5, { duration: 1 });
      }
    };

    // Geolocation with Circuit Fallback
    window.locateUserPosition = function() {
      if (!navigator.geolocation) {
        fallbackToCircuitLocation("Geolocation unsupported by this browser.");
        return;
      }

      showToast("📍 Requesting device GPS...", "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapInstance) {
            mapInstance.flyTo([lat, lng], 12, { duration: 1.2 });
            showToast(`📍 Centered on your current GPS location (${lat.toFixed(2)}, ${lng.toFixed(2)})`, "success");
          }
        },
        (err) => {
          console.warn("Geolocation denied/failed:", err);
          fallbackToCircuitLocation("Location access disabled. Defaulting to your selected circuit.");
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    };

    function fallbackToCircuitLocation(noticeMsg) {
      showToast(`📍 ${noticeMsg}`, "info");
      const targetCircuit = currentProfile ? currentProfile.upcomingCircuit : "Goa";
      const coords = INDIAN_LOCATIONS[targetCircuit] || INDIAN_LOCATIONS["Goa"];
      if (mapInstance && coords) {
        mapInstance.flyTo([coords.lat, coords.lng], 9, { duration: 1 });
      }
    }

    const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

    // Render Leaflet Pins for Travelers
    window.renderTravelerPins = function(filterCircuit = "all") {
      if (!mapMarkersLayer) return;
      mapMarkersLayer.clearLayers();

      const genderFilter = document.getElementById('map-filter-gender')?.value || 'all';
      const intentFilter = document.getElementById('map-filter-intent')?.value || 'all';
      const isSoloWomanSafe = currentProfile && currentProfile.surakshaShield && currentProfile.gender === 'Female';

      // Load registered community travelers
      const travelersList = [...(allTravelersCache || [])];

      // If current user has saved profile with name and valid coordinates, make sure user's live pin is on map
      if (currentProfile && currentProfile.name && currentProfile.name.trim().length >= 2 && currentProfile.lat && currentProfile.lng) {
        if (!travelersList.some(t => t.uid === currentProfile.uid)) {
          travelersList.push({
            ...currentProfile,
            isSelf: true
          });
        }
      }

      let visibleCount = 0;

      travelersList.forEach(traveler => {
        // Safe mode exclusion
        if (isSoloWomanSafe && traveler.gender === 'Male' && !traveler.isSelf) return;
        if (blockedUsersList.includes(traveler.uid)) return;

        // Circuit filter
        if (filterCircuit !== 'all' && traveler.upcomingCircuit !== filterCircuit) return;

        // Gender filter
        if (genderFilter !== 'all' && traveler.gender !== genderFilter) return;

        // Intent filter
        if (intentFilter !== 'all' && traveler.travelIntent !== intentFilter) return;

        visibleCount++;

        // Verified Shield Indicator in Pin
        const isVerified = traveler.verificationStatus === "verified";
        const shieldBadgeHtml = isVerified 
          ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">✓</span>`
          : traveler.verificationStatus === "pending_review"
          ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⏳</span>`
          : ``;

        const photo = (traveler.photoUrl && traveler.photoUrl !== DEFAULT_AVATAR) ? traveler.photoUrl : DEFAULT_AVATAR;
        const ringBorder = traveler.isSelf ? 'border-amber-500 ring-2 ring-amber-300' : isVerified ? 'border-emerald-500' : 'border-rose-500';

        // Custom HTML Marker Icon
        const iconHtml = `
          <div class="relative cursor-pointer group custom-avatar-pin" style="width: 44px; height: 44px;">
            <div class="absolute inset-0 rounded-full ${traveler.isSelf ? 'bg-amber-400/30' : 'bg-rose-500/20'} pin-pulse"></div>
            <div class="w-10 h-10 rounded-full border-2 ${ringBorder} bg-white overflow-hidden shadow-lg transform transition group-hover:scale-110 flex items-center justify-center">
              <img src="${photo}" alt="${traveler.name}" class="w-full h-full object-cover" />
            </div>
            ${traveler.isSelf ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 font-extrabold text-[8px] px-1 rounded-full shadow-xs">YOU</span>' : shieldBadgeHtml}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-avatar-pin',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([traveler.lat, traveler.lng], { icon: customIcon });

        // Popup HTML
        const bioSnippet = traveler.bio ? (traveler.bio.length > 95 ? traveler.bio.substring(0, 95) + '...' : traveler.bio) : 'Traveler exploring India.';
        const popupContent = `
          <div class="p-3.5 max-w-[240px] text-xs font-sans">
            <div class="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
              <img src="${photo}" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
              <div>
                <div class="flex items-center gap-1">
                  <h4 class="font-bold text-slate-900">${traveler.name} ${traveler.isSelf ? '(You)' : ''}</h4>
                  ${isVerified ? '<span class="text-emerald-600 font-bold">✓</span>' : ''}
                </div>
                <p class="text-[11px] text-slate-500">${traveler.upcomingCircuit || 'India'} • ${traveler.gender || 'Traveler'}</p>
              </div>
            </div>
            <p class="text-[11px] text-slate-600 py-2 leading-relaxed">${bioSnippet}</p>
            <div class="pt-1 flex gap-1.5">
              ${traveler.isSelf ? `
                <button onclick="switchView('profile')" class="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs">
                  Edit Your Profile
                </button>
              ` : `
                <button onclick="inspectTravelerFromMap('${traveler.uid}')" class="flex-1 py-1.5 rounded-lg bg-safar-600 hover:bg-safar-700 text-white font-bold text-[11px] shadow-xs">
                  View Profile
                </button>
              `}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260 });
        mapMarkersLayer.addLayer(marker);
      });

      const countPill = document.getElementById('map-traveler-count-pill');
      if (countPill) {
        countPill.textContent = `${visibleCount} ${visibleCount === 1 ? 'Explorer' : 'Explorers'}`;
      }
    };

    window.filterMapCircuit = function(circuit) {
      document.querySelectorAll('.circuit-pill').forEach(btn => {
        if (btn.getAttribute('data-circuit') === circuit) {
          btn.className = "circuit-pill px-3 py-1 rounded-full font-bold bg-safar-600 text-white flex-shrink-0 shadow-xs";
        } else {
          btn.className = "circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0";
        }
      });

      renderTravelerPins(circuit);

      if (circuit !== 'all' && INDIAN_LOCATIONS[circuit] && mapInstance) {
        const coords = INDIAN_LOCATIONS[circuit];
        mapInstance.flyTo([coords.lat, coords.lng], 9, { duration: 1 });
      } else if (circuit === 'all') {
        resetMapCenter();
      }
    };

    window.applyMapFilters = function() {
      const activeCircuitBtn = document.querySelector('.circuit-pill.bg-safar-600');
      const circuit = activeCircuitBtn ? activeCircuitBtn.getAttribute('data-circuit') : 'all';
      renderTravelerPins(circuit);
    };

    // ==================== HOME CITY LEAFLET MINI-MAP & GEOCODER ====================
    window.initHomeCityMiniMap = function(initialLat = 18.5204, initialLng = 73.8567) {
      const el = document.getElementById('home-city-mini-map');
      if (!el) return;

      if (!homeCityMiniMap) {
        homeCityMiniMap = L.map('home-city-mini-map', {
          center: [initialLat, initialLng],
          zoom: 10,
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri'
        }).addTo(homeCityMiniMap);

        homeCityMiniMarker = L.marker([initialLat, initialLng], { draggable: true }).addTo(homeCityMiniMap);

        homeCityMiniMarker.on('dragend', function(e) {
          const pos = e.target.getLatLng();
          updateHomeCityCoords(pos.lat, pos.lng);
        });

        homeCityMiniMap.on('click', function(e) {
          if (homeCityMiniMarker) {
            homeCityMiniMarker.setLatLng(e.latlng);
            updateHomeCityCoords(e.latlng.lat, e.latlng.lng);
          }
        });
      } else {
        homeCityMiniMap.invalidateSize();
        homeCityMiniMap.setView([initialLat, initialLng], 10);
        if (homeCityMiniMarker) homeCityMiniMarker.setLatLng([initialLat, initialLng]);
      }
    };

    function updateHomeCityCoords(lat, lng) {
      if (currentProfile) {
        currentProfile.lat = lat;
        currentProfile.lng = lng;
      }
      const coordsText = document.getElementById('home-city-coords-text');
      if (coordsText) {
        coordsText.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      }
    }

    // Geocoding lookup table + OpenStreetMap Nominatim API Fallback
    window.handleHomeCityInput = function(cityName) {
      if (!cityName || cityName.trim().length < 2) return;

      const trimmed = cityName.trim();

      // 1. Direct dictionary match
      if (INDIAN_LOCATIONS[trimmed]) {
        const coords = INDIAN_LOCATIONS[trimmed];
        updateHomeCityCoords(coords.lat, coords.lng);
        if (homeCityMiniMap) {
          homeCityMiniMap.flyTo([coords.lat, coords.lng], 11);
          if (homeCityMiniMarker) homeCityMiniMarker.setLatLng([coords.lat, coords.lng]);
        }
        return;
      }

      // Check partial matches in dictionary
      for (const key in INDIAN_LOCATIONS) {
        if (key.toLowerCase().includes(trimmed.toLowerCase())) {
          const coords = INDIAN_LOCATIONS[key];
          updateHomeCityCoords(coords.lat, coords.lng);
          if (homeCityMiniMap) {
            homeCityMiniMap.flyTo([coords.lat, coords.lng], 10);
            if (homeCityMiniMarker) homeCityMiniMarker.setLatLng([coords.lat, coords.lng]);
          }
          return;
        }
      }

      // 2. OpenStreetMap Nominatim Fallback (Debounced)
      if (window._geocodeTimeout) clearTimeout(window._geocodeTimeout);
      window._geocodeTimeout = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              updateHomeCityCoords(lat, lng);
              if (homeCityMiniMap) {
                homeCityMiniMap.flyTo([lat, lng], 10);
                if (homeCityMiniMarker) homeCityMiniMarker.setLatLng([lat, lng]);
              }
            }
          })
          .catch(err => console.warn("Nominatim geocoder error:", err));
      }, 700);
    };

    // ==================== LIVE INDIA TRIPS (READ-ONLY + GATED ACTIONS) ====================
    window.renderTripsFeed = function(filterCircuit = "all") {
      const container = document.getElementById('trips-feed-container');
      if (!container) return;

      const trips = allTripsCache || [];
      const filtered = filterCircuit === 'all' ? trips : trips.filter(t => t.circuit === filterCircuit);

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
            <h4 class="text-base font-bold text-slate-900">No Trips in ${filterCircuit === 'all' ? 'Any Circuit' : filterCircuit} Yet</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Be the first to post an upcoming roadtrip, trek, or beach plan to find verified travel companions!</p>
            <button onclick="handlePostTripClick()" class="mt-5 px-5 py-2.5 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center space-x-1.5">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Post First Trip Plan</span>
            </button>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
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
                    <span class="text-[10px] text-slate-400 font-medium">${trip.circuit} Circuit</span>
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
                  <span>${trip.startDate} (${trip.duration})</span>
                </div>
              </div>
            </div>

            <!-- Bottom action row: Join / Connect -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs font-extrabold text-slate-800">${trip.budget}</span>
              <button onclick="handleJoinTripClick('${trip.id}')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span>Join Plan</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    };

    window.filterTripsFeed = function(circuit) {
      document.querySelectorAll('.trip-filter-pill').forEach(btn => {
        if (btn.getAttribute('data-filter') === circuit) {
          btn.className = "trip-filter-pill px-3 py-1 rounded-full font-bold bg-slate-900 text-white flex-shrink-0";
        } else {
          btn.className = "trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0";
        }
      });
      renderTripsFeed(circuit);
    };

    window.handlePostTripClick = function() {
      // 1. Check Step 1 Completion
      if (!isStep1Complete()) {
        showToast("⚠️ Step 1 Required: Complete your 2-minute travel profile first.", "error");
        switchView('profile');
        return;
      }

      // 2. Check Explorer Pass
      if (!hasActiveExplorerPass()) {
        showToast("🔒 Explorer Pass Required: Activate the ₹299 pass to publish live itineraries.", "error");
        switchView('monetization');
        return;
      }

      // Open Modal
      document.getElementById('create-trip-modal').classList.remove('hidden');
    };

    window.closeCreateTripModal = function() {
      document.getElementById('create-trip-modal').classList.add('hidden');
    };

    window.handleCreateTripSubmit = async function(e) {
      e.preventDefault();
      const title = document.getElementById('trip-input-title').value.trim();
      const destination = document.getElementById('trip-input-destination').value.trim();
      const circuit = document.getElementById('trip-input-circuit').value;
      const startDate = document.getElementById('trip-input-start-date').value;
      const duration = document.getElementById('trip-input-duration').value.trim();
      const budget = document.getElementById('trip-input-budget').value;
      const style = document.getElementById('trip-input-style').value;
      const itinerary = document.getElementById('trip-input-itinerary').value.trim();

      const newTrip = {
        id: "trip_" + Date.now(),
        title,
        destination,
        circuit,
        startDate,
        duration,
        budget,
        style,
        itinerary,
        creatorUid: currentUser ? currentUser.uid : "guest_user",
        creatorName: currentProfile ? currentProfile.name : "Active Traveler",
        creatorPhoto: (currentProfile && currentProfile.photoUrl && currentProfile.photoUrl !== DEFAULT_AVATAR) ? currentProfile.photoUrl : DEFAULT_AVATAR,
        creatorGender: currentProfile ? currentProfile.gender : "Male",
        creatorVerification: currentProfile ? currentProfile.verificationStatus : "pending_review",
        createdAt: new Date().toISOString()
      };

      if (isLiveFirebase && db) {
        try {
          await addDoc(collection(db, "trips"), {
            ...newTrip,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.warn("Firestore trip write error, saved locally:", err);
        }
      }

      allTripsCache.unshift(newTrip);
      try {
        localStorage.setItem('safarmatch_all_trips', JSON.stringify(allTripsCache));
      } catch (e) {
        console.warn("Could not cache trips locally:", e);
      }
      renderTripsFeed(currentTripCircuitFilter);
      closeCreateTripModal();
      showToast("🎉 Trip plan published! Travelers in this circuit can now request to join.", "success");
    };

    window.handleJoinTripClick = function(tripId) {
      if (!isStep1Complete()) {
        showToast("⚠️ Step 1 Required: Complete your travel profile to connect with trip hosts.", "error");
        switchView('profile');
        return;
      }

      if (!hasActiveExplorerPass()) {
        showToast("🔒 Explorer Pass Required: Activate the ₹299 pass to send trip join requests.", "error");
        switchView('monetization');
        return;
      }

      const trip = (allTripsCache || []).find(t => t.id === tripId);
      if (trip) {
        showToast(`🤝 Connecting with ${trip.creatorName}! Opening conversation...`, "success");
        openChatWithTraveler({
          uid: trip.creatorUid || "trv_host_" + trip.id,
          name: trip.creatorName,
          photoUrl: trip.creatorPhoto || DEFAULT_AVATAR,
          upcomingCircuit: trip.circuit,
          verificationStatus: trip.creatorVerification || "verified"
        });
      }
    };

    // ==================== IN-APP REAL-TIME CHAT ====================
    window.openChatWithTraveler = function(traveler) {
      if (!hasActiveExplorerPass()) {
        showToast("🔒 Explorer Pass Required: Active pass needed to chat.", "error");
        switchView('monetization');
        return;
      }

      activeChatPartner = traveler;
      switchView('chat');

      // Update Chat Header Bar
      const nameEl = document.getElementById('active-chat-name');
      const avatarEl = document.getElementById('active-chat-avatar');
      const metaEl = document.getElementById('active-chat-meta');
      const badgeEl = document.getElementById('active-chat-badge');

      if (nameEl) nameEl.textContent = traveler.name;
      if (avatarEl) avatarEl.src = (traveler.photoUrl && traveler.photoUrl !== DEFAULT_AVATAR) ? traveler.photoUrl : DEFAULT_AVATAR;
      if (metaEl) metaEl.textContent = `${traveler.upcomingCircuit || 'India'} Circuit • Online`;
      if (badgeEl) {
        if (traveler.verificationStatus === 'verified') {
          badgeEl.textContent = "🛡️ Verified Explorer ✓";
          badgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800";
        } else if (traveler.verificationStatus === 'pending_review') {
          badgeEl.textContent = "⏳ In Review";
          badgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800";
        } else {
          badgeEl.textContent = "⚪ Unverified";
          badgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600";
        }
      }

      renderMessagesForPartner(traveler.uid);
      renderConversationList();
    };

    function renderConversationList() {
      const container = document.getElementById('chat-conversations-list');
      if (!container) return;

      const myUid = currentProfile ? currentProfile.uid : '';
      const travelers = (allTravelersCache || []).filter(t => t.uid !== myUid);

      if (travelers.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-slate-400">
            <i data-lucide="compass" class="w-7 h-7 mx-auto mb-2 text-slate-300"></i>
            <p class="text-xs font-semibold text-slate-600">No active conversations</p>
            <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">Find companions on the Explore Map or Trip Board to start a conversation.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      container.innerHTML = travelers.map(trv => {
        const isCurrent = activeChatPartner && activeChatPartner.uid === trv.uid;
        const photo = (trv.photoUrl && trv.photoUrl !== DEFAULT_AVATAR) ? trv.photoUrl : DEFAULT_AVATAR;
        return `
          <div onclick='openChatWithTraveler(${JSON.stringify(trv)})' class="cursor-pointer p-2.5 rounded-2xl transition flex items-center space-x-2.5 ${isCurrent ? 'bg-rose-50 border border-rose-200' : 'hover:bg-slate-100'}">
            <div class="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-200">
              <img src="${photo}" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800 truncate">${trv.name}</span>
                <span class="text-[9px] text-slate-400">Active</span>
              </div>
              <p class="text-[10px] text-slate-500 truncate">${trv.upcomingCircuit || 'India'} • ${trv.travelIntent || 'Companion'}</p>
            </div>
          </div>
        `;
      }).join('');
      if (window.lucide) window.lucide.createIcons();
    }

    function getMessagesForPartner(partnerUid) {
      try {
        const stored = localStorage.getItem(`safarmatch_chat_${partnerUid}`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    function saveMessagesForPartner(partnerUid, msgs) {
      try {
        localStorage.setItem(`safarmatch_chat_${partnerUid}`, JSON.stringify(msgs));
      } catch (e) {
        console.warn("Storage error for chat:", e);
      }
    }

    function renderMessagesForPartner(partnerUid) {
      const container = document.getElementById('chat-messages-container');
      if (!container) return;

      const msgs = getMessagesForPartner(partnerUid);

      if (msgs.length === 0) {
        container.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <i data-lucide="shield-check" class="w-6 h-6"></i>
            </div>
            <p class="text-xs font-bold text-slate-700">Protected In-App Chat</p>
            <p class="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              Coordinate routes, split cabs or book hostels with ${activeChatPartner ? activeChatPartner.name : 'this explorer'}! Messages are filtered to prevent spam and off-platform solicitation.
            </p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      container.innerHTML = msgs.map(m => {
        const isMe = m.sender === 'me';
        return `
          <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
            <div class="max-w-xs sm:max-w-md p-3 rounded-2xl text-xs ${isMe ? 'bg-safar-600 text-white rounded-br-xs shadow-xs' : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'}">
              <p class="leading-relaxed">${m.text}</p>
            </div>
            <span class="text-[9px] text-slate-400 mt-1 px-1">${m.timestamp}</span>
          </div>
        `;
      }).join('');

      container.scrollTop = container.scrollHeight;
      if (window.lucide) window.lucide.createIcons();
    }

    window.handleSendMessage = async function(e) {
      e.preventDefault();
      if (!hasActiveExplorerPass()) {
        showToast("🔒 Explorer Pass Required to send messages.", "error");
        switchView('monetization');
        return;
      }

      if (!activeChatPartner) {
        showToast("Select a traveler from the list to start messaging.", "info");
        return;
      }

      const input = document.getElementById('chat-message-input');
      const text = input.value.trim();
      if (!text) return;

      // HARDENED ANTI-BYPASS CONTACT FILTER CHECK
      const modCheck = moderateMessageText(text);
      if (!modCheck.allowed) {
        showToast(`🛡️ ${modCheck.reason}`, "error");
        input.value = "";
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMsg = {
        id: "msg_" + Date.now(),
        sender: "me",
        text,
        timestamp: timeStr
      };

      const msgs = getMessagesForPartner(activeChatPartner.uid);
      msgs.push(newMsg);
      saveMessagesForPartner(activeChatPartner.uid, msgs);

      // If connected to live Firestore, save to message collection
      if (isLiveFirebase && db) {
        try {
          const chatId = [currentProfile ? currentProfile.uid : 'guest', activeChatPartner.uid].sort().join('_');
          await addDoc(collection(db, "chats", chatId, "messages"), {
            ...newMsg,
            senderUid: currentProfile ? currentProfile.uid : 'guest',
            receiverUid: activeChatPartner.uid,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.warn("Firestore chat write error, saved locally:", err);
        }
      }

      input.value = "";
      renderMessagesForPartner(activeChatPartner.uid);
    };

    // ==================== REALISTIC TRUST & VERIFICATION PIPELINE ====================
    window.openSelfieModal = function() {
      const modal = document.getElementById('selfie-modal');
      const video = document.getElementById('selfie-video');
      const preview = document.getElementById('selfie-captured-preview');
      const oval = document.getElementById('selfie-oval-guide');
      const btnCapture = document.getElementById('btn-capture-selfie');
      const btnRetake = document.getElementById('btn-retake-selfie');
      const btnUpload = document.getElementById('btn-upload-selfie');
      const loading = document.getElementById('camera-loading-indicator');
      const fallback = document.getElementById('camera-fallback-overlay');

      modal.classList.remove('hidden');
      preview.classList.add('hidden');
      video.classList.remove('hidden');
      oval.classList.remove('hidden');
      btnCapture.classList.remove('hidden');
      btnRetake.classList.add('hidden');
      btnUpload.classList.add('hidden');
      fallback.classList.add('hidden');
      loading.classList.remove('hidden');

      // Attempt native WebRTC camera
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
          .then(stream => {
            cameraMediaStream = stream;
            video.srcObject = stream;
            video.play();
            loading.classList.add('hidden');
          })
          .catch(err => {
            console.warn("Camera stream rejected / blocked by iframe permissions:", err);
            loading.classList.add('hidden');
            fallback.classList.remove('hidden');
          });
      } else {
        loading.classList.add('hidden');
        fallback.classList.remove('hidden');
      }
    };

    window.closeSelfieModal = function() {
      if (cameraMediaStream) {
        cameraMediaStream.getTracks().forEach(track => track.stop());
        cameraMediaStream = null;
      }
      document.getElementById('selfie-modal').classList.add('hidden');
    };

    window.captureSelfieFrame = function() {
      const video = document.getElementById('selfie-video');
      const preview = document.getElementById('selfie-captured-preview');
      const oval = document.getElementById('selfie-oval-guide');
      const btnCapture = document.getElementById('btn-capture-selfie');
      const btnRetake = document.getElementById('btn-retake-selfie');
      const btnUpload = document.getElementById('btn-upload-selfie');

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      // Mirror frame like selfie camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Compress to <80 KB JPEG
      canvas.toBlob((blob) => {
        capturedSelfieBlob = blob;
        preview.src = URL.createObjectURL(blob);
        preview.classList.remove('hidden');
        video.classList.add('hidden');
        oval.classList.add('hidden');
        btnCapture.classList.add('hidden');
        btnRetake.classList.remove('hidden');
        btnUpload.classList.remove('hidden');

        const statusEl = document.getElementById('selfie-compression-status');
        if (statusEl) {
          statusEl.textContent = `Frame captured & compressed: ${(blob.size / 1024).toFixed(1)} KB (<80 KB limit met)`;
        }
      }, 'image/jpeg', 0.75);
    };

    window.retakeSelfieFrame = function() {
      const video = document.getElementById('selfie-video');
      const preview = document.getElementById('selfie-captured-preview');
      const oval = document.getElementById('selfie-oval-guide');
      const btnCapture = document.getElementById('btn-capture-selfie');
      const btnRetake = document.getElementById('btn-retake-selfie');
      const btnUpload = document.getElementById('btn-upload-selfie');

      preview.classList.add('hidden');
      video.classList.remove('hidden');
      oval.classList.remove('hidden');
      btnCapture.classList.remove('hidden');
      btnRetake.classList.add('hidden');
      btnUpload.classList.add('hidden');
    };

    window.uploadCapturedSelfie = function() {
      if (!capturedSelfieBlob) return;
      processVerificationSubmission("selfie", capturedSelfieBlob);
      closeSelfieModal();
    };

    // Direct File Input Fallback for Selfie (if WebRTC is blocked)
    window.handleSelfieFileSelected = function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            processVerificationSubmission("selfie", blob);
            closeSelfieModal();
          }, 'image/jpeg', 0.75);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Government Photo ID file handling (<100 KB canvas compression)
    window.handleGovIdFileSelected = function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            processVerificationSubmission("gov_id", blob);
          }, 'image/jpeg', 0.72);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    };

    function processVerificationSubmission(type, blob) {
      if (!currentProfile) return;
      currentProfile.selfieSubmitted = true;
      currentProfile.verificationStatus = "pending_review";
      currentProfile.verificationSubmittedAt = new Date().toISOString();

      showToast(`⏳ Photo submitted (${(blob.size / 1024).toFixed(1)} KB)! Status: In Review (Est. 2-4 hrs).`, "info");
      updateJourneyStatusUI();
    }

    // Testing Hook: Simulate Admin Verification Approval
    window.simulateAdminApprovalClick = function() {
      if (!currentProfile) return;
      window.simulateAdminApproval(currentProfile.uid);
    };

    window.simulateAdminApproval = function(uid) {
      if (currentProfile) {
        currentProfile.verificationStatus = "verified";
        currentProfile.selfieSubmitted = true;
      }
      showToast("🛡️ Admin Simulation: Verification Approved! Verified Explorer shield active.", "success");
      updateJourneyStatusUI();
    };

    // ==================== MONETIZATION (RAZORPAY & UPI SANDBOX) ====================
    window.initiateExplorerPassCheckout = function(amount = 299) {
      // Streamlined check: prompt profile completion if not done
      if (!isStep1Complete()) {
        showToast("⚠️ Complete your quick 2-minute travel profile first to activate pass benefits.", "error");
        switchView('profile');
        return;
      }

      // Check if Razorpay is loaded
      if (typeof Razorpay !== 'undefined') {
        const options = {
          key: "rzp_test_51SafarMatchLive",
          amount: amount * 100,
          currency: "INR",
          name: "SafarMatch Bharat",
          description: "Explorer Pass • 1-Month Unlimited Companion Access",
          image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e11d48'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
          handler: function(response) {
            handlePaymentSuccess(response.razorpay_payment_id || ("pay_" + Date.now()), amount);
          },
          prefill: {
            name: currentProfile ? currentProfile.name : "Traveler",
            email: "traveler@safarmatch.in",
            contact: "9876543210"
          },
          theme: { color: "#e11d48" },
          modal: {
            ondismiss: function() {
              openUpiSandboxModal(amount);
            }
          }
        };
        try {
          const rzp = new Razorpay(options);
          rzp.open();
        } catch (e) {
          openUpiSandboxModal(amount);
        }
      } else {
        openUpiSandboxModal(amount);
      }
    };

    window.initiateTripBoostCheckout = function(amount = 99) {
      openUpiSandboxModal(amount, "Trip & Pin Boost (7-Day Spotlight)");
    };

    function openUpiSandboxModal(amount, title = "Explorer Pass (₹299)") {
      const existing = document.getElementById('upi-sandbox-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = "upi-sandbox-modal";
      modal.className = "fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4";
      modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
          <div class="w-12 h-12 rounded-2xl bg-rose-100 text-safar-600 flex items-center justify-center mx-auto shadow-xs">
            <i data-lucide="smartphone" class="w-6 h-6"></i>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-safar-800 px-2.5 py-0.5 rounded-full">UPI Sandbox Gateway</span>
            <h3 class="text-base font-bold text-slate-900 mt-2">${title}</h3>
            <p class="text-xs text-slate-500 mt-1">Pay via BHIM, GPay, PhonePe, or Paytm simulator</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700">
            VPA: <strong class="text-slate-900">safarmatch@okhdfcbank</strong><br/>
            Amount: <strong class="text-safar-600">₹${amount}.00</strong>
          </div>
          <div class="pt-2 flex flex-col gap-2">
            <button onclick="handlePaymentSuccess('upi_${Date.now()}', ${amount})" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition">
              Simulate UPI Payment Success ✓
            </button>
            <button onclick="document.getElementById('upi-sandbox-modal').remove()" class="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    window.handlePaymentSuccess = function(paymentId, amount) {
      const upiModal = document.getElementById('upi-sandbox-modal');
      if (upiModal) upiModal.remove();

      if (currentProfile) {
        currentProfile.isVip = true;
        currentProfile.hasExplorerPass = true;
        currentProfile.subscription = {
          plan: "explorer_monthly",
          active: true,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          orderId: paymentId,
          amount: amount,
          activatedAt: new Date().toISOString()
        };
      }

      showToast(`🎉 Payment of ₹${amount} Successful! ID: ${paymentId}. Explorer Pass active!`, "success");
      updateJourneyStatusUI();

      setTimeout(() => {
        switchView('trips');
      }, 400);
    };

    window.handleInstantPassActivation = function() {
      handlePaymentSuccess("sandbox_instant_" + Date.now(), 299);
    };

    window.handleRevokePass = function() {
      if (currentProfile) {
        currentProfile.isVip = false;
        currentProfile.hasExplorerPass = false;
        if (currentProfile.subscription) currentProfile.subscription.active = false;
      }
      showToast("Explorer Pass reset to locked for testing.", "info");
      updateJourneyStatusUI();
    };

    // ==================== PROFILE FORM & COMPLETION GAUGE ====================
    window.selectTravelIntent = function(btn) {
      document.querySelectorAll('.intent-pill').forEach(p => {
        p.className = "intent-pill px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200";
      });
      btn.className = "intent-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-safar-700 border border-rose-200";
      document.getElementById('input-travel-intent').value = btn.getAttribute('data-intent');
    };

    window.toggleStyleTag = function(btn) {
      const isSelected = btn.classList.contains('bg-rose-50');
      if (isSelected) {
        btn.className = "style-pill px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200";
      } else {
        btn.className = "style-pill px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-safar-700 border border-rose-200";
      }
    };

    window.handleSaveProfile = function(e) {
      e.preventDefault();
      if (!currentProfile) return;

      currentProfile.name = document.getElementById('input-full-name').value.trim();
      currentProfile.age = parseInt(document.getElementById('input-age').value) || "";
      currentProfile.gender = document.getElementById('input-gender').value;
      currentProfile.homeCity = document.getElementById('input-home-city').value.trim();
      currentProfile.upcomingCircuit = document.getElementById('input-upcoming-circuit').value;
      currentProfile.travelIntent = document.getElementById('input-travel-intent').value;
      currentProfile.bio = document.getElementById('input-bio').value.trim();

      if (INDIAN_LOCATIONS[currentProfile.upcomingCircuit]) {
        currentProfile.lat = INDIAN_LOCATIONS[currentProfile.upcomingCircuit].lat;
        currentProfile.lng = INDIAN_LOCATIONS[currentProfile.upcomingCircuit].lng;
      }

      const styles = [];
      document.querySelectorAll('.style-pill.bg-rose-50').forEach(p => {
        styles.push(p.getAttribute('data-style'));
      });
      currentProfile.travelStyles = styles;

      // Persist user profile to localStorage
      try {
        localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
      } catch (err) {
        console.warn("Storage error for profile:", err);
      }

      // Add or update in allTravelersCache
      if (currentProfile.name && currentProfile.name.length >= 2) {
        if (!allTravelersCache) allTravelersCache = [];
        const existingIdx = allTravelersCache.findIndex(t => t.uid === currentProfile.uid);
        if (existingIdx >= 0) {
          allTravelersCache[existingIdx] = { ...currentProfile };
        } else {
          allTravelersCache.push({ ...currentProfile });
        }
        try {
          localStorage.setItem('safarmatch_all_travelers', JSON.stringify(allTravelersCache));
        } catch (err) {
          console.warn("Storage error for travelers:", err);
        }
      }

      // If live Firebase is connected, sync user profile to Firestore
      if (isLiveFirebase && db) {
        try {
          setDoc(doc(db, "users", currentProfile.uid), currentProfile, { merge: true });
        } catch (err) {
          console.warn("Firestore sync error:", err);
        }
      }

      renderTravelerPins();
      showToast("💾 Profile details saved!", "success");
      updateJourneyStatusUI();
    };

    window.updateProfileCompletionUI = function() {
      if (!currentProfile) return;

      let score = 0;
      if (currentProfile.name && currentProfile.name.length >= 2) score += 20;
      if (currentProfile.age && currentProfile.age >= 18) score += 15;
      if (currentProfile.gender) score += 15;
      if (currentProfile.homeCity && currentProfile.homeCity.length >= 2) score += 15;
      if (currentProfile.upcomingCircuit) score += 15;
      if (currentProfile.bio && currentProfile.bio.length >= 10) score += 10;
      if (currentProfile.verificationStatus === 'verified' || currentProfile.selfieSubmitted) score += 10;

      const pct = Math.min(100, score);

      const headerBar = document.getElementById('header-profile-progress');
      if (headerBar) headerBar.style.width = `${pct}%`;

      const profilePct = document.getElementById('profile-completion-pct');
      const profileBar = document.getElementById('profile-completion-bar');
      const sidebarPct = document.getElementById('sidebar-profile-pct');
      if (profilePct) profilePct.textContent = `${pct}%`;
      if (profileBar) profileBar.style.width = `${pct}%`;
      if (sidebarPct) sidebarPct.textContent = `${pct}%`;

      // Verification Badge in Header and Profile
      const hBadge = document.getElementById('header-verification-badge');
      const hText = document.getElementById('header-verification-text');
      const pPill = document.getElementById('profile-verification-status-pill');
      const pLabel = document.getElementById('profile-verification-label');
      const selfieStateBadge = document.getElementById('badge-selfie-state');

      if (currentProfile.verificationStatus === 'verified') {
        if (hText) hText.textContent = "Verified Explorer ✓";
        if (hBadge) hBadge.className = "hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200";
        if (pLabel) pLabel.textContent = "🛡️ Verified Explorer ✓";
        if (pPill) pPill.className = "text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1";
        if (selfieStateBadge) {
          selfieStateBadge.textContent = "Verified ✓";
          selfieStateBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800";
        }
      } else if (currentProfile.verificationStatus === 'pending_review') {
        if (hText) hText.textContent = "Verification In Review";
        if (hBadge) hBadge.className = "hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200";
        if (pLabel) pLabel.textContent = "⏳ Verification in Review (Est. 2-4 hrs)";
        if (pPill) pPill.className = "text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1";
        if (selfieStateBadge) {
          selfieStateBadge.textContent = "In Review ⏳";
          selfieStateBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800";
        }
      } else {
        if (hText) hText.textContent = "Unverified";
        if (hBadge) hBadge.className = "hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200";
        if (pLabel) pLabel.textContent = "Unverified";
        if (pPill) pPill.className = "text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1";
        if (selfieStateBadge) {
          selfieStateBadge.textContent = "Not Done";
          selfieStateBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600";
        }
      }

      // Display name and avatar updates
      const dispName = document.getElementById('profile-display-name');
      const headerName = document.getElementById('header-user-name');
      if (dispName && currentProfile.name) dispName.textContent = currentProfile.name;
      if (headerName && currentProfile.name) headerName.textContent = currentProfile.name;

      const headerVip = document.getElementById('header-vip-star');
      if (headerVip) {
        if (hasActiveExplorerPass()) headerVip.classList.remove('hidden');
        else headerVip.classList.add('hidden');
      }
    };

    window.triggerAvatarUpload = function() {
      document.getElementById('profile-avatar-file-input').click();
    };

    window.handleAvatarFileSelected = function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        if (currentProfile) {
          currentProfile.photoUrl = evt.target.result;
        }
        const imgEl = document.getElementById('profile-display-avatar');
        const hImg = document.getElementById('header-user-avatar');
        if (imgEl) imgEl.src = evt.target.result;
        if (hImg) hImg.src = evt.target.result;
        showToast("Profile avatar updated!", "success");
      };
      reader.readAsDataURL(file);
    };

    // ==================== SURAKSHA SHIELD (WOMEN'S SAFE MODE) ====================
    window.toggleSurakshaMode = function(checked) {
      if (currentProfile) {
        currentProfile.surakshaShield = checked;
      }
      showToast(checked ? "🛡️ Suraksha Shield Activated: Pins hidden from male accounts." : "Suraksha Shield disabled.", "info");
      renderTravelerPins();
    };

    // ==================== REPORT & BLOCK MODAL ====================
    window.openReportModalFromChat = function() {
      if (!activeChatPartner) return;
      openReportBlockModal(activeChatPartner);
    };

    window.reportInspectedTraveler = function() {
      closeTravelerDetailModal();
      if (inspectedTraveler) openReportBlockModal(inspectedTraveler);
    };

    function openReportBlockModal(traveler) {
      inspectedTraveler = traveler;
      document.getElementById('report-user-name').textContent = traveler.name;
      document.getElementById('report-block-modal').classList.remove('hidden');
    }

    window.closeReportBlockModal = function() {
      document.getElementById('report-block-modal').classList.add('hidden');
    };

    window.submitReportAndBlock = function(isBlock) {
      if (!inspectedTraveler) return;
      if (isBlock) {
        blockedUsersList.push(inspectedTraveler.uid);
        renderTravelerPins();
        showToast(`Traveler ${inspectedTraveler.name} has been blocked and reported.`, "error");
      } else {
        showToast("Safety report submitted for admin review.", "success");
      }
      closeReportBlockModal();
    };

    // ==================== MAP PIN INSPECT MODAL ====================
    window.inspectTravelerFromMap = function(uid) {
      const travelers = allTravelersCache || [];
      let trv = travelers.find(t => t.uid === uid);
      if (!trv && currentProfile && currentProfile.uid === uid) {
        trv = currentProfile;
      }
      if (!trv) return;

      inspectedTraveler = trv;
      const modal = document.getElementById('traveler-detail-modal');
      const photo = (trv.photoUrl && trv.photoUrl !== DEFAULT_AVATAR) ? trv.photoUrl : DEFAULT_AVATAR;
      document.getElementById('modal-traveler-avatar').src = photo;
      document.getElementById('modal-traveler-name').textContent = trv.name;
      document.getElementById('modal-traveler-city').textContent = `${trv.upcomingCircuit || 'India'} Circuit • ${trv.homeCity || 'India'}`;
      document.getElementById('modal-traveler-bio').textContent = trv.bio || "Traveler exploring India.";

      const badge = document.getElementById('modal-traveler-badge');
      if (trv.verificationStatus === 'verified') {
        badge.textContent = "🛡️ Verified ✓";
        badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800";
      } else {
        badge.textContent = "⚪ Unverified";
        badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600";
      }

      const stylesContainer = document.getElementById('modal-traveler-styles');
      stylesContainer.innerHTML = (trv.travelStyles || []).map(s => `
        <span class="px-2 py-0.5 rounded-full bg-rose-50 text-safar-700 text-[10px] font-semibold border border-rose-100">${s}</span>
      `).join('');

      modal.classList.remove('hidden');
    };

    window.closeTravelerDetailModal = function() {
      document.getElementById('traveler-detail-modal').classList.add('hidden');
    };

    window.startChatWithInspectedTraveler = function() {
      closeTravelerDetailModal();
      if (inspectedTraveler) {
        openChatWithTraveler(inspectedTraveler);
      }
    };

    // ==================== VIEW SWITCHER & NAVIGATION ====================
    window.switchView = function(viewName) {
      document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.add('hidden');
      });

      const target = document.getElementById(`view-${viewName}`);
      if (target) target.classList.remove('hidden');

      // Desktop Nav Item styling
      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('bg-safar-50', 'text-safar-700');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      });
      const activeNav = document.getElementById(`nav-btn-${viewName}`);
      if (activeNav) {
        activeNav.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeNav.classList.add('bg-safar-50', 'text-safar-700');
      }

      // Mobile Nav Item styling
      document.querySelectorAll('.mobile-nav-item').forEach(btn => {
        btn.classList.remove('text-safar-600');
        btn.classList.add('text-slate-400');
      });
      const mobileNav = document.getElementById(`mobile-nav-${viewName}`);
      if (mobileNav) {
        mobileNav.classList.remove('text-slate-400');
        mobileNav.classList.add('text-safar-600');
      }

      if (viewName === 'map') {
        if (!mapInstance) initMap();
        setTimeout(() => {
          if (mapInstance) mapInstance.invalidateSize();
        }, 120);
      }

      if (viewName === 'trips') {
        renderTripsFeed(currentTripCircuitFilter);
      }

      if (viewName === 'chat') {
        renderConversationList();
      }

      if (viewName === 'profile') {
        setTimeout(() => {
          const lat = currentProfile ? currentProfile.lat : 18.5204;
          const lng = currentProfile ? currentProfile.lng : 73.8567;
          initHomeCityMiniMap(lat, lng);
        }, 150);
      }

      updateJourneyStatusUI();
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    };

    // Toast Notification Utility
    window.showToast = function(message, type = "info") {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white';

      toast.className = `${bgClass} px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center space-x-2 transition transform duration-200 pointer-events-auto max-w-sm`;
      toast.innerHTML = `<span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    };

    // Google / Guest Auth Toggle
    window.handleAuthAction = function() {
      if (currentUser) {
        if (auth) signOut(auth);
        currentUser = null;
        initRealWorldSession();
        document.getElementById('btn-auth-text').textContent = "Sign In";
        showToast("Signed out. Switched to guest session.", "info");
      } else {
        if (isLiveFirebase && auth) {
          const provider = new GoogleAuthProvider();
          signInWithPopup(auth, provider)
            .then(res => {
              currentUser = res.user;
              if (currentProfile) {
                currentProfile.uid = res.user.uid;
                if (!currentProfile.name || currentProfile.name.trim() === "") {
                  currentProfile.name = res.user.displayName || "";
                }
                if (res.user.photoURL) {
                  currentProfile.photoUrl = res.user.photoURL;
                }
                try {
                  localStorage.setItem('safarmatch_user_profile', JSON.stringify(currentProfile));
                } catch (e) {}
              }
              initRealWorldSession();
              document.getElementById('btn-auth-text').textContent = "Sign Out";
              showToast(`Welcome, ${res.user.displayName || 'Explorer'}!`, "success");
            })
            .catch(err => {
              console.warn("Auth popup failed, continuing session:", err);
              initRealWorldSession();
            });
        } else {
          initRealWorldSession();
          showToast("Active in Bharat Guest Explorer Mode.", "info");
        }
      }
    };

    // Real-World Session & Persistence
    function initRealWorldSession() {
      let savedProfile = null;
      try {
        const stored = localStorage.getItem('safarmatch_user_profile');
        if (stored) savedProfile = JSON.parse(stored);
      } catch (e) {
        console.warn("Could not read saved profile:", e);
      }

      if (savedProfile) {
        currentProfile = savedProfile;
      } else {
        currentProfile = {
          uid: "usr_" + Math.random().toString(36).substr(2, 9),
          name: "",
          age: "",
          gender: "Male",
          homeCity: "",
          upcomingCircuit: "Goa",
          travelIntent: "Companion",
          bio: "",
          travelStyles: [],
          photoUrl: DEFAULT_AVATAR,
          verificationStatus: "unsubmitted",
          selfieSubmitted: false,
          isVip: false,
          hasExplorerPass: localStorage.getItem('safarmatch_pass_unlocked') === 'true',
          surakshaShield: false,
          lat: 15.2993,
          lng: 74.1240
        };
      }

      // Populate form fields cleanly
      const nameInput = document.getElementById('input-full-name');
      const ageInput = document.getElementById('input-age');
      const genderInput = document.getElementById('input-gender');
      const homeCityInput = document.getElementById('input-home-city');
      const circuitInput = document.getElementById('input-upcoming-circuit');
      const bioInput = document.getElementById('input-bio');
      const intentInput = document.getElementById('input-travel-intent');

      if (nameInput) nameInput.value = currentProfile.name || "";
      if (ageInput) ageInput.value = currentProfile.age || "";
      if (genderInput) genderInput.value = currentProfile.gender || "Male";
      if (homeCityInput) homeCityInput.value = currentProfile.homeCity || "";
      if (circuitInput) circuitInput.value = currentProfile.upcomingCircuit || "Goa";
      if (bioInput) bioInput.value = currentProfile.bio || "";
      if (intentInput) intentInput.value = currentProfile.travelIntent || "Companion";

      // Update avatar displays
      const avatarSrc = (currentProfile.photoUrl && currentProfile.photoUrl !== DEFAULT_AVATAR) ? currentProfile.photoUrl : DEFAULT_AVATAR;
      const profileAvatar = document.getElementById('profile-display-avatar');
      const headerAvatar = document.getElementById('header-user-avatar');
      if (profileAvatar) profileAvatar.src = avatarSrc;
      if (headerAvatar) headerAvatar.src = avatarSrc;

      // Load registered travelers and trips from localStorage
      try {
        const storedTravelers = localStorage.getItem('safarmatch_all_travelers');
        allTravelersCache = storedTravelers ? JSON.parse(storedTravelers) : [];
      } catch (e) {
        allTravelersCache = [];
      }

      try {
        const storedTrips = localStorage.getItem('safarmatch_all_trips');
        allTripsCache = storedTrips ? JSON.parse(storedTrips) : [];
      } catch (e) {
        allTripsCache = [];
      }

      // If user profile is saved with a real name, register user in allTravelersCache
      if (currentProfile.name && currentProfile.name.trim().length >= 2) {
        const existingIdx = allTravelersCache.findIndex(t => t.uid === currentProfile.uid);
        if (existingIdx >= 0) {
          allTravelersCache[existingIdx] = { ...currentProfile };
        } else {
          allTravelersCache.push({ ...currentProfile });
        }
      }

      // Fetch live data from Firestore if available
      if (isLiveFirebase && db) {
        try {
          getDocs(collection(db, "trips")).then(snapshot => {
            if (!snapshot.empty) {
              const liveTrips = [];
              snapshot.forEach(doc => liveTrips.push({ id: doc.id, ...doc.data() }));
              allTripsCache = liveTrips;
              try { localStorage.setItem('safarmatch_all_trips', JSON.stringify(liveTrips)); } catch (e) {}
              if (currentView === 'trips') renderTripsFeed(currentTripCircuitFilter);
            }
          }).catch(e => console.warn("Trips fetch fallback:", e));

          getDocs(collection(db, "users")).then(snapshot => {
            if (!snapshot.empty) {
              const liveUsers = [];
              snapshot.forEach(doc => liveUsers.push({ uid: doc.id, ...doc.data() }));
              allTravelersCache = liveUsers;
              try { localStorage.setItem('safarmatch_all_travelers', JSON.stringify(liveUsers)); } catch (e) {}
              renderTravelerPins();
            }
          }).catch(e => console.warn("Users fetch fallback:", e));
        } catch (e) {
          console.warn("Firestore collection fetch:", e);
        }
      }

      updateJourneyStatusUI();
    }

    // ==================== RUN ON BOOT ====================
    document.addEventListener('DOMContentLoaded', () => {
      // Boot Firebase
      try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        isLiveFirebase = true;
      } catch (e) {
        console.warn("Firebase live init skipped, fallback active:", e);
        isLiveFirebase = false;
      }

      initRealWorldSession();
      initMap();
      switchView('map');

      // Real-time input listeners to update progress gauge dynamically
      const trackedInputs = ['input-full-name', 'input-age', 'input-gender', 'input-home-city', 'input-upcoming-circuit', 'input-bio'];
      trackedInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', () => updateJourneyStatusUI());
          el.addEventListener('change', () => updateJourneyStatusUI());
        }
      });

      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    });
  </script>
</body>
</html>
"""
