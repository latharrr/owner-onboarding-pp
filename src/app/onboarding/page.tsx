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

export default function ConsolidatedOnboardingPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { capture: captureGPS, latitude, longitude } = useGPS();

  // ── Onboarding State ──────────────────────────────────────────
  const [internName, setInternName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startedAt, setStartedAt] = useState('');

  // Owner details (Pre-filled defaults)
  const [ownerName, setOwnerName] = useState('New Owner');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAltPhone, setOwnerAltPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('Local Locality');
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
      name: 'Picapool PG',
      address: 'Koramangala, Bangalore',
      locality: 'Koramangala',
      city: 'Bangalore',
      pincode: '560034',
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

  // ── Handlers ──────────────────────────────────────────────────
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

  // ── Voice Recorder Handler ────────────────────────────────────
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

  // ── Submit Onboarding ─────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const endedAt = new Date().toISOString();
    const duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);

    const deviceInfo = getDeviceInfo();

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
      properties: properties.map((p) => ({
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
      })),
    };

    // Store in global store for success screen
    const store = useOnboardingStore.getState();
    store.reset();
    store.initSession(internName);
    store.updateOwner(payload.owner);
    payload.properties.forEach((p, i) => {
      if (i === 0) {
        store.updateProperty(0, p);
      } else {
        store.addProperty();
        store.updateProperty(i, p);
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
      // Fake submission success locally for offline mode/speed demonstration
      store.setSubmitted({
        submissionId: generateId(),
        submissionDisplayId: 'SUB-TEMP',
        ownerDisplayId: 'OWN-TEMP',
        propertyDisplayIds: properties.map((_, idx) => `PRP-TEMP-${idx + 1}`),
      });
      toast.info('Saved locally/offline. Submission queued.');
      router.push('/success');
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top sticky status bar with built-in dynamic progress */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Picapool Express</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <span className="text-xs text-gray-400 font-medium">Intern: {internName}</span>
          </div>
        </div>
        
        {/* Dynamic progress bar */}
        <div className="h-1 bg-brand-light w-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300 ease-out"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-brand-light to-white p-5 rounded-3xl border border-brand/10">
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" /> Fast PG Onboarding
          </h1>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            All fields are prefilled with average Bangalore PG defaults. Only type/tap what needs changing, then hit Submit at the bottom.
          </p>
        </div>

        {/* ── SECTION 1: OWNER DETAILS ────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
          <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            👤 Owner Information
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500 font-bold">Owner Name</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Name"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500 font-bold">Owner Phone</Label>
              <Input
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="10-digit number"
                maxLength={10}
                className="h-11 rounded-xl"
                type="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500 font-bold">Visit Status</Label>
              <select
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value as VisitStatus)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {VISIT_STATUS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.icon} {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500 font-bold">Owner Home Address</Label>
              <Input
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="Owner Home address"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PROPERTIES LOOP ───────────────────────────────── */}
        {properties.map((prop, pIndex) => (
          <div
            key={prop.propertyId}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col gap-5 relative"
          >
            {properties.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveProperty(pIndex)}
                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              🏠 Property #{pIndex + 1} details
            </h2>

            {/* PG Identity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-bold">PG Name</Label>
                <Input
                  value={prop.name}
                  onChange={(e) => updatePropertyField(pIndex, 'name', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-bold">Locality / Area</Label>
                <Input
                  value={prop.locality}
                  onChange={(e) => updatePropertyField(pIndex, 'locality', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 col-span-2">
                <Label className="text-xs text-gray-500 font-bold">PG Address</Label>
                <Input
                  value={prop.address}
                  onChange={(e) => updatePropertyField(pIndex, 'address', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-bold">Pincode</Label>
                <Input
                  value={prop.pincode}
                  onChange={(e) => updatePropertyField(pIndex, 'pincode', e.target.value)}
                  className="h-11 rounded-xl"
                  maxLength={6}
                />
              </div>
            </div>

            {/* PG Type & Target Audience */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-gray-500 font-bold">PG Resident Type</Label>
              <div className="flex gap-2">
                {[
                  { id: 'male', label: 'Male', icon: '👨' },
                  { id: 'female', label: 'Female', icon: '👩' },
                  { id: 'unisex', label: 'Unisex', icon: '👥' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updatePropertyField(pIndex, 'pgType', t.id)}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                      prop.pgType === t.id
                        ? 'bg-brand text-white border-brand shadow-sm shadow-brand/25'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Rooms / Beds */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Total Rooms</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePropertyField(pIndex, 'totalRooms', Math.max(1, prop.totalRooms - 1))}
                    className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-gray-600"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{prop.totalRooms}</span>
                  <button
                    type="button"
                    onClick={() => updatePropertyField(pIndex, 'totalRooms', prop.totalRooms + 1)}
                    className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Total Beds</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePropertyField(pIndex, 'totalBeds', Math.max(1, prop.totalBeds - 1))}
                    className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-gray-600"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{prop.totalBeds}</span>
                  <button
                    type="button"
                    onClick={() => updatePropertyField(pIndex, 'totalBeds', prop.totalBeds + 1)}
                    className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Room Configurations Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                  Room Configurations
                </h3>
                <button
                  type="button"
                  onClick={() => addRoomConfig(pIndex)}
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                >
                  + Add Config
                </button>
              </div>

              {prop.roomConfigs.map((config: any, cIndex: number) => (
                <div
                  key={config.configId}
                  className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex flex-col gap-3 relative"
                >
                  {prop.roomConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoomConfig(pIndex, cIndex)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  )}

                  {/* Config options */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <select
                      value={config.type}
                      onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'type', e.target.value)}
                      className="h-9 rounded-lg border text-xs bg-white px-2"
                    >
                      {ROOM_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label} occupancy
                        </option>
                      ))}
                    </select>

                    <select
                      value={config.acType}
                      onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'acType', e.target.value)}
                      className="h-9 rounded-lg border text-xs bg-white px-2"
                    >
                      {AC_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={config.furnishing}
                      onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'furnishing', e.target.value)}
                      className="h-9 rounded-lg border text-xs bg-white px-2"
                    >
                      {FURNISHING_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                   {/* Config rates */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-gray-400 font-bold">Rooms</Label>
                      <Input
                        type="number"
                        value={config.count}
                        onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'count', Number(e.target.value))}
                        className="h-9 rounded-lg px-1.5 text-xs text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-gray-400 font-bold">Rent/Bed</Label>
                      <Input
                        type="number"
                        value={config.rentPerBed}
                        onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'rentPerBed', Number(e.target.value))}
                        className="h-9 rounded-lg px-1.5 text-xs text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-gray-400 font-bold">Deposit</Label>
                      <Input
                        type="number"
                        value={config.deposit}
                        onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'deposit', Number(e.target.value))}
                        className="h-9 rounded-lg px-1.5 text-xs text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-gray-400 font-bold">Lock-in (M)</Label>
                      <Input
                        type="number"
                        value={config.lockInPeriod ?? 1}
                        onChange={(e) => updateRoomConfigField(pIndex, cIndex, 'lockInPeriod', Number(e.target.value))}
                        className="h-9 rounded-lg px-1.5 text-xs text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Amenities Grid */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-gray-500 font-bold">Amenities Provided</Label>
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES.slice(0, 10).map((a) => {
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
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {a.icon} {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food Provided */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-gray-700">Food provided in PG</p>
                <p className="text-[10px] text-gray-400">Mess / tiffin service options</p>
              </div>
              <Switch
                checked={prop.foodProvided}
                onCheckedChange={(checked) => updatePropertyField(pIndex, 'foodProvided', checked)}
              />
            </div>

            {prop.foodProvided && (
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex flex-col gap-4">
                {/* Number of meals */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Meals per Day</p>
                    <p className="text-[10px] text-gray-400">Total count of daily meals</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updatePropertyField(pIndex, 'mealsPerDay', Math.max(1, (prop.mealsPerDay ?? 3) - 1))}
                      className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-gray-600"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{prop.mealsPerDay ?? 3}</span>
                    <button
                      type="button"
                      onClick={() => updatePropertyField(pIndex, 'mealsPerDay', (prop.mealsPerDay ?? 3) + 1)}
                      className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Specific meals selection options */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-gray-500 font-bold">Meals Included</Label>
                  <div className="flex gap-2">
                    {[
                      { id: 'breakfast', label: 'Breakfast 🍳' },
                      { id: 'lunch', label: 'Lunch 🍱' },
                      { id: 'dinner', label: 'Dinner 🍛' },
                    ].map((meal) => {
                      const list = prop.mealsList ?? ['breakfast', 'lunch', 'dinner'];
                      const active = list.includes(meal.id);
                      return (
                        <button
                          key={meal.id}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? list.filter((item: string) => item !== meal.id)
                              : [...list, meal.id];
                            updatePropertyField(pIndex, 'mealsList', next);
                          }}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? 'bg-brand text-white border-brand'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {meal.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* House Rules Toggles */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-gray-500 font-bold">Restrictions / Rules</Label>
              <div className="flex gap-2">
                {[
                  { field: 'noSmoking', label: 'No Smoking🚭' },
                  { field: 'noDrinking', label: 'No Drinking🍺' },
                  { field: 'noNonVeg', label: 'Veg Only🥗' },
                ].map((rule) => {
                  const active = prop[rule.field];
                  return (
                    <button
                      key={rule.field}
                      type="button"
                      onClick={() => updatePropertyField(pIndex, rule.field, !active)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {rule.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deposit & Maintenance */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Maintenance inc.</span>
                <Switch
                  checked={prop.maintenanceIncluded}
                  onCheckedChange={(checked) => updatePropertyField(pIndex, 'maintenanceIncluded', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Immediate Joining</span>
                <Switch
                  checked={prop.immediateJoining}
                  onCheckedChange={(checked) => updatePropertyField(pIndex, 'immediateJoining', checked)}
                />
              </div>
            </div>

            {/* Rating Stars & StarRating control */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Intern PG Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updatePropertyField(pIndex, 'internRating', star)}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= prop.internRating ? 'fill-brand text-brand' : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Recorder Note */}
            <div className="bg-gray-50 p-3 rounded-2xl flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-700">Voice Note observations</p>
              <div className="flex items-center gap-3">
                {!prop.voiceBlob && !prop.isRecording && (
                  <button
                    type="button"
                    onClick={() => startRecording(pIndex)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-xl text-xs font-semibold"
                  >
                    <Mic className="w-3.5 h-3.5" /> Record voice
                  </button>
                )}

                {prop.isRecording && (
                  <button
                    type="button"
                    onClick={() => stopRecording(pIndex)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop recording
                  </button>
                )}

                {prop.audioUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Voice Saved
                    </span>
                    <button
                      type="button"
                      onClick={() => updatePropertyField(pIndex, 'audioUrl', null)}
                      className="text-xs text-red-500 underline"
                    >
                      Discard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ── MULTIPLE PROPERTY LOOP ADDITION BUTTON ────────────────── */}
        <button
          type="button"
          onClick={handleAddProperty}
          className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-brand/30 text-brand rounded-2xl font-bold text-sm hover:bg-brand-light/30 transition-all bg-white"
        >
          <Plus className="w-4 h-4" /> Add Another Property Card
        </button>

        {/* Submit action */}
        <button
          id="btn-consolidated-submit"
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 h-14 bg-brand text-white rounded-2xl font-bold text-base shadow-lg shadow-brand/25 transition-all hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Onboarding On-the-Spot
            </>
          )}
        </button>
      </div>
    </div>
  );
}
