import { db } from '../../db/dexie.js';
import { createNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../notificationService.js';

export const EARTH_RADIUS_METERS = 6371000;

export const LOCATION_STATUS = {
  LIVE: 'live',             // Updated within last 2 minutes
  UPDATING: 'updating',     // Active within last 10 minutes
  LAST_KNOWN: 'last_known', // Older than 10 minutes (stale)
  UNAVAILABLE: 'unavailable'// No GPS data / permission denied
};

export const SAFE_ZONE_PRESETS = [
  { label: '250 m', value: 250, descKey: 'location.presetSmall' },
  { label: '500 m', value: 500, descKey: 'location.presetMedium' },
  { label: '1 km', value: 1000, descKey: 'location.presetLarge' },
  { label: '2 km', value: 2000, descKey: 'location.presetWide' }
];

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
  const dLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function checkGeofenceBreach(location, safeZone) {
  if (!location || !safeZone || !safeZone.enabled) {
    return { isInside: true, distanceMeters: 0, breachDistanceMeters: 0 };
  }

  const distanceMeters = calculateHaversineDistance(
    location.latitude,
    location.longitude,
    safeZone.centerLatitude,
    safeZone.centerLongitude
  );

  const radius = Number(safeZone.radiusMeters) || 500;
  const isInside = distanceMeters <= radius;
  const breachDistanceMeters = isInside ? 0 : distanceMeters - radius;

  return { isInside, distanceMeters, breachDistanceMeters };
}

export function getLocationFreshness(timestamp) {
  if (!timestamp) return LOCATION_STATUS.UNAVAILABLE;
  try {
    const timeMs = new Date(timestamp).getTime();
    if (isNaN(timeMs)) return LOCATION_STATUS.UNAVAILABLE;
    const diffMs = Date.now() - timeMs;

    if (diffMs <= 2 * 60 * 1000) return LOCATION_STATUS.LIVE;
    if (diffMs <= 10 * 60 * 1000) return LOCATION_STATUS.UPDATING;
    return LOCATION_STATUS.LAST_KNOWN;
  } catch {
    return LOCATION_STATUS.UNAVAILABLE;
  }
}

export async function recordPatientLocation(locationData) {
  const {
    patientId,
    latitude,
    longitude,
    accuracy = 15,
    heading = null,
    speed = null,
    source = 'gps',
    status = 'active',
    timestamp = new Date().toISOString()
  } = locationData;

  const pid = Number(patientId) || 1;
  const now = new Date().toISOString();

  const record = {
    patientId: pid,
    isDemo: pid <= 3,
    latitude: Number(Number(latitude).toFixed(6)),
    longitude: Number(Number(longitude).toFixed(6)),
    accuracy: Math.round(Number(accuracy) || 15),
    heading: heading !== null ? Number(heading) : null,
    speed: speed !== null ? Number(speed) : null,
    source: String(source || 'gps'),
    status: String(status || 'active'),
    timestamp: String(timestamp || now),
    createdAt: now
  };

  try {
    await db.patientLocations.add(record);
    try {
      await fetch('/api/location/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch {}
    return record;
  } catch (err) {
    console.warn('Could not record patient location:', err);
    return record;
  }
}

export async function getLatestPatientLocation(patientId) {
  const pid = Number(patientId) || 1;
  try {
    const loc = await db.patientLocations
      .where('patientId')
      .equals(pid)
      .reverse()
      .sortBy('timestamp');

    return loc.length > 0 ? loc[0] : null;
  } catch (err) {
    console.warn('Could not fetch latest location from Dexie:', err);
    return null;
  }
}

export async function getPatientSafeZone(patientId) {
  const pid = Number(patientId) || 1;
  try {
    let sz = await db.safeZones.get(pid);
    if (!sz) {
      sz = {
        patientId: pid,
        centerLatitude: 26.7509,
        centerLongitude: 94.2037,
        radiusMeters: 500,
        name: 'Home Safe Zone (Jorhat)',
        enabled: true,
        updatedAt: new Date().toISOString()
      };
      await db.safeZones.put(sz);
    }
    return sz;
  } catch (err) {
    console.warn('Could not fetch safe zone:', err);
    return {
      patientId: pid,
      centerLatitude: 26.7509,
      centerLongitude: 94.2037,
      radiusMeters: 500,
      name: 'Home Safe Zone (Jorhat)',
      enabled: true
    };
  }
}

export async function savePatientSafeZone(safeZoneData) {
  const {
    patientId,
    centerLatitude,
    centerLongitude,
    radiusMeters = 500,
    name = 'Home Safe Zone',
    enabled = true
  } = safeZoneData;

  const pid = Number(patientId) || 1;
  const updated = {
    patientId: pid,
    centerLatitude: Number(Number(centerLatitude).toFixed(6)),
    centerLongitude: Number(Number(centerLongitude).toFixed(6)),
    radiusMeters: Math.max(50, Math.min(50000, Number(radiusMeters) || 500)),
    name: String(name || 'Home Safe Zone'),
    enabled: Boolean(enabled),
    updatedAt: new Date().toISOString()
  };

  try {
    await db.safeZones.put(updated);
    try {
      await fetch('/api/location/safe-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {}
    return updated;
  } catch (err) {
    console.warn('Could not save safe zone:', err);
    return updated;
  }
}

export async function notifySafeZoneBreach({ patient, location, safeZone, distanceMeters }) {
  if (!patient || !location || !safeZone) return;

  const caregiverId = 2;
  const breachDistance = Math.round(distanceMeters - (safeZone.radiusMeters || 500));
  const timeKey = new Date().toISOString().slice(0, 14);
  const idempotencyKey = 'breach_' + (patient.id || 1) + '_' + timeKey;

  try {
    await createNotification({
      userId: caregiverId,
      type: NOTIFICATION_TYPES.ALERT,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      title: '⚠️ Safety Alert: ' + (patient.name || 'Loved One') + ' outside safe zone',
      message: (patient.name || 'Patient') + ' is approximately ' + breachDistance + 'm outside the configured safe zone. Tap to view live location map.',
      actionUrl: '/caregiver/dashboard',
      idempotencyKey,
      metadata: {
        patientId: patient.id,
        latitude: location.latitude,
        longitude: location.longitude,
        breachDistance
      }
    });
  } catch (err) {
    console.warn('Could not dispatch safe-zone breach notification:', err);
  }
}
