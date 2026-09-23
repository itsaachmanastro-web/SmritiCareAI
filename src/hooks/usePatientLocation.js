import { useState, useEffect, useCallback, useRef } from 'react';
import { recordPatientLocation, getLatestPatientLocation } from '../services/location/locationService.js';

export function usePatientLocation(patientId, isSharingEnabled = true) {
  const [location, setLocation] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const watchIdRef = useRef(null);
  const pid = Number(patientId) || 1;

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      setError('Geolocation is not supported by this browser.');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionState(status.state);
        status.onchange = () => {
          setPermissionState(status.state);
        };
      }).catch(() => {});
    }

    getLatestPatientLocation(pid).then((loc) => {
      if (loc) {
        setLocation(loc);
        setLastSyncTime(loc.timestamp);
      }
    });
  }, [pid]);

  const handlePositionSuccess = useCallback(async (pos) => {
    setIsAcquiring(false);
    setError(null);
    setPermissionState('granted');

    const newLoc = {
      patientId: pid,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      source: 'gps',
      status: 'active',
      timestamp: new Date().toISOString()
    };

    setLocation(newLoc);
    setLastSyncTime(newLoc.timestamp);

    await recordPatientLocation(newLoc);
  }, [pid]);

  const handlePositionError = useCallback((err) => {
    setIsAcquiring(false);
    if (err.code === 1) {
      setPermissionState('denied');
      setError('Location permission was denied. Please enable location permissions in browser settings.');
    } else if (err.code === 2) {
      setError('Location signal unavailable. Showing last known coordinates.');
    } else if (err.code === 3) {
      setError('Location request timed out. Retrying...');
    } else {
      setError(err.message || 'Unable to retrieve location.');
    }
  }, []);

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsAcquiring(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  useEffect(() => {
    if (!isSharingEnabled || !navigator.geolocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    setIsAcquiring(true);
    requestCurrentLocation();

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 15000
        }
      );
    } catch (e) {
      console.warn('Could not start geolocation watchPosition:', e);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isSharingEnabled, handlePositionSuccess, handlePositionError, requestCurrentLocation]);

  return {
    location,
    permissionState,
    isAcquiring,
    error,
    lastSyncTime,
    requestCurrentLocation
  };
}
