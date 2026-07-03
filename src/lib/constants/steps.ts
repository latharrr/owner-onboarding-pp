// ============================================================
// Picapool Onboarding Steps Configuration
// ============================================================

export interface StepConfig {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  isOptional: boolean;
  isPropertyStep: boolean; // repeats per property
  order: number;
}

// Non-property steps
export const GLOBAL_STEPS: StepConfig[] = [
  {
    id: 'owner',
    path: '/onboarding/owner',
    title: 'Owner Details',
    subtitle: "Tell us about the PG owner",
    isOptional: false,
    isPropertyStep: false,
    order: 1,
  },
  {
    id: 'owner-summary',
    path: '/onboarding/owner-summary',
    title: 'Owner Summary',
    subtitle: 'Review before adding properties',
    isOptional: false,
    isPropertyStep: false,
    order: 2,
  },
];

// Property-level steps (repeat for each property)
export const PROPERTY_STEPS: Omit<StepConfig, 'path' | 'order'>[] = [
  {
    id: 'identity',
    title: 'Property Details',
    subtitle: 'Name, address and location',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'audience',
    title: 'Who Can Stay?',
    subtitle: 'Male, female or unisex',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'capacity',
    title: 'Capacity',
    subtitle: 'Total rooms and beds',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'rooms',
    title: 'Room Configurations',
    subtitle: 'Types, pricing and count',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'amenities',
    title: 'Amenities',
    subtitle: 'What does this PG offer?',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'food',
    title: 'Food',
    subtitle: 'Meals and dining options',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'rules',
    title: 'House Rules',
    subtitle: 'Policies and restrictions',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'financials',
    title: 'Financials',
    subtitle: 'Deposits and billing',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'availability',
    title: 'Availability',
    subtitle: 'Move-in dates and vacancies',
    isOptional: false,
    isPropertyStep: true,
  },
  {
    id: 'notes',
    title: 'Internal Notes',
    subtitle: 'Your observations (not shown to tenants)',
    isOptional: true,
    isPropertyStep: true,
  },
];

export const PROPERTY_STEP_IDS = PROPERTY_STEPS.map((s) => s.id);

export function getPropertyStepPath(propertyIndex: number, stepId: string): string {
  return `/onboarding/property/${propertyIndex}/${stepId}`;
}

export function getTotalSteps(propertyCount: number): number {
  return GLOBAL_STEPS.length + PROPERTY_STEPS.length * propertyCount + 2; // +2 for review + success
}

export function getStepProgress(
  currentStep: string,
  currentPropertyIndex: number,
  totalProperties: number
): number {
  const totalSteps = getTotalSteps(totalProperties || 1);
  
  const globalIdx = GLOBAL_STEPS.findIndex((s) => s.id === currentStep);
  if (globalIdx !== -1) {
    return Math.round(((globalIdx + 1) / totalSteps) * 100);
  }
  
  const propIdx = PROPERTY_STEPS.findIndex((s) => s.id === currentStep);
  if (propIdx !== -1) {
    const completedGlobal = GLOBAL_STEPS.length;
    const completedPriorProperties = currentPropertyIndex * PROPERTY_STEPS.length;
    const current = completedGlobal + completedPriorProperties + propIdx + 1;
    return Math.round((current / totalSteps) * 100);
  }

  if (currentStep === 'review') return 95;
  if (currentStep === 'success') return 100;

  return 0;
}
