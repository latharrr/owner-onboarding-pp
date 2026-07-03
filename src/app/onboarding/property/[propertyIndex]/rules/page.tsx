'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { ToggleGroup } from '@/components/onboarding/ToggleGroup';
import { Stepper } from '@/components/onboarding/Stepper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { GuestPolicy } from '@/types/onboarding';

const GUEST_OPTIONS = [
  { id: 'allowed', label: 'Allowed', icon: '✅', description: 'Guests can visit anytime' },
  { id: 'daytime_only', label: 'Daytime Only', icon: '☀️', description: 'Until 9 PM only' },
  { id: 'not_allowed', label: 'Not Allowed', icon: '🚫', description: 'No visitors' },
];

export default function RulesPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('rules', 'House Rules');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/financials`);
  };

  return (
    <>
      <StepWrapper title="House Rules" subtitle="What are the restrictions at this PG?">
        {/* Rule toggles */}
        <div className="flex flex-col gap-3">
          {[
            { id: 'noSmoking', label: 'No Smoking', icon: '🚬', description: 'Smoking not allowed on premises' },
            { id: 'noDrinking', label: 'No Drinking', icon: '🍺', description: 'Alcohol not permitted' },
            { id: 'noNonVeg', label: 'Veg Only', icon: '🥗', description: 'No non-veg food allowed' },
          ].map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">{rule.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{rule.label}</p>
                  <p className="text-xs text-gray-500">{rule.description}</p>
                </div>
              </div>
              <Switch
                id={`rule-${rule.id}`}
                checked={!!(property?.[rule.id as keyof typeof property])}
                onCheckedChange={(v) => updateProperty(idx, { [rule.id]: v })}
              />
            </div>
          ))}
        </div>

        {/* Guest Policy */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">Guest Policy</Label>
          <ToggleGroup
            options={GUEST_OPTIONS}
            value={property?.guestPolicy ?? null}
            onChange={(v) => updateProperty(idx, { guestPolicy: v as GuestPolicy })}
            layout="column"
            size="md"
          />
        </div>

        {/* Lock-in & Notice */}
        <div className="grid grid-cols-2 gap-4">
          <Stepper
            label="Lock-in Period"
            value={property?.lockInPeriod ?? 1}
            onChange={(v) => updateProperty(idx, { lockInPeriod: v })}
            min={0}
            max={24}
            unit="months"
            size="sm"
          />
          <Stepper
            label="Notice Period"
            value={property?.noticePeriod ?? 1}
            onChange={(v) => updateProperty(idx, { noticePeriod: v })}
            min={0}
            max={12}
            unit="months"
            size="sm"
          />
        </div>
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/food`}
        onNext={handleNext}
      />
    </>
  );
}