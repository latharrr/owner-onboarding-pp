// ============================================================
// Picapool Hooks — Auto Save
// ============================================================
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

interface AutoSaveOptions {
  debounceMs?: number;
  onSave: () => Promise<void>;
  onError?: (err: unknown) => void;
}

/**
 * Debounced auto-save hook.
 * Triggers `onSave` after `debounceMs` of inactivity.
 * Skips the API call when offline (data is safe in Zustand persist).
 */
export function useAutoSave(deps: unknown[], options: AutoSaveOptions) {
  const { debounceMs = 1500, onSave, onError } = options;
  const isOnline = useOnlineStatus();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const save = useCallback(async () => {
    if (!isOnline) return; // offline — Zustand persists locally
    try {
      await onSave();
    } catch (err) {
      onError?.(err);
    }
  }, [isOnline, onSave, onError]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, debounceMs]);
}
