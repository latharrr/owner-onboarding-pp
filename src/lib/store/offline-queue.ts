// ============================================================
// Picapool Offline Queue — IndexedDB via idb
// ============================================================
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'picapool-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

export interface QueuedAction {
  id: string;
  type: 'submit' | 'draft' | 'duplicate-check';
  payload: unknown;
  enqueuedAt: string;
  retryCount: number;
  lastError?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueAction(action: Omit<QueuedAction, 'id' | 'enqueuedAt' | 'retryCount'>): Promise<string> {
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const entry: QueuedAction = {
    ...action,
    id,
    enqueuedAt: new Date().toISOString(),
    retryCount: 0,
  };
  await db.put(STORE_NAME, entry);
  return id;
}

export async function getQueue(): Promise<QueuedAction[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function getQueueLength(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function updateRetryCount(id: string, error: string): Promise<void> {
  const db = await getDB();
  const item = await db.get(STORE_NAME, id);
  if (item) {
    await db.put(STORE_NAME, {
      ...item,
      retryCount: item.retryCount + 1,
      lastError: error,
    });
  }
}

export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

// ── Process queue when back online ───────────────────────────
export async function processQueue(
  onProcess: (action: QueuedAction) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  const queue = await getQueue();
  let processed = 0;
  let failed = 0;

  for (const action of queue) {
    if (action.retryCount >= 3) {
      // Give up after 3 retries
      failed++;
      continue;
    }
    try {
      const success = await onProcess(action);
      if (success) {
        await removeFromQueue(action.id);
        processed++;
      } else {
        await updateRetryCount(action.id, 'Processing returned false');
        failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await updateRetryCount(action.id, msg);
      failed++;
    }
  }

  return { processed, failed };
}
