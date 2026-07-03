// ============================================================
// Picapool Step Analytics Hook
// ============================================================
'use client';

import { useCallback, useRef } from 'react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import type { StepAnalyticsEvent } from '@/types/onboarding';

/**
 * Track per-step analytics events.
 * Fires non-blocking fire-and-forget requests.
 */
export function useStepAnalytics(stepId: string, stepName: string) {
  const sessionId = useOnboardingStore((s) => s.session.sessionId ?? 'unknown');
  const stepStartTime = useRef<number>(Date.now());

  const track = useCallback(
    async (event: StepAnalyticsEvent['event'], errorMessage?: string) => {
      const now = Date.now();
      const timeSpentMs = event === 'completed' || event === 'skipped'
        ? now - stepStartTime.current
        : undefined;

      const payload: StepAnalyticsEvent = {
        sessionId,
        stepId,
        stepName,
        event,
        timestamp: new Date(now).toISOString(),
        timeSpentMs,
        errorMessage,
      };

      // Fire and forget — don't await, don't block
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently swallow — analytics should never break the UX
      });
    },
    [sessionId, stepId, stepName]
  );

  const onStepStart = useCallback(() => {
    stepStartTime.current = Date.now();
    track('started');
  }, [track]);

  const onStepComplete = useCallback(() => track('completed'), [track]);
  const onStepSkip = useCallback(() => track('skipped'), [track]);
  const onBackClick = useCallback(() => track('back_clicked'), [track]);
  const onError = useCallback((msg: string) => track('error', msg), [track]);

  return { onStepStart, onStepComplete, onStepSkip, onBackClick, onError };
}
