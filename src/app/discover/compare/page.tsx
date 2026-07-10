'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import type { JoinedProperty } from '@/types/discovery';
import { formatINR, labelize, rentRangeLabel } from '@/lib/discover/format';
import { useDiscoverySearch } from '@/lib/discover/useDiscoverySearch';
import { MarkdownLite } from '@/components/discover/MarkdownLite';

interface CompareRow {
  label: string;
  render: (p: JoinedProperty) => string;
}

const ROWS: CompareRow[] = [
  { label: 'Rent range', render: (p) => rentRangeLabel(p.minRent, p.maxRent) },
  { label: 'Room types', render: (p) => Array.from(new Set(p.roomConfigs.map((r) => labelize(r.type)))).join(', ') || 'Not available' },
  { label: 'Security deposit', render: (p) => (p.securityDeposit ? formatINR(p.securityDeposit) : 'Not available') },
  { label: 'Token amount', render: (p) => (p.tokenAmount ? formatINR(p.tokenAmount) : 'Not available') },
  { label: 'Amenities', render: (p) => (p.amenities.length ? p.amenities.map(labelize).join(', ') : 'Not available') },
  { label: 'Food', render: (p) => (p.foodProvided ? p.mealsList.join(', ') || 'Provided' : 'Not provided') },
  { label: 'Vacancies', render: (p) => String(p.currentVacancies) },
  { label: 'Lock-in', render: (p) => (p.lockInPeriod ? `${p.lockInPeriod} month(s)` : 'No lock-in') },
  { label: 'Electricity', render: (p) => (p.electricityIncluded ? 'Included' : labelize(p.electricityBilling)) },
  { label: 'Maintenance', render: (p) => (p.maintenanceIncluded ? 'Included' : 'Separate') },
  { label: 'Rating', render: (p) => (p.internRating ? `${p.internRating}/5` : 'Not rated') },
];

function CenteredMessage({ emoji, text, onBack }: { emoji: string; text: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-2xl">{emoji}</p>
      <p className="font-semibold text-gray-700">{text}</p>
      <button type="button" onClick={onBack} className="text-sm text-brand font-semibold">
        ← Back to search
      </button>
    </div>
  );
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const idsKey = ids.join(',');

  const [properties, setProperties] = useState<JoinedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { answer, aiError, isSearching, search } = useDiscoverySearch();

  useEffect(() => {
    if (!idsKey) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const results = await Promise.all(
          idsKey.split(',').map(async (id) => {
            const res = await fetch(`/api/discover/property/${id}`);
            const body = await res.json();
            return body.success ? (body.data.property as JoinedProperty) : null;
          })
        );
        if (!active) return;
        setProperties(results.filter((p): p is JoinedProperty => Boolean(p)));
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [idsKey]);

  const askAIToCompare = () => {
    if (properties.length < 2) return;
    search(`Compare ${properties.map((p) => p.name).join(' vs ')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (loadError) {
    return <CenteredMessage emoji="⚠️" text={loadError} onBack={() => router.push('/discover')} />;
  }

  if (ids.length < 2 || properties.length < 2) {
    return <CenteredMessage emoji="⚖️" text="Pick at least 2 PGs to compare" onBack={() => router.push('/discover')} />;
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-50" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-bold text-gray-900">Compare PGs</h1>
      </div>

      <div className="px-6 pt-6 max-w-4xl mx-auto flex flex-col gap-6">
        <button
          type="button"
          onClick={askAIToCompare}
          disabled={isSearching}
          className="self-start flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-brand-light text-brand disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" /> {isSearching ? 'Comparing…' : 'Ask AI to compare'}
        </button>

        {(answer || aiError) && (
          <div className="rounded-2xl bg-brand-light/40 border border-brand/10 p-4">
            {answer && <MarkdownLite text={answer} />}
            {aiError && <p className="text-xs text-amber-600 mt-2">{aiError}</p>}
          </div>
        )}

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 font-semibold pb-3 pr-4 w-32">Property</th>
                {properties.map((p) => (
                  <th key={p.propertyId} className="text-left pb-3 pr-4">
                    <p className="font-bold text-gray-900">{p.name}</p>
                    <p className="text-[11px] text-gray-400 font-normal">{p.displayId}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-gray-100">
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500 align-top">{row.label}</td>
                  {properties.map((p) => (
                    <td key={p.propertyId} className="py-3 pr-4 text-gray-700 align-top">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
