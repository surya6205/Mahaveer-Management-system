import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Building2,
  Save
} from 'lucide-react';
import { CompanyId, AuthSession } from '../types';
import { COMPANY_CONFIGS } from '../data/companyConfig';
import { AuthService } from '../utils/auth';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: AuthSession | null;
  onLogout: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onLogout
}) => {
  const [currentUserId, setCurrentUserId] = useState(currentSession?.userId || '');
  const [newUserId, setNewUserId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentSession) return null;

  const companyConfig = COMPANY_CONFIGS[currentSession.companyId];

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentUserId.trim()) {
      setErrorMessage('Please enter your Current User ID');
      return;
    }

    if (!currentPassword) {
      setErrorMessage('Please enter your Current Password');
      return;
    }

    const targetNewUser = newUserId.trim() || currentUserId.trim();
    if (!targetNewUser) {
      setErrorMessage('New User ID cannot be empty');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Please enter a New Password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New Password and Confirm New Password do not match');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('New Password must be at least 4 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await AuthService.updateCredentials(
        currentSession.companyId,
        currentUserId,
        currentPassword,
        targetNewUser,
        newPassword
      );

      if (result.success) {
        setSuccessMessage('Login credentials updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setNewUserId('');
      } else {
        setErrorMessage(result.error || 'Failed to update credentials');
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred while updating credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Admin Security Settings
              </h2>
              <p className="text-xs text-slate-400">
                Manage Login Credentials for <span className="text-sky-400 font-semibold">{companyConfig?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          
          {/* Active Company Status Box */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Active Company Unit</div>
                <div className="text-sm font-bold text-white">{companyConfig?.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Logged in as</div>
              <div className="text-xs font-semibold text-emerald-400">@{currentSession.userId} (Admin)</div>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            
            {/* Current User ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Current User ID <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  placeholder="Enter current user id"
                  required
                  className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* New User ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                New User ID <span className="text-slate-400 font-normal">(Leave unchanged if same)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="Enter new user id (e.g. admin_main)"
                  className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Current Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving Credentials...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          </form>

        </div>

        {/* Modal Footer with Logout Option */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
