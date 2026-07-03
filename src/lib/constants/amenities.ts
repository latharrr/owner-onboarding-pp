// ============================================================
// Picapool Amenities Constants
// ============================================================

export interface AmenityOption {
  id: string;
  label: string;
  icon: string; // emoji for chip display
  category: 'connectivity' | 'comfort' | 'security' | 'utilities' | 'lifestyle';
}

export const AMENITIES: AmenityOption[] = [
  // Connectivity
  { id: 'wifi', label: 'Wi-Fi', icon: '📶', category: 'connectivity' },
  { id: 'power_backup', label: 'Power Backup', icon: '🔋', category: 'utilities' },
  // Comfort
  { id: 'ac', label: 'AC', icon: '❄️', category: 'comfort' },
  { id: 'geyser', label: 'Geyser', icon: '🚿', category: 'comfort' },
  { id: 'furnished', label: 'Furnished', icon: '🛋️', category: 'comfort' },
  { id: 'attached_bathroom', label: 'Attached Bath', icon: '🚽', category: 'comfort' },
  { id: 'pantry', label: 'Pantry', icon: '🍽️', category: 'comfort' },
  { id: 'washing_machine', label: 'Washing Machine', icon: '🫧', category: 'lifestyle' },
  { id: 'laundry', label: 'Laundry Service', icon: '👕', category: 'lifestyle' },
  // Security
  { id: 'cctv', label: 'CCTV', icon: '📹', category: 'security' },
  { id: 'security_guard', label: 'Security Guard', icon: '💂', category: 'security' },
  { id: 'biometric', label: 'Biometric', icon: '🔐', category: 'security' },
  { id: 'lockers', label: 'Lockers', icon: '🔒', category: 'security' },
  // Utilities
  { id: 'ro_water', label: 'RO Water', icon: '💧', category: 'utilities' },
  { id: 'cooking_allowed', label: 'Cooking Allowed', icon: '🍳', category: 'utilities' },
  { id: 'kitchen', label: 'Common Kitchen', icon: '🥘', category: 'utilities' },
  { id: 'parking_two_wheeler', label: '2-Wheeler Parking', icon: '🛵', category: 'utilities' },
  { id: 'parking_four_wheeler', label: '4-Wheeler Parking', icon: '🚗', category: 'utilities' },
  // Lifestyle
  { id: 'gym', label: 'Gym', icon: '🏋️', category: 'lifestyle' },
  { id: 'recreation_room', label: 'Recreation Room', icon: '🎮', category: 'lifestyle' },
  { id: 'housekeeping', label: 'Housekeeping', icon: '🧹', category: 'lifestyle' },
  { id: 'study_room', label: 'Study Room', icon: '📚', category: 'lifestyle' },
  { id: 'elevator', label: 'Elevator / Lift', icon: '🛗', category: 'comfort' },
  { id: 'terrace', label: 'Terrace', icon: '🏡', category: 'lifestyle' },
];

export const AMENITY_CATEGORIES = [
  { id: 'connectivity', label: 'Connectivity' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'security', label: 'Security' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'lifestyle', label: 'Lifestyle' },
] as const;
