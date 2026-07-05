// ============================================================
// Picapool Room Type Constants
// ============================================================

import type { RoomType, ACType, FurnishingType } from '@/types/onboarding';

export const ROOM_TYPES: { id: RoomType; label: string; icon: string; beds: number }[] = [
  { id: 'single', label: 'Single', icon: '🛏', beds: 1 },
  { id: 'double', label: 'Double', icon: '🛏🛏', beds: 2 },
  { id: 'triple', label: 'Triple', icon: '🛏🛏🛏', beds: 3 },
  { id: 'quad', label: 'Quad', icon: '🛏🛏🛏🛏', beds: 4 },
];

export const AC_TYPES: { id: ACType; label: string; icon: string }[] = [
  { id: 'ac', label: 'AC', icon: '❄️' },
  { id: 'non_ac', label: 'Non-AC', icon: '🌀' },
];

export const FURNISHING_TYPES: { id: FurnishingType; label: string; description: string }[] = [
  { id: 'fully_furnished', label: 'Fully Furnished', description: 'Bed, wardrobe, study table, chair' },
  { id: 'semi_furnished', label: 'Semi Furnished', description: 'Bed + wardrobe only' },
  { id: 'unfurnished', label: 'Unfurnished', description: 'Empty room' },
];

export const DEFAULT_ROOM_CONFIG = {
  type: 'single' as RoomType,
  acType: 'non_ac' as ACType,
  furnishing: 'semi_furnished' as FurnishingType,
  count: 1,
  rentPerBed: 0,
  deposit: 0,
};

// ── Room Type Cards (range-based) ────────────────────────────
// Replaces the old "add type → exact price per room" flow. Owners
// talk in ranges ("Double AC is 16-18k"), not exact per-room prices —
// so the executive picks which types exist and enters a min/max rent
// range + room count for each. 45 seconds instead of 4-5 minutes.
export interface RoomTypeCardDef {
  key: string;
  label: string;
  occupancyType: RoomType;
  acType: ACType;
}

export const ROOM_TYPE_CARD_DEFS: RoomTypeCardDef[] = [
  { key: 'single_ac', label: 'Single AC', occupancyType: 'single', acType: 'ac' },
  { key: 'double_ac', label: 'Double AC', occupancyType: 'double', acType: 'ac' },
  { key: 'double_non_ac', label: 'Double Non-AC', occupancyType: 'double', acType: 'non_ac' },
  { key: 'triple_ac', label: 'Triple AC', occupancyType: 'triple', acType: 'ac' },
  { key: 'triple_non_ac', label: 'Triple Non-AC', occupancyType: 'triple', acType: 'non_ac' },
  { key: 'quad', label: 'Quad', occupancyType: 'quad', acType: 'non_ac' },
];

export interface RoomTypeCardState {
  key: string;
  enabled: boolean;
  rentMin: number;
  rentMax: number;
  count: number;
}

export const DEFAULT_ROOM_TYPE_CARDS: RoomTypeCardState[] = ROOM_TYPE_CARD_DEFS.map((def) => ({
  key: def.key,
  enabled: false,
  rentMin: 0,
  rentMax: 0,
  count: 0,
}));

export const LOCK_IN_OPTIONS = [
  { id: '1_month', label: '1 month', months: 1 },
  { id: '3_months', label: '3 months', months: 3 },
  { id: '6_months', label: '6 months', months: 6 },
  { id: '11_months', label: '11 months', months: 11 },
  { id: 'none', label: 'No lock-in', months: 0 },
];

export const NOTICE_PERIOD_OPTIONS = [
  { id: '15_days', label: '15 days', days: 15 },
  { id: '1_month', label: '1 month', days: 30 },
  { id: 'none', label: 'None', days: 0 },
];
