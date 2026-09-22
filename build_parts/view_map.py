VIEW_MAP = """
      <!-- ==================== VIEW 1: EXPLORE MAP ==================== -->
      <section id="view-map" class="view-panel relative w-full h-full flex flex-col overflow-hidden">
        <!-- Floating Circuit Selector Bar -->
        <div class="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-[400] max-w-2xl bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col gap-2">
          <!-- Top Row: Indian Circuit Pills -->
          <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span class="text-slate-400 font-semibold px-2 flex-shrink-0 flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-safar-600"></i> Circuit:
            </span>
            <button onclick="filterMapCircuit('all')" class="circuit-pill px-3 py-1 rounded-full font-bold bg-safar-600 text-white flex-shrink-0 shadow-xs" data-circuit="all">All India</button>
            <button onclick="filterMapCircuit('Goa')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Goa">🏖️ Goa</button>
            <button onclick="filterMapCircuit('Himachal')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Himachal">🏔️ Himachal</button>
            <button onclick="filterMapCircuit('Uttarakhand')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Uttarakhand">🌊 Rishikesh</button>
            <button onclick="filterMapCircuit('Rajasthan')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Rajasthan">🏰 Rajasthan</button>
            <button onclick="filterMapCircuit('Ladakh')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Ladakh">❄️ Ladakh</button>
            <button onclick="filterMapCircuit('Kerala')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Kerala">🌴 Kerala</button>
            <button onclick="filterMapCircuit('Gokarna')" class="circuit-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex-shrink-0" data-circuit="Gokarna">🪨 Gokarna</button>
          </div>

          <!-- Bottom Row: Filters (Gender & Intent) -->
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              <!-- Gender Filter -->
              <select id="map-filter-gender" onchange="applyMapFilters()" class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-safar-500">
                <option value="all">All Genders</option>
                <option value="Female">Women Travelers Only</option>
                <option value="Male">Men Travelers Only</option>
              </select>

              <!-- Travel Intent Filter -->
              <select id="map-filter-intent" onchange="applyMapFilters()" class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-safar-500">
                <option value="all">All Travel Intents</option>
                <option value="Companion">🎒 Travel Companion</option>
                <option value="Dating">❤️ Travel Dating / Romance</option>
                <option value="Group Backpacker">🏕️ Group Backpacker</option>
                <option value="Cab Splitter">🚕 Cab / Scooter Split</option>
              </select>
            </div>

            <!-- Traveler Counter -->
            <div id="map-traveler-count-pill" class="flex-shrink-0 px-2.5 py-1 rounded-full bg-rose-50 text-safar-700 font-extrabold text-[11px] border border-rose-200">
              18 Explorers
            </div>
          </div>
        </div>

        <!-- The Leaflet Map Canvas (Full Viewport) -->
        <div id="map" class="w-full h-full z-0 bg-slate-100"></div>

        <!-- Floating Map Action Controls (Bottom Right) -->
        <div class="absolute bottom-20 md:bottom-6 right-4 z-[400] flex flex-col gap-2">
          <!-- Reset Center to India -->
          <button onclick="resetMapCenter()" title="Center India Map" class="w-10 h-10 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-safar-600 transition">
            <i data-lucide="crosshair" class="w-5 h-5"></i>
          </button>
          <!-- Locate My Circuit / Geolocation with circuit fallback -->
          <button onclick="locateUserPosition()" title="Locate Me / Selected Circuit" class="w-10 h-10 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-safar-600 transition">
            <i data-lucide="navigation" class="w-5 h-5"></i>
          </button>
        </div>
      </section>
"""
