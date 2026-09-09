import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/40 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 animate-in fade-in duration-200">
        <Wifi className="h-3.5 w-3.5" />
        <span>Back Online — Synced with Cloud</span>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-600/90 backdrop-blur-sm border border-amber-400/40 text-white text-xs font-semibold shadow-lg shadow-amber-950/40 animate-in fade-in duration-200">
      <WifiOff className="h-3.5 w-3.5 animate-pulse" />
      <span>Offline Mode — Working with locally saved data</span>
    </div>
  );
};
