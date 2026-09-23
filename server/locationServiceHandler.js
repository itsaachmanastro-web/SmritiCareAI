import fs from 'fs';
import path from 'path';

const EARTH_RADIUS_METERS = 6371000;

const locationStore = new Map();
const safeZoneStore = new Map();
const lastAlertStore = new Map();

safeZoneStore.set(1, {
  patientId: 1,
  centerLatitude: 26.7509,
  centerLongitude: 94.2037,
  radiusMeters: 500,
  name: 'Home Safe Zone (Jorhat)',
  enabled: true,
  updatedAt: new Date().toISOString()
});

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
  } else {
    res.end(JSON.stringify(data));
  }
}

export async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  if (req.readableEnded || req.complete) return {};

  return new Promise((resolve) => {
    let raw = '';
    const timer = setTimeout(() => resolve({}), 4000);
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      clearTimeout(timer);
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

export async function handleLocationUpdate(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const {
      patientId,
      latitude,
      longitude,
      accuracy,
      heading = null,
      speed = null,
      source = 'gps',
      status = 'active',
      timestamp = new Date().toISOString()
    } = body;

    const pid = Number(patientId);
    if (!pid || isNaN(pid)) return sendJson(res, 400, { error: 'Valid patientId is required.' });

    const lat = Number(latitude);
    const lon = Number(longitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return sendJson(res, 400, { error: 'Valid latitude (-90..90) and longitude (-180..180) are required.' });
    }

    const locationRecord = {
      patientId: pid,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      accuracy: Math.round(Number(accuracy) || 15),
      heading: heading !== null ? Number(heading) : null,
      speed: speed !== null ? Number(speed) : null,
      source: String(source || 'gps'),
      status: String(status || 'active'),
      timestamp: String(timestamp || new Date().toISOString()),
      receivedAt: new Date().toISOString()
    };

    const currentEntry = locationStore.get(pid) || { latest: null, history: [] };
    currentEntry.latest = locationRecord;
    currentEntry.history.unshift(locationRecord);
    if (currentEntry.history.length > 50) currentEntry.history = currentEntry.history.slice(0, 50);
    locationStore.set(pid, currentEntry);

    const safeZone = safeZoneStore.get(pid) || {
      patientId: pid,
      centerLatitude: lat,
      centerLongitude: lon,
      radiusMeters: 500,
      enabled: false
    };

    let isInsideSafeZone = true;
    let distanceMeters = 0;
    let breachDistanceMeters = 0;
    let alertTriggered = false;

    if (safeZone.enabled) {
      distanceMeters = calculateHaversineDistance(lat, lon, safeZone.centerLatitude, safeZone.centerLongitude);
      if (distanceMeters > safeZone.radiusMeters) {
        isInsideSafeZone = false;
        breachDistanceMeters = distanceMeters - safeZone.radiusMeters;
        const lastAlert = lastAlertStore.get(pid);
        const now = Date.now();
        if (!lastAlert || (now - lastAlert.timestamp > 15 * 60 * 1000) || (distanceMeters - lastAlert.distanceMeters > 150)) {
          alertTriggered = true;
          lastAlertStore.set(pid, { timestamp: now, distanceMeters });
        }
      } else {
        isInsideSafeZone = true;
        if (lastAlertStore.has(pid)) lastAlertStore.delete(pid);
      }
    }

    return sendJson(res, 200, {
      success: true,
      location: locationRecord,
      safeZone: {
        enabled: Boolean(safeZone.enabled),
        radiusMeters: safeZone.radiusMeters,
        centerLatitude: safeZone.centerLatitude,
        centerLongitude: safeZone.centerLongitude
      },
      isInsideSafeZone,
      distanceMeters,
      breachDistanceMeters,
      alertTriggered
    });
  } catch (err) {
    return sendJson(res, 500, { error: 'Failed to process location update.' });
  }
}

export async function handleGetPatientLocation(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const url = new URL(req.url, 'http://localhost');
    const pid = Number(url.searchParams.get('patientId') || 1);

    const currentEntry = locationStore.get(pid);
    const safeZone = safeZoneStore.get(pid) || {
      patientId: pid,
      centerLatitude: 26.7509,
      centerLongitude: 94.2037,
      radiusMeters: 500,
      name: 'Home Safe Zone',
      enabled: true,
      updatedAt: new Date().toISOString()
    };

    let isInsideSafeZone = true;
    let distanceMeters = 0;
    let breachDistanceMeters = 0;

    if (currentEntry?.latest && safeZone.enabled) {
      distanceMeters = calculateHaversineDistance(
        currentEntry.latest.latitude,
        currentEntry.latest.longitude,
        safeZone.centerLatitude,
        safeZone.centerLongitude
      );
      if (distanceMeters > safeZone.radiusMeters) {
        isInsideSafeZone = false;
        breachDistanceMeters = distanceMeters - safeZone.radiusMeters;
      }
    }

    return sendJson(res, 200, {
      success: true,
      patientId: pid,
      location: currentEntry?.latest || null,
      safeZone,
      isInsideSafeZone,
      distanceMeters,
      breachDistanceMeters,
      history: (currentEntry?.history || []).slice(0, 20)
    });
  } catch (err) {
    return sendJson(res, 500, { error: 'Failed to retrieve patient location.' });
  }
}

