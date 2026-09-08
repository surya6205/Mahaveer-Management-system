import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Share2,
  Copy,
  Check,
  Calendar,
  Navigation,
  ArrowRight,
  Trash2,
  Compass,
  ExternalLink,
  Route,
  ShieldCheck,
  Send,
  Smartphone
} from 'lucide-react';
import { LREntry, TrackingEvent, LRStatus } from '../types';
import L from 'leaflet';
import { DriverTrackingShareModal } from './DriverTrackingShareModal';
import { formatCityLocation, getNearestCityFromCoords } from '../utils/geoUtils';

// Comprehensive Indian transport hub and industrial city coordinates dictionary
const CITY_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  // Gujarat Corridor
  'surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  'hazira': { lat: 21.1118, lng: 72.6515, state: 'Gujarat' },
  'navsari': { lat: 20.9467, lng: 72.9520, state: 'Gujarat' },
  'valsad': { lat: 20.5992, lng: 72.9342, state: 'Gujarat' },
  'vapi': { lat: 20.3893, lng: 72.9106, state: 'Gujarat' },
  'silvassa': { lat: 20.2763, lng: 73.0083, state: 'Dadra & Nagar Haveli' },
  'daman': { lat: 20.3974, lng: 72.8328, state: 'Daman & Diu' },
  'ankleshwar': { lat: 21.6264, lng: 73.0034, state: 'Gujarat' },
  'bharuch': { lat: 21.7051, lng: 72.9959, state: 'Gujarat' },
  'vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  'anand': { lat: 22.5645, lng: 72.9289, state: 'Gujarat' },
  'nadiad': { lat: 22.6916, lng: 72.8634, state: 'Gujarat' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'sanand': { lat: 22.9859, lng: 72.3800, state: 'Gujarat' },
  'gandhinagar': { lat: 23.2156, lng: 72.6369, state: 'Gujarat' },
  'rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  'jamnagar': { lat: 22.4707, lng: 70.0577, state: 'Gujarat' },
  'bhavnagar': { lat: 21.7645, lng: 72.1519, state: 'Gujarat' },
  'morbi': { lat: 22.8120, lng: 70.8377, state: 'Gujarat' },
  'gandhidham': { lat: 23.0753, lng: 70.1337, state: 'Gujarat' },
  'mundra': { lat: 22.8389, lng: 69.7214, state: 'Gujarat' },
  'kandla': { lat: 23.0033, lng: 70.2198, state: 'Gujarat' },
  'mehsana': { lat: 23.5880, lng: 72.3693, state: 'Gujarat' },
  'palanpur': { lat: 24.1724, lng: 72.4346, state: 'Gujarat' },

  // Maharashtra Corridor
  'pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'chakan': { lat: 18.7606, lng: 73.8587, state: 'Maharashtra' },
  'talegaon': { lat: 18.7303, lng: 73.6749, state: 'Maharashtra' },
  'bhosari': { lat: 18.6279, lng: 73.8447, state: 'Maharashtra' },
  'hadapsar': { lat: 18.5089, lng: 73.9259, state: 'Maharashtra' },
  'ranjangaon': { lat: 18.8242, lng: 74.2415, state: 'Maharashtra' },
  'hinjewadi': { lat: 18.5913, lng: 73.7389, state: 'Maharashtra' },
  'mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'navi mumbai': { lat: 19.0330, lng: 73.0297, state: 'Maharashtra' },
  'jnpt': { lat: 18.9499, lng: 72.9515, state: 'Maharashtra' },
  'nhava sheva': { lat: 18.9499, lng: 72.9515, state: 'Maharashtra' },
  'thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'bhiwandi': { lat: 19.2967, lng: 73.0631, state: 'Maharashtra' },
  'kalyan': { lat: 19.2403, lng: 73.1305, state: 'Maharashtra' },
  'panvel': { lat: 18.9894, lng: 73.1175, state: 'Maharashtra' },
  'lonavala': { lat: 18.7557, lng: 73.4091, state: 'Maharashtra' },
  'khopoli': { lat: 18.7858, lng: 73.3486, state: 'Maharashtra' },
  'nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'sinnar': { lat: 19.8456, lng: 74.0022, state: 'Maharashtra' },
  'aurangabad': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  'jalna': { lat: 19.8410, lng: 75.8864, state: 'Maharashtra' },
  'kolhapur': { lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  'solapur': { lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },
  'sangli': { lat: 16.8524, lng: 74.5815, state: 'Maharashtra' },
  'satara': { lat: 17.6805, lng: 74.0183, state: 'Maharashtra' },
  'ahmednagar': { lat: 19.0948, lng: 74.7480, state: 'Maharashtra' },
  'nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'butibori': { lat: 20.9238, lng: 78.9950, state: 'Maharashtra' },
  'amravati': { lat: 20.9374, lng: 77.7796, state: 'Maharashtra' },
  'akola': { lat: 20.7002, lng: 77.0082, state: 'Maharashtra' },
  'chandrapur': { lat: 19.9615, lng: 79.2961, state: 'Maharashtra' },
  'dhule': { lat: 20.9042, lng: 74.7749, state: 'Maharashtra' },
  'jalgaon': { lat: 21.0077, lng: 75.5626, state: 'Maharashtra' },

  // Rajasthan Corridor
  'jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'vki jaipur': { lat: 26.9850, lng: 75.7720, state: 'Rajasthan' },
  'sikar': { lat: 27.6094, lng: 75.1398, state: 'Rajasthan' },
  'ajmer': { lat: 26.4499, lng: 74.6399, state: 'Rajasthan' },
  'kishangarh': { lat: 26.5746, lng: 74.8643, state: 'Rajasthan' },
  'bhilwara': { lat: 25.3407, lng: 74.6313, state: 'Rajasthan' },
  'udaipur': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  'chittorgarh': { lat: 24.8887, lng: 74.6269, state: 'Rajasthan' },
  'jodhpur': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  'bikaner': { lat: 28.0229, lng: 73.3119, state: 'Rajasthan' },
  'kota': { lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  'alwar': { lat: 27.5530, lng: 76.6346, state: 'Rajasthan' },
  'bhiwadi': { lat: 28.2100, lng: 76.8600, state: 'Rajasthan' },
  'neemrana': { lat: 27.9892, lng: 76.3828, state: 'Rajasthan' },
  'kotputli': { lat: 27.7025, lng: 76.1963, state: 'Rajasthan' },
  'shahpura': { lat: 27.3888, lng: 75.9608, state: 'Rajasthan' },
  'pali': { lat: 25.7711, lng: 73.3234, state: 'Rajasthan' },
  'abu road': { lat: 24.4784, lng: 72.7818, state: 'Rajasthan' },

  // Delhi-NCR, Haryana & Punjab
  'delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR' },
  'new delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  'manesar': { lat: 28.3547, lng: 76.9388, state: 'Haryana' },
  'dharuhera': { lat: 28.2033, lng: 76.7828, state: 'Haryana' },
  'rewari': { lat: 28.1828, lng: 76.6186, state: 'Haryana' },
  'bawal': { lat: 28.0827, lng: 76.5861, state: 'Haryana' },
  'jhajjar': { lat: 28.6063, lng: 76.6565, state: 'Haryana' },
  'bahadurgarh': { lat: 28.6924, lng: 76.9240, state: 'Haryana' },
  'faridabad': { lat: 28.4089, lng: 77.3178, state: 'Haryana' },
  'sonipat': { lat: 28.9931, lng: 77.0151, state: 'Haryana' },
  'kundli': { lat: 28.8742, lng: 77.1264, state: 'Haryana' },
  'panipat': { lat: 29.3909, lng: 76.9635, state: 'Haryana' },
  'karnal': { lat: 29.6857, lng: 76.9905, state: 'Haryana' },
  'ambala': { lat: 30.3782, lng: 76.7767, state: 'Haryana' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Punjab' },
  'mohali': { lat: 30.7046, lng: 76.7179, state: 'Punjab' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  'jalandhar': { lat: 31.3260, lng: 75.5762, state: 'Punjab' },
  'amritsar': { lat: 31.6340, lng: 74.8723, state: 'Punjab' },

  // Uttar Pradesh & MP Corridor
  'noida': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  'greater noida': { lat: 28.4744, lng: 77.5040, state: 'Uttar Pradesh' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
  'meerut': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  'mathura': { lat: 27.4924, lng: 77.6737, state: 'Uttar Pradesh' },
  'agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  'lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'prayagraj': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  'allahabad': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  'varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  'jhansi': { lat: 25.4484, lng: 78.5685, state: 'Uttar Pradesh' },
  'gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },
  'indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'pithampur': { lat: 22.6148, lng: 75.6888, state: 'Madhya Pradesh' },
  'dewas': { lat: 22.9676, lng: 76.0534, state: 'Madhya Pradesh' },
  'ujjain': { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  'mandideep': { lat: 23.0617, lng: 77.5186, state: 'Madhya Pradesh' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },

  // Chhattisgarh, Bengal, Bihar & South India
  'raipur': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  'bilaspur': { lat: 22.0797, lng: 82.1409, state: 'Chhattisgarh' },
  'raigarh': { lat: 21.8974, lng: 83.3950, state: 'Chhattisgarh' },
  'bhilai': { lat: 21.2090, lng: 81.3789, state: 'Chhattisgarh' },
  'kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'howrah': { lat: 22.5958, lng: 88.2636, state: 'West Bengal' },
  'durgapur': { lat: 23.5204, lng: 87.3119, state: 'West Bengal' },
  'siliguri': { lat: 26.7271, lng: 88.3953, state: 'West Bengal' },
  'patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  'ranchi': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  'jamshedpur': { lat: 22.8046, lng: 86.2029, state: 'Jharkhand' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'rangareddy': { lat: 17.3200, lng: 78.4100, state: 'Telangana' },
  'secunderabad': { lat: 17.4399, lng: 78.4983, state: 'Telangana' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'hoskote': { lat: 13.0699, lng: 77.7981, state: 'Karnataka' },
  'peenya': { lat: 13.0285, lng: 77.5197, state: 'Karnataka' },
  'belgaum': { lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  'chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'kochi': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  'vijayawada': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' }
};

// Available Tracking Statuses
export const TRACKING_STATUS_OPTIONS = [
  'Booking Confirmed',
  'Vehicle Assigned',
  'Vehicle Reached Pickup',
  'Material Loaded',
  'Dispatched',
  'In Transit',
  'Reached Checkpoint Hub',
  'Departed From Hub',
  'Crossed Toll Plaza',
  'Reached Destination City',
  'Out for Delivery',
  'Delivered',
  'Delivery Failed',
  'Returned'
];

// Clean text helper (removes punctuations, splits terms)
function normalizeText(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Helper to look up coordinates for any location string
function findCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  if (!cityName) return null;
  const norm = normalizeText(cityName);
  if (!norm) return null;

  // 1. Direct key matches
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (norm === key || norm === `${key} hub` || norm === `${key} city`) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }

  // 2. Multi-word containment (e.g. "MIDC Chakan Phase 3", "Hazira Industrial Area Surat", "Jhotwara Jaipur")
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    // Check if key is a standalone word in norm
    const words = norm.split(' ');
    if (words.includes(key) || norm.includes(key)) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }

  return null;
}

// Master resolver: Finds coordinates or does route-aligned interpolation
function getSmartWaypointCoords(
  locationName: string,
  pickupCity: string,
  deliveryCity: string,
  progressRatio: number = 0.5
): { lat: number; lng: number; isEstimated?: boolean } {
  // 1. Try resolving exact or matched city
  const direct = findCityCoordinates(locationName);
  if (direct) return { lat: direct.lat, lng: direct.lng };

  // 2. Resolve pickup and delivery coordinates
  const pCoords = findCityCoordinates(pickupCity) || { lat: 21.1702, lng: 72.8311 }; // Surat default if unresolvable
  const dCoords = findCityCoordinates(deliveryCity) || { lat: 18.5204, lng: 73.8567 }; // Pune default if unresolvable

  // 3. Interpolate along the direct route line between Origin and Destination
  const clampedRatio = Math.min(1, Math.max(0, progressRatio));
  return {
    lat: pCoords.lat + (dCoords.lat - pCoords.lat) * clampedRatio,
    lng: pCoords.lng + (dCoords.lng - pCoords.lng) * clampedRatio,
    isEstimated: true
  };
}

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lrEntries: LREntry[];
  initialTrackingNo?: string;
  onUpdateLREntry?: (updatedLR: LREntry) => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  lrEntries,
  initialTrackingNo = '',
  onUpdateLREntry
}) => {
  if (!isOpen) return null;

  // Selected LR Entry
  const [selectedLR, setSelectedLR] = useState<LREntry | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialTrackingNo);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Driver Live Tracking Share & GPS Streaming State
  const [isDriverShareModalOpen, setIsDriverShareModalOpen] = useState(false);
  const [liveDriverGps, setLiveDriverGps] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    address?: string;
    isSharingActive?: boolean;
    lastUpdated?: number;
  } | null>(null);

  // Form states for Update Tracking panel
  const [updateStatus, setUpdateStatus] = useState<string>('In Transit');
  const [updateLocation, setUpdateLocation] = useState<string>('');
  const [updateDate, setUpdateDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [updateTime, setUpdateTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [updateRemark, setUpdateRemark] = useState<string>('');

  // Autocomplete suggestions state
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<{ name: string; state: string }[]>([]);

  // Map Tile Style ('streets' | 'dark' | 'satellite')
  const [mapStyle, setMapStyle] = useState<'streets' | 'dark' | 'satellite'>('streets');

  // Leaflet Map Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapInstanceRef = useRef<L.Map | null>(null);

  // Set to Current Date and Time
  const handleSetCurrentDateTime = () => {
    const d = new Date();
    setUpdateDate(d.toISOString().split('T')[0]);
    setUpdateTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  const formatDisplayDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mName = months[parseInt(m, 10) - 1] || m;
      return `${parseInt(d, 10)} ${mName} ${y} ${timeStr || ''}`.trim();
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  const getFormattedNow = () => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dateStr} ${timeStr}`;
  };

  // Load target LR on mount or search query change
  useEffect(() => {
    let target: LREntry | undefined;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      target = lrEntries.find(
        (lr) =>
          lr.lrNumber.toLowerCase().includes(q) ||
          (lr.trackingNumber && lr.trackingNumber.toLowerCase().includes(q)) ||
          lr.vehicleNumber.toLowerCase().includes(q)
      );
    }

    if (!target && lrEntries.length > 0) {
      target = lrEntries[0];
    }

    if (target) {
      loadLR(target);
    }
  }, [initialTrackingNo, lrEntries]);

  // Load a specific LR and set initial form values strictly from that LR
  const loadLR = (lr: LREntry) => {
    setSelectedLR(lr);
    setUpdateStatus(
      lr.status === 'Delivered'
        ? 'Delivered'
        : lr.status === 'Pending Pickup'
        ? 'Booking Confirmed'
        : 'In Transit'
    );
    // Use actual current hub formatted as readable city or default to pickup location
    const rawLoc = lr.currentHub && lr.currentHub.trim() !== '' ? lr.currentHub : lr.pickupLocation || '';
    const currentLoc = formatCityLocation(rawLoc, lr.driverGps?.lat, lr.driverGps?.lng) || rawLoc;
    setUpdateLocation(currentLoc);
    handleSetCurrentDateTime();
    setUpdateRemark(`Vehicle ${lr.vehicleNumber} on route ${lr.pickupLocation} to ${lr.deliveryLocation}`);
  };

  // Poll live driver location from server & local broadcast
  useEffect(() => {
    if (!selectedLR) {
      setLiveDriverGps(null);
      return;
    }

    let isMounted = true;
    const token =
      selectedLR.driverTrackingToken ||
      `ML-${selectedLR.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-${selectedLR.lrNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

    const pollLocation = async () => {
      try {
        // 1. Fetch from server endpoint
        const res = await fetch(`/api/driver-location/${encodeURIComponent(token)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.location && isMounted) {
            setLiveDriverGps(json.location);
            return;
          }
        }
        // 2. Fallback check by LR number
        const res2 = await fetch(`/api/driver-location/${encodeURIComponent(selectedLR.lrNumber)}`);
        if (res2.ok) {
          const json2 = await res2.json();
          if (json2?.location && isMounted) {
            setLiveDriverGps(json2.location);
            return;
          }
        }
        // 3. Fallback to localStorage
        const stored = localStorage.getItem(`driver_loc_${selectedLR.lrNumber}`);
        if (stored && isMounted) {
          try {
            setLiveDriverGps(JSON.parse(stored));
          } catch (e) {}
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    pollLocation();
    const interval = setInterval(pollLocation, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedLR?.id, selectedLR?.lrNumber, selectedLR?.driverTrackingToken]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const found = lrEntries.find(
      (lr) =>
        lr.lrNumber.toLowerCase().includes(q) ||
        (lr.trackingNumber && lr.trackingNumber.toLowerCase().includes(q)) ||
        lr.vehicleNumber.toLowerCase().includes(q) ||
        (lr.consigneeName && lr.consigneeName.toLowerCase().includes(q))
    );

    if (found) {
      loadLR(found);
    } else {
      alert(`No shipment found matching "${searchQuery}". Showing available list.`);
    }
  };

  // Autocomplete filtering for Location input
  const handleLocationInputChange = (val: string) => {
    setUpdateLocation(val);
    if (!val.trim()) {
      setShowLocationSuggestions(false);
      return;
    }
    const q = normalizeText(val);
    const matches: { name: string; state: string }[] = [];

    for (const [key, data] of Object.entries(CITY_COORDINATES)) {
      if (key.includes(q) || q.includes(key)) {
        const formattedName = key
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        matches.push({ name: formattedName, state: data.state });
      }
    }

    setFilteredLocations(matches.slice(0, 8));
    setShowLocationSuggestions(matches.length > 0);
  };

  // Helper to extract valid tracking events without fake hardcoded hubs
  const getCleanEvents = (lr: LREntry): TrackingEvent[] => {
    // If LR has user-defined tracking events, use them
    if (lr.trackingEvents && lr.trackingEvents.length > 0) {
      // Filter out any legacy dummy event containing 'Neemrana' if the route does not involve Neemrana
      const isNeemranaRoute =
        lr.pickupLocation.toLowerCase().includes('neemrana') ||
        lr.deliveryLocation.toLowerCase().includes('neemrana');

      const cleaned = lr.trackingEvents.filter((ev) => {
        if (!isNeemranaRoute && ev.location.toLowerCase().includes('neemrana')) {
          return false;
        }
        return true;
      });

      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    // Default clean milestones generated strictly from LR origin & destination
    const events: TrackingEvent[] = [
      {
        id: `evt-loaded-${lr.id}`,
        statusName: 'Material Loaded',
        location: lr.pickupLocation,
        eventText: `Material loaded into vehicle ${lr.vehicleNumber}`,
        timestamp: `${lr.bookingDate} 09:30`,
        completed: true,
        remarks: 'Material Loaded & Weighed'
      },
      {
        id: `evt-disp-${lr.id}`,
        statusName: 'Dispatched',
        location: lr.pickupLocation,
        eventText: `Dispatched from origin ${lr.pickupLocation}`,
        timestamp: `${lr.bookingDate} 11:45`,
        completed: true,
        remarks: 'Vehicle Dispatched on Highway'
      }
    ];

    // If user has set a current checkpoint that is different from pickup & delivery, show it as current
    if (
      lr.currentHub &&
      lr.currentHub.trim() !== '' &&
      lr.currentHub.toLowerCase().trim() !== lr.pickupLocation.toLowerCase().trim() &&
      lr.currentHub.toLowerCase().trim() !== lr.deliveryLocation.toLowerCase().trim()
    ) {
      // Avoid fake Neemrana on non-Neemrana routes
      const isFakeNeemrana =
        !lr.pickupLocation.toLowerCase().includes('neemrana') &&
        !lr.deliveryLocation.toLowerCase().includes('neemrana') &&
        lr.currentHub.toLowerCase().includes('neemrana');

      if (!isFakeNeemrana) {
        events.push({
          id: `evt-hub-${lr.id}`,
          statusName: lr.status === 'Delivered' ? 'Reached Checkpoint' : 'In Transit',
          location: lr.currentHub,
          eventText: `Checkpoint update at ${lr.currentHub}`,
          timestamp: 'Active Transit',
          completed: true,
          isCurrent: lr.status !== 'Delivered',
          remarks: 'Checkpoint Cleared'
        });
      }
    }

    // If delivered, append delivered milestone
    if (lr.status === 'Delivered') {
      events.push({
        id: `evt-del-${lr.id}`,
        statusName: 'Delivered',
        location: lr.deliveryLocation,
        eventText: `Consignment delivered successfully to consignee`,
        timestamp: `${lr.deliveryDate || lr.bookingDate} 16:00`,
        completed: true,
        isCurrent: true,
        remarks: 'POD / Delivery Acknowledged'
      });
    }

    return events;
  };

  // Render Leaflet Map
  useEffect(() => {
    if (!selectedLR || !mapContainerRef.current) return;

    // 1. Get Origin & Destination Coordinates
    const pickupCoords = getSmartWaypointCoords(selectedLR.pickupLocation, selectedLR.pickupLocation, selectedLR.deliveryLocation, 0);
    const destCoords = getSmartWaypointCoords(selectedLR.deliveryLocation, selectedLR.pickupLocation, selectedLR.deliveryLocation, 1);

    // 2. Resolve Driver Current Location (Live GPS priority, then recorded hub, then origin)
    let driverLat = pickupCoords.lat;
    let driverLng = pickupCoords.lng;
    let driverLocName = currentVehicleLocation || selectedLR.pickupLocation;
    let isLiveStreaming = false;
    let speedText = '';
    let lastUpdatedText = '';

    if (liveDriverGps && typeof liveDriverGps.lat === 'number' && typeof liveDriverGps.lng === 'number') {
      driverLat = liveDriverGps.lat;
      driverLng = liveDriverGps.lng;
      driverLocName = formatCityLocation(liveDriverGps.address, liveDriverGps.lat, liveDriverGps.lng);
      isLiveStreaming = true;
      if (liveDriverGps.speed) speedText = `${Math.round(liveDriverGps.speed * 3.6)} km/h`;
      if (liveDriverGps.lastUpdated) {
        const secAgo = Math.max(0, Math.round((Date.now() - liveDriverGps.lastUpdated) / 1000));
        lastUpdatedText = secAgo < 60 ? `${secAgo}s ago` : `${Math.round(secAgo / 60)}m ago`;
      }
    } else if (selectedLR.driverGps && typeof selectedLR.driverGps.lat === 'number' && typeof selectedLR.driverGps.lng === 'number') {
      driverLat = selectedLR.driverGps.lat;
      driverLng = selectedLR.driverGps.lng;
      driverLocName = formatCityLocation(selectedLR.driverGps.address, selectedLR.driverGps.lat, selectedLR.driverGps.lng);
      isLiveStreaming = true;
    } else if (selectedLR.status === 'Delivered') {
      driverLat = destCoords.lat;
      driverLng = destCoords.lng;
      driverLocName = selectedLR.deliveryLocation;
    } else if (selectedLR.currentHub && selectedLR.currentHub.trim() !== '') {
      const hubCoords = getSmartWaypointCoords(selectedLR.currentHub, selectedLR.pickupLocation, selectedLR.deliveryLocation, 0.5);
      driverLat = hubCoords.lat;
      driverLng = hubCoords.lng;
      driverLocName = formatCityLocation(selectedLR.currentHub);
    }

    // Clean existing map instance
    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [driverLat, driverLng],
        zoom: 7,
        zoomControl: false
      });

      leafletMapInstanceRef.current = map;

      // Add Tile Layer
      const tileUrl =
        mapStyle === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : mapStyle === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 18,
        attribution: '© OpenStreetMap | Mahaveer Logistics Google Maping'
      }).addTo(map);

      // Add Zoom Control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Draw Clean Routes (Only Origin -> Driver Location -> Destination)
      const completedPoints: [number, number][] = [
        [pickupCoords.lat, pickupCoords.lng],
        [driverLat, driverLng]
      ];

      const remainingPoints: [number, number][] = [
        [driverLat, driverLng],
        [destCoords.lat, destCoords.lng]
      ];

      // Completed Leg Polyline (Solid Emerald Green)
      L.polyline(completedPoints, {
        color: '#059669',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);

      L.polyline(completedPoints, {
        color: '#34d399',
        weight: 2.5,
        opacity: 1,
        lineJoin: 'round'
      }).addTo(map);

      // Remaining Leg Polyline (Dashed Amber)
      if (selectedLR.status !== 'Delivered') {
        L.polyline(remainingPoints, {
          color: '#d97706',
          weight: 4.5,
          dashArray: '8, 12',
          opacity: 0.85
        }).addTo(map);
      }

      // Add ONLY Clean Necessary Markers: Origin, Destination, and Driver Current Location
      const bounds = L.latLngBounds([
        [pickupCoords.lat, pickupCoords.lng],
        [driverLat, driverLng],
        [destCoords.lat, destCoords.lng]
      ]);

      // 1. Origin Marker
      const originIcon = L.divIcon({
        html: `
          <div style="background:#059669; color:#ffffff; padding:4px 9px; border-radius:12px; font-weight:800; font-size:11px; border:2px solid #ffffff; box-shadow:0 4px 12px rgba(5,150,105,0.6); white-space:nowrap; display:flex; align-items:center; gap:5px;">
            <span>🟢</span>
            <span>ORIGIN: ${selectedLR.pickupLocation}</span>
          </div>`,
        className: 'custom-map-marker',
        iconSize: [160, 32],
        iconAnchor: [80, 16]
      });
      L.marker([pickupCoords.lat, pickupCoords.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<strong>Origin:</strong> ${selectedLR.pickupLocation}<br/>Date: ${selectedLR.bookingDate}`);

      // 2. Destination Marker
      const destIcon = L.divIcon({
        html: `
          <div style="background:#dc2626; color:#ffffff; padding:4px 9px; border-radius:12px; font-weight:800; font-size:11px; border:2px solid #ffffff; box-shadow:0 4px 12px rgba(220,38,38,0.6); white-space:nowrap; display:flex; align-items:center; gap:5px;">
            <span>🏁</span>
            <span>DESTINATION: ${selectedLR.deliveryLocation}</span>
          </div>`,
        className: 'custom-map-marker',
        iconSize: [160, 32],
        iconAnchor: [80, 16]
      });
      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>Destination:</strong> ${selectedLR.deliveryLocation}<br/>Status: ${selectedLR.status}`);

      // 3. Driver Current Location Marker (Truck / Car Icon with Real-Time Pulse)
      const driverIconHtml = `
        <div style="background:#1d4ed8; color:#ffffff; padding:6px 14px; border-radius:20px; font-weight:900; font-size:11.5px; border:2.5px solid #ffffff; box-shadow:0 0 24px rgba(37,99,235,0.95); white-space:nowrap; display:flex; align-items:center; gap:7px; animation: pulse 2s infinite;">
          <span style="font-size:16px;">🚚</span>
          <div style="display:flex; flex-direction:column; line-height:1.2; text-align:left;">
            <span style="font-weight:900; letter-spacing:0.5px;">${selectedLR.vehicleNumber}</span>
            <span style="font-size:9.5px; opacity:0.95; font-weight:700; color:#bfdbfe;">
              ${isLiveStreaming ? `🟢 ${driverLocName}` : `📍 ${driverLocName}`}
              ${speedText ? ` • ${speedText}` : ''}
            </span>
          </div>
        </div>`;

      const distToPickup = Math.hypot(driverLat - pickupCoords.lat, driverLng - pickupCoords.lng);
      const iconAnchorY = distToPickup < 0.05 ? 38 : 21;

      const driverIcon = L.divIcon({
        html: driverIconHtml,
        className: 'custom-map-marker',
        iconSize: [210, 42],
        iconAnchor: [105, iconAnchorY]
      });

      const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
      driverMarker.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; color:#0f172a; padding:5px; min-width:160px;">
          <div style="font-weight:900; color:#1e40af; font-size:13px; margin-bottom:3px;">
            🚚 Driver Current Location
          </div>
          <div style="font-weight:700; color:#334155; margin-bottom:2px;">
            Vehicle: <span style="color:#1d4ed8; font-family:monospace;">${selectedLR.vehicleNumber}</span>
          </div>
          <div style="font-weight:600; color:#059669; margin-bottom:2px;">
            Location: ${driverLocName}
          </div>
          ${isLiveStreaming ? '<div style="font-size:11px; color:#0284c7; font-weight:bold;">⚡ Live GPS Streaming Active</div>' : ''}
          ${speedText ? `<div style="font-size:11px; color:#475569;">Speed: ${speedText}</div>` : ''}
          ${lastUpdatedText ? `<div style="font-size:10px; color:#64748b;">Updated: ${lastUpdatedText}</div>` : ''}
        </div>
      `);

      // Fit map bounds cleanly
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Leaflet Map Error:', err);
    }
  }, [selectedLR, mapStyle, liveDriverGps]);

  // Handle Main UPDATE TRACKING Submit Action
  const handleUpdateTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLR) return;

    if (!updateLocation.trim()) {
      alert('Please enter or select a current location.');
      return;
    }

    const currentEvents = getCleanEvents(selectedLR);

    // Create new milestone tracking event with exact user-entered location
    const formattedTimestamp = formatDisplayDateTime(updateDate, updateTime) || getFormattedNow();
    const newEvt: TrackingEvent = {
      id: `evt-${Date.now()}`,
      statusName: updateStatus,
      location: updateLocation.trim(),
      eventText: updateRemark.trim() || `${updateStatus} at ${updateLocation.trim()}`,
      timestamp: formattedTimestamp,
      completed: true,
      isCurrent: updateStatus !== 'Delivered',
      remarks: updateRemark.trim() || `${updateStatus} at ${updateLocation.trim()}`
    };

    // Mark previous current markers false and append new event
    const updatedEvents: TrackingEvent[] = currentEvents.map((ev) => ({
      ...ev,
      isCurrent: false
    }));
    updatedEvents.push(newEvt);

    // Map status enum compatibility
    let mappedLRStatus: LRStatus = selectedLR.status;
    if (updateStatus === 'Delivered') {
      mappedLRStatus = 'Delivered';
    } else if (updateStatus === 'Pending Pickup' || updateStatus === 'Booking Confirmed') {
      mappedLRStatus = 'Pending Pickup';
    } else {
      mappedLRStatus = 'In Transit';
    }

    const updatedLR: LREntry = {
      ...selectedLR,
      status: mappedLRStatus,
      currentHub: updateLocation.trim(),
      latestEvent: `${updateStatus} - ${updateLocation.trim()}`,
      trackingEvents: updatedEvents
    };

    setSelectedLR(updatedLR);

    if (onUpdateLREntry) {
      onUpdateLREntry(updatedLR);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // Reset update remark for next entry
    setUpdateRemark('');
  };

  // Delete a specific history event
  const handleDeleteEvent = (eventId: string) => {
    if (!selectedLR) return;
    const currentEvents = getCleanEvents(selectedLR);
    const filtered = currentEvents.filter((ev) => ev.id !== eventId);

    const latestActive = filtered[filtered.length - 1];
    const newCurrentHub = latestActive ? latestActive.location : selectedLR.pickupLocation;

    const updatedLR: LREntry = {
      ...selectedLR,
      currentHub: newCurrentHub,
      trackingEvents: filtered
    };

    setSelectedLR(updatedLR);
    if (onUpdateLREntry) {
      onUpdateLREntry(updatedLR);
    }
  };

  // Open direct Google Maps driving navigation route
  const handleOpenGoogleMapsRoute = () => {
    if (!selectedLR) return;
    const origin = encodeURIComponent(selectedLR.pickupLocation);
    const destination = encodeURIComponent(selectedLR.deliveryLocation);
    const waypoints =
      selectedLR.currentHub &&
      selectedLR.currentHub.toLowerCase().trim() !== selectedLR.pickupLocation.toLowerCase().trim() &&
      selectedLR.currentHub.toLowerCase().trim() !== selectedLR.deliveryLocation.toLowerCase().trim()
        ? `&waypoints=${encodeURIComponent(selectedLR.currentHub)}`
        : '';

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (!selectedLR) return;
    const link = `https://mahaveerlogistics.com/track?lr=${encodeURIComponent(selectedLR.lrNumber)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!selectedLR) return;
    const currentLoc = selectedLR.currentHub || selectedLR.pickupLocation;
    const text =
      `🚚 *MAHAVEER LOGISTICS - LIVE CONSIGNMENT TRACKING*\n\n` +
      `Billty / LR No: *${selectedLR.lrNumber}*\n` +
      `Vehicle No: *${selectedLR.vehicleNumber}*\n` +
      `Route: *${selectedLR.pickupLocation}* ➔ *${selectedLR.deliveryLocation}*\n` +
      `Consignor: ${selectedLR.consignorName || selectedLR.partyName}\n` +
      `Consignee: ${selectedLR.consigneeName || 'Consignee'}\n` +
      `Current Status: *${selectedLR.status}*\n` +
      `Current Location: *${currentLoc}*\n\n` +
      `📍 *Open Live Google Maps Navigation:* https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        selectedLR.pickupLocation
      )}&destination=${encodeURIComponent(selectedLR.deliveryLocation)}&travelmode=driving`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const activeEvents = selectedLR ? getCleanEvents(selectedLR) : [];
  const currentVehicleLocation = formatCityLocation(
    selectedLR?.currentHub,
    liveDriverGps?.lat ?? selectedLR?.driverGps?.lat,
    liveDriverGps?.lng ?? selectedLR?.driverGps?.lng
  ) || selectedLR?.pickupLocation || '';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl text-slate-100 my-auto">
        {/* Modal Top Navigation Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Consignment Live Google Map Tracking</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Live Route
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {selectedLR
                  ? `Route: ${selectedLR.pickupLocation} ➔ ${selectedLR.deliveryLocation} | Live Location: ${currentVehicleLocation}`
                  : 'Pickup ➔ Real-time Checkpoints ➔ Delivery Destination'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Driver Tracking Link Button */}
            <button
              type="button"
              onClick={() => setIsDriverShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white border border-indigo-400/40 rounded-lg text-xs font-black shadow-md transition-all cursor-pointer"
              title="Share live GPS link with Driver via WhatsApp / SMS"
            >
              <Smartphone className="h-3.5 w-3.5 text-indigo-200" />
              <span>Share Driver Tracking Link</span>
              {liveDriverGps?.isSharingActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            {/* Open Google Maps Button */}
            <button
              onClick={handleOpenGoogleMapsRoute}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
              title="Open driving navigation in Google Maps"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Google Maps ↗</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bilty Search & Select Header */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-indigo-400 font-bold shrink-0 flex items-center gap-1">
              <Search className="h-3.5 w-3.5" /> Select Bilty / LR:
            </span>
            <select
              value={selectedLR?.id || ''}
              onChange={(e) => {
                const found = lrEntries.find((l) => l.id === e.target.value);
                if (found) loadLR(found);
              }}
              className="bg-slate-900 border border-slate-700 text-sky-300 font-mono text-xs font-bold rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-96 shadow-inner"
            >
              {lrEntries.map((lr) => (
                <option key={lr.id} value={lr.id}>
                  {lr.lrNumber} ({lr.vehicleNumber}) - {lr.pickupLocation} ➔ {lr.deliveryLocation}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Bilty No. or Vehicle No..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg shrink-0 shadow"
            >
              Search
            </button>
          </form>
        </div>

        {/* Selected LR Summary Bar */}
        {selectedLR && (
          <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/80 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Billty / LR No.</span>
              <span className="font-mono text-sm font-black text-sky-300">{selectedLR.lrNumber}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vehicle Number</span>
              <span className="font-mono text-sm font-bold text-emerald-400">{selectedLR.vehicleNumber}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Route Journey</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                <span className="text-emerald-400">{selectedLR.pickupLocation}</span>
                <ArrowRight className="h-3 w-3 text-sky-400" />
                <span className="text-rose-400">{selectedLR.deliveryLocation}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consignor & Consignee</span>
              <span className="font-semibold text-slate-200 truncate block">
                {selectedLR.consignorName || selectedLR.partyName} ➔ {selectedLR.consigneeName || 'Consignee'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Status & Location</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider mt-0.5 ${
                  selectedLR.status === 'Delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}
              >
                ● {selectedLR.status} ({currentVehicleLocation})
              </span>
            </div>
          </div>
        )}

        {/* Main Body Content: Map + Update Form Grid */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 max-h-[75vh] overflow-y-auto">
          {/* Left Column (7 Cols): Interactive Google Map + Route Bar */}
          <div className="lg:col-span-7 space-y-4">
            {/* Interactive Map Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400" /> 🗺️ Live Route Progress Map ({selectedLR?.pickupLocation} ➔ {selectedLR?.deliveryLocation})
              </span>

              {/* Tile Style Selector */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMapStyle('streets')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    mapStyle === 'streets' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Streets
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('dark')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    mapStyle === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    mapStyle === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Leaflet Map Canvas Container */}
            <div className="relative border-2 border-slate-700 rounded-2xl overflow-hidden bg-slate-950 h-80 sm:h-96 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full z-0"></div>

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 z-10 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 text-[10px] space-y-1 shadow-lg text-slate-200">
                <div className="font-bold text-sky-300 border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                  <span>Route Legend</span>
                  <button
                    onClick={handleOpenGoogleMapsRoute}
                    className="text-[9px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                  >
                    Open in Google Maps
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white"></span>
                  <span>🟢 Origin: {selectedLR?.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-emerald-400 inline-block"></span>
                  <span>━ Completed Highway Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-white"></span>
                  <span>🚚 Current Location: {currentVehicleLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-sky-400 border-b border-dashed border-sky-400 inline-block"></span>
                  <span>- - Remaining Journey</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-white"></span>
                  <span>🏁 Destination: {selectedLR?.deliveryLocation}</span>
                </div>
              </div>
            </div>

            {/* Visual Route Progress Step Bar */}
            {selectedLR && (
              <div className="p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Real-time Journey Milestones</span>
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {selectedLR.status === 'Delivered' ? '100% Completed' : 'En Route / Active'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 overflow-x-auto pb-1">
                  <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg font-bold shrink-0">
                    🟢 {selectedLR.pickupLocation} (Origin)
                  </span>

                  {activeEvents.map((ev) => (
                    <React.Fragment key={ev.id}>
                      <span className="text-emerald-400 font-extrabold shrink-0">━━</span>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold shrink-0 border ${
                          ev.isCurrent
                            ? 'bg-blue-600/90 text-white border-blue-400 shadow-md ring-2 ring-blue-500/50'
                            : 'bg-slate-800 text-sky-300 border-slate-600'
                        }`}
                      >
                        {ev.location} ({ev.statusName})
                      </span>
                    </React.Fragment>
                  ))}

                  {selectedLR.status !== 'Delivered' && (
                    <>
                      <span className="text-sky-400 font-bold shrink-0"> - - </span>
                      <span className="px-2.5 py-1 bg-slate-800/80 border border-slate-700 text-slate-400 rounded-lg font-bold shrink-0">
                        🏁 {selectedLR.deliveryLocation} (Destination)
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 Cols): Transport Office UPDATE TRACKING Screen */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-gradient-to-b from-indigo-950/40 via-slate-800/80 to-slate-800/90 border border-indigo-500/30 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <h3 className="font-extrabold text-sky-300 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <Navigation className="h-4 w-4 text-indigo-400" /> UPDATE TRACKING
                </h3>
                <span className="text-[10px] text-slate-400">Transport Office Panel</span>
              </div>

              <form onSubmit={handleUpdateTrackingSubmit} className="space-y-3 text-xs">
                {/* Billty / LR No. & Vehicle No. Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Billty / LR No.</label>
                    <input
                      type="text"
                      disabled
                      value={selectedLR?.lrNumber || ''}
                      className="w-full bg-slate-900 border border-slate-700 text-sky-300 font-mono font-bold rounded-lg p-2.5 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Vehicle No.</label>
                    <input
                      type="text"
                      disabled
                      value={selectedLR?.vehicleNumber || ''}
                      className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg p-2.5 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Route Journey Info */}
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Fixed Route:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <span className="text-emerald-400">{selectedLR?.pickupLocation}</span>
                    <span>➔</span>
                    <span className="text-rose-400">{selectedLR?.deliveryLocation}</span>
                  </span>
                </div>

                {/* Current Status Dropdown */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Current Status (स्थिति)</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {TRACKING_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Location Input with Autocomplete */}
                <div className="relative">
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>Current Location (वर्तमान लोकेशन)</span>
                    <span className="text-[10px] text-indigo-400">Live City Autocomplete</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={updateLocation}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      onFocus={() => {
                        if (updateLocation.trim()) setShowLocationSuggestions(true);
                      }}
                      placeholder={`e.g. ${selectedLR?.pickupLocation || 'Surat'}, Vapi, Mumbai, Panvel, ${selectedLR?.deliveryLocation || 'Pune'}...`}
                      className="w-full bg-slate-900 border border-slate-700 text-sky-200 font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Search className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Dropdown Suggestions */}
                  {showLocationSuggestions && filteredLocations.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                      {filteredLocations.map((loc) => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            setUpdateLocation(loc.name);
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-800 flex items-center justify-between text-xs text-slate-200 cursor-pointer"
                        >
                          <span className="font-bold text-sky-300">📍 {loc.name}</span>
                          <span className="text-[10px] text-slate-400">{loc.state}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date & Time Calendar and Clock System */}
                <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-xl border border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Checkpoint Date & Timing</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSetCurrentDateTime}
                      className="text-[11px] text-sky-300 hover:text-white font-semibold flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-0.5 rounded border border-indigo-500/40 transition-colors cursor-pointer"
                      title="Set to right now"
                    >
                      <Clock className="h-3 w-3 text-indigo-400" />
                      <span>Set to Now (अभी)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                        📅 Select Date (कैलेंडर)
                      </label>
                      <input
                        type="date"
                        value={updateDate}
                        onChange={(e) => setUpdateDate(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                        ⏰ Select Time (समय)
                      </label>
                      <input
                        type="time"
                        value={updateTime}
                        onChange={(e) => setUpdateTime(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 text-sky-300 font-mono font-bold rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Formatted Date & Time Badge */}
                  <div className="flex items-center justify-between text-[11px] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatDisplayDateTime(updateDate, updateTime)}
                    </span>
                  </div>
                </div>

                {/* Remark Field */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Remark (टिप्पणी)</label>
                  <input
                    type="text"
                    value={updateRemark}
                    onChange={(e) => setUpdateRemark(e.target.value)}
                    placeholder="e.g. Vehicle crossed toll plaza smoothly"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm uppercase rounded-xl shadow-lg shadow-indigo-900/30 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <Navigation className="h-4 w-4" />
                  <span>[ UPDATE TRACKING ]</span>
                </button>

                {saveSuccess && (
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Location & status milestone updated on Google Map!</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section: 🕐 Tracking History Table */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" /> 🕐 Tracking History & Checkpoints
            </h3>
            <span className="text-[11px] text-slate-400">All updates saved permanently</span>
          </div>

          <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-slate-300 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2.5 border-b border-slate-700">Date & Time</th>
                  <th className="p-2.5 border-b border-slate-700">Location</th>
                  <th className="p-2.5 border-b border-slate-700">Status</th>
                  <th className="p-2.5 border-b border-slate-700">Remark</th>
                  <th className="p-2.5 border-b border-slate-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/50 text-slate-200">
                    <td className="p-2.5 font-mono font-bold text-sky-300 whitespace-nowrap">
                      {evt.timestamp}
                    </td>
                    <td className="p-2.5 font-bold text-white flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>{evt.location}</span>
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          evt.statusName === 'Delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {evt.statusName}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 font-medium">
                      {evt.remarks || evt.eventText || '-'}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-colors cursor-pointer"
                        title="Delete checkpoint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Driver Tracking Share Modal */}
      {selectedLR && (
        <DriverTrackingShareModal
          isOpen={isDriverShareModalOpen}
          onClose={() => setIsDriverShareModalOpen(false)}
          lr={selectedLR}
          onApplyDriverGpsToLR={(lr, lat, lng, address) => {
            const updated = {
              ...lr,
              currentHub:
                formatCityLocation(address, lat, lng) ||
                getNearestCityFromCoords(lat, lng) ||
                address ||
                `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              driverGps: {
                lat,
                lng,
                address,
                lastUpdated: Date.now(),
                isSharingActive: true
              }
            };
            setSelectedLR(updated);
            if (onUpdateLREntry) onUpdateLREntry(updated);
          }}
        />
      )}
    </div>
  );
};
