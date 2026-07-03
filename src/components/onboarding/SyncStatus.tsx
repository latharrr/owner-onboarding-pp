'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { CheckCircle, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncState = 'saved' | 'saving' | 'offline' | 'error';

interface SyncStatusProps {
  state: SyncState;
  queueLength?: number;
  className?: string;
}

export function SyncStatus({ state, queueLength = 0, className }: SyncStatusProps) {
  const isOnline = useOnlineStatus();

  const activeState: SyncState = !isOnline ? 'offline' : state;

  const config = {
    saved: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: 'Saved',
      color: 'text-green-600 bg-green-50 border-green-100',
    },
    saving: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Saving...',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    offline: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: queueLength > 0 ? `Offline · ${queueLength} pending` : 'Offline · data safe',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Sync failed',
      color: 'text-red-600 bg-red-50 border-red-100',
    },
  };

  const { icon, label, color } = config[activeState];

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium',
        color,
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
