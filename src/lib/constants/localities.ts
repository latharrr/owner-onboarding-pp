// ============================================================
// Picapool Locality Constants — North Campus
// ============================================================
// Fixed set of localities executives actually cover on the ground.
// Selecting one auto-fills the pincode — faster and more accurate
// than GPS in dense campus lanes.

export interface LocalityOption {
  id: string;
  label: string;
  pincode: string;
}

export const NORTH_CAMPUS_LOCALITIES: LocalityOption[] = [
  { id: 'kamla_nagar', label: 'Kamla Nagar', pincode: '110007' },
  { id: 'vijay_nagar', label: 'Vijay Nagar', pincode: '110009' },
  { id: 'gtb_nagar', label: 'GTB Nagar', pincode: '110009' },
  { id: 'bungalow_road', label: 'Bungalow Road', pincode: '110007' },
  { id: 'patel_chest', label: 'Patel Chest', pincode: '110007' },
  { id: 'hudson_lane', label: 'Hudson Lane', pincode: '110009' },
  { id: 'mukherjee_nagar', label: 'Mukherjee Nagar', pincode: '110009' },
];

export const LAST_LOCALITY_STORAGE_KEY = 'picapool-last-locality';
