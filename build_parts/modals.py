MODALS_AND_DATALISTS = """
  <!-- ==================== MOBILE BOTTOM NAVIGATION BAR ==================== -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 px-1 z-30 shadow-lg">
    <button onclick="switchView('map')" id="mobile-nav-map" class="mobile-nav-item flex flex-col items-center justify-center py-1 px-3 text-safar-600">
      <i data-lucide="map-pin" class="w-5 h-5"></i>
      <span class="text-[10px] font-bold mt-1">Map</span>
    </button>
    <button onclick="switchView('trips')" id="mobile-nav-trips" class="mobile-nav-item flex flex-col items-center justify-center py-1 px-3 text-slate-400">
      <i data-lucide="calendar" class="w-5 h-5"></i>
      <span class="text-[10px] font-medium mt-1">Trips</span>
    </button>
    <button onclick="switchView('chat')" id="mobile-nav-chat" class="mobile-nav-item flex flex-col items-center justify-center py-1 px-3 text-slate-400 relative">
      <i data-lucide="message-circle" class="w-5 h-5"></i>
      <span class="text-[10px] font-medium mt-1">Chat</span>
      <span id="mobile-chat-lock-badge" class="absolute top-1 right-2 text-[9px]">🔒</span>
    </button>
    <button onclick="switchView('monetization')" id="mobile-nav-monetization" class="mobile-nav-item flex flex-col items-center justify-center py-1 px-3 text-slate-400">
      <i data-lucide="zap" class="w-5 h-5"></i>
      <span class="text-[10px] font-medium mt-1">Pass</span>
    </button>
    <button onclick="switchView('profile')" id="mobile-nav-profile" class="mobile-nav-item flex flex-col items-center justify-center py-1 px-3 text-slate-400">
      <i data-lucide="user" class="w-5 h-5"></i>
      <span class="text-[10px] font-medium mt-1">Profile</span>
    </button>
  </nav>

  <!-- ==================== 50+ INDIAN TRAVEL DESTINATIONS DATALIST ==================== -->
  <datalist id="indian-travel-destinations">
    <!-- Goa -->
    <option value="Anjuna, Goa"></option>
    <option value="Arambol, Goa"></option>
    <option value="Palolem, Goa"></option>
    <option value="Vagator, Goa"></option>
    <option value="Panaji, Goa"></option>
    <option value="Morjim, Goa"></option>
    <!-- Himachal -->
    <option value="Kasol, Himachal Pradesh"></option>
    <option value="Manali, Himachal Pradesh"></option>
    <option value="Old Manali, Himachal Pradesh"></option>
    <option value="Tosh, Himachal Pradesh"></option>
    <option value="Kheerganga, Himachal Pradesh"></option>
    <option value="Dharamshala, Himachal Pradesh"></option>
    <option value="McLeodGanj, Himachal Pradesh"></option>
    <option value="Bir Billing, Himachal Pradesh"></option>
    <option value="Jibhi, Himachal Pradesh"></option>
    <option value="Spiti Valley, Himachal Pradesh"></option>
    <option value="Kaza, Himachal Pradesh"></option>
    <option value="Shimla, Himachal Pradesh"></option>
    <!-- Uttarakhand -->
    <option value="Rishikesh, Uttarakhand"></option>
    <option value="Chopta, Uttarakhand"></option>
    <option value="Tungnath, Uttarakhand"></option>
    <option value="Kedarnath, Uttarakhand"></option>
    <option value="Mussoorie, Uttarakhand"></option>
    <option value="Nainital, Uttarakhand"></option>
    <option value="Auli, Uttarakhand"></option>
    <option value="Dehradun, Uttarakhand"></option>
    <option value="Kasar Devi, Uttarakhand"></option>
    <!-- Rajasthan -->
    <option value="Jaipur, Rajasthan"></option>
    <option value="Udaipur, Rajasthan"></option>
    <option value="Jodhpur, Rajasthan"></option>
    <option value="Jaisalmer, Rajasthan"></option>
    <option value="Pushkar, Rajasthan"></option>
    <!-- Ladakh -->
    <option value="Leh, Ladakh"></option>
    <option value="Nubra Valley, Ladakh"></option>
    <option value="Pangong Tso, Ladakh"></option>
    <option value="Zanskar, Ladakh"></option>
    <!-- Kerala -->
    <option value="Varkala, Kerala"></option>
    <option value="Kochi, Kerala"></option>
    <option value="Munnar, Kerala"></option>
    <option value="Alleppey, Kerala"></option>
    <option value="Wayanad, Kerala"></option>
    <!-- Karnataka -->
    <option value="Gokarna, Karnataka"></option>
    <option value="Hampi, Karnataka"></option>
    <option value="Coorg, Karnataka"></option>
    <option value="Chikmagalur, Karnataka"></option>
    <option value="Bengaluru, Karnataka"></option>
    <!-- Major Metros & Hubs -->
    <option value="Mumbai, Maharashtra"></option>
    <option value="Pune, Maharashtra"></option>
    <option value="Delhi NCR"></option>
    <option value="Hyderabad, Telangana"></option>
    <option value="Chennai, Tamil Nadu"></option>
    <option value="Kolkata, West Bengal"></option>
    <option value="Pondicherry"></option>
    <option value="Varanasi, Uttar Pradesh"></option>
    <option value="Agra, Uttar Pradesh"></option>
    <!-- North East -->
    <option value="Shillong, Meghalaya"></option>
    <option value="Cherrapunji, Meghalaya"></option>
    <option value="Ziro Valley, Arunachal Pradesh"></option>
    <option value="Gangtok, Sikkim"></option>
    <option value="Tawang, Arunachal Pradesh"></option>
  </datalist>

  <!-- ==================== MODAL: CREATE A TRIP PLAN ==================== -->
  <div id="create-trip-modal" class="hidden fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Post a Live Trip Plan</h3>
          <p class="text-xs text-slate-500">Unlocks companions for roadtrips, treks & hostel splits.</p>
        </div>
        <button onclick="closeCreateTripModal()" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="create-trip-form" onsubmit="handleCreateTripSubmit(event)" class="space-y-4 pt-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Trip Title *</label>
          <input type="text" id="trip-input-title" required placeholder="e.g. Scooter roadtrip across Arambol & Morjim beaches" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Destination *</label>
            <input type="text" id="trip-input-destination" required placeholder="Type any destination (e.g. Kasol, Varkala, Spiti)..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500" />
            <p class="text-[10px] text-slate-400 mt-0.5">Any place in India or abroad</p>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Circuit / Region Tag *</label>
            <input type="text" id="trip-input-circuit" required placeholder="e.g. Himachal, Goa, Coastal Karnataka, South India..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500" />
            <p class="text-[10px] text-slate-400 mt-0.5">Custom tag for community discovery</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Start Date *</label>
            <input type="date" id="trip-input-start-date" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Duration *</label>
            <input type="text" id="trip-input-duration" required placeholder="e.g. 4 Days / 3 Nights" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Estimated Budget *</label>
            <select id="trip-input-budget" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500">
              <option value="Budget ₹5k–₹10k">Budget ₹5k–₹10k</option>
              <option value="Moderate ₹10k–₹25k">Moderate ₹10k–₹25k</option>
              <option value="Premium ₹25k+">Premium ₹25k+</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Travel Style *</label>
            <select id="trip-input-style" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500">
              <option value="Backpacker">Backpacker</option>
              <option value="Scooter Roadtrip">Scooter Roadtrip</option>
              <option value="Alpine Trek">Alpine Trek</option>
              <option value="Hostel & Cafe">Hostel & Cafe</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Itinerary & Companion Preferences *</label>
          <textarea id="trip-input-itinerary" rows="3" required placeholder="Describe your plan, what you want to split, and who you want to travel with..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-safar-500"></textarea>
        </div>

        <div class="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeCreateTripModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold shadow-md shadow-rose-200 transition">Publish Trip Plan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: LIVE WEBCAM SELFIE VERIFICATION ==================== -->
  <div id="selfie-modal" class="hidden fixed inset-0 z-[1000] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <i data-lucide="camera" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Live Selfie Verification</h3>
            <p class="text-[11px] text-slate-500">Camera stream with iframe fallback (&lt;80 KB)</p>
          </div>
        </div>
        <button onclick="closeSelfieModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Live Video / Captured Photo Stage -->
      <div class="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-200">
        <video id="selfie-video" autoplay playsinline muted class="w-full h-full object-cover transform -scale-x-100"></video>
        <img id="selfie-captured-preview" class="hidden w-full h-full object-cover" alt="Captured Frame" />
        
        <!-- Face Guide Oval Overlay -->
        <div id="selfie-oval-guide" class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div class="w-44 h-56 border-2 border-dashed border-emerald-400/80 rounded-full shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"></div>
          <span class="absolute bottom-3 text-[11px] font-semibold text-white/90 bg-slate-900/70 px-3 py-1 rounded-full">
            Center your face inside oval
          </span>
        </div>

        <!-- Camera Permission / Loading State -->
        <div id="camera-loading-indicator" class="hidden absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white text-xs space-y-2 p-4 text-center">
          <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-emerald-400"></i>
          <span id="camera-loading-text">Requesting camera permission...</span>
        </div>

        <!-- Fallback File Overlay if Camera is Blocked -->
        <div id="camera-fallback-overlay" class="hidden absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white text-xs space-y-3 p-6 text-center">
          <i data-lucide="camera-off" class="w-8 h-8 text-rose-400"></i>
          <p class="font-bold text-sm">Camera Stream Unavailable</p>
          <p class="text-[11px] text-slate-300">Browser or iframe permissions blocked direct stream. You can upload or capture a selfie photo directly:</p>
          <label for="camera-fallback-input" class="cursor-pointer py-2.5 px-4 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5">
            <i data-lucide="upload" class="w-4 h-4"></i>
            <span>Choose Selfie Photo</span>
          </label>
        </div>
      </div>

      <div id="selfie-compression-status" class="text-center text-[11px] text-slate-500 font-mono">
        Ready to capture selfie frame (&lt;80 KB compression enforced)
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2.5 pt-1">
        <button 
          id="btn-capture-selfie" 
          type="button" 
          onclick="captureSelfieFrame()" 
          class="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
        >
          <i data-lucide="aperture" class="w-4 h-4"></i>
          <span>Capture Selfie</span>
        </button>

        <button 
          id="btn-retake-selfie" 
          type="button" 
          onclick="retakeSelfieFrame()" 
          class="hidden flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
        >
          Retake Photo
        </button>

        <button 
          id="btn-upload-selfie" 
          type="button" 
          onclick="uploadCapturedSelfie()" 
          class="hidden flex-1 py-3 px-4 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
        >
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>Submit for Verification</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL: TRAVELER DETAIL INSPECT MODAL (From Map) ==================== -->
  <div id="traveler-detail-modal" class="hidden fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="relative bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center space-x-3 min-w-0">
          <div class="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md flex-shrink-0">
            <img id="modal-traveler-avatar" src="" alt="Avatar" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <h3 id="modal-traveler-name" class="text-base font-bold text-slate-900 truncate">Traveler</h3>
              <span id="modal-traveler-badge" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">⚪ Unverified</span>
            </div>
            <p id="modal-traveler-city" class="text-xs text-slate-500 truncate mt-0.5">Goa Circuit</p>
          </div>
        </div>
        <button type="button" onclick="closeTravelerDetailModal()" title="Close Profile" class="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition flex-shrink-0 -mr-1 -mt-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Bio & Style Pills -->
      <div class="space-y-2 text-xs">
        <p id="modal-traveler-bio" class="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed max-h-36 overflow-y-auto"></p>
        <div id="modal-traveler-styles" class="flex flex-wrap gap-1.5 pt-1"></div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-2 flex gap-2">
        <button id="modal-traveler-msg-btn" onclick="startChatWithInspectedTraveler()" class="flex-1 py-2.5 px-4 rounded-xl bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center justify-center space-x-1.5 cursor-pointer">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Message Traveler</span>
        </button>
        <button type="button" onclick="reportInspectedTraveler()" title="Report or Block" class="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
          <i data-lucide="shield-alert" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL: REPORT & BLOCK TRAVELER ==================== -->
  <div id="report-block-modal" class="hidden fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <i data-lucide="shield-alert" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Safety & Trust Shield</h3>
            <p class="text-xs text-slate-500">Report traveler <span id="report-user-name" class="font-bold text-slate-800">Traveler</span></p>
          </div>
        </div>
        <button onclick="closeReportBlockModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <div class="space-y-3 text-xs text-slate-700">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Reason for Safety Report</label>
          <select id="report-reason-select" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500">
            <option value="harassment">Harassment / Abusive messages</option>
            <option value="spam">Commercial promotion / Spam / Fake ID</option>
            <option value="contact_sharing">Unsolicited phone number or off-platform handle</option>
            <option value="inappropriate">Inappropriate behavior or misconduct</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Additional Details (Optional)</label>
          <textarea id="report-details-text" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500" placeholder="Describe the safety concern..."></textarea>
        </div>

        <div class="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-800">
          Blocking this traveler immediately hides them from your Explore Map, Trip Board, and Chat threads.
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
        <button 
          type="button" 
          onclick="submitReportAndBlock(true)" 
          class="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center space-x-1"
        >
          <i data-lucide="user-x" class="w-4 h-4"></i>
          <span>Block & Submit Report</span>
        </button>
        <button 
          type="button" 
          onclick="submitReportAndBlock(false)" 
          class="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
        >
          Report Only
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="fixed top-5 right-5 z-[2000] flex flex-col gap-2 pointer-events-none"></div>
"""
