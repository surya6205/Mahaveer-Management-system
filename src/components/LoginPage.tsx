import React, { useState, useEffect } from 'react';
import {
  Truck,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  UserPlus,
  LogIn,
  CheckCircle2,
  Phone,
  Briefcase,
  PlusCircle,
  MapPin,
  FileSpreadsheet,
  Landmark,
  CreditCard,
  Hash,
  Mail,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CompanyId, AuthSession, BranchUnit, BranchType, BranchStatus } from '../types';
import { AuthService } from '../utils/auth';
import { BranchService } from '../utils/branchService';
import loginHeroBg from '../assets/images/transport_login_bg_1787249309948.jpg';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'create_user' | 'add_branch'>('login');
  const [branches, setBranches] = useState<BranchUnit[]>(() => BranchService.getAllBranches());
  const [selectedCompany, setSelectedCompany] = useState<CompanyId | null>(() => {
    const list = BranchService.getAllBranches();
    return list.length > 0 ? list[0].id : 'mahaveer_logistics';
  });

  // Login States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Create User States
  const [newFullName, setNewFullName] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'operator' | 'staff'>('operator');
  const [newPhone, setNewPhone] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Add New Branch / Firm Form States
  const [branchCompanyName, setBranchCompanyName] = useState('Mahaveer Logistics');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchType, setBranchType] = useState<BranchType>('Branch');
  const [branchStatus, setBranchStatus] = useState<BranchStatus>('Active');
  const [branchContactPerson, setBranchContactPerson] = useState('');
  const [branchMobile, setBranchMobile] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchGst, setBranchGst] = useState('08AJAPJ9522F1ZC');
  const [branchPan, setBranchPan] = useState('AJAPJ9522F');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchState, setBranchState] = useState('Rajasthan');
  const [branchPincode, setBranchPincode] = useState('');
  // Branch Bank Details
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [branchBankName, setBranchBankName] = useState('RMGB');
  const [branchAccountNo, setBranchAccountNo] = useState('83085733179');
  const [branchIfsc, setBranchIfsc] = useState('RMGB0000433');
  const [branchAccountHolder, setBranchAccountHolder] = useState('');
  const [branchBankBranch, setBranchBankBranch] = useState('Jhotwara, Jaipur');
  const [branchUpiId, setBranchUpiId] = useState('9782162010@upi');
  // Initial Admin Credentials for New Branch
  const [branchAdminUserId, setBranchAdminUserId] = useState('');
  const [branchAdminPassword, setBranchAdminPassword] = useState('Admin@123');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reload branches list
  const refreshBranches = () => {
    const fresh = BranchService.getAllBranches();
    setBranches(fresh);
    return fresh;
  };

  useEffect(() => {
    refreshBranches();
  }, []);

  const handleCompanySelect = (companyId: CompanyId) => {
    setSelectedCompany(companyId);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCompany) {
      setErrorMessage('Please select a company / branch unit to continue');
      return;
    }

    if (!userId.trim() || !password) {
      setErrorMessage('Please enter both User ID and Password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.login(selectedCompany, userId, password);
      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Invalid User ID or Password');
      }
    } catch (err: any) {
      setErrorMessage('Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Create User Submission
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCompany) {
      setErrorMessage('Please select a company unit for the new account.');
      return;
    }

    if (!newUserId.trim() || newUserId.trim().length < 3) {
      setErrorMessage('User ID must be at least 3 characters long.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const createRes = await AuthService.createUser({
        companyId: selectedCompany,
        userId: newUserId.trim(),
        passwordPlain: newPassword,
        fullName: newFullName.trim() || newUserId.trim(),
        role: newRole,
        phone: newPhone.trim()
      });

      if (!createRes.success || !createRes.account) {
        setErrorMessage(createRes.error || 'Failed to create user account.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Account created for "@${createRes.account.userId}"! Logging you in...`);

      // Automatically log the new user in
      setTimeout(async () => {
        const loginRes = await AuthService.login(selectedCompany, newUserId.trim(), newPassword);
        if (loginRes.success && loginRes.session) {
          onLoginSuccess(loginRes.session);
        } else {
          setAuthMode('login');
          setUserId(newUserId.trim());
          setPassword('');
          setIsLoading(false);
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while creating user.');
      setIsLoading(false);
    }
  };

  // 3. Handle Add New Branch / Firm Submission
  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!branchCompanyName.trim()) {
      setErrorMessage('Please enter Company / Firm Name.');
      return;
    }

    if (!branchName.trim()) {
      setErrorMessage('Please enter Branch Name (e.g. Jaipur Head Office, Delhi Branch).');
      return;
    }

    if (!branchCode.trim()) {
      setErrorMessage('Please enter a Branch Code (e.g. JPR-01, DL-01).');
      return;
    }

    setIsLoading(true);
    try {
      const adminUid = branchAdminUserId.trim().toLowerCase() || `admin_${branchCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const adminPwd = branchAdminPassword.trim() || 'Admin@123';

      const newBranch = await BranchService.createBranch({
        companyName: branchCompanyName.trim().toUpperCase(),
        branchName: branchName.trim(),
        branchCode: branchCode.trim().toUpperCase(),
        shortCode: branchCode.trim().toUpperCase(),
        branchType,
        status: branchStatus,
        contactPerson: branchContactPerson.trim(),
        phone: branchMobile.trim(),
        email: branchEmail.trim(),
        gstNo: branchGst.trim(),
        panNo: branchPan.trim(),
        address: branchAddress.trim(),
        city: branchCity.trim(),
        state: branchState.trim(),
        pincode: branchPincode.trim(),
        bankName: branchBankName.trim(),
        accountNo: branchAccountNo.trim(),
        ifscCode: branchIfsc.trim(),
        accountHolderName: branchAccountHolder.trim() || `${branchCompanyName.trim()} (${branchName.trim()})`,
        bankBranch: branchBankBranch.trim(),
        upiId: branchUpiId.trim(),
        initialAdminUserId: adminUid,
        initialAdminPassword: adminPwd
      });

      const updatedList = refreshBranches();
      setSelectedCompany(newBranch.id);
      setSuccessMessage(`Branch "${newBranch.companyName} - ${newBranch.branchName}" (${newBranch.branchCode}) created successfully!`);

      // Reset form
      setBranchName('');
      setBranchCode('');
      setBranchAddress('');
      setBranchCity('');
      setBranchContactPerson('');
      setBranchMobile('');
      setBranchEmail('');
      setBranchAdminUserId('');

      // Auto-switch to login tab and pre-fill credentials for instant login
      setTimeout(() => {
        setAuthMode('login');
        setUserId(adminUid);
        setPassword(adminPwd);
        setIsLoading(false);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create new branch / firm.');
      setIsLoading(false);
    }
  };

  const handleFillDemo = (branch: BranchUnit) => {
    setAuthMode('login');
    setSelectedCompany(branch.id);
    if (branch.defaultCredentials) {
      setUserId(branch.defaultCredentials.userId);
      setPassword(branch.defaultCredentials.passwordPlain);
    } else {
      setUserId(`admin_${branch.branchCode.toLowerCase()}`);
      setPassword('Admin@123');
    }
    setErrorMessage('');
    setSuccessMessage('');
  };

  const selectedBranchObj = branches.find((b) => b.id === selectedCompany) || branches[0];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans p-4">
      {/* Background Hero Image with Deep Transport Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{
          backgroundImage: `url(${loginHeroBg})`
        }}
      >
        {/* Multi-layered dark logistics overlay for crisp readability */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-indigo-950/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/70 to-slate-950/95" />
      </div>

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl my-6">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-5 sm:p-7 text-white relative overflow-hidden">
          
          {/* Top Decorative Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-600" />

          {/* Header Brand */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/30 mb-2.5">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
              Transport Management System
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Secure Multi-User & Multi-Branch Portal
            </p>
          </div>

          {/* 3 Main Mode Switcher Tabs */}
          <div className="grid grid-cols-3 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-5 gap-1">
            {/* 1. Sign In / Login */}
            <button
              type="button"
              id="tab-mode-login"
              onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2 px-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Sign In / Login</span>
            </button>

            {/* 2. Create New User */}
            <button
              type="button"
              id="tab-mode-create-user"
              onClick={() => { setAuthMode('create_user'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2 px-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                authMode === 'create_user'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Create New User</span>
            </button>

            {/* 3. + Add New Branch / Firm */}
            <button
              type="button"
              id="tab-mode-add-branch"
              onClick={() => { setAuthMode('add_branch'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2 px-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                authMode === 'add_branch'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">+ Add Branch / Firm</span>
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* 1. SELECT COMPANY UNIT / CHOOSE BRANCH (Visible in Login and Create User modes) */}
          {authMode !== 'add_branch' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Select Company Unit / Choose Branch</span> <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('add_branch'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>+ Add Branch</span>
                </button>
              </div>

              {/* Dynamic Branch Cards Grid */}
              <div className={`grid ${branches.length > 2 ? 'grid-cols-1 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1' : 'grid-cols-2'} gap-2.5`}>
                {branches.map((b, idx) => {
                  const isSelected = selectedCompany === b.id;
                  const isAccent = idx % 2 === 0;
                  const badgeColor = isAccent ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  const activeBorder = isAccent ? 'border-indigo-500 ring-2 ring-indigo-500/40 from-indigo-600/30 to-blue-600/20' : 'border-blue-500 ring-2 ring-blue-500/40 from-blue-600/30 to-cyan-600/20';
                  
                  return (
                    <button
                      key={b.id}
                      type="button"
                      id={`btn-select-branch-${b.id}`}
                      onClick={() => handleCompanySelect(b.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-br ${activeBorder} shadow-lg shadow-black/40`
                          : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
                          UNIT {b.unitNumber || idx + 1} • {b.branchCode}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-white tracking-wide leading-tight">
                        {b.companyName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>{b.branchName}</span>
                        {b.branchType && <span className="text-[9px] text-slate-500 uppercase">{b.branchType}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE 1: SIGN IN / LOGIN FORM */}
          {/* ========================================================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  User ID / Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    id="input-login-userid"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder=""
                    required
                    className="w-full bg-slate-800/90 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-login-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder=""
                    required
                    className="w-full bg-slate-800/90 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>LOGIN TO {selectedBranchObj ? `${selectedBranchObj.companyName} (${selectedBranchObj.branchCode})` : 'PORTAL'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* MODE 2: CREATE NEW USER FORM */}
          {/* ========================================================= */}
          {authMode === 'create_user' && (
            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 mb-2 text-xs text-slate-300">
                Creating user for branch: <b className="text-indigo-400">{selectedBranchObj?.companyName}</b> - <span className="text-white">{selectedBranchObj?.branchName}</span> ({selectedBranchObj?.branchCode})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800/90 text-white rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* User ID / Username */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Username / ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800/90 text-white font-mono rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Role / System Access Level <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={newRole}
                      onChange={(e: any) => setNewRole(e.target.value)}
                      className="w-full bg-slate-800/90 text-white font-semibold rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="admin">Administrator (Full Access - All Tabs, Delete & Settings)</option>
                      <option value="manager">Branch Manager (Operations - LR, Fleet, Drivers, Rates, Reports)</option>
                      <option value="operator">Billing Operator (LR Booking, Invoices, Delivery & Payments)</option>
                      <option value="staff">Dispatch Staff (Status Tracking & Dispatch Coordination)</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-800/90 text-white rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800/90 text-white rounded-xl pl-8 pr-8 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="password"
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800/90 text-white rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Create User Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isLoading ? 'Creating User...' : 'CREATE USER & LOGIN AUTOMATICALLY'}</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* MODE 3: + ADD NEW BRANCH / FIRM FORM */}
          {/* ========================================================= */}
          {authMode === 'add_branch' && (
            <form onSubmit={handleAddBranchSubmit} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                <Building2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Create New Firm / Branch Unit</span>
                  <span>Once created, this branch will be instantly available in the Unit Selector for Bilty, LR, Billing, and multi-user login.</span>
                </div>
              </div>

              {/* Company / Firm Name */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Company / Firm Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={branchCompanyName}
                    onChange={(e) => setBranchCompanyName(e.target.value)}
                    placeholder=""
                    required
                    className="w-full bg-slate-800/90 text-white font-semibold rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Branch Name & Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Branch Name */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Branch Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-slate-800/90 text-white rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Branch Code */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Branch Code <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                      placeholder=""
                      required
                      className="w-full bg-slate-800/90 text-white font-mono uppercase font-bold rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Branch Type */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Branch Type
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={branchType}
                      onChange={(e: any) => setBranchType(e.target.value)}
                      className="w-full bg-slate-800/90 text-white rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Head Office">Head Office</option>
                      <option value="Branch">Branch</option>
                      <option value="Warehouse">Warehouse / Godown</option>
                      <option value="Booking Hub">Booking Hub</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={branchStatus}
                    onChange={(e: any) => setBranchStatus(e.target.value)}
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Address & City Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={branchState}
                    onChange={(e) => setBranchState(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={branchPincode}
                    onChange={(e) => setBranchPincode(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Tax & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={branchGst}
                    onChange={(e) => setBranchGst(e.target.value.toUpperCase())}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white font-mono uppercase rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    PAN
                  </label>
                  <input
                    type="text"
                    value={branchPan}
                    onChange={(e) => setBranchPan(e.target.value.toUpperCase())}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white font-mono uppercase rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={branchContactPerson}
                    onChange={(e) => setBranchContactPerson(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={branchMobile}
                    onChange={(e) => setBranchMobile(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-800/90 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Optional Bank Details Accordion */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setShowBankDetails(!showBankDetails)}
                  className="w-full p-2.5 flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Branch Bank & UPI Account Details (Optional)</span>
                  </span>
                  {showBankDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showBankDetails && (
                  <div className="p-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={branchBankName}
                        onChange={(e) => setBranchBankName(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={branchAccountNo}
                        onChange={(e) => setBranchAccountNo(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white font-mono rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={branchIfsc}
                        onChange={(e) => setBranchIfsc(e.target.value.toUpperCase())}
                        placeholder=""
                        className="w-full bg-slate-800 text-white font-mono rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">UPI ID</label>
                      <input
                        type="text"
                        value={branchUpiId}
                        onChange={(e) => setBranchUpiId(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-800 text-white rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Initial Admin Login Credentials Setup */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 mb-2">
                  <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Initial Admin Login for this Branch</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-300 mb-1">Admin Username</label>
                    <input
                      type="text"
                      value={branchAdminUserId}
                      onChange={(e) => setBranchAdminUserId(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-900 text-white font-mono rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-300 mb-1">Admin Password</label>
                    <input
                      type="text"
                      value={branchAdminPassword}
                      onChange={(e) => setBranchAdminPassword(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-900 text-white font-mono rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Add Branch Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-[0.98] disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isLoading ? 'Creating Branch / Firm...' : '+ SAVE & ACTIVATE BRANCH / FIRM'}</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          © {new Date().getFullYear()} Transport Management System • Protected by 256-bit SHA Encryption
        </p>
      </div>
    </div>
  );
};
