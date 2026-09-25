/**
 * SafarMatch — Type Definitions
 * Enterprise domain models for travelers, trips, messages, profiles, and payments.
 */

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type SubscriptionStatus = 'free' | 'pending_verification' | 'active' | 'rejected';
export type TravelIntent = 'dating' | 'companion' | 'stay_sharing' | 'backpacking';
export type AppView = 'map' | 'trips' | 'chat' | 'profile';
export type ChatTheme = 'peace' | 'sunset' | 'emerald' | 'default';

export interface Traveler {
  id?: string;
  uid: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Non-Binary';
  city: string;
  lat: number;
  lng: number;
  currentCircuit: string;
  vibe: string;
  travelStyle: string[];
  intent: TravelIntent;
  photo: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  bio: string;
  upcomingDestination: string;
  verifiedBadge?: string;
  isCurrentUser?: boolean;
}

export interface Trip {
  id: string;
  destination: string;
  title: string;
  authorName: string;
  authorGender: 'Female' | 'Male' | 'Non-Binary';
  authorPhoto: string;
  authorUid?: string;
  circuit: string;
  dates: string;
  budgetEst: string;
  verifiedOnly: boolean;
  womenOnly: boolean;
  intent: TravelIntent;
  itinerary: string;
  slotsTotal: number;
  slotsTaken: number;
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'partner' | 'system';
  senderUid: string;
  text: string;
  timestamp: any;
  status: 'pending' | 'sent' | 'delivered' | 'read';
}

export interface ChatMetadata {
  initiatorUid: string;
  recipientUid: string;
  initiatorName?: string;
  recipientName?: string;
  status: 'pending' | 'active' | 'declined';
  lastMessage?: string;
  lastTimestamp?: any;
  unreadBy?: string | null;
  unreadCount?: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Non-Binary';
  homeCity: string;
  homeLat: number;
  homeLng: number;
  currentCircuit: string;
  upcomingDestination: string;
  upcomingLat: number;
  upcomingLng: number;
  vibe: string;
  travelStyles: string[];
  intent: TravelIntent;
  bio: string;
  photoUrl: string;
  govIdUrl?: string;
  selfieUrl?: string;
  verificationStatus: VerificationStatus;
  verificationRejectionReason?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan?: string;
  subscriptionUtr?: string;
  paymentRejectionReason?: string;
  isSurakshaEnabled: boolean;
  isStep1Complete?: boolean;
  monthlyConnectsUsed?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface FeedbackData {
  category: 'feature' | 'bug' | 'safety' | 'other';
  rating: number;
  feedbackText: string;
  userEmail: string;
  userUid?: string;
  submittedAt: any;
}
