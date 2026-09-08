import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  Phone,
  Truck,
  MapPin,
  Radio,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone
} from 'lucide-react';
import { LREntry } from '../types';
import { formatCityLocation, getNearestCityFromCoords } from '../utils/geoUtils';

interface DriverTrackingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lr: LREntry | null;
  onApplyDriverGpsToLR?: (lr: LREntry, lat: number, lng: number, address?: string) => void;
}

export const DriverTrackingShareModal: React.FC<DriverTrackingShareModalProps> = ({
  isOpen,
  onClose,
  lr,
  onApplyDriverGpsToLR
}) => {
  if (!isOpen || !lr) return null;

  const [driverMobile, setDriverMobile] = useState<string>(lr.driverMobile || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [liveDriverData, setLiveDriverData] = useState<any>(null);
  const [isCheckingLive, setIsCheckingLive] = useState<boolean>(false);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  // Generate safe deterministic token for this LR
  const token =
    lr.driverTrackingToken ||
    `ML-${lr.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-${lr.lrNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

  const driverUrl = `${window.location.origin}/?driver_track=${encodeURIComponent(
    token
  )}&lr=${encodeURIComponent(lr.lrNumber)}&veh=${encodeURIComponent(lr.vehicleNumber)}`;

  // Poll server and localStorage for live driver location updates
  useEffect(() => {
    let isMounted = true;

    const checkLiveLocation = async () => {
      try {
        setIsCheckingLive(true);
        // 1. Check server endpoint
        const res = await fetch(`/api/driver-location/${encodeURIComponent(token)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.location && isMounted) {
            setLiveDriverData(json.location);
            return;
          }
        }

        // 2. Check by LR Number fallback
        const res2 = await fetch(`/api/driver-location/${encodeURIComponent(lr.lrNumber)}`);
        if (res2.ok) {
          const json2 = await res2.json();
          if (json2?.location && isMounted) {
            setLiveDriverData(json2.location);
            return;
          }
        }

        // 3. Check localStorage fallback (for instant same-origin demo)
        const localKey = `driver_loc_${lr.lrNumber}`;
        const stored = localStorage.getItem(localKey);
        if (stored && isMounted) {
          try {
            setLiveDriverData(JSON.parse(stored));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Could not poll driver location:', err);
      } finally {
        if (isMounted) setIsCheckingLive(false);
      }
    };

    checkLiveLocation();
    const interval = setInterval(checkLiveLocation, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lr.lrNumber, token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(driverUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = driverMobile.replace(/[^0-9]/g, '');
    const message =
      `🚚 *MAHAVEER LOGISTICS - DRIVER LIVE GPS SHARING*\n\n` +
      `नमस्ते ${lr.driverName || 'ड्राइवर जी'},\n\n` +
      `गाड़ी नंबर: *${lr.vehicleNumber}*\n` +
      `बिल्टी नंबर: *${lr.lrNumber}*\n` +
      `रूट: *${lr.pickupLocation}* ➔ *${lr.deliveryLocation}*\n\n` +
      `कृपया नीचे दिए गए लिंक को अपने फोन के ब्राउज़र में खोलें और *"START LOCATION SHARING"* पर क्लिक करके लोकेशन चालू करें:\n\n` +
      `🔗 *GPS LINK:* ${driverUrl}\n\n` +
      `⚠️ *नोट:* कोई ऐप डाउनलोड करने की ज़रूरत नहीं है। कृपया गाड़ी चलाते समय यह लिंक खुला रखें।`;

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=91${cleanPhone.slice(-10)}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  const handleOpenSMS = () => {
    const cleanPhone = driverMobile.replace(/[^0-9]/g, '');
    const message = `Mahaveer Logistics GPS Link for ${lr.vehicleNumber} (${lr.lrNumber}): ${driverUrl}`;
    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(message)}`, '_blank');
  };

  const handleApplyGpsToCurrent = () => {
    if (!liveDriverData || !onApplyDriverGpsToLR) return;
    const cityResolved =
      formatCityLocation(liveDriverData.address, liveDriverData.lat, liveDriverData.lng) ||
      getNearestCityFromCoords(liveDriverData.lat, liveDriverData.lng);
    onApplyDriverGpsToLR(lr, liveDriverData.lat, liveDriverData.lng, cityResolved);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Share Driver Tracking Link</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                  No App Needed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Driver opens link in browser → Allows GPS → Live truck marker appears on map
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Trip Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-white font-mono text-sm">{lr.vehicleNumber}</span>
              </div>
              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {lr.lrNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
              <span>Driver: <strong className="text-slate-200">{lr.driverName || 'Not Assigned'}</strong></span>
              <span>Route: <strong className="text-slate-200">{lr.pickupLocation} ➔ {lr.deliveryLocation}</strong></span>
            </div>
          </div>

          {/* Driver Mobile Number Input */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span>Driver Mobile Number (ड्राइवर का मोबाइल नंबर):</span>
              <span className="text-[10px] text-slate-500">Auto-filled from records</span>
            </label>
            <div className="relative">
              <Phone className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono pl-9 pr-3 py-2.5 rounded-xl focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Generated Driver Tracking Link Box */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              Secure Driver GPS Web Link (चालक वेब लिंक):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={driverUrl}
                className="flex-1 bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px] px-3 py-2 rounded-xl outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Live Driver GPS Status Box */}
          <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      liveDriverData?.isSharingActive ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      liveDriverData?.isSharingActive ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  ></span>
                </span>
                <span className="font-bold text-slate-200">
                  {liveDriverData?.isSharingActive
                    ? 'Driver GPS Currently Transmitting 🟢'
                    : 'Driver Has Not Started GPS Yet'}
                </span>
              </div>
              {liveDriverData?.lastUpdated && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Active {Math.round((Date.now() - liveDriverData.lastUpdated) / 1000)}s ago
                </span>
              )}
            </div>

            {liveDriverData?.lat && liveDriverData?.lng && (
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                <div className="space-y-0.5">
                  <p className="text-white font-bold text-xs flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {formatCityLocation(liveDriverData.address, liveDriverData.lat, liveDriverData.lng) ||
                        getNearestCityFromCoords(liveDriverData.lat, liveDriverData.lng)}
                    </span>
                  </p>
                  <p className="font-mono text-slate-400 text-[10px]">
                    {liveDriverData.lat.toFixed(4)}° N, {liveDriverData.lng.toFixed(4)}° E
                    {liveDriverData.accuracy && ` (±${liveDriverData.accuracy}m)`}
                  </p>
                </div>

                {onApplyDriverGpsToLR && (
                  <button
                    type="button"
                    onClick={handleApplyGpsToCurrent}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{appliedNotice ? 'Applied!' : 'Apply GPS to LR'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Dispatch Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="h-4 w-4" />
                <span>WhatsApp to Driver</span>
              </button>

              {/* Open in New Tab for Immediate Office Testing */}
              <a
                href={driverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Test in New Tab ↗</span>
              </a>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleOpenSMS}
                className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
              >
                Send via Standard SMS
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
