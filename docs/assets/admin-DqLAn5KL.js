import"./modulepreload-polyfill-P2Xu9kJm.js";import{initializeApp as e}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";import{collection as t,doc as n,getDocs as r,getFirestore as i,onSnapshot as a,serverTimestamp as o,updateDoc as s}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";var c={apiKey:`AIzaSyDXvfZbtmjFSBZeMKJ9dTOX928cYBVcBDU`,authDomain:`safarmatch-live.firebaseapp.com`,projectId:`safarmatch-live`,storageBucket:`safarmatch-live.firebasestorage.app`,messagingSenderId:`562476673285`,appId:`1:562476673285:web:b3a72f197add3c30722f6c`,measurementId:`G-FGS2XCP866`},l=null,u=null,d=!1,f=[],p=[],m=[],h=null,g=null,_=`Document photo is blurry, unreadable, or cut off.`,v=`12-digit UTR was not found in SBI bank account credits.`;window.verifyPasscode=function(){let e=document.getElementById(`admin-passcode-input`),t=document.getElementById(`passcode-error`),n=document.getElementById(`passcode-card`);e&&(e.value.trim()===`safar2026`?(t&&t.classList.add(`hidden`),sessionStorage.setItem(`safarmatch_admin_session`,`authenticated`),y(),D(`Access Granted: SafarMatch Owner Portal Unlocked`,`success`)):(t&&t.classList.remove(`hidden`),n&&(n.classList.remove(`shake-animation`),n.offsetWidth,n.classList.add(`shake-animation`)),e.value=``,e.focus(),D(`Invalid passcode. Access denied.`,`error`)))},window.togglePasscodeVisibility=function(){let e=document.getElementById(`admin-passcode-input`),t=document.getElementById(`eye-icon`);e&&(e.type===`password`?(e.type=`text`,t&&t.setAttribute(`data-lucide`,`eye-off`)):(e.type=`password`,t&&t.setAttribute(`data-lucide`,`eye`)),window.lucide&&window.lucide.createIcons())},window.lockPortal=function(){sessionStorage.removeItem(`safarmatch_admin_session`),document.getElementById(`admin-hub`).classList.add(`hidden`),document.getElementById(`passcode-gate`).classList.remove(`hidden`);let e=document.getElementById(`admin-passcode-input`);e&&(e.value=``,e.focus()),D(`Owner Portal Locked.`,`info`)};function y(){document.getElementById(`passcode-gate`).classList.add(`hidden`),document.getElementById(`admin-hub`).classList.remove(`hidden`),b()}window.switchTab=function(e){[`verification`,`payments`,`feedback`].forEach(t=>{let n=document.getElementById(`tab-btn-${t}`),r=document.getElementById(`tab-content-${t}`);t===e?(n&&(n.className=`tab-btn active px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-rose-600 text-white shadow-sm`),r&&r.classList.remove(`hidden`)):(n&&(n.className=`tab-btn px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800`),r&&r.classList.add(`hidden`))}),window.lucide&&window.lucide.createIcons()};function b(){try{l=e(c),u=i(l),d=!0,x()}catch(e){console.warn(`Firebase live init fallback:`,e),d=!1}}function x(){if(d&&u){try{let e=t(u,`profiles`);a(e,e=>{let t=[],n=[];e.forEach(e=>{let r=e.data(),i={uid:e.id,...r};(i.verificationStatus===`pending_review`||!i.verificationStatus&&(i.selfieData||i.govtIdData))&&t.push(i),i.subscription&&i.subscription.status===`pending_review`&&n.push(i)}),f=t,p=n,C(),w(),S()},e=>{console.warn(`Firestore profiles snapshot error:`,e)})}catch(e){console.warn(`Error attaching profiles listener:`,e)}try{let e=t(u,`feedback`);a(e,e=>{let t=[];e.forEach(e=>{t.push({id:e.id,...e.data()})}),t.sort((e,t)=>new Date(t.submittedAt||0)-new Date(e.submittedAt||0)),m=t,T(),S()},e=>{console.warn(`Firestore feedback snapshot error:`,e)})}catch(e){console.warn(`Error attaching feedback listener:`,e)}}}window.refreshAllQueues=async function(){let e=document.getElementById(`refresh-icon`);if(e&&e.classList.add(`animate-spin`),d&&u)try{let e=await r(t(u,`profiles`)),n=[],i=[];e.forEach(e=>{let t=e.data(),r={uid:e.id,...t};(r.verificationStatus===`pending_review`||!r.verificationStatus&&(r.selfieData||r.govtIdData))&&n.push(r),r.subscription&&r.subscription.status===`pending_review`&&i.push(r)}),f=n,p=i;let a=await r(t(u,`feedback`)),o=[];a.forEach(e=>{o.push({id:e.id,...e.data()})}),o.sort((e,t)=>new Date(t.submittedAt||0)-new Date(e.submittedAt||0)),m=o,C(),w(),T(),S(),D(`Queues refreshed from database`,`info`)}catch(e){console.warn(`Refresh error:`,e)}setTimeout(()=>{e&&e.classList.remove(`animate-spin`)},500)};function S(){let e=document.getElementById(`badge-count-verification`),t=document.getElementById(`verification-summary-count`);e&&(e.textContent=f.length),t&&(t.textContent=f.length);let n=document.getElementById(`badge-count-payments`),r=document.getElementById(`payments-summary-count`);n&&(n.textContent=p.length),r&&(r.textContent=p.length);let i=document.getElementById(`badge-count-feedback`),a=document.getElementById(`feedback-summary-count`);i&&(i.textContent=m.length),a&&(a.textContent=m.length)}function C(){let e=document.getElementById(`verification-cards-container`);if(e){if(f.length===0){e.innerHTML=`
          <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mx-auto">
              <i data-lucide="check-check" class="w-7 h-7"></i>
            </div>
            <h3 class="text-base font-bold text-white">Identity Verification Queue is Clear</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              All submitted WebRTC selfies and government identity cards have been reviewed. New applicant submissions will appear automatically.
            </p>
          </div>
        `,window.lucide&&window.lucide.createIcons();return}e.innerHTML=f.map(e=>{let t=e.selfieData||`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,n=e.govtIdData||``,r=e.verificationSubmittedAt?new Date(e.verificationSubmittedAt).toLocaleString(`en-IN`):`Just now`;return`
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <!-- Applicant Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800/60 text-rose-300 font-extrabold flex items-center justify-center text-base">
                  ${(e.name||`T`)[0]}
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="text-base font-extrabold text-white">${E(e.name||`Anonymous Traveler`)}</h3>
                    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      ${e.age||`24`} yrs • ${e.gender||`Explorer`}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">
                    From: <strong class="text-slate-300">${E(e.homeCity||`India`)}</strong> | 
                    Active Circuit: <span class="text-rose-400 font-semibold">${E(e.upcomingCircuit||`Goa`)}</span> |
                    Submitted: <span class="text-slate-400 font-mono-code">${r}</span>
                  </p>
                </div>
              </div>

              <!-- UID Reference -->
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-slate-500 block">Traveler UID</span>
                <span class="font-mono-code text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  ${E(e.uid)}
                </span>
              </div>
            </div>

            <!-- Side-by-Side Comparison Container -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- 1. Live Selfie Card -->
              <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <i data-lucide="camera" class="w-4 h-4 text-emerald-400"></i>
                    <h4 class="text-xs font-bold text-slate-200">1. Live WebRTC Selfie</h4>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Live Video Frame
                  </span>
                </div>
                <div class="h-64 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative group cursor-pointer" onclick="openSelfieLightboxByUid('${e.uid}')">
                  <img src="${t}" alt="Selfie" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span class="text-xs font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                      <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Click to Zoom
                    </span>
                  </div>
                </div>
              </div>

              <!-- 2. Government Photo ID Card -->
              <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <i data-lucide="file-badge" class="w-4 h-4 text-blue-400"></i>
                    <h4 class="text-xs font-bold text-slate-200">2. Indian Govt Photo ID</h4>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    Compulsory Document
                  </span>
                </div>
                <div class="h-64 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative group cursor-pointer" onclick="openGovtIdLightboxByUid('${e.uid}')">
                  ${n?`
                    <img src="${n}" alt="Govt ID" class="w-full h-full object-contain group-hover:scale-105 transition duration-300" />
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span class="text-xs font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                        <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Click to Inspect Details
                      </span>
                    </div>
                  `:`
                    <div class="text-center p-6 space-y-2">
                      <svg class="w-8 h-8 text-amber-500 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <p class="text-xs text-amber-300 font-semibold">Govt ID photo is missing or corrupted</p>
                    </div>
                  `}
                </div>
              </div>

            </div>

            <!-- Action Approval Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button 
                type="button" 
                onclick="openRejectVerificationModalByUid('${e.uid}')" 
                class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-bold border border-slate-700 hover:border-rose-800 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span>Reject &amp; Request Re-upload</span>
              </button>

              <button 
                type="button" 
                onclick="adminApproveIdentityByUid('${e.uid}')" 
                class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-950/40 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Approve Identity &amp; Grant Shield ✓</span>
              </button>
            </div>

          </div>
        `}).join(``),window.lucide&&window.lucide.createIcons()}}window.openRejectVerificationModal=function(e,t){h={uid:e,name:t},document.getElementById(`reject-v-traveler-name`).textContent=t||`Traveler`,document.getElementById(`reject-v-traveler-uid`).textContent=e,document.getElementById(`reject-v-custom-instructions`).value=``,_=`Document photo is blurry, unreadable, or cut off.`,document.querySelectorAll(`.v-reason-btn`).forEach((e,t)=>{let n=e.querySelector(`span > span`);t===0?(e.className=`v-reason-btn w-full text-left p-2.5 rounded-xl border border-rose-500 bg-rose-950/40 text-xs text-slate-200 transition flex items-start space-x-2`,n&&(n.className=`w-2 h-2 rounded-full bg-rose-500`)):(e.className=`v-reason-btn w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-rose-700/60 text-xs text-slate-300 hover:text-white transition flex items-start space-x-2`,n&&(n.className=`w-2 h-2 rounded-full bg-transparent`))}),document.getElementById(`reject-verification-modal`).classList.remove(`hidden`),window.lucide&&window.lucide.createIcons()},window.closeRejectVerificationModal=function(){document.getElementById(`reject-verification-modal`).classList.add(`hidden`),h=null},window.selectVReasonPreset=function(e,t){_=t,document.querySelectorAll(`.v-reason-btn`).forEach(e=>{e.className=`v-reason-btn w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-rose-700/60 text-xs text-slate-300 hover:text-white transition flex items-start space-x-2`;let t=e.querySelector(`span > span`);t&&(t.className=`w-2 h-2 rounded-full bg-transparent`)}),e.className=`v-reason-btn w-full text-left p-2.5 rounded-xl border border-rose-500 bg-rose-950/40 text-xs text-slate-200 transition flex items-start space-x-2`;let n=e.querySelector(`span > span`);n&&(n.className=`w-2 h-2 rounded-full bg-rose-500`)},window.submitRejectVerification=async function(){if(!h)return;let e=document.getElementById(`reject-v-custom-instructions`).value.trim(),t=e?`${_} Note: ${e}`:_,r=h.uid,i=h.name;if(d&&u)try{await s(n(u,`profiles`,r),{verificationStatus:`rejected`,verificationRejectionReason:t,selfieSubmitted:!1,selfieData:null,govtIdData:null,reviewedAt:o()}),D(`Rejected ${i}. Rejection reason dispatched to traveler.`,`info`)}catch(e){console.error(`Error rejecting verification in Firestore:`,e),D(`Firestore update error: `+e.message,`error`)}else f=f.filter(e=>e.uid!==r),C(),S(),D(`Rejected ${i} locally.`,`info`);closeRejectVerificationModal()},window.adminApproveIdentity=async function(e,t){if(confirm(`Are you sure you want to approve identity verification for ${t}?`)){if(d&&u)try{await s(n(u,`profiles`,e),{verificationStatus:`verified`,selfieSubmitted:!0,reviewedAt:o(),verificationRejectionReason:null}),D(`Approved ${t}! Verified Explorer shield issued.`,`success`)}catch(e){console.error(`Error approving identity:`,e),D(`Failed to approve in Firestore: `+e.message,`error`)}else f=f.filter(t=>t.uid!==e),C(),S(),D(`Approved ${t} locally.`,`success`)}};function w(){let e=document.getElementById(`payments-cards-container`);if(e){if(p.length===0){e.innerHTML=`
          <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mx-auto">
              <i data-lucide="receipt" class="w-7 h-7"></i>
            </div>
            <h3 class="text-base font-bold text-white">No Pending UPI Payments</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no 12-digit UTR submissions awaiting confirmation. When a traveler pays via UPI, their submission will queue here.
            </p>
          </div>
        `,window.lucide&&window.lucide.createIcons();return}e.innerHTML=p.map(e=>{let t=e.subscription||{},n=t.utr||`N/A`,r=t.plan===`trip_boost`?`Trip Boost (₹99)`:`Explorer Monthly Pass (₹299)`,i=t.activatedAt?new Date(t.activatedAt).toLocaleString(`en-IN`):`Just now`;return`
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <!-- User & Payment Details -->
            <div class="space-y-3 flex-1">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800/60 text-emerald-300 font-extrabold flex items-center justify-center text-sm">
                  <i data-lucide="credit-card" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-white flex items-center gap-2">
                    <span>${E(e.name||`Anonymous Traveler`)}</span>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ${E(r)}
                    </span>
                  </h3>
                  <p class="text-xs text-slate-400">
                    Circuit: <span class="text-rose-400 font-semibold">${E(e.upcomingCircuit||e.homeCity||`India`)}</span> • 
                    Email: <span class="text-slate-300">${E(e.email||`N/A`)}</span> •
                    Time: <span class="text-slate-400 font-mono-code">${i}</span>
                  </p>
                </div>
              </div>

              <!-- 12-Digit UTR Highlight Box -->
              <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Submitted 12-Digit UPI Reference (UTR)</span>
                  <span class="text-lg font-bold font-mono-code text-emerald-400 tracking-wider">${E(n)}</span>
                </div>
                <button 
                  type="button" 
                  data-utr="${E(n)}"
                  onclick="copyTextToClipboard(this.getAttribute('data-utr'))" 
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                  <span>Copy UTR</span>
                </button>
              </div>

              <p class="text-[11px] text-slate-500">
                Verify this transaction in your State Bank of India (SBI) / UPI app for payee <strong class="text-slate-400">pisalpranit1-1@oksbi</strong> before confirming.
              </p>
            </div>

            <!-- Approval Controls -->
            <div class="flex flex-row md:flex-col items-center justify-end gap-2.5 flex-shrink-0">
              <button 
                type="button" 
                onclick="adminConfirmPaymentByUid('${e.uid}')" 
                class="flex-1 md:flex-initial w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Confirm Payment ✓</span>
              </button>

              <button 
                type="button" 
                onclick="openRejectPaymentModalByUid('${e.uid}')" 
                class="flex-1 md:flex-initial w-full px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-bold border border-slate-700 hover:border-rose-800 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>Reject Payment</span>
              </button>
            </div>

          </div>
        `}).join(``),window.lucide&&window.lucide.createIcons()}}window.openRejectPaymentModal=function(e,t,n){g={uid:e,name:t,utr:n},document.getElementById(`reject-p-traveler-name`).textContent=t||`Traveler`,document.getElementById(`reject-p-traveler-utr`).textContent=n||`N/A`,document.getElementById(`reject-p-custom-instructions`).value=``,v=`12-digit UTR was not found in SBI bank account credits.`,document.querySelectorAll(`.p-reason-btn`).forEach((e,t)=>{let n=e.querySelector(`span > span`);t===0?(e.className=`p-reason-btn w-full text-left p-2.5 rounded-xl border border-amber-500 bg-amber-950/40 text-xs text-slate-200 transition flex items-start space-x-2`,n&&(n.className=`w-2 h-2 rounded-full bg-amber-500`)):(e.className=`p-reason-btn w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-amber-700/60 text-xs text-slate-300 hover:text-white transition flex items-start space-x-2`,n&&(n.className=`w-2 h-2 rounded-full bg-transparent`))}),document.getElementById(`reject-payment-modal`).classList.remove(`hidden`),window.lucide&&window.lucide.createIcons()},window.closeRejectPaymentModal=function(){document.getElementById(`reject-payment-modal`).classList.add(`hidden`),g=null},window.selectPReasonPreset=function(e,t){v=t,document.querySelectorAll(`.p-reason-btn`).forEach(e=>{e.className=`p-reason-btn w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-amber-700/60 text-xs text-slate-300 hover:text-white transition flex items-start space-x-2`;let t=e.querySelector(`span > span`);t&&(t.className=`w-2 h-2 rounded-full bg-transparent`)}),e.className=`p-reason-btn w-full text-left p-2.5 rounded-xl border border-amber-500 bg-amber-950/40 text-xs text-slate-200 transition flex items-start space-x-2`;let n=e.querySelector(`span > span`);n&&(n.className=`w-2 h-2 rounded-full bg-amber-500`)},window.submitRejectPayment=async function(){if(!g)return;let e=document.getElementById(`reject-p-custom-instructions`).value.trim(),t=e?`${v} Note: ${e}`:v,r=g.uid,i=g.name;if(d&&u)try{await s(n(u,`profiles`,r),{isVip:!1,hasExplorerPass:!1,"subscription.status":`rejected`,"subscription.rejectionReason":t,"subscription.reviewedAt":o()}),D(`Payment rejected for ${i}. Reason logged for traveler.`,`info`)}catch(e){console.error(`Error rejecting payment in Firestore:`,e),D(`Firestore error: `+e.message,`error`)}else p=p.filter(e=>e.uid!==r),w(),S(),D(`Payment rejected for ${i} locally.`,`info`);closeRejectPaymentModal()},window.adminConfirmPayment=async function(e,t,r,i){if(confirm(`Confirm receipt of UPI payment for ${t} (UTR: ${r})? This will immediately activate the Explorer Pass.`)){if(d&&u)try{let a=new Date(Date.now()+2592e6).toISOString();await s(n(u,`profiles`,e),{isVip:!0,hasExplorerPass:!0,"subscription.status":`active`,"subscription.utr":r,"subscription.plan":i||`explorer_monthly`,"subscription.approvedAt":o(),"subscription.validUntil":a,"subscription.rejectionReason":null}),D(`Payment confirmed! Explorer Pass activated for ${t}.`,`success`)}catch(e){console.error(`Error confirming payment:`,e),D(`Failed to confirm in Firestore: `+e.message,`error`)}else p=p.filter(t=>t.uid!==e),w(),S(),D(`Payment confirmed for ${t} locally.`,`success`)}};function T(){let e=document.getElementById(`feedback-cards-container`);if(e){if(m.length===0){e.innerHTML=`
          <div class="col-span-full bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center mx-auto">
              <i data-lucide="message-square-dashed" class="w-7 h-7"></i>
            </div>
            <h3 class="text-base font-bold text-white">No Feedback Submissions Yet</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              When travelers share feature suggestions, circuit proposals, or bug reports via the Feedback modal, they will display here.
            </p>
          </div>
        `,window.lucide&&window.lucide.createIcons();return}e.innerHTML=m.map(e=>{let t=Number(e.rating)||5,n=`★`.repeat(t)+`☆`.repeat(Math.max(0,5-t));return`
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  ${E(e.category||`General`)}
                </span>
                <span class="text-amber-400 text-sm font-bold tracking-widest">${n}</span>
              </div>

              <p class="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                "${E(e.message||`No message provided`)}"
              </p>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div>
                <strong class="text-white block">${E(e.userName||e.name||`Anonymous Traveler`)}</strong>
                <span class="text-[11px] text-slate-400">${E(e.email||`No email`)}</span>
              </div>

              ${e.email?`
                <a 
                  href="mailto:${encodeURIComponent(e.email)}?subject=Re:%20SafarMatch%20Feedback%20[${encodeURIComponent(e.category||`Feedback`)}]" 
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center space-x-1.5"
                >
                  <i data-lucide="mail" class="w-3.5 h-3.5 text-blue-400"></i>
                  <span>Reply</span>
                </a>
              `:``}
            </div>
          </div>
        `}).join(``),window.lucide&&window.lucide.createIcons()}}window.openLightbox=function(e,t){let n=document.getElementById(`lightbox-modal`),r=document.getElementById(`lightbox-img`),i=document.getElementById(`lightbox-title`);n&&r&&(r.src=e,i&&(i.textContent=t||`Full Document Preview`),n.classList.remove(`hidden`))},window.closeLightbox=function(){let e=document.getElementById(`lightbox-modal`);e&&e.classList.add(`hidden`)},window.openSelfieLightboxByUid=function(e){let t=f.find(t=>t.uid===e);if(!t)return;let n=t.selfieData||`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`;openLightbox(n,`Live Selfie - `+(t.name||`Applicant`))},window.openGovtIdLightboxByUid=function(e){let t=f.find(t=>t.uid===e);t&&t.govtIdData&&openLightbox(t.govtIdData,`Govt Photo ID - `+(t.name||`Applicant`))},window.adminApproveIdentityByUid=function(e){let t=f.find(t=>t.uid===e);t&&adminApproveIdentity(t.uid,t.name||`Traveler`)},window.openRejectVerificationModalByUid=function(e){let t=f.find(t=>t.uid===e);t&&openRejectVerificationModal(t.uid,t.name||`Traveler`)},window.adminConfirmPaymentByUid=function(e){let t=p.find(t=>t.uid===e);if(!t)return;let n=t.subscription||{},r=n.utrNumber||n.upiReference||`000000000000`;adminConfirmPayment(t.uid,t.name||`Traveler`,r,n.plan||`explorer_monthly`)},window.openRejectPaymentModalByUid=function(e){let t=p.find(t=>t.uid===e);if(!t)return;let n=t.subscription||{},r=n.utrNumber||n.upiReference||`000000000000`;openRejectPaymentModal(t.uid,t.name||`Traveler`,r)},window.copyTextToClipboard=function(e){navigator.clipboard&&navigator.clipboard.writeText&&navigator.clipboard.writeText(e).then(()=>{D(`Copied to clipboard: `+e,`info`)})};function E(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}function D(e,t=`info`){let n=document.getElementById(`toast-container`);if(!n)return;let r=document.createElement(`div`),i={success:`bg-emerald-600 border-emerald-500`,error:`bg-rose-600 border-rose-500`,info:`bg-slate-800 border-slate-700`};r.className=`${i[t]||i.info} text-white px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center space-x-2 pointer-events-auto transform transition duration-300 ease-out translate-y-2 opacity-0`,r.innerHTML=`<span>${e}</span>`,n.appendChild(r),requestAnimationFrame(()=>{r.classList.remove(`translate-y-2`,`opacity-0`)}),setTimeout(()=>{r.classList.add(`opacity-0`,`translate-y-2`),setTimeout(()=>r.remove(),300)},3500)}document.addEventListener(`DOMContentLoaded`,()=>{if(sessionStorage.getItem(`safarmatch_admin_session`)===`authenticated`)y();else{let e=document.getElementById(`admin-passcode-input`);e&&e.focus()}window.lucide&&window.lucide.createIcons()});