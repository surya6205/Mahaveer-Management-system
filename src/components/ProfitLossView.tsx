import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  IndianRupee,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Truck,
  Fuel,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  LREntry,
  PaymentReceipt,
  ExpenseEntry,
  ExpenseCategory,
  IncomeEntry,
  IncomeCategory,
  CompanyId,
  Vehicle,
  Driver,
  Customer
} from '../types';
import { StorageService } from '../utils/storage';

interface ProfitLossViewProps {
  currentCompanyId: CompanyId;
  companyName: string;
  lrEntries: LREntry[];
  payments: PaymentReceipt[];
  expenses: ExpenseEntry[];
  onSaveExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  incomes?: IncomeEntry[];
  onSaveIncome?: (income: IncomeEntry) => void;
  onDeleteIncome?: (id: string) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  customers?: Customer[];
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Diesel & Fuel',
  'Driver Trip Advance & Bhatta',
  'Driver Salary',
  'Toll Plaza & Fastag',
  'Vehicle Maintenance & Repairs',
  'Tyres & Tubes',
  'Loading & Unloading (Hamali)',
  'Market Vehicle / Hire Freight',
  'Office Rent & Utilities',
  'Staff Salary',
  'RTO / Permit / Taxes',
  'Insurance & Fitness',
  'Halting & Detention',
  'Tea & Refreshment / Misc'
];

const DEFAULT_INCOME_CATEGORIES: string[] = [
  'Freight Income',
  'Transport Charges',
  'Loading Charges',
  'Unloading Charges',
  'Detention Charges',
  'Halting Charges',
  'Hamali Income',
  'Commission / Brokerage',
  'Insurance Claim',
  'Scrap / Asset Sale',
  'Other Income'
];

const CATEGORY_COLORS: Record<string, string> = {
  'Diesel & Fuel': '#f59e0b',
  'Driver Trip Advance & Bhatta': '#3b82f6',
  'Driver Salary': '#6366f1',
  'Toll Plaza & Fastag': '#10b981',
  'Vehicle Maintenance & Repairs': '#ec4899',
  'Tyres & Tubes': '#8b5cf6',
  'Loading & Unloading (Hamali)': '#14b8a6',
  'Market Vehicle / Hire Freight': '#f97316',
  'Office Rent & Utilities': '#64748b',
  'Staff Salary': '#a855f7',
  'RTO / Permit / Taxes': '#ef4444',
  'Insurance & Fitness': '#06b6d4',
  'Halting & Detention': '#eab308',
  'Tea & Refreshment / Misc': '#94a3b8'
};

const INCOME_CATEGORY_COLORS: Record<string, string> = {
  'Freight Income': '#10b981',
  'Freight Bookings': '#10b981',
  'Transport Charges': '#06b6d4',
  'Loading Charges': '#3b82f6',
  'Unloading Charges': '#6366f1',
  'Detention Charges': '#f59e0b',
  'Halting Charges': '#eab308',
  'Hamali Income': '#14b8a6',
  'Commission / Brokerage': '#8b5cf6',
  'Insurance Claim': '#ec4899',
  'Scrap / Asset Sale': '#f97316',
  'Other Income': '#2dd4bf'
};

export const getCategoryColor = (category: string): string => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const fallbackColors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#e11d48', '#3b82f6', '#10b981', '#d97706'];
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
};

