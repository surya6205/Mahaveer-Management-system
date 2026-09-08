import { CompanyId, AuthSession, UserAccount } from '../types';
import { COMPANY_CONFIGS } from '../data/companyConfig';

const AUTH_SESSION_KEY = 'tms_auth_session_v1';
const ACCOUNTS_STORAGE_KEY_PREFIX = 'tms_user_accounts_list_v2_';
const LEGACY_ACCOUNTS_KEY_PREFIX = 'tms_user_account_v1_';

// Browser-native SHA-256 hashing for secure password storage
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`tms_salt_${plainText}_secure_transport_hash`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AuthService = {
  // Get all user accounts for a company
  async getAccounts(companyId: CompanyId): Promise<UserAccount[]> {
    const listKey = `${ACCOUNTS_STORAGE_KEY_PREFIX}${companyId}`;
    const savedList = localStorage.getItem(listKey);

    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored user accounts list:', e);
      }
    }

    // Check legacy single account key
    const legacyKey = `${LEGACY_ACCOUNTS_KEY_PREFIX}${companyId}`;
    const legacySaved = localStorage.getItem(legacyKey);
    let initialAccounts: UserAccount[] = [];

    if (legacySaved) {
      try {
        const parsed = JSON.parse(legacySaved);
        if (parsed && parsed.userId && parsed.passwordHash) {
          initialAccounts.push({
            id: `usr-legacy-${companyId}`,
            companyId,
            userId: parsed.userId,
            fullName: parsed.userId === 'admin_logistics' ? 'Mahaveer Logistics Admin' : 'Mahaveer Transport Admin',
            passwordHash: parsed.passwordHash,
            role: parsed.role || 'admin',
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Error parsing legacy account:', e);
      }
    }

    // If no accounts exist yet, seed default company administrator
    if (initialAccounts.length === 0) {
      const config = COMPANY_CONFIGS[companyId];
      const defaultHash = await hashPassword(config.defaultCredentials.passwordPlain);
      const defaultAccount: UserAccount = {
        id: `usr-default-${companyId}`,
        companyId,
        userId: config.defaultCredentials.userId,
        fullName: config.name + ' Admin',
        email: config.settings.email || '',
        phone: config.settings.phone || '',
        passwordHash: defaultHash,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      initialAccounts.push(defaultAccount);
    }

    localStorage.setItem(listKey, JSON.stringify(initialAccounts));
    return initialAccounts;
  },

  // Get single active user account by User ID (or first admin fallback)
  async getAccount(companyId: CompanyId, userId?: string): Promise<UserAccount> {
    const accounts = await this.getAccounts(companyId);
    if (userId) {
      const matched = accounts.find(
        (a) => a.userId.trim().toLowerCase() === userId.trim().toLowerCase()
      );
      if (matched) return matched;
    }
    return accounts[0];
  },

  // Create a new user account (e.g. from Login Page "Create User" or Profile Modal)
  async createUser(data: {
    companyId: CompanyId;
    userId: string;
    passwordPlain: string;
    fullName: string;
    role?: 'admin' | 'manager' | 'operator' | 'staff';
    email?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; account?: UserAccount; error?: string }> {
    const { companyId, userId, passwordPlain, fullName, role = 'operator', email = '', phone = '', avatarUrl } = data;

    if (!companyId) {
      return { success: false, error: 'Please select a company unit.' };
    }

    const cleanUserId = userId.trim().toLowerCase();
    if (!cleanUserId || cleanUserId.length < 3) {
      return { success: false, error: 'User ID must be at least 3 characters long.' };
    }

    // User ID alphanumeric and underscore check
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUserId)) {
      return { success: false, error: 'User ID can only contain letters, numbers, hyphens, and underscores.' };
    }

    if (!passwordPlain || passwordPlain.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const accounts = await this.getAccounts(companyId);
    const exists = accounts.some(
      (a) => a.userId.trim().toLowerCase() === cleanUserId
    );

    if (exists) {
      return { success: false, error: `User ID "${cleanUserId}" is already taken in this company. Please choose another username.` };
    }

    const passwordHash = await hashPassword(passwordPlain);
    const newAccount: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      companyId,
      userId: cleanUserId,
      fullName: fullName.trim() || cleanUserId,
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    const listKey = `${ACCOUNTS_STORAGE_KEY_PREFIX}${companyId}`;
    localStorage.setItem(listKey, JSON.stringify(accounts));

    return { success: true, account: newAccount };
  },

  // Delete a user account
  async deleteUser(
    companyId: CompanyId,
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanId = targetUserId.trim().toLowerCase();
    const accounts = await this.getAccounts(companyId);

    const accountIndex = accounts.findIndex(
      (a) => a.userId.trim().toLowerCase() === cleanId
    );

    if (accountIndex === -1) {
      return { success: false, error: `User "@${cleanId}" not found.` };
    }

    const currentSession = this.getCurrentSession();
    if (
      currentSession &&
      currentSession.companyId === companyId &&
      currentSession.userId.trim().toLowerCase() === cleanId
    ) {
      return {
        success: false,
        error: 'You cannot delete your own currently active logged-in account.'
      };
    }

    // Remove the user
    const updatedAccounts = accounts.filter(
      (a) => a.userId.trim().toLowerCase() !== cleanId
    );

    const listKey = `${ACCOUNTS_STORAGE_KEY_PREFIX}${companyId}`;
    localStorage.setItem(listKey, JSON.stringify(updatedAccounts));

    return { success: true };
  },

  // Get all user accounts across all companies and branches
  async getAllAccounts(): Promise<UserAccount[]> {
    let branchIds: string[] = ['mahaveer_logistics', 'mahaveer_transport'];
    try {
      const storedBranches = localStorage.getItem('tms_branches_firms_list_v1');
      if (storedBranches) {
        const parsed = JSON.parse(storedBranches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          branchIds = parsed.map((b: any) => b.id);
        }
      }
    } catch (e) {}

    const allAccounts: UserAccount[] = [];
    for (const bId of branchIds) {
      try {
        const accs = await this.getAccounts(bId);
        allAccounts.push(...accs);
      } catch (err) {}
    }
    return allAccounts;
  },

  // Save updated credentials & profile details for a user
  async updateProfileAndCredentials(
    companyId: CompanyId,
    currentUserId: string,
    updates: {
      currentPasswordPlain?: string;
      newUserId?: string;
      newPasswordPlain?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string;
      role?: 'admin' | 'manager' | 'operator' | 'staff';
    }
  ): Promise<{ success: boolean; account?: UserAccount; error?: string }> {
    const accounts = await this.getAccounts(companyId);
    const accountIndex = accounts.findIndex(
      (a) => a.userId.trim().toLowerCase() === currentUserId.trim().toLowerCase()
    );

    if (accountIndex === -1) {
      return { success: false, error: 'User account not found.' };
    }

    const account = accounts[accountIndex];

    // If changing password, verify current password
    if (updates.newPasswordPlain) {
      if (!updates.currentPasswordPlain) {
        return { success: false, error: 'Current Password is required to change password.' };
      }
      const currentHash = await hashPassword(updates.currentPasswordPlain);
      if (account.passwordHash !== currentHash) {
        return { success: false, error: 'Current Password is incorrect.' };
      }
      if (updates.newPasswordPlain.length < 4) {
        return { success: false, error: 'New Password must be at least 4 characters long.' };
      }
      account.passwordHash = await hashPassword(updates.newPasswordPlain);
    }

    // If changing user ID, check collision
    let targetUserId = account.userId;
    if (updates.newUserId && updates.newUserId.trim().toLowerCase() !== account.userId.toLowerCase()) {
      const cleanNewId = updates.newUserId.trim().toLowerCase();
      if (cleanNewId.length < 3) {
        return { success: false, error: 'New User ID must be at least 3 characters long.' };
      }
      const isTaken = accounts.some(
        (a, idx) => idx !== accountIndex && a.userId.trim().toLowerCase() === cleanNewId
      );
      if (isTaken) {
        return { success: false, error: `User ID "${cleanNewId}" is already in use.` };
      }
      targetUserId = cleanNewId;
      account.userId = cleanNewId;
    }

    if (updates.fullName !== undefined) account.fullName = updates.fullName.trim();
    if (updates.email !== undefined) account.email = updates.email.trim();
    if (updates.phone !== undefined) account.phone = updates.phone.trim();
    if (updates.avatarUrl !== undefined) account.avatarUrl = updates.avatarUrl;
    if (updates.role !== undefined) account.role = updates.role;
    account.updatedAt = new Date().toISOString();

    accounts[accountIndex] = account;
    const listKey = `${ACCOUNTS_STORAGE_KEY_PREFIX}${companyId}`;
    localStorage.setItem(listKey, JSON.stringify(accounts));

    // Update active session if currently logged in with this account
    const currentSession = this.getCurrentSession();
    if (currentSession && currentSession.companyId === companyId) {
      currentSession.userId = targetUserId;
      if (account.fullName) currentSession.fullName = account.fullName;
      if (account.email) currentSession.email = account.email;
      if (account.phone) currentSession.phone = account.phone;
      if (account.avatarUrl) currentSession.avatarUrl = account.avatarUrl;
      if (account.role) currentSession.role = account.role;
      this.saveSession(currentSession);
    }

    return { success: true, account };
  },

  // Legacy credentials update proxy
  async updateCredentials(
    companyId: CompanyId,
    currentUserId: string,
    currentPasswordPlain: string,
    newUserId: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateProfileAndCredentials(companyId, currentUserId, {
      currentPasswordPlain,
      newUserId,
      newPasswordPlain
    });
  },

  // Authenticate user login
  async login(
    companyId: CompanyId,
    userIdInput: string,
    passwordPlainInput: string
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    if (!companyId) {
      return { success: false, error: 'Please select a company unit.' };
    }

    const cleanUser = userIdInput.trim().toLowerCase();
    if (!cleanUser || !passwordPlainInput) {
      return { success: false, error: 'Please enter both User ID and Password.' };
    }

    const accounts = await this.getAccounts(companyId);
    const inputHash = await hashPassword(passwordPlainInput);

    const matchedAccount = accounts.find(
      (a) => a.userId.trim().toLowerCase() === cleanUser
    );

    if (!matchedAccount || matchedAccount.passwordHash !== inputHash) {
      return { success: false, error: 'Invalid User ID or Password for this company.' };
    }

    matchedAccount.lastLogin = new Date().toISOString();
    const listKey = `${ACCOUNTS_STORAGE_KEY_PREFIX}${companyId}`;
    localStorage.setItem(listKey, JSON.stringify(accounts));

    const config = COMPANY_CONFIGS[companyId];
    const session: AuthSession = {
      companyId,
      companyName: config.name,
      userId: matchedAccount.userId,
      fullName: matchedAccount.fullName || matchedAccount.userId,
      email: matchedAccount.email || '',
      phone: matchedAccount.phone || '',
      avatarUrl: matchedAccount.avatarUrl || '',
      role: matchedAccount.role || 'admin',
      token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginTimestamp: new Date().toISOString()
    };

    this.saveSession(session);
    return { success: true, session };
  },

  // Save session to storage
  saveSession(session: AuthSession): void {
    try {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },

  // Get active logged in session
  getCurrentSession(): AuthSession | null {
    try {
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved) as AuthSession;
        if (session && session.companyId && session.userId) {
          return session;
        }
      }
    } catch (e) {
      console.error('Failed to parse current session:', e);
    }
    return null;
  },

  // Logout and clear active session
  logout(): void {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

