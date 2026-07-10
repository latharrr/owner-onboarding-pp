'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export function CompareBar({ ids, onRemove }: { ids: string[]; onRemove: (id: string) => void }) {
  const router = useRouter();
  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
        <div className="flex -space-x-1 shrink-0">
          {ids.slice(0, 4).map((id) => (
            <span key={id} className="w-2 h-2 rounded-full bg-brand" />
          ))}
        </div>
        <p className="text-xs font-semibold flex-1 truncate">{ids.length} selected to compare</p>
        <button
          type="button"
          onClick={() => ids.forEach((id) => onRemove(id))}
          className="text-white/50 hover:text-white"
          aria-label="Clear compare selection"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={ids.length < 2}
          onClick={() => router.push(`/discover/compare?ids=${ids.join(',')}`)}
          className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-bold disabled:opacity-40"
        >
          Compare →
        </button>
      </div>
    </div>
  );
}
