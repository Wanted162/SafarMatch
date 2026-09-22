VIEW_CHAT = """
      <!-- ==================== VIEW 3: IN-APP REAL-TIME CHAT ==================== -->
      <section id="view-chat" class="view-panel hidden w-full h-full flex flex-col bg-white overflow-hidden relative">

        <!-- LOCKED PAYWALL CONTAINER (Visible when user has no Explorer Pass) -->
        <div id="chat-paywall-locked" class="hidden absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
              <i data-lucide="lock" class="w-7 h-7"></i>
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">Explorer Pass Required</span>
              <h3 class="text-xl font-extrabold text-slate-900 mt-2">Real-Time Chat is Protected</h3>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed">
                Connect 1-on-1 with verified backpackers, plan scooter splits in Goa, or coordinate high-altitude treks in Manali with private end-to-end messaging.
              </p>
            </div>

            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div class="flex items-center space-x-2 text-slate-700">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>Anti-Spam & Contact Protection Active</span>
              </div>
              <div class="flex items-center space-x-2 text-slate-700">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>Unlimited 1-on-1 chats across all Indian hubs</span>
              </div>
              <div class="flex items-center space-x-2 text-slate-700">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>Direct handshake connection requests</span>
              </div>
            </div>

            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button onclick="switchView('monetization')" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-safar-600 to-rose-600 hover:from-safar-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition">
                Buy Explorer Pass • ₹299
              </button>
              <button onclick="switchView('map')" class="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition">
                Back to Map
              </button>
            </div>
          </div>
        </div>

        <!-- UNLOCKED CHAT INTERFACE (Two Panels) -->
        <div id="chat-content-unlocked" class="w-full h-full flex flex-col md:flex-row overflow-hidden">
          <!-- Left Panel: Conversations & Handshakes -->
          <div class="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50 flex-shrink-0 h-48 md:h-full overflow-hidden">
            <!-- Header -->
            <div class="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h3 class="text-sm font-extrabold text-slate-900">Conversations</h3>
                <p class="text-[11px] text-slate-500">Verified Indian travelers</p>
              </div>
              <span id="chat-active-count" class="text-[10px] font-bold bg-rose-100 text-safar-700 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <!-- Conversations List -->
            <div id="chat-conversations-list" class="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Right Panel: Message Thread & Active Conversation -->
          <div class="flex-1 flex flex-col bg-white overflow-hidden h-full">
            <!-- Active Chat Header -->
            <div id="chat-header-bar" class="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white z-10 flex-shrink-0">
              <div class="flex items-center space-x-3">
                <div class="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                  <img id="active-chat-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E" alt="Avatar" class="w-full h-full object-cover" />
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h4 id="active-chat-name" class="text-sm font-bold text-slate-900">Select a traveler</h4>
                    <span id="active-chat-badge" class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">⚪ Unverified</span>
                  </div>
                  <p id="active-chat-meta" class="text-[11px] text-slate-500">Click a traveler on the Explore Map or in conversations to chat</p>
                </div>
              </div>

              <!-- Safety / Block / Report Button -->
              <div class="flex items-center space-x-2">
                <button onclick="openReportModalFromChat()" title="Report or Block Traveler" class="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition">
                  <i data-lucide="shield-alert" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Anti-Bypass Safety Notice -->
            <div class="bg-amber-50/70 border-b border-amber-200/60 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-800">
              <div class="flex items-center space-x-1.5">
                <i data-lucide="shield" class="w-3.5 h-3.5 text-amber-600 flex-shrink-0"></i>
                <span>Anti-Scam Filter: Phone numbers, UPI IDs, and external social handles are automatically restricted.</span>
              </div>
            </div>

            <!-- Messages Stream Container -->
            <div id="chat-messages-container" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              <div class="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 space-y-2">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <i data-lucide="message-square" class="w-6 h-6"></i>
                </div>
                <p class="text-xs font-semibold text-slate-600">Start an in-app conversation</p>
                <p class="text-[11px] max-w-xs">All messages are delivered in real-time. Share circuits, split stays, and plan travel meetups safely.</p>
              </div>
            </div>

            <!-- Message Input Form with Hardened Moderation -->
            <form id="chat-input-form" onsubmit="handleSendMessage(event)" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
              <input 
                type="text" 
                id="chat-message-input" 
                placeholder="Type a travel message (e.g. 'Hey, are you exploring Anjuna this weekend?')..." 
                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-safar-500 focus:bg-white"
                autocomplete="off"
              />
              <button 
                type="submit" 
                class="bg-safar-600 hover:bg-safar-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-rose-200 transition flex items-center space-x-1.5 flex-shrink-0"
              >
                <span>Send</span>
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
              </button>
            </form>
          </div>
        </div>
      </section>
"""
