// ============================================================
// AI PG Discovery — Groq client + prompt builder
// ============================================================
// Groq is only ever shown a compact, already-filtered slice of the
// dataset — never the full spreadsheet, never raw owner contact
// details. The system prompt is fixed and never influenced by user
// input, which combined with sanitized data-only payloads is the
// prompt-injection defense described in the spec.

import type { CompactPropertyRecord, JoinedProperty } from '@/types/discovery';
import { formatINR, genderLabel, labelize } from '@/lib/discover/format';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_RECORDS_TO_MODEL = 18;

export const DISCOVERY_SYSTEM_PROMPT = `You are Picapool's PG accommodation advisor for DU North Campus.

Answer ONLY using the property data supplied in the user message. Never invent property names, prices, amenities, locations, or policies that are not present in that data.

If the user asks about something that is not present in the supplied data, say explicitly that it is not available in the dataset — do not guess or estimate.

Always recommend the best-fitting options first and briefly explain WHY each one fits the request (budget, location, food, amenities, policies, etc.). Rank recommendations whenever there is more than one relevant option.

When asked to compare specific properties, lay out the differences clearly (rent, deposit, amenities, food, room configurations, policies).

Keep answers concise. Use markdown — short bullet points or a numbered list for recommendations. Always refer to a property by its name and ID, e.g. "Sunrise PG (PRP-014)".`;

function formatRentRange(min: number, max: number): string {
  if (!min && !max) return 'Not available in dataset';
  if (min === max || !max) return formatINR(min);
  return `${formatINR(min)} - ${formatINR(max)}`;
}

function formatFood(p: JoinedProperty): string {
  if (!p.foodProvided) return 'Not provided';
  const parts: string[] = [];
  if (p.mealsPerDay) parts.push(`${p.mealsPerDay} meals/day`);
  if (p.mealsList.length) parts.push(p.mealsList.join(', '));
  if (p.mealPreference) parts.push(p.mealPreference.replace(/_/g, ' '));
  if (p.mealIncluded) parts.push('included in rent');
  else if (p.mealCost) parts.push(`${formatINR(p.mealCost)}/month extra`);
  return parts.filter(Boolean).join(' · ') || 'Provided';
}

function formatLockIn(p: JoinedProperty): string {
  if (p.lockInPeriod <= 0) return 'No lock-in';
  return p.lockInPeriodLabel || `${p.lockInPeriod} month(s)`;
}

function formatElectricity(p: JoinedProperty): string {
  if (p.electricityIncluded) return 'Included in rent';
  if (p.electricityBilling === 'fixed' && p.fixedElectricityAmount) {
    return `Fixed ${formatINR(p.fixedElectricityAmount)}/month`;
  }
  if (p.avgElectricityBillPerBed) return `Metered (~${formatINR(p.avgElectricityBillPerBed)}/bed avg)`;
  return 'Metered / as per usage';
}

/**
 * Converts a joined property into the compact record shape sent to
 * Groq. Deliberately excludes phone numbers, emails, and exact street
 * addresses — the model only needs enough to recommend and compare.
 */
export function toCompactRecord(p: JoinedProperty): CompactPropertyRecord {
  return {
    id: p.displayId,
    name: p.name,
    gender: genderLabel(p.pgType),
    locality: [p.locality, p.city].filter(Boolean).join(', ') || 'Not available in dataset',
    rentRange: formatRentRange(p.minRent, p.maxRent),
    roomTypes: p.roomConfigs.map((r) => {
      const rent = r.rentMin === r.rentMax ? formatINR(r.rentMin) : `${formatINR(r.rentMin)}-${formatINR(r.rentMax)}`;
      return `${labelize(r.type)} ${r.acType === 'ac' ? 'AC' : 'Non-AC'} ${labelize(r.furnishing)} — ${rent}`;
    }),
    food: formatFood(p),
    amenities: p.amenities,
    vacancies: p.currentVacancies,
    immediateJoining: p.immediateJoining,
    lockIn: formatLockIn(p),
    deposit: p.securityDeposit ? formatINR(p.securityDeposit) : 'Not available in dataset',
    electricity: formatElectricity(p),
    rating: p.internRating,
  };
}

export function buildUserPrompt(
  query: string,
  records: CompactPropertyRecord[],
  meta: { relaxed: boolean; totalMatches: number }
): string {
  const header = meta.relaxed
    ? `No properties matched every filter in this request, so these are the closest available options from the dataset (${meta.totalMatches} considered). Mention that the match isn't exact before recommending.`
    : `${meta.totalMatches} matching propert${meta.totalMatches === 1 ? 'y' : 'ies'} found in the dataset.`;

  return [`User request: "${query}"`, header, 'Matching properties (JSON):', JSON.stringify(records, null, 2)].join(
    '\n\n'
  );
}

export function buildDiscoveryMessages(
  query: string,
  properties: JoinedProperty[],
  meta: { relaxed: boolean; totalMatches: number }
) {
  const records = properties.slice(0, MAX_RECORDS_TO_MODEL).map(toCompactRecord);
  return [
    { role: 'system' as const, content: DISCOVERY_SYSTEM_PROMPT },
    { role: 'user' as const, content: buildUserPrompt(query, records, meta) },
  ];
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Streams a chat completion from Groq's OpenAI-compatible API,
 * yielding text deltas as they arrive.
 */
export async function* streamGroqCompletion(messages: GroqMessage[]): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set — add it to .env.local (see .env.example)');
  }
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 900,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Groq request failed: ${res.status} ${res.statusText} ${errorText.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length) yield delta;
      } catch {
        // Ignore malformed/keep-alive SSE lines
      }
    }
  }
}

/** Awaits a full (non-streamed) completion — for short, one-shot prompts. */
export async function getGroqCompletion(messages: GroqMessage[]): Promise<string> {
  let out = '';
  for await (const delta of streamGroqCompletion(messages)) out += delta;
  return out;
}
