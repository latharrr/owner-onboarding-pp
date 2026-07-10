'use client';

export const QUICK_CHIPS: { label: string; query: string }[] = [
  { label: 'Girls PG', query: 'Girls PG' },
  { label: 'Boys PG', query: 'Boys PG' },
  { label: 'Near DU', query: 'PG near DU' },
  { label: 'Immediate Joining', query: 'PG with immediate joining' },
  { label: 'Food Included', query: 'PG with food included' },
  { label: 'Cheapest', query: 'Cheapest PG' },
  { label: 'Premium', query: 'Premium PG with AC' },
  { label: 'Private Room', query: 'PG with private room' },
];

export function QuickChips({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
      {QUICK_CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelect(chip.query)}
          className="shrink-0 px-3.5 py-2 rounded-full bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-brand-light hover:text-brand transition-colors"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
