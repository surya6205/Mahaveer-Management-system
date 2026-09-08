import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  X,
  FileText
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { FirebaseSyncService } from '../utils/firebaseSync';
import { CompanySettings } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  onRefreshData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  onSaveSettings,
  onRefreshData
}) => {
  if (!isOpen) return null;

  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [tagline, setTagline] = useState(companySettings.tagline);
  const [gstNo, setGstNo] = useState(companySettings.gstNo);
  const [panNo, setPanNo] = useState(companySettings.panNo);
  const [phone, setPhone] = useState(companySettings.phone);
  const [email, setEmail] = useState(companySettings.email);
  const [address, setAddress] = useState(companySettings.address);

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const lastBackupTime = StorageService.getLastBackupTime();

  const handleDownloadBackup = () => {
    StorageService.downloadBackupJSON();
  };

  const handleManualCloudSync = async () => {
    setSyncingCloud(true);
    try {
      await FirebaseSyncService.pushLocalToCloud();
      setImportStatus('✅ Multi-Device Cloud Sync Completed Successfully!');
      setTimeout(() => setImportStatus(null), 4000);
    } catch (e: any) {
      setImportStatus('Cloud sync error: ' + (e?.message || 'Failed'));
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = StorageService.restoreBackupJSON(json);
        if (success) {
          await FirebaseSyncService.pushLocalToCloud();
          setImportStatus('Backup restored & synced to cloud successfully!');
          onRefreshData();
        } else {
          setImportStatus('Invalid backup file format.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: CompanySettings = {
      companyName,
      tagline,
      gstNo,
      panNo,
      phone,
      email,
      address,
      terms: companySettings.terms
    };
    onSaveSettings(newSettings);
    await FirebaseSyncService.pushToCloud({ companySettings: newSettings });
    alert('Company details updated & synced across devices successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Multi-Device Cloud Sync & Transport Settings
              </h3>
              <p className="text-xs text-slate-400">
                Live synchronization between Phone, Laptop & Tablets with JSON export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Real-time Cloud Multi-Device Sync Status */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-200">
            <div className="flex items-start sm:items-center gap-3">
              <Cloud className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                  <span>Firebase Cloud Real-Time Sync Active</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                    LIVE
                  </span>
                </h4>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Any LR entry, payment, or customer updated on laptop will instantly reflect on your phone (and vice-versa).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleManualCloudSync}
                disabled={syncingCloud}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-md shrink-0 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                <span>{syncingCloud ? 'Syncing...' : 'Sync Cloud Now'}</span>
              </button>

              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-lg shadow-md shrink-0 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Section 2: Restore Backup from File */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Upload className="h-4 w-4 text-orange-400" />
              <span>Restore Data From JSON Backup File</span>
            </h4>
            <p className="text-xs text-slate-400">
              Upload a previously downloaded `.json` backup file to restore full transport data and sync it to the cloud.
            </p>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Select Backup File (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <span className="text-xs font-medium text-emerald-400">{importStatus}</span>
              )}
            </div>
          </div>

          {/* Section 3: Company Master Profile */}
          <form onSubmit={handleSaveCompany} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Transport Company Bilty Header & GST Settings</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Numbers
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Office Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Save & Sync Company Info
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

