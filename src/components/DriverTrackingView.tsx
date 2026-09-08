import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Power,
  RotateCw
} from 'lucide-react';
import { LREntry } from '../types';
import { getNearestCityFromCoords, formatCityLocation } from '../utils/geoUtils';

interface DriverTrackingViewProps {
  token: string;
  lrNumberParam?: string;
  vehicleNumberParam?: string;
  lrEntries?: LREntry[];
  onExit?: () => void;
}

export const DriverTrackingView: React.FC<DriverTrackingViewProps> = ({
  token,
  lrNumberParam = '',
  vehicleNumberParam = '',
  lrEntries = [],
  onExit
}) => {
  // Find matched LR entry if available in storage/state
  const matchedLR = lrEntries.find(
    (l) =>
      (l.driverTrackingToken && l.driverTrackingToken === token) ||
      (lrNumberParam && l.lrNumber.toLowerCase() === lrNumberParam.toLowerCase()) ||
      (vehicleNumberParam && l.vehicleNumber.toLowerCase().replace(/\s+/g, '') === vehicleNumberParam.toLowerCase().replace(/\s+/g, ''))
  );

  const displayLrNo = matchedLR?.lrNumber || lrNumberParam || 'LR-2026-27';
  const displayVehNo = matchedLR?.vehicleNumber || vehicleNumberParam || 'RJ 14 TRUCK';
  const displayDriverName = matchedLR?.driverName || 'Driver (चालक)';
  const displayRouteFrom = matchedLR?.pickupLocation || 'JAIPUR';
  const displayRouteTo = matchedLR?.deliveryLocation || 'DESTINATION';

  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy?: number; speed?: number } | null>(null);
  const [lastSentTime, setLastSentTime] = useState<string>('');
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [locationError, setLocationError] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [transmissionCount, setTransmissionCount] = useState<number>(0);
  const [approxAddress, setApproxAddress] = useState<string>('');

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Send coordinates to server API and local storage
  const sendLocationUpdate = async (
    lat: number,
    lng: number,
    accuracy?: number,
    speed?: number,
    heading?: number,
    addressOverride?: string
  ) => {
    try {
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const cityResolved = addressOverride || approxAddress || getNearestCityFromCoords(lat, lng);
      
      const payload = {
        token: token || `tok-${displayLrNo}`,
        lrId: matchedLR?.id || '',
        lrNumber: displayLrNo,
        vehicleNumber: displayVehNo,
        driverName: displayDriverName,
        lat,
        lng,
        accuracy: accuracy ? Math.round(accuracy) : undefined,
        speed: speed ? Math.round(speed * 3.6) : undefined, // m/s to km/h
        heading,
        address: cityResolved,
        isSharingActive: true,
        timestamp: new Date().toISOString()
      };

      // 1. Send to server endpoint
      fetch('/api/driver-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn('Server location sync notice:', e));

      // 2. Also mirror to localStorage & BroadcastChannel for instant same-browser testing
      try {
        const localKey = `driver_loc_${displayLrNo}`;
        localStorage.setItem(localKey, JSON.stringify(payload));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('driver_gps_updates');
          bc.postMessage(payload);
          bc.close();
        }
      } catch (e) {}

      setLastSentTime(nowStr);
      setSecondsAgo(0);
      setTransmissionCount((prev) => prev + 1);
    } catch (err: any) {
      console.warn('Location reporting warning:', err);
    }
  };

  // Start Location Sharing
  const handleStartSharing = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your mobile browser. Please use Chrome or Safari.');
      return;
    }

    setLocationError('');
    setIsLocating(true);

    // Initial immediate position fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy, speed: speed || undefined });
        setIsLocating(false);
        setIsSharing(true);

        const immediateCity = getNearestCityFromCoords(latitude, longitude);
        setApproxAddress(immediateCity);
        sendLocationUpdate(latitude, longitude, accuracy, speed || undefined, heading || undefined, immediateCity);

        // Try reverse geocoding via OpenStreetMap Nominatim for additional road/locality
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.address) {
              const city = data.address.city || data.address.town || data.address.state_district || data.address.county || '';
              const state = data.address.state || '';
              const road = data.address.road || '';
              const parts = [road, city, state].filter(Boolean).join(', ');
              if (parts) {
                setApproxAddress(parts);
                sendLocationUpdate(latitude, longitude, accuracy, speed || undefined, heading || undefined, parts);
              }
            }
          })
          .catch(() => {});
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('Location Permission Denied. Please allow location access in your browser settings (कृपया ब्राउज़र में लोकेशन की अनुमति दें).');
        } else {
          setLocationError(`Location Error: ${err.message}. Please check GPS signal.`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000
      }
    );

    // Watch position continuously as truck moves
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy, speed: speed || undefined });
        const cityNow = approxAddress || getNearestCityFromCoords(latitude, longitude);
        sendLocationUpdate(latitude, longitude, accuracy, speed || undefined, heading || undefined, cityNow);
      },
      (err) => {
        console.warn('WatchPosition error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000
      }
    );

    watchIdRef.current = wid;
  };

  // Stop Location Sharing
  const handleStopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);

    // Notify server that sharing was stopped
    fetch('/api/driver-location/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token || `tok-${displayLrNo}`,
        lrNumber: displayLrNo
      })
    }).catch(() => {});
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-request location sharing when driver opens link in mobile browser
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      handleStartSharing();
    }, 400);
    return () => clearTimeout(autoTimer);
  }, []);

  // Seconds counter tick
  useEffect(() => {
    if (!isSharing) return;
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSharing]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-3 sm:p-6 select-none font-sans">
      
      {/* Top Header Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                MAHAVEER LOGISTICS
              </h1>
              <p className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                Driver Live GPS Portal (चालक लोकेशन पोर्टल)
              </p>
            </div>
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700"
            >
              Exit Portal
            </button>
          )}
        </div>

        {/* Consignment & Vehicle Details */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Bilty / LR No:</span>
            <span className="font-mono font-black text-amber-400 text-sm">{displayLrNo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Vehicle No (गाड़ी):</span>
            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {displayVehNo}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Driver Name (चालक):</span>
            <span className="font-semibold text-slate-200">{displayDriverName}</span>
          </div>
          <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span className="text-slate-400">Route (मार्ग):</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="text-emerald-400">{displayRouteFrom}</span>
              <ArrowRight className="h-3 w-3 text-slate-500" />
              <span className="text-sky-400">{displayRouteTo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Card: Big Start / Stop Button */}
      <div className="w-full max-w-md my-4 space-y-4">
        
        {/* Error Alert if Permission Denied */}
        {locationError && (
          <div className="bg-rose-950/90 border border-rose-600/80 p-3.5 rounded-2xl flex items-start gap-3 text-rose-200 text-xs shadow-lg">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white">Location Access Needed / लोकेशन की अनुमति दें</p>
              <p className="text-[11px] text-rose-300 leading-relaxed">{locationError}</p>
            </div>
          </div>
        )}

        {/* Big Interactive Action Button */}
        {!isSharing ? (
          <button
            type="button"
            onClick={handleStartSharing}
            disabled={isLocating}
            className="w-full py-5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-emerald-950/50 flex flex-col items-center justify-center gap-1.5 transition-all transform active:scale-98 cursor-pointer border border-emerald-400/40"
          >
            {isLocating ? (
              <>
                <RotateCw className="h-7 w-7 animate-spin text-white" />
                <span>Getting GPS Signal... (जीपीएस जोड़ रहे हैं)</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Navigation className="h-6 w-6 text-emerald-200 animate-pulse" />
                  <span>START LOCATION SHARING</span>
                </div>
                <span className="text-xs font-normal text-emerald-100">
                  लोकेशन शेयर शुरू करें (Allow GPS Permission)
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopSharing}
            className="w-full py-5 px-6 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-rose-950/50 flex flex-col items-center justify-center gap-1.5 transition-all transform active:scale-98 cursor-pointer border border-rose-400/40"
          >
            <div className="flex items-center gap-2">
              <Power className="h-6 w-6 text-white" />
              <span>STOP LOCATION SHARING</span>
            </div>
            <span className="text-xs font-normal text-rose-100">
              लोकेशन शेयर बंद करें (Stop Live GPS)
            </span>
          </button>
        )}

        {/* Active Transmitting Status Card */}
        {isSharing && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-lg space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  LIVE GPS ACTIVE (लोकेशन चालू है)
                </span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-800">
                Auto-Updating
              </span>
            </div>

            {currentCoords && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Latitude</span>
                    <span className="font-mono font-bold text-white text-xs">{currentCoords.lat.toFixed(5)}° N</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Longitude</span>
                    <span className="font-mono font-bold text-white text-xs">{currentCoords.lng.toFixed(5)}° E</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                  <span>Signal Accuracy (परिशुद्धता):</span>
                  <strong className="text-emerald-400 font-mono">
                    ±{currentCoords.accuracy ? Math.round(currentCoords.accuracy) : 10} meters
                  </strong>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-emerald-500/40 text-xs flex items-start gap-2 text-slate-200">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current City / Location (वर्तमान शहर):</span>
                    <span className="font-bold text-white text-sm">
                      {approxAddress || (currentCoords ? getNearestCityFromCoords(currentCoords.lat, currentCoords.lng) : 'Locating...')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Last Sent to Office:</span>
                  <span className="font-mono text-sky-300 font-semibold">
                    {secondsAgo === 0 ? 'Just now (अभी)' : `${secondsAgo}s ago (${lastSentTime})`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Helpful Info Notice for Driver */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <span>Driver Guidelines (महत्वपूर्ण निर्देश):</span>
          </div>
          <p className="leading-relaxed">
            • <b>No App Required:</b> आपको कोई अलग ऐप इनस्टॉल करने की जरूरत नहीं है।
          </p>
          <p className="leading-relaxed">
            • <b>Keep Tab Open:</b> गाड़ी चलाते समय इस पेज को खुला रखें ताकि ऑफिस मैप पर लाइव गाड़ी की स्थिति दिखती रहे।
          </p>
          <p className="leading-relaxed">
            • <b>Trip Complete:</b> गंतव्य स्थान (Destination) पर पहुंचने के बाद लाल बटन दबाकर लोकेशन बंद कर सकते हैं।
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md text-center py-2 text-[10px] text-slate-500 border-t border-slate-900">
        <p>Mahaveer Logistics • 3 New Colony Near Phanchyat Samithi Jhotwara Jaipur</p>
        <p className="mt-0.5">Helpline: 9782162010 / 8386862130</p>
      </div>

    </div>
  );
};
