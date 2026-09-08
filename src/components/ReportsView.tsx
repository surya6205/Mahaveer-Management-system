import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  IndianRupee,
  Users,
  Truck,
  UserCheck,
  Calendar,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  X,
  Pencil,
  Search,
  Eye,
  Building2,
  ArrowRight,
  Receipt,
  FileCheck,
  Navigation
} from 'lucide-react';
import { LREntry, Customer, Driver, Vehicle, PaymentReceipt, CompanySettings, SavedMonthlyInvoice } from '../types';
import { StorageService } from '../utils/storage';
import { MonthlyTaxInvoiceModal } from './MonthlyTaxInvoiceModal';
import { BiltyModal } from './BiltyModal';

interface ReportsViewProps {
  lrEntries: LREntry[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  payments: PaymentReceipt[];
  onOpenMonthlyInvoice?: (partyId?: string) => void;
  onSaveCustomer?: (cust: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  onOpenBilty?: (lr: LREntry) => void;
  onOpenPayment?: (lr?: LREntry) => void;
  onOpenTracking?: (lr: LREntry) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  lrEntries,
  customers,
  drivers,
  vehicles,
  payments,
  onOpenMonthlyInvoice,
  onSaveCustomer,
  onDeleteCustomer,
  onOpenBilty,
  onOpenPayment,
  onOpenTracking
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'BILL_WISE_DUE' | 'OUTSTANDING' | 'FREIGHT_SUMMARY' | 'DRIVER_LEDGER' | 'PAYMENT_COLLECTIONS' | 'MONTHLY_INVOICE'
  >('BILL_WISE_DUE');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [partySearchQuery, setPartySearchQuery] = useState<string>('');
  const [showPartyDropdown, setShowPartyDropdown] = useState<boolean>(false);
  const [partyBillSubTab, setPartyBillSubTab] = useState<'SINGLE_BILLS' | 'MONTHLY_BILLS' | 'ALL_SUMMARY'>('SINGLE_BILLS');

  // Preview Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoicePartyId, setInvoicePartyId] = useState<string>('');
  const [selectedBiltyLR, setSelectedBiltyLR] = useState<LREntry | null>(null);
  const [isBiltyModalOpen, setIsBiltyModalOpen] = useState(false);

  // Customer Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [custGst, setCustGst] = useState('');
  const [custPan, setCustPan] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [custCreditDays, setCustCreditDays] = useState<number>(30);
  const [custCreditLimit, setCustCreditLimit] = useState<number>(500000);
  const [custOpeningBalance, setCustOpeningBalance] = useState<number>(0);

  const handleOpenEditCustomerModal = (c: Customer) => {
    setEditingCustomer(c);
    setCustCode(c.code);
    setCustName(c.name);
    setCustGst(c.gstNo || '');
    setCustPan(c.pan || '');
    setCustMobile(c.mobile || '');
    setCustEmail(c.email || '');
    setCustAddress(c.address || '');
    setCustCity(c.city || '');
    setCustState(c.state || '');
    setCustCreditDays(c.creditDays || 30);
    setCustCreditLimit(c.creditLimit || 500000);
    setCustOpeningBalance(c.openingBalance || 0);
    setIsCustomerEditModalOpen(true);
  };

  const handleSaveCustomerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !onSaveCustomer) return;

    const saved: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      code: custCode || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: custName.trim(),
      gstNo: custGst.trim(),
      pan: custPan.trim(),
      mobile: custMobile.trim(),
      email: custEmail.trim(),
      address: custAddress.trim(),
      city: custCity.trim(),
      state: custState.trim(),
      creditDays: Number(custCreditDays) || 0,
      creditLimit: Number(custCreditLimit) || 0,
      openingBalance: Number(custOpeningBalance) || 0,
      documents: editingCustomer ? editingCustomer.documents : [],
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString().split('T')[0]
    };

