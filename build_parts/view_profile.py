VIEW_PROFILE = """
      <!-- ==================== VIEW 5: MY TRAVEL PROFILE & TRUST SUITE ==================== -->
      <section id="view-profile" class="view-panel hidden w-full h-full flex flex-col bg-slate-50 overflow-y-auto">
        <div class="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6">

          <!-- Profile Top Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center space-x-4">
              <!-- Avatar with verification ring -->
              <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md flex-shrink-0">
                <img id="profile-display-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E" alt="Profile Avatar" class="w-full h-full object-cover" />
                <button type="button" onclick="triggerAvatarUpload()" title="Change Profile Picture" class="absolute bottom-1 right-1 p-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white transition">
                  <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                </button>
                <input type="file" id="profile-avatar-file-input" accept="image/*" class="hidden" onchange="handleAvatarFileSelected(event)" />
              </div>

              <div>
                <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h2 id="profile-display-name" class="text-xl sm:text-2xl font-extrabold text-slate-900">Your Traveler Profile</h2>
                  <!-- Verification Pipeline Badge -->
                  <div id="profile-verification-status-pill" class="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1">
                    <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                    <span id="profile-verification-label">Unverified</span>
                  </div>
                </div>
                <p id="profile-display-sub" class="text-xs text-slate-500 mt-1">Complete Step 1 to unlock the Explore Map & browse the Trip Board.</p>
              </div>
            </div>

            <!-- Profile Completion Progress Meter -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 sm:w-56 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">Step 1 Progress</span>
                <span id="profile-completion-pct" class="font-extrabold text-safar-600">60%</span>
              </div>
              <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div id="profile-completion-bar" class="h-full bg-gradient-to-r from-safar-600 to-rose-500 rounded-full transition-all duration-300" style="width: 60%"></div>
              </div>
              <p id="profile-completion-hint" class="text-[10px] text-slate-500">Add selfie verification to reach 100%.</p>
            </div>
          </div>

          <!-- Trust & Verification Pipeline Card -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-xl bg-rose-100 text-safar-600 flex items-center justify-center">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Safety & Trust Verification Pipeline</h3>
                  <p class="text-[11px] text-slate-500">Prevents catfishing and builds a trusted travel community across India.</p>
                </div>
              </div>

              <!-- Admin Simulation Toggle for Testing -->
              <button 
                type="button" 
                onclick="simulateAdminApprovalClick()" 
                title="Testing Hook: Approve verification without waiting"
                class="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center space-x-1"
              >
                <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Simulate Admin Approval (Demo)</span>
              </button>
            </div>

            <!-- Verification Action Rows -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 1. Live Selfie Verification -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div class="flex items-start justify-between">
                  <div class="flex items-center space-x-2.5">
                    <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <i data-lucide="camera" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900">1. Live WebRTC / Photo Selfie</h4>
                      <p class="text-[11px] text-slate-500">Camera stream with iframe fallback (&lt;80 KB)</p>
                    </div>
                  </div>
                  <span id="badge-selfie-state" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Not Done
                  </span>
                </div>

                <div class="pt-1 flex items-center gap-2">
                  <button type="button" onclick="openSelfieModal()" class="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5">
                    <i data-lucide="aperture" class="w-3.5 h-3.5"></i>
                    <span>Take Live Selfie</span>
                  </button>
                  <!-- Direct File Fallback button if WebRTC is blocked -->
                  <label for="camera-fallback-input" class="cursor-pointer py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center space-x-1">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                    <span>Upload</span>
                  </label>
                  <input type="file" id="camera-fallback-input" accept="image/*" capture="user" class="hidden" onchange="handleSelfieFileSelected(event)" />
                </div>
              </div>

              <!-- 2. Government Photo ID Verification -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div class="flex items-start justify-between">
                  <div class="flex items-center space-x-2.5">
                    <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <i data-lucide="file-check" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900">2. Indian Govt Photo ID</h4>
                      <p class="text-[11px] text-slate-500">Aadhaar / Driving License / Voter ID</p>
                    </div>
                  </div>
                  <span id="badge-govid-state" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Optional
                  </span>
                </div>

                <div class="pt-1">
                  <label for="govid-file-input" class="cursor-pointer w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1.5">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                    <span>Upload Govt ID Photo (&lt;100 KB)</span>
                  </label>
                  <input type="file" id="govid-file-input" accept="image/*" class="hidden" onchange="handleGovIdFileSelected(event)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Form (Step 1 Onboarding & Traveler Profile) -->
          <form id="profile-form" onsubmit="handleSaveProfile(event)" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div class="border-b border-slate-100 pb-3">
              <h3 class="text-base font-extrabold text-slate-900">Step 1: Traveler Details</h3>
              <p class="text-xs text-slate-500">Fill in your basic backpacker info to start connecting across circuits.</p>
            </div>

            <!-- Basic Row: Full Name, Age, Gender -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input type="text" id="input-full-name" required placeholder="Enter your full name" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Age * (18–99)</label>
                <input type="number" id="input-age" min="18" max="99" required placeholder="e.g. 24" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select id="input-gender" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                </select>
              </div>
            </div>

            <!-- Home City & Upcoming Circuit (Leaflet + Datalist Integration) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Home City (India) *</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="input-home-city" 
                    list="indian-travel-destinations" 
                    required 
                    placeholder="Type or pick (e.g. Pune, Mumbai, Kasol, Anjuna)..." 
                    oninput="handleHomeCityInput(this.value)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white pl-9" 
                  />
                  <i data-lucide="map-pin" class="w-4 h-4 text-slate-400 absolute left-3 top-3.5"></i>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">Select from 50+ hubs or type any Indian city.</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Upcoming Travel Circuit *</label>
                <select id="input-upcoming-circuit" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white">
                  <option value="Goa">🏖️ Goa (Anjuna, Arambol, Palolem)</option>
                  <option value="Himachal">🏔️ Himachal (Kasol, Manali, Dharamshala, Bir)</option>
                  <option value="Uttarakhand">🌊 Uttarakhand (Rishikesh, Chopta, Nainital)</option>
                  <option value="Rajasthan">🏰 Rajasthan (Jaipur, Udaipur, Jaisalmer)</option>
                  <option value="Ladakh">❄️ Ladakh (Leh, Nubra, Pangong Tso)</option>
                  <option value="Kerala">🌴 Kerala (Varkala, Munnar, Kochi)</option>
                  <option value="Gokarna">🪨 Gokarna & Coastal Karnataka</option>
                  <option value="North East">🌿 North East (Meghalaya, Ziro, Sikkim)</option>
                </select>
              </div>
            </div>

            <!-- Leaflet Interactive Mini-Map for Home City / Location Pin -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">Map Pin Preview (Leaflet & OSM)</span>
                <span id="home-city-coords-text" class="text-slate-400 font-mono text-[11px]">Lat: 18.5204, Lng: 73.8567</span>
              </div>
              <div id="home-city-mini-map" class="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 z-0"></div>
              <p class="text-[10px] text-slate-400">Click anywhere on the mini-map to adjust your pin coordinates precisely.</p>
            </div>

            <!-- Travel Intent -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">Primary Travel Intent</label>
              <div id="profile-intent-pills" class="flex flex-wrap gap-2">
                <button type="button" onclick="selectTravelIntent(this)" class="intent-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-safar-700 border border-rose-200" data-intent="Companion">🎒 Travel Companion</button>
                <button type="button" onclick="selectTravelIntent(this)" class="intent-pill px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-intent="Dating">❤️ Dating / Romance</button>
                <button type="button" onclick="selectTravelIntent(this)" class="intent-pill px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-intent="Group Backpacker">🏕️ Group Backpacker</button>
                <button type="button" onclick="selectTravelIntent(this)" class="intent-pill px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-intent="Cab Splitter">🚕 Cab / Scooter Split</button>
              </div>
              <input type="hidden" id="input-travel-intent" value="Companion" />
            </div>

            <!-- Travel Styles (Multi-select) -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">Travel Styles (Pick all that apply)</label>
              <div id="travel-styles-grid" class="flex flex-wrap gap-2">
                <button type="button" onclick="toggleStyleTag(this)" class="style-pill px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-safar-700 border border-rose-200" data-style="Backpacker">Backpacker</button>
                <button type="button" onclick="toggleStyleTag(this)" class="style-pill px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-safar-700 border border-rose-200" data-style="Digital Nomad">Digital Nomad</button>
                <button type="button" onclick="toggleStyleTag(this)" class="style-pill px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-style="Trekker">Trekker</button>
                <button type="button" onclick="toggleStyleTag(this)" class="style-pill px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-style="Hostel Crawl">Hostel Crawl</button>
                <button type="button" onclick="toggleStyleTag(this)" class="style-pill px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-style="Scooter Rider">Scooter Rider</button>
                <button type="button" onclick="toggleStyleTag(this)" class="style-pill px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200" data-style="Foodie">Foodie</button>
              </div>
            </div>

            <!-- Bio -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Travel Bio & Companion Preference *</label>
              <textarea id="input-bio" rows="3" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white" placeholder="Tell travelers what circuits you are visiting (e.g. looking to split scooters in Arambol or trek to Tosh)..."></textarea>
            </div>

            <!-- Save Action Button -->
            <div class="pt-2 flex justify-end">
              <button type="submit" class="bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-rose-200 transition transform active:scale-95 flex items-center space-x-2">
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>Save Traveler Profile</span>
              </button>
            </div>
          </form>

        </div>

        <div class="h-16 md:h-6"></div>
      </section>
"""
