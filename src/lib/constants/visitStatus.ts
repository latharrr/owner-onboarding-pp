// ============================================================
// Picapool Visit Status Constants
// ============================================================

import type { VisitStatus } from '@/types/onboarding';

export interface VisitStatusOption {
  id: VisitStatus;
  label: string;
  description: string;
  icon: string;
  color: 'green' | 'red' | 'orange' | 'gray' | 'blue';
}

export const VISIT_STATUS_OPTIONS: VisitStatusOption[] = [
  {
    id: 'visited',
    label: 'Visited',
    description: 'Successfully onboarded',
    icon: '✅',
    color: 'green',
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    description: 'Owner declined',
    icon: '🚫',
    color: 'red',
  },
  {
    id: 'closed',
    label: 'Closed / Shut Down',
    description: 'PG no longer operating',
    icon: '🔒',
    color: 'gray',
  },
  {
    id: 'already_full',
    label: 'Already Full',
    description: 'No vacancies',
    icon: '🏠',
    color: 'orange',
  },
  {
    id: 'owner_busy',
    label: 'Owner Busy',
    description: 'Needs a follow-up',
    icon: '⏰',
    color: 'blue',
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    description: 'Already in system',
    icon: '🔄',
    color: 'gray',
  },
  {
    id: 'wrong_address',
    label: 'Wrong Address',
    description: 'PG not found here',
    icon: '📍',
    color: 'red',
  },
];
