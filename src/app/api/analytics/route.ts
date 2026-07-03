// ============================================================
// API Route: POST /api/analytics
// Store step analytics events (fire-and-forget)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

// In production, send to Apps Script / a logging service.
// For now, we log to console (captured by Vercel logs) and return 200.
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    // Vercel logs will capture this for debugging
    console.log('[Analytics]', JSON.stringify(event));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    // Never fail — analytics should be silent
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
