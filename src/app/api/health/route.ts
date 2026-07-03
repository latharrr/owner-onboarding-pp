// ============================================================
// API Route: GET /api/health
// Used by the sync status indicator to test connectivity
// ============================================================
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