    onSaveCustomer(saved);
    setIsCustomerEditModalOpen(false);
  };

  const companySettings: CompanySettings = StorageService.getCompanySettings();

  // CSV Export Helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper to calculate exact due amount for a single LR / Bill
  const getLRDueDetails = (lr: LREntry) => {
    const relatedPayments = payments.filter(
      (p) => p.lrId === lr.id || p.lrNumber === lr.lrNumber
    );
    const totalAdditionalPayments = relatedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalReceived = (lr.advance || 0) + totalAdditionalPayments;
    const dueAmount = Math.max(0, (lr.freight || 0) - totalReceived);
    
    return {
      totalReceived,
      dueAmount,
      relatedPayments
    };
  };

  // Filtered LRs for Bill-Wise Statement
  const billWiseLRs = lrEntries.filter((lr) => {
    if (selectedCustomerId === 'ALL') return true;
    const customerObj = customers.find((c) => c.id === selectedCustomerId);
    if (!customerObj) return true;
    return (
      lr.partyId === selectedCustomerId ||
      lr.partyName.toLowerCase() === customerObj.name.toLowerCase()
    );
  });

  // Export Bill-Wise LR Statement to Excel / CSV
  const handleExportBillWiseCSV = () => {
    const headers = [
      'Bill / LR Number',
      'Booking Date',
      'Party / Customer Name',
      'GSTIN',
      'Vehicle Number',
      'Pickup Route',
      'Delivery Route',
      'Material',
      'Freight Amount (INR)',
      'Advance Paid (INR)',
      'Additional Payments (INR)',
      'Net Due Amount Against LR (INR)',
      'Payment Type',
      'LR Status',
      'DP World Tracking Number'
    ];

    const rows = billWiseLRs.map((l) => {
      const custObj = customers.find((c) => c.id === l.partyId || c.name === l.partyName);
      const gst = custObj ? custObj.gstNo : 'N/A';
      const dueInfo = getLRDueDetails(l);
      const additional = dueInfo.totalReceived - l.advance;

      return [
        l.lrNumber,
        l.bookingDate,
        l.partyName,
        gst,
        l.vehicleNumber,
        l.pickupLocation,
        l.deliveryLocation,
        l.material,
        l.freight,
        l.advance,
        additional,
        dueInfo.dueAmount,
        l.paymentType,
        l.status,
        l.trackingNumber || `DPW-IN-${l.lrNumber.replace(/\D/g, '')}`
      ];
    });

    const custLabel =
      selectedCustomerId === 'ALL'
        ? 'All_Parties'
        : customers.find((c) => c.id === selectedCustomerId)?.name.replace(/\s+/g, '_') ||
          'Customer';

    downloadCSV(`Bill_Wise_Due_Statement_${custLabel}_${Date.now()}.csv`, headers, rows);
  };

  // Export Outstanding Summary
  const handleExportOutstandingCSV = () => {
    const headers = [
      'Customer Code',
      'Party Name',
      'Mobile',
      'GSTIN',
      'Credit Days',
      'Credit Limit',
      'Net Outstanding (₹)'
    ];
    const rows = customers.map((c) => {
      const out = StorageService.calculateCustomerOutstanding(c.id, c.name);
      return [c.code, c.name, c.mobile, c.gstNo, c.creditDays, c.creditLimit, out];
    });
    downloadCSV(`Customer_Outstanding_Report_${Date.now()}.csv`, headers, rows);
  };

  // Export Freight Summary
  const handleExportFreightCSV = () => {
    const headers = [
      'LR Number',
      'Booking Date',
      'Party Name',
      'Pickup',
      'Delivery',
      'Material',
      'Vehicle',
      'Freight (₹)',
      'Advance (₹)',
      'Balance (₹)',
      'Status'
    ];
    const rows = lrEntries.map((l) => [
      l.lrNumber,
      l.bookingDate,
      l.partyName,
      l.pickupLocation,
      l.deliveryLocation,
      l.material,
      l.vehicleNumber,
      l.freight,
      l.advance,
      l.balance,
      l.status
    ]);
    downloadCSV(`Freight_Booking_Report_${Date.now()}.csv`, headers, rows);
  };

  // Calculate Bill-Wise Metrics
  const totalBillWiseFreight = billWiseLRs.reduce((acc, l) => acc + (l.freight || 0), 0);
  const totalBillWiseDue = billWiseLRs.reduce((acc, l) => acc + getLRDueDetails(l).dueAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-400" />
            <h1 className="text-xl font-bold text-white">Bill-Wise Statements & Reports</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate bill-wise LR due payment statements in Excel/CSV, customer ledgers & payment histories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4 text-orange-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => {
              if (activeReportTab === 'BILL_WISE_DUE') handleExportBillWiseCSV();
              else if (activeReportTab === 'OUTSTANDING') handleExportOutstandingCSV();
              else handleExportFreightCSV();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>
              {activeReportTab === 'BILL_WISE_DUE'
                ? 'Export Bill-Wise Excel Statement'
                : 'Export to CSV / Excel'}
            </span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => {
            const partyId = selectedCustomerId !== 'ALL' ? selectedCustomerId : customers[0]?.id || '';
            setInvoicePartyId(partyId);
            if (onOpenMonthlyInvoice) {
              onOpenMonthlyInvoice(partyId);
            } else {
              setIsInvoiceModalOpen(true);
            }
          }}
          className="px-4 py-2.5 rounded-lg font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg whitespace-nowrap flex items-center gap-2"
        >
          <FileText className="h-4 w-4 text-white" />
          <span>Monthly Tax Invoice (18% GST)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-extrabold uppercase">PDF / Email</span>
        </button>

        <button
          onClick={() => setActiveReportTab('BILL_WISE_DUE')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReportTab === 'BILL_WISE_DUE'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4 text-amber-300" />
          <span>Bill-Wise Due Statement (Excel)</span>
        </button>

        <button
          onClick={() => setActiveReportTab('OUTSTANDING')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReportTab === 'OUTSTANDING'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Customer Party Summary</span>
        </button>

        <button
          onClick={() => setActiveReportTab('FREIGHT_SUMMARY')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReportTab === 'FREIGHT_SUMMARY'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Freight Booking History</span>
        </button>

        <button
          onClick={() => setActiveReportTab('DRIVER_LEDGER')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReportTab === 'DRIVER_LEDGER'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Driver Trip Ledger</span>
        </button>

        <button
          onClick={() => setActiveReportTab('PAYMENT_COLLECTIONS')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReportTab === 'PAYMENT_COLLECTIONS'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <IndianRupee className="h-4 w-4" />
          <span>Payment Receipts History</span>
        </button>
      </div>

      {/* Tab 1: Bill-Wise Due Statement (Excel / Screen Breakdown) */}
      {activeReportTab === 'BILL_WISE_DUE' && (
        <div className="space-y-4">
          
          {/* Party Auto-Suggestion Search & Selection Header */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Auto-suggestion Search Box */}
              <div className="relative w-full lg:w-[450px]">
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-amber-400" />
                  <span>Search Party Name (Auto-Suggestion):</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={partySearchQuery}
                    onChange={(e) => {
                      setPartySearchQuery(e.target.value);
                      setShowPartyDropdown(true);
                      if (!e.target.value.trim()) {
                        setSelectedCustomerId('ALL');
                      }
                    }}
                    onFocus={() => setShowPartyDropdown(true)}
                    placeholder="Type party name (e.g. Pioneer, Tata, Reliance)..."
                    className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none pl-9 shadow-inner transition-colors placeholder:text-slate-500"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  {partySearchQuery && (
                    <button
                      onClick={() => {
                        setPartySearchQuery('');
                        setSelectedCustomerId('ALL');
                        setShowPartyDropdown(false);
                      }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Real-time Party Suggestions Dropdown */}
                {showPartyDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('ALL');
                        setPartySearchQuery('');
                        setShowPartyDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                        selectedCustomerId === 'ALL' ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-400" />
                        <span>All Parties / Customers (Show Combined Bills)</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        {customers.length} Parties
                      </span>
                    </button>

                    {customers
                      .filter((c) => {
                        if (!partySearchQuery.trim()) return true;
                        const q = partySearchQuery.toLowerCase().trim();
                        return (
                          c.name.toLowerCase().includes(q) ||
                          c.code.toLowerCase().includes(q) ||
                          (c.gstNo && c.gstNo.toLowerCase().includes(q)) ||
                          (c.city && c.city.toLowerCase().includes(q)) ||
                          (c.mobile && c.mobile.includes(q))
                        );
                      })
                      .map((c) => {
                        const out = StorageService.calculateCustomerOutstanding(c.id, c.name);
                        const isSelected = selectedCustomerId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setPartySearchQuery(c.name);
                              setShowPartyDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                              isSelected ? 'bg-amber-500/15 border-l-4 border-amber-400 text-amber-200' : 'text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{c.name}</span>
                                <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-slate-700">
                                  {c.code}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {c.city && <span>📍 {c.city}</span>}
                                {c.gstNo && <span>GST: {c.gstNo}</span>}
                                {c.mobile && <span>📞 {c.mobile}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block uppercase">Due Balance</span>
                              <span className={`font-mono font-bold text-xs ${out > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                ₹{out.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Quick Summary KPIs */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total LR Bills</span>
                  <span className="text-white font-black text-sm">{billWiseLRs.length} Bookings</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Freight</span>
                  <span className="text-white font-black text-sm">
                    ₹{totalBillWiseFreight.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Net Due Payment</span>
                  <span className="text-rose-400 font-black text-base">
                    ₹{totalBillWiseDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Party Banner & Single vs Monthly Bill View Switcher */}
            {selectedCustomerId !== 'ALL' && (
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-3">
                {(() => {
                  const cust = customers.find((c) => c.id === selectedCustomerId);
                  if (!cust) return null;
                  const savedInvoices = StorageService.getMonthlyInvoices().filter(
                    (inv) => inv.partyId === cust.id || inv.partyName.toLowerCase() === cust.name.toLowerCase()
                  );

                  return (
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-white">{cust.name}</h3>
                              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded font-mono">
                                {cust.code}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>GSTIN: <b className="text-slate-200">{cust.gstNo || 'N/A'}</b></span>
                              <span>•</span>
                              <span>Mobile: <b className="text-slate-200">{cust.mobile || 'N/A'}</b></span>
                              {cust.city && (
                                <>
                                  <span>•</span>
                                  <span>City: <b className="text-slate-200">{cust.city}</b></span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setInvoicePartyId(cust.id);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>+ Generate Monthly Bill (18% GST)</span>
                          </button>
                        </div>
                      </div>

                      {/* Sub-Tabs: Single Bills vs Monthly Bills */}
                      <div className="flex items-center gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setPartyBillSubTab('SINGLE_BILLS')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            partyBillSubTab === 'SINGLE_BILLS'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Receipt className="h-4 w-4" />
                          <span>Single Bills / Bilties ({billWiseLRs.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPartyBillSubTab('MONTHLY_BILLS')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            partyBillSubTab === 'MONTHLY_BILLS'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <FileCheck className="h-4 w-4" />
                          <span>Monthly Tax Invoices ({savedInvoices.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPartyBillSubTab('ALL_SUMMARY')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            partyBillSubTab === 'ALL_SUMMARY'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel Sheet Breakdown</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* View Mode 1: Single Bills (Individual LRs / Bilties for this party) */}
          {selectedCustomerId !== 'ALL' && partyBillSubTab === 'SINGLE_BILLS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-2">
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-white text-sm">
                    Single Bills (LR Wise Bookings & Bilties)
                  </span>
                  <span className="text-[10px] bg-slate-700 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                    {billWiseLRs.length} Single Bills
                  </span>
                </div>
                <button
                  onClick={handleExportBillWiseCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="p-3.5">Bill / LR No.</th>
                      <th className="p-3.5">Booking Date</th>
                      <th className="p-3.5">Vehicle No.</th>
                      <th className="p-3.5">Route (From ➔ To)</th>
                      <th className="p-3.5">Weight / Material</th>
                      <th className="p-3.5">Freight (₹)</th>
                      <th className="p-3.5">Advance (₹)</th>
                      <th className="p-3.5">Balance Due (₹)</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Single Bill Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {billWiseLRs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-500">
                          No single bills found for this party.
                        </td>
                      </tr>
                    ) : (
                      billWiseLRs.map((lr) => {
                        const dueInfo = getLRDueDetails(lr);
                        return (
                          <tr key={lr.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-mono font-bold text-amber-400 text-sm block">
                                {lr.lrNumber}
                              </span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap text-slate-400">
                              {lr.bookingDate}
                            </td>
                            <td className="p-3.5 whitespace-nowrap font-mono font-bold text-emerald-400">
                              {lr.vehicleNumber}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-semibold text-white">{lr.pickupLocation}</span>
                              <ArrowRight className="h-3 w-3 inline text-amber-400 mx-1.5" />
                              <span className="text-white font-semibold">{lr.deliveryLocation}</span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="text-slate-200">{lr.weight} {lr.weightUnit || 'Tons'}</span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{lr.material}</span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap font-extrabold text-white">
                              ₹{lr.freight.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5 whitespace-nowrap text-emerald-400 font-semibold">
                              ₹{lr.advance.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5 whitespace-nowrap font-extrabold">
                              <span className={dueInfo.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                ₹{dueInfo.dueAmount.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  lr.status === 'Delivered'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {lr.status}
                              </span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  setSelectedBiltyLR(lr);
                                  setIsBiltyModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-lg shadow inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View Bilty (सिंगल बिल)</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Mode 2: Monthly Bills (Saved Monthly GST Invoices for this party) */}
          {selectedCustomerId !== 'ALL' && partyBillSubTab === 'MONTHLY_BILLS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-2">
              {(() => {
                const cust = customers.find((c) => c.id === selectedCustomerId);
                const savedInvoices = StorageService.getMonthlyInvoices().filter(
                  (inv) => inv.partyId === cust?.id || inv.partyName.toLowerCase() === cust?.name.toLowerCase()
                );

                return (
                  <div>
                    <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-white text-sm">
                          Monthly Tax Invoices ({cust?.name})
                        </span>
                        <span className="text-[10px] bg-slate-700 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                          {savedInvoices.length} Monthly Invoices
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setInvoicePartyId(cust?.id || '');
                          setIsInvoiceModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Monthly Bill</span>
                      </button>
                    </div>

                    {savedInvoices.length === 0 ? (
                      <div className="p-8 text-center space-y-3">
                        <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                        <p className="text-sm font-semibold text-slate-400">
                          Abhi tak is party ke liye koi Monthly Bill generate nahi hua hai.
                        </p>
                        <button
                          onClick={() => {
                            setInvoicePartyId(cust?.id || '');
                            setIsInvoiceModalOpen(true);
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow inline-flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Generate First Monthly Bill (18% GST)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                            <tr>
                              <th className="p-3.5">Invoice No.</th>
                              <th className="p-3.5">Invoice Date</th>
                              <th className="p-3.5">Billing Period</th>
                              <th className="p-3.5">Total LR Items</th>
                              <th className="p-3.5">Freight Taxable (₹)</th>
                              <th className="p-3.5">GST (18%) (₹)</th>
                              <th className="p-3.5">Net Invoice Total (₹)</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-center">Monthly Bill Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            {savedInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-3.5 whitespace-nowrap">
                                  <span className="font-mono font-bold text-amber-400 text-sm">
                                    {inv.invoiceNo}
                                  </span>
                                </td>
                                <td className="p-3.5 whitespace-nowrap text-slate-400">
                                  {inv.invoiceDate}
                                </td>
                                <td className="p-3.5 whitespace-nowrap font-medium text-slate-200">
                                  {inv.monthYear}
                                </td>
                                <td className="p-3.5 whitespace-nowrap font-bold text-slate-200">
                                  {inv.lrCount || inv.selectedLrIds?.length || 0} LRs
                                </td>
                                <td className="p-3.5 whitespace-nowrap font-semibold text-slate-200">
                                  ₹{(inv.totalFreight || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 whitespace-nowrap text-amber-300 font-semibold">
                                  ₹{((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0)).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 whitespace-nowrap font-extrabold text-emerald-400 text-sm">
                                  ₹{(inv.netPayableAmount || inv.invoiceValue || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      inv.status === 'Fully Paid'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : inv.status === 'Partially Paid'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}
                                  >
                                    {inv.status || 'Unpaid'}
                                  </span>
                                </td>
                                <td className="p-3.5 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => {
                                      setInvoicePartyId(cust?.id || '');
                                      setIsInvoiceModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Print Monthly Bill</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* View Mode 3: Combined / All Parties Table */}
          {(selectedCustomerId === 'ALL' || partyBillSubTab === 'ALL_SUMMARY') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white">
                    LR Bill-Wise Outstanding & Freight Due Breakdown
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setInvoicePartyId(selectedCustomerId !== 'ALL' ? selectedCustomerId : customers[0]?.id || '');
                      setIsInvoiceModalOpen(true);
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded shadow-sm flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Generate Monthly Bill (18% GST)</span>
                  </button>

                  <button
                    onClick={handleExportBillWiseCSV}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Excel Sheet</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="p-3.5">Bill / LR No.</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Party / Customer</th>
                      <th className="p-3.5">Truck No.</th>
                      <th className="p-3.5">Route</th>
                      <th className="p-3.5">Freight Amount</th>
                      <th className="p-3.5">Advance Received</th>
                      <th className="p-3.5">Payments Recd</th>
                      <th className="p-3.5">LR Due Amount (₹)</th>
                      <th className="p-3.5">Payment Type</th>
                      <th className="p-3.5">Tracking No.</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {billWiseLRs.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-500">
                          No LR entries found for selected customer filter.
                        </td>
                      </tr>
                    ) : (
                      billWiseLRs.map((lr) => {
                        const dueInfo = getLRDueDetails(lr);
                        const additionalPayments = dueInfo.totalReceived - lr.advance;

                        return (
                          <tr key={lr.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-mono font-bold text-amber-400 text-sm block">
                                {lr.lrNumber}
                              </span>
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-slate-400">
                              {lr.bookingDate}
                            </td>

                            <td className="p-3.5 max-w-[200px]">
                              <div className="font-bold text-white truncate">{lr.partyName}</div>
                            </td>

                            <td className="p-3.5 whitespace-nowrap font-mono font-bold text-amber-300">
                              {lr.vehicleNumber}
                            </td>

                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-semibold">{lr.pickupLocation}</span>
                              <span className="text-orange-400 mx-1">→</span>
                              <span>{lr.deliveryLocation}</span>
                            </td>

                            <td className="p-3.5 whitespace-nowrap font-extrabold text-white">
                              ₹{lr.freight.toLocaleString('en-IN')}
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-emerald-400 font-semibold">
                              ₹{lr.advance.toLocaleString('en-IN')}
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-teal-300 font-semibold">
                              ₹{additionalPayments.toLocaleString('en-IN')}
                            </td>

                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`text-base font-extrabold ${
                                  dueInfo.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                ₹{dueInfo.dueAmount.toLocaleString('en-IN')}
                              </span>
                              {dueInfo.dueAmount === 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                  Settled
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-slate-300 font-medium">
                              {lr.paymentType}
                            </td>

                            <td className="p-3.5 whitespace-nowrap font-mono text-indigo-300 font-bold">
                              {lr.trackingNumber || `DPW-IN-${lr.lrNumber.replace(/\D/g, '')}`}
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-center space-x-1">
                              <button
                                onClick={() => {
                                  if (onOpenTracking) onOpenTracking(lr);
                                }}
                                title="Live Tracking"
                                className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Navigation className="h-3.5 w-3.5 text-indigo-300" />
                                <span>Track</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedBiltyLR(lr);
                                  setIsBiltyModalOpen(true);
                                  if (onOpenBilty) onOpenBilty(lr);
                                }}
                                title="View & Print Bilty"
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="h-3.5 w-3.5 text-amber-400" />
                                <span>Bilty</span>
                              </button>

                              {dueInfo.dueAmount > 0 && (
                                <button
                                  onClick={() => {
                                    if (onOpenPayment) onOpenPayment(lr);
                                  }}
                                  title="Record Payment"
                                  className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <IndianRupee className="h-3.5 w-3.5" />
                                  <span>Pay</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Customer Outstanding Balance Summary */}
      {activeReportTab === 'OUTSTANDING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white text-sm">Party Wise Consolidated Balance Summary</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Shows actual LR bill balances and opening balances for each party. Click Edit to adjust actual balance or opening balance.
              </p>
            </div>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Total Parties: {customers.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Party / Customer Name</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">Credit Terms</th>
                  <th className="p-3.5 text-right">Opening Bal</th>
                  <th className="p-3.5 text-right">Net Outstanding</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {customers.map((c) => {
                  const out = StorageService.calculateCustomerOutstanding(c.id, c.name);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/50">
                      <td className="p-3.5 font-mono text-amber-400 font-bold">{c.code}</td>
                      <td className="p-3.5 font-bold text-white">
                        <div>{c.name}</div>
                        {c.mobile && <div className="text-[11px] text-slate-400 font-normal">Ph: {c.mobile}</div>}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{c.gstNo || 'Unregistered'}</td>
                      <td className="p-3.5">{c.creditDays || 30} Days</td>
                      <td className="p-3.5 text-right font-mono text-slate-300">
                        ₹{(c.openingBalance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-rose-400 text-base">
                        ₹{out.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handleOpenEditCustomerModal(c)}
                          title="Edit Customer / Adjust Opening Balance"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onDeleteCustomer) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          title="Delete Party Entry"
                          className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenMonthlyInvoice) {
                              onOpenMonthlyInvoice(c.id);
                            } else {
                              setInvoicePartyId(c.id);
                              setIsInvoiceModalOpen(true);
                            }
                          }}
                          title="Open Tax Invoice Statement"
                          className="px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Freight Booking History */}
      {activeReportTab === 'FREIGHT_SUMMARY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="p-3.5">LR Number</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Party</th>
                  <th className="p-3.5">Route</th>
                  <th className="p-3.5">Total Freight</th>
                  <th className="p-3.5">Advance</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {lrEntries.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/50">
                    <td className="p-3.5 font-mono font-bold text-amber-400">{l.lrNumber}</td>
                    <td className="p-3.5 text-slate-400">{l.bookingDate}</td>
                    <td className="p-3.5 font-semibold text-white">{l.partyName}</td>
                    <td className="p-3.5">{l.pickupLocation} → {l.deliveryLocation}</td>
                    <td className="p-3.5 font-bold text-white">₹{l.freight.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-emerald-400 font-semibold">
                      ₹{l.advance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-rose-400 font-bold">
                      ₹{l.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-semibold">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Driver Trip Ledger */}
      {activeReportTab === 'DRIVER_LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="p-3.5">Driver Name</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Driving Licence</th>
                  <th className="p-3.5">Assigned Vehicle</th>
                  <th className="p-3.5">Total Trips Completed</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {drivers.map((d) => {
                  const driverTrips = lrEntries.filter((l) => l.driverName === d.name);
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-white">{d.name}</td>
                      <td className="p-3.5">{d.mobile}</td>
                      <td className="p-3.5 font-mono text-amber-300">{d.licenceNo}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-200">
                        {d.assignedVehicleNo || 'Unassigned'}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">{driverTrips.length} Trips</td>
                      <td className="p-3.5">{d.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Payment Receipts History */}
      {activeReportTab === 'PAYMENT_COLLECTIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="p-3.5">Receipt Ref</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">LR Number</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Amount Collected</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50">
                    <td className="p-3.5 font-mono text-amber-300 font-bold">{p.referenceNo}</td>
                    <td className="p-3.5 text-slate-400">{p.paymentDate}</td>
                    <td className="p-3.5 font-mono font-bold text-orange-400">{p.lrNumber}</td>
                    <td className="p-3.5 font-semibold text-white">{p.customerName}</td>
                    <td className="p-3.5 font-medium">{p.paymentMode}</td>
                    <td className="p-3.5 font-extrabold text-emerald-400 text-base">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-slate-400">{p.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Edit / Balance Adjust Modal */}
      {isCustomerEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                <span>Edit Customer Party & Balance Details</span>
              </h3>
              <button
                onClick={() => setIsCustomerEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Party Code *</label>
                  <input
                    type="text"
                    value={custCode}
                    onChange={(e) => setCustCode(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Party / Customer Name *</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white font-bold rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GST Number</label>
                  <input
                    type="text"
                    value={custGst}
                    onChange={(e) => setCustGst(e.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={custOpeningBalance}
                    onChange={(e) => setCustOpeningBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Set to 0 if previous balance is fully settled.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={custCreditLimit}
                    onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg shadow-md"
                >
                  Save Customer Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Tax Invoice Modal */}
      <MonthlyTaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        lrEntries={lrEntries}
        customers={customers}
        company={companySettings}
        initialPartyId={invoicePartyId}
      />

      {/* Single Bilty Print & View Modal */}
      <BiltyModal
        lr={isBiltyModalOpen ? selectedBiltyLR : null}
        onClose={() => {
          setIsBiltyModalOpen(false);
          setSelectedBiltyLR(null);
        }}
        company={companySettings}
      />

    </div>
  );
};
