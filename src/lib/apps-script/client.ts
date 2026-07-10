// ============================================================
// Picapool Apps Script Client
// ============================================================
import type { SubmissionPayload, SubmissionResult, DuplicateCheckResult } from '@/types/onboarding';
import type { RawDiscoveryData } from '@/types/discovery';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEB_APP_URL;
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET;

interface AppsScriptResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callAppsScript<T>(
  action: string,
  payload: Record<string, unknown>
): Promise<AppsScriptResponse<T>> {
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
    throw new Error(
      'Apps Script is not configured — set APPS_SCRIPT_WEB_APP_URL and APPS_SCRIPT_SECRET in .env.local'
    );
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: APPS_SCRIPT_SECRET,
      action,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apps Script request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text) as AppsScriptResponse<T>;
  } catch {
    throw new Error(`Invalid JSON from Apps Script: ${text.substring(0, 100)}`);
  }
}

/**
 * Check if a phone number already exists in the Owners sheet.
 */
export async function checkDuplicatePhone(phone: string): Promise<DuplicateCheckResult> {
  const result = await callAppsScript<DuplicateCheckResult>('CHECK_DUPLICATE', { phone });
  if (!result.success || !result.data) {
    return { isDuplicate: false };
  }
  return result.data;
}

/**
 * Submit the full onboarding session to Google Sheets via Apps Script.
 * Apps Script handles: ID generation, timestamps, writing all 4 tabs.
 */
export async function submitOnboarding(payload: SubmissionPayload): Promise<SubmissionResult> {
  const result = await callAppsScript<SubmissionResult>('SUBMIT_ONBOARDING', { payload });
  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Submission failed with no error details');
  }
  return result.data;
}

/**
 * Log a draft save for analytics and recovery purposes.
 */
export async function saveDraft(sessionId: string, step: string): Promise<void> {
  // Fire and forget — draft saves are best-effort
  callAppsScript('SAVE_DRAFT', { sessionId, step, timestamp: new Date().toISOString() }).catch(
    () => {}
  );
}

/**
 * Read-only export of Owners/Properties/RoomConfigurations for the
 * AI Discovery feature. Submissions are excluded — they're internal
 * operational metadata, never shown to end users.
 */
export async function fetchAllDiscoveryData(): Promise<RawDiscoveryData> {
  const result = await callAppsScript<RawDiscoveryData>('GET_ALL_DATA', {});
  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to load data from Apps Script');
  }
  return result.data;
}
