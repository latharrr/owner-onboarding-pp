'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  Mic,
  Square,
  Play,
  Pause,
  Star,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useGPS } from '@/lib/hooks/useGPS';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { getDeviceInfo } from '@/lib/utils/device';
import { generateId, generateSessionId, formatDuration } from '@/lib/utils/ids';
import { AMENITIES } from '@/lib/constants/amenities';
import { MEAL_TYPES } from '@/lib/constants/food';
import { ROOM_TYPES, AC_TYPES, FURNISHING_TYPES } from '@/lib/constants/roomTypes';
import { VISIT_STATUS_OPTIONS } from '@/lib/constants/visitStatus';
import type { VisitStatus } from '@/types/onboarding';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function ConsolidatedOnboardingPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { capture: captureGPS, latitude, longitude, status: gpsStatus, error: gpsError } = useGPS();

  // â”€â”€ Onboarding State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [internName, setInternName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startedAt, setStartedAt] = useState('');

  // Owner details (Pre-filled defaults)
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAltPhone, setOwnerAltPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');

  // Properties array
  const [properties, setProperties] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize defaults on mount
  useEffect(() => {
    // Load stored intern name
    const storedName = localStorage.getItem('picapool-intern-name') || 'Field Intern';
    setInternName(storedName);
    setSessionId(generateSessionId());
    setStartedAt(new Date().toISOString());

    // Auto GPS
    captureGPS();

    // Add first property with smart defaults
    setProperties([createDefaultPropertyState()]);
  }, []);

  // Auto-reverse geocode coordinates on capture
  useEffect(() => {
    if (!latitude || !longitude) return;

    const reverseGeocode = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'User-Agent': 'PicapoolOnboarding/1.0 (onboarding@picapool.com)',
            },
          }
        );
        const data = await res.json();
        
        if (data && data.address) {
          const addr = data.address;
          const displayAddr = data.display_name || '';
          
          // Derive locality
          const derivedLocality = addr.suburb || addr.neighbourhood || addr.suburb || addr.road || 'Local Locality';
          const derivedCity = addr.city || addr.town || addr.village || 'Bangalore';
          const derivedPincode = addr.postcode || '560034';

          // Update owner address
          setOwnerAddress(displayAddr);

          // Update property details
          setProperties((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[0] = {
              ...updated[0],
              address: displayAddr,
              locality: derivedLocality,
              city: derivedCity,
              pincode: derivedPincode,
              googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
            };
            return updated;
          });
          
          toast.success(`Location captured: ${derivedLocality}`);
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        // Fallback: set google maps link anyway
        setProperties((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
          };
          return updated;
        });
      }
    };

    reverseGeocode();
  }, [latitude, longitude]);

  function createDefaultPropertyState() {
    return {
      propertyId: generateId(),
      name: '',
      address: '',
      locality: '',
      city: '',
      pincode: '',
      googleMapsLink: '',
      pgType: 'unisex',
      totalRooms: 10,
      totalBeds: 20,
      // Default room config
      roomConfigs: [
        {
          configId: generateId(),
          type: 'double',
          acType: 'non_ac',
          furnishing: 'semi_furnished',
          count: 10,
          rentPerBed: 6000,
          deposit: 6000,
          lockInPeriod: 1,
        },
      ],
      amenities: ['wifi', 'power_backup', 'cctv', 'parking_two_wheeler', 'housekeeping'],
      foodProvided: false,
      mealsPerDay: 3,
      mealsList: ['breakfast', 'lunch', 'dinner'],
      mealType: 'none',
      mealIncluded: false,
      mealCost: 0,
      noSmoking: true,
      noDrinking: true,
      noNonVeg: false,
      guestPolicy: 'daytime_only',
      lockInPeriod: 1,
      noticePeriod: 1,
      maintenanceIncluded: true,
      electricityIncluded: false,
      electricityBilling: 'metered',
      fixedElectricityAmount: 0,
      securityDeposit: 6000,
      tokenAmount: 1000,
      availableFrom: new Date().toISOString().split('T')[0],
      currentVacancies: 5,
      immediateJoining: true,
      internRating: 4,
      followUpRequired: false,
      voiceBlob: null,
      voiceDuration: 0,
      isRecording: false,
      audioUrl: null,
    };
  }

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddProperty = () => {
    setProperties([...properties, createDefaultPropertyState()]);
    toast.success('Added another property card below');
  };

  const handleRemoveProperty = (index: number) => {
    if (properties.length === 1) return;
    setProperties(properties.filter((_, i) => i !== index));
  };

  const updatePropertyField = (index: number, field: string, value: any) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const updateRoomConfigField = (propIndex: number, configIndex: number, field: string, value: any) => {
    const updated = [...properties];
    const configs = [...updated[propIndex].roomConfigs];
    configs[configIndex] = { ...configs[configIndex], [field]: value };
    updated[propIndex].roomConfigs = configs;
    setProperties(updated);
  };

  const addRoomConfig = (propIndex: number) => {
    const updated = [...properties];
    updated[propIndex].roomConfigs = [
      ...updated[propIndex].roomConfigs,
      {
        configId: generateId(),
        type: 'single',
        acType: 'non_ac',
        furnishing: 'semi_furnished',
        count: 5,
        rentPerBed: 8000,
        deposit: 8000,
        lockInPeriod: 1,
      },
    ];
    setProperties(updated);
  };

  const removeRoomConfig = (propIndex: number, configIndex: number) => {
    const updated = [...properties];
    if (updated[propIndex].roomConfigs.length === 1) return;
    updated[propIndex].roomConfigs = updated[propIndex].roomConfigs.filter((_: any, i: number) => i !== configIndex);
    setProperties(updated);
  };

  // â”€â”€ Voice Recorder Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        updatePropertyField(index, 'voiceBlob', blob);
        updatePropertyField(index, 'audioUrl', url);
        updatePropertyField(index, 'isRecording', false);
      };

      recorder.start();
      const updated = [...properties];
      updated[index].isRecording = true;
      updated[index].recorderInstance = recorder;
      setProperties(updated);
    } catch {
      toast.error('Microphone permission denied');
    }
  };

  const stopRecording = (index: number) => {
    const prop = properties[index];
    if (prop.recorderInstance) {
      prop.recorderInstance.stop();
      prop.recorderInstance.stream.getTracks().forEach((track: any) => track.stop());
    }
  };

  // â”€â”€ Submit Onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const endedAt = new Date().toISOString();
    const duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);

    const deviceInfo = getDeviceInfo();

    // Convert voice note blobs to base64 for Drive uploading
    const processedProperties = await Promise.all(
      properties.map(async (p) => {
        let voiceNoteBase64 = '';
        if (p.voiceBlob) {
          try {
            voiceNoteBase64 = await blobToBase64(p.voiceBlob);
          } catch (e) {
            console.error('Base64 conversion failed:', e);
          }
        }
        return {
          propertyId: p.propertyId,
          ownerId: '',
          name: p.name || 'Picapool PG',
          address: p.address || 'Local Locality',
          locality: p.locality || 'Locality',
          city: p.city || 'Bangalore',
          pincode: p.pincode || '560034',
          googleMapsLink: p.googleMapsLink || '',
          pgType: p.pgType,
          totalRooms: p.totalRooms,
          totalBeds: p.totalBeds,
          roomConfigs: p.roomConfigs,
          amenities: p.amenities,
          foodProvided: p.foodProvided,
          mealsPerDay: p.mealsPerDay || 3,
          mealsList: p.mealsList || ['breakfast', 'lunch', 'dinner'],
          mealType: p.mealType,
          mealIncluded: p.mealIncluded,
          mealCost: p.mealCost,
          noSmoking: p.noSmoking,
          noDrinking: p.noDrinking,
          noNonVeg: p.noNonVeg,
          guestPolicy: p.guestPolicy,
          lockInPeriod: p.lockInPeriod,
          noticePeriod: p.noticePeriod,
          maintenanceIncluded: p.maintenanceIncluded,
          electricityIncluded: p.electricityIncluded,
          electricityBilling: p.electricityBilling,
          fixedElectricityAmount: p.fixedElectricityAmount,
          securityDeposit: p.securityDeposit,
          tokenAmount: p.tokenAmount,
          availableFrom: p.availableFrom,
          currentVacancies: p.currentVacancies,
          immediateJoining: p.immediateJoining,
          internRating: p.internRating,
          followUpRequired: p.followUpRequired,
          voiceNoteBase64,
        };
      })
    );

    const payload = {
      session: {
        sessionId,
        internName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        gps: latitude ? { latitude, longitude, capturedAt: new Date().toISOString() } : undefined,
        startedAt,
        endedAt,
        duration,
      },
      owner: {
        ownerId: generateId(),
        name: ownerName || 'New Owner',
        phone: ownerPhone || '9999999999',
        altPhone: ownerAltPhone || undefined,
        email: ownerEmail || undefined,
        address: ownerAddress || 'Local Address',
        visitStatus,
      },
      properties: processedProperties,
    };

    // Store in global store for success screen (strip base64 to protect local storage quota)
    const store = useOnboardingStore.getState();
    store.reset();
    store.initSession(internName);
    store.updateOwner(payload.owner);
    payload.properties.forEach((p, i) => {
      const storeProp = { ...p, voiceNoteBase64: undefined };
      if (i === 0) {
        store.updateProperty(0, storeProp);
      } else {
        store.addProperty();
        store.updateProperty(i, storeProp);
      }
    });

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        store.setSubmitted(data.data);
        toast.success('Submitted successfully!');
        router.push('/success');
      } else {
        throw new Error(data.error ?? 'Submission failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      console.error('Submission error:', msg);
      
      if (isOnline) {
        toast.error(`Submission Error: ${msg}`);
      } else {
        // Offline fallback
        store.setSubmitted({
          submissionId: generateId(),
          submissionDisplayId: 'SUB-TEMP',
          ownerDisplayId: 'OWN-TEMP',
          propertyDisplayIds: properties.map((_, idx) => `PRP-TEMP-${idx + 1}`),
        });
        toast.info('Saved locally/offline. Submission queued.');
        router.push('/success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate dynamic progress
  const getProgress = () => {
    let score = 0;
    const total = 7;
    
    if (ownerName.trim()) score++;
    if (/^[6-9]\d{9}$/.test(ownerPhone)) score++;
    if (ownerAddress.trim()) score++;
    
    if (properties.length > 0) {
      const p = properties[0];
      if (p.name.trim()) score++;
      if (p.locality.trim()) score++;
      if (/^\d{6}$/.test(p.pincode)) score++;
      if (p.address.trim()) score++;
    }
    
    return Math.round((score / total) * 100);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(160deg, #fff7f0 0%, #f9fafb 60%)' }}>

      {/* â”€â”€ Sticky Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #FF7A00, #ff9a3c)' }}>
              <span className="text-white font-black text-sm">P</span>
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-sm leading-tight">Picapool Express</p>
              <p className="text-[10px] text-gray-400 leading-tight">{internName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Live' : 'Offline'}
            </div>
            <div className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
              {getProgress()}%
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-orange-100 w-full">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${getProgress()}%`, background: 'linear-gradient(90deg, #FF7A00, #ff9a3c)' }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 flex flex-col gap-5">

        {/* â”€â”€ Hero Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF7A00 0%, #ff6b00 50%, #e05a00 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">Fast PG Onboarding</h1>
              <p className="text-white/80 text-xs mt-1 leading-relaxed">
                Fill what you know â€” GPS auto-fills the address. Tap to select, then Submit.
              </p>
            </div>
          </div>
        </div>

        {/* â”€â”€ SECTION 1: OWNER DETAILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50" style={{ background: 'linear-gradient(90deg, #fff7f0, #ffffff)' }}>
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-base">ðŸ‘¤</div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-sm">Owner Information</h2>
              <p className="text-[11px] text-gray-400">Who owns this property?</p>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3.5">

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Owner Name</label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Full name"
                  className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                <input
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  maxLength={10}
                  type="tel"
                  inputMode="numeric"
                  className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Visit Status</label>
                <select
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value as VisitStatus)}
                  className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 bg-gray-50/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                >
                  {VISIT_STATUS_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.icon} {o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Alt. Phone</label>
                <input
                  value={ownerAltPhone}
                  onChange={(e) => setOwnerAltPhone(e.target.value)}
                  placeholder="Optional"
                  maxLength={10}
                  type="tel"
                  inputMode="numeric"
                  className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                />
              </div>
            </div>

          </div>
        </div>

        {/* â”€â”€ SECTION 2: PROPERTIES LOOP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {properties.map((prop, pIndex) => (
          <div key={prop.propertyId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Property Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50" style={{ background: 'linear-gradient(90deg, #f0f7ff, #ffffff)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-base">ðŸ </div>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-sm">Property #{pIndex + 1}</h2>
                  <p className="text-[11px] text-gray-400">PG details & configuration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* GPS badge */}
                {pIndex === 0 && (
                  <>
                    {gpsStatus === 'capturing' && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">ðŸ“¡ GPS...</span>
                    )}
                    {gpsStatus === 'captured' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">ðŸ“ GPS âœ“</span>
                    )}
                    {(gpsStatus === 'denied' || gpsStatus === 'unavailable') && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full" title={gpsError}>âš ï¸ No GPS</span>
                    )}
                  </>
                )}
                {properties.length > 1 && (
                  <button type="button" onClick={() => handleRemoveProperty(pIndex)}
                    className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 py-4 flex flex-col gap-5">

              {/* PG Identity */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">ðŸ“ Location</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">PG Name</label>
                    <input
                      value={prop.name}
                      onChange={(e) => updatePropertyField(pIndex, 'name', e.target.value)}
                      placeholder="e.g. Sunrise PG"
                      className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Locality / Area</label>
                    <input
                      value={prop.locality}
                      onChange={(e) => updatePropertyField(pIndex, 'locality', e.target.value)}
                      placeholder="e.g. Koramangala"
                      className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Full Address</label>
                    <input
                      value={prop.address}
                      onChange={(e) => updatePropertyField(pIndex, 'address', e.target.value)}
                      placeholder="Street, landmark"
                      className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Pincode</label>
                    <input
                      value={prop.pincode}
                      onChange={(e) => updatePropertyField(pIndex, 'pincode', e.target.value)}
                      placeholder="6 digits"
                      maxLength={6}
                      inputMode="numeric"
                      className="h-12 rounded-xl border border-gray-200 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50 placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-50" />

              {/* PG Type */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">ðŸ‘¥ Residents</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'Male Only', icon: 'ðŸ‘¨' },
                    { id: 'female', label: 'Female Only', icon: 'ðŸ‘©' },
                    { id: 'unisex', label: 'Unisex', icon: 'ðŸ‘¥' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updatePropertyField(pIndex, 'pgType', t.id)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        prop.pgType === t.id
                          ? 'border-orange-400 text-orange-600 shadow-sm'
                          : 'border-gray-200 text-gray-500 bg-gray-50/50'
                      }`}
                      style={prop.pgType === t.id ? { background: 'linear-gradient(135deg, #fff7f0, #ffe4cc)' } : {}}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 grid grid-cols-2 gap-4">
                {[
                  { field: 'totalRooms', label: 'Total Rooms', icon: 'ðŸšª' },
                  { field: 'totalBeds', label: 'Total Beds', icon: 'ðŸ›ï¸' },
                ].map(({ field, label, icon }) => (
                  <div key={field} className="flex items-center justify-between">
                    <div>
                      <p className="text-base">{icon}</p>
                      <p className="text-[11px] font-bold text-gray-600 mt-0.5">{label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => updatePropertyField(pIndex, field, Math.max(1, prop[field] - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 text-base shadow-sm active:scale-95 transition-transform">
                        âˆ’
                      </button>
                      <span className="w-8 text-center text-base font-extrabold text-gray-800">{prop[field]}</span>
                      <button type="button"
                        onClick={() => updatePropertyField(pIndex, field, prop[field] + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm active:scale-95 transition-transform"
                        style={{ background: '#FF7A00' }}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-50" />

              {/* Room Configurations */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">ðŸ› Room Configs</p>
                  <button type="button" onClick={() => addRoomConfig(pIndex)}
                    className="text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Type
                  </button>
                </div>

                {prop.roomConfigs.map((config: any, cIndex: number) => (
                  <div key={config.configId} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 flex flex-col gap-3 relative">
                    {prop.roomConfigs.length > 1 && (
                      <button type="button" onClick={() => removeRoomConfig(pIndex, cIndex)}
                        className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs font-bold">
                        âœ•
                      </button>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: config.type, options: ROOM_TYPES, field: 'type', label: 'Occupancy' },
                        { value: config.acType, options: AC_TYPES, field: 'acType', label: 'AC Type' },
                        { value: config.furnishing, options: FURNISHING_TYPES, field: 'furnishing', label: 'Furnishing' },
                      ].map(({ value, options, field, label }) => (
                        <div key={field} className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
                          <select value={value}
                            onChange={(e) => updateRoomConfigField(pIndex, cIndex, field, e.target.value)}
                            className="h-9 rounded-lg border border-gray-200 text-xs bg-white px-2 text-gray-700 focus:outline-none focus:border-orange-400">
                            {options.map((t: any) => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { field: 'count', label: 'Rooms', value: config.count },
                        { field: 'rentPerBed', label: 'Rent/Bed', value: config.rentPerBed },
                        { field: 'deposit', label: 'Deposit', value: config.deposit },
                        { field: 'lockInPeriod', label: 'Lock-in (M)', value: config.lockInPeriod ?? 1 },
                      ].map(({ field, label, value }) => (
                        <div key={field} className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
                          <input type="number" value={value}
                            onChange={(e) => updateRoomConfigField(pIndex, cIndex, field, Number(e.target.value))}
                            className="h-9 rounded-lg border border-gray-200 px-1.5 text-xs text-center font-bold bg-white focus:outline-none focus:border-orange-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-50" />

              {/* Amenities */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">âœ¨ Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => {
                    const isSelected = prop.amenities.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? prop.amenities.filter((item: string) => item !== a.id)
                            : [...prop.amenities, a.id];
                          updatePropertyField(pIndex, 'amenities', next);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                          isSelected
                            ? 'text-orange-700 border-orange-300 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                        style={isSelected ? { background: 'linear-gradient(135deg, #fff0e0, #ffe0b0)' } : {}}
                      >
                        {a.icon} {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gray-50" />

              {/* Food */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">ðŸ½ Food & Meals</p>
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Food Provided in PG</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Mess / tiffin service available</p>
                  </div>
                  <Switch
                    checked={prop.foodProvided}
                    onCheckedChange={(checked) => updatePropertyField(pIndex, 'foodProvided', checked)}
                  />
                </div>

                {prop.foodProvided && (
                  <div className="rounded-xl border border-orange-100 p-4 flex flex-col gap-4" style={{ background: 'linear-gradient(135deg, #fff7f0, #fff)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Meals per Day</p>
                        <p className="text-[11px] text-gray-400">Daily frequency</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button"
                          onClick={() => updatePropertyField(pIndex, 'mealsPerDay', Math.max(1, (prop.mealsPerDay ?? 3) - 1))}
                          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-sm">âˆ’</button>
                        <span className="w-7 text-center text-lg font-extrabold text-orange-600">{prop.mealsPerDay ?? 3}</span>
                        <button type="button"
                          onClick={() => updatePropertyField(pIndex, 'mealsPerDay', (prop.mealsPerDay ?? 3) + 1)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ background: '#FF7A00' }}>+</button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Which Meals?</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'breakfast', label: 'Breakfast', icon: 'ðŸ³' },
                          { id: 'lunch', label: 'Lunch', icon: 'ðŸ±' },
                          { id: 'dinner', label: 'Dinner', icon: 'ðŸ›' },
                        ].map((meal) => {
                          const list = prop.mealsList ?? ['breakfast', 'lunch', 'dinner'];
                          const active = list.includes(meal.id);
                          return (
                            <button key={meal.id} type="button"
                              onClick={() => {
                                const next = active
                                  ? list.filter((item: string) => item !== meal.id)
                                  : [...list, meal.id];
                                updatePropertyField(pIndex, 'mealsList', next);
                              }}
                              className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95 ${
                                active ? 'border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-500'
                              }`}
                              style={active ? { background: 'linear-gradient(135deg, #fff0e0, #ffe0b0)' } : {}}>
                              <span className="text-base">{meal.icon}</span>
                              {meal.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-50" />

              {/* Rules */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">ðŸ“‹ Rules & Policies</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { field: 'noSmoking', label: 'No Smoking', icon: 'ðŸš­' },
                    { field: 'noDrinking', label: 'No Drinking', icon: 'ðŸº' },
                    { field: 'noNonVeg', label: 'Veg Only', icon: 'ðŸ¥—' },
                  ].map((rule) => {
                    const active = prop[rule.field];
                    return (
                      <button key={rule.field} type="button"
                        onClick={() => updatePropertyField(pIndex, rule.field, !active)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95 ${
                          active ? 'border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-500'
                        }`}
                        style={active ? { background: 'linear-gradient(135deg, #fff0e0, #ffe0b0)' } : {}}>
                        <span className="text-lg">{rule.icon}</span>
                        {rule.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    { field: 'maintenanceIncluded', label: 'Maintenance Included', icon: 'ðŸ”§' },
                    { field: 'immediateJoining', label: 'Immediate Joining', icon: 'ðŸ—ï¸' },
                  ].map(({ field, label, icon }) => (
                    <div key={field} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        <span className="text-xs font-bold text-gray-700">{label}</span>
                      </div>
                      <Switch
                        checked={prop[field]}
                        onCheckedChange={(checked) => updatePropertyField(pIndex, field, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-50" />

              {/* Rating & Notes */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">â­ Intern Notes</p>

                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-700">PG Quality Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button"
                        onClick={() => updatePropertyField(pIndex, 'internRating', star)}
                        className="active:scale-110 transition-transform">
                        <Star className={`w-7 h-7 transition-colors ${star <= prop.internRating ? 'fill-orange-400 text-orange-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 flex flex-col gap-3">
                  <p className="text-sm font-bold text-gray-700">ðŸŽ™ Voice Note</p>
                  <div className="flex items-center gap-3">
                    {!prop.voiceBlob && !prop.isRecording && (
                      <button type="button" onClick={() => startRecording(pIndex)}
                        className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform"
                        style={{ background: 'linear-gradient(135deg, #FF7A00, #ff6000)' }}>
                        <Mic className="w-4 h-4" /> Record Observations
                      </button>
                    )}
                    {prop.isRecording && (
                      <button type="button" onClick={() => stopRecording(pIndex)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold animate-pulse shadow-md">
                        <Square className="w-4 h-4" /> Stop Recording
                      </button>
                    )}
                    {prop.audioUrl && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-emerald-600 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Voice Saved âœ“
                        </span>
                        <button type="button" onClick={() => updatePropertyField(pIndex, 'audioUrl', null)}
                          className="text-xs text-red-400 font-semibold bg-red-50 px-2.5 py-1 rounded-lg">
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* â”€â”€ Add Property Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <button type="button" onClick={handleAddProperty}
          className="flex items-center justify-center gap-2 w-full h-14 border-2 border-dashed border-orange-200 text-orange-500 rounded-2xl font-bold text-sm hover:bg-orange-50 transition-all bg-white active:scale-[0.98]">
          <Plus className="w-5 h-5" /> Add Another Property
        </button>

        {/* â”€â”€ Submit CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <button
          id="btn-consolidated-submit"
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl font-extrabold text-base text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #FF7A00 0%, #ff6000 100%)', boxShadow: isSubmitting ? 'none' : '0 8px 32px rgba(255, 122, 0, 0.35)' }}
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-5 h-5" /> Submit Onboarding</>
          )}
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
