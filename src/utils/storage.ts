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
  SystemBackup,
  SavedMonthlyInvoice,
  CompanyId
} from '../types';
import {
  initialCompanySettings,
  initialCustomers,
  initialDrivers,
  initialVehicles,
  initialLREntries,
  initialPayments,
  initialExpenses,
  initialIncomes,
  initialLocationRates,
  initialMonthlyInvoices
} from '../data/initialData';
import { COMPANY_CONFIGS, DEFAULT_COMPANY_ID } from '../data/companyConfig';

// Helper to determine active company ID from active session or fallback
function getEffectiveCompanyId(providedId?: CompanyId): CompanyId {
  if (providedId) return providedId;
  try {
    const sessionStr = sessionStorage.getItem('tms_auth_session_v1') || localStorage.getItem('tms_auth_session_v1');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      if (parsed && parsed.companyId) {
        return parsed.companyId as CompanyId;
      }
    }
  } catch (e) {}
  return DEFAULT_COMPANY_ID;
}

// Helper to construct company-isolated storage keys
function getCompanyStorageKey(baseKey: string, companyId?: CompanyId): string {
  const effectiveId = getEffectiveCompanyId(companyId);
  return `${baseKey}_${effectiveId}`;
}

const BASE_STORAGE_KEYS = {
  CUSTOMERS: 'tms_customers_v1',
  DRIVERS: 'tms_drivers_v1',
  VEHICLES: 'tms_vehicles_v1',
  LR_ENTRIES: 'tms_lr_entries_v1',
  PAYMENTS: 'tms_payments_v1',
  EXPENSES: 'tms_expenses_v1',
  INCOMES: 'tms_incomes_v1',
  INCOME_HEADS: 'tms_income_heads_v1',
  EXPENSE_HEADS: 'tms_expense_heads_v1',
  LOCATION_RATES: 'tms_location_rates_v1',
  MONTHLY_INVOICES: 'tms_monthly_invoices_v1',
  SETTINGS: 'tms_settings_v1',
  LAST_BACKUP_TIME: 'tms_last_backup_time_v1'
};

