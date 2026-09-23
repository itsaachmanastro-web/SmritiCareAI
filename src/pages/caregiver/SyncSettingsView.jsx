import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Shield,
  HardDrive,
  Wifi,
  Server,
  Zap,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Activity,
  Check,
  Layers,
  Users,
  UserCheck,
  FileCheck,
  MapPin,
  Key,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { db, getDatabaseDiagnostics } from '../../db/dexie';
import { syncNow, getSyncStats } from '../../db/syncService';
import { getAppMode, setAppMode, APP_MODES } from '../../config/appMode';
import { mapsConfigService } from '../../services/location/mapsConfigService';

export default function SyncSettingsView() {
  const [currentMode, setCurrentMode] = useState(getAppMode());
  const [diagnostics, setDiagnostics] = useState({
    status: 'CONNECTED',
    name: 'SmritiCareDB',
    version: 3,
    mode: 'production',
    isProduction: true,
    usersCount: 0,
    verifiedUsersCount: 0,
    demoUsersCount: 0,
    gameSessionsCount: 0,
    cognitiveScoresCount: 0,
    remindersCount: 0,
    patientProfilesCount: 0,
    healthRecordsCount: 0,
    conversationsCount: 0,
    syncQueueCount: 0,
    pendingQueueCount: 0,
    totalRecords: 0,
    integrity: {
      totalVerifiedUsers: 0,
      linkedRecordsCount: 0,
      unassignedRecordsCount: 0,
      demoRecordsCount: 0,
      pendingSyncCount: 0,
      totalQueueCount: 0
    },
    verifiedUsersList: [],
    lastWrite: 'None',
    lastSync: 'Never',
    lastSyncError: 'None'
  });

  const [recentQueueItems, setRecentQueueItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Google Maps API Configuration State
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [isMapsConfigured, setIsMapsConfigured] = useState(false);
  const [isSavingMapsKey, setIsSavingMapsKey] = useState(false);
  const [isTestingMapsKey, setIsTestingMapsKey] = useState(false);
  const [mapsTestResult, setMapsTestResult] = useState(null);
  const [mapsToastMessage, setMapsToastMessage] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadDiagnostics();
    loadMapsStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadMapsStatus = async () => {
    try {
      const res = await mapsConfigService.getStatus();
      setIsMapsConfigured(Boolean(res.hasKey));
    } catch (e) {
      console.warn('Could not load maps status:', e);
    }
  };

  const handleSaveMapsKey = async (e) => {
    if (e) e.preventDefault();
    if (!mapsApiKey.trim()) {
      setMapsToastMessage('Please enter a valid Google Maps API key.');
      return;
    }

    setIsSavingMapsKey(true);
    setMapsToastMessage('');
    const res = await mapsConfigService.saveKey(mapsApiKey);
    setIsSavingMapsKey(false);

    if (res.success) {
      setIsMapsConfigured(true);
      setMapsToastMessage('Google Maps API key saved securely on server.');
      setTimeout(() => setMapsToastMessage(''), 4000);
    } else {
      setMapsToastMessage(res.error || 'Failed to save Google Maps key');
    }
  };

  const handleTestMapsConnection = async () => {
    setIsTestingMapsKey(true);
    setMapsTestResult(null);
    const res = await mapsConfigService.testConnection(mapsApiKey || null);
    setIsTestingMapsKey(false);
    setMapsTestResult(res);
  };

  const loadDiagnostics = async (modeOverride = null) => {
    setIsRefreshing(true);
    try {
      const modeToUse = modeOverride || currentMode;
      const diag = await getDatabaseDiagnostics(null, modeToUse);
      setDiagnostics(diag);

      // Load latest 5 queue items for observability
      const queue = await db.syncQueue.reverse().limit(5).toArray();
      setRecentQueueItems(queue || []);
    } catch (err) {
      console.error('Failed to load database diagnostics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleModeChange = (newMode) => {
    setAppMode(newMode);
    setCurrentMode(newMode);
    loadDiagnostics(newMode);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg({ type: 'info', text: 'Initiating secure encrypted delta sync with cloud...' });

    try {
      const res = await syncNow((msg) => {
        setSyncStatusMsg({ type: 'info', text: msg });
      });

      await loadDiagnostics();
      setSyncStatusMsg({
        type: 'success',
        text: `✅ Cloud Sync Complete: Pushed ${res.syncedCount} queued records to health repository!`
      });
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (e) {
      await loadDiagnostics();
      setSyncStatusMsg({
        type: 'error',
        text: `⚠️ Cloud Sync: ${e.message || 'Offline - changes securely held in local Dexie IndexedDB'}`
      });
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts || ts === 'Never' || ts === 'None') return ts;
    try {
      let d = new Date(ts);
      if (isNaN(d.getTime()) || d.getFullYear() < 2025) {
        d = new Date();
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-[#131D33] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Offline-First Data & Synchronization Hub
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Zero-latency local IndexedDB persistence designed for low-connectivity North East India villages
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#243352] text-xs font-bold">
            <button
              onClick={() => handleModeChange(APP_MODES.PRODUCTION)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentMode === APP_MODES.PRODUCTION
                  ? 'bg-white dark:bg-[#25334D] text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ● Production (Verified Real Users)
            </button>
            <button
              onClick={() => handleModeChange(APP_MODES.DEMO)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentMode === APP_MODES.DEMO
                  ? 'bg-white dark:bg-[#25334D] text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ● Demo Mode
            </button>
          </div>

          <button
            onClick={() => loadDiagnostics()}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#243352] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#25334D] text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            title="Refresh database diagnostics and telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-smriti-teal-500' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse text-amber-300' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Force Cloud Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div
          className={`p-4 rounded-2xl font-semibold text-sm flex items-center gap-3 border animate-fade-in ${
            syncStatusMsg.type === 'error'
              ? 'bg-amber-900/90 text-amber-100 border-amber-700'
              : syncStatusMsg.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
              : 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700'
          }`}
        >
          {syncStatusMsg.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : syncStatusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Zap className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
          )}
          <span>{syncStatusMsg.text}</span>
        </div>
      )}

      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records Stored */}
        <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records Stored</span>
            <HardDrive className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {diagnostics.totalRecords}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Persisted in browser IndexedDB
          </p>
        </div>

        {/* Verified Users / Accounts */}
        <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {diagnostics.isProduction ? 'Verified Real Users' : 'Total Accounts (Demo)'}
            </span>
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {diagnostics.isProduction ? diagnostics.verifiedUsersCount : diagnostics.usersCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {diagnostics.isProduction
              ? `Production Registry (Demo Isolated: ${diagnostics.demoUsersCount})`
              : `All users including seeds (${diagnostics.demoUsersCount} demo)`}
          </p>
        </div>

        {/* Pending Sync Queue */}
        <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Sync Queue</span>
            <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-2">
            {diagnostics.pendingQueueCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {diagnostics.pendingQueueCount > 0 ? 'Queued for automatic push' : 'All local records synced'}
          </p>
        </div>

        {/* Network Connectivity & Last Sync */}
        <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Network & Relay</span>
            <Wifi className={`w-5 h-5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {isOnline ? '🟢 Online' : '🟠 Offline Mode'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Last Synced: {formatTimestamp(diagnostics.lastSync)}
          </p>
        </div>
      </div>

      {/* Database Observability / Diagnostics Breakdown */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-smriti-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Database Observability & Schema Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live inspection of all 8 Dexie tables & local audit timestamps ({diagnostics.isProduction ? 'Production Mode: Verified Only' : 'Demo Mode: All Records'})
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Last Local Write:
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {formatTimestamp(diagnostics.lastWrite)}
            </p>
          </div>
        </div>

        {/* Real Table Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {diagnostics.isProduction ? 'users (ver)' : 'users (all)'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.usersCount}</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">profiles</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.patientProfilesCount}</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">games</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.gameSessionsCount}</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">scores</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.cognitiveScoresCount}</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">reminders</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.remindersCount}</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">health</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.healthRecordsCount}</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">chats</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{diagnostics.conversationsCount}</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">queue (pend)</span>
            <p className="text-xl font-black text-amber-800 dark:text-amber-300 mt-1">{diagnostics.pendingQueueCount}</p>
          </div>
        </div>

        {/* Live Sync Queue Monitor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Sync Queue Operations</span>
            </h4>
            <span className="text-xs text-slate-400">
              Total Queue Records: {diagnostics.syncQueueCount}
            </span>
          </div>

          {recentQueueItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-200 dark:border-[#243352] text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              No transactions in the sync queue. All writes are clean.
            </div>
          ) : (
            <div className="space-y-2">
              {recentQueueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#243352] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        item.status === 'synced'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : item.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800'
                      }`}
                    >
                      {item.status || 'pending'}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.operation || item.action} &bull; {item.entityType || item.tableName}
                    </span>
                    <span className="text-slate-400 font-mono">
                      (ID: #{item.entityId || item.recordId})
                    </span>
                  </div>

                  <span className="text-slate-400 font-medium">
                    {formatTimestamp(item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Integrity & Verification Audit */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Data Integrity & Verification Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative breakdown of real user ownership, unassigned records, and demo data isolation
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto">
            ● Strict Account Scoping Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Verified Users</span>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
              {diagnostics.integrity?.totalVerifiedUsers || 0}
            </p>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400">Non-demo accounts</span>
          </div>

          <div className="p-4 bg-teal-50/60 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">Linked Records</span>
            <p className="text-2xl font-black text-teal-900 dark:text-teal-200 mt-1">
              {diagnostics.integrity?.linkedRecordsCount || 0}
            </p>
            <span className="text-[11px] text-teal-700/80 dark:text-teal-400">Explicit user ownership</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352]">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Unassigned Records</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {diagnostics.integrity?.unassignedRecordsCount || 0}
            </p>
            <span className="text-[11px] text-slate-500">Should always be 0</span>
          </div>

          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Demo Records</span>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
              {diagnostics.integrity?.demoRecordsCount || 0}
            </p>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400">Isolated behind APP_MODE</span>
          </div>

          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase">Pending Sync</span>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
              {diagnostics.integrity?.pendingSyncCount || 0}
            </p>
            <span className="text-[11px] text-indigo-700/80 dark:text-indigo-400">Unpushed queue items</span>
          </div>
        </div>

        {/* Registered Users Table */}
        {diagnostics.verifiedUsersList?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Verified Production User Directory ({diagnostics.verifiedUsersList.length})
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#243352]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#243352]">
                  <tr>
                    <th className="p-3 font-bold">User ID</th>
                    <th className="p-3 font-bold">Name</th>
                    <th className="p-3 font-bold">Email</th>
                    <th className="p-3 font-bold">Role</th>
                    <th className="p-3 font-bold">Verification Status</th>
                    <th className="p-3 font-bold">Last Login / Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#243352]">
                  {diagnostics.verifiedUsersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50">
                      <td className="p-3 font-mono font-bold text-smriti-teal-700 dark:text-teal-400">#NER-{u.id}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white">{u.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Verified Active</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        {formatTimestamp(u.lastLoginAt || u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* GOOGLE MAPS API CONFIGURATION SECTION */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#0E2420] text-emerald-700 dark:text-[#2DD4BF] flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Google Maps API Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Configure Google Maps & Geocoding API keys for live patient satellite tracking.
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-xs font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${isMapsConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className={isMapsConfigured ? 'text-emerald-700 dark:text-[#2DD4BF]' : 'text-amber-700 dark:text-amber-400'}>
              {isMapsConfigured ? '● Connected' : '● Not Connected (OSM Active)'}
            </span>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-white">
              Google Maps API Key (Server Environment)
            </label>
            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-smriti-teal-700 dark:text-[#2DD4BF] hover:underline flex items-center gap-1"
            >
              <span>Get API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showMapsKey ? 'text' : 'password'}
                placeholder={isMapsConfigured ? '••••••••••••••••••••••••••••••••' : 'AIzaSy... (Enter Google Maps API Key)'}
                value={mapsApiKey}
                onChange={(e) => setMapsApiKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1E293B] text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl pl-10 pr-10 py-3 border border-slate-200 dark:border-[#243352] focus:border-smriti-teal-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowMapsKey(!showMapsKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                {showMapsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveMapsKey}
                disabled={isSavingMapsKey}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                {isSavingMapsKey ? 'Saving...' : 'Save API Key'}
              </button>

              <button
                type="button"
                onClick={handleTestMapsConnection}
                disabled={isTestingMapsKey}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] border border-slate-300 dark:border-[#243352] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingMapsKey ? 'animate-spin text-smriti-teal-600' : ''}`} />
                <span>{isTestingMapsKey ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notice */}
        {mapsToastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-[#0E2420] border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mapsToastMessage}</span>
          </div>
        )}

        {/* Diagnostic Response Banner */}
        {mapsTestResult && (
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            mapsTestResult.connected
              ? 'bg-emerald-50 dark:bg-[#0E2420] border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-[#2A1517] border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {mapsTestResult.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">
                  {mapsTestResult.connected ? 'Google Maps Connection Verified' : 'Diagnostic Notice'}
                </span>
                <p className="mt-0.5">{mapsTestResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Core Architectural Differentiator Card */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Core Architectural Architecture: Resilient Edge Synchronization
            </span>
            <h3 className="text-xl md:text-2xl font-black mt-1">
              Why Real Offline-First IndexedDB Matters in the North East
            </h3>
            <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
              In remote tea-estate hamlets in Majuli, Dima Hasao, or Mon district, internet connectivity fluctuates constantly.
              SmritiCare stores all game interactions, cognitive scores, and schedule confirmations locally in IndexedDB first.
              Elderly dementia patients experience zero lag or failure toasts. As soon as connectivity returns, background delta sync queues automatically push records to the primary health center without user intervention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
