'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Mic,
  Square,
  Star,
  Check,
  Sparkles,
  MapPin,
} from 'lucide-react';

import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useGPS } from '@/lib/hooks/useGPS';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { getDeviceInfo } from '@/lib/utils/device';
import { generateId, generateSessionId } from '@/lib/utils/ids';
import { AMENITIES } from '@/lib/constants/amenities';
import { ROOM_TYPES, AC_TYPES, FURNISHING_TYPES } from '@/lib/constants/roomTypes';
import { VISIT_STATUS_OPTIONS } from '@/lib/constants/visitStatus';
import type { VisitStatus } from '@/types/onboarding';
import { Switch } from '@/components/ui/switch';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/* ── Reusable field components ─────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{children}</p>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 my-1" />;
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function ConsolidatedOnboardingPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { capture: captureGPS, latitude, longitude, status: gpsStatus, error: gpsError } = useGPS();

  const [internName, setInternName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startedAt, setStartedAt] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAltPhone, setOwnerAltPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');

  const [properties, setProperties] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('picapool-intern-name') || 'Field Intern';
    setInternName(storedName);
    setSessionId(generateSessionId());
    setStartedAt(new Date().toISOString());
    captureGPS();
    setProperties([createDefaultPropertyState()]);
  }, []);

  useEffect(() => {
    if (!latitude || !longitude) return;
    const reverseGeocode = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'User-Agent': 'PicapoolOnboarding/1.0 (onboarding@picapool.com)' } }
        );
        const data = await res.json();
        if (data?.address) {
          const addr = data.address;
          const displayAddr = data.display_name || '';
          const derivedLocality = addr.suburb || addr.neighbourhood || addr.road || 'Local Locality';
          const derivedCity = addr.city || addr.town || addr.village || 'Bangalore';
          const derivedPincode = addr.postcode || '560034';
          setOwnerAddress(displayAddr);
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
      } catch {
        setProperties((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[0] = { ...updated[0], googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}` };
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

  const handleAddProperty = () => {
    setProperties([...properties, createDefaultPropertyState()]);
    toast.success('Added another property card');
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
      { configId: generateId(), type: 'single', acType: 'non_ac', furnishing: 'semi_furnished', count: 5, rentPerBed: 8000, deposit: 8000, lockInPeriod: 1 },
    ];
    setProperties(updated);
  };

  const removeRoomConfig = (propIndex: number, configIndex: number) => {
    const updated = [...properties];
    if (updated[propIndex].roomConfigs.length === 1) return;
    updated[propIndex].roomConfigs = updated[propIndex].roomConfigs.filter((_: any, i: number) => i !== configIndex);
    setProperties(updated);
  };

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const endedAt = new Date().toISOString();
    const duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    const deviceInfo = getDeviceInfo();

    const processedProperties = await Promise.all(
      properties.map(async (p) => {
        let voiceNoteBase64 = '';
        if (p.voiceBlob) {
          try { voiceNoteBase64 = await blobToBase64(p.voiceBlob); } catch { /* ignore */ }
        }
        return {
          propertyId: p.propertyId, ownerId: '',
          name: p.name || 'Picapool PG', address: p.address || 'Local Locality',
          locality: p.locality || 'Locality', city: p.city || 'Bangalore',
          pincode: p.pincode || '560034', googleMapsLink: p.googleMapsLink || '',
          pgType: p.pgType, totalRooms: p.totalRooms, totalBeds: p.totalBeds,
          roomConfigs: p.roomConfigs, amenities: p.amenities,
          foodProvided: p.foodProvided, mealsPerDay: p.mealsPerDay || 3,
          mealsList: p.mealsList || ['breakfast', 'lunch', 'dinner'],
          mealType: p.mealType, mealIncluded: p.mealIncluded, mealCost: p.mealCost,
          noSmoking: p.noSmoking, noDrinking: p.noDrinking, noNonVeg: p.noNonVeg,
          guestPolicy: p.guestPolicy, lockInPeriod: p.lockInPeriod, noticePeriod: p.noticePeriod,
          maintenanceIncluded: p.maintenanceIncluded, electricityIncluded: p.electricityIncluded,
          electricityBilling: p.electricityBilling, fixedElectricityAmount: p.fixedElectricityAmount,
          securityDeposit: p.securityDeposit, tokenAmount: p.tokenAmount,
          availableFrom: p.availableFrom, currentVacancies: p.currentVacancies,
          immediateJoining: p.immediateJoining, internRating: p.internRating,
          followUpRequired: p.followUpRequired, voiceNoteBase64,
        };
      })
    );

    const payload = {
      session: { sessionId, internName, deviceType: deviceInfo.deviceType, browser: deviceInfo.browser, gps: latitude ? { latitude, longitude, capturedAt: new Date().toISOString() } : undefined, startedAt, endedAt, duration },
      owner: { ownerId: generateId(), name: ownerName || 'New Owner', phone: ownerPhone || '9999999999', altPhone: ownerAltPhone || undefined, email: ownerEmail || undefined, address: ownerAddress || 'Local Address', visitStatus },
      properties: processedProperties,
    };

    const store = useOnboardingStore.getState();
    store.reset();
    store.initSession(internName);
    store.updateOwner(payload.owner);
    payload.properties.forEach((p, i) => {
      const storeProp = { ...p, voiceNoteBase64: undefined };
      if (i === 0) { store.updateProperty(0, storeProp); }
      else { store.addProperty(); store.updateProperty(i, storeProp); }
    });

    try {
      const res = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
      if (isOnline) {
        toast.error(`Submission Error: ${msg}`);
      } else {
        store.setSubmitted({ submissionId: generateId(), submissionDisplayId: 'SUB-TEMP', ownerDisplayId: 'OWN-TEMP', propertyDisplayIds: properties.map((_, idx) => `PRP-TEMP-${idx + 1}`) });
        toast.info('Saved offline. Will sync when online.');
        router.push('/success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Picapool</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">{internName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isOnline ? 'bg-gray-100 text-gray-600' : 'bg-gray-900 text-white'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">{getProgress()}%</span>
          </div>
        </div>
        <div className="h-px bg-gray-100 w-full">
          <div className="h-px bg-gray-900 transition-all duration-500" style={{ width: `${getProgress()}%` }} />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 pt-6 flex flex-col gap-6">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PG Onboarding</h1>
          <p className="text-sm text-gray-400 mt-1">GPS auto-fills location. Fill what you know, then submit.</p>
          {gpsStatus === 'capturing' && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Capturing location...
            </p>
          )}
          {gpsStatus === 'captured' && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Location captured
            </p>
          )}
          {(gpsStatus === 'denied' || gpsStatus === 'unavailable') && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5" title={gpsError}>
              <MapPin className="w-3 h-3" /> Location unavailable - fill address manually
            </p>
          )}
        </div>

        {/* Owner Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Owner</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <TextInput value={ownerName} onChange={setOwnerName} placeholder="Full name" />
            </Field>
            <Field label="Phone">
              <TextInput value={ownerPhone} onChange={setOwnerPhone} placeholder="10-digit number" type="tel" inputMode="numeric" maxLength={10} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Visit Status">
              <select
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value as VisitStatus)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
              >
                {VISIT_STATUS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Alt. Phone (optional)">
              <TextInput value={ownerAltPhone} onChange={setOwnerAltPhone} placeholder="Optional" type="tel" inputMode="numeric" maxLength={10} />
            </Field>
          </div>
        </div>

        <Divider />

        {/* Properties */}
        {properties.map((prop, pIndex) => (
          <div key={prop.propertyId} className="flex flex-col gap-5">
            {/* Property header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                Property {properties.length > 1 ? `#${pIndex + 1}` : ''}
              </h2>
              {properties.length > 1 && (
                <button type="button" onClick={() => handleRemoveProperty(pIndex)}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Location */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Location</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field label="PG Name">
                  <TextInput value={prop.name} onChange={(v) => updatePropertyField(pIndex, 'name', v)} placeholder="e.g. Sunrise PG" />
                </Field>
                <Field label="Locality">
                  <TextInput value={prop.locality} onChange={(v) => updatePropertyField(pIndex, 'locality', v)} placeholder="e.g. Koramangala" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Address">
                    <TextInput value={prop.address} onChange={(v) => updatePropertyField(pIndex, 'address', v)} placeholder="Street, landmark" />
                  </Field>
                </div>
                <Field label="Pincode">
                  <TextInput value={prop.pincode} onChange={(v) => updatePropertyField(pIndex, 'pincode', v)} placeholder="560001" maxLength={6} inputMode="numeric" />
                </Field>
              </div>
            </div>

            {/* Resident Type */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Resident Type</SectionLabel>
              <div className="flex gap-2">
                {[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                  { id: 'unisex', label: 'Unisex' },
                ].map((t) => (
                  <button key={t.id} type="button"
                    onClick={() => updatePropertyField(pIndex, 'pgType', t.id)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${prop.pgType === t.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Capacity</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'totalRooms', label: 'Total Rooms' },
                  { field: 'totalBeds', label: 'Total Beds' },
                ].map(({ field, label }) => (
                  <div key={field} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-gray-600">{label}</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => updatePropertyField(pIndex, field, Math.max(1, prop[field] - 1))}
                        className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 font-semibold text-base hover:bg-gray-50 transition-colors">
                        -
                      </button>
                      <span className="text-sm font-bold text-gray-900 w-6 text-center">{prop[field]}</span>
                      <button type="button" onClick={() => updatePropertyField(pIndex, field, prop[field] + 1)}
                        className="w-7 h-7 rounded-md bg-gray-900 border border-gray-900 flex items-center justify-center text-white font-semibold text-base transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Configs */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <SectionLabel>Room Configurations</SectionLabel>
                <button type="button" onClick={() => addRoomConfig(pIndex)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> Add type
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {prop.roomConfigs.map((config: any, cIndex: number) => (
                  <div key={config.configId} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3 relative">
                    {prop.roomConfigs.length > 1 && (
                      <button type="button" onClick={() => removeRoomConfig(pIndex, cIndex)}
                        className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-400 text-xs transition-colors">
                        Remove
                      </button>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: config.type, options: ROOM_TYPES, field: 'type', label: 'Occupancy' },
                        { value: config.acType, options: AC_TYPES, field: 'acType', label: 'AC' },
                        { value: config.furnishing, options: FURNISHING_TYPES, field: 'furnishing', label: 'Furnishing' },
                      ].map(({ value, options, field, label }) => (
                        <div key={field} className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
                          <select value={value} onChange={(e) => updateRoomConfigField(pIndex, cIndex, field, e.target.value)}
                            className="h-8 rounded-md border border-gray-200 text-xs bg-white px-1.5 text-gray-800 focus:outline-none focus:border-gray-900">
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
                        { field: 'lockInPeriod', label: 'Lock-in (mo)', value: config.lockInPeriod ?? 1 },
                      ].map(({ field, label, value }) => (
                        <div key={field} className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
                          <input type="number" value={value}
                            onChange={(e) => updateRoomConfigField(pIndex, cIndex, field, Number(e.target.value))}
                            className="h-8 rounded-md border border-gray-200 px-1.5 text-xs text-center font-semibold bg-white text-gray-900 focus:outline-none focus:border-gray-900" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Amenities</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES.map((a) => {
                  const selected = prop.amenities.includes(a.id);
                  return (
                    <button key={a.id} type="button"
                      onClick={() => {
                        const next = selected ? prop.amenities.filter((x: string) => x !== a.id) : [...prop.amenities, a.id];
                        updatePropertyField(pIndex, 'amenities', next);
                      }}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${selected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Food</SectionLabel>
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Food Provided</p>
                  <p className="text-xs text-gray-400">Mess or tiffin service</p>
                </div>
                <Switch checked={prop.foodProvided} onCheckedChange={(v) => updatePropertyField(pIndex, 'foodProvided', v)} />
              </div>
              {prop.foodProvided && (
                <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Meals per day</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => updatePropertyField(pIndex, 'mealsPerDay', Math.max(1, (prop.mealsPerDay ?? 3) - 1))}
                        className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center font-semibold text-gray-600 hover:bg-gray-50">-</button>
                      <span className="text-sm font-bold text-gray-900 w-4 text-center">{prop.mealsPerDay ?? 3}</span>
                      <button type="button" onClick={() => updatePropertyField(pIndex, 'mealsPerDay', (prop.mealsPerDay ?? 3) + 1)}
                        className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center font-semibold text-white">+</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: 'breakfast', label: 'Breakfast' },
                      { id: 'lunch', label: 'Lunch' },
                      { id: 'dinner', label: 'Dinner' },
                    ].map((meal) => {
                      const list = prop.mealsList ?? ['breakfast', 'lunch', 'dinner'];
                      const active = list.includes(meal.id);
                      return (
                        <button key={meal.id} type="button"
                          onClick={() => {
                            const next = active ? list.filter((x: string) => x !== meal.id) : [...list, meal.id];
                            updatePropertyField(pIndex, 'mealsList', next);
                          }}
                          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                          {meal.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Rules</SectionLabel>
              <div className="flex gap-2">
                {[
                  { field: 'noSmoking', label: 'No Smoking' },
                  { field: 'noDrinking', label: 'No Drinking' },
                  { field: 'noNonVeg', label: 'Veg Only' },
                ].map((rule) => (
                  <button key={rule.field} type="button"
                    onClick={() => updatePropertyField(pIndex, rule.field, !prop[rule.field])}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${prop[rule.field] ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {rule.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { field: 'maintenanceIncluded', label: 'Maintenance Included' },
                  { field: 'immediateJoining', label: 'Immediate Joining' },
                ].map(({ field, label }) => (
                  <div key={field} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <Switch checked={prop[field]} onCheckedChange={(v) => updatePropertyField(pIndex, field, v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Intern Rating</SectionLabel>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => updatePropertyField(pIndex, 'internRating', star)}>
                    <Star className={`w-6 h-6 transition-colors ${star <= prop.internRating ? 'fill-gray-900 text-gray-900' : 'text-gray-200'}`} />
                  </button>
                ))}
                <span className="text-xs text-gray-400 ml-1">({prop.internRating}/5)</span>
              </div>
            </div>

            {/* Voice Note */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Voice Note</SectionLabel>
              <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                {!prop.voiceBlob && !prop.isRecording && (
                  <button type="button" onClick={() => startRecording(pIndex)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors">
                    <Mic className="w-3.5 h-3.5" /> Record
                  </button>
                )}
                {prop.isRecording && (
                  <button type="button" onClick={() => stopRecording(pIndex)}
                    className="flex items-center gap-2 px-4 py-2 border border-red-400 text-red-500 rounded-lg text-xs font-semibold animate-pulse">
                    <Square className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
                {prop.audioUrl && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-green-500" /> Voice saved
                    </span>
                    <button type="button" onClick={() => updatePropertyField(pIndex, 'audioUrl', null)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors">Discard</button>
                  </div>
                )}
                {!prop.voiceBlob && !prop.isRecording && !prop.audioUrl && (
                  <p className="text-xs text-gray-400">Record field observations</p>
                )}
              </div>
            </div>

            {pIndex < properties.length - 1 && <Divider />}
          </div>
        ))}

        {/* Add Property */}
        <button type="button" onClick={handleAddProperty}
          className="flex items-center justify-center gap-2 w-full h-11 border border-dashed border-gray-300 text-gray-500 rounded-lg text-sm font-medium hover:border-gray-900 hover:text-gray-900 transition-all bg-white">
          <Plus className="w-4 h-4" /> Add another property
        </button>

        {/* Submit */}
        <button
          id="btn-consolidated-submit"
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 h-12 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Onboarding</>
          )}
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
