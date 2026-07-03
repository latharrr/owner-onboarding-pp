// ============================================================
// Picapool Property Validation Schema
// ============================================================
import { z } from 'zod';

export const propertyIdentitySchema = z.object({
  name: z.string().min(2, 'PG name must be at least 2 characters').max(150),
  address: z.string().min(10, 'Enter the full address').max(500),
  locality: z.string().min(2, 'Enter the area/locality name').max(100),
  city: z.string().min(2, 'Enter the city name').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  googleMapsLink: z
    .string()
    .url('Enter a valid Google Maps URL')
    .optional()
    .or(z.literal('')),
});

export const propertyAudienceSchema = z.object({
  pgType: z.enum(['male', 'female', 'unisex']),
});

export const propertyCapacitySchema = z.object({
  totalRooms: z.number().min(1, 'Must have at least 1 room').max(500),
  totalBeds: z.number().min(1, 'Must have at least 1 bed').max(1000),
});

export const roomConfigSchema = z.object({
  type: z.enum(['single', 'double', 'triple', 'quad']),
  acType: z.enum(['ac', 'non_ac']),
  furnishing: z.enum(['fully_furnished', 'semi_furnished', 'unfurnished']),
  count: z.number().min(1, 'Count must be at least 1').max(200),
  rentPerBed: z.number().min(1, 'Rent must be greater than 0').max(100000),
  deposit: z.number().min(0).max(500000),
});

export const propertyRoomsSchema = z.object({
  roomConfigs: z
    .array(roomConfigSchema)
    .min(1, 'Add at least one room configuration'),
});

export const propertyAmenitiesSchema = z.object({
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
});

export const propertyFoodSchema = z.object({
  foodProvided: z.boolean(),
  mealType: z.enum(['all_meals', 'breakfast_only', 'dinner_only', 'none']),
  mealIncluded: z.boolean(),
  mealCost: z.number().min(0).max(50000).optional(),
});

export const propertyRulesSchema = z.object({
  noSmoking: z.boolean(),
  noDrinking: z.boolean(),
  noNonVeg: z.boolean(),
  guestPolicy: z.enum(['allowed', 'not_allowed', 'daytime_only']),
  lockInPeriod: z.number().min(0).max(24),
  noticePeriod: z.number().min(0).max(12),
});

export const propertyFinancialsSchema = z.object({
  maintenanceIncluded: z.boolean(),
  electricityIncluded: z.boolean(),
  electricityBilling: z.enum(['included', 'fixed', 'metered']),
  fixedElectricityAmount: z.number().min(0).max(10000).optional(),
  securityDeposit: z.number().min(0).max(500000),
  tokenAmount: z.number().min(0).max(100000).optional(),
});

export const propertyAvailabilitySchema = z.object({
  availableFrom: z.string().min(1, 'Select an availability date'),
  currentVacancies: z.number().min(0).max(500),
  immediateJoining: z.boolean(),
});

export const propertyNotesSchema = z.object({
  internRating: z.number().min(1).max(5),
  followUpRequired: z.boolean(),
});

export type PropertyIdentityFormData = z.infer<typeof propertyIdentitySchema>;
export type PropertyAudienceFormData = z.infer<typeof propertyAudienceSchema>;
export type PropertyCapacityFormData = z.infer<typeof propertyCapacitySchema>;
export type RoomConfigFormData = z.infer<typeof roomConfigSchema>;
export type PropertyRoomsFormData = z.infer<typeof propertyRoomsSchema>;
export type PropertyAmenitiesFormData = z.infer<typeof propertyAmenitiesSchema>;
export type PropertyFoodFormData = z.infer<typeof propertyFoodSchema>;
export type PropertyRulesFormData = z.infer<typeof propertyRulesSchema>;
export type PropertyFinancialsFormData = z.infer<typeof propertyFinancialsSchema>;
export type PropertyAvailabilityFormData = z.infer<typeof propertyAvailabilitySchema>;
export type PropertyNotesFormData = z.infer<typeof propertyNotesSchema>;
