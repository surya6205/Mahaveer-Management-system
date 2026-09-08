import { BranchUnit, CompanyConfig, CompanySettings } from '../types';
import { AuthService } from './auth';
import { StorageService } from './storage';

export const BRANCHES_STORAGE_KEY = 'tms_branches_firms_list_v1';

export const DEFAULT_BRANCHES: BranchUnit[] = [
  {
    id: 'mahaveer_logistics',
    unitNumber: 1,
    companyName: 'MAHAVEER LOGISTICS',
    branchName: 'Jaipur Head Office',
    branchCode: 'JPR-01',
    shortCode: 'ML',
    colorTheme: 'orange',
    address: '3 New Colony Near Phanchyat Samithi Jhotwara Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302012',
    gstNo: '08AJAPJ9522F1ZC',
    panNo: 'AJAPJ9522F',
    contactPerson: 'Manish Jain',
    phone: '9782162010 / 8386862130',
    email: 'manish.jain8619@gmail.com',
    branchType: 'Head Office',
    status: 'Active',
    bankName: 'RMGB',
    accountNo: '83085733179',
    ifscCode: 'RMGB0000433',
    accountHolderName: 'Mahaveer Logistics',
    bankBranch: 'Jhotwara Branch, Jaipur',
    upiId: '9782162010@upi',
    terms: [
      'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
      'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
      'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
    ],
    defaultCredentials: {
      userId: 'admin_logistics',
      passwordPlain: 'Logistics@123'
    },
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'mahaveer_transport',
    unitNumber: 2,
    companyName: 'MAHAVEER TRANSPORT',
    branchName: 'Jaipur Branch',
    branchCode: 'JPR-02',
    shortCode: 'MT',
    colorTheme: 'blue',
    address: '3 New Colony Near Phanchyat Samithi Jhotwara Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302012',
    gstNo: '08AJAPJ9522F1ZC',
    panNo: 'AJAPJ9522F',
    contactPerson: 'Manish Jain',
    phone: '9782162010 / 8386862130',
    email: 'manish.jain8619@gmail.com',
    branchType: 'Branch',
    status: 'Active',
    bankName: 'RMGB',
    accountNo: '83085733179',
    ifscCode: 'RMGB0000433',
    accountHolderName: 'Mahaveer Transport',
    bankBranch: 'Jhotwara Branch, Jaipur',
    upiId: '9782162010@upi',
    terms: [
      'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
      'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
      'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
    ],
    defaultCredentials: {
      userId: 'admin_transport',
      passwordPlain: 'Transport@123'
    },
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const BranchService = {
  // Get all active / configured branches
  getAllBranches(): BranchUnit[] {
    try {
      const stored = localStorage.getItem(BRANCHES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading branches from storage:', e);
    }

    // Seed default branches only if storage was never initialized
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(DEFAULT_BRANCHES));
    } catch (e) {}
    return DEFAULT_BRANCHES;
  },

  // Get specific branch by ID
  getBranchById(id: string): BranchUnit | undefined {
    const branches = this.getAllBranches();
    return branches.find((b) => b.id === id);
  },

  // Create and persist a new branch / firm
  async createBranch(
    data: Omit<BranchUnit, 'id' | 'createdAt'> & {
      initialAdminUserId?: string;
      initialAdminPassword?: string;
    }
  ): Promise<BranchUnit> {
    const branches = this.getAllBranches();
    const cleanCompanyName = (data.companyName || 'MAHAVEER LOGISTICS').trim().toUpperCase();
    const cleanBranchName = (data.branchName || 'New Branch').trim();
    const cleanBranchCode = (data.branchCode || `BR-${branches.length + 1}`).trim().toUpperCase();

    // Generate unique ID
    const sanitizedCode = cleanBranchCode.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const baseId = `branch_${sanitizedCode || Date.now().toString()}`;
    let uniqueId = baseId;
    let counter = 1;
    while (branches.some((b) => b.id === uniqueId)) {
      uniqueId = `${baseId}_${counter++}`;
    }

    const nextUnitNo = branches.length + 1;

    // Pick color theme cycle
    const colorThemes: ('orange' | 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan')[] = [
      'orange',
      'blue',
      'emerald',
      'purple',
      'amber',
      'cyan'
    ];
    const assignedColor = data.colorTheme || colorThemes[(branches.length) % colorThemes.length];

    const newBranch: BranchUnit = {
      id: uniqueId,
      unitNumber: nextUnitNo,
      companyName: cleanCompanyName,
      branchName: cleanBranchName,
      branchCode: cleanBranchCode,
      shortCode: data.shortCode || cleanBranchCode,
      colorTheme: assignedColor,
      address: data.address || '',
      city: data.city || '',
      state: data.state || 'Rajasthan',
      pincode: data.pincode || '',
      gstNo: data.gstNo || '08AJAPJ9522F1ZC',
      panNo: data.panNo || 'AJAPJ9522F',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      branchType: data.branchType || 'Branch',
      status: data.status || 'Active',
      bankName: data.bankName || 'RMGB',
      accountNo: data.accountNo || '83085733179',
      ifscCode: data.ifscCode || 'RMGB0000433',
      accountHolderName: data.accountHolderName || `${cleanCompanyName} (${cleanBranchName})`,
      bankBranch: data.bankBranch || `${data.city || 'Jaipur'} Branch`,
      upiId: data.upiId || (data.phone ? `${data.phone.split(/[/,\s]/)[0]}@upi` : '9782162010@upi'),
      terms: data.terms || [
        'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
        'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
        'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
      ],
      createdAt: new Date().toISOString()
    };

    // If initial admin credentials provided, assign them
    if (data.initialAdminUserId && data.initialAdminPassword) {
      newBranch.defaultCredentials = {
        userId: data.initialAdminUserId.trim().toLowerCase(),
        passwordPlain: data.initialAdminPassword
      };
    }

    // Save branch to storage
    branches.push(newBranch);
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));

    // Also initialize company settings for this branch
    const settings: CompanySettings = {
      companyName: `${newBranch.companyName} - ${newBranch.branchName}`,
      tagline: newBranch.address || `${newBranch.branchName}, ${newBranch.city || 'Jaipur'}`,
      gstNo: newBranch.gstNo || '',
      panNo: newBranch.panNo || '',
      phone: newBranch.phone || '',
      email: newBranch.email || '',
      address: newBranch.address || `${newBranch.city || ''} ${newBranch.state || ''} ${newBranch.pincode || ''}`,
      bankName: newBranch.bankName,
      accountNo: newBranch.accountNo,
      ifscCode: newBranch.ifscCode,
      accountHolderName: newBranch.accountHolderName,
      bankBranch: newBranch.bankBranch,
      upiId: newBranch.upiId,
      terms: newBranch.terms || []
    };
    StorageService.saveCompanySettings(settings, uniqueId);

    // Create Initial Admin User Account
    const adminUser = data.initialAdminUserId?.trim().toLowerCase() || `admin_${sanitizedCode || 'branch'}`;
    const adminPass = data.initialAdminPassword || 'Admin@123';
    await AuthService.createUser({
      companyId: uniqueId,
      userId: adminUser,
      passwordPlain: adminPass,
      fullName: data.contactPerson?.trim() || `${newBranch.companyName} Admin`,
      role: 'admin',
      phone: data.phone?.trim(),
      email: data.email?.trim()
    });

    return newBranch;
  },

  // Update an existing branch
  updateBranch(id: string, updates: Partial<BranchUnit>): BranchUnit | undefined {
    const branches = this.getAllBranches();
    const index = branches.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const existing = branches[index];
    const updated: BranchUnit = {
      ...existing,
      ...updates
    };

    branches[index] = updated;
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));

    // Also sync CompanySettings
    const currentSettings = StorageService.getCompanySettings(id);
    const updatedSettings: CompanySettings = {
      ...currentSettings,
      companyName: `${updated.companyName} - ${updated.branchName}`,
      tagline: updated.address || currentSettings.tagline,
      gstNo: updated.gstNo || currentSettings.gstNo,
      panNo: updated.panNo || currentSettings.panNo,
      phone: updated.phone || currentSettings.phone,
      email: updated.email || currentSettings.email,
      address: updated.address || currentSettings.address,
      bankName: updated.bankName || currentSettings.bankName,
      accountNo: updated.accountNo || currentSettings.accountNo,
      ifscCode: updated.ifscCode || currentSettings.ifscCode,
      accountHolderName: updated.accountHolderName || currentSettings.accountHolderName,
      bankBranch: updated.bankBranch || currentSettings.bankBranch,
      upiId: updated.upiId || currentSettings.upiId
    };
    StorageService.saveCompanySettings(updatedSettings, id);

    return updated;
  },

  // Delete a branch / firm permanently
  deleteBranch(id: string): { success: boolean; error?: string } {
    const branches = this.getAllBranches();
    if (branches.length <= 1) {
      return {
        success: false,
        error: 'Cannot delete the only remaining branch. At least one branch must remain active in the system.'
      };
    }
    const filtered = branches.filter((b) => b.id !== id);
    if (filtered.length === branches.length) {
      return { success: false, error: 'Branch not found.' };
    }
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(filtered));

    // Clean up branch users and branch-specific settings from local storage
    try {
      localStorage.removeItem(`tms_auth_accounts_v1_${id}`);
      localStorage.removeItem(`tms_settings_v1_${id}`);
    } catch (e) {}

    return { success: true };
  },

  // Convert a BranchUnit to CompanyConfig for full backwards compatibility
  branchToCompanyConfig(b: BranchUnit): CompanyConfig {
    return {
      id: b.id,
      name: b.companyName,
      displayName: `${b.companyName} (${b.branchName})`,
      shortCode: b.shortCode || b.branchCode,
      colorTheme: b.colorTheme || 'orange',
      defaultCredentials: b.defaultCredentials || {
        userId: `admin_${b.branchCode.toLowerCase()}`,
        passwordPlain: 'Admin@123'
      },
      settings: {
        companyName: `${b.companyName}`,
        tagline: b.address || `${b.branchName}, ${b.city || 'Jaipur'}`,
        gstNo: b.gstNo || '',
        panNo: b.panNo || '',
        phone: b.phone || '',
        email: b.email || '',
        address: b.address || `${b.city || ''} ${b.state || ''} ${b.pincode || ''}`,
        bankName: b.bankName,
        accountNo: b.accountNo,
        ifscCode: b.ifscCode,
        accountHolderName: b.accountHolderName || `${b.companyName} (${b.branchName})`,
        bankBranch: b.bankBranch,
        upiId: b.upiId,
        terms: b.terms || [
          'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
          'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
          'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
        ]
      }
    };
  }
};
