// ============================================================
// API Route: POST /api/submit
// Proxies the full onboarding submission to Apps Script
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { submitOnboarding } from '@/lib/apps-script/client';
import type { SubmissionPayload } from '@/types/onboarding';

export async function POST(req: NextRequest) {
  try {
    const body: SubmissionPayload = await req.json();

    // Basic validation — full Zod validation happens in the form
    if (!body.owner?.phone || !body.session?.internName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: owner.phone, session.internName' },
        { status: 400 }
      );
    }

    if (!body.properties || body.properties.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one property is required' },
        { status: 400 }
      );
    }

    const result = await submitOnboarding(body);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submission failed';
    console.error('[/api/submit]', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
