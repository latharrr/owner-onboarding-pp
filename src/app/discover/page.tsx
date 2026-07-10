'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Search, Sparkles, Loader2 } from 'lucide-react';
import { useDiscoverySearch } from '@/lib/discover/useDiscoverySearch';
import { QuickChips } from '@/components/discover/QuickChips';
import { PropertyCard } from '@/components/discover/PropertyCard';
import { CompareBar } from '@/components/discover/CompareBar';
import { MarkdownLite } from '@/components/discover/MarkdownLite';

const SAVED_KEY = 'picapool-discover-saved';

const EXAMPLE_QUERIES = [
  'Girls PG under ₹12,000 near North Campus',
  'Boys PG with AC and food',
  'Cheapest PG in Vijay Nagar',
  'PG with immediate joining and no lock-in',
  'Recommend the best value PG under ₹10,000',
];

export default function DiscoverPage() {
  const router = useRouter();
  const { properties, totalMatches, relaxed, answer, aiError, dataError, isSearching, hasSearched, search } =
    useDiscoverySearch();

  const [inputValue, setInputValue] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_KEY);
      if (stored) setSavedIds(JSON.parse(stored));
    } catch {
      /* ignore corrupt localStorage */
    }
  }, []);

  const persistSaved = (ids: string[]) => {
    setSavedIds(ids);
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  };

  const toggleSave = (id: string) => {
    persistSaved(savedIds.includes(id) ? savedIds.filter((s) => s !== id) : [...savedIds, id]);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const runSearch = (q: string) => {
    setInputValue(q);
    search(q);
  };

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="p-2 rounded-xl hover:bg-gray-50"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" /> AI PG Search
            </h1>
            <p className="text-[11px] text-gray-400">Ask in plain English · DU North Campus</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(inputValue);
          }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="discover-search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Try "Girls PG under ₹12,000 near North Campus"'
            className="w-full h-14 rounded-2xl border border-gray-200 pl-11 pr-14 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-brand text-white disabled:opacity-40"
            aria-label="Search"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-3">
          <QuickChips onSelect={runSearch} />
        </div>
      </div>

      <div className="px-6 pt-6 flex flex-col gap-6 max-w-3xl mx-auto">
        {dataError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-4">
            <p className="font-semibold mb-1">Live data isn&apos;t connected yet</p>
            <p className="text-xs leading-relaxed">{dataError}</p>
          </div>
        )}

        {!hasSearched && !dataError && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Try asking</p>
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => runSearch(ex)}
                className="text-left text-sm px-4 py-3 rounded-2xl border border-gray-100 text-gray-600 hover:border-brand/40"
              >
                &ldquo;{ex}&rdquo;
              </button>
            ))}
          </div>
        )}

        {hasSearched && !dataError && (
          <>
            {(answer || isSearching) && (
              <div className="rounded-2xl bg-brand-light/40 border border-brand/10 p-4">
                <p className="text-xs font-bold text-brand uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Recommendation
                </p>
                {answer ? (
                  <MarkdownLite text={answer} />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking through {totalMatches || '…'} matching PGs
                  </div>
                )}
                {aiError && <p className="text-xs text-amber-600 mt-2">{aiError}</p>}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {totalMatches} {totalMatches === 1 ? 'PG' : 'PGs'} found
              </p>
              {relaxed && <p className="text-xs text-gray-400">Showing closest matches</p>}
            </div>

            {properties.length === 0 && !isSearching ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🏠</p>
                <p className="font-semibold text-gray-700">No PGs match yet</p>
                <p className="text-sm text-gray-400 mt-1">Try a broader search — just the locality or budget.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((p) => (
                  <PropertyCard
                    key={p.propertyId}
                    property={p}
                    compareChecked={compareIds.includes(p.displayId)}
                    onToggleCompare={() => toggleCompare(p.displayId)}
                    saved={savedIds.includes(p.displayId)}
                    onToggleSave={() => toggleSave(p.displayId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <CompareBar ids={compareIds} onRemove={(id) => setCompareIds((prev) => prev.filter((c) => c !== id))} />
    </div>
  );
}
