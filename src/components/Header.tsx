import React, { useState, useRef, useEffect } from 'react';
import {
  Truck,
  Cloud,
  PlusCircle,
  Search,
  RefreshCw,
  Shield,
  LogOut,
  Building2,
  User,
  Settings,
  X,
  FileText,
  Navigation,
  ChevronRight,
  PackageCheck,
  CheckCircle2,
  Clock,
  Menu
} from 'lucide-react';
import { CompanySettings, AuthSession, LREntry } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  companySettings?: CompanySettings;
  lrEntries?: LREntry[];
  onOpenNewLR: () => void;
  onOpenBackupModal: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenBilty?: (lr: LREntry) => void;
  onOpenTrackingModal?: (trackNo: string) => void;
  onOpenTracking?: (lr: LREntry) => void;
  onNavigateToTab?: (tab: string) => void;
  cloudSyncStatus?: 'connected' | 'syncing' | 'offline';
  onForceCloudSync?: () => void;
  isCloudSyncing?: boolean;
  lastSyncedTime?: string;
  currentSession?: AuthSession | null;
  onOpenAdminSettings?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companySettings,
  lrEntries = [],
  onOpenNewLR,
  onOpenBackupModal,
  searchTerm,
  setSearchTerm,
  onOpenBilty,
  onOpenTrackingModal,
  onOpenTracking,
  onNavigateToTab,
  cloudSyncStatus = 'connected',
  onForceCloudSync,
  isCloudSyncing = false,
  lastSyncedTime,
  currentSession,
  onOpenAdminSettings,
  onOpenProfile,
  onLogout,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const company = companySettings || {
    companyName: 'Mahaveer Logistics',
    tagline: 'Transport & Logistics Management System',
    gstNo: '08AJAPJ9522F1ZC'
  };

  const isTransport = currentSession?.companyId === 'mahaveer_transport';
  const handleProfileClick = onOpenProfile || onOpenAdminSettings;

  // Filter matching LRs for instant dropdown
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const searchResults = trimmedSearch.length > 0
    ? lrEntries.filter((lr) => {
        return (
          lr.lrNumber.toLowerCase().includes(trimmedSearch) ||
          (lr.invoiceNumber && lr.invoiceNumber.toLowerCase().includes(trimmedSearch)) ||
          (lr.trackingNumber && lr.trackingNumber.toLowerCase().includes(trimmedSearch)) ||
          lr.partyName.toLowerCase().includes(trimmedSearch) ||
          (lr.consignorName && lr.consignorName.toLowerCase().includes(trimmedSearch)) ||
          (lr.consigneeName && lr.consigneeName.toLowerCase().includes(trimmedSearch)) ||
          (lr.vehicleNumber && lr.vehicleNumber.toLowerCase().includes(trimmedSearch)) ||
          (lr.driverName && lr.driverName.toLowerCase().includes(trimmedSearch)) ||
          (lr.pickupLocation && lr.pickupLocation.toLowerCase().includes(trimmedSearch)) ||
          (lr.deliveryLocation && lr.deliveryLocation.toLowerCase().includes(trimmedSearch))
        );
      }).slice(0, 6)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchDropdownOpen(false);
      if (searchResults.length === 1 && onOpenBilty) {
        onOpenBilty(searchResults[0]);
      } else if (onNavigateToTab) {
        onNavigateToTab('lr_entry');
      }
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Company Brand & Logo */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Mobile Hamburger Drawer Toggle */}
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shrink-0 cursor-pointer"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-amber-400" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}

            {company.logoUrl ? (
              <div 
                onClick={handleProfileClick}
                className="h-11 w-14 sm:w-16 bg-white rounded-xl p-1 flex items-center justify-center shadow-md border border-slate-700 overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to edit Company Logo & Profile"
              >
                <img
                  src={company.logoUrl}
                  alt={company.companyName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl shadow-lg flex items-center justify-center shrink-0 bg-gradient-to-tr from-indigo-600 to-sky-600 shadow-indigo-500/20">
                <Truck className="h-6 w-6 text-white" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-sans uppercase">
                  {company.companyName || (isTransport ? 'Mahaveer Transport' : 'Mahaveer Logistics')}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isTransport
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {isTransport ? 'UNIT 2 (TRANSPORT)' : 'UNIT 1 (LOGISTICS)'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {company.tagline || 'Transport & Logistics Management System'} • GST: {company.gstNo || 'N/A'}
              </p>
            </div>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Global Search Input with Live Results Dropdown */}
            <div ref={searchContainerRef} className="relative flex-1 sm:w-56 md:w-64 min-w-[180px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search LR No, Party, Truck..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-lg pl-9 pr-7 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Instant Search Results Dropdown */}
              {isSearchDropdownOpen && trimmedSearch.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-xs max-h-[380px] overflow-y-auto">
                  <div className="p-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Found <strong className="text-white">{searchResults.length}</strong> matching records
                    </span>
                    {onNavigateToTab && (
                      <button
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          onNavigateToTab('lr_entry');
                        }}
                        className="text-indigo-400 hover:underline font-semibold"
                      >
                        Open in LR Manager →
                      </button>
                    )}
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      <p>No matching LR found for <strong className="text-slate-200">"{searchTerm}"</strong></p>
                      <p className="text-[11px] text-slate-500 mt-1">Try searching by partial LR number (e.g. 1005), Party name, or Truck number.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80">
                      {searchResults.map((lr) => (
                        <div
                          key={lr.id}
                          className="p-2.5 hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-sky-300">
                                {lr.lrNumber}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                                lr.status === 'Delivered'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : lr.status === 'In Transit'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              }`}>
                                {lr.status}
                              </span>
                              {lr.date && (
                                <span className="text-[10px] text-slate-400">
                                  {lr.date}
                                </span>
                              )}
                            </div>

                            <p className="text-slate-200 font-semibold truncate mt-0.5">
                              {lr.consignorName || lr.partyName}
                              {(lr.consigneeName || lr.deliveryLocation) && (
                                <span className="text-slate-400 font-normal"> → {lr.consigneeName || lr.deliveryLocation}</span>
                              )}
                            </p>

                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {lr.vehicleNumber && <span>Truck: <strong className="text-slate-300">{lr.vehicleNumber}</strong></span>}
                              {lr.totalFreight && <span>Freight: <strong className="text-emerald-400 font-mono">₹{lr.totalFreight.toLocaleString('en-IN')}</strong></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {onOpenBilty && (
                              <button
                                onClick={() => {
                                  setIsSearchDropdownOpen(false);
                                  onOpenBilty(lr);
                                }}
                                className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                title="Open Bilty View / Print"
                              >
                                <FileText className="h-3 w-3" />
                                <span>Bilty</span>
                              </button>
                            )}

                            {(onOpenTrackingModal || onOpenTracking) && (
                              <button
                                onClick={() => {
                                  setIsSearchDropdownOpen(false);
                                  if (onOpenTrackingModal) onOpenTrackingModal(lr.lrNumber);
                                  else if (onOpenTracking) onOpenTracking(lr);
                                }}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-[11px] cursor-pointer"
                                title="Track Shipment"
                              >
                                <Navigation className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length > 0 && onNavigateToTab && (
                    <div className="p-2 bg-slate-950 text-center border-t border-slate-800">
                      <button
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          onNavigateToTab('lr_entry');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        View all results in Booking Manager →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PWA Install Button (Android / iOS / Desktop) */}
            <PWAInstallButton />

            {/* Live Cloud Multi-Device Sync Button */}
            <button
              onClick={onForceCloudSync || onOpenBackupModal}
              title={lastSyncedTime ? `Last Synced: ${lastSyncedTime} (Tap to refresh live data from cloud)` : 'Tap to sync latest cloud data across Mobile & Laptop'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg text-xs font-semibold text-emerald-300 transition-all cursor-pointer shadow-sm"
            >
              {isCloudSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              )}
              <span className="hidden lg:inline">
                {isCloudSyncing ? 'Syncing...' : 'Synced'}
              </span>
            </button>

            {/* User Profile Button / Avatar with Status */}
            {handleProfileClick && currentSession && (
              <button
                onClick={handleProfileClick}
                id="btn-header-profile"
                title="Manage User Profile, Password, Logo & Company Details"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs transition-all cursor-pointer shadow-sm group"
              >
                {currentSession.avatarUrl ? (
                  <img
                    src={currentSession.avatarUrl}
                    alt="User"
                    className="w-6 h-6 rounded-full object-cover border border-indigo-500"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-[11px]">
                    {(currentSession.fullName || currentSession.userId || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                    <span>{currentSession.fullName || currentSession.userId}</span>
                  </div>
                  <div className="text-[10px] text-indigo-300 font-semibold uppercase">
                    {currentSession.role || 'Admin'}
                  </div>
                </div>
              </button>
            )}

            {/* + New LR / Bilty Primary Button */}
            <button
              onClick={onOpenNewLR}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm rounded-lg shadow-md transition-all transform active:scale-95 text-white cursor-pointer ${
                isTransport
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-600/30'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/25'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ New LR</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout from company session"
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};



