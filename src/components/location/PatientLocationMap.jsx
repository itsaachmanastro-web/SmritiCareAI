import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Shield,
  Plus,
  Minus,
  Crosshair,
  ExternalLink,
  RefreshCw,
  Clock,
  Settings,
  Layers,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLocationFreshness, LOCATION_STATUS } from '../../services/location/locationService';
import { mapsConfigService } from '../../services/location/mapsConfigService';
import GoogleMapsConfigModal from './GoogleMapsConfigModal';

// Clean, 100% watermark-free tile providers
const TILE_PROVIDERS = {
  OSM_LIGHT: {
    id: 'osm',
    name: 'Road Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  SATELLITE: {
    id: 'satellite',
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Earthstar Geographics'
  }
};

export default function PatientLocationMap({
  patient,
  location,
  safeZone,
  isInsideSafeZone = true,
  distanceMeters = 0,
  history = [],
  onRefresh = () => {},
  isRefreshing = false,
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const patientMarkerRef = useRef(null);
  const safeZoneCircleRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const pathPolylineRef = useRef(null);

  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [mapType, setMapType] = useState('auto'); // 'auto' | 'satellite' | 'google'
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(null);

  const activeLat = location?.latitude ?? safeZone?.centerLatitude ?? 26.7509;
  const activeLon = location?.longitude ?? safeZone?.centerLongitude ?? 94.2037;
  const accuracy = location?.accuracy || 15;

  const freshness = getLocationFreshness(location?.timestamp);
  const isLive = freshness === LOCATION_STATUS.LIVE;

  // Check Google Maps key configuration status on mount
  useEffect(() => {
    mapsConfigService.getStatus().then(res => {
      setHasGoogleKey(Boolean(res.hasKey));
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [activeLat, activeLon],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      mapInstanceRef.current = map;
      setMapLoadError(null);
    } catch (err) {
      console.warn('Map initialization error:', err);
      setMapLoadError('Unable to initialize map viewport.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer cleanly with NO watermark
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const selectedTile = mapType === 'satellite' ? TILE_PROVIDERS.SATELLITE : TILE_PROVIDERS.OSM_LIGHT;

    tileLayerRef.current = L.tileLayer(selectedTile.url, {
      maxZoom: 19,
      subdomains: 'abc',
      attribution: selectedTile.attribution,
      className: isDark && mapType !== 'satellite' ? 'leaflet-dark-tiles' : ''
    }).addTo(mapInstanceRef.current);
  }, [mapType, isDark]);

  // Safe Zone Circle
  useEffect(() => {
    if (!mapInstanceRef.current || !safeZone || !safeZone.enabled) {
      if (safeZoneCircleRef.current) safeZoneCircleRef.current.remove();
      return;
    }

    const map = mapInstanceRef.current;
    const center = [safeZone.centerLatitude, safeZone.centerLongitude];
    const radius = Number(safeZone.radiusMeters) || 500;

    const strokeColor = isInsideSafeZone ? '#10B981' : '#F43F5E';
    const fillColor = isInsideSafeZone ? '#10B981' : '#F43F5E';

    if (!safeZoneCircleRef.current) {
      safeZoneCircleRef.current = L.circle(center, {
        radius,
        color: strokeColor,
        weight: 2,
        dashArray: isInsideSafeZone ? '6, 6' : '3, 6',
        fillColor,
        fillOpacity: isDark ? 0.08 : 0.05
      }).addTo(map);
    } else {
      safeZoneCircleRef.current.setLatLng(center);
      safeZoneCircleRef.current.setRadius(radius);
      safeZoneCircleRef.current.setStyle({
        color: strokeColor,
        fillColor,
        dashArray: isInsideSafeZone ? '6, 6' : '3, 6'
      });
    }
  }, [safeZone, isInsideSafeZone, isDark]);

  // Format relative time for marker popup
  const getRelativeTimeText = () => {
    if (!location?.timestamp) return t('location.noRecentSignal') || 'No signal';
    const diffMs = Date.now() - new Date(location.timestamp).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t('location.justNow') || 'Just now';
    if (mins < 60) return `${mins} ${t('location.minAgo') || 'min ago'}`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} ${t('location.hoursAgo') || 'h ago'}`;
  };

  // Custom Patient Marker matching Reference Design
  useEffect(() => {
    if (!mapInstanceRef.current || location == null) return;
    const map = mapInstanceRef.current;
    const pos = [location.latitude, location.longitude];

    const patientName = patient?.displayName || patient?.name?.split(' ')[0] || 'Amma';
    const initial = patientName.charAt(0).toUpperCase();
    const timeText = getRelativeTimeText();

    const avatarHtml = patient?.avatar || patient?.profileImage
      ? `<img src="${patient.avatar || patient.profileImage}" alt="${patientName}" class="w-full h-full object-cover rounded-full" />`
      : `<span class="font-bold text-sm text-white">${initial}</span>`;

    const markerHtml = `
      <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
        <!-- Floating Tooltip Card matching Reference Image -->
        <div class="mb-2 px-3 py-1.5 rounded-xl bg-[#091418]/95 dark:bg-[#060D10]/95 backdrop-blur-md border border-emerald-500/40 text-white shadow-2xl flex items-center justify-between gap-3 min-w-[90px] transition-transform group-hover:scale-105">
          <div>
            <div class="font-bold text-xs text-white leading-none tracking-tight">${patientName}</div>
            <div class="text-[9px] text-[#8C9B95] mt-0.5 leading-none font-medium">${timeText}</div>
          </div>
          <svg class="w-3 h-3 text-[#8C9B95]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <!-- Glowing Avatar Circle -->
        <div class="relative flex items-center justify-center">
          ${isLive ? '<span class="absolute w-12 h-12 rounded-full bg-emerald-400/30 animate-ping"></span>' : ''}
          <div class="w-10 h-10 rounded-full bg-[#143D30] border-2 border-emerald-400 shadow-lg flex items-center justify-center p-0.5 overflow-hidden">
            ${avatarHtml}
          </div>
          <!-- Pointer Pin Tip -->
          <div class="absolute -bottom-1 w-2 h-2 bg-emerald-400 transform rotate-45"></div>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-patient-marker-container',
      html: markerHtml,
      iconSize: [120, 80],
      iconAnchor: [60, 80]
    });

    if (!patientMarkerRef.current) {
      patientMarkerRef.current = L.marker(pos, { icon: customIcon }).addTo(map);
    } else {
      patientMarkerRef.current.setLatLng(pos);
      patientMarkerRef.current.setIcon(customIcon);
    }

    // Accuracy Circle
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle(pos, {
        radius: Math.max(10, accuracy),
        color: '#2DD4BF',
        weight: 1,
        fillColor: '#2DD4BF',
        fillOpacity: 0.08
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng(pos);
      accuracyCircleRef.current.setRadius(Math.max(10, accuracy));
    }
  }, [location, patient, freshness, isInsideSafeZone, accuracy]);

  // Historical Breadcrumbs Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !history || history.length < 2) {
      if (pathPolylineRef.current) pathPolylineRef.current.remove();
      return;
    }

    const latlngs = history.map(h => [h.latitude, h.longitude]);
    if (!pathPolylineRef.current) {
      pathPolylineRef.current = L.polyline(latlngs, {
        color: '#2DD4BF',
        weight: 3,
        opacity: 0.6,
        dashArray: '4, 8'
      }).addTo(mapInstanceRef.current);
    } else {
      pathPolylineRef.current.setLatLngs(latlngs);
    }
  }, [history]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([activeLat, activeLon], 16, { duration: 0.8 });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={'relative w-full rounded-3xl overflow-hidden bg-[#0A1417] dark:bg-[#070D0E] flex flex-col h-[340px] sm:h-[380px] lg:h-[400px] ' + className}>
      
      {/* CSS Dark Mode Filter for Clean OpenStreetMap Tiles */}
      <style>{`
        .leaflet-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%);
        }
        .leaflet-container {
          background: #091215 !important;
        }
      `}</style>

      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* FLOATING TOP-RIGHT LAYER & GOOGLE MAPS CONFIG PILL */}
      <div className="absolute top-4 right-4 z-[500] flex items-center gap-1.5">
        <div className="flex items-center bg-[#14262B]/90 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-lg text-[11px] font-bold text-white">
          <button
            type="button"
            onClick={() => setMapType('auto')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              mapType === 'auto' ? 'bg-[#143D30] text-white dark:bg-[#2DD4BF] dark:text-[#091113]' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('location.roadMap') || 'Road Map'}
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              mapType === 'satellite' ? 'bg-[#143D30] text-white dark:bg-[#2DD4BF] dark:text-[#091113]' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('location.satelliteView') || 'Satellite'}
          </button>
        </div>

        {/* Configure Google Maps Button */}
        <button
          type="button"
          onClick={() => setShowConfigModal(true)}
          className="p-2 rounded-xl bg-[#14262B]/90 backdrop-blur-md border border-white/10 text-white/80 hover:text-[#2DD4BF] hover:bg-white/10 shadow-lg transition-colors cursor-pointer"
          title={t('location.mapsConfigTitle') || 'Configure Google Maps API Key'}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* FLOATING MAP CONTROLS ON BOTTOM RIGHT (Zoom & Locate) */}
      <div className="absolute right-4 bottom-4 z-[500] flex flex-col items-center gap-2">
        {/* Zoom Controls Pill */}
        <div className="flex flex-col bg-[#14262B]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors border-b border-white/10 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Re-center Target Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-[#14262B]/90 backdrop-blur-md border border-white/10 text-white/80 hover:text-[#2DD4BF] hover:bg-white/10 shadow-lg transition-colors cursor-pointer"
          title="Center on Patient"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Google Maps Configuration Modal */}
      <GoogleMapsConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfigSaved={() => {
          mapsConfigService.getStatus().then(res => setHasGoogleKey(Boolean(res.hasKey)));
        }}
      />
    </div>
  );
}
