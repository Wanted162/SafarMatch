VIEW_TRIPS = """
      <!-- ==================== VIEW 2: LIVE INDIA TRIP BOARD ==================== -->
      <section id="view-trips" class="view-panel hidden w-full h-full flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Sticky Header with Circuit Filters & Action Button -->
        <div class="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-lg sm:text-xl font-extrabold text-slate-900">Live India Trip Board</h2>
              <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <i data-lucide="eye" class="w-3 h-3"></i> Free Read Access
              </span>
            </div>
            <p class="text-xs text-slate-500">Discover upcoming companion trips, scooter roadtrips & hostel splits across India.</p>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Post Trip CTA (Checks Explorer Pass & Profile) -->
            <button onclick="handlePostTripClick()" class="bg-gradient-to-r from-safar-600 to-rose-600 hover:from-safar-700 hover:to-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-rose-200 transition flex items-center space-x-2 flex-shrink-0">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Post a Trip Plan</span>
            </button>
          </div>
        </div>

        <!-- Trips Filter Chips & Search (Any Destination) -->
        <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span class="text-slate-400 font-semibold flex-shrink-0">Popular:</span>
            <button onclick="filterTripsFeed('all')" class="trip-filter-pill px-3 py-1 rounded-full font-bold bg-slate-900 text-white flex-shrink-0" data-filter="all">All Trips</button>
            <button onclick="filterTripsFeed('Goa')" class="trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0" data-filter="Goa">Goa</button>
            <button onclick="filterTripsFeed('Himachal')" class="trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0" data-filter="Himachal">Himachal</button>
            <button onclick="filterTripsFeed('Uttarakhand')" class="trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0" data-filter="Uttarakhand">Rishikesh</button>
            <button onclick="filterTripsFeed('Rajasthan')" class="trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0" data-filter="Rajasthan">Rajasthan</button>
            <button onclick="filterTripsFeed('Ladakh')" class="trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0" data-filter="Ladakh">Ladakh</button>
            <button onclick="filterTripsFeed('Kerala')" class="trip-filter-pill px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex-shrink-0" data-filter="Kerala">Kerala</button>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative w-full sm:w-56">
              <input 
                type="text" 
                id="trip-feed-search-input" 
                placeholder="Search any destination..." 
                oninput="searchTripsFeedByText(this.value)" 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-safar-500 focus:bg-white"
              />
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2"></i>
            </div>
            <div id="trips-feed-count" class="text-xs text-slate-500 font-semibold flex-shrink-0 hidden md:block">
              Showing active trips
            </div>
          </div>
        </div>

        <!-- Trips Feed Grid -->
        <div class="p-4 sm:p-6 max-w-6xl mx-auto w-full">
          <!-- Gating Notice Banner for Non-Pass Travelers -->
          <div id="trips-pass-banner" class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div class="flex items-start space-x-3">
              <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <i data-lucide="zap" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-xs sm:text-sm font-bold text-slate-900">Explorer Pass Interaction Gate</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  You have full read access to browse all trips. To post your own itinerary or send companion join requests, activate the <strong>Explorer Pass (₹299/mo)</strong>.
                </p>
              </div>
            </div>
            <button onclick="switchView('monetization')" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex-shrink-0 flex items-center space-x-1.5 self-start sm:self-center">
              <span>Activate Pass</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Trip Cards Container (Rendered dynamically) -->
          <div id="trips-feed-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <!-- Injected by renderTripsFeed() -->
          </div>
        </div>

        <div class="h-16 md:h-6"></div>
      </section>
"""
