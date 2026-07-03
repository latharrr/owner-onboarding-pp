'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  showSkip?: boolean;
  showBack?: boolean;
  nextHref?: string;
  backHref?: string;
  skipHref?: string;
}

export function BottomNav({
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Continue',
  backLabel = 'Back',
  skipLabel = 'Skip',
  isNextDisabled = false,
  isLoading = false,
  showSkip = false,
  showBack = true,
  nextHref,
  backHref,
  skipHref,
}: BottomNavProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) return onBack();
    if (backHref) return router.push(backHref);
    router.back();
  };

  const handleNext = () => {
    if (onNext) return onNext();
    if (nextHref) return router.push(nextHref);
  };

  const handleSkip = () => {
    if (onSkip) return onSkip();
    if (skipHref) return router.push(skipHref);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
      <div className="flex items-center justify-between gap-3 px-6 py-4 max-w-2xl mx-auto">
        {/* Back */}
        {showBack ? (
          <button
            id="nav-back"
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-gray-600 font-medium text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[52px] min-w-[80px] justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </button>
        ) : (
          <div />
        )}

        {/* Skip */}
        {showSkip && (
          <button
            id="nav-skip"
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-gray-400 font-medium text-sm hover:text-gray-600 transition-colors min-h-[52px]"
          >
            <SkipForward className="w-3.5 h-3.5" />
            {skipLabel}
          </button>
        )}

        {/* Next */}
        <button
          id="nav-next"
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled || isLoading}
          className={cn(
            'flex items-center gap-1.5 px-6 py-3 rounded-2xl font-semibold text-sm transition-all min-h-[52px] flex-1 justify-center max-w-[200px]',
            isNextDisabled || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-brand text-white hover:bg-brand/90 active:scale-[0.98] shadow-sm shadow-brand/30'
          )}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
