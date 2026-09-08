import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CustomerMaster } from './components/CustomerMaster';
import { DriverMaster } from './components/DriverMaster';
import { VehicleMaster } from './components/VehicleMaster';
import { LREntryList } from './components/LREntryList';
import { LRFormModal } from './components/LRFormModal';
import { BiltyModal } from './components/BiltyModal';
import { PaymentModal } from './components/PaymentModal';
import { ReportsView } from './components/ReportsView';
import { BackupModal } from './components/BackupModal';
import { TrackingModal } from './components/TrackingModal';
import { MonthlyTaxInvoiceModal } from './components/MonthlyTaxInvoiceModal';
import { LocationRateMaster } from './components/LocationRateMaster';
import { LiveTrackingView } from './components/LiveTrackingView';
import { LoginPage } from './components/LoginPage';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { ProfitLossView } from './components/ProfitLossView';
import { DriverTrackingView } from './components/DriverTrackingView';

import { StorageService } from './utils/storage';
import { FirebaseSyncService, CloudTMSState } from './utils/firebaseSync';
import { AuthService } from './utils/auth';
import { PermissionsService } from './utils/permissions';
import {
  Customer,
  Driver,
  Vehicle,
  LREntry,
  PaymentReceipt,
  ExpenseEntry,
  IncomeEntry,
  CompanySettings,
  LRStatus,
  LocationRate,
  SavedMonthlyInvoice,
  AuthSession,
  CompanyId
} from './types';
import { DEFAULT_COMPANY_ID } from './data/companyConfig';

