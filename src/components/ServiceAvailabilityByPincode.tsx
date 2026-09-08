import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Upload,
  X,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  FileText,
  Copy,
  Check,
  ChevronDown,
  Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PincodeRecord, initialPincodes } from '../data/pincodesData';

interface ServiceAvailabilityByPincodeProps {
  currentCompanyId?: string;
}

interface ImportSummary {
  totalScanned: number;
  addedCount: number;
  duplicateCount: number;
  invalidCount: number;
  duplicates: Array<{ pincode: string; reason: string }>;
  invalidItems: Array<{ raw: string; reason: string }>;
}

export const ServiceAvailabilityByPincode: React.FC<ServiceAvailabilityByPincodeProps> = ({
  currentCompanyId = 'mahaveer_logistics'
}) => {
  const effectiveId = currentCompanyId || 'mahaveer_logistics';
  const storageKey = `tms_pincodes_v2_${effectiveId}`;

  const [pincodes, setPincodes] = useState<PincodeRecord[]>(() => {
    // Purge old demo storage keys if they exist with old demo items
    const oldDemoKey = localStorage.getItem('tms_pincodes');
    if (oldDemoKey) {
      try {
        const oldParsed = JSON.parse(oldDemoKey);
        // If it has old demo sample pins, clean it
        if (Array.isArray(oldParsed) && oldParsed.some((p: any) => p.id?.startsWith('pin-121001'))) {
          localStorage.removeItem('tms_pincodes');
        }
      } catch (e) {}
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved pincodes', e);
      }
    }
    return initialPincodes;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'STD' | 'ODA' | 'Non-Serviceable'>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState<PincodeRecord | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Single Add / Edit Form State
  const [formPin, setFormPin] = useState('');
  const [formStatus, setFormStatus] = useState<'STD' | 'ODA' | 'Non-Serviceable'>('STD');
  const [formCityState, setFormCityState] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Bulk Import Tab & Upload State
  const [bulkTab, setBulkTab] = useState<'EXCEL' | 'TEXT'>('EXCEL');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkDefaultStatus, setBulkDefaultStatus] = useState<'STD' | 'ODA' | 'Non-Serviceable'>('STD');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Result Summary Modal
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);

  // Save to LocalStorage whenever company or pincodes state changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(pincodes));
  }, [pincodes, storageKey]);

  // Handle single pin search check
  const searchedRecord = searchQuery.trim().length === 6
    ? pincodes.find((p) => p.pincode === searchQuery.trim())
    : null;

  // Filtered List for Table
  const filteredList = pincodes.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.pincode.toLowerCase().includes(q) ||
      (item.cityState && item.cityState.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Counts
  const totalCount = pincodes.length;
  const stdCount = pincodes.filter((p) => p.status === 'STD').length;
  const odaCount = pincodes.filter((p) => p.status === 'ODA').length;
  const nonServCount = pincodes.filter((p) => p.status === 'Non-Serviceable').length;

  const handleOpenAddModal = (item?: PincodeRecord) => {
    if (item) {
      setEditingPincode(item);
      setFormPin(item.pincode);
      setFormStatus(item.status);
      setFormCityState(item.cityState || '');
      setFormNotes(item.notes || '');
    } else {
      setEditingPincode(null);
      setFormPin('');
      setFormStatus('STD');
      setFormCityState('');
      setFormNotes('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveSinglePincode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = formPin.trim().replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      alert('Please enter a valid 6-digit Pincode (Numbers only).');
      return;
    }

    if (editingPincode) {
      setPincodes((prev) =>
        prev.map((p) =>
          p.id === editingPincode.id
            ? {
                ...p,
                pincode: cleanPin,
                status: formStatus,
                cityState: formCityState.trim(),
                notes: formNotes.trim()
              }
            : p
        )
      );
      setIsAddModalOpen(false);
    } else {
      // Check duplicate
      const existing = pincodes.find((p) => p.pincode === cleanPin);
      if (existing) {
        alert(`Pincode ${cleanPin} already exists in the system with status: ${existing.status} (${existing.cityState || 'India'}).`);
        return;
      }

      const newRecord: PincodeRecord = {
        id: `pin-${cleanPin}-${Date.now()}`,
        pincode: cleanPin,
        status: formStatus,
        cityState: formCityState.trim(),
        notes: formNotes.trim()
      };

      setPincodes((prev) => [newRecord, ...prev]);
      setIsAddModalOpen(false);
    }
  };

  const handleDeletePincode = (id: string, pincode: string) => {
    if (confirm(`Are you sure you want to delete Pincode ${pincode}?`)) {
      setPincodes((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleClearAllPincodes = () => {
    setPincodes([]);
    localStorage.setItem(storageKey, JSON.stringify([]));
    setIsClearAllConfirmOpen(false);
  };

  // Helper to normalize status strings
  const normalizeStatus = (val: any, fallback: 'STD' | 'ODA' | 'Non-Serviceable'): 'STD' | 'ODA' | 'Non-Serviceable' => {
    if (!val) return fallback;
    const str = String(val).trim().toUpperCase();
    if (str.includes('ODA') || str.includes('OUT OF') || str.includes('OUT_OF') || str.includes('REMOTE')) {
      return 'ODA';
    }
    if (str.includes('NON') || str.includes('NOT') || str.includes('UNSERVICEABLE') || str.includes('NO')) {
      return 'Non-Serviceable';
    }
    if (str.includes('STD') || str.includes('STANDARD') || str.includes('SERVICEABLE') || str.includes('YES') || str.includes('DIRECT')) {
      return 'STD';
    }
    return fallback;
  };

  // Process Excel Workbook / ArrayBuffer
  const processExcelFile = async (file: File) => {
    setIsProcessingFile(true);
    setSelectedFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        alert('The uploaded Excel file contains no worksheets.');
        setIsProcessingFile(false);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (!rows || rows.length === 0) {
        alert('The uploaded sheet is empty. Please add rows with pincodes.');
        setIsProcessingFile(false);
        return;
      }

      const existingPinMap = new Map<string, PincodeRecord>();
      pincodes.forEach((p) => existingPinMap.set(p.pincode, p));

      const newPins: PincodeRecord[] = [];
      const duplicates: Array<{ pincode: string; reason: string }> = [];
      const invalidItems: Array<{ raw: string; reason: string }> = [];
      const seenInFile = new Set<string>();

      let rowCount = 0;

      rows.forEach((row, idx) => {
        rowCount++;
        // Find key for pincode
        const keys = Object.keys(row);
        const pinKey = keys.find((k) => {
          const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            lower === 'pincode' ||
            lower === 'pin' ||
            lower === 'pincodeno' ||
            lower === 'postalcode' ||
            lower === 'zip' ||
            lower === 'zipcode'
          );
        }) || keys[0];

        const rawPinValue = String(row[pinKey] || '').trim();
        const cleanPin = rawPinValue.replace(/\D/g, '');

        if (!cleanPin || cleanPin.length !== 6) {
          invalidItems.push({
            raw: rawPinValue || `Row #${idx + 2} (Empty)`,
            reason: 'Not a valid 6-digit numeric pin code'
          });
          return;
        }

        // Check if duplicate within file
        if (seenInFile.has(cleanPin)) {
          duplicates.push({
            pincode: cleanPin,
            reason: `Duplicate row in uploaded file (Row #${idx + 2})`
          });
          return;
        }
        seenInFile.add(cleanPin);

        // Check if duplicate with existing DB
        if (existingPinMap.has(cleanPin)) {
          const existing = existingPinMap.get(cleanPin);
          duplicates.push({
            pincode: cleanPin,
            reason: `Already exists in system (${existing?.status} - ${existing?.cityState || 'India'})`
          });
          return;
        }

        // Status field
        const statusKey = keys.find((k) => {
          const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return lower === 'status' || lower === 'servicestatus' || lower === 'type' || lower === 'serviceability';
        });
        const status = normalizeStatus(row[statusKey || ''], bulkDefaultStatus);

        // City & State fields
        const cityKey = keys.find((k) => {
          const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return lower === 'city' || lower === 'district' || lower === 'citystate' || lower === 'location' || lower === 'area';
        });
        const stateKey = keys.find((k) => {
          const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return lower === 'state' || lower === 'region';
        });

        let cityState = '';
        if (cityKey && stateKey && cityKey !== stateKey && row[cityKey] && row[stateKey]) {
          cityState = `${String(row[cityKey]).trim()}, ${String(row[stateKey]).trim()}`;
        } else if (cityKey && row[cityKey]) {
          cityState = String(row[cityKey]).trim();
        } else if (stateKey && row[stateKey]) {
          cityState = String(row[stateKey]).trim();
        }

        // Remarks / Notes field
        const notesKey = keys.find((k) => {
          const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return lower === 'remarks' || lower === 'remark' || lower === 'notes' || lower === 'note' || lower === 'comment';
        });
        const notes = notesKey && row[notesKey] ? String(row[notesKey]).trim() : '';

        const newRecord: PincodeRecord = {
          id: `pin-${cleanPin}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pincode: cleanPin,
          status,
          cityState: cityState || undefined,
          notes: notes || undefined
        };

        newPins.push(newRecord);
        existingPinMap.set(cleanPin, newRecord);
      });

      // Apply newly imported pins to state
      if (newPins.length > 0) {
        setPincodes((prev) => [...newPins, ...prev]);
      }

      // Display summary report
      setImportSummary({
        totalScanned: rowCount,
        addedCount: newPins.length,
        duplicateCount: duplicates.length,
        invalidCount: invalidItems.length,
        duplicates,
        invalidItems
      });

      setIsBulkModalOpen(false);
      setSelectedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error reading excel file:', err);
      alert(`Failed to parse Excel file: ${err?.message || 'Unknown format'}. Please ensure it is a valid .xlsx or .xls file.`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle Text/CSV input parsing
  const handleTextBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split(/[\n,;]+/);
    const existingPinMap = new Map<string, PincodeRecord>();
    pincodes.forEach((p) => existingPinMap.set(p.pincode, p));

    const newPins: PincodeRecord[] = [];
    const duplicates: Array<{ pincode: string; reason: string }> = [];
    const invalidItems: Array<{ raw: string; reason: string }> = [];
    const seenInFile = new Set<string>();

    let rowCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      rowCount++;

      const parts = trimmed.split(/\s+/);
      const rawPin = parts[0].replace(/\D/g, '');

      if (!rawPin || rawPin.length !== 6) {
        invalidItems.push({
          raw: trimmed,
          reason: 'Not a valid 6-digit numeric pin code'
        });
        return;
      }

      if (seenInFile.has(rawPin)) {
        duplicates.push({
          pincode: rawPin,
          reason: 'Duplicate within input text'
        });
        return;
      }
      seenInFile.add(rawPin);

      if (existingPinMap.has(rawPin)) {
        const existing = existingPinMap.get(rawPin);
        duplicates.push({
          pincode: rawPin,
          reason: `Already exists in system (${existing?.status} - ${existing?.cityState || 'India'})`
        });
        return;
      }

      let status = bulkDefaultStatus;
      if (parts.length > 1) {
        status = normalizeStatus(parts[1], bulkDefaultStatus);
      }

      const notes = parts.length > 2 ? parts.slice(2).join(' ') : '';

      const newRecord: PincodeRecord = {
        id: `pin-${rawPin}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pincode: rawPin,
        status,
        notes: notes || undefined
      };

      newPins.push(newRecord);
      existingPinMap.set(rawPin, newRecord);
    });

    if (newPins.length > 0) {
      setPincodes((prev) => [...newPins, ...prev]);
    }

    setImportSummary({
      totalScanned: rowCount,
      addedCount: newPins.length,
      duplicateCount: duplicates.length,
      invalidCount: invalidItems.length,
      duplicates,
      invalidItems
    });

    setIsBulkModalOpen(false);
    setBulkInput('');
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    try {
      const sampleData = [
        {
          PINCODE: '121001',
          STATUS: 'STD',
          CITY_STATE: 'Faridabad, Haryana',
          REMARKS: 'Standard delivery area'
        },
        {
          PINCODE: '125048',
          STATUS: 'ODA',
          CITY_STATE: 'Hisar Rural, Haryana',
          REMARKS: 'Extra ODA delivery charges'
        },
        {
          PINCODE: '182143',
          STATUS: 'Non-Serviceable',
          CITY_STATE: 'Kishtwar, J&K',
          REMARKS: 'Hilly terrain non-serviceable'
        },
        {
          PINCODE: '302001',
          STATUS: 'STD',
          CITY_STATE: 'Jaipur, Rajasthan',
          REMARKS: 'Hub delivery center'
        },
        {
          PINCODE: '400001',
          STATUS: 'STD',
          CITY_STATE: 'Mumbai, Maharashtra',
          REMARKS: 'Direct transport route'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pincodes');

      // Auto-size columns
      ws['!cols'] = [
        { wch: 14 },
        { wch: 18 },
        { wch: 28 },
        { wch: 32 }
      ];

      XLSX.writeFile(wb, 'Pincode_Import_Template.xlsx');
    } catch (e) {
      console.error('Failed to generate template:', e);
      alert('Failed to download template. Please try again.');
    }
  };

  // Export current list to Excel
  const handleExportCurrentPincodes = () => {
    if (pincodes.length === 0) {
      alert('No pin codes available to export.');
      return;
    }

    try {
      const exportData = pincodes.map((p) => ({
        PINCODE: p.pincode,
        STATUS: p.status,
        CITY_STATE: p.cityState || '',
        REMARKS: p.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Active Pincodes');
      ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 32 }];

      XLSX.writeFile(wb, `Pincode_Master_${effectiveId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white">
              Pin Code Service Availability Directory
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant check for STD (Standard), ODA (Out of Delivery Area), or Non-Serviceable Pin Codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Sample Excel */}
          <button
            type="button"
            onClick={handleDownloadSampleTemplate}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Excel template for bulk import"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Excel Template</span>
          </button>

          {/* Bulk Import Excel */}
          <button
            type="button"
            onClick={() => {
              setBulkTab('EXCEL');
              setIsBulkModalOpen(true);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-200" />
            <span>+ Import Excel / Bulk</span>
          </button>

          {/* Single Add */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Pin Code</span>
          </button>

          {/* Export or Clear */}
          {pincodes.length > 0 && (
            <button
              type="button"
              onClick={handleExportCurrentPincodes}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
              title="Export all pin codes to Excel"
            >
              <Download className="h-4 w-4" />
            </button>
          )}

          {pincodes.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/50 rounded-lg text-xs transition-colors cursor-pointer"
              title="Clear all pin codes"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ALL'
              ? 'bg-slate-800 border-orange-500/70 shadow-md ring-1 ring-orange-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Total Pin Codes</span>
          <span className="text-xl font-mono font-extrabold text-white">{totalCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('STD')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'STD'
              ? 'bg-emerald-950/60 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase text-emerald-400 block">STD (Standard)</span>
          <span className="text-xl font-mono font-extrabold text-emerald-300">{stdCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('ODA')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ODA'
              ? 'bg-amber-950/60 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase text-amber-400 block">ODA (Out of Area)</span>
          <span className="text-xl font-mono font-extrabold text-amber-300">{odaCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('Non-Serviceable')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'Non-Serviceable'
              ? 'bg-rose-950/60 border-rose-500/70 shadow-md ring-1 ring-rose-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase text-rose-400 block">Non-Serviceable</span>
          <span className="text-xl font-mono font-extrabold text-rose-300">{nonServCount}</span>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Instant Check: Enter 6-digit Pincode (e.g. 121001, 302001) or City / State..."
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Live Search Indicator Box */}
        {searchQuery.trim().length === 6 && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              searchedRecord?.status === 'STD'
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                : searchedRecord?.status === 'ODA'
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                : searchedRecord?.status === 'Non-Serviceable'
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {searchedRecord?.status === 'STD' ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
              ) : searchedRecord?.status === 'ODA' ? (
                <AlertTriangle className="h-8 w-8 text-amber-400 shrink-0" />
              ) : searchedRecord?.status === 'Non-Serviceable' ? (
                <XCircle className="h-8 w-8 text-rose-400 shrink-0" />
              ) : (
                <MapPin className="h-8 w-8 text-slate-500 shrink-0" />
              )}

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Search Result for Pincode:
                </div>
                <div className="text-lg font-mono font-extrabold flex items-center gap-2">
                  <span>{searchQuery.trim()}</span>
                  {searchedRecord && (
                    <span className="text-xs font-normal opacity-90">
                      ({searchedRecord.cityState || 'India'})
                    </span>
                  )}
                </div>
                {searchedRecord?.notes && (
                  <p className="text-xs opacity-90 mt-0.5">{searchedRecord.notes}</p>
                )}
              </div>
            </div>

            <div>
              {searchedRecord ? (
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-block ${
                    searchedRecord.status === 'STD'
                      ? 'bg-emerald-500 text-slate-950'
                      : searchedRecord.status === 'ODA'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {searchedRecord.status === 'STD'
                    ? 'STD - Standard Serviceable'
                    : searchedRecord.status === 'ODA'
                    ? 'ODA - Out of Delivery Area'
                    : 'Non-Serviceable Region'}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    Not found in master directory
                  </span>
                  <button
                    onClick={() => {
                      setFormPin(searchQuery.trim());
                      handleOpenAddModal();
                    }}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
                  >
                    + Add Pin {searchQuery.trim()}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pincode Records Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Pincode Directory Master</span>
            <span className="text-xs text-slate-400 font-medium">
              (Showing {filteredList.length} of {pincodes.length})
            </span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'ALL' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('STD')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'STD' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              STD ({stdCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ODA')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'ODA' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ODA ({odaCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Non-Serviceable')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'Non-Serviceable' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Non-Serviceable ({nonServCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px] font-semibold sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-3">PIN CODE</th>
                <th className="p-3">SERVICE STATUS</th>
                <th className="p-3">CITY / STATE / REGION</th>
                <th className="p-3">REMARKS / NOTES</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    <div className="max-w-md mx-auto space-y-2">
                      <MapPin className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-slate-400 font-semibold text-sm">No pin codes found in the master list.</p>
                      <p className="text-xs text-slate-500">
                        Upload your Excel file with valid pin codes or click "+ Add Pin Code" to create new records.
                      </p>
                      <div className="pt-2 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkTab('EXCEL');
                            setIsBulkModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
                        >
                          Upload Excel File
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal()}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 cursor-pointer"
                        >
                          + Add Manually
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const badgeStyle =
                    item.status === 'STD'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : item.status === 'ODA'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-300 text-base">
                        {item.pincode}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-medium">
                        {item.cityState || 'India'}
                      </td>
                      <td className="p-3 text-slate-400 text-xs">
                        {item.notes || '-'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleOpenAddModal(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Pincode"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePincode(item.id, item.pincode)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Pincode"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal 1: Single Add / Edit Pincode */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-150">
            <div className="bg-slate-800 px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                {editingPincode ? `Edit Pincode: ${editingPincode.pincode}` : 'Add New Pincode'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSinglePincode} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Pin Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 121001"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Service Availability Status *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
                >
                  <option value="STD">STD - Standard Serviceable</option>
                  <option value="ODA">ODA - Out of Delivery Area</option>
                  <option value="Non-Serviceable">Non-Serviceable Region</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City / State / Region
                </label>
                <input
                  type="text"
                  value={formCityState}
                  onChange={(e) => setFormCityState(e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remarks / Delivery Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Special handling, extra ODA charge"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs rounded-lg shadow-md hover:from-orange-600 hover:to-amber-700 cursor-pointer"
                >
                  {editingPincode ? 'Update Record' : 'Save Pincode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Import Pincodes (Excel + Text Tab) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-800 px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Bulk Pin Code Import</h3>
                  <p className="text-[11px] text-slate-400">Import hundreds of pin codes via Excel file (.xlsx / .csv)</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab selector: Excel Upload vs Text Paste */}
            <div className="px-5 pt-3 flex items-center gap-2 border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setBulkTab('EXCEL')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bulkTab === 'EXCEL'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Upload Excel File (.xlsx / .xls)</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('TEXT')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bulkTab === 'TEXT'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Paste Text / Codes</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Default status selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Service Status for Rows Without Explicit Status
                </label>
                <select
                  value={bulkDefaultStatus}
                  onChange={(e) => setBulkDefaultStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none"
                >
                  <option value="STD">STD - Standard Serviceable (Default)</option>
                  <option value="ODA">ODA - Out of Delivery Area</option>
                  <option value="Non-Serviceable">Non-Serviceable Region</option>
                </select>
              </div>

              {bulkTab === 'EXCEL' ? (
                <div className="space-y-3">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processExcelFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processExcelFile(e.target.files[0]);
                        }
                      }}
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                    />

                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
                      <Upload className="h-6 w-6" />
                    </div>

                    <div>
                      <span className="text-sm font-bold text-white block">
                        {selectedFileName ? selectedFileName : 'Click to Browse or Drag & Drop Excel file'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Supports .xlsx, .xls, and .csv files
                      </span>
                    </div>

                    {isProcessingFile && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mt-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing and scanning pin codes...</span>
                      </div>
                    )}
                  </div>

                  {/* Template download & Format instructions */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Expected Excel Column Format:</span>
                      <button
                        type="button"
                        onClick={handleDownloadSampleTemplate}
                        className="text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Sample Sheet</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-slate-400 border border-slate-800 p-2 rounded-lg bg-slate-900">
                      <div className="text-amber-300 font-bold">PINCODE</div>
                      <div className="text-emerald-300 font-bold">STATUS</div>
                      <div className="text-slate-300 font-bold">CITY_STATE</div>
                      <div className="text-slate-400">REMARKS</div>
                      <div>121001</div>
                      <div>STD</div>
                      <div>Faridabad, HR</div>
                      <div>Regular</div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * Automatic duplicate check: Any existing pin codes in the system or duplicate rows in the file will be safely skipped.
                    </p>
                  </div>
                </div>
              ) : (
                /* Text Tab */
                <form onSubmit={handleTextBulkImport} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Paste Pin Codes (Line-by-line or Comma-separated)
                    </label>
                    <textarea
                      rows={7}
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder={`Example:\n121001\n122001 STD Gurugram\n125048 ODA Hisar Remote\n182143 Non-Serviceable Kishtwar\n302001, 302002, 302003`}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsBulkModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
                    >
                      Process Input
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Bulk Import Summary Report */}
      {importSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200">
            <div className="bg-slate-800 px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Pin Code Import Report</h3>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Scanned</span>
                  <span className="text-base font-extrabold text-white">{importSummary.totalScanned}</span>
                </div>

                <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/40 text-center">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase block">Imported (New)</span>
                  <span className="text-base font-extrabold text-emerald-300">+{importSummary.addedCount}</span>
                </div>

                <div className="bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/40 text-center">
                  <span className="text-[10px] text-amber-300 font-semibold uppercase block">Duplicate Skipped</span>
                  <span className="text-base font-extrabold text-amber-300">{importSummary.duplicateCount}</span>
                </div>

                <div className="bg-rose-950/60 p-2.5 rounded-xl border border-rose-500/40 text-center">
                  <span className="text-[10px] text-rose-300 font-semibold uppercase block">Invalid Skipped</span>
                  <span className="text-base font-extrabold text-rose-300">{importSummary.invalidCount}</span>
                </div>
              </div>

              {/* Status Notice */}
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300 font-bold block">
                    {importSummary.addedCount > 0
                      ? `Successfully added ${importSummary.addedCount} new pin codes to directory!`
                      : 'No new pin codes were added.'}
                  </strong>
                  <p className="text-[11px] text-emerald-100/90 mt-0.5">
                    {importSummary.duplicateCount > 0
                      ? `${importSummary.duplicateCount} duplicate pin codes were safely ignored to maintain system accuracy.`
                      : 'No duplicates encountered.'}
                  </p>
                </div>
              </div>

              {/* Duplicate Details Toggle */}
              {importSummary.duplicateCount > 0 && (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
                    className="w-full bg-slate-950 px-3.5 py-2 text-left font-semibold text-slate-300 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>View Duplicate Pin Codes ({importSummary.duplicateCount} Skipped)</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDuplicateDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {showDuplicateDetails && (
                    <div className="max-h-40 overflow-y-auto p-2.5 bg-slate-900 divide-y divide-slate-800 text-[11px]">
                      {importSummary.duplicates.map((dup, idx) => (
                        <div key={idx} className="py-1 flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-300">{dup.pincode}</span>
                          <span className="text-slate-400">{dup.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setImportSummary(null)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Clear All Confirmation */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-white text-base">Clear All Pin Codes?</h3>
            </div>
            <p className="text-xs text-slate-300">
              This will remove all {pincodes.length} pin codes from the current directory. You can import fresh pin codes from an Excel file at any time.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllPincodes}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
