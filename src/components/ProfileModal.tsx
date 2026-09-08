import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Key,
  Lock,
  Building2,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  UserPlus,
  Users,
  Phone,
  Mail,
  CreditCard,
  Building,
  QrCode,
  Check,
  AlertTriangle,
  PlusCircle,
  MapPin,
  Hash,
  Layers,
  Sparkles
} from 'lucide-react';
import { CompanyId, AuthSession, CompanySettings, UserAccount, BranchUnit, BranchType, BranchStatus } from '../types';
import { COMPANY_CONFIGS } from '../data/companyConfig';
import { AuthService } from '../utils/auth';
import { StorageService } from '../utils/storage';
import { BranchService } from '../utils/branchService';
import { PermissionsService } from '../utils/permissions';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: AuthSession | null;
  companySettings: CompanySettings;
  onSaveCompanySettings?: (newSettings: CompanySettings) => void;
  onUpdateCompanySettings?: (newSettings: CompanySettings) => void;
  onSessionUpdated?: (updatedSession: AuthSession) => void;
  onUpdateSession?: (updatedSession: AuthSession) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  companySettings,
  onSaveCompanySettings,
  onUpdateCompanySettings,
  onSessionUpdated,
  onUpdateSession,
  onLogout
}) => {
  if (!isOpen || !currentSession) return null;

  const handleUpdateSettings = onSaveCompanySettings || onUpdateCompanySettings || (() => {});
  const handleUpdateCurrentSession = onSessionUpdated || onUpdateSession || (() => {});

  const [activeTab, setActiveTab] = useState<'bank_company' | 'branches' | 'users' | 'profile'>('bank_company');

  // Dynamic Branches State
  const [branches, setBranches] = useState<BranchUnit[]>(() => BranchService.getAllBranches());

  // User Profile Form States
  const [fullName, setFullName] = useState(currentSession.fullName || currentSession.userId || '');
  const [userId, setUserId] = useState(currentSession.userId);
  const [email, setEmail] = useState(currentSession.email || '');
  const [phone, setPhone] = useState(currentSession.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentSession.avatarUrl || '');

  // Password Change Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Target Company for Bank & Branding Settings
  const [selectedTargetCompany, setSelectedTargetCompany] = useState<CompanyId>(currentSession.companyId);

  // Company & Bank Details Form States
  const [compName, setCompName] = useState('');
  const [compTagline, setCompTagline] = useState('');
  const [compGst, setCompGst] = useState('');
  const [compPan, setCompPan] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compLogoUrl, setCompLogoUrl] = useState<string>('');

  // Bank Specific Details
  const [bankName, setBankName] = useState('RMGB');
  const [accountNo, setAccountNo] = useState('83085733179');
  const [ifscCode, setIfscCode] = useState('RMGB0000433');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankBranch, setBankBranch] = useState('Jhotwara, Jaipur');
  const [upiId, setUpiId] = useState('9782162010@upi');

  // User Accounts Master State
  const [accountsList, setAccountsList] = useState<UserAccount[]>([]);
  const [userBranchFilter, setUserBranchFilter] = useState<'all' | CompanyId>('all');
  const [showCreateUserInline, setShowCreateUserInline] = useState(false);

  // Create New User in Modal
  const [newOperatorBranch, setNewOperatorBranch] = useState<CompanyId>(currentSession.companyId);
  const [newOperatorName, setNewOperatorName] = useState('');
  const [newOperatorUserId, setNewOperatorUserId] = useState('');
  const [newOperatorPassword, setNewOperatorPassword] = useState('');
  const [newOperatorRole, setNewOperatorRole] = useState<'admin' | 'manager' | 'operator' | 'staff'>('operator');
  const [newOperatorMobile, setNewOperatorMobile] = useState('');

  // Add New Branch in Modal
  const [showAddBranchForm, setShowAddBranchForm] = useState(false);
  const [newBranchFirmName, setNewBranchFirmName] = useState('Mahaveer Logistics');
  const [newBranchTitle, setNewBranchTitle] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchType, setNewBranchType] = useState<BranchType>('Branch');
  const [newBranchStatus, setNewBranchStatus] = useState<BranchStatus>('Active');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchState, setNewBranchState] = useState('Rajasthan');
  const [newBranchPincode, setNewBranchPincode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchContactPerson, setNewBranchContactPerson] = useState('');
  const [newBranchMobile, setNewBranchMobile] = useState('');
  const [newBranchEmail, setNewBranchEmail] = useState('');
  const [newBranchGst, setNewBranchGst] = useState('08AJAPJ9522F1ZC');
  const [newBranchPan, setNewBranchPan] = useState('AJAPJ9522F');
  const [newBranchBankName, setNewBranchBankName] = useState('RMGB');
  const [newBranchAccountNo, setNewBranchAccountNo] = useState('83085733179');
  const [newBranchIfsc, setNewBranchIfsc] = useState('RMGB0000433');
  const [newBranchUpi, setNewBranchUpi] = useState('9782162010@upi');

  // Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Delete Branch Confirmation State
  const [branchToDelete, setBranchToDelete] = useState<BranchUnit | null>(null);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);

  // Status & Feedback States
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Refresh branches list
  const reloadBranches = () => {
    const list = BranchService.getAllBranches();
    setBranches(list);
    return list;
  };

  // Load Company & Bank Settings whenever selected target company changes
  const loadTargetCompanySettings = (compId: CompanyId) => {
    const loaded = StorageService.getCompanySettings(compId);
    const targetConfig = COMPANY_CONFIGS[compId];
    setCompName(loaded.companyName || targetConfig?.name || '');
    setCompTagline(loaded.tagline || '');
    setCompGst(loaded.gstNo || '');
    setCompPan(loaded.panNo || '');
    setCompPhone(loaded.phone || '');
    setCompEmail(loaded.email || '');
    setCompAddress(loaded.address || '');
    setCompLogoUrl(loaded.logoUrl || '');
    setBankName(loaded.bankName || 'RMGB');
    setAccountNo(loaded.accountNo || '83085733179');
    setIfscCode(loaded.ifscCode || 'RMGB0000433');
    setAccountHolderName(loaded.accountHolderName || loaded.companyName || targetConfig?.name || '');
    setBankBranch(loaded.bankBranch || 'Jhotwara Branch, Jaipur');
    setUpiId(loaded.upiId || '9782162010@upi');
  };

  useEffect(() => {
    loadTargetCompanySettings(selectedTargetCompany);
  }, [selectedTargetCompany, isOpen]);

  // Load All User Accounts
  const reloadAllAccounts = async () => {
    const all = await AuthService.getAllAccounts();
    setAccountsList(all);
  };

  useEffect(() => {
    if (isOpen) {
      reloadBranches();
      reloadAllAccounts();
    }
  }, [isOpen]);

  // Handle Profile Avatar Image Upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Avatar image size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Company Logo Image Upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('Company logo image size must be less than 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCompLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit User Profile & Password Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword) {
      if (!currentPassword) {
        setErrorMessage('Please enter your Current Password to change password.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage('New Password and Confirm Password do not match.');
        return;
      }
      if (newPassword.length < 4) {
        setErrorMessage('New Password must be at least 4 characters long.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await AuthService.updateProfileAndCredentials(
        currentSession.companyId,
        currentSession.userId,
        {
          newUserId: userId.trim(),
          currentPasswordPlain: currentPassword || undefined,
          newPasswordPlain: newPassword || undefined,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl || undefined
        }
      );

      if (res.success && res.account) {
        const updatedSession: AuthSession = {
          ...currentSession,
          userId: res.account.userId,
          fullName: res.account.fullName,
          email: res.account.email,
          phone: res.account.phone,
          avatarUrl: res.account.avatarUrl
        };
        handleUpdateCurrentSession(updatedSession);
        setSuccessMessage('User profile and credentials updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        await reloadAllAccounts();
      } else {
        setErrorMessage(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage('Error updating profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Bank Account & Company Details Updates
  const handleSaveBankAndCompanyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const targetConfig = COMPANY_CONFIGS[selectedTargetCompany];
    const existing = StorageService.getCompanySettings(selectedTargetCompany);

    const updatedSettings: CompanySettings = {
      ...existing,
      companyName: compName.trim() || targetConfig?.name || selectedTargetCompany,
      tagline: compTagline.trim(),
      gstNo: compGst.trim().toUpperCase(),
      panNo: compPan.trim().toUpperCase(),
      phone: compPhone.trim(),
      email: compEmail.trim(),
      address: compAddress.trim(),
      logoUrl: compLogoUrl || undefined,
      bankName: bankName.trim(),
      accountNo: accountNo.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountHolderName: accountHolderName.trim() || compName.trim() || targetConfig?.name || selectedTargetCompany,
      bankBranch: bankBranch.trim(),
      upiId: upiId.trim()
    };

    StorageService.saveCompanySettings(updatedSettings, selectedTargetCompany);

    // Also sync to branch definition if it's a dynamic branch
    BranchService.updateBranch(selectedTargetCompany, {
      companyName: compName.trim() || targetConfig?.name || selectedTargetCompany,
      gstNo: compGst.trim().toUpperCase(),
      panNo: compPan.trim().toUpperCase(),
      phone: compPhone.trim(),
      email: compEmail.trim(),
      address: compAddress.trim(),
      bankName: bankName.trim(),
      accountNo: accountNo.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountHolderName: accountHolderName.trim(),
      bankBranch: bankBranch.trim(),
      upiId: upiId.trim()
    });

    // If saving the active company in the current session, update top-level state
    if (selectedTargetCompany === currentSession.companyId) {
      handleUpdateSettings(updatedSettings);
    }

    const compDisplayName = COMPANY_CONFIGS[selectedTargetCompany]?.displayName || selectedTargetCompany;
    setSuccessMessage(`Bank details & branding for ${compDisplayName} saved successfully!`);
    reloadBranches();
  };

  // Create New Branch / Firm from inside Profile Modal
  const handleCreateBranchInModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newBranchFirmName.trim() || !newBranchTitle.trim() || !newBranchCode.trim()) {
      setErrorMessage('Please fill in Firm Name, Branch Name, and Branch Code.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await BranchService.createBranch({
        companyName: newBranchFirmName.trim().toUpperCase(),
        branchName: newBranchTitle.trim(),
        branchCode: newBranchCode.trim().toUpperCase(),
        shortCode: newBranchCode.trim().toUpperCase(),
        branchType: newBranchType,
        status: newBranchStatus,
        city: newBranchCity.trim(),
        state: newBranchState.trim(),
        pincode: newBranchPincode.trim(),
        address: newBranchAddress.trim(),
        contactPerson: newBranchContactPerson.trim(),
        phone: newBranchMobile.trim(),
        email: newBranchEmail.trim(),
        gstNo: newBranchGst.trim(),
        panNo: newBranchPan.trim(),
        bankName: newBranchBankName.trim(),
        accountNo: newBranchAccountNo.trim(),
        ifscCode: newBranchIfsc.trim(),
        upiId: newBranchUpi.trim()
      });

      setSuccessMessage(`Branch "${created.companyName} - ${created.branchName}" (${created.branchCode}) created successfully!`);
      setShowAddBranchForm(false);
      setNewBranchTitle('');
      setNewBranchCode('');
      setNewBranchAddress('');
      setNewBranchCity('');
      setNewBranchContactPerson('');
      setNewBranchMobile('');
      setNewBranchEmail('');
      reloadBranches();
      setSelectedTargetCompany(created.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create branch');
    } finally {
      setIsSaving(false);
    }
  };

  // Create New User
  const handleCreateNewOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newOperatorUserId.trim() || !newOperatorPassword) {
      setErrorMessage('Please provide both User ID and Password for the new user.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await AuthService.createUser({
        companyId: newOperatorBranch,
        userId: newOperatorUserId.trim(),
        passwordPlain: newOperatorPassword,
        fullName: newOperatorName.trim() || newOperatorUserId.trim(),
        role: newOperatorRole,
        phone: newOperatorMobile.trim()
      });

      if (res.success && res.account) {
        const branchName = COMPANY_CONFIGS[newOperatorBranch]?.displayName || newOperatorBranch;
        setSuccessMessage(`User "@${res.account.userId}" created for ${branchName}!`);
        setNewOperatorName('');
        setNewOperatorUserId('');
        setNewOperatorPassword('');
        setNewOperatorMobile('');
        setShowCreateUserInline(false);
        await reloadAllAccounts();
      } else {
        setErrorMessage(res.error || 'Failed to create user.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  // Execute User Deletion
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await AuthService.deleteUser(userToDelete.companyId, userToDelete.userId);
      if (res.success) {
        setSuccessMessage(`User "@${userToDelete.userId}" (${userToDelete.fullName || ''}) has been deleted.`);
        setUserToDelete(null);
        await reloadAllAccounts();
      } else {
        setErrorMessage(res.error || 'Failed to delete user.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting user.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Execute Branch / Firm Deletion
  const handleConfirmDeleteBranch = async () => {
    if (!branchToDelete) return;
    setIsDeletingBranch(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = BranchService.deleteBranch(branchToDelete.id);
      if (res.success) {
        setSuccessMessage(`Branch / Firm "${branchToDelete.companyName} - ${branchToDelete.branchName}" (${branchToDelete.branchCode}) deleted permanently.`);
        const updatedBranches = reloadBranches();
        if (selectedTargetCompany === branchToDelete.id && updatedBranches.length > 0) {
          setSelectedTargetCompany(updatedBranches[0].id);
        }
        await reloadAllAccounts();
        setBranchToDelete(null);
      } else {
        setErrorMessage(res.error || 'Failed to delete branch.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting branch.');
    } finally {
      setIsDeletingBranch(false);
    }
  };

  // Filter accounts list for display
  const displayedAccounts = accountsList.filter((acc) => {
    if (userBranchFilter === 'all') return true;
    return acc.companyId === userBranchFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden border-2 border-orange-400">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(fullName || userId || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {fullName || userId}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {currentSession.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                @{userId} • Branch:{' '}
                <span className="text-amber-400 font-bold">
                  {COMPANY_CONFIGS[currentSession.companyId]?.displayName || currentSession.companyId}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 gap-1 overflow-x-auto">
          {/* Tab 1: Bank & Company Details */}
          <button
            onClick={() => { setActiveTab('bank_company'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'bank_company'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Bank & Firm Details</span>
          </button>

          {/* Tab 2: Branches & Firms */}
          <button
            onClick={() => { setActiveTab('branches'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'branches'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Branches & Firms ({branches.length})</span>
          </button>

          {/* Tab 3: All Users */}
          <button
            onClick={() => { setActiveTab('users'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>All Users ({accountsList.length})</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => { setActiveTab('profile'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>User Profile & Password</span>
          </button>
        </div>

        {/* Feedback Banners */}
        <div className="px-6 pt-3">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-xs sm:text-sm flex-1">
          
          {/* ========================================================= */}
          {/* TAB 1: BANK & COMPANY DETAILS */}
          {/* ========================================================= */}
          {activeTab === 'bank_company' && (
            <form onSubmit={handleSaveBankAndCompanyDetails} className="space-y-4">
              
              {/* Branch / Unit Switcher for Bank Details */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    <span>Select Firm / Branch Unit to Edit Bank & Details:</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Switch between any branch to customize their bank account numbers, IFSC codes, and GST info for Bilties and Invoices.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedTargetCompany(b.id);
                        setSuccessMessage('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        selectedTargetCompany === b.id
                          ? 'bg-orange-600 border-orange-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.branchCode}: {b.companyName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Account Details Card */}
              <div className="p-4 bg-slate-950/90 border border-amber-500/40 rounded-xl space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-400" />
                    <span>Bank Account Details — {COMPANY_CONFIGS[selectedTargetCompany]?.displayName || selectedTargetCompany}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    Prints on Bilty & Invoices
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Bank Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Account Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800 text-white font-mono rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      IFSC Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800 text-white font-mono uppercase rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                    />
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Account Holder / Beneficiary Name
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {/* Bank Branch Location */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Bank Branch Location
                    </label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {/* UPI ID / QR VPA */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      UPI ID / VPA (for QR Payments)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Company Logo Upload Box */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  ref={logoFileInputRef}
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />

                <div className="w-24 h-16 bg-white rounded-xl border border-slate-300 flex items-center justify-center p-2 overflow-hidden shadow-md shrink-0">
                  {compLogoUrl ? (
                    <img
                      src={compLogoUrl}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 font-bold text-[10px] leading-tight">
                      NO LOGO<br />UPLOADED
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <div className="font-bold text-white text-sm">Official Company Logo</div>
                  <p className="text-[11px] text-slate-400">
                    Appears on 3-copy printed Bilties, invoices, header bar, and PDF documents.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{compLogoUrl ? 'Change Logo' : 'Upload Logo Image'}</span>
                    </button>
                    {compLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCompLogoUrl('')}
                        className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg text-xs font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company Registered Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    required
                    className="w-full bg-slate-800 text-white font-bold rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={compTagline}
                    onChange={(e) => setCompTagline(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={compGst}
                    onChange={(e) => setCompGst(e.target.value.toUpperCase())}
                    placeholder=""
                    className="w-full bg-slate-800 text-white font-mono uppercase rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={compPan}
                    onChange={(e) => setCompPan(e.target.value.toUpperCase())}
                    placeholder=""
                    className="w-full bg-slate-800 text-white font-mono uppercase rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Mobile / Contact
                  </label>
                  <input
                    type="text"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Office / Booking Address
                  </label>
                  <textarea
                    rows={2}
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Bank & Firm Details</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: BRANCHES & FIRMS MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    <span>Registered Company Branches & Units</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700 text-slate-300 font-bold">
                      {branches.length} Branch(es)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Manage multiple branches, units, and booking offices under your transport firms.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddBranchForm(!showAddBranchForm)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>+ Add New Branch / Firm</span>
                </button>
              </div>

              {/* Add New Branch Inline Form */}
              {showAddBranchForm && (
                <form onSubmit={handleCreateBranchInModal} className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-3.5 animate-fadeIn">
                  <div className="font-bold text-emerald-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      <span>Create New Branch / Firm Unit</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddBranchForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company / Firm Name *</label>
                      <input
                        type="text"
                        value={newBranchFirmName}
                        onChange={(e) => setNewBranchFirmName(e.target.value)}
                        placeholder=""
                        required
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Branch Name *</label>
                      <input
                        type="text"
                        value={newBranchTitle}
                        onChange={(e) => setNewBranchTitle(e.target.value)}
                        placeholder=""
                        required
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Branch Code *</label>
                      <input
                        type="text"
                        value={newBranchCode}
                        onChange={(e) => setNewBranchCode(e.target.value.toUpperCase())}
                        placeholder=""
                        required
                        className="w-full bg-slate-800 text-white font-mono uppercase font-bold rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Branch Type</label>
                      <select
                        value={newBranchType}
                        onChange={(e: any) => setNewBranchType(e.target.value)}
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none"
                      >
                        <option value="Head Office">Head Office</option>
                        <option value="Branch">Branch</option>
                        <option value="Warehouse">Warehouse</option>
                        <option value="Booking Hub">Booking Hub</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        value={newBranchCity}
                        onChange={(e) => setNewBranchCity(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Contact Person & Mobile</label>
                      <input
                        type="text"
                        value={newBranchMobile}
                        onChange={(e) => setNewBranchMobile(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBranchForm(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Create Branch'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Branches Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branches.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase">
                          Unit {b.unitNumber || idx + 1} • {b.branchCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${b.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {b.status || 'Active'}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm">{b.companyName}</h3>
                      <p className="text-xs text-amber-400 font-semibold">{b.branchName} ({b.branchType || 'Branch'})</p>

                      <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                        {b.city && <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-500" /> {b.city}, {b.state}</p>}
                        {b.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500" /> {b.phone}</p>}
                        {b.bankName && <p className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-slate-500" /> {b.bankName} - {b.accountNo}</p>}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTargetCompany(b.id);
                          setActiveTab('bank_company');
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Edit Bank & Details</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {branches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBranchToDelete(b)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete Branch / Firm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">ID: {b.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ALL USERS & STAFF MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>Authorized Users & Staff</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700 text-slate-300 font-bold">
                      {displayedAccounts.length} User(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Manage team access, branch assignment, roles, and user deletion.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Branch Filter Tabs */}
                  <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUserBranchFilter('all')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        userBranchFilter === 'all' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Branches
                    </button>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setUserBranchFilter(b.id)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          userBranchFilter === b.id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {b.branchCode}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateUserInline(!showCreateUserInline)}
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>+ Add User</span>
                  </button>
                </div>
              </div>

              {/* Inline Create User Form */}
              {showCreateUserInline && (
                <form onSubmit={handleCreateNewOperator} className="p-4 bg-slate-950/80 border border-orange-500/40 rounded-xl space-y-3 animate-fadeIn">
                  <div className="font-bold text-amber-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4" />
                      <span>Register New User / Operator</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateUserInline(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Branch Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Assigned Branch / Company <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={newOperatorBranch}
                        onChange={(e: any) => setNewOperatorBranch(e.target.value)}
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.companyName} - {b.branchName} ({b.branchCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOperatorName}
                        onChange={(e) => setNewOperatorName(e.target.value)}
                        placeholder=""
                        required
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Username / User ID <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOperatorUserId}
                        onChange={(e) => setNewOperatorUserId(e.target.value)}
                        placeholder=""
                        required
                        className="w-full bg-slate-800 text-white font-mono rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Password <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOperatorPassword}
                        onChange={(e) => setNewOperatorPassword(e.target.value)}
                        placeholder=""
                        required
                        className="w-full bg-slate-800 text-white font-mono rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Role / System Access Level <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={newOperatorRole}
                        onChange={(e: any) => setNewOperatorRole(e.target.value)}
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                      >
                        <option value="admin">Administrator (Full Access - All Tabs, Delete & Settings)</option>
                        <option value="manager">Branch Manager (Operations - LR, Fleet, Drivers, Rates, Reports)</option>
                        <option value="operator">Billing Operator (LR Booking, Invoices, Delivery & Payments)</option>
                        <option value="staff">Dispatch Staff (Status Tracking & Dispatch Coordination)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={newOperatorMobile}
                        onChange={(e) => setNewOperatorMobile(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateUserInline(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>{isSaving ? 'Creating...' : 'Save & Register User'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Branch Unit</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Created</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {displayedAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No users found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      displayedAccounts.map((acc) => {
                        const isCurrent = acc.userId === currentSession.userId && acc.companyId === currentSession.companyId;
                        const branchConfig = COMPANY_CONFIGS[acc.companyId];

                        return (
                          <tr key={`${acc.companyId}_${acc.userId}`} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 border border-slate-700">
                                  {(acc.fullName || acc.userId).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{acc.fullName || acc.userId}</span>
                                    {isCurrent && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">@{acc.userId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                                {branchConfig?.displayName || acc.companyId}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                acc.role === 'admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {acc.role}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{acc.phone || '—'}</td>
                            <td className="p-3 text-slate-500 text-[11px]">
                              {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'Active'}
                            </td>
                            <td className="p-3 text-right">
                              {isCurrent ? (
                                <span className="text-[10px] text-slate-500 italic">Logged In</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(acc)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: USER PROFILE & PASSWORD */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Avatar & Details */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-orange-500 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-amber-400">
                      {(fullName || userId || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="space-y-1 flex-1 text-center sm:text-left">
                  <div className="font-bold text-white text-sm">Profile Avatar</div>
                  <p className="text-[11px] text-slate-400">
                    Upload your profile picture to display in the header bar.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3 w-3" />
                      <span>{avatarUrl ? 'Change Avatar' : 'Upload Photo'}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-1 bg-rose-500/15 hover:bg-rose-500/25 rounded-lg text-xs font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username / Login ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="w-full bg-slate-800 text-white font-mono rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    placeholder=""
                    className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Password Change Box */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-400" />
                  <span>Change Account Password (Leave blank to keep unchanged)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 pr-8 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-white"
                      >
                        {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 pr-8 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-white"
                      >
                        {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 pr-8 text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Logout Session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Delete User Confirmation Popup Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete User Account?</h3>
                <p className="text-xs text-slate-400">This action will permanently revoke access.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">User ID:</span>
                <span className="font-mono font-bold text-amber-300">@{userToDelete.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-white">{userToDelete.fullName || userToDelete.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Branch:</span>
                <span className="text-slate-200">{COMPANY_CONFIGS[userToDelete.companyId]?.displayName || userToDelete.companyId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="uppercase text-orange-400 font-bold">{userToDelete.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingUser ? 'Deleting...' : 'Yes, Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Branch Confirmation Popup Modal */}
      {branchToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Branch / Firm?</h3>
                <p className="text-xs text-slate-400">This branch and its assigned users will be removed permanently.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Company Name:</span>
                <span className="font-bold text-white">{branchToDelete.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Branch Name:</span>
                <span className="font-bold text-amber-300">{branchToDelete.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Branch Code:</span>
                <span className="font-mono uppercase font-bold text-orange-400">{branchToDelete.branchCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">City / Location:</span>
                <span className="text-slate-200">{branchToDelete.city || '—'}, {branchToDelete.state || '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                disabled={isDeletingBranch}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBranch}
                disabled={isDeletingBranch}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingBranch ? 'Deleting...' : 'Yes, Delete Branch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
