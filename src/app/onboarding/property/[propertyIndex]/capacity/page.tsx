'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { Stepper } from '@/components/onboarding/Stepper';

export default function CapacityPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('capacity', 'Capacity');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/rooms`);
  };

  const totalRooms = property?.totalRooms ?? 0;
  const totalBeds = property?.totalBeds ?? 0;

  return (
    <>
      <StepWrapper
        title="Capacity"
        subtitle="How many rooms and beds does this PG have?"
      >
        <div className="flex flex-col gap-8 pt-2">
          <Stepper
            label="Total Rooms"
            value={totalRooms}
            onChange={(v) => updateProperty(idx, { totalRooms: v })}
            min={1}
            max={500}
            unit="rooms"
            size="lg"
          />

          <div className="h-px bg-gray-100" />

          <Stepper
            label="Total Beds"
            value={totalBeds}
            onChange={(v) => updateProperty(idx, { totalBeds: v })}
            min={1}
            max={1000}
            unit="beds"
            size="lg"
          />

          {totalRooms > 0 && totalBeds > 0 && (
            <div className="bg-brand-light/50 rounded-2xl px-4 py-3">
              <p className="text-sm text-brand font-medium">
                ~{(totalBeds / totalRooms).toFixed(1)} beds per room on average
              </p>
            </div>
          )}
        </div>
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/audience`}
        onNext={handleNext}
        isNextDisabled={totalRooms === 0 || totalBeds === 0}
      />
    </>
  );
}
