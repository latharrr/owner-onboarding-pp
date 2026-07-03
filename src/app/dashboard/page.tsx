'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Users, Building2, Clock, WifiOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { getQueueLength } from '@/lib/store/offline-queue';
import { formatDuration } from '@/lib/utils/ids';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatsCard({ icon, label, value, color }: StatsCardProps) {
  return (
    <div className={`p-4 rounded-2xl border ${color} flex flex-col gap-2`}>
      <div className="text-2xl">{icon}</div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { isSubmitted, session, properties, ownerDisplayId, submissionDisplayId } = useOnboardingStore();
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    getQueueLength().then(setQueueLen);
  }, []);

  const duration = session.duration ? formatDuration(session.duration) : '—';

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back"
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Activity</h1>
            <p className="text-xs text-gray-500">Today&apos;s sessions</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10 flex flex-col gap-6">
        {/* Connection status */}
        <div className={`flex items-center gap-2 p-3 rounded-2xl ${isOnline ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          {isOnline ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-500" />
          )}
          <p className={`text-sm font-semibold ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>
            {isOnline ? 'Connected · Synced' : `Offline · ${queueLen} pending`}
          </p>
        </div>

        {/* Quick stats */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Current Session</p>
          <div className="grid grid-cols-2 gap-3">
            <StatsCard
              icon={<Users className="w-6 h-6 text-brand" />}
              label="Properties Added"
              value={properties.length}
              color="border-brand/10 bg-brand-light/30"
            />
            <StatsCard
              icon={<Clock className="w-6 h-6 text-blue-500" />}
              label="Time Spent"
              value={duration}
              color="border-blue-100 bg-blue-50"
            />
            <StatsCard
              icon={isSubmitted ? <CheckCircle className="w-6 h-6 text-green-500" /> : <AlertCircle className="w-6 h-6 text-amber-500" />}
              label="Status"
              value={isSubmitted ? 'Submitted' : 'In Progress'}
              color={isSubmitted ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'}
            />
            <StatsCard
              icon={<WifiOff className="w-6 h-6 text-gray-400" />}
              label="Pending Sync"
              value={queueLen}
              color="border-gray-100 bg-gray-50"
            />
          </div>
        </div>

        {/* Last submission */}
        {isSubmitted && (ownerDisplayId || submissionDisplayId) && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Last Submission</p>
            <div className="p-4 rounded-2xl border border-green-100 bg-green-50 flex flex-col gap-2">
              {submissionDisplayId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700">Submission</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{submissionDisplayId}</span>
                </div>
              )}
              {ownerDisplayId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700">Owner ID</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{ownerDisplayId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-col gap-3 mt-auto">
          <button
            id="btn-new-session"
            type="button"
            onClick={() => router.push('/')}
            className="w-full h-14 bg-brand text-white rounded-2xl font-bold text-base shadow-lg shadow-brand/20 hover:bg-brand/90 active:scale-[0.98] transition-all"
          >
            Start New Onboarding
          </button>
          <button
            id="btn-search"
            type="button"
            onClick={() => router.push('/search')}
            className="w-full h-14 border border-gray-200 text-gray-700 rounded-2xl font-semibold text-base hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            Search Owners
          </button>
        </div>
      </div>
    </div>
  );
}