// Helper for safe JSON reading with company isolation and backwards compatibility
function getCompanyItem<T>(baseKey: string, companyId?: CompanyId, defaultValue?: T): T {
  const effectiveId = getEffectiveCompanyId(companyId);
  try {
    // 1. Try company-specific key first
    const companyKey = getCompanyStorageKey(baseKey, effectiveId);
    const companyData = localStorage.getItem(companyKey);
    if (companyData !== null && companyData !== undefined) {
      return JSON.parse(companyData) as T;
    }

    // 2. If mahaveer_logistics and not yet copied to company key, fallback to legacy base key
    if (effectiveId === 'mahaveer_logistics') {
      const legacyData = localStorage.getItem(baseKey);
      if (legacyData !== null && legacyData !== undefined) {
        const parsed = JSON.parse(legacyData) as T;
        // Migrate to company-specific key
        localStorage.setItem(companyKey, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Error loading key ${baseKey} for ${effectiveId} from storage:`, e);
  }
  return defaultValue as T;
}

// Helper for safe JSON writing with company isolation
function setCompanyItem<T>(baseKey: string, companyId: CompanyId | undefined, value: T): void {
  const effectiveId = getEffectiveCompanyId(companyId);
  try {
    const companyKey = getCompanyStorageKey(baseKey, effectiveId);
    localStorage.setItem(companyKey, JSON.stringify(value));
    localStorage.setItem(`${BASE_STORAGE_KEYS.LAST_BACKUP_TIME}_${effectiveId}`, new Date().toISOString());

    // Keep legacy key in sync if mahaveer_logistics for full backward compatibility
    if (effectiveId === 'mahaveer_logistics') {
      localStorage.setItem(baseKey, JSON.stringify(value));
    }
  } catch (e) {
    console.error(`Error saving key ${baseKey} for ${effectiveId} to storage:`, e);
  }
}

export const StorageService = {
  getCompanySettings(companyId?: CompanyId): CompanySettings {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultSettings = COMPANY_CONFIGS[effectiveId]?.settings || initialCompanySettings;
    return getCompanyItem<CompanySettings>(BASE_STORAGE_KEYS.SETTINGS, effectiveId, defaultSettings);
  },

  saveCompanySettings(settings: CompanySettings, companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.SETTINGS, companyId, settings);
  },

  getCustomers(companyId?: CompanyId): Customer[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    return getCompanyItem<Customer[]>(BASE_STORAGE_KEYS.CUSTOMERS, effectiveId, []);
  },

  saveCustomers(customers: Customer[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.CUSTOMERS, companyId, customers);
  },

  saveCustomer(customer: Customer, companyId?: CompanyId): Customer[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const list = this.getCustomers(effectiveId);
    const idx = list.findIndex((c) => c.id === customer.id || c.name.toLowerCase().trim() === customer.name.toLowerCase().trim());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...customer };
    } else {
      list.unshift(customer);
    }
    this.saveCustomers(list, effectiveId);
    return list;
  },

  getDrivers(companyId?: CompanyId): Driver[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultDrivers = effectiveId === 'mahaveer_logistics' ? initialDrivers : [];
    return getCompanyItem<Driver[]>(BASE_STORAGE_KEYS.DRIVERS, effectiveId, defaultDrivers);
  },

  saveDrivers(drivers: Driver[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.DRIVERS, companyId, drivers);
  },

  getVehicles(companyId?: CompanyId): Vehicle[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultVehicles = effectiveId === 'mahaveer_logistics' ? initialVehicles : [];
    return getCompanyItem<Vehicle[]>(BASE_STORAGE_KEYS.VEHICLES, effectiveId, defaultVehicles);
  },

  saveVehicles(vehicles: Vehicle[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.VEHICLES, companyId, vehicles);
  },

  getLREntries(companyId?: CompanyId): LREntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultLR = effectiveId === 'mahaveer_logistics' ? initialLREntries : [];
    return getCompanyItem<LREntry[]>(BASE_STORAGE_KEYS.LR_ENTRIES, effectiveId, defaultLR);
  },

  saveLREntries(entries: LREntry[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.LR_ENTRIES, companyId, entries);
  },

  getPayments(companyId?: CompanyId): PaymentReceipt[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultPayments = effectiveId === 'mahaveer_logistics' ? initialPayments : [];
    return getCompanyItem<PaymentReceipt[]>(BASE_STORAGE_KEYS.PAYMENTS, effectiveId, defaultPayments);
  },

  savePayments(payments: PaymentReceipt[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.PAYMENTS, companyId, payments);
  },

  getExpenses(companyId?: CompanyId): ExpenseEntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultExpenses = effectiveId === 'mahaveer_logistics' ? initialExpenses : [];
    return getCompanyItem<ExpenseEntry[]>(BASE_STORAGE_KEYS.EXPENSES, effectiveId, defaultExpenses);
  },

  saveExpenses(expenses: ExpenseEntry[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.EXPENSES, companyId, expenses);
  },

  saveExpense(expense: ExpenseEntry, companyId?: CompanyId): ExpenseEntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const list = this.getExpenses(effectiveId);
    const idx = list.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
    } else {
      list.unshift(expense);
    }
    this.saveExpenses(list, effectiveId);
    return list;
  },

  deleteExpense(id: string, companyId?: CompanyId): ExpenseEntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const list = this.getExpenses(effectiveId).filter((e) => e.id !== id);
    this.saveExpenses(list, effectiveId);
    return list;
  },

  getIncomes(companyId?: CompanyId): IncomeEntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultIncomes = effectiveId === 'mahaveer_logistics' ? initialIncomes : [];
    return getCompanyItem<IncomeEntry[]>(BASE_STORAGE_KEYS.INCOMES, effectiveId, defaultIncomes);
  },

  saveIncomes(incomes: IncomeEntry[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.INCOMES, companyId, incomes);
  },

  saveIncome(income: IncomeEntry, companyId?: CompanyId): IncomeEntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const list = this.getIncomes(effectiveId);
    const idx = list.findIndex((i) => i.id === income.id);
    if (idx >= 0) {
      list[idx] = income;
    } else {
      list.unshift(income);
    }
    this.saveIncomes(list, effectiveId);
    return list;
  },

  deleteIncome(id: string, companyId?: CompanyId): IncomeEntry[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const list = this.getIncomes(effectiveId).filter((i) => i.id !== id);
    this.saveIncomes(list, effectiveId);
    return list;
  },

  getIncomeHeads(companyId?: CompanyId): string[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    return getCompanyItem<string[]>(BASE_STORAGE_KEYS.INCOME_HEADS, effectiveId, []);
  },

  saveIncomeHeads(heads: string[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.INCOME_HEADS, companyId, heads);
  },

  getExpenseHeads(companyId?: CompanyId): string[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    return getCompanyItem<string[]>(BASE_STORAGE_KEYS.EXPENSE_HEADS, effectiveId, []);
  },

  saveExpenseHeads(heads: string[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.EXPENSE_HEADS, companyId, heads);
  },

  getLocationRates(companyId?: CompanyId): LocationRate[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    return getCompanyItem<LocationRate[]>(BASE_STORAGE_KEYS.LOCATION_RATES, effectiveId, initialLocationRates);
  },

  saveLocationRates(rates: LocationRate[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.LOCATION_RATES, companyId, rates);
  },

  getMonthlyInvoices(companyId?: CompanyId): SavedMonthlyInvoice[] {
    const effectiveId = getEffectiveCompanyId(companyId);
    const defaultInvoices = effectiveId === 'mahaveer_logistics' ? initialMonthlyInvoices : [];
    const list = getCompanyItem<SavedMonthlyInvoice[]>(BASE_STORAGE_KEYS.MONTHLY_INVOICES, effectiveId, defaultInvoices);
    
    // Remove legacy dummy test invoice
    const filtered = list.filter(
      (inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54'
    );
    if (filtered.length !== list.length) {
      this.saveMonthlyInvoices(filtered, effectiveId);
    }
    return filtered;
  },

  saveMonthlyInvoices(invoices: SavedMonthlyInvoice[], companyId?: CompanyId): void {
    setCompanyItem(BASE_STORAGE_KEYS.MONTHLY_INVOICES, companyId, invoices);
  },

  saveOrUpdateMonthlyInvoice(invoice: SavedMonthlyInvoice, companyId?: CompanyId): void {
    const effectiveId = getEffectiveCompanyId(companyId);
    const list = this.getMonthlyInvoices(effectiveId);
    const idx = list.findIndex((i) => i.id === invoice.id || i.invoiceNo === invoice.invoiceNo);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...invoice };
    } else {
      list.unshift(invoice);
    }
    this.saveMonthlyInvoices(list, effectiveId);
  },

  calculateCustomerOutstanding(customerId: string, customerName: string, companyId?: CompanyId): number {
    const effectiveId = getEffectiveCompanyId(companyId);
    const lrs = this.getLREntries(effectiveId);
    const payments = this.getPayments(effectiveId);
    
    const partyLRs = lrs.filter(
      (lr) => (lr.partyId && lr.partyId === customerId) || lr.partyName.toLowerCase().trim() === customerName.toLowerCase().trim()
    );

    if (partyLRs.length === 0) {
      return 0;
    }
    
    const totalFreight = partyLRs.reduce((acc, lr) => acc + (lr.freight || 0), 0);
    const totalAdvance = partyLRs.reduce((acc, lr) => acc + (lr.advance || 0), 0);
    
    const partyLRIds = new Set(partyLRs.map((l) => l.id));
    const partyLRNos = new Set(partyLRs.map((l) => l.lrNumber.trim()));

    const partyPayments = payments.filter(
      (p) =>
        (p.customerName && p.customerName.toLowerCase().trim() === customerName.toLowerCase().trim()) ||
        (p.lrId && partyLRIds.has(p.lrId)) ||
        (p.lrNumber && partyLRNos.has(p.lrNumber.trim()))
    );
    const totalPaid = partyPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return Math.max(0, totalFreight - (totalAdvance + totalPaid));
  },

  getLastBackupTime(companyId?: CompanyId): string | null {
    const effectiveId = getEffectiveCompanyId(companyId);
    return localStorage.getItem(`${BASE_STORAGE_KEYS.LAST_BACKUP_TIME}_${effectiveId}`) || localStorage.getItem(BASE_STORAGE_KEYS.LAST_BACKUP_TIME);
  },

  exportFullBackup(companyId?: CompanyId): SystemBackup {
    const effectiveId = getEffectiveCompanyId(companyId);
    const backupData: SystemBackup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      customers: this.getCustomers(effectiveId),
      drivers: this.getDrivers(effectiveId),
      vehicles: this.getVehicles(effectiveId),
      lrEntries: this.getLREntries(effectiveId),
      payments: this.getPayments(effectiveId),
      expenses: this.getExpenses(effectiveId),
      incomes: this.getIncomes(effectiveId),
      incomeHeads: this.getIncomeHeads(effectiveId),
      expenseHeads: this.getExpenseHeads(effectiveId),
      locationRates: this.getLocationRates(effectiveId),
      settings: this.getCompanySettings(effectiveId)
    };
    return backupData;
  },

  downloadBackupJSON(companyId?: CompanyId): void {
    const effectiveId = getEffectiveCompanyId(companyId);
    const backup = this.exportFullBackup(effectiveId);
    const companyNameClean = (COMPANY_CONFIGS[effectiveId]?.displayName || 'Transport').replace(/\s+/g, '_');
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `${companyNameClean}_TMS_Backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  restoreBackupJSON(backup: any, companyId?: CompanyId): boolean {
    const effectiveId = getEffectiveCompanyId(companyId);
    try {
      if (!backup) return false;
      if (backup.settings || backup.companySettings) this.saveCompanySettings(backup.settings || backup.companySettings, effectiveId);
      if (backup.customers && Array.isArray(backup.customers)) this.saveCustomers(backup.customers, effectiveId);
      if (backup.drivers && Array.isArray(backup.drivers)) this.saveDrivers(backup.drivers, effectiveId);
      if (backup.vehicles && Array.isArray(backup.vehicles)) this.saveVehicles(backup.vehicles, effectiveId);
      if (backup.lrEntries && Array.isArray(backup.lrEntries)) this.saveLREntries(backup.lrEntries, effectiveId);
      if (backup.payments && Array.isArray(backup.payments)) this.savePayments(backup.payments, effectiveId);
      if (backup.expenses && Array.isArray(backup.expenses)) this.saveExpenses(backup.expenses, effectiveId);
      if (backup.incomes && Array.isArray(backup.incomes)) this.saveIncomes(backup.incomes, effectiveId);
      if (backup.incomeHeads && Array.isArray(backup.incomeHeads)) this.saveIncomeHeads(backup.incomeHeads, effectiveId);
      if (backup.expenseHeads && Array.isArray(backup.expenseHeads)) this.saveExpenseHeads(backup.expenseHeads, effectiveId);
      if (backup.locationRates && Array.isArray(backup.locationRates)) this.saveLocationRates(backup.locationRates, effectiveId);
      if (backup.monthlyInvoices && Array.isArray(backup.monthlyInvoices)) this.saveMonthlyInvoices(backup.monthlyInvoices, effectiveId);
      return true;
    } catch (e) {
      console.error('Failed to restore backup JSON:', e);
      return false;
    }
  },

  resetToDemoData(companyId?: CompanyId): void {
    const effectiveId = getEffectiveCompanyId(companyId);
    const config = COMPANY_CONFIGS[effectiveId];
    this.saveCompanySettings(config?.settings || initialCompanySettings, effectiveId);
    this.saveCustomers(effectiveId === 'mahaveer_logistics' ? initialCustomers : [], effectiveId);
    this.saveDrivers(effectiveId === 'mahaveer_logistics' ? initialDrivers : [], effectiveId);
    this.saveVehicles(effectiveId === 'mahaveer_logistics' ? initialVehicles : [], effectiveId);
    this.saveLREntries(effectiveId === 'mahaveer_logistics' ? initialLREntries : [], effectiveId);
    this.savePayments(effectiveId === 'mahaveer_logistics' ? initialPayments : [], effectiveId);
    this.saveExpenses(effectiveId === 'mahaveer_logistics' ? initialExpenses : [], effectiveId);
    this.saveIncomes(effectiveId === 'mahaveer_logistics' ? initialIncomes : [], effectiveId);
    this.saveLocationRates(initialLocationRates, effectiveId);
    this.saveMonthlyInvoices(initialMonthlyInvoices, effectiveId);
  }
};
