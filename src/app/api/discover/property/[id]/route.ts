// ============================================================
// AI PG Discovery — Single property lookup (by displayId, e.g. PRP-014)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryData } from '@/lib/discover/data';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const owner = dataset.owners.find((o) => o.ownerId === property.ownerId);

  return NextResponse.json({ success: true, data: { property, owner } });
}
