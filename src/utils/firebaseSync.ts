import { doc, setDoc, onSnapshot, getDoc, getDocFromServer, db } from '../lib/firebase';
import { StorageService } from './storage';
import {
  Customer,
  Driver,
  Vehicle,
  LREntry,
  PaymentReceipt,
  ExpenseEntry,
  IncomeEntry,
  CompanySettings,
  LocationRate,
  SavedMonthlyInvoice,
  CompanyId
} from '../types';
import { DEFAULT_COMPANY_ID } from '../data/companyConfig';

export interface CloudTMSState {
  companySettings?: CompanySettings;
  customers?: Customer[];
  drivers?: Driver[];
  vehicles?: Vehicle[];
  lrEntries?: LREntry[];
  payments?: PaymentReceipt[];
  expenses?: ExpenseEntry[];
  incomes?: IncomeEntry[];
  locationRates?: LocationRate[];
  monthlyInvoices?: SavedMonthlyInvoice[];
  lastUpdated?: string;
  sourceDeviceId?: string;
  companyId?: CompanyId;
}

const SYNC_COLLECTION = 'tms_workspace';

function getSyncDocId(companyId: CompanyId = DEFAULT_COMPANY_ID): string {
  return `store_${companyId}`;
}

export const currentDeviceId =
  typeof window !== 'undefined'
    ? localStorage.getItem('tms_device_id') ||
      (() => {
        const id = 'dev_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('tms_device_id', id);
        return id;
      })()
    : 'server';

// Helper to remove any undefined or unsupported values for Firestore
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

