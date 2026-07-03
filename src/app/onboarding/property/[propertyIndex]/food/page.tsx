'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { MEAL_TYPES } from '@/lib/constants/food';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { ToggleGroup } from '@/components/onboarding/ToggleGroup';
import { Stepper } from '@/components/onboarding/Stepper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { MealType } from '@/types/onboarding';

export default function FoodPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('food', 'Food');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const foodProvided = property?.foodProvided ?? false;
  const mealType = property?.mealType ?? 'none';
  const mealIncluded = property?.mealIncluded ?? false;
  const mealCost = property?.mealCost ?? 0;

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/rules`);
  };

  return (
    <>
      <StepWrapper
        title="Food"
        subtitle="Does this PG provide meals?"
      >
        {/* Food provided toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div>
            <p className="font-semibold text-gray-800">Food provided</p>
            <p className="text-xs text-gray-500">Mess or tiffin service</p>
          </div>
          <Switch
            id="food-provided"
            checked={foodProvided}
            onCheckedChange={(v) => updateProperty(idx, { foodProvided: v, mealType: v ? 'all_meals' : 'none' })}
          />
        </div>

        {foodProvided && (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-gray-700">Meal Type</Label>
              <ToggleGroup
                options={MEAL_TYPES.filter((m) => m.id !== 'none').map((m) => ({
                  id: m.id,
                  label: m.label,
                  icon: m.icon,
                  description: m.description,
                }))}
                value={mealType}
                onChange={(v) => updateProperty(idx, { mealType: v as MealType })}
                layout="grid"
                size="md"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-semibold text-gray-800">Included in rent</p>
                <p className="text-xs text-gray-500">Is food cost part of the rent?</p>
              </div>
              <Switch
                id="meal-included"
                checked={mealIncluded}
                onCheckedChange={(v) => updateProperty(idx, { mealIncluded: v })}
              />
            </div>

            {!mealIncluded && (
              <Stepper
                label="Meal Cost per Month"
                value={mealCost}
                onChange={(v) => updateProperty(idx, { mealCost: v })}
                min={0}
                max={10000}
                step={100}
                prefix="₹"
                size="md"
              />
            )}
          </>
        )}
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/amenities`}
        onNext={handleNext}
      />
    </>
  );
}
