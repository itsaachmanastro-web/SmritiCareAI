import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  History,
  Activity,
  Plus,
  ChevronRight,
  Clock,
  Navigation,
  Compass,
  BatteryCharging,
  Battery,
  Quote,
  Users,
  X,
  Radio,
  Check,
  Settings
} from 'lucide-react';
import PatientLocationMap from '../../components/location/PatientLocationMap';
import CaregiverCallModal from '../../components/caregiver/CaregiverCallModal';
import CaregiverMessageModal from '../../components/caregiver/CaregiverMessageModal';
import GoogleMapsConfigModal from '../../components/location/GoogleMapsConfigModal';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import {
  getPatientSafeZone,
  savePatientSafeZone,
  checkGeofenceBreach,
  getLocationFreshness,
  LOCATION_STATUS,
  SAFE_ZONE_PRESETS
} from '../../services/location/locationService';

export default function CaregiverLocationView({
  activePatient,
  assignedPatients = [],
  selectedPatientId,
  onSelectPatient = () => {},
  onAddPatient = () => {},
  caregiverName = 'Rahul Sharma'
}) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  const patientId = activePatient?.id || 1;
  const patientDisplayName = activePatient?.displayName || activePatient?.name?.split(' ')[0] || 'Amma';
  const firstNameOnly = activePatient?.name?.split(' ')[0] || 'Amma';

  const [safeZone, setSafeZone] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSafeZoneModal, setShowSafeZoneModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showMapsConfigModal, setShowMapsConfigModal] = useState(false);
  const [customRadius, setCustomRadius] = useState(500);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState('');

  // 1. Live Query Locations for active patient
  const liveLocations = useLiveQuery(
    () => db.patientLocations.where('patientId').equals(Number(patientId)).reverse().sortBy('timestamp'),
    [patientId]
  ) || [];

  // 2. Live Query Safe Zone for active patient
  const liveSafeZone = useLiveQuery(
    () => db.safeZones.get(Number(patientId)),
    [patientId]
  );

  useEffect(() => {
    if (liveSafeZone) {
      setSafeZone(liveSafeZone);
      setCustomRadius(liveSafeZone.radiusMeters || 500);
    } else {
      getPatientSafeZone(patientId).then(sz => {
        setSafeZone(sz);
        setCustomRadius(sz.radiusMeters || 500);
      });
    }
  }, [liveSafeZone, patientId]);

  const latestLocation = liveLocations.length > 0 ? liveLocations[0] : null;

  // Geofencing calculation
  const geofenceResult = useMemo(() => {
    return checkGeofenceBreach(latestLocation, safeZone);
  }, [latestLocation, safeZone]);

  const freshness = getLocationFreshness(latestLocation?.timestamp);
  const isLive = freshness === LOCATION_STATUS.LIVE;

  // Relative Time String
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return t('location.justNow') || '2 minutes ago';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t('location.justNow') || 'Just now';
    if (mins < 60) return `${mins} ${t('location.minAgo') || 'minutes ago'}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t('location.hoursAgo') || 'hours ago'}`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Human Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('location.goodMorning') || 'Good Morning';
    if (hour < 17) return t('location.goodAfternoon') || 'Good Afternoon';
    return t('location.goodEvening') || 'Good Evening';
  };

  const displayNameCaregiver = caregiverName || currentUser?.name || 'Rahul';
  const cFirstName = displayNameCaregiver.split(' ')[0] || 'Rahul';

  // Address Resolution
  const resolvedAddress = useMemo(() => {
    if (activePatient?.location) return activePatient.location;
    if (latestLocation?.latitude && latestLocation?.longitude) {
      if (Math.abs(latestLocation.latitude - 26.75) < 0.5) return 'Jorhat, Assam';
      if (Math.abs(latestLocation.latitude - 23.25) < 0.5) return 'Bhopal, Madhya Pradesh';
      return `${latestLocation.latitude.toFixed(4)}° N, ${latestLocation.longitude.toFixed(4)}° E`;
    }
    return 'Jorhat, Assam';
  }, [activePatient, latestLocation]);

  // Movement speed string
  const movementString = useMemo(() => {
    if (latestLocation?.speed && latestLocation.speed > 0) {
      return `${t('location.moving') || 'Moving'} · ${latestLocation.speed.toFixed(1)} km/h`;
    }
    if (isLive) {
      return `${t('location.moving') || 'Moving'} · 3.2 km/h`;
    }
    return `${t('location.stationary') || 'Stationary'} · 0 km/h`;
  }, [latestLocation, isLive, t]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/location/patient?patientId=' + patientId);
      if (res.ok) {
        const data = await res.json();
        if (data.location) {
          await db.patientLocations.put(data.location);
        }
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Safe zone save handler
  const handleSaveSafeZone = async (newRadius, isEnabled = true) => {
    const centerLat = latestLocation?.latitude || safeZone?.centerLatitude || 26.7509;
    const centerLon = latestLocation?.longitude || safeZone?.centerLongitude || 94.2037;

    const updated = await savePatientSafeZone({
      patientId,
      centerLatitude: centerLat,
      centerLongitude: centerLon,
      radiusMeters: newRadius,
      enabled: isEnabled,
      name: `Home Safe Zone (${patientDisplayName})`
    });

    setSafeZone(updated);
    setNotice(t('location.safeZoneUpdated') || 'Safe zone updated successfully.');
    setShowSafeZoneModal(false);
    setTimeout(() => setNotice(''), 3500);
  };

  // Emergency SOS handler
  const handleTriggerEmergencySos = async () => {
    try {
      await fetch('/api/location/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          latitude: latestLocation?.latitude || safeZone?.centerLatitude || 26.7509,
          longitude: latestLocation?.longitude || safeZone?.centerLongitude || 94.2037,
          accuracy: latestLocation?.accuracy || 15,
          message: `Caregiver SOS triggered for ${patientDisplayName}`
        })
      });

      // Also persist to Dexie alerts
      await db.locationAlerts.add({
        patientId: Number(patientId),
        alertType: 'emergency_sos',
        message: `🚨 Emergency Alert Broadcasted for ${patientDisplayName}. Local PHC alerted.`,
        resolved: false,
        timestamp: new Date().toISOString()
      });

      setNotice(`🚨 Emergency Alert Broadcasted for ${patientDisplayName}. Local PHC center notified.`);
      setShowEmergencyModal(false);
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const googleMapsUrl = latestLocation
    ? `https://www.google.com/maps/search/?api=1&query=${latestLocation.latitude},${latestLocation.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${safeZone?.centerLatitude || 26.7509},${safeZone?.centerLongitude || 94.2037}`;

  // Default / fallback patients list if none passed
  const patientList = assignedPatients.length > 0 ? assignedPatients : [
    { id: 1, name: 'Bimala', displayName: 'Bimala Borah (Amma)', relation: 'Mother', phone: '+91 94350 56789' },
    { id: 2, name: 'Papa', displayName: 'Papa', relation: 'Father', phone: '+91 94350 88888' },
    { id: 3, name: 'Sushma', displayName: 'Sushma', relation: 'Aunt', phone: '+91 94350 77777' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & MOTIVATIONAL BANNER (Exact layout matching Reference Image) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6E7D76] dark:text-[#889B95] block mb-1">
            {t('navigation.dashboard') || 'Caregiver Dashboard'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#192320] dark:text-white flex items-center gap-2">
            <span>{getGreeting()}, {cFirstName}</span>
            <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6E7D76] dark:text-[#889B95] mt-0.5 font-medium">
            {t('location.heresHowDoing') || "Here's how your loved ones are doing today."}
          </p>
        </div>

        {/* Motivational Quote Card on Right */}
        <div className="hidden lg:flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] shadow-2xs max-w-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#122A26] text-emerald-600 dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
            <Quote className="w-4 h-4" />
          </div>
          <p className="text-xs text-[#4A5954] dark:text-[#CBD5E1] italic font-serif leading-relaxed">
            {t('location.quoteTitle') || '“Small steps, together, lead to a safer and happier tomorrow.”'}
          </p>
        </div>
      </div>

      {/* Temporary Toast Alert */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-[#143D30] dark:bg-[#122C27] text-white text-xs font-bold flex items-center gap-2.5 shadow-lg border border-emerald-400/30"
        >
          <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
          <span>{notice}</span>
        </motion.div>
      )}

      {/* 2. TOP PATIENT SELECTOR ROW (Matching Reference Image Pills) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {patientList.map((p, idx) => {
          const isSelected = p.id === (selectedPatientId || activePatient?.id || 1);
          const pName = p.name?.split(' ')[0] || `Patient ${idx + 1}`;
          const initial = pName.charAt(0).toUpperCase();

          // Derive location status text
          let statusText = t('location.locationActive') || 'Location active';
          let statusDotColor = 'bg-emerald-500 animate-pulse';

          if (idx === 1) {
            statusText = `${t('location.lastUpdated') || 'Last updated'} 1h ago`;
            statusDotColor = 'bg-slate-400';
          } else if (idx === 2) {
            statusText = t('location.locationOff') || 'Location off';
            statusDotColor = 'bg-rose-400';
          }

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPatient(p.id)}
              className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-[#EAF5F0] dark:bg-[#0E2420] border-emerald-500/80 dark:border-[#2DD4BF]/80 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-white dark:bg-[#0E1719] border-[#ECE7DE] dark:border-[#18292D] hover:border-emerald-300 dark:hover:border-emerald-700/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105 ${
                  isSelected
                    ? 'bg-emerald-600 text-white dark:bg-[#2DD4BF] dark:text-[#091113]'
                    : 'bg-[#FAF8F5] dark:bg-[#121E22] text-[#192320] dark:text-white border border-[#ECE7DE] dark:border-[#18292D]'
                }`}>
                  {initial}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[#192320] dark:text-white truncate leading-tight">
                    {pName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} />
                    <span className="text-[11px] text-[#6E7D76] dark:text-[#889B95] truncate font-medium">
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                isSelected ? 'text-emerald-600 dark:text-[#2DD4BF]' : 'text-[#8C9B95] dark:text-[#64748B]'
              }`} />
            </button>
          );
        })}

        {/* Add Patient Pill Button */}
        <button
          type="button"
          onClick={onAddPatient}
          className="p-3.5 rounded-2xl border border-dashed border-[#C5BCB0] dark:border-[#243B37] hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-xs font-bold text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t('location.addPatient') || '+ Add Patient'}</span>
        </button>
      </div>

      {/* 3. MAIN CONTENT: 2-COLUMN SPLIT (Left: Patient Details Card, Right: Map & History) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PATIENT LOCATION PROFILE & STATUS (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
            
            {/* Header: Avatar, Name, Live Status Dot, Battery */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F1EC] dark:bg-[#122A26] border border-[#D5E5DC] dark:border-[#163832] flex items-center justify-center font-bold text-lg text-[#143D30] dark:text-[#2DD4BF] shadow-xs">
                  {firstNameOnly.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#192320] dark:text-white leading-tight">
                    {firstNameOnly}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className={`text-xs font-bold ${isLive ? 'text-emerald-700 dark:text-[#2DD4BF]' : 'text-amber-700 dark:text-amber-400'}`}>
                      {isLive ? (t('location.liveLocation') || 'Live Location') : (t('location.statusLastKnown') || 'Last Known Location')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Battery Indicator Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 text-xs font-semibold text-[#4A5954] dark:text-[#94A3B8]">
                <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400 rotate-90" />
                <span>78%</span>
              </div>
            </div>

            {/* Location Sharing Active Green Card */}
            <div 
              onClick={() => setShowMapsConfigModal(true)}
              className="p-4 rounded-2xl bg-[#EAF5F0] dark:bg-[#0E2420] border border-[#CDE5DA] dark:border-[#163B34] flex items-center justify-between gap-3 cursor-pointer group"
              title="Click to view Maps Configuration"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white dark:bg-[#2DD4BF] dark:text-[#091113] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#143D30] dark:text-[#E6F4F1] leading-snug">
                    {t('location.locationSharingActive') || 'Location Sharing Active'}
                  </h4>
                  <p className="text-[11px] text-[#4A6359] dark:text-[#889B95] leading-tight mt-0.5">
                    {t('location.locationSharingDesc') || "Your loved one's location is being shared in real time."}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#143D30] dark:text-[#2DD4BF] shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Detail Rows */}
            <div className="space-y-4 pt-1">
              
              {/* 1. Current Location */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#6E7D76] dark:text-[#889B95] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-[#6E7D76] dark:text-[#889B95] block">
                      {t('location.currentLocation') || 'Current Location'}
                    </span>
                    <p className="text-xs font-bold text-[#192320] dark:text-white mt-0.5">
                      {resolvedAddress}
                    </p>
                  </div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-bold text-[#192320] dark:text-white flex items-center gap-1 border border-black/5 dark:border-white/5 transition-colors shrink-0"
                >
                  <span>{t('location.viewOnMaps') || 'View on Maps'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 2. Last Updated */}
              <div className="flex items-start gap-2.5 pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                <Clock className="w-4 h-4 text-[#6E7D76] dark:text-[#889B95] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#6E7D76] dark:text-[#889B95] block">
                    {t('location.lastUpdated') || 'Last Updated'}
                  </span>
                  <p className="text-xs font-bold text-[#192320] dark:text-white mt-0.5">
                    {formatRelativeTime(latestLocation?.timestamp)}
                  </p>
                </div>
              </div>

              {/* 3. Movement Status */}
              <div className="flex items-start gap-2.5 pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                <Navigation className="w-4 h-4 text-[#6E7D76] dark:text-[#889B95] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#6E7D76] dark:text-[#889B95] block">
                    {t('location.movementStatus') || 'Movement Status'}
                  </span>
                  <p className="text-xs font-bold text-emerald-700 dark:text-[#4ADE80] mt-0.5">
                    {movementString}
                  </p>
                </div>
              </div>

              {/* 4. Safe Zone Status */}
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#6E7D76] dark:text-[#889B95] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#6E7D76] dark:text-[#889B95] block">
                    {t('location.safeZone') || 'Safe Zone'}
                  </span>
                  <p className={`text-xs font-bold mt-0.5 ${
                    geofenceResult.isInside
                      ? 'text-emerald-700 dark:text-[#4ADE80]'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {geofenceResult.isInside
                      ? (t('location.insideSafeZone') || 'Inside Safe Zone')
                      : (t('location.outsideSafeZone') || '⚠️ Outside Safe Zone')}
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Button: View Location History */}
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#121E22] hover:bg-[#ECE7DE] dark:hover:bg-[#1A2A30] border border-[#ECE7DE] dark:border-[#18292D] text-xs font-bold text-[#192320] dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>{t('location.viewLocationHistory') || 'View Location History'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: MAP & TODAY'S MOVEMENT & QUICK ACTIONS (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. INTERACTIVE REAL-TIME MAP CARD */}
          <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs space-y-4">
            
            {/* Map Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#0E2420] text-emerald-700 dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#192320] dark:text-white leading-tight">
                    {t('location.liveLocation') || 'Live Location'}
                  </h3>
                  <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] font-medium">
                    {t('location.realtimeLocationOf') || 'Real-time location of'} {firstNameOnly}
                  </p>
                </div>
              </div>

              {/* Action Pills: Live Badge + Refresh Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-[#0E2420] border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-800 dark:text-[#2DD4BF]">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isLive ? (t('location.live') || 'Live') : (t('location.statusLastKnown') || 'Last Known')}</span>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 px-3 rounded-full bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 border border-[#ECE7DE] dark:border-[#18292D] text-xs font-bold text-[#192320] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">{t('location.refresh') || 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* The Real Watermark-Free Leaflet/Google Map */}
            <PatientLocationMap
              patient={activePatient}
              location={latestLocation}
              safeZone={safeZone}
              isInsideSafeZone={geofenceResult.isInside}
              distanceMeters={geofenceResult.distanceMeters}
              history={liveLocations}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>

          {/* 2. SUB-ROW: TODAY'S MOVEMENT (LEFT) & QUICK ACTIONS (RIGHT) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* TODAY'S MOVEMENT TIMELINE (7 Cols) */}
            <div className="md:col-span-7 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-[#2DD4BF]" />
                  <h3 className="font-bold text-sm text-[#192320] dark:text-white">
                    {t('location.todaysMovement') || "Today's Movement"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="text-xs font-bold text-emerald-700 dark:text-[#2DD4BF] hover:underline cursor-pointer"
                >
                  {t('location.viewAll') || 'View All'}
                </button>
              </div>

              {/* Connected Vertical Timeline */}
              <div className="space-y-3 relative pl-3">
                {/* Timeline vertical bar */}
                <div className="absolute left-[21px] top-2 bottom-3 w-[2px] bg-slate-200 dark:bg-[#1E3036]" />

                {/* Step 1: At Home */}
                <div className="flex items-start gap-3 relative z-10">
                  <span className="text-[11px] font-mono font-bold text-[#6E7D76] dark:text-[#889B95] w-14 shrink-0 pt-0.5">
                    10:24 AM
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-[#122A26] border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-[#2DD4BF] flex items-center justify-center text-[10px] shrink-0">
                    🏠
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#192320] dark:text-white leading-tight">
                      {t('location.atHome') || 'At Home'}
                    </h5>
                    <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95]">
                      {resolvedAddress}
                    </p>
                  </div>
                </div>

                {/* Step 2: Moving */}
                <div className="flex items-start gap-3 relative z-10">
                  <span className="text-[11px] font-mono font-bold text-[#6E7D76] dark:text-[#889B95] w-14 shrink-0 pt-0.5">
                    11:05 AM
                  </span>
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-[#0E2235] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] shrink-0">
                    🚶
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#192320] dark:text-white leading-tight">
                      {t('location.moving') || 'Moving'}
                    </h5>
                    <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95]">
                      Near Main Road / PHC Lane
                    </p>
                  </div>
                </div>

                {/* Step 3: Reached Destination */}
                <div className="flex items-start gap-3 relative z-10">
                  <span className="text-[11px] font-mono font-bold text-[#6E7D76] dark:text-[#889B95] w-14 shrink-0 pt-0.5">
                    11:20 AM
                  </span>
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-[#2A1D0E] border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] shrink-0">
                    🏬
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#192320] dark:text-white leading-tight">
                      {t('location.reachedDestination') || 'Reached Destination'}
                    </h5>
                    <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95]">
                      Community Center
                    </p>
                  </div>
                </div>

                {/* Step 4: Currently Moving / Live */}
                <div className="flex items-start gap-3 relative z-10">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-[#2DD4BF] w-14 shrink-0 pt-0.5">
                    11:42 AM
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 animate-pulse">
                    🧭
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-emerald-700 dark:text-[#2DD4BF] leading-tight">
                      {t('location.currentlyMoving') || 'Currently Moving'}
                    </h5>
                    <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95]">
                      {formatRelativeTime(latestLocation?.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS (5 Cols) — 100% EXPLICIT DEDICATED ROUTINGS */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              
              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 dark:text-[#2DD4BF]" />
                  <h3 className="font-bold text-sm text-[#192320] dark:text-white">
                    {t('location.quickActions') || 'Quick Actions'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* ACTION 1: CALL (Opens Dedicated CaregiverCallModal) */}
                  <button
                    type="button"
                    onClick={() => setShowCallModal(true)}
                    className="p-3 rounded-2xl bg-[#EAF5F0] dark:bg-[#0E2420] hover:bg-[#D7ECE2] dark:hover:bg-[#13332B] border border-[#CDE5DA] dark:border-[#163B34] text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[64px]"
                  >
                    <PhoneCall className="w-4 h-4 text-[#143D30] dark:text-[#2DD4BF]" />
                    <span className="font-bold text-xs text-[#143D30] dark:text-[#2DD4BF] mt-1.5 leading-tight">
                      {t('location.callPatient', { name: firstNameOnly }) || `Call ${firstNameOnly}`}
                    </span>
                  </button>

                  {/* ACTION 2: SEND MESSAGE (Opens Dedicated CaregiverMessageModal) */}
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(true)}
                    className="p-3 rounded-2xl bg-blue-50 dark:bg-[#0E1E2E] hover:bg-blue-100 dark:hover:bg-[#132A40] border border-blue-200 dark:border-blue-900/60 text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[64px]"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-xs text-blue-800 dark:text-blue-300 mt-1.5 leading-tight">
                      {t('location.sendMessage') || 'Send Message'}
                    </span>
                  </button>

                  {/* ACTION 3: SET SAFE ZONE (Opens Dedicated Safe Zone Config Modal) */}
                  <button
                    type="button"
                    onClick={() => setShowSafeZoneModal(true)}
                    className="p-3 rounded-2xl bg-amber-50 dark:bg-[#251A0E] hover:bg-amber-100 dark:hover:bg-[#332313] border border-amber-200 dark:border-amber-900/60 text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[64px]"
                  >
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-xs text-amber-800 dark:text-amber-300 mt-1.5 leading-tight">
                      {t('location.setSafeZone') || 'Set Safe Zone'}
                    </span>
                  </button>

                  {/* ACTION 4: EMERGENCY ALERT (Opens Dedicated Emergency SOS Modal) */}
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(true)}
                    className="p-3 rounded-2xl bg-rose-50 dark:bg-[#2A1517] hover:bg-rose-100 dark:hover:bg-[#3D1E21] border border-rose-200 dark:border-rose-900/60 text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[64px]"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="font-bold text-xs text-rose-800 dark:text-rose-300 mt-1.5 leading-tight">
                      {t('location.emergencyAlert') || 'Emergency Alert'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Safe Together Footer Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-400 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#0E2420] text-emerald-700 dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#192320] dark:text-white leading-tight">
                      {t('location.safeTogether') || 'Safe Together'}
                    </h4>
                    <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-0.5 font-medium">
                      {t('location.safeTogetherSub') || 'Stay connected. Stay confident.'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C9B95] dark:text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* DEDICATED MODAL 1: CALL MODAL */}
      <CaregiverCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        patient={activePatient}
      />

      {/* DEDICATED MODAL 2: SEND MESSAGE MODAL */}
      <CaregiverMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        patient={activePatient}
        onMessageSent={(msg) => {
          setNotice(`Message sent to ${firstNameOnly}: "${msg}"`);
          setTimeout(() => setNotice(''), 4000);
        }}
      />

      {/* DEDICATED MODAL 3: SAFE ZONE CONFIGURATION MODAL */}
      <AnimatePresence>
        {showSafeZoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-[#281D0E] text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-[#192320] dark:text-white">
                    {t('location.safeZoneConfigTitle') || 'Configure Safe Zone Radius'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSafeZoneModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#6E7D76] dark:text-[#889B95] leading-relaxed">
                {t('location.safeZoneDesc') || 'Select the allowed radius around home. You will receive real-time notifications if your loved one steps outside this boundary.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAFE_ZONE_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSaveSafeZone(preset.value, true)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      customRadius === preset.value
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-[#0E2420] dark:border-[#2DD4BF]'
                        : 'border-[#ECE7DE] dark:border-[#18292D] hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-[#192320] dark:text-white">
                        {preset.label}
                      </span>
                      {customRadius === preset.value && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-[#2DD4BF]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-1 block font-medium">
                      {t(preset.descKey) || preset.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSafeZoneModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-[#6E7D76] dark:text-[#CBD5E1] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED MODAL 4: EMERGENCY ALERT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#0E1719] border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-950 dark:text-rose-100">
                    {t('location.emergencyPrompt') || 'Broadcast Emergency Alert?'}
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                    For {patientDisplayName}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#4A5954] dark:text-[#CBD5E1] leading-relaxed">
                {t('location.emergencyDesc') || "This will notify designated local emergency contacts and primary healthcare workers with the patient's current GPS location."}
              </p>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#6E7D76] dark:text-[#889B95] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleTriggerEmergencySos}
                  className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {t('location.sendEmergencySos') || 'Broadcast SOS Alert'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED MODAL 5: FULL LOCATION HISTORY TIMELINE MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#0E2420] text-emerald-700 dark:text-[#2DD4BF] flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-[#192320] dark:text-white">
                    {t('location.viewLocationHistory') || 'Location Trail History'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {liveLocations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">
                    {t('location.noMovementHistory') || 'No movement history recorded yet today.'}
                  </p>
                ) : (
                  liveLocations.map((loc, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <div>
                          <span className="font-bold text-[#192320] dark:text-white block">
                            {i === 0 ? 'Latest GPS Coordinate' : `Waypoint #${liveLocations.length - i}`}
                          </span>
                          <span className="text-[10px] text-[#6E7D76] dark:text-[#889B95] font-mono">
                            {loc.latitude.toFixed(5)}° N, {loc.longitude.toFixed(5)}° E (&plusmn;{loc.accuracy || 15}m)
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#6E7D76] dark:text-[#889B95]">
                        {new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2.5 rounded-full bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#091113] text-xs font-bold cursor-pointer"
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED MODAL 6: GOOGLE MAPS CONFIG MODAL */}
      <GoogleMapsConfigModal
        isOpen={showMapsConfigModal}
        onClose={() => setShowMapsConfigModal(false)}
        onConfigSaved={() => {
          setNotice('Google Maps configuration saved.');
          setTimeout(() => setNotice(''), 3500);
        }}
      />
    </div>
  );
}
