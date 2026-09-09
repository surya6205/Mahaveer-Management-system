import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false, className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or running in standalone mode, do not show
  if (isInstalled) {
    return null;
  }

  // Android / Desktop Chrome / Edge Flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer ${className}`}
        title="Install Mahaveer Management System as App"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>
    );
  }

  // iPhone / iPad Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-medium border border-amber-500/30 transition-all cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="h-3.5 w-3.5 text-amber-400" />
          <span>{compact ? 'App' : 'Install on iPhone'}</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center font-black text-white text-lg shadow-lg">
                  M
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-400">Mahaveer Management System PWA</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
                    <Share className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">1. Tap Safari Share</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Tap the <b className="text-slate-200">Share button</b> in the bottom or top Safari toolbar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                    <PlusSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">2. Add to Home Screen</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Scroll down the menu and select <b className="text-slate-200">'Add to Home Screen'</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">3. Confirm Installation</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Tap <b className="text-emerald-400">'Add'</b> at top right. The app will launch in standalone full-screen mode!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
