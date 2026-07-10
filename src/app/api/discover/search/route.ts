// ============================================================
// AI PG Discovery — Search API (streaming)
// ============================================================
// POST { query: string } -> a text/event-stream of:
//   { type: "properties", payload: { properties, totalMatches, relaxed, filters } }
//   { type: "token", payload: "..." }        (repeated, Groq's streamed answer)
//   { type: "error", payload: "message" }    (if Groq fails — properties still stand)
//   { type: "done" }
//
// The spreadsheet (via Apps Script) is the only source of truth: we
// filter it in plain JS first, and only ever hand Groq the compact,
// already-matched slice — never the raw sheet, never the full dataset.

import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryData } from '@/lib/discover/data';
import { filterProperties, parseQuery } from '@/lib/discover/filters';
import { buildDiscoveryMessages, streamGroqCompletion } from '@/lib/discover/groq';

const MAX_QUERY_LENGTH = 300;
const MAX_RESULTS_RETURNED = 40;

function sseEvent(type: string, payload?: unknown) {
  const body = payload === undefined ? { type } : { type, payload };
  return `data: ${JSON.stringify(body)}\n\n`;
}

export async function POST(request: NextRequest) {
  let query: unknown;
  try {
    const body = await request.json();
    query = body?.query;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ success: false, error: 'query is required' }, { status: 400 });
  }
  const cleanQuery = query.trim().slice(0, MAX_QUERY_LENGTH);

  let dataset;
  try {
    dataset = await getDiscoveryData();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load property data' },
      { status: 503 }
    );
  }

  const filters = parseQuery(cleanQuery);
  const { properties, relaxed } = filterProperties(dataset.properties, filters);
  const totalMatches = properties.length;
  const pageProperties = properties.slice(0, MAX_RESULTS_RETURNED);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(
        encoder.encode(
          sseEvent('properties', {
            properties: pageProperties,
            totalMatches,
            relaxed,
            filters,
          })
        )
      );

      try {
        const messages = buildDiscoveryMessages(cleanQuery, properties, { relaxed, totalMatches });
        for await (const delta of streamGroqCompletion(messages)) {
          controller.enqueue(encoder.encode(sseEvent('token', delta)));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(sseEvent('error', err instanceof Error ? err.message : 'AI answer unavailable'))
        );
      }

      controller.enqueue(encoder.encode(sseEvent('done')));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
