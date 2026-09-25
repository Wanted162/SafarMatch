/**
 * SafarMatch — System Constants & Configuration
 */

export const UPI_CONFIG = {
  PAYEE_VPA: "pisalpranit1-1@oksbi",
  PAYEE_NAME: "SafarMatch Bharat Travel Network",
  PLANS: {
    explorer: {
      id: "explorer",
      name: "SafarMatch Explorer Pass (1 Month)",
      amount: 299,
      description: "Unlimited companion chats, trip postings & live Bharat GPS matching."
    },
    boost: {
      id: "boost",
      name: "Trip Itinerary VIP Priority Boost",
      amount: 99,
      description: "Pin your trip to the top of India feed with instant verified badge match."
    }
  }
};

export const FREE_CONNECTS_LIMIT = 2;
export const SUPPORT_EMAIL = "safarmatch@gmail.com";

export const INDIAN_CIRCUITS_LOOKUP: Record<string, { lat: number; lng: number }> = {
  "Goa": { lat: 15.2993, lng: 74.1240 },
  "North Goa": { lat: 15.5491, lng: 73.7535 },
  "South Goa": { lat: 15.2832, lng: 73.9862 },
  "Anjuna, Goa": { lat: 15.5804, lng: 73.7425 },
  "Arambol, Goa": { lat: 15.6865, lng: 73.7042 },
  "Palolem, Goa": { lat: 15.0100, lng: 74.0232 },
  "Panaji, Goa": { lat: 15.4909, lng: 73.8278 },
  "Kasol, Himachal": { lat: 32.0100, lng: 77.3150 },
  "Manali, Himachal": { lat: 32.2432, lng: 77.1892 },
  "Dharamshala, Himachal": { lat: 32.2190, lng: 76.3234 },
  "McLeod Ganj, Himachal": { lat: 32.2426, lng: 76.3213 },
  "Spiti Valley, Himachal": { lat: 32.2461, lng: 78.0349 },
  "Jibhi, Himachal": { lat: 31.6366, lng: 77.3486 },
  "Bir Billing, Himachal": { lat: 32.0469, lng: 76.7188 },
  "Shimla, Himachal": { lat: 31.1048, lng: 77.1734 },
  "Himachal": { lat: 32.2432, lng: 77.1892 },
  "Rishikesh, Uttarakhand": { lat: 30.0869, lng: 78.2676 },
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

export const CHAT_THEMES = [
  { id: 'peace', name: 'Lotus Peace', icon: 'flower-2', desc: 'Calm green, sacred lotus & river waves' },
  { id: 'emerald', name: 'Emerald Forest', icon: 'trees', desc: 'Serene emerald pine & adventure vibes' },
  { id: 'sunset', name: 'Sunset Vibe', icon: 'sunset', desc: 'Warm dusk glow across Ghats & beaches' },
  { id: 'default', name: 'Clean White', icon: 'sparkles', desc: 'Minimal clean slate' }
];
