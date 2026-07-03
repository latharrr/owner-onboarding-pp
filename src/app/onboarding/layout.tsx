'use client';

import { usePathname } from 'next/navigation';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { SyncStatus } from '@/components/onboarding/SyncStatus';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentPropertyIndex, properties, session } = useOnboardingStore();

  // Derive step ID from pathname
  const parts = pathname.split('/').filter(Boolean);
  const stepId = parts[parts.length - 1] ?? 'owner';

  // Simple progress: count completed step segments
  const TOTAL_STEPS = 2 + (properties.length || 1) * 10;
  const stepMap: Record<string, number> = {
    owner: 1,
    'owner-summary': 2,
    identity: 3 + currentPropertyIndex * 10,
    audience: 4 + currentPropertyIndex * 10,
    capacity: 5 + currentPropertyIndex * 10,
    rooms: 6 + currentPropertyIndex * 10,
    amenities: 7 + currentPropertyIndex * 10,
    food: 8 + currentPropertyIndex * 10,
    rules: 9 + currentPropertyIndex * 10,
    financials: 10 + currentPropertyIndex * 10,
    availability: 11 + currentPropertyIndex * 10,
    notes: 12 + currentPropertyIndex * 10,
  };

  const currentStep = stepMap[stepId] ?? 1;
  const progress = Math.min(100, Math.round((currentStep / TOTAL_STEPS) * 100));

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Picapool</span>
          </div>
          {session.internName && (
            <div className="flex items-center gap-2">
              <SyncStatus state="saved" />
              <span className="text-xs text-gray-400">{session.internName}</span>
            </div>
          )}
        </div>
        {pathname !== '/onboarding' && <ProgressBar value={progress} />}
      </div>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
