// Indian Transport Hubs & Cities Geospatial Directory
export interface CityCoord {
  lat: number;
  lng: number;
  city: string;
  state: string;
  hubName?: string;
}

export const INDIAN_CITIES_COORDS: Record<string, CityCoord> = {
  // Gujarat Corridor
  'surat': { lat: 21.1702, lng: 72.8311, city: 'Surat', state: 'Gujarat' },
  'hazira': { lat: 21.1118, lng: 72.6515, city: 'Hazira Port', state: 'Gujarat', hubName: 'Hazira Industrial Hub' },
  'navsari': { lat: 20.9467, lng: 72.9520, city: 'Navsari', state: 'Gujarat' },
  'valsad': { lat: 20.5992, lng: 72.9342, city: 'Valsad', state: 'Gujarat' },
  'vapi': { lat: 20.3893, lng: 72.9106, city: 'Vapi', state: 'Gujarat', hubName: 'Vapi GIDC Hub' },
  'silvassa': { lat: 20.2763, lng: 73.0083, city: 'Silvassa', state: 'Dadra & Nagar Haveli' },
  'daman': { lat: 20.3974, lng: 72.8328, city: 'Daman', state: 'Daman & Diu' },
  'ankleshwar': { lat: 21.6264, lng: 73.0034, city: 'Ankleshwar', state: 'Gujarat', hubName: 'Ankleshwar GIDC' },
  'bharuch': { lat: 21.7051, lng: 72.9959, city: 'Bharuch', state: 'Gujarat' },
  'vadodara': { lat: 22.3072, lng: 73.1812, city: 'Vadodara', state: 'Gujarat' },
  'anand': { lat: 22.5645, lng: 72.9289, city: 'Anand', state: 'Gujarat' },
  'nadiad': { lat: 22.6916, lng: 72.8634, city: 'Nadiad', state: 'Gujarat' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', state: 'Gujarat' },
  'sanand': { lat: 22.9859, lng: 72.3800, city: 'Sanand', state: 'Gujarat', hubName: 'Sanand GIDC Auto Hub' },
  'gandhinagar': { lat: 23.2156, lng: 72.6369, city: 'Gandhinagar', state: 'Gujarat' },
  'rajkot': { lat: 22.3039, lng: 70.8022, city: 'Rajkot', state: 'Gujarat' },
  'jamnagar': { lat: 22.4707, lng: 70.0577, city: 'Jamnagar', state: 'Gujarat' },
  'bhavnagar': { lat: 21.7645, lng: 72.1519, city: 'Bhavnagar', state: 'Gujarat' },
  'morbi': { lat: 22.8120, lng: 70.8377, city: 'Morbi', state: 'Gujarat', hubName: 'Morbi Ceramic Cluster' },
  'gandhidham': { lat: 23.0753, lng: 70.1337, city: 'Gandhidham', state: 'Gujarat' },
  'mundra': { lat: 22.8389, lng: 69.7214, city: 'Mundra', state: 'Gujarat', hubName: 'Mundra Port SEZ' },
  'kandla': { lat: 23.0033, lng: 70.2198, city: 'Kandla', state: 'Gujarat', hubName: 'Deendayal Kandla Port' },
  'mehsana': { lat: 23.5880, lng: 72.3693, city: 'Mehsana', state: 'Gujarat' },
  'palanpur': { lat: 24.1724, lng: 72.4346, city: 'Palanpur', state: 'Gujarat' },

  // Maharashtra Corridor
  'pune': { lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra' },
  'chakan': { lat: 18.7606, lng: 73.8587, city: 'Chakan', state: 'Maharashtra', hubName: 'Chakan MIDC Auto Hub' },
  'talegaon': { lat: 18.7303, lng: 73.6749, city: 'Talegaon', state: 'Maharashtra' },
  'bhosari': { lat: 18.6279, lng: 73.8447, city: 'Bhosari', state: 'Maharashtra', hubName: 'Bhosari MIDC' },
  'hadapsar': { lat: 18.5089, lng: 73.9259, city: 'Hadapsar', state: 'Maharashtra' },
  'ranjangaon': { lat: 18.8242, lng: 74.2415, city: 'Ranjangaon', state: 'Maharashtra', hubName: 'Ranjangaon MIDC' },
  'hinjewadi': { lat: 18.5913, lng: 73.7389, city: 'Hinjewadi', state: 'Maharashtra' },
  'mumbai': { lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
  'navi mumbai': { lat: 19.0330, lng: 73.0297, city: 'Navi Mumbai', state: 'Maharashtra' },
  'jnpt': { lat: 18.9499, lng: 72.9515, city: 'Nhava Sheva (JNPT)', state: 'Maharashtra', hubName: 'JNPT Port Container Hub' },
  'thane': { lat: 19.2183, lng: 72.9781, city: 'Thane', state: 'Maharashtra' },
  'bhiwandi': { lat: 19.2967, lng: 73.0631, city: 'Bhiwandi', state: 'Maharashtra', hubName: 'Bhiwandi Logistics Hub' },
  'kalyan': { lat: 19.2403, lng: 73.1305, city: 'Kalyan', state: 'Maharashtra' },
  'panvel': { lat: 18.9894, lng: 73.1175, city: 'Panvel', state: 'Maharashtra' },
  'nashik': { lat: 19.9975, lng: 73.7898, city: 'Nashik', state: 'Maharashtra' },
  'aurangabad': { lat: 19.8762, lng: 75.3433, city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  'kolhapur': { lat: 16.7050, lng: 74.2433, city: 'Kolhapur', state: 'Maharashtra' },
  'solapur': { lat: 17.6599, lng: 75.9064, city: 'Solapur', state: 'Maharashtra' },
  'nagpur': { lat: 21.1458, lng: 79.0882, city: 'Nagpur', state: 'Maharashtra', hubName: 'Nagpur MIHAN Logistics Hub' },
  'butibori': { lat: 20.9238, lng: 78.9950, city: 'Butibori', state: 'Maharashtra', hubName: 'Butibori MIDC' },

  // Rajasthan Corridor
  'jaipur': { lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan' },
  'vki jaipur': { lat: 26.9850, lng: 75.7720, city: 'Jaipur (V.K.I Area)', state: 'Rajasthan', hubName: 'VKI Transport Nagar' },
  'transport nagar jaipur': { lat: 26.8990, lng: 75.8500, city: 'Jaipur (Transport Nagar)', state: 'Rajasthan' },
  'sikar': { lat: 27.6094, lng: 75.1398, city: 'Sikar', state: 'Rajasthan' },
  'ajmer': { lat: 26.4499, lng: 74.6399, city: 'Ajmer', state: 'Rajasthan' },
  'kishangarh': { lat: 26.5746, lng: 74.8643, city: 'Kishangarh', state: 'Rajasthan', hubName: 'Kishangarh Marble Market' },
  'bhilwara': { lat: 25.3407, lng: 74.6313, city: 'Bhilwara', state: 'Rajasthan', hubName: 'Bhilwara Textile Hub' },
  'udaipur': { lat: 24.5854, lng: 73.7125, city: 'Udaipur', state: 'Rajasthan' },
  'chittorgarh': { lat: 24.8887, lng: 74.6269, city: 'Chittorgarh', state: 'Rajasthan' },
  'jodhpur': { lat: 26.2389, lng: 73.0243, city: 'Jodhpur', state: 'Rajasthan' },
  'bikaner': { lat: 28.0229, lng: 73.3119, city: 'Bikaner', state: 'Rajasthan' },
  'kota': { lat: 25.2138, lng: 75.8648, city: 'Kota', state: 'Rajasthan' },
  'alwar': { lat: 27.5530, lng: 76.6346, city: 'Alwar', state: 'Rajasthan' },
  'bhiwadi': { lat: 28.2100, lng: 76.8600, city: 'Bhiwadi', state: 'Rajasthan', hubName: 'Bhiwadi RIICO Hub' },
  'neemrana': { lat: 27.9892, lng: 76.3828, city: 'Neemrana', state: 'Rajasthan', hubName: 'Neemrana Japanese Zone' },
  'kotputli': { lat: 27.7025, lng: 76.1963, city: 'Kotputli', state: 'Rajasthan' },
  'shahpura': { lat: 27.3888, lng: 75.9608, city: 'Shahpura', state: 'Rajasthan' },
  'pali': { lat: 25.7711, lng: 73.3234, city: 'Pali', state: 'Rajasthan' },
  'abu road': { lat: 24.4784, lng: 72.7818, city: 'Abu Road', state: 'Rajasthan' },

  // Delhi-NCR, Haryana & Punjab
  'delhi': { lat: 28.6139, lng: 77.2090, city: 'Delhi', state: 'Delhi NCR' },
  'new delhi': { lat: 28.6139, lng: 77.2090, city: 'New Delhi', state: 'Delhi NCR' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, city: 'Gurugram', state: 'Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, city: 'Gurugram', state: 'Haryana' },
  'manesar': { lat: 28.3547, lng: 76.9388, city: 'Manesar', state: 'Haryana', hubName: 'IMT Manesar Auto Hub' },
  'dharuhera': { lat: 28.2033, lng: 76.7828, city: 'Dharuhera', state: 'Haryana' },
  'rewari': { lat: 28.1828, lng: 76.6186, city: 'Rewari', state: 'Haryana' },
  'bawal': { lat: 28.0827, lng: 76.5861, city: 'Bawal', state: 'Haryana', hubName: 'Bawal IMT Hub' },
  'faridabad': { lat: 28.4089, lng: 77.3178, city: 'Faridabad', state: 'Haryana' },
  'sonipat': { lat: 28.9931, lng: 77.0151, city: 'Sonipat', state: 'Haryana' },
  'kundli': { lat: 28.8742, lng: 77.1264, city: 'Kundli', state: 'Haryana', hubName: 'Kundli Industrial Area' },
  'panipat': { lat: 29.3909, lng: 76.9635, city: 'Panipat', state: 'Haryana', hubName: 'Panipat Textile Hub' },
  'karnal': { lat: 29.6857, lng: 76.9905, city: 'Karnal', state: 'Haryana' },
  'ambala': { lat: 30.3782, lng: 76.7767, city: 'Ambala', state: 'Haryana' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, city: 'Chandigarh', state: 'Punjab' },
  'mohali': { lat: 30.7046, lng: 76.7179, city: 'Mohali', state: 'Punjab' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, city: 'Ludhiana', state: 'Punjab', hubName: 'Ludhiana Transport Hub' },
  'jalandhar': { lat: 31.3260, lng: 75.5762, city: 'Jalandhar', state: 'Punjab' },
  'amritsar': { lat: 31.6340, lng: 74.8723, city: 'Amritsar', state: 'Punjab' },

  // Uttar Pradesh & MP Corridor
  'noida': { lat: 28.5355, lng: 77.3910, city: 'Noida', state: 'Uttar Pradesh' },
  'greater noida': { lat: 28.4744, lng: 77.5040, city: 'Greater Noida', state: 'Uttar Pradesh' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, city: 'Ghaziabad', state: 'Uttar Pradesh' },
  'meerut': { lat: 28.9845, lng: 77.7064, city: 'Meerut', state: 'Uttar Pradesh' },
  'mathura': { lat: 27.4924, lng: 77.6737, city: 'Mathura', state: 'Uttar Pradesh' },
  'agra': { lat: 27.1767, lng: 78.0081, city: 'Agra', state: 'Uttar Pradesh', hubName: 'Agra Transport Nagar' },
  'kanpur': { lat: 26.4499, lng: 80.3319, city: 'Kanpur', state: 'Uttar Pradesh', hubName: 'Kanpur Transport Nagar' },
  'lucknow': { lat: 26.8467, lng: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh', hubName: 'Transport Nagar Lucknow' },
  'prayagraj': { lat: 25.4358, lng: 81.8463, city: 'Prayagraj', state: 'Uttar Pradesh' },
  'varanasi': { lat: 25.3176, lng: 82.9739, city: 'Varanasi', state: 'Uttar Pradesh' },
  'jhansi': { lat: 25.4484, lng: 78.5685, city: 'Jhansi', state: 'Uttar Pradesh' },
  'gwalior': { lat: 26.2183, lng: 78.1828, city: 'Gwalior', state: 'Madhya Pradesh', hubName: 'Gwalior Transport Hub' },
  'morena': { lat: 26.4947, lng: 77.9940, city: 'Morena', state: 'Madhya Pradesh' },
  'dholpur': { lat: 26.7025, lng: 77.8934, city: 'Dholpur', state: 'Rajasthan' },
  'indore': { lat: 22.7196, lng: 75.8577, city: 'Indore', state: 'Madhya Pradesh', hubName: 'Loha Mandi / Dewas Naka' },
  'pithampur': { lat: 22.6148, lng: 75.6888, city: 'Pithampur', state: 'Madhya Pradesh', hubName: 'Pithampur Auto Cluster' },
  'dewas': { lat: 22.9676, lng: 76.0534, city: 'Dewas', state: 'Madhya Pradesh' },
  'ujjain': { lat: 23.1765, lng: 75.7885, city: 'Ujjain', state: 'Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lng: 77.4126, city: 'Bhopal', state: 'Madhya Pradesh' },
  'mandideep': { lat: 23.0617, lng: 77.5186, city: 'Mandideep', state: 'Madhya Pradesh' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, city: 'Jabalpur', state: 'Madhya Pradesh' },

  // Chhattisgarh, Bengal, Bihar & South India
  'raipur': { lat: 21.2514, lng: 81.6296, city: 'Raipur', state: 'Chhattisgarh' },
  'bilaspur': { lat: 22.0797, lng: 82.1409, city: 'Bilaspur', state: 'Chhattisgarh' },
  'kolkata': { lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal' },
  'howrah': { lat: 22.5958, lng: 88.2636, city: 'Howrah', state: 'West Bengal', hubName: 'Howrah Terminal' },
  'patna': { lat: 25.5941, lng: 85.1376, city: 'Patna', state: 'Bihar' },
  'ranchi': { lat: 23.3441, lng: 85.3096, city: 'Ranchi', state: 'Jharkhand' },
  'jamshedpur': { lat: 22.8046, lng: 86.2029, city: 'Jamshedpur', state: 'Jharkhand' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', state: 'Telangana', hubName: 'Autonagar Logistics Hub' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka' },
  'chennai': { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'vijayawada': { lat: 16.5062, lng: 80.6480, city: 'Vijayawada', state: 'Andhra Pradesh' }
};

// Calculate Haversine distance in Kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if string contains raw coordinates like "26.9839, 75.7674"
export function isCoordinateString(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  // Matches "26.9839, 75.7674" or "26.9839,75.7674" or "(26.9839, 75.7674)" or "26.9839° N, 75.7674° E"
  return /^[\(\[]?\s*[-+]?\d+(\.\d+)?\s*[°]?[NS]?\s*,\s*[-+]?\d+(\.\d+)?\s*[°]?[EW]?\s*[\)\]]?$/i.test(trimmed);
}

// Parse string coordinates to { lat, lng }
export function parseCoordinates(text?: string | null): { lat: number; lng: number } | null {
  if (!text) return null;
  const match = text.match(/([-+]?\d+(?:\.\d+)?)\s*[°]?[NS]?\s*,\s*([-+]?\d+(?:\.\d+)?)\s*[°]?[EW]?/i);
  if (match && match[1] && match[2]) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

// Reverse geocode lat/lng to human-readable Indian city name
export function getNearestCityFromCoords(lat: number, lng: number): string {
  let nearestCity: CityCoord | null = null;
  let minDistance = Infinity;

  for (const entry of Object.values(INDIAN_CITIES_COORDS)) {
    const dist = calculateDistanceKm(lat, lng, entry.lat, entry.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = entry;
    }
  }

  if (!nearestCity) {
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  }

  // Exact hub or city center (within 5 km)
  if (minDistance <= 5) {
    if (nearestCity.hubName) {
      const baseCity = nearestCity.city.replace(/\s*\([^)]*\)/g, '').trim();
      return `${baseCity} (${nearestCity.hubName}), ${nearestCity.state}`;
    }
    return `${nearestCity.city}, ${nearestCity.state}`;
  }

  // City bypass or suburbs (within 20 km)
  if (minDistance <= 20) {
    const baseCity = nearestCity.city.replace(/\s*\([^)]*\)/g, '').trim();
    return `${baseCity} Bypass, ${nearestCity.state}`;
  }

  // Near city on highway (within 60 km)
  if (minDistance <= 60) {
    const baseCity = nearestCity.city.replace(/\s*\([^)]*\)/g, '').trim();
    return `Near ${baseCity} (~${Math.round(minDistance)} km), ${nearestCity.state}`;
  }

  // Regional location
  const baseCity = nearestCity.city.replace(/\s*\([^)]*\)/g, '').trim();
  return `En route ${baseCity}, ${nearestCity.state}`;
}

// Converts any location representation (raw coordinates or city) into a clean city name
export function formatCityLocation(
  rawLocation?: string | null,
  fallbackLat?: number,
  fallbackLng?: number
): string {
  if (typeof fallbackLat === 'number' && typeof fallbackLng === 'number' && !isNaN(fallbackLat) && !isNaN(fallbackLng)) {
    // If rawLocation is missing or is just coordinates, resolve to city
    if (!rawLocation || isCoordinateString(rawLocation) || rawLocation.toLowerCase().includes('lat')) {
      return getNearestCityFromCoords(fallbackLat, fallbackLng);
    }
  }

  if (!rawLocation) return '';

  // If the location is already a clean city/hub name
  if (!isCoordinateString(rawLocation)) {
    return rawLocation.trim();
  }

  // Try parsing coordinates string like "26.9839, 75.7674"
  const parsed = parseCoordinates(rawLocation);
  if (parsed) {
    return getNearestCityFromCoords(parsed.lat, parsed.lng);
  }

  return rawLocation;
}

// Asynchronous reverse geocoding with OpenStreetMap Nominatim + instant fallback
export async function reverseGeocodeLiveGps(lat: number, lng: number): Promise<string> {
  const localNearest = getNearestCityFromCoords(lat, lng);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8'
        }
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const city = a.city || a.town || a.village || a.county || a.state_district || '';
        const state = a.state || '';
        const suburb = a.suburb || a.neighbourhood || a.industrial || '';

        if (suburb && city && state) {
          return `${city} (${suburb}), ${state}`;
        }
        if (city && state) {
          return `${city}, ${state}`;
        }
        if (city) return city;
      }
    }
  } catch (err) {
    // Silently fall back to local database
  }

  return localNearest;
}
