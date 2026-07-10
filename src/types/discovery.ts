// ============================================================
// AI PG Discovery — Types
// ============================================================
// Raw rows come straight from the Owners/Properties/RoomConfigurations
// Google Sheet tabs (via the Apps Script GET_ALL_DATA action). Joined
// types are what the rest of the app (filters, Groq prompt, UI) works
// with — the frontend never sees raw sheet rows.

// ── Raw sheet rows ────────────────────────────────────────────
export interface RawOwnerRow {
  ownerId: string;
  displayId: string;
  name: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  visitStatus?: string;
  createdAt?: string;
}

export interface RawPropertyRow {
  propertyId: string;
  displayId: string;
  ownerId: string;
  ownerDisplayId: string;
  name: string;
  address?: string;
  locality?: string;
  city?: string;
  pincode?: string;
  googleMapsLink?: string;
  pgType?: string;
  totalRooms?: number | string;
  totalBeds?: number | string;
  amenities?: string;
  foodProvided?: boolean | string;
  mealsPerDay?: number | string;
  mealsList?: string;
  mealType?: string;
  mealIncluded?: boolean | string;
  mealCost?: number | string;
  noSmoking?: boolean | string;
  noDrinking?: boolean | string;
  noNonVeg?: boolean | string;
  guestPolicy?: string;
  lockInPeriod?: number | string;
  noticePeriod?: number | string;
  maintenanceIncluded?: boolean | string;
  electricityIncluded?: boolean | string;
  electricityBilling?: string;
  fixedElectricityAmount?: number | string;
  securityDeposit?: number | string;
  tokenAmount?: number | string;
  availableFrom?: string;
  currentVacancies?: number | string;
  immediateJoining?: boolean | string;
  internRating?: number | string;
  followUpRequired?: boolean | string;
  photoUrls?: string;
  videoUrls?: string;
  documentUrls?: string;
  createdAt?: string;
  updatedAt?: string;
  lockInPeriodLabel?: string;
  noticePeriodLabel?: string;
  electricityMeterType?: string;
  avgElectricityBillPerBed?: number | string;
  foodProvision?: string;
  mealPreference?: string;
}

export interface RawRoomConfigRow {
  configId: string;
  propertyId: string;
  propertyDisplayId: string;
  ownerDisplayId: string;
  type?: string;
  acType?: string;
  furnishing?: string;
  count?: number | string;
  rentPerBed?: number | string;
  deposit?: number | string;
  lockInPeriod?: number | string;
  createdAt?: string;
  rentMin?: number | string;
  rentMax?: number | string;
}

export interface RawDiscoveryData {
  owners: RawOwnerRow[];
  properties: RawPropertyRow[];
  roomConfigs: RawRoomConfigRow[];
  fetchedAt: string;
}

// ── Joined / normalized types (what the app actually uses) ───
export interface JoinedRoomConfig {
  configId: string;
  type: string; // single | double | triple | quad
  acType: string; // ac | non_ac
  furnishing: string; // fully_furnished | semi_furnished | unfurnished
  count: number;
  rentPerBed: number;
  rentMin: number;
  rentMax: number;
  deposit: number;
  lockInPeriod: number;
}

export interface JoinedProperty {
  propertyId: string;
  displayId: string;
  ownerId: string;
  ownerDisplayId: string;

  name: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  googleMapsLink?: string;

  pgType: string; // male | female | unisex

  totalRooms: number;
  totalBeds: number;
  roomConfigs: JoinedRoomConfig[];

  amenities: string[];

  foodProvided: boolean;
  foodProvision?: string;
  mealsPerDay: number;
  mealsList: string[];
  mealType: string;
  mealIncluded: boolean;
  mealCost: number;
  mealPreference?: string;

  noSmoking: boolean;
  noDrinking: boolean;
  noNonVeg: boolean;
  guestPolicy: string;
  lockInPeriod: number;
  noticePeriod: number;
  lockInPeriodLabel?: string;
  noticePeriodLabel?: string;

  maintenanceIncluded: boolean;
  electricityIncluded: boolean;
  electricityBilling: string;
  fixedElectricityAmount: number;
  electricityMeterType?: string;
  avgElectricityBillPerBed: number;
  securityDeposit: number;
  tokenAmount: number;

  availableFrom: string;
  currentVacancies: number;
  immediateJoining: boolean;

  internRating: number;

  photoUrls: string[];
  videoUrls: string[];
  documentUrls: string[];

  createdAt: string;
  updatedAt: string;

  // Denormalized for convenience (call/WhatsApp owner from a property card)
  ownerName: string;
  ownerPhone: string;
  ownerAltPhone?: string;

  // Derived
  minRent: number;
  maxRent: number;
}

export interface JoinedOwner {
  ownerId: string;
  displayId: string;
  name: string;
  phone: string;
  altPhone?: string;
  address?: string;
  visitStatus?: string;
  propertyDisplayIds: string[];
  propertyCount: number;
}

export interface DiscoveryDataset {
  owners: JoinedOwner[];
  properties: JoinedProperty[];
  fetchedAt: string;
}

// ── NL filter parsing ──────────────────────────────────────────
export type SortIntent = 'cheapest' | 'premium' | 'rating' | 'value' | 'relevance';

export interface ParsedFilters {
  gender?: 'male' | 'female' | 'unisex';
  maxRent?: number;
  minRent?: number;
  localityTerms: string[];
  roomType?: 'single' | 'double' | 'triple' | 'quad';
  acType?: 'ac' | 'non_ac';
  furnishing?: 'fully_furnished' | 'semi_furnished' | 'unfurnished';
  foodRequired?: boolean;
  vegOnly?: boolean;
  mealsRequired?: ('breakfast' | 'lunch' | 'dinner')[];
  immediateJoining?: boolean;
  noLockIn?: boolean;
  noSmoking?: boolean;
  guestAllowed?: boolean;
  lowDeposit?: boolean;
  lowToken?: boolean;
  highRating?: boolean;
  amenityTerms: string[];
  sort: SortIntent;
  compareIntent: boolean;
  nameHints: string[]; // candidate property-name fragments mentioned in the query
}

// ── Compact record sent to Groq (never the raw sheet) ─────────
export interface CompactPropertyRecord {
  id: string;
  name: string;
  gender: string;
  locality: string;
  rentRange: string;
  roomTypes: string[];
  food: string;
  amenities: string[];
  vacancies: number;
  immediateJoining: boolean;
  lockIn: string;
  deposit: string;
  electricity: string;
  rating: number;
}

export interface DiscoverSearchResult {
  properties: JoinedProperty[];
  totalMatches: number;
  appliedFilters: ParsedFilters;
}
