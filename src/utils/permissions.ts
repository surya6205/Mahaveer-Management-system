import { TabType } from '../components/Sidebar';

export type UserRole = 'admin' | 'manager' | 'operator' | 'staff';

export interface RoleDefinition {
  key: UserRole;
  title: string;
  badgeLabel: string;
  badgeColor: string;
  description: string;
  allowedTabs: TabType[];
  canDeleteRecords: boolean;
  canManageUsers: boolean;
  canManageBranches: boolean;
  canEditCompanyBank: boolean;
  canAccessFinancials: boolean;
  canEditLocationRates: boolean;
  canCreateLR: boolean;
  canEditLR: boolean;
  canUpdateTracking: boolean;
  canRecordPayments: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    key: 'admin',
    title: 'Administrator',
    badgeLabel: 'ADMIN (Full Access)',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Complete unrestricted access to all modules, billing, financials, settings, users, and branches.',
    allowedTabs: [
      'dashboard',
      'lr_entry',
      'tracking',
      'location_rates',
      'customers',
      'drivers',
      'vehicles',
      'payments',
      'profit_loss',
      'reports',
      'backup'
    ],
    canDeleteRecords: true,
    canManageUsers: true,
    canManageBranches: true,
    canEditCompanyBank: true,
    canAccessFinancials: true,
    canEditLocationRates: true,
    canCreateLR: true,
    canEditLR: true,
    canUpdateTracking: true,
    canRecordPayments: true
  },
  manager: {
    key: 'manager',
    title: 'Branch Manager',
    badgeLabel: 'MANAGER (Operations)',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Full operations management: bookings, vehicles, drivers, customer records, payments, and operational reports.',
    allowedTabs: [
      'dashboard',
      'lr_entry',
      'tracking',
      'location_rates',
      'customers',
      'drivers',
      'vehicles',
      'payments',
      'reports'
    ],
    canDeleteRecords: true,
    canManageUsers: false,
    canManageBranches: false,
    canEditCompanyBank: false,
    canAccessFinancials: true,
    canEditLocationRates: true,
    canCreateLR: true,
    canEditLR: true,
    canUpdateTracking: true,
    canRecordPayments: true
  },
  operator: {
    key: 'operator',
    title: 'Billing Operator',
    badgeLabel: 'OPERATOR (LR & Billing)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Dedicated to LR/Bilty booking, rate lookup, invoice generation, customer entries, and payment collection receipts.',
    allowedTabs: [
      'dashboard',
      'lr_entry',
      'tracking',
      'location_rates',
      'customers',
      'drivers',
      'vehicles',
      'payments'
    ],
    canDeleteRecords: false,
    canManageUsers: false,
    canManageBranches: false,
    canEditCompanyBank: false,
    canAccessFinancials: false,
    canEditLocationRates: false,
    canCreateLR: true,
    canEditLR: true,
    canUpdateTracking: true,
    canRecordPayments: true
  },
  staff: {
    key: 'staff',
    title: 'Dispatch Staff',
    badgeLabel: 'STAFF (Dispatch & Support)',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Trip dispatch, delivery status tracking, POD uploads, vehicle availability check, and driver coordination.',
    allowedTabs: [
      'dashboard',
      'lr_entry',
      'tracking',
      'drivers',
      'vehicles'
    ],
    canDeleteRecords: false,
    canManageUsers: false,
    canManageBranches: false,
    canEditCompanyBank: false,
    canAccessFinancials: false,
    canEditLocationRates: false,
    canCreateLR: false,
    canEditLR: false,
    canUpdateTracking: true,
    canRecordPayments: false
  }
};

export const PermissionsService = {
  getRoleDefinition(role?: string): RoleDefinition {
    const r = (role?.toLowerCase() || 'admin') as UserRole;
    return ROLE_DEFINITIONS[r] || ROLE_DEFINITIONS.admin;
  },

  getAllowedTabs(role?: string): TabType[] {
    return this.getRoleDefinition(role).allowedTabs;
  },

  isTabAllowed(tab: TabType, role?: string): boolean {
    const def = this.getRoleDefinition(role);
    return def.allowedTabs.includes(tab);
  },

  canDelete(role?: string): boolean {
    return this.getRoleDefinition(role).canDeleteRecords;
  },

  canManageUsers(role?: string): boolean {
    return this.getRoleDefinition(role).canManageUsers;
  },

  canManageBranches(role?: string): boolean {
    return this.getRoleDefinition(role).canManageBranches;
  },

  canEditCompanyBank(role?: string): boolean {
    return this.getRoleDefinition(role).canEditCompanyBank;
  },

  canCreateLR(role?: string): boolean {
    return this.getRoleDefinition(role).canCreateLR;
  },

  canEditLR(role?: string): boolean {
    return this.getRoleDefinition(role).canEditLR;
  },

  canRecordPayments(role?: string): boolean {
    return this.getRoleDefinition(role).canRecordPayments;
  },

  canViewProfitLoss(role?: string): boolean {
    return this.getRoleDefinition(role).canAccessFinancials;
  },

  canEditLocationRates(role?: string): boolean {
    return this.getRoleDefinition(role).canEditLocationRates;
  }
};
