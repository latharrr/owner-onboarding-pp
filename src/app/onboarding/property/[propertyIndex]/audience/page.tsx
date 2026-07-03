'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { ToggleGroup } from '@/components/onboarding/ToggleGroup';
import type { PGType } from '@/types/onboarding';

const PG_TYPE_OPTIONS = [
  { id: 'male', label: 'Male Only', icon: '👨', description: 'Men and boys' },
  { id: 'female', label: 'Female Only', icon: '👩', description: 'Women and girls' },
  { id: 'unisex', label: 'Unisex', icon: '👥', description: 'All genders welcome' },
];

export default function AudiencePage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('audience', 'Audience');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const handleSelect = (type: string) => {
    updateProperty(idx, { pgType: type as PGType });
  };

  const handleNext = () => {
    if (!property?.pgType) return;
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/capacity`);
  };

  return (
    <>
      <StepWrapper
        title="Who can stay here?"
        subtitle="Select the type of residents this PG accepts"
      >
        <ToggleGroup
          options={PG_TYPE_OPTIONS}
          value={property?.pgType ?? null}
          onChange={handleSelect}
          layout="column"
          size="lg"
        />
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/identity`}
        onNext={handleNext}
        isNextDisabled={!property?.pgType}
      />
    </>
  );
}
