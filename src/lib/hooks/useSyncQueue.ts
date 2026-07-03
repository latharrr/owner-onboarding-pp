// ============================================================
// Picapool Hooks — Sync Queue
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  processQueue,
  getQueueLength,
  enqueueAction,
  type QueuedAction,
} from '@/lib/store/offline-queue';

interface SyncQueueState {
  queueLength: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
  failedCount: number;
}

/**
 * Manages the offline sync queue.
 * Automatically processes queued actions when the device comes back online.
 */
export function useSyncQueue(processor: (action: QueuedAction) => Promise<boolean>) {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<SyncQueueState>({
    queueLength: 0,
    isSyncing: false,
    failedCount: 0,
  });

  // Refresh queue length
  const refreshQueueLength = useCallback(async () => {
    const len = await getQueueLength();
    setState((s) => ({ ...s, queueLength: len }));
  }, []);

  // Process queue when coming back online
  const sync = useCallback(async () => {
    if (state.isSyncing) return;
    setState((s) => ({ ...s, isSyncing: true }));
    try {
      const result = await processQueue(processor);
      setState((s) => ({
        ...s,
        isSyncing: false,
        failedCount: result.failed,
        lastSyncedAt: new Date().toISOString(),
        queueLength: s.queueLength - result.processed,
      }));
    } catch {
      setState((s) => ({ ...s, isSyncing: false }));
    }
  }, [processor, state.isSyncing]);

  // Trigger sync on reconnect
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial queue length
  useEffect(() => {
    refreshQueueLength();
  }, [refreshQueueLength]);

  return {
    ...state,
    isOnline,
    enqueue: enqueueAction,
    sync,
    refreshQueueLength,
  };
}
