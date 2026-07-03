'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, User, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

// This is a local search page that searches the intern's current session data.
// For a full search across all submissions, the Apps Script should expose a search endpoint.

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-search-back"
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">Search</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10 flex flex-col gap-6">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="search-input"
            type="search"
            placeholder="Search by name, phone, area..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 text-base rounded-2xl border-gray-200 pl-11 pr-4"
            autoFocus
          />
        </div>

        {/* Search tips */}
        {!query && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Search by</p>
            {[
              { icon: <User className="w-4 h-4 text-brand" />, label: 'Owner name', example: 'e.g. Rajesh Kumar' },
              { icon: <span className="text-sm">📱</span>, label: 'Phone number', example: 'e.g. 9876543210' },
              { icon: <Building2 className="w-4 h-4 text-brand" />, label: 'PG name', example: 'e.g. Sunrise PG' },
              { icon: <span className="text-sm">📍</span>, label: 'Area or locality', example: 'e.g. Koramangala' },
            ].map((tip) => (
              <div key={tip.label} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100">
                <div className="w-8 h-8 bg-brand-light/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {tip.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{tip.label}</p>
                  <p className="text-xs text-gray-400">{tip.example}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full search requires Apps Script endpoint */}
        {query.length > 2 && (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-semibold text-gray-700">Full Search Coming Soon</p>
            <p className="text-sm text-gray-400 mt-1">
              Requires the Apps Script search endpoint to be configured.
            </p>
            <p className="text-xs text-gray-300 mt-3">
              Query: &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
