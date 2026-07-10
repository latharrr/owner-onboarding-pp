// ============================================================
// AI PG Discovery — Data join + cache layer
// ============================================================
// The spreadsheet (via Apps Script) is the only source of truth.
// This module joins Owners -> Properties -> RoomConfigurations into
// the shape the rest of the app consumes, and caches the joined
// result in-memory for a short TTL so every search doesn't re-hit
// Apps Script (which has its own rate limits).

import { fetchAllDiscoveryData } from '@/lib/apps-script/client';
import type {
  DiscoveryDataset,
  JoinedOwner,
  JoinedProperty,
  JoinedRoomConfig,
  RawOwnerRow,
  RawPropertyRow,
  RawRoomConfigRow,
} from '@/types/discovery';

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

let cache: { data: DiscoveryDataset; expiresAt: number } | null = null;
let inFlight: Promise<DiscoveryDataset> | null = null;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
}

function splitList(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinRoomConfig(row: RawRoomConfigRow): JoinedRoomConfig {
  const rentPerBed = toNumber(row.rentPerBed);
  const rentMin = toNumber(row.rentMin, rentPerBed);
  const rentMax = toNumber(row.rentMax, rentPerBed);
  return {
    configId: row.configId,
    type: (row.type || 'single').toString().toLowerCase(),
    acType: (row.acType || 'non_ac').toString().toLowerCase(),
    furnishing: (row.furnishing || 'unfurnished').toString().toLowerCase(),
    count: toNumber(row.count, 1),
    rentPerBed,
    rentMin: rentMin || rentPerBed,
    rentMax: rentMax || rentPerBed,
    deposit: toNumber(row.deposit),
    lockInPeriod: toNumber(row.lockInPeriod),
  };
}

function joinProperty(
  row: RawPropertyRow,
  rooms: JoinedRoomConfig[],
  owner: RawOwnerRow | undefined
): JoinedProperty {
  const rentFloors = rooms.map((r) => r.rentMin).filter((n) => n > 0);
  const rentCeils = rooms.map((r) => r.rentMax).filter((n) => n > 0);

  return {
    propertyId: row.propertyId,
    displayId: row.displayId,
    ownerId: row.ownerId,
    ownerDisplayId: row.ownerDisplayId,

    name: row.name || 'Unnamed PG',
    address: row.address || '',
    locality: row.locality || '',
    city: row.city || '',
    pincode: row.pincode || '',
    googleMapsLink: row.googleMapsLink || undefined,

    pgType: (row.pgType || 'unisex').toString().toLowerCase(),

    totalRooms: toNumber(row.totalRooms),
    totalBeds: toNumber(row.totalBeds),
    roomConfigs: rooms,

    amenities: splitList(row.amenities),

    foodProvided: toBool(row.foodProvided),
    foodProvision: row.foodProvision || undefined,
    mealsPerDay: toNumber(row.mealsPerDay),
    mealsList: splitList(row.mealsList),
    mealType: (row.mealType || 'none').toString().toLowerCase(),
    mealIncluded: toBool(row.mealIncluded),
    mealCost: toNumber(row.mealCost),
    mealPreference: row.mealPreference || undefined,

    noSmoking: toBool(row.noSmoking),
    noDrinking: toBool(row.noDrinking),
    noNonVeg: toBool(row.noNonVeg),
    guestPolicy: (row.guestPolicy || 'allowed').toString().toLowerCase(),
    lockInPeriod: toNumber(row.lockInPeriod),
    noticePeriod: toNumber(row.noticePeriod),
    lockInPeriodLabel: row.lockInPeriodLabel || undefined,
    noticePeriodLabel: row.noticePeriodLabel || undefined,

    maintenanceIncluded: toBool(row.maintenanceIncluded),
    electricityIncluded: toBool(row.electricityIncluded),
    electricityBilling: (row.electricityBilling || 'metered').toString().toLowerCase(),
    fixedElectricityAmount: toNumber(row.fixedElectricityAmount),
    electricityMeterType: row.electricityMeterType || undefined,
    avgElectricityBillPerBed: toNumber(row.avgElectricityBillPerBed),
    securityDeposit: toNumber(row.securityDeposit),
    tokenAmount: toNumber(row.tokenAmount),

    availableFrom: row.availableFrom || '',
    currentVacancies: toNumber(row.currentVacancies),
    immediateJoining: toBool(row.immediateJoining),

    internRating: toNumber(row.internRating),

    photoUrls: splitList(row.photoUrls),
    videoUrls: splitList(row.videoUrls),
    documentUrls: splitList(row.documentUrls),

    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',

    ownerName: owner?.name || 'Owner',
    ownerPhone: owner?.phone || '',
    ownerAltPhone: owner?.altPhone || undefined,

    minRent: rentFloors.length ? Math.min(...rentFloors) : 0,
    maxRent: rentCeils.length ? Math.max(...rentCeils) : 0,
  };
}

function joinOwner(row: RawOwnerRow, properties: JoinedProperty[]): JoinedOwner {
  const owned = properties.filter((p) => p.ownerId === row.ownerId);
  return {
    ownerId: row.ownerId,
    displayId: row.displayId,
    name: row.name,
    phone: row.phone,
    altPhone: row.altPhone || undefined,
    address: row.address || undefined,
    visitStatus: row.visitStatus || undefined,
    propertyDisplayIds: owned.map((p) => p.displayId),
    propertyCount: owned.length,
  };
}

async function buildDataset(): Promise<DiscoveryDataset> {
  const raw = await fetchAllDiscoveryData();

  const ownersById = new Map(raw.owners.map((o) => [o.ownerId, o]));
  const roomsByPropertyId = new Map<string, JoinedRoomConfig[]>();
  for (const row of raw.roomConfigs) {
    const list = roomsByPropertyId.get(row.propertyId) ?? [];
    list.push(joinRoomConfig(row));
    roomsByPropertyId.set(row.propertyId, list);
  }

  const properties = raw.properties.map((row) =>
    joinProperty(row, roomsByPropertyId.get(row.propertyId) ?? [], ownersById.get(row.ownerId))
  );

  const owners = raw.owners.map((row) => joinOwner(row, properties));

  return { owners, properties, fetchedAt: raw.fetchedAt };
}

/**
 * Returns the joined Owner -> Property -> RoomConfig dataset, cached
 * for CACHE_TTL_MS. Pass forceRefresh to bypass the cache (e.g. an
 * explicit "Refresh data" action).
 */
export async function getDiscoveryData(options?: { forceRefresh?: boolean }): Promise<DiscoveryDataset> {
  const now = Date.now();

  if (!options?.forceRefresh && cache && cache.expiresAt > now) {
    return cache.data;
  }

  // Coalesce concurrent requests into a single Apps Script call.
  if (!inFlight) {
    inFlight = buildDataset()
      .then((data) => {
        cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}
