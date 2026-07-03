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
