// ============================================================
// AI PG Discovery — one-shot AI summary for a single property
// ============================================================

import { NextResponse } from 'next/server';
import { getDiscoveryData } from '@/lib/discover/data';
import { DISCOVERY_SYSTEM_PROMPT, buildUserPrompt, getGroqCompletion, toCompactRecord } from '@/lib/discover/groq';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let dataset;
  try {
    dataset = await getDiscoveryData();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load property data' },
      { status: 503 }
    );
  }

  const property = dataset.properties.find((p) => p.displayId === id);
  if (!property) {
    return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
  }

  try {
    const record = toCompactRecord(property);
    const prompt = buildUserPrompt(
      'Summarize this PG for a prospective tenant in 3-4 sentences — call out standout features and anything that might be a limitation, based only on the data given.',
      [record],
      { relaxed: false, totalMatches: 1 }
    );
    const summary = await getGroqCompletion([
      { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);
    return NextResponse.json({ success: true, data: { summary } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'AI summary unavailable' },
      { status: 503 }
    );
  }
}
