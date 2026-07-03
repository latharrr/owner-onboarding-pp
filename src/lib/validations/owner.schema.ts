// ============================================================
// Picapool Owner Validation Schema
// ============================================================
import { z } from 'zod';

export const ownerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  altPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(10, 'Please enter a complete address')
    .max(500, 'Address is too long'),
  visitStatus: z.enum([
    'visited',
    'not_interested',
    'closed',
    'already_full',
    'owner_busy',
    'duplicate',
    'wrong_address',
  ]),
});

export type OwnerFormData = z.infer<typeof ownerSchema>;
