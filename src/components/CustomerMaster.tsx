import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building2,
  Trash2,
  Edit,
  X,
  Paperclip,
  Check,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { Customer, CustomerDocument, LREntry, PaymentReceipt, SavedMonthlyInvoice } from '../types';
import { StorageService } from '../utils/storage';

interface CustomerMasterProps {
  customers: Customer[];
  lrEntries?: LREntry[];
  payments?: PaymentReceipt[];
  monthlyInvoices?: SavedMonthlyInvoice[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteSavedInvoice?: (id: string) => void;
  onDeleteMonthlyInvoice?: (id: string) => void;
  onOpenMonthlyInvoice?: (partyId: string) => void;
  searchTerm?: string;
}

export const CustomerMaster: React.FC<CustomerMasterProps> = ({
  customers = [],
  lrEntries = [],
  payments = [],
  monthlyInvoices,
  onSaveCustomer,
  onDeleteCustomer,
  onDeleteSavedInvoice,
  onDeleteMonthlyInvoice,
  onOpenMonthlyInvoice,
  searchTerm = ''
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [ledgerTab, setLedgerTab] = useState<'MONTHLY_SAVED' | 'LR_WISE'>('MONTHLY_SAVED');
  const [savedInvoicesList, setSavedInvoicesList] = useState<SavedMonthlyInvoice[]>(() => {
    const list = StorageService.getMonthlyInvoices();
    return list.filter((inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54');
  });

  // Sync saved invoices when ledger modal opens or props change
  useEffect(() => {
    const list = monthlyInvoices || StorageService.getMonthlyInvoices();
    setSavedInvoicesList(list.filter((inv) => inv.id !== 'inv-26-27-54' && inv.invoiceNo !== '26-27/54'));
  }, [ledgerCustomer, payments, monthlyInvoices]);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [pan, setPan] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [creditDays, setCreditDays] = useState(30);
  const [creditLimit, setCreditLimit] = useState(300000);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [docTitleInput, setDocTitleInput] = useState('');

  // Real-time calculation of customer outstanding balance strictly from actual LRs/Bilties & Payments
  const calculateRealtimeOutstanding = (cust: Customer): number => {
    // Filter LRs belonging to this customer
    const custLRs = lrEntries.filter((lr) => {
      return (
        (lr.partyId && lr.partyId === cust.id) ||
        lr.partyName.toLowerCase().trim() === cust.name.toLowerCase().trim()
      );
    });

    // If there is no Bilty/LR for this customer, outstanding is strictly 0
    if (custLRs.length === 0) {
      return 0;
    }

    const totalFreight = custLRs.reduce((acc, curr) => acc + (curr.freight || 0), 0);
    const totalAdvances = custLRs.reduce((acc, curr) => acc + (curr.advance || 0), 0);

    // Filter payments belonging to this customer / LRs
    const custLRIds = new Set(custLRs.map((l) => l.id));
    const custLRNos = new Set(custLRs.map((l) => l.lrNumber.trim()));

    const custPayments = payments.filter((p) => {
      if (p.customerName && p.customerName.toLowerCase().trim() === cust.name.toLowerCase().trim()) {
        return true;
      }
      if (p.lrId && custLRIds.has(p.lrId)) return true;
      if (p.lrNumber && custLRNos.has(p.lrNumber.trim())) return true;
      return false;
    });

    const totalCollectedPayments = custPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const netOutstanding = totalFreight - (totalAdvances + totalCollectedPayments);
    return Math.max(0, netOutstanding);
  };

  // Real-time calculation of payment collection stats for any Saved Monthly Invoice
  const getInvoiceDynamicStats = (inv: SavedMonthlyInvoice) => {
    // Collect all payments matching this invoice directly or via included LRs
    const matchedPayments = payments.filter((p) => {
      if (p.monthlyInvoiceId && p.monthlyInvoiceId === inv.id) return true;
      if (p.monthlyInvoiceNo && p.monthlyInvoiceNo.trim() === inv.invoiceNo.trim()) return true;
      if (inv.selectedLrIds && inv.selectedLrIds.length > 0) {
        if (p.lrId && inv.selectedLrIds.includes(p.lrId)) return true;
        if (p.lrNumber) {
          const matchingLR = lrEntries.find(
            (l) => inv.selectedLrIds.includes(l.id) && l.lrNumber.trim() === p.lrNumber.trim()
          );
          if (matchingLR) return true;
        }
      }
      return false;
    });

    const collected = matchedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const due = Math.max(0, inv.netPayableAmount - collected);
    const status: 'Unpaid' | 'Partially Paid' | 'Fully Paid' =
      due <= 0 && inv.netPayableAmount > 0
        ? 'Fully Paid'
        : collected > 0
        ? 'Partially Paid'
        : 'Unpaid';

    return { collected, due, status, paymentCount: matchedPayments.length };
  };

  const handleDeleteSavedInvoice = (invoiceId: string, invoiceNo: string) => {
    if (window.confirm(`Are you sure you want to delete saved monthly bill "${invoiceNo}"?`)) {
      const updated = savedInvoicesList.filter((inv) => inv.id !== invoiceId);
      StorageService.saveMonthlyInvoices(updated);
      setSavedInvoicesList(updated);
      onDeleteSavedInvoice?.(invoiceId);
    }
  };

  const effectiveSearch = (searchTerm || localSearch).toLowerCase();

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(effectiveSearch) ||
      c.code.toLowerCase().includes(effectiveSearch) ||
      c.gstNo.toLowerCase().includes(effectiveSearch) ||
      c.city.toLowerCase().includes(effectiveSearch) ||
      c.mobile.includes(effectiveSearch)
  );

  const generateAutoCustomerCode = (): string => {
    const existingNums = customers
      .map((c) => parseInt(c.code.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1001;
    return `CUST-${nextNum}`;
  };

  const handleOpenNewModal = () => {
    setEditingCustomer(null);
    setCode(generateAutoCustomerCode());
    setName('');
    setGstNo('');
    setPan('');
    setMobile('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('Maharashtra');
    setCreditDays(30);
    setCreditLimit(300000);
    setOpeningBalance(0);
    setDocuments([]);
    setIsModalOpen(true);
  };

  const handleEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setCode(customer.code);
    setName(customer.name);
    setGstNo(customer.gstNo);
    setPan(customer.pan);
    setMobile(customer.mobile);
    setEmail(customer.email);
    setAddress(customer.address);
    setCity(customer.city);
    setState(customer.state);
    setCreditDays(customer.creditDays);
    setCreditLimit(customer.creditLimit);
    setOpeningBalance(customer.openingBalance || 0);
    setDocuments(customer.documents || []);
    setIsModalOpen(true);
  };

  const handleAddDocument = () => {
    if (!docTitleInput.trim()) return;
    const newDoc: CustomerDocument = {
      id: `doc-${Date.now()}`,
      title: docTitleInput.trim(),
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setDocuments([...documents, newDoc]);
    setDocTitleInput('');
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments(documents.filter((d) => d.id !== docId));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      code: code || generateAutoCustomerCode(),
      name: name.trim(),
      gstNo: gstNo.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      creditDays: Number(creditDays) || 0,
      creditLimit: Number(creditLimit) || 0,
      openingBalance: Number(openingBalance) || 0,
      documents,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString().split('T')[0]
    };

    onSaveCustomer(newCustomer);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-400" />
            <h1 className="text-xl font-bold text-white">Customer / Party Master</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain customer records, GSTIN, PAN, credit limits, outstanding, & documents
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter Party, GST, City..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Party</span>
          </button>
        </div>
      </div>

      {/* Customer Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const outstanding = calculateRealtimeOutstanding(cust);
          const isOverLimit = cust.creditLimit > 0 && outstanding > cust.creditLimit;

          return (
            <div
              key={cust.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-orange-400 border border-slate-700 mb-1">
                      {cust.code}
                    </span>
                    <h2 className="text-base font-bold text-white leading-tight">{cust.name}</h2>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditModal(cust)}
                      title="Edit Customer"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(cust.id)}
                      title="Delete Customer"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Info List */}
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400">GST:</span>
                    <span className="font-mono text-slate-200">{cust.gstNo || 'Unregistered'}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">PAN:</span>
                    <span className="font-mono text-slate-200">{cust.pan || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-white">{cust.mobile || 'N/A'}</span>
                    {cust.email && <span className="text-slate-400 truncate">({cust.email})</span>}
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 line-clamp-1">
                      {cust.address ? `${cust.address}, ${cust.city}` : cust.city || cust.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-800 mt-2">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Credit Days & Limit</div>
                      <div className="font-semibold text-slate-200">
                        {cust.creditDays} Days • ₹{cust.creditLimit.toLocaleString('en-IN')}
                      </div>
                    </div>
                    {cust.documents && cust.documents.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                        <Paperclip className="h-3 w-3" />
                        <span>{cust.documents.length} Docs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Outstanding Footer Badge */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Current Outstanding</span>
                  <span
                    className={`text-base font-extrabold ${
                      outstanding > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ₹{outstanding.toLocaleString('en-IN')}
                  </span>
                  {isOverLimit && (
                    <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                      Exceeds Limit!
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setLedgerCustomer(cust)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Statement</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">
                  {editingCustomer ? 'Edit Customer Record' : 'Add New Customer / Party'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Code (Auto)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Party / Company Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tata Motors Freight Account"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="AAAAA0000A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Surat"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Gat No / Plot No, Industrial Estate..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Credit Days Allowed
                  </label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={(e) => setCreditDays(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Document Attachments Section */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Documents (GST, Agreement, PAN attachments)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={docTitleInput}
                    onChange={(e) => setDocTitleInput(e.target.value)}
                    placeholder="Document title e.g. Vendor Agreement 2026"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    + Attach
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {documents.map((d) => (
                    <span
                      key={d.id}
                      className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs border border-slate-700"
                    >
                      <Paperclip className="h-3 w-3 text-indigo-400" />
                      <span>{d.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(d.id)}
                        className="text-slate-400 hover:text-rose-400 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md transition-all"
                >
                  Save Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement / Ledger Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  Customer Ledger Statement: {ledgerCustomer.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Code: {ledgerCustomer.code} • GST: {ledgerCustomer.gstNo || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Credit Limit</span>
                  <span className="text-white font-bold text-sm">
                    ₹{ledgerCustomer.creditLimit.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Opening Balance</span>
                  <span className="text-white font-bold text-sm">
                    ₹{(ledgerCustomer.openingBalance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Outstanding</span>
                  <span className="text-rose-400 font-extrabold text-sm">
                    ₹{calculateRealtimeOutstanding(ledgerCustomer).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Tab Navigation inside Ledger Modal */}
              <div className="flex border-b border-slate-700 gap-2">
                <button
                  type="button"
                  onClick={() => setLedgerTab('MONTHLY_SAVED')}
                  className={`py-2 px-4 font-bold text-xs rounded-t-lg transition-all flex items-center gap-1.5 ${
                    ledgerTab === 'MONTHLY_SAVED'
                      ? 'bg-amber-500 text-slate-950 border-t-2 border-amber-400 shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Monthly Saved Ledger (मंथली सेव लेजर)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLedgerTab('LR_WISE')}
                  className={`py-2 px-4 font-bold text-xs rounded-t-lg transition-all flex items-center gap-1.5 ${
                    ledgerTab === 'LR_WISE'
                      ? 'bg-amber-500 text-slate-950 border-t-2 border-amber-400 shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Single LR-Wise Statement</span>
                </button>
              </div>

              {/* Monthly Saved Bills Tab */}
              {ledgerTab === 'MONTHLY_SAVED' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                      Saved Monthly Tax Invoices & Real-Time Collection Status
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Invoice Bill No.</th>
                          <th className="p-2.5">Date / Billing Month</th>
                          <th className="p-2.5">Trips Count</th>
                          <th className="p-2.5">Total Freight</th>
                          <th className="p-2.5">GST Tax</th>
                          <th className="p-2.5">Original Bill Value</th>
                          <th className="p-2.5">Collected Amount</th>
                          <th className="p-2.5">Short / Due Pending</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {savedInvoicesList
                          .filter(
                            (inv) =>
                              inv.partyId === ledgerCustomer.id ||
                              inv.partyName.toLowerCase().trim() === ledgerCustomer.name.toLowerCase().trim()
                          )
                          .map((inv) => {
                            const { collected, due, status, paymentCount } = getInvoiceDynamicStats(inv);
                            return (
                              <tr key={inv.id} className="hover:bg-slate-800/40">
                                <td className="p-2.5 font-mono text-amber-400 font-bold">{inv.invoiceNo}</td>
                                <td className="p-2.5">
                                  <span className="block text-white font-medium">{inv.invoiceDate}</span>
                                  <span className="text-[10px] text-slate-400">{inv.monthYear}</span>
                                </td>
                                <td className="p-2.5 font-bold text-slate-200">{inv.lrCount || inv.selectedLrIds?.length || 1} Trips</td>
                                <td className="p-2.5 font-semibold text-white">₹{inv.totalFreight.toLocaleString('en-IN')}</td>
                                <td className="p-2.5 text-slate-300">
                                  ₹{(inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toLocaleString('en-IN')}
                                </td>
                                <td className="p-2.5 font-extrabold text-amber-300">
                                  ₹{inv.netPayableAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2.5">
                                  <span className="font-extrabold text-emerald-400 block">
                                    ₹{collected.toLocaleString('en-IN')}
                                  </span>
                                  {paymentCount > 0 && (
                                    <span className="text-[10px] text-slate-400">
                                      ({paymentCount} receipt{paymentCount > 1 ? 's' : ''})
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-extrabold text-rose-400">
                                  ₹{due.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                      status === 'Fully Paid'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : status === 'Partially Paid'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right">
                                  <button
                                    onClick={() => handleDeleteSavedInvoice(inv.id, inv.invoiceNo)}
                                    title="Delete this saved monthly bill"
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                        {savedInvoicesList.filter(
                          (inv) =>
                            inv.partyId === ledgerCustomer.id ||
                            inv.partyName.toLowerCase().trim() === ledgerCustomer.name.toLowerCase().trim()
                        ).length === 0 && (
                          <tr>
                            <td colSpan={10} className="p-6 text-center text-slate-400">
                              No saved monthly bills found for {ledgerCustomer.name}. Generate and click "Save Monthly Bill" in the Monthly Tax Invoice screen.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Single LR-Wise Tab */}
              {ledgerTab === 'LR_WISE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-2">
                    <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                      Bill-Wise LR Freight & Due Breakdown
                    </h4>

                <button
                  onClick={() => {
                    const custLRs = lrEntries.filter(
                      (lr) =>
                        lr.partyId === ledgerCustomer.id ||
                        lr.partyName.toLowerCase() === ledgerCustomer.name.toLowerCase()
                    );
                    const headers = [
                      'LR Bill Number',
                      'Booking Date',
                      'Customer Name',
                      'Vehicle Number',
                      'Route',
                      'Material',
                      'Freight (INR)',
                      'Advance Paid (INR)',
                      'Net Due Payment (INR)',
                      'Payment Type',
                      'Status',
                      'DP World Tracking No.'
                    ];
                    const rows = custLRs.map((l) => [
                      l.lrNumber,
                      l.bookingDate,
                      l.partyName,
                      l.vehicleNumber,
                      `${l.pickupLocation} to ${l.deliveryLocation}`,
                      l.material,
                      l.freight,
                      l.advance,
                      l.balance,
                      l.paymentType,
                      l.status,
                      l.trackingNumber || `DPW-IN-${l.lrNumber.replace(/\D/g, '')}`
                    ]);
                    const csvContent =
                      'data:text/csv;charset=utf-8,' +
                      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${cell}"`).join(','))].join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute(
                      'download',
                      `Bill_Wise_Statement_${ledgerCustomer.name.replace(/\s+/g, '_')}_${Date.now()}.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download Bill-Wise Excel Statement</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">LR Bill No.</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Route</th>
                      <th className="p-2.5">Vehicle</th>
                      <th className="p-2.5">Freight</th>
                      <th className="p-2.5">Advance</th>
                      <th className="p-2.5">Due Payment</th>
                      <th className="p-2.5">Tracking No.</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {lrEntries
                      .filter(
                        (lr) =>
                          lr.partyId === ledgerCustomer.id ||
                          lr.partyName.toLowerCase() === ledgerCustomer.name.toLowerCase()
                      )
                      .map((lr) => (
                        <tr key={lr.id}>
                          <td className="p-2.5 font-mono text-amber-400 font-bold">{lr.lrNumber}</td>
                          <td className="p-2.5">{lr.bookingDate}</td>
                          <td className="p-2.5">{lr.pickupLocation} → {lr.deliveryLocation}</td>
                          <td className="p-2.5 font-mono text-amber-300 font-bold">{lr.vehicleNumber}</td>
                          <td className="p-2.5 font-semibold text-white">₹{lr.freight.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-emerald-400 font-semibold">₹{lr.advance.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-rose-400 font-extrabold">₹{lr.balance.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono text-indigo-300 text-[11px]">
                            {lr.trackingNumber || `DPW-IN-${lr.lrNumber.replace(/\D/g, '')}`}
                          </td>
                          <td className="p-2.5">{lr.status}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Statement generated automatically from active LR registers
              </span>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
