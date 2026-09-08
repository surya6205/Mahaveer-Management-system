import React, { useState } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  Filter,
  Printer,
  IndianRupee,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  ChevronRight,
  FileText,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { LREntry, LRStatus } from '../types';

interface LREntryListProps {
  lrEntries: LREntry[];
  onOpenNewLR: () => void;
  onEditLR: (lr: LREntry) => void;
  onDeleteLR: (id: string) => void;
  onSelectLRForBilty?: (lr: LREntry) => void;
  onOpenBilty?: (lr: LREntry) => void;
  onSelectLRForPayment?: (lr: LREntry) => void;
  onOpenPayment?: (lr?: LREntry) => void;
  onUpdateLRStatus?: (id: string, status: LRStatus) => void;
  onUpdateStatus?: (id: string, status: LRStatus) => void;
  searchTerm?: string;
  onOpenTrackingModal?: (trackingNo: string) => void;
  onOpenTracking?: (lr: LREntry) => void;
}

export const LREntryList: React.FC<LREntryListProps> = ({
  lrEntries = [],
  onOpenNewLR,
  onEditLR,
  onDeleteLR,
  onSelectLRForBilty,
  onOpenBilty,
  onSelectLRForPayment,
  onOpenPayment,
  onUpdateLRStatus,
  onUpdateStatus,
  searchTerm = '',
  onOpenTrackingModal,
  onOpenTracking
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const triggerBilty = (lr: LREntry) => {
    if (onSelectLRForBilty) onSelectLRForBilty(lr);
    else if (onOpenBilty) onOpenBilty(lr);
  };

  const triggerPayment = (lr: LREntry) => {
    if (onSelectLRForPayment) onSelectLRForPayment(lr);
    else if (onOpenPayment) onOpenPayment(lr);
  };

  const triggerStatusUpdate = (id: string, status: LRStatus) => {
    if (onUpdateLRStatus) onUpdateLRStatus(id, status);
    else if (onUpdateStatus) onUpdateStatus(id, status);
  };

  const triggerTracking = (lr: LREntry) => {
    if (onOpenTrackingModal) onOpenTrackingModal(lr.lrNumber);
    else if (onOpenTracking) onOpenTracking(lr);
  };

  const effectiveSearch = (localSearch.trim() || searchTerm.trim()).toLowerCase();

  const filteredEntries = lrEntries.filter((lr) => {
    if (!effectiveSearch) return statusFilter === 'ALL' || lr.status === statusFilter;

    const matchesSearch =
      lr.lrNumber.toLowerCase().includes(effectiveSearch) ||
      (lr.invoiceNumber && lr.invoiceNumber.toLowerCase().includes(effectiveSearch)) ||
      (lr.trackingNumber && lr.trackingNumber.toLowerCase().includes(effectiveSearch)) ||
      (lr.eWayBillNo && lr.eWayBillNo.toLowerCase().includes(effectiveSearch)) ||
      (lr.partyName && lr.partyName.toLowerCase().includes(effectiveSearch)) ||
      (lr.consignorName && lr.consignorName.toLowerCase().includes(effectiveSearch)) ||
      (lr.consigneeName && lr.consigneeName.toLowerCase().includes(effectiveSearch)) ||
      (lr.vehicleNumber && lr.vehicleNumber.toLowerCase().includes(effectiveSearch)) ||
      (lr.driverName && lr.driverName.toLowerCase().includes(effectiveSearch)) ||
      (lr.pickupLocation && lr.pickupLocation.toLowerCase().includes(effectiveSearch)) ||
      (lr.deliveryLocation && lr.deliveryLocation.toLowerCase().includes(effectiveSearch)) ||
      (lr.material && lr.material.toLowerCase().includes(effectiveSearch));

    const matchesStatus = statusFilter === 'ALL' || lr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Booking / LR Entry Manager</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage Lorry Receipts (Bilty), freight amounts, advances, balances, & delivery status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenNewLR}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create New LR (Bilty)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search LR No, Party, Truck, City..."
            className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All LRs' },
            { id: 'In Transit', label: 'In Transit' },
            { id: 'Pending Pickup', label: 'Pending' },
            { id: 'Delivered', label: 'Delivered' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LR Entry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-3.5">LR Number</th>
                <th className="p-3.5">Booking Date</th>
                <th className="p-3.5">Party / Customer</th>
                <th className="p-3.5">Route & Consignment</th>
                <th className="p-3.5">Truck & Driver</th>
                <th className="p-3.5">Freight Breakdown</th>
                <th className="p-3.5">Payment Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No LR bookings found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((lr) => {
                  const statusBadge =
                    lr.status === 'In Transit'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : lr.status === 'Delivered'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : lr.status === 'Pending Pickup'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700';

                  return (
                    <tr key={lr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-400 text-sm block">
                          {lr.lrNumber}
                        </span>
                        {lr.invoiceNumber && (
                          <span className="text-[10px] text-blue-300 font-mono font-bold block">
                            Inv: {lr.invoiceNumber}
                          </span>
                        )}
                        {lr.trackingNumber ? (
                          <span className="text-[10px] text-amber-300/90 font-mono font-semibold block">
                            Trk: {lr.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block">Auto generated</span>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {lr.bookingDate}
                      </td>

                      <td className="p-3.5 max-w-[180px]">
                        <div className="font-bold text-white truncate">{lr.partyName}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Consignor: {lr.consignorName || 'N/A'}
                        </div>
                      </td>

                      <td className="p-3.5 min-w-[200px]">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          <span>{lr.pickupLocation}</span>
                          <span className="text-indigo-400">→</span>
                          <span>{lr.deliveryLocation}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {lr.material} ({lr.quantity || `${lr.weight} ${lr.weightUnit}`})
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-amber-300 font-mono">{lr.vehicleNumber || '—'}</div>
                        <div className="text-[11px] text-slate-400">{lr.driverName || '—'}</div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-white">
                          ₹{lr.freight.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                          Adv: ₹{lr.advance.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-rose-400 font-bold">
                          Bal: ₹{lr.balance.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {lr.paymentType}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <select
                          value={lr.status}
                          onChange={(e) => triggerStatusUpdate(lr.id, e.target.value as LRStatus)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border focus:outline-none cursor-pointer ${statusBadge}`}
                        >
                          <option value="Pending Pickup" className="bg-slate-900 text-white">
                            Pending Pickup
                          </option>
                          <option value="In Transit" className="bg-slate-900 text-white">
                            In Transit
                          </option>
                          <option value="Delivered" className="bg-slate-900 text-white">
                            Delivered
                          </option>
                          <option value="Cancelled" className="bg-slate-900 text-white">
                            Cancelled
                          </option>
                        </select>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => triggerTracking(lr)}
                          title="Track Express Shipment Milestones & Google Map Route"
                          className="px-2.5 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                        >
                          <Navigation className="h-3.5 w-3.5 text-indigo-300" />
                          <span>Map Track</span>
                        </button>

                        <button
                          onClick={() => triggerBilty(lr)}
                          title="View / Print Bilty (Lorry Receipt)"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Bilty</span>
                        </button>

                        {lr.balance > 0 && (
                          <button
                            onClick={() => triggerPayment(lr)}
                            title="Record Payment Collection"
                            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <IndianRupee className="h-3.5 w-3.5" />
                            <span>Pay</span>
                          </button>
                        )}

                        <button
                          onClick={() => onEditLR(lr)}
                          title="Edit LR"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteLR(lr.id)}
                          title="Delete LR"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

    </div>
  );
};
