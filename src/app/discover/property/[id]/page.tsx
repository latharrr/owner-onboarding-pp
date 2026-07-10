'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  MessageCircle,
  Navigation,
  Sparkles,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import type { JoinedOwner, JoinedProperty } from '@/types/discovery';
import { formatINR, genderLabel, labelize, rentRangeLabel } from '@/lib/discover/format';
import { MarkdownLite } from '@/components/discover/MarkdownLite';

const GENDER_BADGE_STYLE: Record<string, string> = {
  female: 'bg-pink-50 text-pink-600',
  male: 'bg-blue-50 text-blue-600',
  unisex: 'bg-purple-50 text-purple-600',
};

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [property, setProperty] = useState<JoinedProperty | null>(null);
  const [owner, setOwner] = useState<JoinedOwner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/discover/property/${id}`);
        const body = await res.json();
        if (!active) return;
        if (!res.ok || !body.success) {
          setError(body.error || 'Property not found');
        } else {
          setProperty(body.data.property);
          setOwner(body.data.owner ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const askAI = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/discover/property/${id}/summary`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setSummaryError(body.error || 'AI summary unavailable');
      } else {
        setSummary(body.data.summary);
      }
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'AI summary unavailable');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-2xl">🔍</p>
        <p className="font-semibold text-gray-700">{error || 'Property not found'}</p>
        <button type="button" onClick={() => router.push('/discover')} className="text-sm text-brand font-semibold">
          ← Back to search
        </button>
      </div>
    );
  }

  const waMessage = encodeURIComponent(`Hi, I'm interested in ${property.name} (${property.displayId}) on Picapool.`);
  const waNumber = property.ownerPhone.replace(/\D/g, '').slice(-10);

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-50" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="min-w-0">
          <h1 className="font-bold text-gray-900 truncate">{property.name}</h1>
          <p className="text-[11px] text-gray-400">{property.displayId}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 flex flex-col gap-6">
        {property.photoUrls.length ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
            {property.photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={property.name} className="h-48 w-64 object-cover rounded-2xl shrink-0" />
            ))}
          </div>
        ) : (
          <div className="h-40 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${GENDER_BADGE_STYLE[property.pgType] ?? 'bg-gray-100 text-gray-600'}`}>
              {genderLabel(property.pgType)}
            </span>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {[property.locality, property.city].filter(Boolean).join(', ') || 'Location not available'}
            </p>
          </div>
          {property.internRating > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="w-4 h-4" fill="currentColor" />
              {property.internRating}/5
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-gray-900">{rentRangeLabel(property.minRent, property.maxRent)}</p>
            <p className="text-xs text-gray-400">per bed / month</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>{property.currentVacancies > 0 ? `${property.currentVacancies} vacancies` : 'Contact for vacancy'}</p>
            {property.immediateJoining && <p className="text-brand font-semibold">Immediate joining</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={`tel:${property.ownerPhone}`} className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-gray-900 text-white text-sm font-semibold">
            <Phone className="w-4 h-4" /> Call Owner
          </a>
          <a
            href={`https://wa.me/91${waNumber}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-green-50 text-green-700 text-sm font-semibold"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          {property.googleMapsLink && (
            <a
              href={property.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-500"
              aria-label="Open in Google Maps"
            >
              <Navigation className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="rounded-2xl bg-brand-light/40 border border-brand/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-brand uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Summary
            </p>
            {!summary && (
              <button type="button" onClick={askAI} disabled={summaryLoading} className="text-xs font-semibold text-brand disabled:opacity-50">
                {summaryLoading ? 'Thinking…' : 'Generate'}
              </button>
            )}
          </div>
          {summary ? (
            <MarkdownLite text={summary} />
          ) : (
            <p className="text-xs text-gray-400">Get an AI-written summary of this PG based only on the data below.</p>
          )}
          {summaryError && <p className="text-xs text-amber-600 mt-2">{summaryError}</p>}
        </div>

        <Section title="Room Configurations">
          {property.roomConfigs.length === 0 && <EmptyRow text="Not available in dataset" />}
          {property.roomConfigs.map((r) => (
            <div key={r.configId} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm">
              <span className="text-gray-700">
                {labelize(r.type)} · {r.acType === 'ac' ? 'AC' : 'Non-AC'} · {labelize(r.furnishing)}
              </span>
              <span className="font-semibold text-gray-900">{rentRangeLabel(r.rentMin, r.rentMax)}</span>
            </div>
          ))}
        </Section>

        <Section title="Amenities">
          {property.amenities.length ? (
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <span key={a} className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 text-gray-600">
                  {labelize(a)}
                </span>
              ))}
            </div>
          ) : (
            <EmptyRow text="Not available in dataset" />
          )}
        </Section>

        <Section title="Food">
          <Row label="Provided" value={property.foodProvided ? 'Yes' : 'No'} />
          {property.foodProvided && (
            <>
              <Row label="Meals / day" value={property.mealsPerDay ? String(property.mealsPerDay) : 'Not available'} />
              <Row label="Meals" value={property.mealsList.length ? property.mealsList.join(', ') : 'Not available'} />
              <Row label="Preference" value={property.mealPreference ? labelize(property.mealPreference) : 'Not available'} />
              <Row
                label="Cost"
                value={property.mealIncluded ? 'Included in rent' : property.mealCost ? `${formatINR(property.mealCost)}/month` : 'Not available'}
              />
            </>
          )}
        </Section>

        <Section title="House Rules">
          <Row label="Smoking" value={property.noSmoking ? 'Not allowed' : 'Allowed'} />
          <Row label="Drinking" value={property.noDrinking ? 'Not allowed' : 'Allowed'} />
          <Row label="Non-veg food" value={property.noNonVeg ? 'Not allowed' : 'Allowed'} />
          <Row label="Guests" value={labelize(property.guestPolicy)} />
          <Row
            label="Lock-in period"
            value={property.lockInPeriodLabel || (property.lockInPeriod ? `${property.lockInPeriod} month(s)` : 'No lock-in')}
          />
          <Row
            label="Notice period"
            value={property.noticePeriodLabel || (property.noticePeriod ? `${property.noticePeriod} month(s)` : 'None')}
          />
        </Section>

        <Section title="Financials">
          <Row label="Security deposit" value={property.securityDeposit ? formatINR(property.securityDeposit) : 'Not available'} />
          <Row label="Token amount" value={property.tokenAmount ? formatINR(property.tokenAmount) : 'Not available'} />
          <Row label="Maintenance" value={property.maintenanceIncluded ? 'Included in rent' : 'Charged separately'} />
          <Row
            label="Electricity"
            value={
              property.electricityIncluded
                ? 'Included in rent'
                : property.electricityBilling === 'fixed' && property.fixedElectricityAmount
                  ? `Fixed ${formatINR(property.fixedElectricityAmount)}/month`
                  : property.avgElectricityBillPerBed
                    ? `Metered (~${formatINR(property.avgElectricityBillPerBed)}/bed avg)`
                    : 'Metered / as per usage'
            }
          />
        </Section>

        <Section title="Availability">
          <Row label="Available from" value={property.availableFrom || 'Not available'} />
          <Row label="Current vacancies" value={String(property.currentVacancies)} />
          <Row label="Immediate joining" value={property.immediateJoining ? 'Yes' : 'No'} />
        </Section>

        <Section title="Owner Details">
          <Row label="Name" value={owner?.name || property.ownerName} />
          <Row label="Phone" value={property.ownerPhone || 'Not available'} />
          {property.ownerAltPhone && <Row label="Alternative phone" value={property.ownerAltPhone} />}
          {owner?.address && <Row label="Address" value={owner.address} />}
          {owner && <Row label="Owned properties" value={String(owner.propertyCount)} />}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm rounded-xl bg-gray-50 px-3 py-2.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-gray-300 italic">{text}</p>;
}
