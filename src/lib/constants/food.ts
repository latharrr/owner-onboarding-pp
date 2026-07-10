// ============================================================
// Picapool Food Constants
// ============================================================

import type { MealType } from '@/types/onboarding';

export const MEAL_TYPES: { id: MealType; label: string; icon: string; description: string }[] = [
  {
    id: 'all_meals',
    label: 'All Meals',
    icon: '🍽️',
    description: 'Breakfast, Lunch & Dinner',
  },
  {
    id: 'breakfast_only',
    label: 'Breakfast Only',
    icon: '☕',
    description: 'Morning meal included',
  },
  {
    id: 'dinner_only',
    label: 'Dinner Only',
    icon: '🌙',
    description: 'Evening meal included',
  },
  {
    id: 'none',
    label: 'No Food',
    icon: '🚫',
    description: 'Self-cooking or outside',
  },
];

// Food provision itself — replaces the plain on/off switch. "Cooking allowed"
// is a distinct case from mess/tiffin and matters for student matching.
export const FOOD_PROVISION_OPTIONS = [
  { id: 'no_food', label: 'No food' },
  { id: 'mess', label: 'Mess' },
  { id: 'tiffin', label: 'Tiffin service' },
  { id: 'cooking_allowed', label: 'Cooking allowed' },
];

// Veg preference — a different axis from meal count, and one of the
// top questions students ask before booking.
export const MEAL_PREFERENCE_OPTIONS = [
  { id: 'veg_only', label: 'Veg only' },
  { id: 'veg_non_veg', label: 'Veg + Non-veg' },
  { id: 'veg_egg', label: 'Veg + Egg' },
];

export const MEAL_COUNT_OPTIONS = [2, 3, 4];

// Food charge tiers — matches how owners quote a flat monthly add-on,
// not a freeform number.
export const FOOD_CHARGE_PRESETS = [1500, 2000, 2500, 3000];
