// ============================================================
// API Route: POST /api/check-duplicate
// Check if phone number already exists in Google Sheets
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { checkDuplicatePhone } from '@/lib/apps-script/client';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const result = await checkDuplicatePhone(phone);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Duplicate check failed';
    console.error('[/api/check-duplicate]', err);
    // On error — return not duplicate to avoid blocking the flow
    return NextResponse.json(
      { success: true, data: { isDuplicate: false } },
      { status: 200 }
    );
  }
}
