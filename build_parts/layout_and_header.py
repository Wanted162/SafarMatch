LAYOUT_AND_HEADER = """
  <!-- ==================== TOP NAVIGATION HEADER ==================== -->
  <header class="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 shadow-xs">
    <!-- Brand -->
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-safar-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
        <i data-lucide="compass" class="w-6 h-6"></i>
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-safar-600 to-rose-700 bg-clip-text text-transparent">SafarMatch</span>
          <span class="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-safar-800 px-2 py-0.5 rounded-full">Bharat Edition</span>
        </div>
        <p class="text-[11px] text-slate-500 hidden sm:block">India's Verified Travel Dating & Companion Platform</p>
      </div>
    </div>

    <!-- Center: 2-Step Journey Status Pill -->
    <div class="hidden lg:flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-medium">
      <!-- Step 1 Indicator -->
      <div id="header-step1-status" class="flex items-center space-x-1.5 text-slate-700">
        <span id="step1-badge-icon" class="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">1</span>
        <span class="text-[11px]">Traveler Profile:</span>
        <span id="step1-badge-label" class="font-bold text-amber-600">Pending</span>
      </div>
      <span class="text-slate-300">|</span>
      <!-- Step 2 Indicator -->
      <div id="header-step2-status" class="flex items-center space-x-1.5 text-slate-700">
        <span id="step2-badge-icon" class="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">2</span>
        <span class="text-[11px]">Explorer Pass:</span>
        <span id="step2-badge-label" class="font-bold text-slate-500">Locked (₹299)</span>
      </div>
    </div>

    <!-- Right Header Actions (Auth, Verification Badge & Profile Completion) -->
    <div class="flex items-center space-x-3">
      <!-- Live Verification Status Badge -->
      <div id="header-verification-badge" class="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
        <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-slate-500"></i>
        <span id="header-verification-text">Unverified</span>
      </div>

      <!-- Profile Completion Gauge -->
      <div onclick="switchView('profile')" class="cursor-pointer flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-xl transition">
        <div class="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-white shadow-xs">
          <img id="header-user-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E" alt="Avatar" class="w-full h-full object-cover" />
        </div>
        <div class="text-left hidden md:block">
          <div class="flex items-center space-x-1">
            <span id="header-user-name" class="text-xs font-bold text-slate-800 truncate max-w-[100px]">Guest</span>
            <span id="header-vip-star" class="hidden text-amber-500 text-xs">⭐</span>
          </div>
          <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
            <div id="header-profile-progress" class="h-full bg-safar-600 rounded-full transition-all duration-300" style="width: 40%"></div>
          </div>
        </div>
      </div>

      <!-- Google / Auth Button -->
      <button id="btn-auth" onclick="handleAuthAction()" class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs">
        <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
        <span id="btn-auth-text">Sign In</span>
      </button>
    </div>
  </header>

  <!-- ==================== MAIN BODY LAYOUT ==================== -->
  <div class="flex flex-1 overflow-hidden relative">

    <!-- DESKTOP SIDEBAR -->
    <aside id="sidebar-nav" class="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white z-20 flex-shrink-0 p-4 justify-between">
      <div class="space-y-6">
        <!-- Navigation Menu -->
        <nav class="space-y-1.5">
          <!-- 1. Explore Map -->
          <button onclick="switchView('map')" id="nav-btn-map" class="nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition bg-safar-50 text-safar-700">
            <i data-lucide="map" class="w-4 h-4"></i>
            <span>Explore Map</span>
            <span class="ml-auto text-[10px] bg-rose-100 text-safar-700 font-bold px-2 py-0.5 rounded-full">Live</span>
          </button>

          <!-- 2. Trip Board (Read-only for Onboarded, Posting/Joining gated) -->
          <button onclick="switchView('trips')" id="nav-btn-trips" class="nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>Trip Board</span>
            <span id="trips-count-badge" class="ml-auto text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">Feed</span>
          </button>

          <!-- 3. Real-Time Chat (Explorer Pass Gated) -->
          <button onclick="switchView('chat')" id="nav-btn-chat" class="nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>Real-time Chat</span>
            <span id="sidebar-chat-badge" class="ml-auto text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i data-lucide="lock" class="w-2.5 h-2.5"></i> Pass
            </span>
          </button>

          <!-- 4. Explorer Pass & Monetization -->
          <button onclick="switchView('monetization')" id="nav-btn-monetization" class="nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100">
            <i data-lucide="zap" class="w-4 h-4 text-amber-500"></i>
            <span>Explorer Pass</span>
            <span class="ml-auto text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">₹299</span>
          </button>

          <!-- 5. Profile & Verification -->
          <button onclick="switchView('profile')" id="nav-btn-profile" class="nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100">
            <i data-lucide="user-check" class="w-4 h-4"></i>
            <span>Travel Profile</span>
            <span id="sidebar-profile-pct" class="ml-auto text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">50%</span>
          </button>
        </nav>

        <!-- Safety Card: Suraksha Shield -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 space-y-2">
          <div class="flex items-center space-x-2 text-rose-800">
            <i data-lucide="shield-check" class="w-4 h-4 text-rose-600"></i>
            <span class="text-xs font-bold">Suraksha Shield</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            Solo women travelers can activate Safe Mode to hide location pins & trips from non-female profiles.
          </p>
          <div class="flex items-center justify-between pt-1">
            <span class="text-[10px] text-rose-700 font-semibold">Safe Mode</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="sidebar-suraksha-toggle" onchange="toggleSurakshaMode(this.checked)" class="sr-only peer" />
              <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Cloud Sync & Network Status -->
      <div class="pt-4 border-t border-slate-100 space-y-2 text-xs">
        <div class="flex items-center justify-between text-slate-500">
          <div class="flex items-center space-x-1.5">
            <span id="cloud-status-dot" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span id="cloud-status-text" class="text-[11px]">Firebase Firestore</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">v10 Web</span>
        </div>
        <p class="text-[10px] text-slate-400">Zero-cost Leaflet & OSM tiles enabled.</p>
      </div>
    </aside>

    <!-- MAIN VIEW CONTAINER -->
    <main class="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
"""
