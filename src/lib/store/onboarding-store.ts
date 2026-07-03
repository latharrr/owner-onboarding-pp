// ============================================================
// Picapool Onboarding Store — Zustand with persistence
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId, generateSessionId } from '@/lib/utils/ids';
import { getDeviceInfo } from '@/lib/utils/device';
import type {
  OnboardingSession,
  Owner,
  Property,
  RoomConfig,
  SessionMeta,
  VisitStatus,
} from '@/types/onboarding';

// ── Default property factory ──────────────────────────────────
function createDefaultProperty(ownerId: string): Property {
  return {
    propertyId: generateId(),
    ownerId,
    name: '',
    address: '',
    locality: '',
    city: '',
    pincode: '',
    googleMapsLink: '',
    pgType: 'male',
    totalRooms: 0,
    totalBeds: 0,
    roomConfigs: [],
    amenities: [],
    foodProvided: false,
    mealType: 'none',
    mealIncluded: false,
    mealCost: undefined,
    noSmoking: false,
    noDrinking: false,
    noNonVeg: false,
    guestPolicy: 'allowed',
    lockInPeriod: 1,
    noticePeriod: 1,
    maintenanceIncluded: true,
    electricityIncluded: false,
    electricityBilling: 'metered',
    fixedElectricityAmount: undefined,
    securityDeposit: 0,
    tokenAmount: undefined,
    availableFrom: new Date().toISOString().split('T')[0],
    currentVacancies: 0,
    immediateJoining: false,
    internRating: 3,
    followUpRequired: false,
    voiceNoteKey: undefined,
    photoUrls: [],
    videoUrls: [],
    documentUrls: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Store interface ───────────────────────────────────────────
interface OnboardingStore {
  // State
  session: Partial<SessionMeta>;
  owner: Partial<Owner>;
  properties: Property[];
  currentPropertyIndex: number;
  isDraft: boolean;
  isSubmitted: boolean;
  submissionId?: string;
  submissionDisplayId?: string;
  ownerDisplayId?: string;
  propertyDisplayIds: string[];
  lastSyncedAt?: string;

  // Session actions
  initSession: (internName: string) => void;
  setGPS: (lat: number, lng: number, accuracy?: number) => void;
  endSession: () => void;

  // Owner actions
  updateOwner: (data: Partial<Owner>) => void;
  setVisitStatus: (status: VisitStatus) => void;

  // Property actions
  addProperty: () => void;
  updateProperty: (index: number, data: Partial<Property>) => void;
  setCurrentPropertyIndex: (index: number) => void;
  getCurrentProperty: () => Property | undefined;

  // Room config actions
  addRoomConfig: (propertyIndex: number, config: Omit<RoomConfig, 'configId'>) => void;
  updateRoomConfig: (propertyIndex: number, configId: string, data: Partial<RoomConfig>) => void;
  removeRoomConfig: (propertyIndex: number, configId: string) => void;

  // Submission actions
  setSubmitted: (result: {
    submissionId: string;
    submissionDisplayId: string;
    ownerDisplayId: string;
    propertyDisplayIds: string[];
  }) => void;
  setSynced: () => void;

  // Reset
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────
const initialState = {
  session: {},
  owner: { visitStatus: 'visited' as VisitStatus },
  properties: [],
  currentPropertyIndex: 0,
  isDraft: false,
  isSubmitted: false,
  submissionId: undefined,
  submissionDisplayId: undefined,
  ownerDisplayId: undefined,
  propertyDisplayIds: [],
  lastSyncedAt: undefined,
};

// ── Store ─────────────────────────────────────────────────────
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Session ──────────────────────────────────────────────
      initSession: (internName: string) => {
        const deviceInfo = getDeviceInfo();
        const now = new Date().toISOString();
        set({
          session: {
            sessionId: generateSessionId(),
            internName,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            startedAt: now,
          },
          owner: {
            ownerId: generateId(),
            visitStatus: 'visited',
          },
          isDraft: true,
        });
      },

      setGPS: (lat: number, lng: number, accuracy?: number) => {
        set((state) => ({
          session: {
            ...state.session,
            gps: {
              latitude: lat,
              longitude: lng,
              accuracy,
              capturedAt: new Date().toISOString(),
            },
          },
        }));
      },

      endSession: () => {
        const now = new Date().toISOString();
        const startedAt = get().session.startedAt;
        const duration = startedAt
          ? Math.round((new Date(now).getTime() - new Date(startedAt).getTime()) / 1000)
          : 0;
        set((state) => ({
          session: {
            ...state.session,
            endedAt: now,
            duration,
          },
        }));
      },

      // ── Owner ────────────────────────────────────────────────
      updateOwner: (data: Partial<Owner>) => {
        set((state) => ({
          owner: { ...state.owner, ...data },
        }));
      },

      setVisitStatus: (status: VisitStatus) => {
        set((state) => ({
          owner: { ...state.owner, visitStatus: status },
        }));
      },

      // ── Properties ──────────────────────────────────────────
      addProperty: () => {
        const ownerId = get().owner.ownerId ?? generateId();
        const newProp = createDefaultProperty(ownerId);
        set((state) => ({
          properties: [...state.properties, newProp],
          currentPropertyIndex: state.properties.length,
        }));
      },

      updateProperty: (index: number, data: Partial<Property>) => {
        set((state) => {
          const updated = [...state.properties];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              ...data,
              updatedAt: new Date().toISOString(),
            };
          }
          return { properties: updated };
        });
      },

      setCurrentPropertyIndex: (index: number) => {
        set({ currentPropertyIndex: index });
      },

      getCurrentProperty: () => {
        const { properties, currentPropertyIndex } = get();
        return properties[currentPropertyIndex];
      },

      // ── Room Configs ─────────────────────────────────────────
      addRoomConfig: (propertyIndex: number, config: Omit<RoomConfig, 'configId'>) => {
        const newConfig: RoomConfig = { ...config, configId: generateId() };
        set((state) => {
          const updated = [...state.properties];
          if (updated[propertyIndex]) {
            updated[propertyIndex] = {
              ...updated[propertyIndex],
              roomConfigs: [...updated[propertyIndex].roomConfigs, newConfig],
              updatedAt: new Date().toISOString(),
            };
          }
          return { properties: updated };
        });
      },

      updateRoomConfig: (propertyIndex: number, configId: string, data: Partial<RoomConfig>) => {
        set((state) => {
          const updated = [...state.properties];
          if (updated[propertyIndex]) {
            updated[propertyIndex] = {
              ...updated[propertyIndex],
              roomConfigs: updated[propertyIndex].roomConfigs.map((rc) =>
                rc.configId === configId ? { ...rc, ...data } : rc
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return { properties: updated };
        });
      },

      removeRoomConfig: (propertyIndex: number, configId: string) => {
        set((state) => {
          const updated = [...state.properties];
          if (updated[propertyIndex]) {
            updated[propertyIndex] = {
              ...updated[propertyIndex],
              roomConfigs: updated[propertyIndex].roomConfigs.filter(
                (rc) => rc.configId !== configId
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return { properties: updated };
        });
      },

      // ── Submission ───────────────────────────────────────────
      setSubmitted: (result) => {
        set({
          isSubmitted: true,
          isDraft: false,
          submissionId: result.submissionId,
          submissionDisplayId: result.submissionDisplayId,
          ownerDisplayId: result.ownerDisplayId,
          propertyDisplayIds: result.propertyDisplayIds,
          lastSyncedAt: new Date().toISOString(),
        });
      },

      setSynced: () => {
        set({ lastSyncedAt: new Date().toISOString() });
      },

      // ── Reset ────────────────────────────────────────────────
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'picapool-onboarding-v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist non-transient state
      partialize: (state) => ({
        session: state.session,
        owner: state.owner,
        properties: state.properties,
        currentPropertyIndex: state.currentPropertyIndex,
        isDraft: state.isDraft,
        isSubmitted: state.isSubmitted,
        submissionId: state.submissionId,
        submissionDisplayId: state.submissionDisplayId,
        ownerDisplayId: state.ownerDisplayId,
        propertyDisplayIds: state.propertyDisplayIds,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
