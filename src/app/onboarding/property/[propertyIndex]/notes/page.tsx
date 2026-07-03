'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { VoiceNote } from '@/components/onboarding/VoiceNote';
import { StarRating } from '@/components/onboarding/StarRating';
import { Switch } from '@/components/ui/switch';

export default function NotesPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('notes', 'Internal Notes');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const isLastProperty = idx === (useOnboardingStore.getState().properties.length - 1);

  const handleNext = () => {
    analytics.onStepComplete();
    // Show "Add another property?" prompt — go to owner-summary
    // The owner summary page handles the loop logic
    router.push('/onboarding/owner-summary');
  };

  const handleSkip = () => {
    analytics.onStepSkip();
    router.push('/onboarding/owner-summary');
  };

  return (
    <>
      <StepWrapper
        title="Internal Notes"
        subtitle="Your private observations — not shown to tenants"
        isOptional
      >
        {/* Voice Note */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700">Voice Note</p>
          <p className="text-xs text-gray-500">Record your observations hands-free</p>
          <VoiceNote
            onRecorded={(blob, duration) => {
              // Phase 2: upload to cloud storage and store the key
              console.log('Voice note recorded:', duration, 'seconds');
            }}
          />
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700">Your Rating</p>
          <p className="text-xs text-gray-500">How good is this PG overall?</p>
          <StarRating
            value={property?.internRating ?? 3}
            onChange={(r) => updateProperty(idx, { internRating: r })}
            size="lg"
          />
        </div>

        {/* Follow up */}
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <div>
            <p className="font-semibold text-gray-800">Follow-up Required</p>
            <p className="text-xs text-gray-500">Mark this for a future visit</p>
          </div>
          <Switch
            id="follow-up"
            checked={property?.followUpRequired ?? false}
            onCheckedChange={(v) => updateProperty(idx, { followUpRequired: v })}
          />
        </div>
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/availability`}
        onNext={handleNext}
        nextLabel="Done with Property"
        showSkip
        onSkip={handleSkip}
        skipLabel="Skip Notes"
      />
    </>
  );
}