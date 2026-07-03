'use client';

import { useRouter } from 'next/navigation';
import { Trash2, Plus, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomConfig } from '@/types/onboarding';
import { ROOM_TYPES, AC_TYPES, FURNISHING_TYPES } from '@/lib/constants/roomTypes';
import { Stepper } from './Stepper';

interface RoomConfigCardProps {
  config: RoomConfig;
  index: number;
  onUpdate: (data: Partial<RoomConfig>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function RoomConfigCard({
  config,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: RoomConfigCardProps) {
  const roomType = ROOM_TYPES.find((r) => r.id === config.type);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-light/40 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base">{roomType?.icon ?? '🛏'}</span>
          <span className="font-semibold text-gray-800 text-sm">
            Room Config #{index + 1}
          </span>
        </div>
        {canRemove && (
          <button
            id={`room-remove-${index}`}
            type="button"
            onClick={onRemove}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Room Type */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room Type</p>
          <div className="flex gap-2 flex-wrap">
            {ROOM_TYPES.map((rt) => (
              <button
                key={rt.id}
                id={`roomtype-${index}-${rt.id}`}
                type="button"
                onClick={() => onUpdate({ type: rt.id })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                  config.type === rt.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand/30'
                )}
              >
                <span>{rt.icon.charAt(0)}</span>
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* AC Type */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AC</p>
          <div className="flex gap-2">
            {AC_TYPES.map((ac) => (
              <button
                key={ac.id}
                id={`actype-${index}-${ac.id}`}
                type="button"
                onClick={() => onUpdate({ acType: ac.id })}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex-1',
                  config.acType === ac.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand/30'
                )}
              >
                <span>{ac.icon}</span>
                {ac.label}
              </button>
            ))}
          </div>
        </div>

        {/* Furnishing */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Furnishing</p>
          <div className="flex flex-col gap-2">
            {FURNISHING_TYPES.map((f) => (
              <button
                key={f.id}
                id={`furnish-${index}-${f.id}`}
                type="button"
                onClick={() => onUpdate({ furnishing: f.id })}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                  config.furnishing === f.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand/30'
                )}
              >
                <div>
                  <div className="font-semibold">{f.label}</div>
                  <div className={cn('text-xs mt-0.5', config.furnishing === f.id ? 'text-white/70' : 'text-gray-400')}>
                    {f.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Count + Rent */}
        <div className="grid grid-cols-2 gap-4">
          <Stepper
            label="Count"
            value={config.count}
            onChange={(v) => onUpdate({ count: v })}
            min={1}
            max={100}
            size="sm"
          />
          <Stepper
            label="Rent / Bed"
            value={config.rentPerBed}
            onChange={(v) => onUpdate({ rentPerBed: v })}
            min={0}
            max={100000}
            step={500}
            prefix="₹"
            size="sm"
          />
        </div>

        {/* Deposit */}
        <Stepper
          label="Security Deposit"
          value={config.deposit}
          onChange={(v) => onUpdate({ deposit: v })}
          min={0}
          max={500000}
          step={500}
          prefix="₹"
          size="sm"
        />
      </div>
    </div>
  );
}