export const getIncomeCategoryColor = (category: string): string => {
  if (INCOME_CATEGORY_COLORS[category]) return INCOME_CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const fallbackColors = ['#10b981', '#06b6d4', '#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899', '#2dd4bf'];
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
};

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({
  currentCompanyId,
  companyName,
  lrEntries,
  payments,
  expenses,
  onSaveExpense,
  onDeleteExpense,
  incomes,
  onSaveIncome,
  onDeleteIncome,
  vehicles,
  drivers,
  customers
}) => {
  const isTransport = currentCompanyId === 'mahaveer_transport';

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'EXPENSE_LEDGER' | 'INCOME_LEDGER' | 'VEHICLE_PL'>('OVERVIEW');

  // Custom Expense Categories (Persisted strictly separately from income)
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = StorageService.getExpenseHeads(currentCompanyId);
      if (saved && saved.length > 0) return saved;
      const legacy = localStorage.getItem('mahaveer_custom_expense_categories');
      return legacy ? JSON.parse(legacy) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom Income Categories (Persisted strictly separately from expense)
  const [customIncomeCategories, setCustomIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = StorageService.getIncomeHeads(currentCompanyId);
      if (saved && saved.length > 0) return saved;
      const legacy = localStorage.getItem('mahaveer_custom_income_categories');
      return legacy ? JSON.parse(legacy) : [];
    } catch (e) {
      return [];
    }
  });

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);

  // Expense Form Fields
  const [expVoucherNo, setExpVoucherNo] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Diesel & Fuel');
  const [isCreatingCustomCategory, setIsCreatingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPaymentMode, setExpPaymentMode] = useState<ExpenseEntry['paymentMode']>('Online/UPI');
  const [expVehicleNumber, setExpVehicleNumber] = useState('');
  const [expDriverName, setExpDriverName] = useState('');
  const [expPayeeName, setExpPayeeName] = useState('');
  const [expReferenceNo, setExpReferenceNo] = useState('');
  const [expLRNumber, setExpLRNumber] = useState('');
  const [expRemarks, setExpRemarks] = useState('');

  // Add / Edit Income Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);

  // Income Form Fields
  const [incReceiptNo, setIncReceiptNo] = useState('');
  const [incDate, setIncDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incCategory, setIncCategory] = useState<string>('Transport Charges');
  const [isCreatingCustomIncomeCategory, setIsCreatingCustomIncomeCategory] = useState(false);
  const [customIncomeCategoryInput, setCustomIncomeCategoryInput] = useState('');
  const [incAmount, setIncAmount] = useState<number | ''>('');
  const [incPaymentMode, setIncPaymentMode] = useState<IncomeEntry['paymentMode']>('Online/UPI');
  const [incVehicleNumber, setIncVehicleNumber] = useState('');
  const [incDriverName, setIncDriverName] = useState('');
  const [incPayerName, setIncPayerName] = useState('');
  const [incReferenceNo, setIncReferenceNo] = useState('');
  const [incLRNumber, setIncLRNumber] = useState('');
  const [incRemarks, setIncRemarks] = useState('');

  // Dedicated Modals for New Category Heads
  const [isIncomeHeadModalOpen, setIsIncomeHeadModalOpen] = useState(false);
  const [newIncomeHeadName, setNewIncomeHeadName] = useState('');
  const [newIncomeHeadDesc, setNewIncomeHeadDesc] = useState('');

  const [isExpenseHeadModalOpen, setIsExpenseHeadModalOpen] = useState(false);
  const [newExpenseHeadName, setNewExpenseHeadName] = useState('');
  const [newExpenseHeadDesc, setNewExpenseHeadDesc] = useState('');

  // Separate expense categories (Strictly NO income heads)
  const allExpenseCategories = useMemo(() => {
    const set = new Set<string>(EXPENSE_CATEGORIES);
    customExpenseCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    expenses.forEach((e) => {
      if (e.category && e.category.trim()) set.add(e.category.trim());
    });
    return Array.from(set);
  }, [customExpenseCategories, expenses]);

  // Separate income categories (Strictly NO expense heads)
  const allIncomeCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_INCOME_CATEGORIES);
    customIncomeCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    (incomes || []).forEach((inc) => {
      if (inc.category && inc.category.trim()) set.add(inc.category.trim());
    });
    return Array.from(set);
  }, [customIncomeCategories, incomes]);

  // Helper for Date Filtering
  const filterByDate = (dateStr?: string) => {
    if (!dateStr) return false;
    if (periodPreset === 'ALL') return true;

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed

    const targetDate = new Date(dateStr);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    if (periodPreset === 'THIS_MONTH') {
      return curYear === targetYear && curMonth === targetMonth;
    }
    if (periodPreset === 'LAST_MONTH') {
      const lastMonthYear = curMonth === 0 ? curYear - 1 : curYear;
      const lastMonth = curMonth === 0 ? 11 : curMonth - 1;
      return targetYear === lastMonthYear && targetMonth === lastMonth;
    }
    if (periodPreset === 'LAST_3_MONTHS') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return targetDate >= threeMonthsAgo && targetDate <= today;
    }
    if (periodPreset === 'CUSTOM') {
      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;
      return true;
    }
    return true;
  };

  // Filtered Datasets
  const filteredLRs = useMemo(() => {
    return lrEntries.filter((lr) => {
      if (!filterByDate(lr.bookingDate)) return false;
      if (selectedVehicle !== 'ALL' && lr.vehicleNumber.trim().toUpperCase() !== selectedVehicle.trim().toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lr.lrNumber.toLowerCase().includes(q) ||
          lr.partyName.toLowerCase().includes(q) ||
          lr.vehicleNumber.toLowerCase().includes(q) ||
          lr.pickupLocation.toLowerCase().includes(q) ||
          lr.deliveryLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lrEntries, periodPreset, dateFrom, dateTo, selectedVehicle, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (!filterByDate(exp.expenseDate)) return false;
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;
      if (selectedVehicle !== 'ALL' && exp.vehicleNumber && exp.vehicleNumber.trim().toUpperCase() !== selectedVehicle.trim().toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          exp.category.toLowerCase().includes(q) ||
          (exp.voucherNo && exp.voucherNo.toLowerCase().includes(q)) ||
          (exp.payeeName && exp.payeeName.toLowerCase().includes(q)) ||
          (exp.vehicleNumber && exp.vehicleNumber.toLowerCase().includes(q)) ||
          (exp.driverName && exp.driverName.toLowerCase().includes(q)) ||
          (exp.lrNumber && exp.lrNumber.toLowerCase().includes(q)) ||
          (exp.remarks && exp.remarks.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [expenses, periodPreset, dateFrom, dateTo, selectedCategory, selectedVehicle, searchQuery]);

  const incomesList = incomes || [];
  const filteredIncomes = useMemo(() => {
    return incomesList.filter((inc) => {
      if (!filterByDate(inc.incomeDate)) return false;
      if (selectedCategory !== 'ALL' && inc.category !== selectedCategory) return false;
      if (selectedVehicle !== 'ALL' && inc.vehicleNumber && inc.vehicleNumber.trim().toUpperCase() !== selectedVehicle.trim().toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inc.category.toLowerCase().includes(q) ||
          (inc.receiptNo && inc.receiptNo.toLowerCase().includes(q)) ||
          (inc.payerName && inc.payerName.toLowerCase().includes(q)) ||
          (inc.vehicleNumber && inc.vehicleNumber.toLowerCase().includes(q)) ||
          (inc.driverName && inc.driverName.toLowerCase().includes(q)) ||
          (inc.lrNumber && inc.lrNumber.toLowerCase().includes(q)) ||
          (inc.referenceNo && inc.referenceNo.toLowerCase().includes(q)) ||
          (inc.remarks && inc.remarks.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [incomesList, periodPreset, dateFrom, dateTo, selectedCategory, selectedVehicle, searchQuery]);

  // Financial Metrics Calculation
  // 1. LR Freight Income
  const totalFreightIncome = useMemo(() => {
    return filteredLRs.reduce((sum, lr) => sum + (Number(lr.freight) || 0), 0);
  }, [filteredLRs]);

  // 2. Manual / Direct Income
  const totalManualIncome = useMemo(() => {
    return filteredIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  }, [filteredIncomes]);

  // TOTAL INCOME = LR FREIGHT INCOME + MANUAL INCOME
  const totalRevenue = totalFreightIncome + totalManualIncome;

  const totalAdvanceReceived = useMemo(() => {
    return filteredLRs.reduce((sum, lr) => sum + (Number(lr.advance) || 0), 0);
  }, [filteredLRs]);

  const totalPendingReceivables = useMemo(() => {
    return filteredLRs.reduce((sum, lr) => sum + (Number(lr.balance) || 0), 0);
  }, [filteredLRs]);

  // TOTAL EXPENSE = ALL EXPENSE VOUCHERS
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  // NET PROFIT = TOTAL INCOME - TOTAL EXPENSE
  const netProfit = totalRevenue - totalExpense;
  const isProfit = netProfit >= 0;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Category-wise Expense Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + (Number(exp.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Income Category Breakdown
  const incomeCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    if (totalFreightIncome > 0) {
      map['Freight Bookings'] = totalFreightIncome;
    }
    filteredIncomes.forEach((inc) => {
      map[inc.category] = (map[inc.category] || 0) + (Number(inc.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [totalFreightIncome, filteredIncomes]);

  // Monthly Trend Chart Data
  const monthlyChartData = useMemo(() => {
    const monthMap: Record<string, { month: string; income: number; expense: number; profit: number }> = {};

    // Group LRs by month
    filteredLRs.forEach((lr) => {
      if (!lr.bookingDate) return;
      const monthKey = lr.bookingDate.substring(0, 7); // YYYY-MM
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, profit: 0 };
      }
      monthMap[monthKey].income += Number(lr.freight) || 0;
    });

    // Group Manual Incomes by month
    filteredIncomes.forEach((inc) => {
      if (!inc.incomeDate) return;
      const monthKey = inc.incomeDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, profit: 0 };
      }
      monthMap[monthKey].income += Number(inc.amount) || 0;
    });

    // Group Expenses by month
    filteredExpenses.forEach((exp) => {
      if (!exp.expenseDate) return;
      const monthKey = exp.expenseDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, profit: 0 };
      }
      monthMap[monthKey].expense += Number(exp.amount) || 0;
    });

    return Object.values(monthMap)
      .map((item) => ({
        ...item,
        profit: item.income - item.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredLRs, filteredIncomes, filteredExpenses]);

  // Vehicle-wise Profit & Loss
  const vehiclePLData = useMemo(() => {
    const vMap: Record<string, { vehicleNo: string; trips: number; revenue: number; expense: number; netProfit: number }> = {};

    filteredLRs.forEach((lr) => {
      const vNo = lr.vehicleNumber.trim().toUpperCase() || 'UNASSIGNED';
      if (!vMap[vNo]) {
        vMap[vNo] = { vehicleNo: vNo, trips: 0, revenue: 0, expense: 0, netProfit: 0 };
      }
      vMap[vNo].trips += 1;
      vMap[vNo].revenue += Number(lr.freight) || 0;
    });

    filteredIncomes.forEach((inc) => {
      const vNo = inc.vehicleNumber?.trim().toUpperCase() || 'GENERAL / DIRECT';
      if (!vMap[vNo]) {
        vMap[vNo] = { vehicleNo: vNo, trips: 0, revenue: 0, expense: 0, netProfit: 0 };
      }
      vMap[vNo].revenue += Number(inc.amount) || 0;
    });

    filteredExpenses.forEach((exp) => {
      const vNo = exp.vehicleNumber?.trim().toUpperCase() || 'GENERAL / FLEET';
      if (!vMap[vNo]) {
        vMap[vNo] = { vehicleNo: vNo, trips: 0, revenue: 0, expense: 0, netProfit: 0 };
      }
      vMap[vNo].expense += Number(exp.amount) || 0;
    });

    return Object.values(vMap)
      .map((v) => ({
        ...v,
        netProfit: v.revenue - v.expense
      }))
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [filteredLRs, filteredIncomes, filteredExpenses]);

  // Open Modal to Add Expense
  const handleOpenAddExpense = (prefillCategory?: string) => {
    setEditingExpense(null);
    setExpVoucherNo(`EXP-${Date.now().toString().slice(-6)}`);
    setExpDate(new Date().toISOString().split('T')[0]);
    setIsCreatingCustomCategory(false);
    setCustomCategoryInput('');
    setExpCategory(prefillCategory || 'Diesel & Fuel');
    setExpAmount('');
    setExpPaymentMode('Online/UPI');
    setExpVehicleNumber(vehicles[0]?.vehicleNo || '');
    setExpDriverName(drivers[0]?.name || '');
    setExpPayeeName('');
    setExpReferenceNo('');
    setExpLRNumber('');
    setExpRemarks('');
    setIsExpenseModalOpen(true);
  };

  // Open Modal to Edit Expense
  const handleOpenEditExpense = (exp: ExpenseEntry) => {
    setEditingExpense(exp);
    setExpVoucherNo(exp.voucherNo || `EXP-${exp.id.slice(-6)}`);
    setExpDate(exp.expenseDate);
    setIsCreatingCustomCategory(false);
    setCustomCategoryInput('');
    setExpCategory(exp.category);
    setExpAmount(exp.amount);
    setExpPaymentMode(exp.paymentMode || 'Online/UPI');
    setExpVehicleNumber(exp.vehicleNumber || '');
    setExpDriverName(exp.driverName || '');
    setExpPayeeName(exp.payeeName || '');
    setExpReferenceNo(exp.referenceNo || '');
    setExpLRNumber(exp.lrNumber || '');
    setExpRemarks(exp.remarks || '');
    setIsExpenseModalOpen(true);
  };

  // Save Expense Form
  const handleSaveExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    let finalCategory = expCategory;
    if (isCreatingCustomCategory && customCategoryInput.trim()) {
      finalCategory = customCategoryInput.trim();
      // Persist custom category
      if (!customExpenseCategories.includes(finalCategory) && !EXPENSE_CATEGORIES.includes(finalCategory as any)) {
        const updated = [...customExpenseCategories, finalCategory];
        setCustomExpenseCategories(updated);
        StorageService.saveExpenseHeads(updated, currentCompanyId);
      }
    }

    const saved: ExpenseEntry = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      voucherNo: expVoucherNo.trim() || `EXP-${Date.now().toString().slice(-6)}`,
      expenseDate: expDate,
      category: finalCategory,
      amount: Number(expAmount),
      paymentMode: expPaymentMode,
      vehicleNumber: expVehicleNumber.trim().toUpperCase() || undefined,
      driverName: expDriverName.trim() || undefined,
      payeeName: expPayeeName.trim() || undefined,
      referenceNo: expReferenceNo.trim() || undefined,
      lrNumber: expLRNumber.trim() || undefined,
      remarks: expRemarks.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString()
    };

    onSaveExpense(saved);
    setIsExpenseModalOpen(false);
  };

  // Open Modal to Add Income
  const handleOpenAddIncome = (prefillCategory?: string) => {
    setEditingIncome(null);
    setIncReceiptNo(`INC-${Date.now().toString().slice(-6)}`);
    setIncDate(new Date().toISOString().split('T')[0]);
    setIsCreatingCustomIncomeCategory(false);
    setCustomIncomeCategoryInput('');
    setIncCategory(prefillCategory || 'Transport Charges');
    setIncAmount('');
    setIncPaymentMode('Online/UPI');
    setIncVehicleNumber(vehicles[0]?.vehicleNo || '');
    setIncDriverName(drivers[0]?.name || '');
    setIncPayerName(customers && customers.length > 0 ? customers[0].name : '');
    setIncReferenceNo('');
    setIncLRNumber('');
    setIncRemarks('');
    setIsIncomeModalOpen(true);
  };

  // Open Modal to Edit Income
  const handleOpenEditIncome = (inc: IncomeEntry) => {
    setEditingIncome(inc);
    setIncReceiptNo(inc.receiptNo || `INC-${inc.id.slice(-6)}`);
    setIncDate(inc.incomeDate);
    setIsCreatingCustomIncomeCategory(false);
    setCustomIncomeCategoryInput('');
    setIncCategory(inc.category);
    setIncAmount(inc.amount);
    setIncPaymentMode(inc.paymentMode || 'Online/UPI');
    setIncVehicleNumber(inc.vehicleNumber || '');
    setIncDriverName(inc.driverName || '');
    setIncPayerName(inc.payerName || '');
    setIncReferenceNo(inc.referenceNo || '');
    setIncLRNumber(inc.lrNumber || '');
    setIncRemarks(inc.remarks || '');
    setIsIncomeModalOpen(true);
  };

  // Save Income Form
  const handleSaveIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incAmount || Number(incAmount) <= 0) {
      alert('Please enter a valid income amount.');
      return;
    }

    let finalCategory = incCategory;
    if (isCreatingCustomIncomeCategory && customIncomeCategoryInput.trim()) {
      finalCategory = customIncomeCategoryInput.trim();
      // Persist custom income category
      if (!customIncomeCategories.includes(finalCategory) && !DEFAULT_INCOME_CATEGORIES.includes(finalCategory)) {
        const updated = [...customIncomeCategories, finalCategory];
        setCustomIncomeCategories(updated);
        StorageService.saveIncomeHeads(updated, currentCompanyId);
      }
    }

    const saved: IncomeEntry = {
      id: editingIncome ? editingIncome.id : `inc-${Date.now()}`,
      receiptNo: incReceiptNo.trim() || `INC-${Date.now().toString().slice(-6)}`,
      incomeDate: incDate,
      category: finalCategory,
      amount: Number(incAmount),
      paymentMode: incPaymentMode,
      vehicleNumber: incVehicleNumber.trim().toUpperCase() || undefined,
      driverName: incDriverName.trim() || undefined,
      payerName: incPayerName.trim() || undefined,
      referenceNo: incReferenceNo.trim() || undefined,
      lrNumber: incLRNumber.trim() || undefined,
      remarks: incRemarks.trim() || undefined,
      createdAt: editingIncome ? editingIncome.createdAt : new Date().toISOString()
    };

    if (onSaveIncome) {
      onSaveIncome(saved);
    }
    setIsIncomeModalOpen(false);
  };

  // Create Dedicated Income Head
  const handleCreateIncomeHead = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newIncomeHeadName.trim();
    if (!trimmed) return;
    if (!customIncomeCategories.includes(trimmed) && !DEFAULT_INCOME_CATEGORIES.includes(trimmed)) {
      const updated = [...customIncomeCategories, trimmed];
      setCustomIncomeCategories(updated);
      StorageService.saveIncomeHeads(updated, currentCompanyId);
    }
    setIsIncomeHeadModalOpen(false);
    setNewIncomeHeadName('');
    setNewIncomeHeadDesc('');
  };

  // Create Dedicated Expense Head
  const handleCreateExpenseHead = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newExpenseHeadName.trim();
    if (!trimmed) return;
    if (!customExpenseCategories.includes(trimmed) && !EXPENSE_CATEGORIES.includes(trimmed as any)) {
      const updated = [...customExpenseCategories, trimmed];
      setCustomExpenseCategories(updated);
      StorageService.saveExpenseHeads(updated, currentCompanyId);
    }
    setIsExpenseHeadModalOpen(false);
    setNewExpenseHeadName('');
    setNewExpenseHeadDesc('');
  };

  // Export Comprehensive CSV
  const handleExportCSV = () => {
    const headers = ['Type', 'Voucher / Receipt No', 'Date', 'Category / Head', 'Amount (INR)', 'Payment Mode', 'Vehicle No', 'Driver / Party', 'LR Ref', 'Remarks'];
    
    const expenseRows = filteredExpenses.map((exp) => [
      'EXPENSE',
      exp.voucherNo || exp.id,
      exp.expenseDate,
      exp.category,
      `-${exp.amount}`,
      exp.paymentMode,
      exp.vehicleNumber || 'N/A',
      exp.payeeName || exp.driverName || 'N/A',
      exp.lrNumber || 'N/A',
      exp.remarks || ''
    ]);

    const incomeRows = filteredIncomes.map((inc) => [
      'INCOME_RECEIPT',
      inc.receiptNo || inc.id,
      inc.incomeDate,
      inc.category,
      `+${inc.amount}`,
      inc.paymentMode,
      inc.vehicleNumber || 'N/A',
      inc.payerName || 'N/A',
      inc.lrNumber || 'N/A',
      inc.remarks || ''
    ]);

    const lrRows = filteredLRs.map((lr) => [
      'LR_FREIGHT',
      lr.lrNumber,
      lr.bookingDate,
      'Freight Booking',
      `+${lr.freight}`,
      'Party Ledger',
      lr.vehicleNumber || 'N/A',
      lr.partyName || 'N/A',
      lr.lrNumber,
      `Advance: ${lr.advance || 0}, Balance: ${lr.balance || 0}`
    ]);

    const allRows = [...incomeRows, ...lrRows, ...expenseRows];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...allRows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Profit_Loss_Statement_${currentCompanyId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Active Company Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isTransport
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            }`}>
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Profit & Loss Statement</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  isTransport
                    ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                    : 'bg-orange-950 text-orange-300 border-orange-500/40'
                }`}>
                  {companyName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Company Income, Trip Expenses, Vehicle P&L, and Net Profit analysis with date & category filters
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: + Add Income, + Add Expense, + New Income Head, + New Expense Head */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* + Add Income */}
          <button
            type="button"
            onClick={() => handleOpenAddIncome()}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            title="Record direct transport income voucher"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Income</span>
          </button>

          {/* + Add Expense */}
          <button
            type="button"
            onClick={() => handleOpenAddExpense()}
            className={`px-4 py-2 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isTransport
                ? 'bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500'
                : 'bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500'
            }`}
            title="Record trip or operating expense voucher"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Expense</span>
          </button>

          {/* + New Income Head */}
          <button
            type="button"
            onClick={() => {
              setNewIncomeHeadName('');
              setNewIncomeHeadDesc('');
              setIsIncomeHeadModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Create a new custom income category head"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Income Head</span>
          </button>

          {/* + New Expense Head */}
          <button
            type="button"
            onClick={() => {
              setNewExpenseHeadName('');
              setNewExpenseHeadDesc('');
              setIsExpenseHeadModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Create a new custom expense category head"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Expense Head</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export Income & Expense Statement to CSV"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Print P&L */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Profit & Loss Statement"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            <span>Print P&L</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Period Presets */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'LAST_MONTH', label: 'Last Month' },
                { id: 'LAST_3_MONTHS', label: 'Last 3 Months' },
                { id: 'CUSTOM', label: 'Custom Range' }
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  periodPreset === p.id
                    ? isTransport
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category, vehicle, LR, payer..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Category Filter (Strictly labeled Income and Expense) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category / Head</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="ALL">All Categories (Income & Expense)</option>
              <optgroup label="── Income Heads ──">
                {allIncomeCategories.map((c) => (
                  <option key={`inc-${c}`} value={c}>
                    💰 {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="── Expense Heads ──">
                {allExpenseCategories.map((c) => (
                  <option key={`exp-${c}`} value={c}>
                    💸 {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vehicle / Truck</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="ALL">All Vehicles (Whole Fleet)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.vehicleNo}>
                  {v.vehicleNo} ({v.vehicleType})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date From */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPeriodPreset('CUSTOM');
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Custom Date To */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPeriodPreset('CUSTOM');
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards: Income, Expenses, Net Profit, Trip Economics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income: LR Freight + Manual Income */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Income</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenAddIncome()}
                className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Add income receipt"
              >
                <Plus className="h-3 w-3" />
                <span>+ Add</span>
              </button>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>LR Freight: ₹{totalFreightIncome.toLocaleString('en-IN')}</span>
              <span className="text-emerald-300 font-semibold">Direct: ₹{totalManualIncome.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span>{filteredLRs.length} LRs + {filteredIncomes.length} Direct</span>
            <span className="text-amber-400 font-bold">Pending Bal: ₹{totalPendingReceivables.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Total Expenses with Direct + Add Expense Button */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Operating Expenses</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenAddExpense()}
                className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Add expense voucher now"
              >
                <Plus className="h-3 w-3" />
                <span>+ Add</span>
              </button>
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              ₹{totalExpense.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{filteredExpenses.length} Expense Vouchers</span>
              <span className="text-slate-300 font-semibold">{categoryBreakdown.length} Categories</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
            Top Cost: <span className="text-slate-300 font-bold">{categoryBreakdown[0]?.name || 'None'}</span>
          </div>
        </div>

        {/* Net Profit / Net Loss */}
        <div className={`p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm border ${
          isProfit
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/40'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {isProfit ? 'Net Profit' : 'Net Loss'}
            </span>
            <div className={`p-2 rounded-xl border ${
              isProfit
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Operating Margin</span>
              <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitMarginPercent}%
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
            Formula: Income (₹{totalRevenue.toLocaleString('en-IN')}) - Expense (₹{totalExpense.toLocaleString('en-IN')})
          </div>
        </div>

        {/* Average Profit per Trip */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Trip Economics</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              ₹{filteredLRs.length > 0 ? Math.round(netProfit / filteredLRs.length).toLocaleString('en-IN') : 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Avg Income/Trip</span>
              <span className="text-slate-300 font-semibold">
                ₹{filteredLRs.length > 0 ? Math.round(totalRevenue / filteredLRs.length).toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
            Avg Expense/Trip: <span className="text-rose-300 font-bold">₹{filteredLRs.length > 0 ? Math.round(totalExpense / filteredLRs.length).toLocaleString('en-IN') : 0}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {(
          [
            { id: 'OVERVIEW', label: 'Financial Overview & Charts', icon: BarChart3 },
            { id: 'EXPENSE_LEDGER', label: `Expense Ledger (${filteredExpenses.length})`, icon: Receipt },
            { id: 'INCOME_LEDGER', label: `Income Ledger (${filteredLRs.length + filteredIncomes.length})`, icon: IndianRupee },
            { id: 'VEHICLE_PL', label: `Vehicle-Wise P&L (${vehiclePLData.length})`, icon: Truck }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? isTransport
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: OVERVIEW (Charts & Analytics) */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Bar Chart (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <span>Monthly Income vs Expenses vs Profit</span>
                  </h3>
                  <p className="text-xs text-slate-400">Month-on-month comparison of transport operations</p>
                </div>
              </div>

              {monthlyChartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="income" name="Freight Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Trip Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Net Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <span>No data available for the selected date range</span>
                </div>
              )}
            </div>

            {/* Category Breakdown (1 col: Expense by Category) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-rose-400" />
                    <span>Expense by Category</span>
                  </h3>
                  <p className="text-xs text-slate-400">Total: ₹{totalExpense.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {categoryBreakdown.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {categoryBreakdown.map((item) => {
                    const percent = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
                    const color = CATEGORY_COLORS[item.name] || '#94a3b8';
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {item.name}
                          </span>
                          <span className="font-mono text-white font-bold shrink-0">
                            ₹{item.value.toLocaleString('en-IN')} <span className="text-slate-500 font-normal">({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <span>No expenses recorded yet</span>
                </div>
              )}
            </div>
          </div>

          {/* Income Source Breakdown (Full Width) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                  <span>Income Breakdown by Category & Source</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total Income: ₹{totalRevenue.toLocaleString('en-IN')} (LR Freight: ₹{totalFreightIncome.toLocaleString('en-IN')} + Direct Income: ₹{totalManualIncome.toLocaleString('en-IN')})
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddIncome()}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Income</span>
              </button>
            </div>

            {incomeCategoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {incomeCategoryBreakdown.map((item) => {
                  const percent = totalRevenue > 0 ? Math.round((item.value / totalRevenue) * 100) : 0;
                  return (
                    <div key={item.name} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 truncate" title={item.name}>
                          💰 {item.name}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400">{percent}%</span>
                      </div>
                      <div className="text-lg font-black font-mono text-white">
                        ₹{item.value.toLocaleString('en-IN')}
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                <span>No income entries found for the selected filter</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: EXPENSE LEDGER */}
      {activeSubTab === 'EXPENSE_LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-white text-sm">
                Company Expense Vouchers ({filteredExpenses.length})
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddExpense}
              className={`px-3 py-1.5 font-bold text-xs rounded-lg text-slate-950 flex items-center gap-1 shadow-sm cursor-pointer ${
                isTransport ? 'bg-blue-400 hover:bg-blue-300' : 'bg-orange-400 hover:bg-orange-300'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Record New Expense</span>
            </button>
          </div>

          {filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payee / Vendor</th>
                    <th className="py-3 px-4">Vehicle / Driver</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">LR / Ref</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {exp.voucherNo || exp.id}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {exp.expenseDate}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[exp.category] || '#94a3b8'}20`,
                            color: CATEGORY_COLORS[exp.category] || '#94a3b8',
                            borderColor: `${CATEGORY_COLORS[exp.category] || '#94a3b8'}40`
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {exp.payeeName || 'N/A'}
                        {exp.remarks && <div className="text-[10px] text-slate-400 font-normal italic">{exp.remarks}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {exp.vehicleNumber ? (
                          <div className="font-mono text-white font-bold">{exp.vehicleNumber}</div>
                        ) : null}
                        {exp.driverName && <div className="text-[10px] text-slate-400">{exp.driverName}</div>}
                        {!exp.vehicleNumber && !exp.driverName && <span className="text-slate-500">General</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                          {exp.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {exp.lrNumber || exp.referenceNo || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-400 text-sm">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete expense voucher "${exp.voucherNo || exp.id}" of ₹${exp.amount}?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold text-white">
                  <tr>
                    <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-slate-400">
                      Total Filtered Operating Expenses:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-base font-black text-rose-400">
                      ₹{totalExpense.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Receipt className="h-10 w-10 mx-auto text-slate-600 mb-1" />
              <p className="text-sm font-semibold text-slate-300">No expense vouchers match the selected filter.</p>
              <p className="text-xs text-slate-500">Click "+ Add Expense" to record diesel, driver salary, toll, or repairs.</p>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: INCOME LEDGER (Direct Manual Incomes + LR Freight Bookings) */}
      {activeSubTab === 'INCOME_LEDGER' && (
        <div className="space-y-6">
          {/* Top Summary Banner */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Complete Income & Freight Ledger</h3>
                <p className="text-xs text-slate-400">
                  Total Income: <span className="text-emerald-400 font-bold font-mono">₹{totalRevenue.toLocaleString('en-IN')}</span> = LR Freight (₹{totalFreightIncome.toLocaleString('en-IN')}) + Direct Receipts (₹{totalManualIncome.toLocaleString('en-IN')})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddIncome}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Record Direct Income</span>
              </button>
            </div>
          </div>

          {/* Table 1: Direct / Manual Transport Income Receipts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  Direct Income Receipts & Other Transport Charges ({filteredIncomes.length})
                </span>
              </div>
              <span className="text-emerald-400 font-mono font-bold text-xs">
                Direct Income Subtotal: ₹{totalManualIncome.toLocaleString('en-IN')}
              </span>
            </div>

            {filteredIncomes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Receipt No</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Income Head</th>
                      <th className="py-3 px-4">Payer / Customer</th>
                      <th className="py-3 px-4">Vehicle / Driver</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">LR / Ref No</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {inc.receiptNo || inc.id}
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {inc.incomeDate}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                            💰 {inc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          {inc.payerName || 'N/A'}
                          {inc.remarks && <div className="text-[10px] text-slate-400 font-normal italic">{inc.remarks}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {inc.vehicleNumber ? (
                            <div className="font-mono text-white font-bold">{inc.vehicleNumber}</div>
                          ) : null}
                          {inc.driverName && <div className="text-[10px] text-slate-400">{inc.driverName}</div>}
                          {!inc.vehicleNumber && !inc.driverName && <span className="text-slate-500">General</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                            {inc.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {inc.lrNumber || inc.referenceNo || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                          ₹{Number(inc.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditIncome(inc)}
                              className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Edit Income"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete income receipt "${inc.receiptNo || inc.id}" of ₹${inc.amount}?`)) {
                                  onDeleteIncome(inc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                              title="Delete Income"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold text-white">
                    <tr>
                      <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-slate-400">
                        Total Direct Manual Income:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base font-black text-emerald-400">
                        ₹{totalManualIncome.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <p className="text-xs font-semibold text-slate-400">No direct income vouchers recorded for this period.</p>
                <p className="text-[11px] text-slate-500">Click "+ Record Direct Income" above to record loading, detention, halting, or other charges.</p>
              </div>
            )}
          </div>

          {/* Table 2: LR Freight Booking Revenue Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-white text-sm">
                  LR Freight Booking Revenue Ledger ({filteredLRs.length} LRs)
                </span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">
                Freight Subtotal: ₹{totalFreightIncome.toLocaleString('en-IN')}
              </span>
            </div>

            {filteredLRs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">LR Number</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer / Party</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Weight / Qty</th>
                      <th className="py-3 px-4 text-right">Freight (₹)</th>
                      <th className="py-3 px-4 text-right">Advance (₹)</th>
                      <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLRs.map((lr) => (
                      <tr key={lr.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-orange-400">
                          {lr.lrNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{lr.bookingDate}</td>
                        <td className="py-3 px-4 font-bold text-white">{lr.partyName}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {lr.pickupLocation} → {lr.deliveryLocation}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {lr.vehicleNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {lr.chargedWeight || lr.weight} {lr.weightUnit || 'Kg'} ({lr.quantity})
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ₹{Number(lr.freight).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          ₹{Number(lr.advance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                          ₹{Number(lr.balance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lr.status === 'Delivered'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}>
                            {lr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold text-white">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-slate-400">
                        Total Freight Revenue:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base font-black text-emerald-400">
                        ₹{totalFreightIncome.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-300">
                        ₹{totalAdvanceReceived.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">
                        ₹{totalPendingReceivables.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                <span>No freight booking LRs recorded for this period.</span>
              </div>
            )}
          </div>

          {/* Grand Combined Total Banner */}
          <div className="p-4 bg-slate-950 border-2 border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Consolidated Income Equation</div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">
                LR Freight (₹{totalFreightIncome.toLocaleString('en-IN')}) + Direct Income (₹{totalManualIncome.toLocaleString('en-IN')})
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Grand Total Income</div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: VEHICLE-WISE P&L */}
      {activeSubTab === 'VEHICLE_PL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-400" />
              <span className="font-bold text-white text-sm">
                Vehicle-Wise Profit & Loss Breakdown
              </span>
            </div>
            <span className="text-slate-400">Showing {vehiclePLData.length} vehicles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4 text-center">Total Trips</th>
                  <th className="py-3 px-4 text-right">Freight Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Diesel / Trip Expense (₹)</th>
                  <th className="py-3 px-4 text-right">Net Profit / Loss (₹)</th>
                  <th className="py-3 px-4 text-center">Profitability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vehiclePLData.map((v) => {
                  const vIsProfit = v.netProfit >= 0;
                  const vMargin = v.revenue > 0 ? Math.round((v.netProfit / v.revenue) * 100) : 0;
                  return (
                    <tr key={v.vehicleNo} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                        {v.vehicleNo}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-300">
                        {v.trips} Trips
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ₹{v.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        ₹{v.expense.toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-black text-sm ${
                        vIsProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        ₹{v.netProfit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          vIsProfit
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-950 text-rose-400 border-rose-500/40'
                        }`}>
                          {vMargin}% Margin
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
            {/* Modal Header */}
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  {editingExpense ? `Edit Expense: ${editingExpense.voucherNo || editingExpense.id}` : 'Record New Trip / Operating Expense'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveExpenseSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Voucher / Bill No</label>
                  <input
                    type="text"
                    value={expVoucherNo}
                    onChange={(e) => setExpVoucherNo(e.target.value)}
                    placeholder="Auto or e.g. EXP-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-300">
                      Expense Category / Head *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCustomCategory(!isCreatingCustomCategory);
                        if (!isCreatingCustomCategory) {
                          setCustomCategoryInput('');
                        }
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isCreatingCustomCategory ? 'Select from list' : '+ Add New Custom Expense Head'}</span>
                    </button>
                  </div>

                  {isCreatingCustomCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Enter new expense head (e.g. Office Rent, Tyre Replacement, Police Challan)..."
                        className="flex-1 bg-slate-800 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customCategoryInput.trim()) {
                            const newCat = customCategoryInput.trim();
                            if (!customExpenseCategories.includes(newCat) && !EXPENSE_CATEGORIES.includes(newCat as any)) {
                              const updated = [...customExpenseCategories, newCat];
                              setCustomExpenseCategories(updated);
                              StorageService.saveExpenseHeads(updated, currentCompanyId);
                            }
                            setExpCategory(newCat);
                            setIsCreatingCustomCategory(false);
                          }
                        }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                      >
                        Set Head
                      </button>
                    </div>
                  ) : (
                    <select
                      value={expCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setExpCategory(e.target.value as ExpenseCategory);
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <optgroup label="Standard Categories">
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                      {customExpenseCategories.length > 0 && (
                        <optgroup label="Custom Created Heads">
                          {customExpenseCategories.map((c) => (
                            <option key={c} value={c}>
                              ⭐ {c}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__NEW__" className="text-amber-400 font-bold bg-slate-900">
                        + Add New Custom Expense Head...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter amount in ₹"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-rose-400 font-mono font-bold text-base focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Mode *</label>
                  <select
                    value={expPaymentMode}
                    onChange={(e) => setExpPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Online/UPI">Online / UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Fastag">Fastag Wallet</option>
                    <option value="Fuel Card">Fuel Card / Petrol Pump Card</option>
                    <option value="NEFT/RTGS">NEFT / RTGS / Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Associated Vehicle No</label>
                  <input
                    type="text"
                    value={expVehicleNumber}
                    onChange={(e) => setExpVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. RJ14 XX 1234"
                    list="expVehicleList"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <datalist id="expVehicleList">
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNo} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={expDriverName}
                    onChange={(e) => setExpDriverName(e.target.value)}
                    placeholder="Driver name if salary / advance"
                    list="expDriverList"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <datalist id="expDriverList">
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payee / Vendor Name</label>
                  <input
                    type="text"
                    value={expPayeeName}
                    onChange={(e) => setExpPayeeName(e.target.value)}
                    placeholder="e.g. Indian Oil Fuel Station, Sharma Garage"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Associated LR No (Optional)</label>
                  <input
                    type="text"
                    value={expLRNumber}
                    onChange={(e) => setExpLRNumber(e.target.value)}
                    placeholder="e.g. RJ-2026-001245"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Bill / Txn Reference No</label>
                  <input
                    type="text"
                    value={expReferenceNo}
                    onChange={(e) => setExpReferenceNo(e.target.value)}
                    placeholder="UPI Ref / Invoice / Cheque No"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  value={expRemarks}
                  onChange={(e) => setExpRemarks(e.target.value)}
                  placeholder="Additional notes about this expense..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer ${
                    isTransport
                      ? 'bg-blue-400 hover:bg-blue-300'
                      : 'bg-orange-400 hover:bg-orange-300'
                  }`}
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Income Modal (EXACT Mirror of Add Expense UI/UX) */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
            {/* Modal Header */}
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  {editingIncome ? `Edit Income: ${editingIncome.receiptNo || editingIncome.id}` : 'Record Direct Transport Income Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIncomeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveIncomeSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Receipt / Voucher No</label>
                  <input
                    type="text"
                    value={incReceiptNo}
                    onChange={(e) => setIncReceiptNo(e.target.value)}
                    placeholder="Auto or e.g. INC-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-300">
                      Income Category / Head *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCustomIncomeCategory(!isCreatingCustomIncomeCategory);
                        if (!isCreatingCustomIncomeCategory) {
                          setCustomIncomeCategoryInput('');
                        }
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isCreatingCustomIncomeCategory ? 'Select from list' : '+ Add New Custom Income Head'}</span>
                    </button>
                  </div>

                  {isCreatingCustomIncomeCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={customIncomeCategoryInput}
                        onChange={(e) => setCustomIncomeCategoryInput(e.target.value)}
                        placeholder="Enter new income head (e.g. Detention Charges, Loading / Hamali, Godown Rent)..."
                        className="flex-1 bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customIncomeCategoryInput.trim()) {
                            const newCat = customIncomeCategoryInput.trim();
                            if (!customIncomeCategories.includes(newCat) && !DEFAULT_INCOME_CATEGORIES.includes(newCat)) {
                              const updated = [...customIncomeCategories, newCat];
                              setCustomIncomeCategories(updated);
                              StorageService.saveIncomeHeads(updated, currentCompanyId);
                            }
                            setIncCategory(newCat);
                            setIsCreatingCustomIncomeCategory(false);
                          }
                        }}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                      >
                        Set Head
                      </button>
                    </div>
                  ) : (
                    <select
                      value={incCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingCustomIncomeCategory(true);
                          setCustomIncomeCategoryInput('');
                        } else {
                          setIncCategory(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <optgroup label="Standard Income Heads">
                        {DEFAULT_INCOME_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            💰 {c}
                          </option>
                        ))}
                      </optgroup>
                      {customIncomeCategories.length > 0 && (
                        <optgroup label="Custom Created Income Heads">
                          {customIncomeCategories.map((c) => (
                            <option key={c} value={c}>
                              ⭐ {c}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__NEW__" className="text-emerald-400 font-bold bg-slate-900">
                        + Add New Custom Income Head...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter amount in ₹"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Mode *</label>
                  <select
                    value={incPaymentMode}
                    onChange={(e) => setIncPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Online/UPI">Online / UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="NEFT/RTGS">NEFT / RTGS / Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Fuel Card">Fuel Card / Card</option>
                    <option value="Fastag">Fastag Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Associated Vehicle No</label>
                  <input
                    type="text"
                    value={incVehicleNumber}
                    onChange={(e) => setIncVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. RJ14 XX 1234"
                    list="incVehicleList"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <datalist id="incVehicleList">
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNo} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={incDriverName}
                    onChange={(e) => setIncDriverName(e.target.value)}
                    placeholder="Driver name if collected via driver"
                    list="incDriverList"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <datalist id="incDriverList">
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payer / Customer Name</label>
                  <input
                    type="text"
                    value={incPayerName}
                    onChange={(e) => setIncPayerName(e.target.value)}
                    placeholder="e.g. Tata Steel, Reliance, Sharma Transport"
                    list="incCustomerList"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <datalist id="incCustomerList">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Associated LR No (Optional)</label>
                  <input
                    type="text"
                    value={incLRNumber}
                    onChange={(e) => setIncLRNumber(e.target.value)}
                    placeholder="e.g. RJ-2026-001245"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Receipt / Txn Reference No</label>
                  <input
                    type="text"
                    value={incReferenceNo}
                    onChange={(e) => setIncReferenceNo(e.target.value)}
                    placeholder="UPI Ref / Invoice / Cheque No"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  value={incRemarks}
                  onChange={(e) => setIncRemarks(e.target.value)}
                  placeholder="Additional notes about this income receipt..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingIncome ? 'Update Income Receipt' : 'Save Income Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Quick New Income Head Modal */}
      {isIncomeHeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Create New Income Head</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIncomeHeadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateIncomeHead();
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Income Head Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newIncomeHeadName}
                  onChange={(e) => setNewIncomeHeadName(e.target.value)}
                  placeholder="e.g. Detention Charges, Godown Rent, Hamali Income"
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Quick Suggestions</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Detention Charges', 'Halting Charges', 'Hamali Income', 'Loading / Unloading', 'Godown Rent', 'Commission Income', 'Insurance Claim'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewIncomeHeadName(sug)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded-md border border-slate-700 cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newIncomeHeadDesc}
                  onChange={(e) => setNewIncomeHeadDesc(e.target.value)}
                  placeholder="Brief description or notes for this income category..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsIncomeHeadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Income Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Quick New Expense Head Modal */}
      {isExpenseHeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Create New Expense Head</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseHeadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateExpenseHead();
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Expense Head Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newExpenseHeadName}
                  onChange={(e) => setNewExpenseHeadName(e.target.value)}
                  placeholder="e.g. Police Challan, Tyre Retreading, Warehouse Rent"
                  className="w-full bg-slate-800 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Quick Suggestions</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Driver Incentive', 'Police Challan', 'Tyre Retreading', 'Warehouse Rent', 'Vehicle Insurance', 'Road Tax / Fitness', 'Brokerage / Commission'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewExpenseHeadName(sug)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded-md border border-slate-700 cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newExpenseHeadDesc}
                  onChange={(e) => setNewExpenseHeadDesc(e.target.value)}
                  placeholder="Brief description or notes for this expense category..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseHeadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Expense Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
