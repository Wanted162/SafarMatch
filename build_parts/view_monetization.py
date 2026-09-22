VIEW_MONETIZATION = """
      <!-- ==================== VIEW 4: EXPLORER PASS & MONETIZATION ==================== -->
      <section id="view-monetization" class="view-panel hidden w-full h-full flex flex-col bg-slate-50 overflow-y-auto">
        <div class="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6">

          <!-- Header -->
          <div class="text-center space-y-2 max-w-xl mx-auto">
            <span class="text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-safar-600 to-amber-600 text-white px-3 py-1 rounded-full shadow-xs">
              SafarMatch Premium Access
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">The Explorer Pass</h2>
            <p class="text-xs sm:text-sm text-slate-600">
              Fuel your Indian travel adventures with unrestricted companion matching, real-time messaging, and priority trip visibility.
            </p>
          </div>

          <!-- Step 1 Onboarding Requirement Warning (Shown if profile is incomplete) -->
          <div id="monetization-step1-warning" class="hidden p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              </div>
              <div>
                <h4 class="text-xs sm:text-sm font-bold">Step 1 Required: Complete Profile First</h4>
                <p class="text-xs text-amber-800 mt-0.5">
                  Complete your quick 2-minute travel profile first to activate your Explorer Pass benefits seamlessly.
                </p>
              </div>
            </div>
            <button onclick="switchView('profile')" class="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex-shrink-0 self-start sm:self-center">
              Complete Profile Now
            </button>
          </div>

          <!-- Pricing Tier Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- 1. The Explorer Pass (Main Monthly Membership) -->
            <div class="relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-300 shadow-xl shadow-rose-100/50 flex flex-col justify-between">
              <!-- Popular Badge -->
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-safar-600 to-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Most Popular for Backpackers
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-extrabold text-slate-900">Explorer Pass</h3>
                    <p class="text-xs text-slate-500">All-access companion pass</p>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">₹299</span>
                    <span class="text-xs text-slate-400 font-medium">/month</span>
                  </div>
                </div>

                <div class="h-px bg-slate-100 w-full"></div>

                <ul class="space-y-3 text-xs text-slate-700">
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Full Real-Time Chat:</strong> Unlimited 1-on-1 messaging with verified travelers in all circuits.</span>
                  </li>
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Trip Board Interaction:</strong> Post your own roadtrips, treks, and hostel splits, and send join requests.</span>
                  </li>
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Anti-Spam Shield:</strong> Priority verified badge and protected connection requests.</span>
                  </li>
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Instant Unlock:</strong> No secondary completion blockers once purchased.</span>
                  </li>
                </ul>
              </div>

              <div class="pt-6 space-y-2.5">
                <button 
                  id="monetization-pass-cta-btn" 
                  onclick="initiateExplorerPassCheckout(299)" 
                  class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-safar-600 to-rose-600 hover:from-safar-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-200 transition transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <i data-lucide="credit-card" class="w-4 h-4"></i>
                  <span>Buy Explorer Pass • ₹299 (UPI / Card)</span>
                </button>
                <p class="text-[10px] text-center text-slate-400">Secured via Razorpay Sandbox & RuPay UPI</p>
              </div>
            </div>

            <!-- 2. Trip Boost (Per-Trip Add-On) -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-extrabold text-slate-900">Trip & Pin Boost</h3>
                    <p class="text-xs text-slate-500">7-Day Circuit Spotlight</p>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">₹99</span>
                    <span class="text-xs text-slate-400 font-medium">/trip</span>
                  </div>
                </div>

                <div class="h-px bg-slate-100 w-full"></div>

                <ul class="space-y-3 text-xs text-slate-700">
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Golden Glowing Map Pin:</strong> 3x larger pulsating beacon on the Leaflet Explore Map.</span>
                  </li>
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Top of Feed:</strong> Pinned to the top of the Live Trip Board for that specific circuit.</span>
                  </li>
                  <li class="flex items-start space-x-2.5">
                    <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Ideal For:</strong> Urgent cab splits, last-minute weekend getaways, or group treks.</span>
                  </li>
                </ul>
              </div>

              <div class="pt-6">
                <button 
                  onclick="initiateTripBoostCheckout(99)" 
                  class="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
                >
                  <i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i>
                  <span>Boost My Circuit • ₹99</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Developer / Preview Instant Activation Toolbar -->
          <div class="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center space-x-2 text-slate-600">
              <i data-lucide="terminal" class="w-4 h-4 text-slate-500"></i>
              <span><strong>Sandbox Testing:</strong> Test the pass flow without real money:</span>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="handleInstantPassActivation()" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1">
                <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                <span>⚡ 1-Click Instant Pass Activation</span>
              </button>
              <button onclick="handleRevokePass()" class="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition">
                Reset
              </button>
            </div>
          </div>

        </div>

        <div class="h-16 md:h-6"></div>
      </section>
"""
