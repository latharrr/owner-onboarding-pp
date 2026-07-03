'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { Stepper } from '@/components/onboarding/Stepper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AvailabilityPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('availability', 'Availability');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const today = new Date().toISOString().split('T')[0];

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/notes`);
  };

  return (
    <>
      <StepWrapper title="Availability" subtitle="When can tenants move in?">
        {/* Immediate joining toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div>
            <p className="font-semibold text-gray-800">Immediate Joining</p>
            <p className="text-xs text-gray-500">Move in today or this week</p>
          </div>
          <Switch
            id="immediate-joining"
            checked={property?.immediateJoining ?? false}
            onCheckedChange={(v) => {
              updateProperty(idx, {
                immediateJoining: v,
                availableFrom: v ? today : property?.availableFrom,
              });
            }}
          />
        </div>

        {/* Available from date */}
        {!property?.immediateJoining && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="available-from" className="text-sm font-semibold text-gray-700">
              Available From
            </Label>
            <Input
              id="available-from"
              type="date"
              value={property?.availableFrom ?? today}
              min={today}
              onChange={(e) => updateProperty(idx, { availableFrom: e.target.value })}
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
            />
          </div>
        )}

        {/* Current vacancies */}
        <Stepper
          label="Current Vacancies"
          value={property?.currentVacancies ?? 0}
          onChange={(v) => updateProperty(idx, { currentVacancies: v })}
          min={0}
          max={500}
          unit="beds available"
          size="lg"
        />
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/financials`}
        onNext={handleNext}
      />
    </>
  );
}