import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CreditCard,
  X,
  IndianRupee,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Search,
  Building,
  ChevronDown,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Customer, LREntry, PaymentReceipt, SavedMonthlyInvoice } from '../types';
import { StorageService } from '../utils/storage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePayment: (payment: PaymentReceipt) => void;
  selectedLR?: LREntry | null;
  editingPayment?: PaymentReceipt | null;
  allLRs: LREntry[];
  customers?: Customer[];
  monthlyInvoices?: SavedMonthlyInvoice[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSavePayment,
  selectedLR,
  editingPayment,
  allLRs = [],
  customers = [],
  monthlyInvoices
}) => {
  if (!isOpen) return null;

  const [paymentTarget, setPaymentTarget] = useState<'MONTHLY_BILL' | 'INDIVIDUAL_LR'>('MONTHLY_BILL');

  // Stored Invoices
  const [savedInvoices, setSavedInvoices] = useState<SavedMonthlyInvoice[]>(() => {
    const list = monthlyInvoices || StorageService.getMonthlyInvoices();
    return list.filter((inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54');
  });

  // Selected Monthly Invoice & LR
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [lrId, setLrId] = useState('');
  const [lrNumber, setLrNumber] = useState('');

  // Party Selection & Autocomplete Search
  const [selectedPartyName, setSelectedPartyName] = useState<string>('');
  const [partySearchInput, setPartySearchInput] = useState<string>('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState<boolean>(false);
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  // Common payment fields
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentReceipt['paymentMode']>('NEFT/RTGS');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Sync invoices from props or storage when opened
  useEffect(() => {
    const list = monthlyInvoices || StorageService.getMonthlyInvoices();
    const cleanList = list.filter((inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54');
    setSavedInvoices(cleanList);
  }, [isOpen, monthlyInvoices]);

  // Build unique sorted list of all known Parties from Customers, LRs, and Saved Invoices
  const allParties = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code?: string; gstNo?: string; billCount: number; lrCount: number }>();

    // 1. From Customer Master
    customers.forEach((c) => {
      if (c && c.name) {
        const key = c.name.trim().toLowerCase();
        map.set(key, {
          id: c.id,
          name: c.name.trim(),
          code: c.code,
          gstNo: c.gstNo,
          billCount: 0,
          lrCount: 0
        });
      }
    });

    // 2. Count & add from Saved Monthly Invoices
    savedInvoices.forEach((inv) => {
      if (inv && inv.partyName) {
        const key = inv.partyName.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.billCount += 1;
        } else {
          map.set(key, {
            id: inv.partyId || `party-${Date.now()}`,
            name: inv.partyName.trim(),
            gstNo: inv.gstNo,
            billCount: 1,
            lrCount: 0
          });
        }
      }
    });

    // 3. Count & add from All LRs
    allLRs.forEach((lr) => {
      if (lr && lr.partyName) {
        const key = lr.partyName.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.lrCount += 1;
        } else {
          map.set(key, {
            id: lr.partyId || `party-${Date.now()}`,
            name: lr.partyName.trim(),
            billCount: 0,
            lrCount: 1
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, savedInvoices, allLRs]);

  // Autocomplete Suggestions for Party Input
  const partySuggestions = useMemo(() => {
    if (!partySearchInput.trim()) return allParties;
    const query = partySearchInput.toLowerCase().trim();
    return allParties.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.gstNo && p.gstNo.toLowerCase().includes(query))
    );
  }, [allParties, partySearchInput]);

  // Close party dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Saved Invoices by selected party
  const filteredInvoices = useMemo(() => {
    if (!selectedPartyName) return savedInvoices;
    const partyLower = selectedPartyName.toLowerCase().trim();
    return savedInvoices.filter((inv) => inv.partyName.toLowerCase().trim() === partyLower);
  }, [savedInvoices, selectedPartyName]);

  // Filter LRs by selected party
  const filteredLRs = useMemo(() => {
    if (!selectedPartyName) return allLRs;
    const partyLower = selectedPartyName.toLowerCase().trim();
    return allLRs.filter((lr) => lr.partyName.toLowerCase().trim() === partyLower);
  }, [allLRs, selectedPartyName]);

  // Selected Monthly Invoice Object
  const currentInvoice = useMemo(() => {
    if (selectedInvoiceId) {
      return savedInvoices.find((inv) => inv.id === selectedInvoiceId) || null;
    }
    return filteredInvoices[0] || null;
  }, [savedInvoices, filteredInvoices, selectedInvoiceId]);

  const currentInvoiceRemainingDue = currentInvoice
    ? Math.max(0, currentInvoice.netPayableAmount - (currentInvoice.paidAmount || 0))
    : 0;

  // Selected LR Object
  const currentLR = useMemo(() => {
    if (lrId) {
      return allLRs.find((l) => l.id === lrId) || null;
    }
    return filteredLRs[0] || null;
  }, [allLRs, filteredLRs, lrId]);

  // Initial populate on open or edit
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const invoices = StorageService.getMonthlyInvoices().filter(
      (inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54'
    );
    setSavedInvoices(invoices);

    if (editingPayment) {
      if (editingPayment.monthlyInvoiceId) {
        setPaymentTarget('MONTHLY_BILL');
        setSelectedInvoiceId(editingPayment.monthlyInvoiceId);
      } else {
        setPaymentTarget('INDIVIDUAL_LR');
        setLrId(editingPayment.lrId || '');
        setLrNumber(editingPayment.lrNumber || '');
      }
      setSelectedPartyName(editingPayment.customerName);
      setPartySearchInput(editingPayment.customerName);
      setCustomerName(editingPayment.customerName);
      setAmount(editingPayment.amount);
      setPaymentDate(editingPayment.paymentDate || today);
      setPaymentMode(editingPayment.paymentMode);
      setReferenceNo(editingPayment.referenceNo);
      setRemarks(editingPayment.remarks);
    } else if (selectedLR) {
      setPaymentTarget('INDIVIDUAL_LR');
      setSelectedPartyName(selectedLR.partyName);
      setPartySearchInput(selectedLR.partyName);
      setCustomerName(selectedLR.partyName);
      setPaymentDate(today);
      setLrId(selectedLR.id);
      setLrNumber(selectedLR.lrNumber);
      setAmount(selectedLR.balance > 0 ? selectedLR.balance : selectedLR.freight);
      setRemarks(`Freight collection against LR ${selectedLR.lrNumber}`);
    } else if (invoices.length > 0) {
      setPaymentTarget('MONTHLY_BILL');
      const unpaidInv = invoices.find((inv) => inv.status !== 'Fully Paid') || invoices[0];
      setSelectedPartyName(unpaidInv.partyName);
      setPartySearchInput(unpaidInv.partyName);
      setSelectedInvoiceId(unpaidInv.id);
      setCustomerName(unpaidInv.partyName);
      const remainingDue = Math.max(0, unpaidInv.netPayableAmount - (unpaidInv.paidAmount || 0));
      setAmount(remainingDue);
      setPaymentDate(today);
      setRemarks(`Payment collection against Monthly Tax Bill ${unpaidInv.invoiceNo}`);
    } else if (allLRs.length > 0) {
      setPaymentTarget('INDIVIDUAL_LR');
      setPaymentDate(today);
      const firstWithBalance = allLRs.find((l) => l.balance > 0) || allLRs[0];
      setSelectedPartyName(firstWithBalance.partyName);
      setPartySearchInput(firstWithBalance.partyName);
      setLrId(firstWithBalance.id);
      setLrNumber(firstWithBalance.lrNumber);
      setCustomerName(firstWithBalance.partyName);
      setAmount(firstWithBalance.balance > 0 ? firstWithBalance.balance : firstWithBalance.freight);
      setRemarks(`Freight collection against ${firstWithBalance.lrNumber}`);
    } else {
      setPaymentDate(today);
    }
  }, [selectedLR, editingPayment, isOpen]);

  // Handler when user selects a party from Auto-suggestions
  const handleSelectParty = (party: { name: string; code?: string }) => {
    setSelectedPartyName(party.name);
    setPartySearchInput(party.name);
    setCustomerName(party.name);
    setIsPartyDropdownOpen(false);

    if (paymentTarget === 'MONTHLY_BILL') {
      const partyInvoices = savedInvoices.filter(
        (inv) => inv.partyName.toLowerCase().trim() === party.name.toLowerCase().trim()
      );
      if (partyInvoices.length > 0) {
        const topUnpaid = partyInvoices.find((inv) => inv.status !== 'Fully Paid') || partyInvoices[0];
        setSelectedInvoiceId(topUnpaid.id);
        const due = Math.max(0, topUnpaid.netPayableAmount - (topUnpaid.paidAmount || 0));
        setAmount(due);
        setRemarks(`Payment collection against Monthly Tax Bill ${topUnpaid.invoiceNo}`);
      } else {
        setSelectedInvoiceId('');
        setAmount(0);
        setRemarks(`Payment collection for ${party.name}`);
      }
    } else {
      const partyLRs = allLRs.filter(
        (l) => l.partyName.toLowerCase().trim() === party.name.toLowerCase().trim()
      );
      if (partyLRs.length > 0) {
        const topLR = partyLRs.find((l) => l.balance > 0) || partyLRs[0];
        setLrId(topLR.id);
        setLrNumber(topLR.lrNumber);
        setAmount(topLR.balance > 0 ? topLR.balance : topLR.freight);
        setRemarks(`Freight collection against ${topLR.lrNumber}`);
      } else {
        setLrId('');
        setLrNumber('');
        setAmount(0);
        setRemarks(`Freight payment for ${party.name}`);
      }
    }
  };

  // Handler when user types manually in party search input
  const handlePartyInputChange = (val: string) => {
    setPartySearchInput(val);
    setCustomerName(val);
    setIsPartyDropdownOpen(true);

    // If exact match with an existing party, set it
    const exact = allParties.find((p) => p.name.toLowerCase().trim() === val.toLowerCase().trim());
    if (exact) {
      setSelectedPartyName(exact.name);
    } else {
      setSelectedPartyName(val.trim());
    }
  };

  // Clear selected party to show all
  const handleClearPartyFilter = () => {
    setSelectedPartyName('');
    setPartySearchInput('');
    setCustomerName('');
    setIsPartyDropdownOpen(false);
    if (paymentTarget === 'MONTHLY_BILL' && savedInvoices.length > 0) {
      setSelectedInvoiceId(savedInvoices[0].id);
      setCustomerName(savedInvoices[0].partyName);
      const due = Math.max(0, savedInvoices[0].netPayableAmount - (savedInvoices[0].paidAmount || 0));
      setAmount(due);
    } else if (allLRs.length > 0) {
      setLrId(allLRs[0].id);
      setLrNumber(allLRs[0].lrNumber);
      setCustomerName(allLRs[0].partyName);
      setAmount(allLRs[0].balance > 0 ? allLRs[0].balance : allLRs[0].freight);
    }
  };

  // Handler when user selects a monthly bill
  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const found = savedInvoices.find((inv) => inv.id === invId);
    if (found) {
      setSelectedPartyName(found.partyName);
      setPartySearchInput(found.partyName);
      setCustomerName(found.partyName);
      const remaining = Math.max(0, found.netPayableAmount - (found.paidAmount || 0));
      setAmount(remaining);
      setRemarks(`Payment collection against Monthly Tax Bill ${found.invoiceNo}`);
    }
  };

  // Handler when user selects a single LR
  const handleLRSelect = (selectedId: string) => {
    setLrId(selectedId);
    const found = allLRs.find((l) => l.id === selectedId);
    if (found) {
      setSelectedPartyName(found.partyName);
      setPartySearchInput(found.partyName);
      setLrNumber(found.lrNumber);
      setCustomerName(found.partyName);
      setAmount(found.balance > 0 ? found.balance : found.freight);
      setRemarks(`Freight collection against ${found.lrNumber}`);
    }
  };

  // Switch between Monthly Bill and Single LR tab
  const handleSwitchTab = (tab: 'MONTHLY_BILL' | 'INDIVIDUAL_LR') => {
    setPaymentTarget(tab);
    if (tab === 'MONTHLY_BILL') {
      const available = filteredInvoices.length > 0 ? filteredInvoices : savedInvoices;
      if (available.length > 0) {
        const top = available.find((inv) => inv.status !== 'Fully Paid') || available[0];
        setSelectedInvoiceId(top.id);
        setSelectedPartyName(top.partyName);
        setPartySearchInput(top.partyName);
        setCustomerName(top.partyName);
        const remaining = Math.max(0, top.netPayableAmount - (top.paidAmount || 0));
        setAmount(remaining);
        setRemarks(`Payment collection against Monthly Tax Bill ${top.invoiceNo}`);
      } else {
        setSelectedInvoiceId('');
        setAmount(0);
      }
    } else {
      const available = filteredLRs.length > 0 ? filteredLRs : allLRs;
      if (available.length > 0) {
        const top = available.find((l) => l.balance > 0) || available[0];
        setLrId(top.id);
        setLrNumber(top.lrNumber);
        setSelectedPartyName(top.partyName);
        setPartySearchInput(top.partyName);
        setCustomerName(top.partyName);
        setAmount(top.balance > 0 ? top.balance : top.freight);
        setRemarks(`Freight collection against ${top.lrNumber}`);
      } else {
        setLrId('');
        setLrNumber('');
        setAmount(0);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount (amount must be greater than 0)');
      return;
    }

    const effectiveCustomer = customerName.trim() || selectedPartyName.trim() || 'Customer';

    let savedPayment: PaymentReceipt;

    if (paymentTarget === 'MONTHLY_BILL' && currentInvoice) {
      savedPayment = {
        id: editingPayment ? editingPayment.id : `pay-${Date.now()}`,
        monthlyInvoiceId: currentInvoice.id,
        monthlyInvoiceNo: currentInvoice.invoiceNo,
        lrId: currentInvoice.selectedLrIds[0] || '',
        lrNumber: `Bill-${currentInvoice.invoiceNo}`,
        customerName: effectiveCustomer,
        amount: Number(amount),
        paymentDate,
        paymentMode,
        referenceNo: referenceNo.trim() || `REF-${Date.now().toString().slice(-6)}`,
        remarks: remarks.trim() || `Payment against Monthly Bill ${currentInvoice.invoiceNo}`
      };

      // Update Saved Monthly Invoice in LocalStorage
      const updatedInvoices = savedInvoices.map((inv) => {
        if (inv.id === currentInvoice.id) {
          const newPaid = (inv.paidAmount || 0) + Number(amount);
          const newStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid' =
            newPaid >= inv.netPayableAmount ? 'Fully Paid' : 'Partially Paid';
          return {
            ...inv,
            paidAmount: newPaid,
            status: newStatus
          };
        }
        return inv;
      });
      StorageService.saveMonthlyInvoices(updatedInvoices);
    } else {
      savedPayment = {
        id: editingPayment ? editingPayment.id : `pay-${Date.now()}`,
        lrId: lrId || (currentLR ? currentLR.id : ''),
        lrNumber: lrNumber || (currentLR ? currentLR.lrNumber : 'MANUAL'),
        customerName: effectiveCustomer,
        amount: Number(amount),
        paymentDate,
        paymentMode,
        referenceNo: referenceNo.trim() || `REF-${Date.now().toString().slice(-6)}`,
        remarks: remarks.trim()
      };
    }

    onSavePayment(savedPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Record Payment Collection</h3>
              <p className="text-xs text-slate-400">Party-wise auto-suggestion & bill settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* Target Selector: Monthly Bill vs Single LR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Against Reference *
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchTab('MONTHLY_BILL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentTarget === 'MONTHLY_BILL'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Monthly Bill (मंथली बिल)</span>
                {savedInvoices.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900/60 text-amber-200">
                    {filteredInvoices.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('INDIVIDUAL_LR')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentTarget === 'INDIVIDUAL_LR'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Single LR / Bilty</span>
                {allLRs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900/60 text-amber-200">
                    {filteredLRs.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Party Name with Interactive Auto-Suggestion Dropdown */}
          <div ref={partyDropdownRef} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-amber-400" />
                <span>Party / Customer Name (Auto-Suggestion) *</span>
              </label>
              {selectedPartyName && (
                <button
                  type="button"
                  onClick={handleClearPartyFilter}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Show All Parties</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={partySearchInput}
                onChange={(e) => handlePartyInputChange(e.target.value)}
                onFocus={() => setIsPartyDropdownOpen(true)}
                placeholder="Type party name to search (e.g. Pioneer, Mahaveer...)"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 pl-9 text-sm text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-500"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setIsPartyDropdownOpen(!isPartyDropdownOpen)}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Auto-suggestions Dropdown list */}
            {isPartyDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-700/60">
                <div className="px-3 py-1.5 bg-slate-900/90 text-[10px] uppercase tracking-wider font-bold text-slate-400 flex justify-between items-center sticky top-0">
                  <span>Matching Parties ({partySuggestions.length})</span>
                  <span>Click to select</span>
                </div>

                {partySuggestions.length > 0 ? (
                  partySuggestions.map((party) => {
                    const isSelected =
                      selectedPartyName.toLowerCase().trim() === party.name.toLowerCase().trim();
                    return (
                      <button
                        key={party.id}
                        type="button"
                        onClick={() => handleSelectParty(party)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-700/80 transition-colors ${
                          isSelected ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Building className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate text-white">{party.name}</p>
                            {party.code && (
                              <p className="text-[10px] text-slate-400">{party.code}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {party.billCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                              {party.billCount} Bill{party.billCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {party.lrCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-mono font-bold">
                              {party.lrCount} LR{party.lrCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-1" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No matching party found. You can continue typing to record payment.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Monthly Bill Selector for Selected Party */}
          {paymentTarget === 'MONTHLY_BILL' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>
                  Select Saved Monthly Tax Bill *{' '}
                  {selectedPartyName ? (
                    <span className="text-amber-400">({filteredInvoices.length} bills for {selectedPartyName})</span>
                  ) : (
                    <span className="text-slate-400">({savedInvoices.length} total saved bills)</span>
                  )}
                </span>
              </label>

              {filteredInvoices.length > 0 ? (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  {filteredInvoices.map((inv) => {
                    const due = Math.max(0, inv.netPayableAmount - (inv.paidAmount || 0));
                    return (
                      <option key={inv.id} value={inv.id}>
                        Bill #{inv.invoiceNo} — {inv.partyName} ({inv.monthYear}) [Total: ₹
                        {inv.netPayableAmount.toLocaleString('en-IN')} | Due: ₹
                        {due.toLocaleString('en-IN')}] — {inv.status}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-200 space-y-2">
                  <p className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>
                      {selectedPartyName
                        ? `No saved monthly tax bills found for "${selectedPartyName}".`
                        : 'No saved monthly bills found in system.'}
                    </span>
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    You can generate a bill from <strong>Monthly Tax Invoice</strong>, or switch to <strong>Single LR / Bilty</strong> mode to record freight payment against individual LR.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('INDIVIDUAL_LR')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    Switch to Single LR / Bilty Mode →
                  </button>
                </div>
              )}

              {currentInvoice && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Selected Invoice:</span>
                    <strong className="text-amber-400 font-mono font-bold">
                      Bill #{currentInvoice.invoiceNo} ({currentInvoice.monthYear})
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Party / Consignor:</span>
                    <strong className="text-white font-bold">{currentInvoice.partyName}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Total Bill Net Payable:</span>
                    <span className="font-mono text-white font-bold">
                      ₹{currentInvoice.netPayableAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Already Received / Paid:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₹{(currentInvoice.paidAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-sm font-extrabold">
                    <span className="text-amber-400">Current Outstanding Due:</span>
                    <span className="font-mono text-rose-400">
                      ₹{currentInvoiceRemainingDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual LR Selector for Selected Party */}
          {paymentTarget === 'INDIVIDUAL_LR' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>
                  Select Booking / LR Entry *{' '}
                  {selectedPartyName ? (
                    <span className="text-amber-400">({filteredLRs.length} LRs for {selectedPartyName})</span>
                  ) : (
                    <span className="text-slate-400">({allLRs.length} total LRs)</span>
                  )}
                </span>
              </label>

              {filteredLRs.length > 0 ? (
                <select
                  value={lrId}
                  onChange={(e) => handleLRSelect(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  {filteredLRs.map((lr) => (
                    <option key={lr.id} value={lr.id}>
                      {lr.lrNumber} — {lr.partyName} ({lr.fromLocation} → {lr.toLocation}) [Freight: ₹
                      {lr.freight.toLocaleString('en-IN')} | Bal: ₹{lr.balance.toLocaleString('en-IN')}]
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                  No individual LR entries found for "{selectedPartyName || 'All Parties'}".
                </div>
              )}

              {currentLR && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Route & Date:</span>
                    <span className="text-white font-medium">
                      {currentLR.fromLocation} → {currentLR.toLocation} ({currentLR.bookingDate})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Total Freight:</span>
                    <span className="font-mono text-white">₹{currentLR.freight.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Advance Received:</span>
                    <span className="font-mono text-emerald-400">₹{currentLR.advance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-sm font-bold">
                    <span className="text-amber-400">Pending Balance:</span>
                    <span className="font-mono text-rose-400">₹{currentLR.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Collected Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                step="any"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-base font-extrabold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Payment Mode & Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="NEFT/RTGS">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash Collection</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reference / UTR / Cheque No.
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. UTR120984812"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Payment Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Remarks / Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Full settlement for invoice 26-27/54"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
            />
          </div>

          {/* Full vs Short Settlement Indicator */}
          {paymentTarget === 'MONTHLY_BILL' && currentInvoice && amount > 0 && (
            <div className="pt-1">
              {amount >= currentInvoiceRemainingDue ? (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>Full Settlement:</strong> This payment of ₹{amount.toLocaleString('en-IN')} fully clears Bill #{currentInvoice.invoiceNo}. Status will update to <strong>Fully Paid</strong>.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>Part Settlement:</strong> ₹{amount.toLocaleString('en-IN')} entered. Remaining short due on Bill #{currentInvoice.invoiceNo} will be <strong className="text-rose-300">₹{(currentInvoiceRemainingDue - amount).toLocaleString('en-IN')}</strong>. Status will update to <strong>Partially Paid</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Payment & Update Ledger</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
