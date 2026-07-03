'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { DEFAULT_ROOM_CONFIG } from '@/lib/constants/roomTypes';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { RoomConfigCard } from '@/components/onboarding/RoomConfigCard';
import type { RoomConfig } from '@/types/onboarding';

export default function RoomsPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty, addRoomConfig, updateRoomConfig, removeRoomConfig } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('rooms', 'Room Configurations');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const configs = property?.roomConfigs ?? [];

  const handleAdd = () => {
    addRoomConfig(idx, DEFAULT_ROOM_CONFIG);
  };

  const handleUpdate = (configId: string, data: Partial<RoomConfig>) => {
    updateRoomConfig(idx, configId, data);
  };

  const handleRemove = (configId: string) => {
    removeRoomConfig(idx, configId);
  };

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/amenities`);
  };

  return (
    <>
      <StepWrapper
        title="Room Configurations"
        subtitle="Add the different types of rooms this PG offers"
      >
        <div className="flex flex-col gap-4">
          {configs.map((config, i) => (
            <RoomConfigCard
              key={config.configId}
              config={config}
              index={i}
              onUpdate={(data) => handleUpdate(config.configId, data)}
              onRemove={() => handleRemove(config.configId)}
              canRemove={configs.length > 1}
            />
          ))}

          <button
            id="btn-add-room-config"
            type="button"
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-brand/30 text-brand rounded-2xl font-semibold text-sm hover:bg-brand-light/30 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Room Configuration
          </button>
        </div>
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/capacity`}
        onNext={handleNext}
        isNextDisabled={configs.length === 0}
      />
    </>
  );
}
