// ============================================================
// Picapool Hooks — GPS Capture
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

interface GPSState {
  status: 'idle' | 'capturing' | 'captured' | 'denied' | 'unavailable';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
}

/**
 * Auto-capture GPS coordinates and store them in the session.
 * Silently fails if permission denied — never blocks the flow.
 */
export function useGPS() {
  const [state, setState] = useState<GPSState>({ status: 'idle' });
  const setGPS = useOnboardingStore((s) => s.setGPS);

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'unavailable' });
      return;
    }

    setState({ status: 'capturing' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGPS(latitude, longitude, accuracy);
        setState({ status: 'captured', latitude, longitude, accuracy });
      },
      (err) => {
        const denied = err.code === GeolocationPositionError.PERMISSION_DENIED;
        setState({
          status: denied ? 'denied' : 'unavailable',
          error: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [setGPS]);

  return { ...state, capture };
}
