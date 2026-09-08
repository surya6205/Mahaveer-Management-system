import React from 'react';
import {
  LayoutDashboard,
  PackageCheck,
  Navigation,
  Users,
  UserCheck,
  Truck,
  CreditCard,
  BarChart3,
  TrendingUp,
  Database,
  MapPin,
  Shield,
  LogOut,
  Building2
} from 'lucide-react';
import { AuthSession } from '../types';
import { PermissionsService } from '../utils/permissions';

export type TabType =
  | 'dashboard'
  | 'lr_entry'
  | 'tracking'
  | 'location_rates'
  | 'customers'
  | 'drivers'
  | 'vehicles'
  | 'payments'
  | 'profit_loss'
  | 'reports'
  | 'backup';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lrCount: number;
  runningCount: number;
  expiringCount: number;
  currentSession?: AuthSession | null;
  onOpenAdminSettings?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lrCount,
  runningCount,
  expiringCount,
  currentSession,
  onOpenAdminSettings,
  onLogout
}) => {
  const isTransport = currentSession?.companyId === 'mahaveer_transport';
  const userRole = currentSession?.role || 'admin';

  const rawMenuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'lr_entry' as TabType,
      label: 'Booking / LR Entry',
      icon: PackageCheck,
      badge: lrCount ? `${lrCount}` : null,
      badgeColor: isTransport ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      id: 'tracking' as TabType,
      label: 'Live Tracking (DP World)',
      icon: Navigation,
      badge: null
    },
    {
      id: 'location_rates' as TabType,
      label: 'Location Rate Master',
      icon: MapPin,
      badge: null
    },
    {
      id: 'customers' as TabType,
      label: 'Customer Master',
      icon: Users,
      badge: null
    },
    {
      id: 'drivers' as TabType,
      label: 'Driver Master',
      icon: UserCheck,
      badge: expiringCount > 0 ? `${expiringCount} Alert` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'vehicles' as TabType,
      label: 'Vehicle Fleet Master',
      icon: Truck,
      badge: null
    },
    {
      id: 'payments' as TabType,
      label: 'Payment Collection',
      icon: CreditCard,
      badge: null
    },
    {
      id: 'profit_loss' as TabType,
      label: 'Profit & Loss (P&L)',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'reports' as TabType,
      label: 'Reports & Statements',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'backup' as TabType,
      label: 'Cloud Sync & Backup',
      icon: Database,
      badge: null
    }
  ];

  // Role-Based Filtering
  const menuItems = rawMenuItems.filter((item) => PermissionsService.isTabAllowed(item.id, userRole));

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between">
      <div className="p-4 space-y-1">
        {/* Active Company Status Box */}
        <div className={`p-3 mb-3 rounded-xl border text-xs flex items-center justify-between ${
          isTransport
            ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
            : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            <div className="font-bold tracking-wide truncate">
              {currentSession?.companyName || (isTransport ? 'MAHAVEER TRANSPORT' : 'MAHAVEER LOGISTICS')}
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
          TMS Core Modules
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? isTransport
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-2">
        {/* Admin Settings Button */}
        {onOpenAdminSettings && (
          <button
            onClick={onOpenAdminSettings}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-amber-400" />
              <span>Admin Security</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Password
            </span>
          </button>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Switch Company / Logout</span>
          </button>
        )}

        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-orange-400">
            <Truck className="h-4 w-4" />
            <span>Active Trips: {runningCount}</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Company-isolated live cloud sync enabled.
          </p>
        </div>
      </div>
    </aside>
  );
};