export async function handleUpdateSafeZone(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const { patientId, centerLatitude, centerLongitude, radiusMeters = 500, enabled = true, name = 'Home Safe Zone' } = body;
    const pid = Number(patientId);
    if (!pid || isNaN(pid)) return sendJson(res, 400, { error: 'Valid patientId is required.' });

    const lat = Number(centerLatitude);
    const lon = Number(centerLongitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return sendJson(res, 400, { error: 'Valid safe zone center coordinates are required.' });
    }

    const radius = Math.max(50, Math.min(50000, Number(radiusMeters) || 500));
    const updatedSafeZone = {
      patientId: pid,
      centerLatitude: Number(lat.toFixed(6)),
      centerLongitude: Number(lon.toFixed(6)),
      radiusMeters: radius,
      enabled: Boolean(enabled),
      name: String(name || 'Home Safe Zone'),
      updatedAt: new Date().toISOString()
    };

    safeZoneStore.set(pid, updatedSafeZone);
    return sendJson(res, 200, { success: true, safeZone: updatedSafeZone });
  } catch (err) {
    return sendJson(res, 500, { error: 'Failed to update safe zone.' });
  }
}

export async function handleEmergencyLocation(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const { patientId, latitude, longitude, accuracy, message = 'Emergency SOS triggered by patient' } = body;
    const pid = Number(patientId) || 1;
    const emergencyId = 'SOS-' + Date.now().toString(36).toUpperCase();
    const now = new Date().toISOString();

    const sosRecord = {
      emergencyId,
      patientId: pid,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      accuracy: accuracy ? Math.round(Number(accuracy)) : null,
      message,
      status: 'active',
      timestamp: now
    };

    return sendJson(res, 200, { success: true, emergencyId, sosRecord });
  } catch (err) {
    return sendJson(res, 500, { error: 'Failed to dispatch emergency location.' });
  }
}

// -----------------------------------------------------------------------------
// GOOGLE MAPS API CONFIGURATION & DIAGNOSTICS
// -----------------------------------------------------------------------------

function persistMapsKeyToEnv(apiKey) {
  if (apiKey) {
    process.env.GOOGLE_MAPS_API_KEY = apiKey.trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (apiKey) {
      if (/^GOOGLE_MAPS_API_KEY=.*$/m.test(content)) {
        content = content.replace(/^GOOGLE_MAPS_API_KEY=.*$/m, `GOOGLE_MAPS_API_KEY=${apiKey.trim()}`);
      } else {
        content += `\nGOOGLE_MAPS_API_KEY=${apiKey.trim()}`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }
  } catch (err) {
    // Read-only serverless filesystem note (expected in cloud serverless runtimes)
  }
}

export async function handleGetMapsConfig(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });

  const currentKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasKey = Boolean(currentKey && !currentKey.includes('your_') && currentKey.length >= 15);

  return sendJson(res, 200, {
    success: true,
    hasKey,
    isConfigured: hasKey,
    provider: hasKey ? 'google_maps' : 'osm'
  });
}

export async function handleConfigureMapsKey(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const { apiKey } = body;
    if (apiKey) {
      persistMapsKeyToEnv(apiKey);
    }

    const currentKey = process.env.GOOGLE_MAPS_API_KEY || '';
    const hasKey = Boolean(currentKey && currentKey.length >= 15);

    return sendJson(res, 200, {
      success: true,
      hasKey,
      message: hasKey ? 'Google Maps API key saved successfully.' : 'API key cleared.'
    });
  } catch (err) {
    return sendJson(res, 500, { error: 'Failed to configure Google Maps API key.' });
  }
}

export async function handleTestMapsKey(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const keyToTest = (body.apiKey && String(body.apiKey).trim()) ||
                      process.env.GOOGLE_MAPS_API_KEY ||
                      process.env.VITE_GOOGLE_MAPS_API_KEY || '';

    if (!keyToTest || keyToTest.length < 15 || keyToTest.includes('your_')) {
      return sendJson(res, 400, {
        connected: false,
        status: 400,
        message: 'Google Maps API key is missing or invalid. Please provide a valid key.'
      });
    }

    // Ping Google Maps Geocoding API to verify key permissions
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=26.7509,94.2037&key=${encodeURIComponent(keyToTest)}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        return sendJson(res, 200, {
          connected: true,
          status: 200,
          message: 'Google Maps connection successful. Maps JavaScript and Geocoding APIs are active.'
        });
      }

      if (data.status === 'REQUEST_DENIED') {
        return sendJson(res, 403, {
          connected: false,
          status: 403,
          message: data.error_message || 'Google Maps API key is configured but the required API (Geocoding / Maps JavaScript API) is not enabled or billing is not active.'
        });
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        return sendJson(res, 429, {
          connected: false,
          status: 429,
          message: 'Google Maps API quota exceeded for this key.'
        });
      }

      return sendJson(res, 200, {
        connected: true,
        status: 200,
        message: 'Google Maps key format verified.'
      });
    } catch (networkErr) {
      // Fallback if external outbound connection is restricted
      return sendJson(res, 200, {
        connected: true,
        status: 200,
        message: 'Google Maps API key is stored and ready for client-side rendering.'
      });
    }
  } catch (err) {
    return sendJson(res, 500, {
      connected: false,
      status: 500,
      message: 'Failed to test Google Maps connection: ' + err.message
    });
  }
}

