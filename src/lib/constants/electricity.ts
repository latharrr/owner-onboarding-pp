// ============================================================
// Picapool Electricity Meter Constants
// ============================================================
// Top-5 student question: "Is electricity prepaid or postpaid?"
// Not captured before this fix — coordinators had to call the owner
// back every time a student asked.

import type { ElectricityMeterType } from '@/types/onboarding';

export const ELECTRICITY_METER_OPTIONS: { id: ElectricityMeterType; label: string; description: string }[] = [
  { id: 'prepaid', label: 'Prepaid', description: 'Individual meter, student controls usage' },
  { id: 'postpaid', label: 'Postpaid', description: 'Shared bill, split among residents' },
  { id: 'included', label: 'Included in rent', description: 'No separate electricity charge' },
];

export const AVG_ELECTRICITY_BILL_PRESETS = [500, 800, 1000, 1500];