export const FirebaseSyncService = {
  // Directly pull fresh data from server
  async fetchLatestFromCloud(companyId: CompanyId = DEFAULT_COMPANY_ID): Promise<CloudTMSState | null> {
    try {
      const docId = getSyncDocId(companyId);
      const docRef = doc(db, SYNC_COLLECTION, docId);
      const snapshot = await getDocFromServer(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudTMSState;
        return data;
      }

      // Backward compatibility check for mahaveer_logistics legacy main_company_store
      if (companyId === 'mahaveer_logistics') {
        const legacyRef = doc(db, SYNC_COLLECTION, 'main_company_store');
        const legacySnap = await getDocFromServer(legacyRef);
        if (legacySnap.exists()) {
          const legacyData = legacySnap.data() as CloudTMSState;
          // Seed the new store
          await setDoc(docRef, cleanForFirestore(legacyData), { merge: true });
          return legacyData;
        }
      }
      return null;
    } catch (e) {
      console.warn('Direct server fetch failed, trying local cache / fallback:', e);
      try {
        const docId = getSyncDocId(companyId);
        const docRef = doc(db, SYNC_COLLECTION, docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return snapshot.data() as CloudTMSState;
        }
      } catch (err) {
        console.error('Fallback fetch error:', err);
      }
      return null;
    }
  },

  // Listen to cloud updates in real-time
  subscribeToCloudUpdates(
    companyId: CompanyId = DEFAULT_COMPANY_ID,
    onRemoteChange: (data: CloudTMSState) => void,
    onStatusChange?: (status: 'connected' | 'syncing' | 'offline' | 'error', errorMsg?: string) => void
  ) {
    try {
      const docId = getSyncDocId(companyId);
      const docRef = doc(db, SYNC_COLLECTION, docId);

      // Fast initial getDoc from server for 0ms delay on mobile/laptop load
      getDocFromServer(docRef)
        .then(async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as CloudTMSState;
            onStatusChange?.('connected');
            if (data && typeof data === 'object') {
              onRemoteChange(data);
            }
          } else {
            // Check legacy store if mahaveer_logistics
            if (companyId === 'mahaveer_logistics') {
              try {
                const legacyRef = doc(db, SYNC_COLLECTION, 'main_company_store');
                const legacySnap = await getDocFromServer(legacyRef);
                if (legacySnap.exists()) {
                  const legacyData = legacySnap.data() as CloudTMSState;
                  onStatusChange?.('connected');
                  onRemoteChange(legacyData);
                  await setDoc(docRef, cleanForFirestore(legacyData), { merge: true });
                  return;
                }
              } catch (e) {}
            }

            // First time ever: initialize cloud with local data if available
            onStatusChange?.('connected');
            const localCust = StorageService.getCustomers(companyId);
            if (localCust && localCust.length > 0) {
              this.pushLocalToCloud(companyId);
            }
          }
        })
        .catch((err) => {
          console.warn('Initial server fetch note (falling back to snapshot):', err);
          getDoc(docRef).then((snap) => {
            if (snap.exists()) {
              const data = snap.data() as CloudTMSState;
              onStatusChange?.('connected');
              if (data && typeof data === 'object') {
                onRemoteChange(data);
              }
            }
          }).catch(() => {
            onStatusChange?.('offline', err?.message);
          });
        });

      // Real-time onSnapshot listener for instant multi-device live sync
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as CloudTMSState;
            onStatusChange?.('connected');
            if (data && typeof data === 'object') {
              onRemoteChange(data);
            }
          }
        },
        (error) => {
          console.warn('Firestore real-time subscription error:', error);
          onStatusChange?.('offline', error.message);
        }
      );

      return unsubscribe;
    } catch (e: any) {
      console.warn('Failed to start real-time cloud subscription:', e);
      onStatusChange?.('offline', e?.message);
      return () => {};
    }
  },

  // Push only the specific updated fields to cloud without overwriting other collections
  async pushToCloud(data: Partial<CloudTMSState>, companyId: CompanyId = DEFAULT_COMPANY_ID) {
    try {
      const docId = getSyncDocId(companyId);
      const docRef = doc(db, SYNC_COLLECTION, docId);
      
      const payload: Record<string, any> = {
        lastUpdated: new Date().toISOString(),
        sourceDeviceId: currentDeviceId,
        companyId
      };

      if (data.companySettings !== undefined) payload.companySettings = data.companySettings;
      if (data.customers !== undefined) payload.customers = data.customers;
      if (data.drivers !== undefined) payload.drivers = data.drivers;
      if (data.vehicles !== undefined) payload.vehicles = data.vehicles;
      if (data.lrEntries !== undefined) payload.lrEntries = data.lrEntries;
      if (data.payments !== undefined) payload.payments = data.payments;
      if (data.expenses !== undefined) payload.expenses = data.expenses;
      if (data.locationRates !== undefined) payload.locationRates = data.locationRates;
      if (data.monthlyInvoices !== undefined) payload.monthlyInvoices = data.monthlyInvoices;

      const sanitizedPayload = cleanForFirestore(payload);
      await setDoc(docRef, sanitizedPayload, { merge: true });

      // Also mirror to legacy store for backward compatibility if mahaveer_logistics
      if (companyId === 'mahaveer_logistics') {
        const legacyRef = doc(db, SYNC_COLLECTION, 'main_company_store');
        await setDoc(legacyRef, sanitizedPayload, { merge: true }).catch(() => {});
      }

      console.log(`✅ [${companyId}] Successfully synced to Firestore cloud at`, new Date().toLocaleTimeString());
    } catch (err) {
      console.error(`❌ [${companyId}] Error syncing to Firestore cloud:`, err);
    }
  },

  // Force push all local storage data to cloud for this company
  async pushLocalToCloud(companyId: CompanyId = DEFAULT_COMPANY_ID) {
    return this.pushToCloud({
      companySettings: StorageService.getCompanySettings(companyId),
      customers: StorageService.getCustomers(companyId),
      drivers: StorageService.getDrivers(companyId),
      vehicles: StorageService.getVehicles(companyId),
      lrEntries: StorageService.getLREntries(companyId),
      payments: StorageService.getPayments(companyId),
      expenses: StorageService.getExpenses(companyId),
      locationRates: StorageService.getLocationRates(companyId),
      monthlyInvoices: StorageService.getMonthlyInvoices(companyId)
    }, companyId);
  }
};
