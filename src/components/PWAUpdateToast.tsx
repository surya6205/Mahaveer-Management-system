import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles } from 'lucide-react';

export const PWAUpdateToast: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.log('Mahaveer PWA Service Worker active:', r.scope);
      }
    },
    onRegisterError(error) {
      console.warn('Mahaveer PWA SW registration notice:', error);
    },
  });

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 p-4 shadow-2xl text-slate-100 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Update Available</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            A new version of Mahaveer Management System is ready. Refresh now to apply the latest updates.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh to Update</span>
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
