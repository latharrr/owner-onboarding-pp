// ============================================================
// Picapool PG Owner Onboarding — Core Types
// ============================================================

// ── Visit Status ─────────────────────────────────────────────
export type VisitStatus =
  | 'visited'
  | 'not_interested'
  | 'closed'
  | 'already_full'
  | 'owner_busy'
  | 'duplicate'
  | 'wrong_address';

// ── PG Type ──────────────────────────────────────────────────
export type PGType = 'male' | 'female' | 'unisex';

// ── Room Type ────────────────────────────────────────────────
export type RoomType = 'single' | 'double' | 'triple' | 'quad';

// ── AC Type ──────────────────────────────────────────────────
export type ACType = 'ac' | 'non_ac';

// ── Furnishing Type ──────────────────────────────────────────
export type FurnishingType = 'fully_furnished' | 'semi_furnished' | 'unfurnished';

// ── Meal Type ────────────────────────────────────────────────
export type MealType = 'all_meals' | 'breakfast_only' | 'dinner_only' | 'none';

// ── Guest Policy ─────────────────────────────────────────────
export type GuestPolicy = 'allowed' | 'not_allowed' | 'daytime_only';

// ── Electricity Billing ──────────────────────────────────────
export type ElectricityBilling = 'included' | 'fixed' | 'metered';

// ── GPS Coordinates ──────────────────────────────────────────
export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string; // ISO
}

// ── Session Meta ─────────────────────────────────────────────
export interface SessionMeta {
  sessionId: string;
  internName: string;
  internId?: string;
  deviceType: string;
  browser: string;
  gps?: GPSCoordinates;
  startedAt: string; // ISO
  endedAt?: string;  // ISO
  duration?: number; // seconds
}

// ── Owner ─────────────────────────────────────────────────────
export interface Owner {
  ownerId: string;         // UUID — internal
  displayId?: string;      // KN-001 — from Apps Script
  name: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  visitStatus: VisitStatus;
}

// ── Room Configuration ───────────────────────────────────────
export interface RoomConfig {
  configId: string;        // UUID — client-generated
  type: RoomType;
  acType: ACType;
  furnishing: FurnishingType;
  count: number;
  rentPerBed: number;
  deposit: number;
}

// ── Property ─────────────────────────────────────────────────
export interface Property {
  propertyId: string;      // UUID — internal
  ownerId: string;         // FK → Owner.ownerId
  displayId?: string;      // PRP-KN-001 — from Apps Script

  // Identity
  name: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  googleMapsLink?: string;

  // Audience
  pgType: PGType;

  // Capacity
  totalRooms: number;
  totalBeds: number;

  // Room Configurations
  roomConfigs: RoomConfig[];

  // Amenities
  amenities: string[];

  // Food
  foodProvided: boolean;
  mealType: MealType;
  mealIncluded: boolean;
  mealCost?: number;

  // Rules
  noSmoking: boolean;
  noDrinking: boolean;
  noNonVeg: boolean;
  guestPolicy: GuestPolicy;
  lockInPeriod: number;    // months
  noticePeriod: number;    // months

  // Financials
  maintenanceIncluded: boolean;
  electricityIncluded: boolean;
  electricityBilling: ElectricityBilling;
  fixedElectricityAmount?: number;
  securityDeposit: number;
  tokenAmount?: number;

  // Availability
  availableFrom: string;   // ISO date string
  currentVacancies: number;
  immediateJoining: boolean;

  // Internal Notes
  internRating: 1 | 2 | 3 | 4 | 5;
  followUpRequired: boolean;
  voiceNoteKey?: string;   // Phase 2: S3/GCS key

  // Media — Phase 2 schema ready
  photoUrls?: string[];
  videoUrls?: string[];
  documentUrls?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ── Full Onboarding Session ───────────────────────────────────
export interface OnboardingSession {
  session: SessionMeta;
  owner: Partial<Owner>;
  properties: Property[];
  currentPropertyIndex: number;
  isDraft: boolean;
  isSubmitted: boolean;
  submissionId?: string;
  lastSyncedAt?: string;
}

// ── Submission Payload (sent to API → Apps Script) ───────────
export interface SubmissionPayload {
  session: SessionMeta;
  owner: Owner;
  properties: Property[];
}

// ── Submission Result (returned by Apps Script) ──────────────
export interface SubmissionResult {
  success: boolean;
  submissionId: string;
  submissionDisplayId: string;
  ownerDisplayId: string;
  propertyDisplayIds: string[];
  createdAt: string;
  error?: string;
}

// ── Duplicate Check ──────────────────────────────────────────
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingOwner?: {
    displayId: string;
    name: string;
    phone: string;
    createdAt: string;
    propertyCount: number;
  };
}

// ── Step Analytics ───────────────────────────────────────────
export interface StepAnalyticsEvent {
  sessionId: string;
  stepId: string;
  stepName: string;
  event: 'started' | 'completed' | 'skipped' | 'back_clicked' | 'error';
  timestamp: string; // ISO
  timeSpentMs?: number;
  errorMessage?: string;
}

// ── Review Checklist Item ────────────────────────────────────
export interface ReviewItem {
  id: string;
  label: string;
  status: 'complete' | 'missing' | 'optional';
  stepPath?: string; // for navigation to fix
  value?: string;    // display value if complete
}

// ── Dashboard Stats ──────────────────────────────────────────
export interface DashboardStats {
  todayVisits: number;
  completed: number;
  pending: number;
  averageDurationSeconds: number;
  propertiesAdded: number;
  offlineQueue: number;
  failedSync: number;
}

// ── Search Result ─────────────────────────────────────────────
export interface SearchResult {
  type: 'owner' | 'property';
  displayId: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}
