import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { Terminal, X, RefreshCw, UserCheck, Shield, Users, LogOut, ChevronUp } from 'lucide-react';

export default function AuthDebugPanel() {
  // Only activate in local development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const { currentUser, role, isAuthenticated, loginDemo, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState({ users: 0, sessions: 0, syncQueue: 0 });
  const [adaptiveData, setAdaptiveData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCounts = async () => {
    setIsRefreshing(true);
    try {
      const [uCount, sCount, qCount, adProfile] = await Promise.all([
        db.users.count(),
        db.sessions.count(),
        db.syncQueue.count(),
        (currentUser?.id && db.adaptiveProfiles) ? db.adaptiveProfiles.get(currentUser.id) : null
      ]);
      setCounts({ users: uCount, sessions: sCount, syncQueue: qCount });
      setAdaptiveData(adProfile);
    } catch (err) {
      console.warn('HUD count warning:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, [currentUser, isOpen]);

  // Determine avatar representation
  let avatarType = 'None (Initials Fallback)';
  if (currentUser?.profileImage) {
    avatarType = `Custom Base64 (${Math.round((currentUser.profileImage.length * 3) / 4 / 1024)} KB)`;
  } else if (currentUser?.avatar) {
    avatarType = currentUser.avatar.includes('unsplash') ? 'Demo Seed Photo' : 'Remote Photo';
  }

  return (
    <aside aria-label="Developer Authentication HUD" className="fixed bottom-4 left-4 z-50 font-mono text-xs select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-950 text-slate-200 border border-slate-700 shadow-xl backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Open Dev Authentication HUD"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold">Auth HUD</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </button>
      ) : (
        <div className="w-80 bg-slate-900/95 text-slate-200 border border-slate-700 rounded-2xl shadow-2xl p-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-white">Auth & Session HUD</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadCounts}
                disabled={isRefreshing}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Refresh database counts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close HUD"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Telemetry rows */}
          <div className="space-y-1.5 text-[11px] pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auth Status:</span>
              <span className={`font-bold ${isAuthenticated ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isAuthenticated ? '🟢 Authenticated' : '⚪ Guest'}
              </span>
            </div>

            {currentUser && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">User ID:</span>
                  <span className="font-bold text-white">#{currentUser.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-bold text-white truncate max-w-[150px]">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role:</span>
                  <span className="font-bold text-teal-300 uppercase">{currentUser.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-bold text-slate-300 truncate max-w-[150px]">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Avatar:</span>
                  <span className="font-bold text-sky-300 truncate max-w-[150px]">{avatarType}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">IndexedDB:</span>
              <span className="text-slate-300">
                {counts.users} users &bull; {counts.sessions} sessions
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">SyncQueue:</span>
              <span className="text-amber-300 font-bold">{counts.syncQueue} pending</span>
            </div>

            {/* Adaptive Engine Diagnostics */}
            <div className="pt-2 mt-2 border-t border-slate-800 space-y-1">
              <span className="block text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                Cognitive Engine (Offline)
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Generator:</span>
                <span className="text-emerald-400 font-bold">OFFLINE_PROCEDURAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Continuous Diff:</span>
                <span className="text-white font-bold">{adaptiveData?.overallDifficulty || 0.50}</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Switcher Actions */}
          <div className="pt-3 space-y-1.5">
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Quick Switch (Demo Roles)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => loginDemo('patient')}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold text-left transition-colors cursor-pointer"
              >
                👵 Patient
              </button>
              <button
                onClick={() => loginDemo('caregiver')}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold text-left transition-colors cursor-pointer"
              >
                👩 Caregiver
              </button>
              <button
                onClick={() => loginDemo('healthcare')}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold text-left transition-colors cursor-pointer"
              >
                🩺 Healthcare
              </button>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-[10px] font-bold text-left transition-colors cursor-pointer border border-rose-800/40"
                >
                  🚪 Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
