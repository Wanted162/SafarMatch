SCRIPTS_CORE = """
  <!-- ==================== OFFICIAL FIREBASE V10 ES MODULE LOGIC ==================== -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { 
      getAuth, 
      signInWithPopup, 
      GoogleAuthProvider, 
      signOut, 
      onAuthStateChanged 
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { 
      getFirestore, 
      collection, 
      doc, 
      setDoc, 
      getDoc, 
      getDocs, 
      addDoc, 
      updateDoc,
      onSnapshot, 
      query, 
      where,
      orderBy, 
      serverTimestamp 
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    import { 
      getStorage, 
      ref, 
      uploadBytes, 
      getDownloadURL 
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

    // 1. Firebase Configuration (Pre-configured for safarmatch-live)
    const firebaseConfig = {
      apiKey: "AIzaSyDXvfZbtmjFSBZeMKJ9dTOX928cYBVcBDU",
      authDomain: "safarmatch-live.firebaseapp.com",
      projectId: "safarmatch-live",
      storageBucket: "safarmatch-live.firebasestorage.app",
      messagingSenderId: "562476673285",
      appId: "1:562476673285:web:b3a72f197add3c30722f6c",
      measurementId: "G-FGS2XCP866"
    };

    let app = null;
    let auth = null;
    let db = null;
    let storage = null;
    let isLiveFirebase = false;

    // Current User Session
    let currentUser = null;
    let currentProfile = null;

    // Chat and Map State
    let activeChatPartner = null;
    let activeChatUnsubscribe = null;
    let tripsUnsubscribe = null;
    let mapInstance = null;
    let mapMarkersLayer = null;
    let homeCityMiniMap = null;
    let homeCityMiniMarker = null;

    // Local in-memory caches
    let allTripsCache = [];
    let allTravelersCache = [];
    let blockedUsersList = [];
    let currentTripCircuitFilter = "all";
    let inspectedTraveler = null;

    // WebRTC Camera Stream reference
    let cameraMediaStream = null;
    let capturedSelfieBlob = null;

    // 60+ Indian Travel Circuits & Hubs Coordinate Dictionary
    const INDIAN_LOCATIONS = {
      "Goa": { lat: 15.2993, lng: 74.1240 },
      "Anjuna, Goa": { lat: 15.5800, lng: 73.7420 },
      "Arambol, Goa": { lat: 15.6869, lng: 73.7042 },
      "Palolem, Goa": { lat: 15.0100, lng: 74.0232 },
      "Vagator, Goa": { lat: 15.6028, lng: 73.7336 },
      "Panaji, Goa": { lat: 15.4909, lng: 73.8278 },
      "Morjim, Goa": { lat: 15.6322, lng: 73.7347 },
      "Kasol, Himachal Pradesh": { lat: 32.0100, lng: 77.3150 },
      "Manali, Himachal Pradesh": { lat: 32.2432, lng: 77.1892 },
      "Old Manali, Himachal Pradesh": { lat: 32.2570, lng: 77.1750 },
      "Tosh, Himachal Pradesh": { lat: 32.0160, lng: 77.4520 },
      "Kheerganga, Himachal Pradesh": { lat: 31.9890, lng: 77.5120 },
      "Dharamshala, Himachal Pradesh": { lat: 32.2190, lng: 76.3234 },
      "McLeodGanj, Himachal Pradesh": { lat: 32.2426, lng: 76.3213 },
      "Bir Billing, Himachal Pradesh": { lat: 32.0514, lng: 76.7179 },
      "Jibhi, Himachal Pradesh": { lat: 31.6358, lng: 77.3486 },
      "Spiti Valley, Himachal Pradesh": { lat: 32.2461, lng: 78.0349 },
      "Kaza, Himachal Pradesh": { lat: 32.2276, lng: 78.0716 },
      "Shimla, Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
      "Himachal": { lat: 32.2432, lng: 77.1892 },
      "Rishikesh, Uttarakhand": { lat: 30.0869, lng: 78.2676 },
      "Chopta, Uttarakhand": { lat: 30.4850, lng: 79.1764 },
      "Tungnath, Uttarakhand": { lat: 30.4890, lng: 79.2170 },
      "Kedarnath, Uttarakhand": { lat: 30.7346, lng: 79.0669 },
      "Mussoorie, Uttarakhand": { lat: 30.4598, lng: 78.0644 },
      "Nainital, Uttarakhand": { lat: 29.3919, lng: 79.4542 },
      "Auli, Uttarakhand": { lat: 30.5284, lng: 79.5658 },
      "Dehradun, Uttarakhand": { lat: 30.3165, lng: 78.0322 },
      "Kasar Devi, Uttarakhand": { lat: 29.6385, lng: 79.6738 },
      "Uttarakhand": { lat: 30.0869, lng: 78.2676 },
      "Jaipur, Rajasthan": { lat: 26.9124, lng: 75.7873 },
      "Udaipur, Rajasthan": { lat: 24.5854, lng: 73.7125 },
      "Jodhpur, Rajasthan": { lat: 26.2389, lng: 73.0243 },
      "Jaisalmer, Rajasthan": { lat: 26.9157, lng: 70.9083 },
      "Pushkar, Rajasthan": { lat: 26.4897, lng: 74.5511 },
      "Rajasthan": { lat: 26.9124, lng: 75.7873 },
      "Leh, Ladakh": { lat: 34.1526, lng: 77.5771 },
      "Nubra Valley, Ladakh": { lat: 34.6863, lng: 77.5673 },
      "Pangong Tso, Ladakh": { lat: 33.7595, lng: 78.6674 },
      "Zanskar, Ladakh": { lat: 33.4912, lng: 76.8775 },
      "Ladakh": { lat: 34.1526, lng: 77.5771 },
      "Varkala, Kerala": { lat: 8.7379, lng: 76.7163 },
      "Kochi, Kerala": { lat: 9.9312, lng: 76.2673 },
      "Munnar, Kerala": { lat: 10.0889, lng: 77.0595 },
      "Alleppey, Kerala": { lat: 9.4981, lng: 76.3388 },
      "Wayanad, Kerala": { lat: 11.6854, lng: 76.1320 },
      "Kerala": { lat: 9.9312, lng: 76.2673 },
      "Gokarna, Karnataka": { lat: 14.5479, lng: 74.3188 },
      "Gokarna": { lat: 14.5479, lng: 74.3188 },
      "Hampi, Karnataka": { lat: 15.3350, lng: 76.4600 },
      "Coorg, Karnataka": { lat: 12.3375, lng: 75.8069 },
      "Chikmagalur, Karnataka": { lat: 13.3161, lng: 75.7720 },
      "Bengaluru, Karnataka": { lat: 12.9716, lng: 77.5946 },
      "Mumbai, Maharashtra": { lat: 19.0760, lng: 72.8777 },
      "Pune, Maharashtra": { lat: 18.5204, lng: 73.8567 },
      "Delhi NCR": { lat: 28.6139, lng: 77.2090 },
      "Hyderabad, Telangana": { lat: 17.3850, lng: 78.4867 },
      "Chennai, Tamil Nadu": { lat: 13.0827, lng: 80.2707 },
      "Kolkata, West Bengal": { lat: 22.5726, lng: 88.3639 },
      "Pondicherry": { lat: 11.9416, lng: 79.8083 },
      "Varanasi, Uttar Pradesh": { lat: 25.3176, lng: 82.9739 },
      "Agra, Uttar Pradesh": { lat: 27.1767, lng: 78.0081 },
      "Shillong, Meghalaya": { lat: 25.5788, lng: 91.8933 },
      "Cherrapunji, Meghalaya": { lat: 25.2986, lng: 91.7324 },
      "Ziro Valley, Arunachal Pradesh": { lat: 27.5946, lng: 93.8385 },
      "Gangtok, Sikkim": { lat: 27.3389, lng: 88.6065 },
      "Tawang, Arunachal Pradesh": { lat: 27.5861, lng: 91.8665 },
      "North East": { lat: 25.5788, lng: 91.8933 }
    };

    // Real-world dynamic data stores (Zero dummy data, clean production runtime)
    const SEED_INDIAN_TRAVELERS = [];
    const SEED_INDIAN_TRIPS = [];
"""