export default function App() {
  // Authentication & Company Session State
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(() =>
    AuthService.getCurrentSession()
  );
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activeCompanyId: CompanyId = currentSession?.companyId || DEFAULT_COMPANY_ID;

  // Core Transport State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() =>
    StorageService.getCompanySettings(activeCompanyId)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    StorageService.getCustomers(activeCompanyId)
  );
  const [drivers, setDrivers] = useState<Driver[]>(() =>
    StorageService.getDrivers(activeCompanyId)
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    StorageService.getVehicles(activeCompanyId)
  );
  const [lrEntries, setLREntries] = useState<LREntry[]>(() =>
    StorageService.getLREntries(activeCompanyId)
  );
  const [payments, setPayments] = useState<PaymentReceipt[]>(() =>
    StorageService.getPayments(activeCompanyId)
  );
  const [locationRates, setLocationRates] = useState<LocationRate[]>(() =>
    StorageService.getLocationRates(activeCompanyId)
  );
  const [monthlyInvoices, setMonthlyInvoices] = useState<SavedMonthlyInvoice[]>(() =>
    StorageService.getMonthlyInvoices(activeCompanyId)
  );
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() =>
    StorageService.getExpenses(activeCompanyId)
  );
  const [incomes, setIncomes] = useState<IncomeEntry[]>(() =>
    StorageService.getIncomes(activeCompanyId)
  );
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

  // Function to load all dataset for a specific company
  const loadCompanyData = useCallback((companyId: CompanyId) => {
    const cs = StorageService.getCompanySettings(companyId);
    const c = StorageService.getCustomers(companyId);
    const d = StorageService.getDrivers(companyId);
    const v = StorageService.getVehicles(companyId);
    const l = StorageService.getLREntries(companyId);
    const p = StorageService.getPayments(companyId);
    const r = StorageService.getLocationRates(companyId);
    const m = StorageService.getMonthlyInvoices(companyId);
    const e = StorageService.getExpenses(companyId);
    const inc = StorageService.getIncomes(companyId);

    setCompanySettings(cs);
    setCustomers(c);
    setDrivers(d);
    setVehicles(v);
    setLREntries(l);
    setPayments(p);
    setLocationRates(r);
    setMonthlyInvoices(m);
    setExpenses(e);
    setIncomes(inc);
  }, []);

  // When session changes or company changes, reload company-isolated data
  useEffect(() => {
    if (currentSession?.companyId) {
      loadCompanyData(currentSession.companyId);
    }
    // Automatically redirect to allowed tab if role changes or is restricted
    if (currentSession?.role && !PermissionsService.isTabAllowed(activeTab, currentSession.role)) {
      const allowedTabs = PermissionsService.getAllowedTabs(currentSession.role);
      if (allowedTabs.length > 0) {
        setActiveTab(allowedTabs[0] as TabType);
      }
    }
  }, [currentSession?.companyId, currentSession?.role, loadCompanyData]);

  // Handle immediate force sync from Cloud Firestore
  const handleForceCloudSync = async () => {
    if (!currentSession?.companyId) return;
    const cid = currentSession.companyId;
    setIsCloudSyncing(true);
    try {
      const cloudData = await FirebaseSyncService.fetchLatestFromCloud(cid);
      if (cloudData) {
        if (cloudData.companySettings) {
          setCompanySettings(cloudData.companySettings);
          StorageService.saveCompanySettings(cloudData.companySettings, cid);
        }
        if (cloudData.customers && Array.isArray(cloudData.customers)) {
          setCustomers(cloudData.customers);
          StorageService.saveCustomers(cloudData.customers, cid);
        }
        if (cloudData.drivers && Array.isArray(cloudData.drivers)) {
          setDrivers(cloudData.drivers);
          StorageService.saveDrivers(cloudData.drivers, cid);
        }
        if (cloudData.vehicles && Array.isArray(cloudData.vehicles)) {
          setVehicles(cloudData.vehicles);
          StorageService.saveVehicles(cloudData.vehicles, cid);
        }
        if (cloudData.lrEntries && Array.isArray(cloudData.lrEntries)) {
          setLREntries(cloudData.lrEntries);
          StorageService.saveLREntries(cloudData.lrEntries, cid);
        }
        if (cloudData.payments && Array.isArray(cloudData.payments)) {
          setPayments(cloudData.payments);
          StorageService.savePayments(cloudData.payments, cid);
        }
        if (cloudData.locationRates && Array.isArray(cloudData.locationRates)) {
          setLocationRates(cloudData.locationRates);
          StorageService.saveLocationRates(cloudData.locationRates, cid);
        }
        if (cloudData.monthlyInvoices && Array.isArray(cloudData.monthlyInvoices)) {
          const cleanedInvoices = cloudData.monthlyInvoices.filter(
            (inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54'
          );
          setMonthlyInvoices(cleanedInvoices);
          StorageService.saveMonthlyInvoices(cleanedInvoices, cid);
          if (cleanedInvoices.length !== cloudData.monthlyInvoices.length) {
            FirebaseSyncService.pushToCloud({ monthlyInvoices: cleanedInvoices }, cid);
          }
        }
        if (cloudData.expenses && Array.isArray(cloudData.expenses)) {
          setExpenses(cloudData.expenses);
          StorageService.saveExpenses(cloudData.expenses, cid);
        }
        if (cloudData.incomes && Array.isArray(cloudData.incomes)) {
          setIncomes(cloudData.incomes);
          StorageService.saveIncomes(cloudData.incomes, cid);
        }
        setLastSyncedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setCloudSyncStatus('connected');
      }
    } catch (err) {
      console.error('Manual force sync error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Listen to Firestore real-time cloud changes across all devices for this active company
  useEffect(() => {
    if (!currentSession?.companyId) return;
    const cid = currentSession.companyId;

    const unsubscribe = FirebaseSyncService.subscribeToCloudUpdates(
      cid,
      (cloudData: CloudTMSState) => {
        if (cloudData) {
          if (cloudData.companySettings) {
            setCompanySettings(cloudData.companySettings);
            StorageService.saveCompanySettings(cloudData.companySettings, cid);
          }
          if (cloudData.customers && Array.isArray(cloudData.customers)) {
            setCustomers(cloudData.customers);
            StorageService.saveCustomers(cloudData.customers, cid);
          }
          if (cloudData.drivers && Array.isArray(cloudData.drivers)) {
            setDrivers(cloudData.drivers);
            StorageService.saveDrivers(cloudData.drivers, cid);
          }
          if (cloudData.vehicles && Array.isArray(cloudData.vehicles)) {
            setVehicles(cloudData.vehicles);
            StorageService.saveVehicles(cloudData.vehicles, cid);
          }
          if (cloudData.lrEntries && Array.isArray(cloudData.lrEntries)) {
            setLREntries(cloudData.lrEntries);
            StorageService.saveLREntries(cloudData.lrEntries, cid);
          }
          if (cloudData.payments && Array.isArray(cloudData.payments)) {
            setPayments(cloudData.payments);
            StorageService.savePayments(cloudData.payments, cid);
          }
          if (cloudData.locationRates && Array.isArray(cloudData.locationRates)) {
            setLocationRates(cloudData.locationRates);
            StorageService.saveLocationRates(cloudData.locationRates, cid);
          }
          if (cloudData.monthlyInvoices && Array.isArray(cloudData.monthlyInvoices)) {
            const cleanedInvoices = cloudData.monthlyInvoices.filter(
              (inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54'
            );
            setMonthlyInvoices(cleanedInvoices);
            StorageService.saveMonthlyInvoices(cleanedInvoices, cid);
            if (cleanedInvoices.length !== cloudData.monthlyInvoices.length) {
              FirebaseSyncService.pushToCloud({ monthlyInvoices: cleanedInvoices }, cid);
            }
          }
          if (cloudData.expenses && Array.isArray(cloudData.expenses)) {
            setExpenses(cloudData.expenses);
            StorageService.saveExpenses(cloudData.expenses, cid);
          }
          if (cloudData.incomes && Array.isArray(cloudData.incomes)) {
            setIncomes(cloudData.incomes);
            StorageService.saveIncomes(cloudData.incomes, cid);
          }
          setLastSyncedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      },
      (status) => {
        if (status === 'connected' || status === 'syncing' || status === 'offline') {
          setCloudSyncStatus(status);
        }
      }
    );

    return () => unsubscribe();
  }, [currentSession?.companyId]);

  // Modal Control States
  const [isLRFormOpen, setIsLRFormOpen] = useState(false);
  const [editingLR, setEditingLR] = useState<LREntry | null>(null);

  const [isBiltyOpen, setIsBiltyOpen] = useState(false);
  const [selectedBiltyLR, setSelectedBiltyLR] = useState<LREntry | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPaymentLR, setSelectedPaymentLR] = useState<LREntry | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentReceipt | null>(null);

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingInitialNo, setTrackingInitialNo] = useState('');

  const [isMonthlyInvoiceOpen, setIsMonthlyInvoiceOpen] = useState(false);
  const [monthlyInvoicePartyId, setMonthlyInvoicePartyId] = useState('');

  // Auto-open live tracking modal when tracking tab is selected from sidebar
  useEffect(() => {
    if (activeTab === 'tracking') {
      setIsTrackingOpen(true);
    }
  }, [activeTab]);

  // Sync state to local storage and Cloud Firestore automatically
  const refreshFromStorage = () => {
    const cid = activeCompanyId;
    const cs = StorageService.getCompanySettings(cid);
    const c = StorageService.getCustomers(cid);
    const d = StorageService.getDrivers(cid);
    const v = StorageService.getVehicles(cid);
    const l = StorageService.getLREntries(cid);
    const p = StorageService.getPayments(cid);
    const r = StorageService.getLocationRates(cid);
    setCompanySettings(cs);
    setCustomers(c);
    setDrivers(d);
    setVehicles(v);
    setLREntries(l);
    setPayments(p);
    setLocationRates(r);
    FirebaseSyncService.pushLocalToCloud(cid);
  };

  const handleSaveLocationRate = (rate: LocationRate) => {
    const cid = activeCompanyId;
    const existingIndex = locationRates.findIndex((r) => r.id === rate.id);
    let updated: LocationRate[];
    if (existingIndex >= 0) {
      updated = [...locationRates];
      updated[existingIndex] = rate;
    } else {
      updated = [rate, ...locationRates];
    }
    setLocationRates(updated);
    StorageService.saveLocationRates(updated, cid);
    FirebaseSyncService.pushToCloud({ locationRates: updated }, cid);
  };

  const handleDeleteLocationRate = (id: string) => {
    if (confirm('Are you sure you want to delete this location route rate?')) {
      const cid = activeCompanyId;
      const updated = locationRates.filter((r) => r.id !== id);
      setLocationRates(updated);
      StorageService.saveLocationRates(updated, cid);
      FirebaseSyncService.pushToCloud({ locationRates: updated }, cid);
    }
  };

  // LR Entry Handlers
  const handleSaveLR = (lr: LREntry) => {
    const cid = activeCompanyId;
    const existingIndex = lrEntries.findIndex((item) => item.id === lr.id);
    let updated: LREntry[];
    if (existingIndex >= 0) {
      updated = [...lrEntries];
      updated[existingIndex] = lr;
    } else {
      updated = [lr, ...lrEntries];
    }
    setLREntries(updated);
    StorageService.saveLREntries(updated, cid);
    FirebaseSyncService.pushToCloud({ lrEntries: updated }, cid);
  };

  const handleDeleteLR = (id: string) => {
    if (confirm('Are you sure you want to delete this LR Booking entry?')) {
      const cid = activeCompanyId;
      const updated = lrEntries.filter((l) => l.id !== id);
      setLREntries(updated);
      StorageService.saveLREntries(updated, cid);
      FirebaseSyncService.pushToCloud({ lrEntries: updated }, cid);
    }
  };

  const handleUpdateLRStatus = (id: string, status: LRStatus) => {
    const cid = activeCompanyId;
    const updated = lrEntries.map((l) => (l.id === id ? { ...l, status } : l));
    setLREntries(updated);
    StorageService.saveLREntries(updated, cid);
    FirebaseSyncService.pushToCloud({ lrEntries: updated }, cid);
  };

  // Customer Handlers
  const handleSaveCustomer = (cust: Customer) => {
    const cid = activeCompanyId;
    const index = customers.findIndex((c) => c.id === cust.id);
    let updated: Customer[];
    if (index >= 0) {
      updated = [...customers];
      updated[index] = cust;
    } else {
      updated = [cust, ...customers];
    }
    setCustomers(updated);
    StorageService.saveCustomers(updated, cid);
    FirebaseSyncService.pushToCloud({ customers: updated }, cid);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Delete this customer record?')) {
      const cid = activeCompanyId;
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      StorageService.saveCustomers(updated, cid);
      FirebaseSyncService.pushToCloud({ customers: updated }, cid);
    }
  };

  const handleDeleteMonthlyInvoice = (id: string) => {
    const cid = activeCompanyId;
    const updated = monthlyInvoices.filter((inv) => inv.id !== id);
    setMonthlyInvoices(updated);
    StorageService.saveMonthlyInvoices(updated, cid);
    FirebaseSyncService.pushToCloud({ monthlyInvoices: updated }, cid);
  };

  // Driver Handlers
  const handleSaveDriver = (drv: Driver) => {
    const cid = activeCompanyId;
    const index = drivers.findIndex((d) => d.id === drv.id);
    let updated: Driver[];
    if (index >= 0) {
      updated = [...drivers];
      updated[index] = drv;
    } else {
      updated = [drv, ...drivers];
    }
    setDrivers(updated);
    StorageService.saveDrivers(updated, cid);
    FirebaseSyncService.pushToCloud({ drivers: updated }, cid);
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm('Delete this driver record?')) {
      const cid = activeCompanyId;
      const updated = drivers.filter((d) => d.id !== id);
      setDrivers(updated);
      StorageService.saveDrivers(updated, cid);
      FirebaseSyncService.pushToCloud({ drivers: updated }, cid);
    }
  };

  // Vehicle Handlers
  const handleSaveVehicle = (veh: Vehicle) => {
    const cid = activeCompanyId;
    const index = vehicles.findIndex((v) => v.id === veh.id);
    let updated: Vehicle[];
    if (index >= 0) {
      updated = [...vehicles];
      updated[index] = veh;
    } else {
      updated = [veh, ...vehicles];
    }
    setVehicles(updated);
    StorageService.saveVehicles(updated, cid);
    FirebaseSyncService.pushToCloud({ vehicles: updated }, cid);
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm('Delete this vehicle record?')) {
      const cid = activeCompanyId;
      const updated = vehicles.filter((v) => v.id !== id);
      setVehicles(updated);
      StorageService.saveVehicles(updated, cid);
      FirebaseSyncService.pushToCloud({ vehicles: updated }, cid);
    }
  };

  // Payment Handlers
  const handleSavePayment = (payment: PaymentReceipt) => {
    const cid = activeCompanyId;
    const index = payments.findIndex((p) => p.id === payment.id);
    let updated: PaymentReceipt[];
    if (index >= 0) {
      updated = [...payments];
      updated[index] = payment;
    } else {
      updated = [payment, ...payments];
    }
    setPayments(updated);
    StorageService.savePayments(updated, cid);
    FirebaseSyncService.pushToCloud({ payments: updated }, cid);

    // If payment is linked to a specific LR, update LR advance and balance
    if (payment.lrId || payment.lrNumber) {
      const updatedLRs = lrEntries.map((l) => {
        if (l.id === payment.lrId || (payment.lrNumber && l.lrNumber === payment.lrNumber)) {
          // Calculate all additional payments for this LR from the new payments array
          const totalPaidForLR = updated
            .filter((p) => p.lrId === l.id || (p.lrNumber && p.lrNumber === l.lrNumber))
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          
          const bookingAdvance = Number(l.advance) || 0;
          const totalReceived = bookingAdvance + totalPaidForLR;
          const freight = Number(l.freight) || 0;
          const newBalance = Math.max(0, freight - totalReceived);

          return {
            ...l,
            balance: newBalance
          };
        }
        return l;
      });

      setLREntries(updatedLRs);
      StorageService.saveLREntries(updatedLRs, cid);
      FirebaseSyncService.pushToCloud({ lrEntries: updatedLRs }, cid);
    }
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('Delete this payment transaction?')) {
      const cid = activeCompanyId;
      const targetPayment = payments.find((p) => p.id === id);
      const updated = payments.filter((p) => p.id !== id);
      setPayments(updated);
      StorageService.savePayments(updated, cid);
      FirebaseSyncService.pushToCloud({ payments: updated }, cid);

      if (targetPayment?.lrId || targetPayment?.lrNumber) {
        const updatedLRs = lrEntries.map((l) => {
          if (l.id === targetPayment.lrId || (targetPayment.lrNumber && l.lrNumber === targetPayment.lrNumber)) {
            const totalPaidForLR = updated
              .filter((p) => p.lrId === l.id || (p.lrNumber && p.lrNumber === l.lrNumber))
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            const bookingAdvance = Number(l.advance) || 0;
            const totalReceived = bookingAdvance + totalPaidForLR;
            const freight = Number(l.freight) || 0;
            const newBalance = Math.max(0, freight - totalReceived);

            return {
              ...l,
              balance: newBalance
            };
          }
          return l;
        });

        setLREntries(updatedLRs);
        StorageService.saveLREntries(updatedLRs, cid);
        FirebaseSyncService.pushToCloud({ lrEntries: updatedLRs }, cid);
      }
    }
  };

  const handleSaveExpense = (saved: ExpenseEntry) => {
    const cid = activeCompanyId;
    const updated = StorageService.saveExpense(saved, cid);
    setExpenses(updated);
    FirebaseSyncService.pushToCloud({ expenses: updated }, cid);
  };

  const handleDeleteExpense = (id: string) => {
    const cid = activeCompanyId;
    const updated = StorageService.deleteExpense(id, cid);
    setExpenses(updated);
    FirebaseSyncService.pushToCloud({ expenses: updated }, cid);
  };

  const handleSaveIncome = (saved: IncomeEntry) => {
    const cid = activeCompanyId;
    const updated = StorageService.saveIncome(saved, cid);
    setIncomes(updated);
    FirebaseSyncService.pushToCloud({ incomes: updated }, cid);
  };

  const handleDeleteIncome = (id: string) => {
    const cid = activeCompanyId;
    const updated = StorageService.deleteIncome(id, cid);
    setIncomes(updated);
    FirebaseSyncService.pushToCloud({ incomes: updated }, cid);
  };

  const handleSaveSettings = (settings: CompanySettings) => {
    const cid = activeCompanyId;
    setCompanySettings(settings);
    StorageService.saveCompanySettings(settings, cid);
    FirebaseSyncService.pushToCloud({ companySettings: settings }, cid);
  };

  // Modal Triggers
  const handleOpenNewLR = () => {
    setEditingLR(null);
    setIsLRFormOpen(true);
  };

  const handleEditLR = (lr: LREntry) => {
    setEditingLR(lr);
    setIsLRFormOpen(true);
  };

  const handleOpenBilty = (lr: LREntry) => {
    setSelectedBiltyLR(lr);
    setIsBiltyOpen(true);
  };

  const handleOpenPayment = (lr?: LREntry, payment?: PaymentReceipt) => {
    setSelectedPaymentLR(lr || null);
    setEditingPayment(payment || null);
    setIsPaymentOpen(true);
  };

  const handleOpenMonthlyInvoice = (partyId: string) => {
    setMonthlyInvoicePartyId(partyId);
    setIsMonthlyInvoiceOpen(true);
  };

  // Logout Handler
  const handleLogout = () => {
    AuthService.logout();
    setCurrentSession(null);
    setActiveTab('dashboard');
  };

  // Login Success Handler
  const handleLoginSuccess = (session: AuthSession) => {
    setCurrentSession(session);
    loadCompanyData(session.companyId);
    setActiveTab('dashboard');
  };

  // Calculations for Badges and Statistics
  const runningLREntries = lrEntries.filter((l) => l.status === 'In Transit').length;
  const expiringDrivers = drivers.filter((d) => {
    if (!d.licenceExpiry) return false;
    const diff = (new Date(d.licenceExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diff <= 30 && diff >= 0;
  }).length;

  // Check if this is a Driver Live Tracking link opened via WhatsApp/SMS link
  const urlParams = new URLSearchParams(window.location.search);
  const driverTrackToken = urlParams.get('driver_track') || urlParams.get('driverTrack');
  const lrParam = urlParams.get('lr') || '';
  const vehParam = urlParams.get('veh') || '';

  if (driverTrackToken) {
    return (
      <DriverTrackingView
        token={driverTrackToken}
        lrNumberParam={lrParam}
        vehicleNumberParam={vehParam}
        lrEntries={lrEntries}
        onExit={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  // If user is not authenticated, render Login Page as the First Page
  if (!currentSession) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        companySettings={companySettings}
        lrEntries={lrEntries}
        onOpenNewLR={handleOpenNewLR}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenBilty={handleOpenBilty}
        onOpenTrackingModal={(trackNo) => {
          setTrackingInitialNo(trackNo);
          setIsTrackingOpen(true);
        }}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        cloudSyncStatus={cloudSyncStatus}
        onForceCloudSync={handleForceCloudSync}
        isCloudSyncing={isCloudSyncing}
        lastSyncedTime={lastSyncedTime}
        currentSession={currentSession}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Body with Sidebar + Active View */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lrCount={lrEntries.length}
          runningCount={runningLREntries}
          expiringCount={expiringDrivers}
          currentSession={currentSession}
          onOpenAdminSettings={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-70px)]">
          {activeTab === 'dashboard' && (
            <Dashboard
              lrEntries={lrEntries}
              customers={customers}
              drivers={drivers}
              vehicles={vehicles}
              payments={payments}
              currentSession={currentSession}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewLR={handleOpenNewLR}
              onOpenTracking={(lr) => {
                setTrackingInitialNo(lr.lrNumber || lr.trackingNumber || '');
                setIsTrackingOpen(true);
              }}
              onOpenTrackingModal={(trackNo) => {
                setTrackingInitialNo(trackNo);
                setIsTrackingOpen(true);
              }}
              onOpenBilty={handleOpenBilty}
              onOpenPayment={handleOpenPayment}
            />
          )}

          {activeTab === 'lr_entry' && (
            <LREntryList
              lrEntries={lrEntries}
              searchTerm={searchTerm}
              onOpenNewLR={handleOpenNewLR}
              onEditLR={handleEditLR}
              onDeleteLR={handleDeleteLR}
              onOpenBilty={handleOpenBilty}
              onOpenPayment={handleOpenPayment}
              onUpdateStatus={handleUpdateLRStatus}
              onOpenTrackingModal={(trackNo) => {
                setTrackingInitialNo(trackNo);
                setIsTrackingOpen(true);
              }}
              onOpenTracking={(lr) => {
                setTrackingInitialNo(lr.lrNumber || lr.trackingNumber || '');
                setIsTrackingOpen(true);
              }}
            />
          )}

          {activeTab === 'tracking' && (
            <LiveTrackingView
              lrEntries={lrEntries}
              onUpdateLREntry={handleSaveLR}
              onOpenBilty={handleOpenBilty}
              onOpenPayment={handleOpenPayment}
              initialTrackingNo={trackingInitialNo}
            />
          )}

          {activeTab === 'location_rates' && (
            <LocationRateMaster
              locationRates={locationRates}
              rates={locationRates}
              onSaveRate={handleSaveLocationRate}
              onDeleteRate={handleDeleteLocationRate}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerMaster
              customers={customers}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              lrEntries={lrEntries}
              payments={payments}
              monthlyInvoices={monthlyInvoices}
              onOpenMonthlyInvoice={handleOpenMonthlyInvoice}
              onDeleteMonthlyInvoice={handleDeleteMonthlyInvoice}
            />
          )}

          {activeTab === 'drivers' && (
            <DriverMaster
              drivers={drivers}
              vehicles={vehicles}
              onSaveDriver={handleSaveDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehicleMaster
              vehicles={vehicles}
              drivers={drivers}
              onSaveVehicle={handleSaveVehicle}
              onDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Payment Collections & Receipts</h2>
                  <p className="text-xs text-slate-400">Record payments received from customers / consignors</p>
                </div>
                <button
                  onClick={() => handleOpenPayment()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  <span>+ Record Payment</span>
                </button>
              </div>

              {/* Payments List Table */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Receipt ID</th>
                        <th className="p-3">Party Name</th>
                        <th className="p-3">LR / Bilty No</th>
                        <th className="p-3">Mode & Ref</th>
                        <th className="p-3 text-right">Amount Received</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-slate-500">
                            No payment receipts recorded yet. Click '+ Record Payment' above.
                          </td>
                        </tr>
                      ) : (
                        payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-medium text-slate-200">{pay.paymentDate}</td>
                            <td className="p-3 font-mono text-xs text-indigo-400">{pay.id}</td>
                            <td className="p-3 font-semibold text-white">{pay.customerName}</td>
                            <td className="p-3 font-mono text-slate-300">
                              {pay.lrNumber || (pay.monthlyInvoiceNo ? `Bill: ${pay.monthlyInvoiceNo}` : 'Direct Account Payment')}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                                {pay.paymentMode}
                              </span>
                              {pay.referenceNo && (
                                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{pay.referenceNo}</div>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-400 text-sm sm:text-base">
                              ₹{pay.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenPayment(undefined, pay)}
                                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                                  title="Edit Payment"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(pay.id)}
                                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                  title="Delete Payment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profit_loss' && (
            <ProfitLossView
              currentCompanyId={activeCompanyId}
              companyName={companySettings.companyName}
              lrEntries={lrEntries}
              payments={payments}
              expenses={expenses}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              incomes={incomes}
              onSaveIncome={handleSaveIncome}
              onDeleteIncome={handleDeleteIncome}
              vehicles={vehicles}
              drivers={drivers}
              customers={customers}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              lrEntries={lrEntries}
              customers={customers}
              drivers={drivers}
              vehicles={vehicles}
              payments={payments}
              onOpenBilty={handleOpenBilty}
              onOpenPayment={handleOpenPayment}
              onOpenTracking={(lr) => {
                setTrackingInitialNo(lr.lrNumber || lr.trackingNumber || '');
                setIsTrackingOpen(true);
              }}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenMonthlyInvoice={handleOpenMonthlyInvoice}
            />
          )}

          {activeTab === 'backup' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Live Cloud Backup & Multi-Device Sync</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  All your data for <b className="text-indigo-400">{companySettings.companyName}</b> is securely saved locally in your browser and mirrored in real-time to Google Cloud Firestore.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
                  <h3 className="font-semibold text-white text-sm">Download Local Backup (JSON)</h3>
                  <p className="text-xs text-slate-300">
                    Export an offline copy of all LRs, Customers, Drivers, Vehicles, and Invoices.
                  </p>
                  <button
                    onClick={() => StorageService.downloadBackupJSON(activeCompanyId)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Download Backup File
                  </button>
                </div>

                <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
                  <h3 className="font-semibold text-white text-sm">Force Cloud Re-sync</h3>
                  <p className="text-xs text-slate-300">
                    Fetch the freshest data stored on Cloud Firestore for this unit.
                  </p>
                  <button
                    onClick={handleForceCloudSync}
                    disabled={isCloudSyncing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {isCloudSyncing ? 'Syncing...' : 'Sync Cloud Now'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsBackupOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Open Company & Print Settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LRFormModal
        isOpen={isLRFormOpen}
        onClose={() => setIsLRFormOpen(false)}
        onSaveLR={handleSaveLR}
        onSaveCustomer={handleSaveCustomer}
        editingLR={editingLR}
        customers={customers}
        drivers={drivers}
        vehicles={vehicles}
        existingLRs={lrEntries}
        locationRates={locationRates}
      />

      <BiltyModal
        lr={isBiltyOpen ? selectedBiltyLR : null}
        onClose={() => {
          setIsBiltyOpen(false);
          setSelectedBiltyLR(null);
        }}
        company={companySettings}
        onOpenTrackingModal={(trackNo) => {
          setTrackingInitialNo(trackNo);
          setIsTrackingOpen(true);
        }}
      />

      <MonthlyTaxInvoiceModal
        isOpen={isMonthlyInvoiceOpen}
        onClose={() => setIsMonthlyInvoiceOpen(false)}
        lrEntries={lrEntries}
        customers={customers}
        company={companySettings}
        initialPartyId={monthlyInvoicePartyId}
        onSaveMonthlyInvoice={(savedInv) => {
          const list = StorageService.getMonthlyInvoices(activeCompanyId);
          setMonthlyInvoices(list);
          FirebaseSyncService.pushToCloud({ monthlyInvoices: list }, activeCompanyId);
        }}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setEditingPayment(null);
        }}
        onSavePayment={handleSavePayment}
        selectedLR={selectedPaymentLR}
        editingPayment={editingPayment}
        allLRs={lrEntries}
        customers={customers}
        monthlyInvoices={monthlyInvoices}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        companySettings={companySettings}
        onSaveSettings={handleSaveSettings}
        onRefreshData={refreshFromStorage}
      />

      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        lrEntries={lrEntries}
        initialTrackingNo={trackingInitialNo}
        onUpdateLREntry={handleSaveLR}
      />

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        currentSession={currentSession}
        onLogout={handleLogout}
      />

      {/* User & Company Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentSession={currentSession}
        companySettings={companySettings}
        onSaveCompanySettings={handleSaveSettings}
        onSessionUpdated={(updatedSession) => {
          setCurrentSession(updatedSession);
        }}
        onLogout={handleLogout}
      />

      {/* Global Print Footer Styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, sidebar, button, nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
