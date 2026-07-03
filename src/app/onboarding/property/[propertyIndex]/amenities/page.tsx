'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { AMENITIES } from '@/lib/constants/amenities';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { ChipSelect } from '@/components/onboarding/ChipSelect';

export default function AmenitiesPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('amenities', 'Amenities');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const selected = property?.amenities ?? [];

  const handleChange = (ids: string[]) => {
    updateProperty(idx, { amenities: ids });
  };

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/food`);
  };

  return (
    <>
      <StepWrapper
        title="Amenities"
        subtitle={`Select all that apply · ${selected.length} selected`}
      >
        <ChipSelect
          options={AMENITIES.map((a) => ({ id: a.id, label: a.label, icon: a.icon }))}
          selected={selected}
          onChange={handleChange}
          multiSelect
          columns={2}
          size="md"
        />
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/rooms`}
        onNext={handleNext}
        isNextDisabled={selected.length === 0}
        showSkip
        onSkip={() => {
          analytics.onStepSkip();
          router.push(`/onboarding/property/${idx}/food`);
        }}
        skipLabel="Skip for now"
      />
    </>
  );
}
