import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Calendar,
  Navigation,
  ArrowRight,
  Route,
  ShieldCheck,
  Send,
  Printer,
  IndianRupee,
  ExternalLink,
  Plus,
  Compass,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { LREntry, TrackingEvent, LRStatus } from '../types';
import L from 'leaflet';
import { DriverTrackingShareModal } from './DriverTrackingShareModal';
import { formatCityLocation, getNearestCityFromCoords } from '../utils/geoUtils';

// Transport hubs & industrial city coordinates dictionary
const CITY_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  // Gujarat Corridor
  surat: { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  hazira: { lat: 21.1118, lng: 72.6515, state: 'Gujarat' },
  navsari: { lat: 20.9467, lng: 72.952, state: 'Gujarat' },
  valsad: { lat: 20.5992, lng: 72.9342, state: 'Gujarat' },
  vapi: { lat: 20.3893, lng: 72.9106, state: 'Gujarat' },
  silvassa: { lat: 20.2763, lng: 73.0083, state: 'Dadra & Nagar Haveli' },
  daman: { lat: 20.3974, lng: 72.8328, state: 'Daman & Diu' },
  ankleshwar: { lat: 21.6264, lng: 73.0034, state: 'Gujarat' },
  bharuch: { lat: 21.7051, lng: 72.9959, state: 'Gujarat' },
  vadodara: { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  anand: { lat: 22.5645, lng: 72.9289, state: 'Gujarat' },
  nadiad: { lat: 22.6916, lng: 72.8634, state: 'Gujarat' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  sanand: { lat: 22.9859, lng: 72.38, state: 'Gujarat' },
  gandhinagar: { lat: 23.2156, lng: 72.6369, state: 'Gujarat' },
  rajkot: { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  jamnagar: { lat: 22.4707, lng: 70.0577, state: 'Gujarat' },
  bhavnagar: { lat: 21.7645, lng: 72.1519, state: 'Gujarat' },
  morbi: { lat: 22.812, lng: 70.8377, state: 'Gujarat' },
  gandhidham: { lat: 23.0753, lng: 70.1337, state: 'Gujarat' },
  mundra: { lat: 22.8389, lng: 69.7214, state: 'Gujarat' },
  kandla: { lat: 23.0033, lng: 70.2198, state: 'Gujarat' },
  mehsana: { lat: 23.588, lng: 72.3693, state: 'Gujarat' },
  palanpur: { lat: 24.1724, lng: 72.4346, state: 'Gujarat' },

  // Maharashtra Corridor
  pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  chakan: { lat: 18.7606, lng: 73.8587, state: 'Maharashtra' },
  talegaon: { lat: 18.7303, lng: 73.6749, state: 'Maharashtra' },
  bhosari: { lat: 18.6279, lng: 73.8447, state: 'Maharashtra' },
  hadapsar: { lat: 18.5089, lng: 73.9259, state: 'Maharashtra' },
  ranjangaon: { lat: 18.8242, lng: 74.2415, state: 'Maharashtra' },
  hinjewadi: { lat: 18.5913, lng: 73.7389, state: 'Maharashtra' },
  mumbai: { lat: 19.076, lng: 72.8777, state: 'Maharashtra' },
  'navi mumbai': { lat: 19.033, lng: 73.0297, state: 'Maharashtra' },
  jnpt: { lat: 18.9499, lng: 72.9515, state: 'Maharashtra' },
  'nhava sheva': { lat: 18.9499, lng: 72.9515, state: 'Maharashtra' },
  thane: { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  bhiwandi: { lat: 19.2967, lng: 73.0631, state: 'Maharashtra' },
  kalyan: { lat: 19.2403, lng: 73.1305, state: 'Maharashtra' },
  panvel: { lat: 18.9894, lng: 73.1175, state: 'Maharashtra' },
  nashik: { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  sinnar: { lat: 19.8456, lng: 74.0022, state: 'Maharashtra' },
  aurangabad: { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  nagpur: { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  kolhapur: { lat: 16.705, lng: 74.2433, state: 'Maharashtra' },
  solapur: { lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },

  // Rajasthan Corridor
  jaipur: { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'vki jaipur': { lat: 26.985, lng: 75.772, state: 'Rajasthan' },
  sikar: { lat: 27.6094, lng: 75.1398, state: 'Rajasthan' },
  ajmer: { lat: 26.4499, lng: 74.6399, state: 'Rajasthan' },
  kishangarh: { lat: 26.5746, lng: 74.8643, state: 'Rajasthan' },
  bhilwara: { lat: 25.3407, lng: 74.6313, state: 'Rajasthan' },
  udaipur: { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  chittorgarh: { lat: 24.8887, lng: 74.6269, state: 'Rajasthan' },
  jodhpur: { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  bikaner: { lat: 28.0229, lng: 73.3119, state: 'Rajasthan' },
  kota: { lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  alwar: { lat: 27.553, lng: 76.6346, state: 'Rajasthan' },
  bhiwadi: { lat: 28.21, lng: 76.86, state: 'Rajasthan' },
  neemrana: { lat: 27.9892, lng: 76.3828, state: 'Rajasthan' },
  kotputli: { lat: 27.7025, lng: 76.1963, state: 'Rajasthan' },

  // Delhi-NCR, Haryana & Punjab
  delhi: { lat: 28.6139, lng: 77.209, state: 'Delhi NCR' },
  'new delhi': { lat: 28.6139, lng: 77.209, state: 'Delhi NCR' },
  gurgaon: { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  gurugram: { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  manesar: { lat: 28.3547, lng: 76.9388, state: 'Haryana' },
  dharuhera: { lat: 28.2033, lng: 76.7828, state: 'Haryana' },
  rewari: { lat: 28.1828, lng: 76.6186, state: 'Haryana' },
  bawal: { lat: 28.0827, lng: 76.5861, state: 'Haryana' },
  jhajjar: { lat: 28.6063, lng: 76.6565, state: 'Haryana' },
  bahadurgarh: { lat: 28.6924, lng: 76.924, state: 'Haryana' },
  faridabad: { lat: 28.4089, lng: 77.3178, state: 'Haryana' },
  sonipat: { lat: 28.9931, lng: 77.0151, state: 'Haryana' },
  panipat: { lat: 29.3909, lng: 76.9635, state: 'Haryana' },
  karnal: { lat: 29.6857, lng: 76.9905, state: 'Haryana' },
  ambala: { lat: 30.3782, lng: 76.7767, state: 'Haryana' },
  chandigarh: { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  ludhiana: { lat: 30.901, lng: 75.8573, state: 'Punjab' },
  jalandhar: { lat: 31.326, lng: 75.5762, state: 'Punjab' },
  amritsar: { lat: 31.634, lng: 74.8723, state: 'Punjab' },

  // South & Central India
  bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  bangalore: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  hyderabad: { lat: 17.385, lng: 78.4867, state: 'Telangana' },
  chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  indore: { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  bhopal: { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  gwalior: { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },
  kolkata: { lat: 22.5726, lng: 88.3639, state: 'West Bengal' }
};

function normalizeText(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  if (!cityName) return null;
  const norm = normalizeText(cityName);
  if (!norm) return null;

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (norm === key || norm === `${key} hub` || norm === `${key} city`) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    const words = norm.split(' ');
    if (words.includes(key) || norm.includes(key)) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }

  return null;
}

function getSmartWaypointCoords(
  locationName: string,
  pickupCity: string,
  deliveryCity: string,
  progressRatio = 0.5
): { lat: number; lng: number; isEstimated?: boolean } {
  const direct = findCityCoordinates(locationName);
  if (direct) return { lat: direct.lat, lng: direct.lng };

  const pCoords = findCityCoordinates(pickupCity) || { lat: 21.1702, lng: 72.8311 };
  const dCoords = findCityCoordinates(deliveryCity) || { lat: 18.5204, lng: 73.8567 };

  const clampedRatio = Math.min(1, Math.max(0, progressRatio));
  return {
    lat: pCoords.lat + (dCoords.lat - pCoords.lat) * clampedRatio,
    lng: pCoords.lng + (dCoords.lng - pCoords.lng) * clampedRatio,
    isEstimated: true
  };
}

interface LiveTrackingViewProps {
  lrEntries: LREntry[];
  onUpdateLREntry?: (updatedLR: LREntry) => void;
  onOpenBilty?: (lr: LREntry) => void;
  onOpenPayment?: (lr?: LREntry) => void;
  initialTrackingNo?: string;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  lrEntries = [],
  onUpdateLREntry,
  onOpenBilty,
  onOpenPayment,
  initialTrackingNo = ''
}) => {
  const [selectedLR, setSelectedLR] = useState<LREntry | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialTrackingNo);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_TRANSIT' | 'DELIVERED' | 'PENDING'>('ALL');
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update Tracking form states
  const [updateStatus, setUpdateStatus] = useState<string>('In Transit');
  const [updateLocation, setUpdateLocation] = useState<string>('');
  const [updateDate, setUpdateDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [updateTime, setUpdateTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [updateRemark, setUpdateRemark] = useState<string>('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<{ name: string; state: string }[]>([]);

  // Map Tile Style
  const [mapStyle, setMapStyle] = useState<'streets' | 'dark' | 'satellite'>('streets');

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

  // Leaflet Map Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapInstanceRef = useRef<L.Map | null>(null);

  // Filtered shipments list for sidebar
  const filteredShipments = lrEntries.filter((lr) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lr.lrNumber.toLowerCase().includes(q) ||
      (lr.trackingNumber && lr.trackingNumber.toLowerCase().includes(q)) ||
      (lr.vehicleNumber && lr.vehicleNumber.toLowerCase().includes(q)) ||
      lr.partyName.toLowerCase().includes(q) ||
      lr.pickupLocation.toLowerCase().includes(q) ||
      lr.deliveryLocation.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_TRANSIT' && lr.status === 'In Transit') ||
      (statusFilter === 'DELIVERED' && lr.status === 'Delivered') ||
      (statusFilter === 'PENDING' && lr.status === 'Pending Pickup');

    return matchesSearch && matchesStatus;
  });

  // Select first LR on mount or search
  useEffect(() => {
    let target: LREntry | undefined;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      target = lrEntries.find(
        (lr) =>
          lr.lrNumber.toLowerCase().includes(q) ||
          (lr.trackingNumber && lr.trackingNumber.toLowerCase().includes(q)) ||
          (lr.vehicleNumber && lr.vehicleNumber.toLowerCase().includes(q))
      );
    }
    if (!target && filteredShipments.length > 0) {
      target = filteredShipments[0];
    }
    if (target) {
      loadLR(target);
    }
  }, [initialTrackingNo, lrEntries]);

  const loadLR = (lr: LREntry) => {
    setSelectedLR(lr);
    setUpdateStatus(
      lr.status === 'Delivered'
        ? 'Delivered'
        : lr.status === 'Pending Pickup'
        ? 'Booking Confirmed'
        : 'In Transit'
    );
    const rawLoc = lr.currentHub && lr.currentHub.trim() !== '' ? lr.currentHub : lr.pickupLocation || '';
    const currentLoc = formatCityLocation(rawLoc, lr.driverGps?.lat, lr.driverGps?.lng) || rawLoc;
    setUpdateLocation(currentLoc);
    const d = new Date();
    setUpdateDate(d.toISOString().split('T')[0]);
    setUpdateTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setUpdateRemark(`Consignment ${lr.lrNumber} | Vehicle ${lr.vehicleNumber} on route ${lr.pickupLocation} to ${lr.deliveryLocation}`);
  };

  const handleSetCurrentDateTime = () => {
    const d = new Date();
    setUpdateDate(d.toISOString().split('T')[0]);
    setUpdateTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  // Poll live driver location from server & localStorage
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
        const res = await fetch(`/api/driver-location/${encodeURIComponent(token)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.location && isMounted) {
            setLiveDriverGps(json.location);
            return;
          }
        }
        const res2 = await fetch(`/api/driver-location/${encodeURIComponent(selectedLR.lrNumber)}`);
        if (res2.ok) {
          const json2 = await res2.json();
          if (json2?.location && isMounted) {
            setLiveDriverGps(json2.location);
            return;
          }
        }
        const stored = localStorage.getItem(`driver_loc_${selectedLR.lrNumber}`);
        if (stored && isMounted) {
          try {
            setLiveDriverGps(JSON.parse(stored));
          } catch (e) {}
        }
      } catch (err) {}
    };

    pollLocation();
    const interval = setInterval(pollLocation, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedLR?.id, selectedLR?.lrNumber, selectedLR?.driverTrackingToken]);

  const getCleanEvents = (lr: LREntry): TrackingEvent[] => {
    if (lr.trackingEvents && lr.trackingEvents.length > 0) {
      return lr.trackingEvents;
    }

    const defaultEvents: TrackingEvent[] = [
      {
        id: `evt-1-${lr.id}`,
        statusName: 'Booking Confirmed',
        location: lr.pickupLocation,
        eventText: `Consignment booked at ${lr.pickupLocation} for ${lr.partyName}`,
        timestamp: `${lr.bookingDate} 10:00 AM`,
        completed: true,
        isCurrent: lr.status === 'Pending Pickup',
        remarks: `LR Generated #${lr.lrNumber} - Weight ${lr.weight} ${lr.weightUnit}`
      }
    ];

    if (lr.status === 'In Transit' || lr.status === 'Delivered') {
      const midLoc = lr.currentHub || lr.pickupLocation;
      defaultEvents.push({
        id: `evt-2-${lr.id}`,
        statusName: 'In Transit Checkpoint',
        location: midLoc,
        eventText: `Consignment in transit aboard vehicle ${lr.vehicleNumber}`,
        timestamp: `${lr.bookingDate} 04:30 PM`,
        completed: true,
        isCurrent: lr.status === 'In Transit',
        remarks: `Driver: ${lr.driverName || 'Assigned'} | GPS Route Active`
      });
    }

    if (lr.status === 'Delivered') {
      defaultEvents.push({
        id: `evt-3-${lr.id}`,
        statusName: 'Consignment Delivered',
        location: lr.deliveryLocation,
        eventText: `Successfully delivered to consignee at ${lr.deliveryLocation}`,
        timestamp: `${lr.bookingDate} 08:00 PM`,
        completed: true,
        isCurrent: true,
        remarks: `Received in good condition | POD Verified`
      });
    }

    return defaultEvents;
  };

  // Map rendering effect with Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || !selectedLR) return;

    try {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }

      const pCoords = findCityCoordinates(selectedLR.pickupLocation) || { lat: 26.9124, lng: 75.7873 };
      const dCoords = findCityCoordinates(selectedLR.deliveryLocation) || { lat: 28.6063, lng: 76.6565 };

      // Resolve Driver Current Location (Live GPS priority, then recorded hub, then origin)
      let driverLat = pCoords.lat;
      let driverLng = pCoords.lng;
      let driverLocName = selectedLR.currentHub || selectedLR.pickupLocation;
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
        driverLat = dCoords.lat;
        driverLng = dCoords.lng;
        driverLocName = selectedLR.deliveryLocation;
      } else if (selectedLR.currentHub && selectedLR.currentHub.trim() !== '') {
        const hubCoords = getSmartWaypointCoords(selectedLR.currentHub, selectedLR.pickupLocation, selectedLR.deliveryLocation, 0.5);
        driverLat = hubCoords.lat;
        driverLng = hubCoords.lng;
        driverLocName = formatCityLocation(selectedLR.currentHub);
      }

      const map = L.map(mapContainerRef.current, {
        center: [driverLat, driverLng],
        zoom: 7,
        zoomControl: true,
        attributionControl: false
      });

      leafletMapInstanceRef.current = map;

      // Tile layer
      let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      if (mapStyle === 'dark') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      } else if (mapStyle === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      }

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      // Draw Clean Routes (Only Origin -> Driver Location -> Destination)
      const completedPoints: [number, number][] = [
        [pCoords.lat, pCoords.lng],
        [driverLat, driverLng]
      ];

      const remainingPoints: [number, number][] = [
        [driverLat, driverLng],
        [dCoords.lat, dCoords.lng]
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
        [pCoords.lat, pCoords.lng],
        [driverLat, driverLng],
        [dCoords.lat, dCoords.lng]
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
      L.marker([pCoords.lat, pCoords.lng], { icon: originIcon })
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
      L.marker([dCoords.lat, dCoords.lng], { icon: destIcon })
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

      const distToPickup = Math.hypot(driverLat - pCoords.lat, driverLng - pCoords.lng);
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

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Leaflet Map Error:', err);
    }
  }, [selectedLR, mapStyle, liveDriverGps]);

  // Handle Location Autocomplete input
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

  // Submit Milestone Update
  const handleUpdateTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLR) return;
    if (!updateLocation.trim()) {
      alert('Please enter or select a current location.');
      return;
    }

    const currentEvents = getCleanEvents(selectedLR);
    const newEvt: TrackingEvent = {
      id: `evt-${Date.now()}`,
      statusName: updateStatus,
      location: updateLocation.trim(),
      eventText: updateRemark.trim() || `${updateStatus} at ${updateLocation.trim()}`,
      timestamp: `${updateDate} ${updateTime}`,
      completed: true,
      isCurrent: updateStatus !== 'Delivered',
      remarks: updateRemark.trim() || `${updateStatus} at ${updateLocation.trim()}`
    };

    const updatedEvents: TrackingEvent[] = currentEvents.map((ev) => ({ ...ev, isCurrent: false }));
    updatedEvents.push(newEvt);

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
      trackingEvents: updatedEvents
    };

    setSelectedLR(updatedLR);
    if (onUpdateLREntry) {
      onUpdateLREntry(updatedLR);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Google Maps Driving Directions Link
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

  // Share Live Tracking to WhatsApp
  const handleShareWhatsApp = () => {
    if (!selectedLR) return;
    const currentLoc = selectedLR.currentHub || selectedLR.pickupLocation;
    const text =
      `🚚 *MAHAVEER LOGISTICS - LIVE CONSIGNMENT TRACKING*\n\n` +
      `LR / Bilty No: *${selectedLR.lrNumber}*\n` +
      `Tracking ID: *${selectedLR.trackingNumber || selectedLR.lrNumber}*\n` +
      `Truck No: *${selectedLR.vehicleNumber}*\n` +
      `Driver: *${selectedLR.driverName || 'N/A'}*\n` +
      `Route: *${selectedLR.pickupLocation}* ➔ *${selectedLR.deliveryLocation}*\n` +
      `Party: *${selectedLR.partyName}*\n` +
      `Consignee: *${selectedLR.consigneeName || 'N/A'}*\n` +
      `Consignment: ${selectedLR.material} (${selectedLR.weight} ${selectedLR.weightUnit})\n` +
      `Current Status: *${selectedLR.status}*\n` +
      `Current Location: *${currentLoc}*\n\n` +
      `📍 *Open Live GPS Google Maps Route:* https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        selectedLR.pickupLocation
      )}&destination=${encodeURIComponent(selectedLR.deliveryLocation)}&travelmode=driving`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleCopyTrackingLink = () => {
    if (!selectedLR) return;
    const text = `Tracking No: ${selectedLR.lrNumber} | Vehicle: ${selectedLR.vehicleNumber} | Route: ${selectedLR.pickupLocation} to ${selectedLR.deliveryLocation} | Status: ${selectedLR.status} (${selectedLR.currentHub || selectedLR.pickupLocation})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeEvents = selectedLR ? getCleanEvents(selectedLR) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="h-6 w-6 text-orange-400" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Live Fleet & Consignment Tracking (DP World Gateway)
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time GPS route mapping, live checkpoint updates, Leaflet/Google Maps visualization, & instant WhatsApp sharing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedLR && (
            <>
              <button
                type="button"
                onClick={() => setIsDriverShareModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer border border-indigo-400/40"
                title="Share live GPS tracking link with Driver via WhatsApp or SMS"
              >
                <Smartphone className="h-4 w-4 text-indigo-200" />
                <span>Share Driver Tracking Link</span>
                {liveDriverGps?.isSharingActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </button>

              <button
                onClick={handleOpenGoogleMapsRoute}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                title="Open live driving route in Google Maps"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Google Maps Route</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                title="Share live tracking update via WhatsApp"
              >
                <Send className="h-4 w-4" />
                <span>{shareSuccess ? 'Shared!' : 'Share WhatsApp'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left Shipments List + Right Map & Milestone Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Shipment Selector & Filter (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-400" />
              <span>Select Consignment</span>
            </h2>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search LR No, Truck No, Party, City..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'ALL', label: `All (${lrEntries.length})` },
                { id: 'IN_TRANSIT', label: `In Transit (${lrEntries.filter((l) => l.status === 'In Transit').length})` },
                { id: 'DELIVERED', label: `Delivered (${lrEntries.filter((l) => l.status === 'Delivered').length})` },
                { id: 'PENDING', label: `Pending (${lrEntries.filter((l) => l.status === 'Pending Pickup').length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    statusFilter === tab.id
                      ? 'bg-orange-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Shipments Scroll List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredShipments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No shipments matching search/filter.
                </div>
              ) : (
                filteredShipments.map((lr) => {
                  const isSelected = selectedLR?.id === lr.id;
                  const currentLoc =
                    formatCityLocation(lr.currentHub, lr.driverGps?.lat, lr.driverGps?.lng) ||
                    lr.pickupLocation;

                  return (
                    <div
                      key={lr.id}
                      onClick={() => loadLR(lr)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-slate-900 border-orange-500 ring-1 ring-orange-500/50 shadow-md'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {lr.lrNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lr.status === 'Delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : lr.status === 'In Transit'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {lr.status}
                        </span>
                      </div>

                      <div className="text-white font-bold text-xs truncate mt-1">
                        {lr.partyName}
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-1">
                        <span>{lr.pickupLocation}</span>
                        <span className="text-orange-400">➔</span>
                        <span>{lr.deliveryLocation}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-700/60 pt-1.5">
                        <span className="font-mono font-bold text-amber-300">
                          🚚 {lr.vehicleNumber}
                        </span>
                        <span className="truncate max-w-[140px]">
                          📍 {currentLoc}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Live Milestone Update (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLR ? (
            <>
              {/* Selected Shipment Summary Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-white">
                        Consignment #{selectedLR.lrNumber}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          selectedLR.status === 'Delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : selectedLR.status === 'In Transit'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {selectedLR.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Booking Date: <b className="text-slate-200">{selectedLR.bookingDate}</b> • Tracking Code: <b className="text-amber-400 font-mono">{selectedLR.trackingNumber || selectedLR.lrNumber}</b>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyTrackingLink}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Info'}</span>
                    </button>

                    {onOpenBilty && (
                      <button
                        onClick={() => onOpenBilty(selectedLR)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Printer className="h-3.5 w-3.5 text-amber-400" />
                        <span>View Bilty</span>
                      </button>
                    )}

                    {onOpenPayment && selectedLR.balance > 0 && (
                      <button
                        onClick={() => onOpenPayment(selectedLR)}
                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>Pay Due (₹{selectedLR.balance.toLocaleString('en-IN')})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Party / Customer</span>
                    <span className="font-bold text-white truncate block mt-0.5">{selectedLR.partyName}</span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Route (Origin ➔ Dest)</span>
                    <span className="font-bold text-amber-300 truncate block mt-0.5">
                      {selectedLR.pickupLocation} ➔ {selectedLR.deliveryLocation}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Truck & Driver</span>
                    <span className="font-mono font-bold text-emerald-400 truncate block mt-0.5">
                      {selectedLR.vehicleNumber} ({selectedLR.driverName || 'Driver'})
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Location</span>
                    <span className="font-bold text-orange-400 truncate block mt-0.5">
                      📍{' '}
                      {formatCityLocation(
                        selectedLR.currentHub,
                        liveDriverGps?.lat ?? selectedLR.driverGps?.lat,
                        liveDriverGps?.lng ?? selectedLR.driverGps?.lng
                      ) || selectedLR.pickupLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Container */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
                <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-orange-400" />
                    <span className="font-bold text-white">Live Route & Waypoint Map</span>
                  </div>

                  {/* Map Style Controls */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                    {(['streets', 'satellite', 'dark'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setMapStyle(style)}
                        className={`px-2.5 py-1 rounded capitalize text-[11px] font-semibold transition-all ${
                          mapStyle === style
                            ? 'bg-orange-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full h-[380px] bg-slate-950">
                  <div ref={mapContainerRef} className="w-full h-full z-0" />
                </div>
              </div>

              {/* Update Checkpoint Form & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Form: Add/Update Live Location */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-orange-400" />
                      <span>Update Live Checkpoint</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleSetCurrentDateTime}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Set Current Time</span>
                    </button>
                  </div>

                  {saveSuccess && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Live tracking updated & synchronized successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateTrackingSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status Milestone</label>
                      <select
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="Booking Confirmed">Booking Confirmed</option>
                        <option value="In Transit">In Transit (On Highway)</option>
                        <option value="Arrived at Hub">Arrived at Transit Hub</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered (Completed)</option>
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Current Hub / Location City <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={updateLocation}
                        onChange={(e) => handleLocationInputChange(e.target.value)}
                        placeholder="e.g. Jhajjar, Surat, Jaipur, Pune, Delhi..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-orange-500"
                        required
                      />

                      {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                          {filteredLocations.map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setUpdateLocation(loc.name);
                                setShowLocationSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                            >
                              <span className="font-semibold text-white">{loc.name}</span>
                              <span className="text-[10px] text-slate-400">{loc.state}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Date</label>
                        <input
                          type="date"
                          value={updateDate}
                          onChange={(e) => setUpdateDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Time</label>
                        <input
                          type="time"
                          value={updateTime}
                          onChange={(e) => setUpdateTime(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Milestone Remarks / Notes</label>
                      <input
                        type="text"
                        value={updateRemark}
                        onChange={(e) => setUpdateRemark(e.target.value)}
                        placeholder="e.g. Crossing toll plaza, on schedule..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Save & Broadcast Milestone</span>
                    </button>
                  </form>
                </div>

                {/* Timeline: History of Milestones */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Route className="h-4 w-4 text-emerald-400" />
                      <span>Tracking Milestones History</span>
                    </h3>
                  </div>

                  <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                    {activeEvents.map((evt, idx) => (
                      <div key={evt.id || idx} className="relative pl-6 border-l-2 border-slate-700 space-y-1">
                        <div
                          className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 ${
                            evt.isCurrent
                              ? 'bg-orange-500 border-white ring-2 ring-orange-400 animate-pulse'
                              : 'bg-emerald-500 border-slate-900'
                          }`}
                        />

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{evt.statusName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                        </div>

                        <div className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                          <span>{evt.location}</span>
                        </div>

                        {evt.remarks && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">
                            "{evt.remarks}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <AlertCircle className="h-10 w-10 text-orange-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Consignment Selected</h3>
              <p className="text-xs max-w-sm mx-auto">
                Please select a consignment from the left sidebar or search an LR Number to view real-time tracking, live maps, and milestones.
              </p>
            </div>
          )}
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
