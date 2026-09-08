import React, { useState } from 'react';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertCircle,
  PlusCircle,
  FileText,
  UserCheck,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Printer,
  X,
  Search,
  Box,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Navigation } from 'lucide-react';
import { LREntry, Customer, Driver, Vehicle, PaymentReceipt, AuthSession } from '../types';
import { ServiceAvailabilityByPincode } from './ServiceAvailabilityByPincode';
import { Building2, User, Sparkles } from 'lucide-react';

interface DashboardProps {
  lrEntries: LREntry[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  payments?: PaymentReceipt[];
  currentSession?: AuthSession | null;
  onOpenProfile?: () => void;
  onOpenNewLR: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewDriver: () => void;
  onSelectLRForBilty?: (lr: LREntry) => void;
  onOpenBilty?: (lr: LREntry) => void;
  onSelectLRForPayment?: (lr: LREntry) => void;
  onOpenPayment?: (lr?: LREntry) => void;
  onNavigateToTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onOpenTrackingModal?: (trackingNo: string) => void;
  onOpenTracking?: (lr: LREntry) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lrEntries,
  customers,
  drivers,
  vehicles,
  payments = [],
  currentSession,
  onOpenProfile,
  onOpenNewLR,
  onOpenNewCustomer,
  onOpenNewDriver,
  onSelectLRForBilty,
  onOpenBilty,
  onSelectLRForPayment,
  onOpenPayment,
  onNavigateToTab,
  onNavigate,
  onOpenTrackingModal,
  onOpenTracking
}) => {
  // Aliases
  const triggerBilty = (lr: LREntry) => {
    if (onSelectLRForBilty) onSelectLRForBilty(lr);
    else if (onOpenBilty) onOpenBilty(lr);
  };

  const triggerPayment = (lr: LREntry) => {
    if (onSelectLRForPayment) onSelectLRForPayment(lr);
    else if (onOpenPayment) onOpenPayment(lr);
  };

  const triggerTracking = (lr: LREntry) => {
    if (onOpenTrackingModal) onOpenTrackingModal(lr.lrNumber);
    else if (onOpenTracking) onOpenTracking(lr);
  };

  const triggerNavigate = (tab: any) => {
    if (onNavigateToTab) onNavigateToTab(tab);
    else if (onNavigate) onNavigate(tab);
  };
  // Modal State for Clicking KPI Cards
  const [activeCardFilter, setActiveCardFilter] = useState<'ALL' | 'IN_TRANSIT' | 'DELIVERED' | 'PENDING' | 'PENDING_PAYMENTS' | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Month & Year Graph Controls - Year Range 2020 to 5001
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (lrEntries.length > 0 && lrEntries[0].bookingDate) {
      const yr = new Date(lrEntries[0].bookingDate).getFullYear();
      if (!isNaN(yr) && yr >= 2020 && yr <= 5001) return yr;
    }
    return 2026;
  });

  // Mode: 'ALL_MONTHS' (Month-by-Month 12 Months) vs 'SINGLE_MONTH' (Single Selected Month)
  const [viewMode, setViewMode] = useState<'ALL_MONTHS' | 'SINGLE_MONTH'>('ALL_MONTHS');
  const [yearMode, setYearMode] = useState<'FINANCIAL' | 'CALENDAR'>('FINANCIAL');
  const [selectedSingleMonth, setSelectedSingleMonth] = useState<number>(() => {
    if (lrEntries.length > 0 && lrEntries[0].bookingDate) {
      const parts = lrEntries[0].bookingDate.split('-');
      if (parts.length >= 2) {
        const mn = parseInt(parts[1], 10);
        if (mn >= 1 && mn <= 12) return mn;
      }
    }
    return new Date().getMonth() + 1;
  });

  const [chartType, setChartType] = useState<'BAR' | 'AREA'>('BAR');

  // Metric Calculations
  const totalBookings = lrEntries.length;
  const runningTrips = lrEntries.filter((lr) => lr.status === 'In Transit').length;
  const deliveredTrips = lrEntries.filter((lr) => lr.status === 'Delivered').length;
  const pendingTrips = lrEntries.filter((lr) => lr.status === 'Pending Pickup').length;

  const totalFreight = lrEntries.reduce((sum, lr) => sum + (lr.freight || 0), 0);
  const totalAdvances = lrEntries.reduce((sum, lr) => sum + (lr.advance || 0), 0);
  const totalPaymentsCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = lrEntries.reduce((sum, lr) => sum + (lr.balance || 0), 0);

  // Filter logic for Drill-Down Modal
  const getFilteredLRs = () => {
    if (!activeCardFilter) return [];
    let baseList = lrEntries;
    if (activeCardFilter === 'IN_TRANSIT') {
      baseList = lrEntries.filter((lr) => lr.status === 'In Transit');
    } else if (activeCardFilter === 'DELIVERED') {
      baseList = lrEntries.filter((lr) => lr.status === 'Delivered');
    } else if (activeCardFilter === 'PENDING') {
      baseList = lrEntries.filter((lr) => lr.status === 'Pending Pickup');
    } else if (activeCardFilter === 'PENDING_PAYMENTS') {
      baseList = lrEntries.filter((lr) => (lr.balance || 0) > 0);
    }

    if (!modalSearch.trim()) return baseList;
    const q = modalSearch.toLowerCase();
    return baseList.filter(
      (lr) =>
        lr.lrNumber.toLowerCase().includes(q) ||
        (lr.partyName && lr.partyName.toLowerCase().includes(q)) ||
        lr.consignorName.toLowerCase().includes(q) ||
        lr.consigneeName.toLowerCase().includes(q) ||
        lr.vehicleNumber.toLowerCase().includes(q) ||
        lr.driverName.toLowerCase().includes(q) ||
        lr.pickupLocation.toLowerCase().includes(q) ||
        lr.deliveryLocation.toLowerCase().includes(q)
    );
  };

  // Expiring Document Warnings
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const expiringDrivers = drivers.filter(
    (d) => d.licenceExpiry && d.licenceExpiry <= thirtyDaysLater
  );
  const expiringVehicles = vehicles.filter(
    (v) =>
      (v.insuranceExpiry && v.insuranceExpiry <= thirtyDaysLater) ||
      (v.fitnessExpiry && v.fitnessExpiry <= thirtyDaysLater) ||
      (v.pucExpiry && v.pucExpiry <= thirtyDaysLater)
  );

  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Dynamic Chart Data Generation:
  // 1. ALL_MONTHS: All 12 Months under FY (Apr-Mar) or Calendar (Jan-Dec)
  // 2. SINGLE_MONTH: Pure Month-Wise Single Month bar summary
  const generateChartData = () => {
    if (viewMode === 'SINGLE_MONTH') {
      const monthNum = selectedSingleMonth;
      const monthLRs = lrEntries.filter((lr) => {
        if (!lr.bookingDate) return false;
        const parts = lr.bookingDate.split('-');
        if (parts.length >= 2) {
          return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === monthNum;
        }
        const d = new Date(lr.bookingDate);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
      });

      const monthPayments = payments.filter((p) => {
        if (!p.paymentDate) return false;
        const parts = p.paymentDate.split('-');
        if (parts.length >= 2) {
          return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === monthNum;
        }
        const d = new Date(p.paymentDate);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
      });

      const monthFreight = monthLRs.reduce((sum, lr) => sum + (Number(lr.freight) || 0), 0);
      const monthAdvance = monthLRs.reduce((sum, lr) => sum + (Number(lr.advance) || 0), 0);
      const monthDirectReceipts = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalCollections = monthAdvance + monthDirectReceipts;
      const monthBalance = Math.max(0, monthFreight - totalCollections);

      return [
        {
          month: `${monthNamesShort[monthNum - 1]} '${String(selectedYear).slice(-2)}`,
          fullLabel: `${monthNamesFull[monthNum - 1]} ${selectedYear}`,
          year: selectedYear,
          monthNum,
          Freight: monthFreight,
          Collections: totalCollections,
          Advance: monthAdvance,
          PaymentReceipts: monthDirectReceipts,
          Balance: monthBalance,
          BookingsCount: monthLRs.length,
          PaymentsCount: monthPayments.length
        }
      ];
    } else {
      // ALL_MONTHS 12-Month View
      const monthsDef: { label: string; fullLabel: string; year: number; monthNum: number }[] = [];

      if (yearMode === 'FINANCIAL') {
        // Financial Year (Apr to Mar)
        for (let m = 4; m <= 12; m++) {
          monthsDef.push({
            label: `${monthNamesShort[m - 1]} '${String(selectedYear).slice(-2)}`,
            fullLabel: `${monthNamesFull[m - 1]} ${selectedYear}`,
            year: selectedYear,
            monthNum: m
          });
        }
        for (let m = 1; m <= 3; m++) {
          monthsDef.push({
            label: `${monthNamesShort[m - 1]} '${String(selectedYear + 1).slice(-2)}`,
            fullLabel: `${monthNamesFull[m - 1]} ${selectedYear + 1}`,
            year: selectedYear + 1,
            monthNum: m
          });
        }
      } else {
        // Calendar Year (Jan to Dec)
        for (let m = 1; m <= 12; m++) {
          monthsDef.push({
            label: monthNamesShort[m - 1],
            fullLabel: `${monthNamesFull[m - 1]} ${selectedYear}`,
            year: selectedYear,
            monthNum: m
          });
        }
      }

      return monthsDef.map((m) => {
        const monthLRs = lrEntries.filter((lr) => {
          if (!lr.bookingDate) return false;
          const parts = lr.bookingDate.split('-');
          if (parts.length >= 2) {
            return parseInt(parts[0], 10) === m.year && parseInt(parts[1], 10) === m.monthNum;
          }
          const d = new Date(lr.bookingDate);
          return d.getFullYear() === m.year && d.getMonth() + 1 === m.monthNum;
        });

        const monthPayments = payments.filter((p) => {
          if (!p.paymentDate) return false;
          const parts = p.paymentDate.split('-');
          if (parts.length >= 2) {
            return parseInt(parts[0], 10) === m.year && parseInt(parts[1], 10) === m.monthNum;
          }
          const d = new Date(p.paymentDate);
          return d.getFullYear() === m.year && d.getMonth() + 1 === m.monthNum;
        });

        const monthFreight = monthLRs.reduce((sum, lr) => sum + (Number(lr.freight) || 0), 0);
        const monthAdvance = monthLRs.reduce((sum, lr) => sum + (Number(lr.advance) || 0), 0);
        const monthDirectReceipts = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalCollections = monthAdvance + monthDirectReceipts;
        const monthBalance = Math.max(0, monthFreight - totalCollections);

        return {
          month: m.label,
          fullLabel: m.fullLabel,
          year: m.year,
          monthNum: m.monthNum,
          Freight: monthFreight,
          Collections: totalCollections,
          Advance: monthAdvance,
          PaymentReceipts: monthDirectReceipts,
          Balance: monthBalance,
          BookingsCount: monthLRs.length,
          PaymentsCount: monthPayments.length
        };
      });
    }
  };

  const chartData = generateChartData();
  const activeViewTotalFreight = chartData.reduce((s, m) => s + m.Freight, 0);
  const activeViewTotalCollections = chartData.reduce((s, m) => s + m.Collections, 0);
  const activeViewTotalBalance = Math.max(0, activeViewTotalFreight - activeViewTotalCollections);
  const activeViewCollectionPct = activeViewTotalFreight > 0 ? Math.round((activeViewTotalCollections / activeViewTotalFreight) * 100) : 0;

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span className="text-amber-400 font-semibold">{data.fullLabel}</span>
            <span className="text-[10px] text-slate-300 font-mono font-normal px-1.5 py-0.5 bg-slate-800 rounded">
              {data.BookingsCount} {data.BookingsCount === 1 ? 'LR' : 'LRs'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-indigo-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                Freight Billed:
              </span>
              <span className="font-bold font-mono text-white text-sm">
                ₹{Number(data.Freight).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                Total Collections:
              </span>
              <span className="font-bold font-mono text-emerald-400 text-sm">
                ₹{Number(data.Collections).toLocaleString('en-IN')}
              </span>
            </div>

            {(data.Advance > 0 || data.PaymentReceipts > 0) && (
              <div className="text-[10.5px] text-slate-400 pl-3.5 space-y-0.5 border-l-2 border-slate-800 py-0.5">
                {data.Advance > 0 && (
                  <div className="flex justify-between">
                    <span>• Booking Advance:</span>
                    <span className="font-mono text-slate-300">₹{Number(data.Advance).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {data.PaymentReceipts > 0 && (
                  <div className="flex justify-between">
                    <span>• Payment Receipts:</span>
                    <span className="font-mono text-slate-300">₹{Number(data.PaymentReceipts).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-rose-300 pt-1.5 border-t border-slate-800">
              <span className="font-medium">Pending Balance:</span>
              <span className="font-bold font-mono text-rose-400">
                ₹{Number(data.Balance).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner Alert for Expiring Documents */}
      {(expiringDrivers.length > 0 || expiringVehicles.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-300">Compliance Warning: </span>
              {expiringDrivers.length > 0 && (
                <span>
                  {expiringDrivers.length} Driver Licence(s) expiring within 30 days.{' '}
                </span>
              )}
              {expiringVehicles.length > 0 && (
                <span>
                  {expiringVehicles.length} Vehicle Document(s) (Fitness/Insurance) due for renewal.
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('drivers')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              Check Drivers
            </button>
            <button
              onClick={() => onNavigateToTab('vehicles')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
            >
              Check Fleet
            </button>
          </div>
        </div>
      )}

      {/* 6 KPI Cards Grid with Clickable Drill-Downs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Bookings */}
        <div
          onClick={() => { setActiveCardFilter('ALL'); setModalSearch(''); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-blue-500/60 hover:shadow-blue-500/10 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-blue-300 transition-colors">
              Total Booking
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
              <PackageCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {totalBookings}
            </span>
            <span className="text-xs text-blue-400 font-medium group-hover:underline flex items-center gap-1">
              <span>View All ({totalBookings})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 group-hover:text-slate-400">
            Click to see total bookings list →
          </p>
        </div>

        {/* Running Trips */}
        <div
          onClick={() => { setActiveCardFilter('IN_TRANSIT'); setModalSearch(''); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-orange-500/60 hover:shadow-orange-500/10 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-orange-300 transition-colors">
              Running Trips
            </span>
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg group-hover:scale-110 transition-transform">
              <Truck className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-orange-400">
              {runningTrips}
            </span>
            <span className="text-xs text-orange-300 font-medium group-hover:underline flex items-center gap-1">
              <span>In Transit</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 group-hover:text-slate-400">
            Click to see who is running ({runningTrips} trips) →
          </p>
        </div>

        {/* Delivered Trips */}
        <div
          onClick={() => { setActiveCardFilter('DELIVERED'); setModalSearch(''); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-emerald-500/60 hover:shadow-emerald-500/10 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-emerald-300 transition-colors">
              Delivered Trips
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {deliveredTrips}
            </span>
            <span className="text-xs text-emerald-400 font-medium group-hover:underline flex items-center gap-1">
              <span>Completed</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 group-hover:text-slate-400">
            Click to see who is delivered →
          </p>
        </div>

        {/* Pending Trips */}
        <div
          onClick={() => { setActiveCardFilter('PENDING'); setModalSearch(''); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-amber-500/60 hover:shadow-amber-500/10 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-amber-300 transition-colors">
              Pending Trips
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {pendingTrips}
            </span>
            <span className="text-xs text-amber-300 font-medium group-hover:underline flex items-center gap-1">
              <span>Pending Pickup</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 group-hover:text-slate-400">
            Click to see pending trips →
          </p>
        </div>

        {/* Total Freight */}
        <div
          onClick={() => { setActiveCardFilter('ALL'); setModalSearch(''); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-indigo-500/60 hover:shadow-indigo-500/10 cursor-pointer transition-all group sm:col-span-2 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-indigo-300 transition-colors">
              Total Freight Billed
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center gap-1 group-hover:scale-110 transition-transform">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              ₹{totalFreight.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">
              Advance: ₹{totalAdvances.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full"
              style={{
                width: `${totalFreight > 0 ? Math.min(100, Math.round((totalAdvances / totalFreight) * 100)) : 0}%`
              }}
            />
          </div>
        </div>

        {/* Pending Payments / Outstanding */}
        <div
          onClick={() => { setActiveCardFilter('PENDING_PAYMENTS'); setModalSearch(''); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-rose-500/60 hover:shadow-rose-500/10 cursor-pointer transition-all group sm:col-span-2 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-rose-300 transition-colors">
              Pending Payments (Balance Freight)
            </span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-400">
              ₹{pendingPayments.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-rose-300 font-semibold hover:underline flex items-center gap-1">
              <span>View Unpaid LRs</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400 group-hover:text-slate-300">
            Click to see which LRs have pending balance payments →
          </p>
        </div>

      </div>

      {/* Monthly Revenue Chart & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {viewMode === 'SINGLE_MONTH'
                    ? `${monthNamesFull[selectedSingleMonth - 1]} Freight & Collections`
                    : yearMode === 'FINANCIAL'
                    ? `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)} Freight & Collections (12M)`
                    : `Jan - Dec ${selectedYear} Freight & Collections (12M)`}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                  {viewMode === 'SINGLE_MONTH'
                    ? `${monthNamesShort[selectedSingleMonth - 1]} ${selectedYear}`
                    : yearMode === 'FINANCIAL'
                    ? `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)}`
                    : `${selectedYear}`}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {viewMode === 'SINGLE_MONTH'
                  ? `Month-wise summary for ${monthNamesFull[selectedSingleMonth - 1]} ${selectedYear} (₹)`
                  : yearMode === 'FINANCIAL'
                  ? `Financial Year April ${selectedYear} to March ${selectedYear + 1} - Month-wise Trend (₹)`
                  : `Calendar Year January to December ${selectedYear} - Month-wise Trend (₹)`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle: All 12 Months (FY / Calendar) vs Single Month */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('ALL_MONTHS')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewMode === 'ALL_MONTHS'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Months
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('SINGLE_MONTH')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewMode === 'SINGLE_MONTH'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Month
                </button>
              </div>

              {/* If ALL_MONTHS: show FY vs Calendar toggle */}
              {viewMode === 'ALL_MONTHS' ? (
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setYearMode('FINANCIAL')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      yearMode === 'FINANCIAL'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    FY (Apr-Mar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setYearMode('CALENDAR')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      yearMode === 'CALENDAR'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Jan-Dec
                  </button>
                </div>
              ) : (
                /* If SINGLE_MONTH: show Month Selector Dropdown */
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  <select
                    value={selectedSingleMonth}
                    onChange={(e) => setSelectedSingleMonth(Number(e.target.value))}
                    className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={1} className="bg-slate-900 text-white">01 - January</option>
                    <option value={2} className="bg-slate-900 text-white">02 - February</option>
                    <option value={3} className="bg-slate-900 text-white">03 - March</option>
                    <option value={4} className="bg-slate-900 text-white">04 - April</option>
                    <option value={5} className="bg-slate-900 text-white">05 - May</option>
                    <option value={6} className="bg-slate-900 text-white">06 - June</option>
                    <option value={7} className="bg-slate-900 text-white">07 - July</option>
                    <option value={8} className="bg-slate-900 text-white">08 - August</option>
                    <option value={9} className="bg-slate-900 text-white">09 - September</option>
                    <option value={10} className="bg-slate-900 text-white">10 - October</option>
                    <option value={11} className="bg-slate-900 text-white">11 - November</option>
                    <option value={12} className="bg-slate-900 text-white">12 - December</option>
                  </select>
                </div>
              )}

              {/* Year Select (2020 to 5001) */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Year:</span>
                <input
                  type="number"
                  min={2020}
                  max={5001}
                  value={selectedYear}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setSelectedYear(val);
                  }}
                  className="w-16 bg-transparent text-xs text-amber-300 font-bold focus:outline-none font-mono"
                />
              </div>

              {/* Chart Type Toggle */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setChartType('BAR')}
                  title="Bar Graph View"
                  className={`p-1.5 rounded-md transition-all ${
                    chartType === 'BAR'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('AREA')}
                  title="Area Trend View"
                  className={`p-1.5 rounded-md transition-all ${
                    chartType === 'AREA'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Mini Stat Badges for Selected Period */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-800/60 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                {viewMode === 'SINGLE_MONTH' ? 'Month Freight Billed' : 'Total Freight Billed'}
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-indigo-300">
                ₹{activeViewTotalFreight.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                {viewMode === 'SINGLE_MONTH' ? 'Month Collected' : 'Total Collected'}
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400">
                ₹{activeViewTotalCollections.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                {viewMode === 'SINGLE_MONTH' ? 'Month Pending' : 'Pending Balance'}
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-rose-400">
                ₹{activeViewTotalBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Collection Ratio
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-amber-300">
                {activeViewCollectionPct}%
              </span>
            </div>
          </div>

          {/* Graph Legend */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <span className="w-3 h-3 rounded bg-indigo-500 inline-block shadow-sm"></span>
                <span>Freight Billed (भाड़ा)</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm"></span>
                <span>Payment Collections (भुगतान)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Hover over bars to inspect details
            </span>
          </div>

          {/* Chart Rendering */}
          <div className="h-72 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'BAR' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                  barGap={viewMode === 'SINGLE_MONTH' ? 12 : 3}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) =>
                      v >= 100000
                        ? `₹${(v / 100000).toFixed(1)}L`
                        : v >= 1000
                        ? `₹${(v / 1000).toFixed(0)}k`
                        : `₹${v}`
                    }
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="Freight"
                    name="Freight Billed"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={viewMode === 'SINGLE_MONTH' ? 60 : 28}
                  />
                  <Bar
                    dataKey="Collections"
                    name="Payment Collections"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={viewMode === 'SINGLE_MONTH' ? 60 : 28}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFreight12" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorColl12" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) =>
                      v >= 100000
                        ? `₹${(v / 100000).toFixed(1)}L`
                        : v >= 1000
                        ? `₹${(v / 1000).toFixed(0)}k`
                        : `₹${v}`
                    }
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Freight"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFreight12)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Collections"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorColl12)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations & Masters Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Quick Dispatch Center</h2>
            <p className="text-xs text-slate-400 mb-4">
              Instant entry shortcuts for daily transport operations.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={onOpenNewLR}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 rounded-xl text-orange-200 text-sm font-semibold transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500 text-white rounded-lg shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <span>Create Booking / LR (Bilty)</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenNewCustomer}
                className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-200 text-sm font-medium transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>Add Party / Customer</span>
                </div>
                <span className="text-xs text-slate-400">{customers.length} Parties</span>
              </button>

              <button
                onClick={onOpenNewDriver}
                className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-200 text-sm font-medium transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <span>Add Driver Master</span>
                </div>
                <span className="text-xs text-slate-400">{drivers.length} Drivers</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Fleet registered: {vehicles.length} Trucks</span>
            <button
              onClick={() => onNavigateToTab('vehicles')}
              className="text-orange-400 hover:underline font-semibold"
            >
              View Fleet →
            </button>
          </div>
        </div>

      </div>

      {/* Service Availability by Pincode Section */}
      <ServiceAvailabilityByPincode currentCompanyId={currentSession?.companyId} />

      {/* Recent Lorry Receipts (LRs) Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Recent LR / Bilty Bookings</h2>
            <p className="text-xs text-slate-400">Latest active consignment receipts</p>
          </div>
          <button
            onClick={() => onNavigateToTab('lr_entry')}
            className="text-xs text-orange-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View All Bookings ({lrEntries.length})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="p-3 rounded-l-lg">LR Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Party Name</th>
                <th className="p-3">Route (From → To)</th>
                <th className="p-3">Vehicle & Driver</th>
                <th className="p-3">Freight / Advance</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {lrEntries.slice(0, 5).map((lr) => {
                const statusColor =
                  lr.status === 'In Transit'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : lr.status === 'Delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : lr.status === 'Pending Pickup'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700';

                return (
                  <tr key={lr.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-orange-400">{lr.lrNumber}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">{lr.bookingDate}</td>
                    <td className="p-3 font-medium text-white max-w-[160px] truncate">
                      {lr.partyName}
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{lr.pickupLocation}</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="font-semibold text-slate-200">{lr.deliveryLocation}</span>
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-white">{lr.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-400">{lr.driverName}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-white">₹{lr.freight.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-emerald-400">
                        Adv: ₹{lr.advance.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-rose-400 whitespace-nowrap">
                      ₹{lr.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                        {lr.status}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => triggerTracking(lr)}
                        title="Live GPS & Milestones Tracking"
                        className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Navigation className="h-3.5 w-3.5 text-indigo-300" />
                        <span>Track</span>
                      </button>

                      <button
                        onClick={() => triggerBilty(lr)}
                        title="Print Bilty / Lorry Receipt"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5 text-orange-400" />
                        <span>Bilty</span>
                      </button>
                      {lr.balance > 0 && (
                        <button
                          onClick={() => triggerPayment(lr)}
                          title="Record Payment"
                          className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <IndianRupee className="h-3.5 w-3.5" />
                          <span>Pay</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Drill-Down Modal */}
      {activeCardFilter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-800 px-5 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  {activeCardFilter === 'ALL' && <PackageCheck className="h-6 w-6 text-blue-400" />}
                  {activeCardFilter === 'IN_TRANSIT' && <Truck className="h-6 w-6 text-orange-400 animate-pulse" />}
                  {activeCardFilter === 'DELIVERED' && <CheckCircle2 className="h-6 w-6 text-emerald-400" />}
                  {activeCardFilter === 'PENDING' && <Clock className="h-6 w-6 text-amber-400" />}
                  {activeCardFilter === 'PENDING_PAYMENTS' && <IndianRupee className="h-6 w-6 text-rose-400" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeCardFilter === 'ALL' && 'Total Bookings List'}
                    {activeCardFilter === 'IN_TRANSIT' && 'Running Trips (In Transit)'}
                    {activeCardFilter === 'DELIVERED' && 'Delivered Trips (Completed)'}
                    {activeCardFilter === 'PENDING' && 'Pending Trips (Awaiting Pickup)'}
                    {activeCardFilter === 'PENDING_PAYMENTS' && 'Pending Payment Freight Balances'}
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-700 text-amber-300 rounded-full">
                      {getFilteredLRs().length} Entries
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click Bilty or Pay button on any entry to view or perform actions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCardFilter(null)}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search entries by LR No, Party, Consignor, Consignee, Vehicle, Driver or Route..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content / Table */}
            <div className="overflow-y-auto p-4 flex-1 space-y-3">
              {getFilteredLRs().length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No matching lorry receipts found for this category.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] font-semibold sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="p-3">LR NO. & DATE</th>
                        <th className="p-3">PARTY / CONSIGNOR → CONSIGNEE</th>
                        <th className="p-3">ROUTE</th>
                        <th className="p-3">VEHICLE & DRIVER</th>
                        <th className="p-3">GOODS / CARTONS</th>
                        <th className="p-3 text-right">FREIGHT / BAL</th>
                        <th className="p-3 text-center">STATUS</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {getFilteredLRs().map((lr) => (
                        <tr key={lr.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="p-3 font-mono">
                            <div className="font-bold text-amber-400">{lr.lrNumber}</div>
                            <div className="text-[11px] text-slate-400">{lr.bookingDate}</div>
                          </td>

                          <td className="p-3 max-w-xs">
                            <div className="font-semibold text-white">{lr.partyName || lr.consignorName}</div>
                            <div className="text-[11px] text-slate-400 truncate">To: {lr.consigneeName}</div>
                          </td>

                          <td className="p-3 text-xs whitespace-nowrap">
                            <div className="text-slate-200">{lr.pickupLocation}</div>
                            <div className="text-slate-400">↓ {lr.deliveryLocation}</div>
                          </td>

                          <td className="p-3 text-xs whitespace-nowrap">
                            <div className="font-bold text-slate-200">{lr.vehicleNumber}</div>
                            <div className="text-slate-400">{lr.driverName}</div>
                          </td>

                          <td className="p-3 text-xs">
                            <div>{lr.material}</div>
                            <div className="text-slate-400 font-medium">
                              {lr.weight} {lr.weightUnit}
                              {lr.noOfBoxes ? ` (${lr.noOfBoxes} Cartons)` : ''}
                            </div>
                            {lr.cft && (
                              <div className="text-[10px] text-amber-300/90 font-mono mt-0.5">
                                {lr.cft} CFT | Box: {lr.boxLength}"×{lr.boxHeight}"×{lr.boxWidth}"
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="font-bold text-white">₹{(lr.freight || 0).toLocaleString('en-IN')}</div>
                            {(lr.balance || 0) > 0 ? (
                              <div className="text-[11px] font-bold text-rose-400">
                                Bal: ₹{lr.balance.toLocaleString('en-IN')}
                              </div>
                            ) : (
                              <div className="text-[11px] font-semibold text-emerald-400">Paid</div>
                            )}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                lr.status === 'Delivered'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : lr.status === 'In Transit'
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {lr.status}
                            </span>
                          </td>

                          <td className="p-3 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => {
                                setActiveCardFilter(null);
                                triggerTracking(lr);
                              }}
                              className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Live GPS & Milestones Tracking"
                            >
                              <Navigation className="h-3.5 w-3.5 text-indigo-300" />
                              <span>Track</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveCardFilter(null);
                                triggerBilty(lr);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="View & Print Bilty"
                            >
                              <Printer className="h-3.5 w-3.5 text-amber-400" />
                              <span>Bilty</span>
                            </button>

                            {(lr.balance || 0) > 0 && (
                              <button
                                onClick={() => {
                                  setActiveCardFilter(null);
                                  triggerPayment(lr);
                                }}
                                className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Record Payment"
                              >
                                <IndianRupee className="h-3.5 w-3.5" />
                                <span>Pay</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800/90 px-5 py-3 border-t border-slate-700 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Showing {getFilteredLRs().length} entries for category
              </span>
              <button
                onClick={() => setActiveCardFilter(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
