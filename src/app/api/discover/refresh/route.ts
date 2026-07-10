// ============================================================
// AI PG Discovery — Force a re-sync from Google Sheets
// ============================================================

import { NextResponse } from 'next/server';
import { getDiscoveryData } from '@/lib/discover/data';

export async function POST() {
  try {
    const dataset = await getDiscoveryData({ forceRefresh: true });
    return NextResponse.json({
      success: true,
      data: {
        totalOwners: dataset.owners.length,
        totalProperties: dataset.properties.length,
        fetchedAt: dataset.fetchedAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Refresh failed' },
      { status: 503 }
    );
  }
}
