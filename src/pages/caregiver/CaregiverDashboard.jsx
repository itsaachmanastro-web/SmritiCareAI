import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Phone,
  HeartHandshake,
  Coins,
  Brain,
  Gamepad2,
  Bell,
  Activity,
  UserPlus,
  Stethoscope,
  Smile,
  ShieldCheck
} from 'lucide-react';
import MetricCard from '../../components/caregiver/MetricCard';
import ReminderManagerModal from '../../components/caregiver/ReminderManagerModal';
import AddPatientModal from '../../components/caregiver/AddPatientModal';
import WeeklyReportView from './WeeklyReportView';
import SyncSettingsView from './SyncSettingsView';
import UserAvatar from '../../components/common/UserAvatar';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAssistant } from '../../context/AssistantContext';

/**
 * CaregiverDashboard
 * Warm, empathetic, day-to-day care monitoring console designed exclusively for
 * family caregivers. Strictly scoped to assigned loved ones with zero clinical clutter.
 */
export default function CaregiverDashboard() {
  const { currentUser } = useAuth();
  const { t, formatDate } = useLanguage();
  const { openAssistant } = useAssistant();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dailyCare'); // 'dailyCare', 'weeklySummary', 'sync'

  // Query all users from Dexie
  const allUsers = useLiveQuery(() => db.users.toArray(), []) || [];
  const allProfiles = useLiveQuery(() => db.patientProfiles.toArray(), []) || [];

  const profileMap = new Map();
  allProfiles.forEach(p => profileMap.set(p.userId, p));

  // Caregiver Patient Isolation: STRICTLY scoped to assigned patient(s)
  const caregiverId = currentUser?.id ? Number(currentUser.id) : null;
  const linkedPatientId = currentUser?.linkedPatientId ? Number(currentUser.linkedPatientId) : null;

  const assignedPatients = allUsers
    .filter(u => u.role === 'patient' && u.status !== 'archived')
    .filter(p => {
      if (linkedPatientId && p.id === linkedPatientId) return true;
      if (p.createdByCaregiverId && Number(p.createdByCaregiverId) === caregiverId) return true;
      return false;
    })
    .map(p => {
      const prof = profileMap.get(p.id) || {};
      return {
        ...p,
        age: p.age || prof.age || 74,
        location: p.location || prof.location || 'Assam, India',
        relation: prof.relation || currentUser?.relation || 'Loved One',
        phcCenter: prof.phcCenter || 'Titabar PHC, Jorhat'
      };
    });

  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    const saved = localStorage.getItem('smriti_selected_caregiver_patient_id');
    return saved ? Number(saved) : (linkedPatientId || null);
  });

  // Sync selected patient
  useEffect(() => {
    if (assignedPatients.length > 0) {
      if (!selectedPatientId || !assignedPatients.some(p => p.id === selectedPatientId)) {
        const target = (linkedPatientId && assignedPatients.find(p => p.id === linkedPatientId)) || assignedPatients[0];
        setSelectedPatientId(target.id);
        localStorage.setItem('smriti_selected_caregiver_patient_id', String(target.id));
      }
    } else {
      setSelectedPatientId(null);
    }
  }, [assignedPatients, linkedPatientId, selectedPatientId]);

  const activePatient = assignedPatients.find(p => p.id === selectedPatientId) || (assignedPatients.length > 0 ? assignedPatients[0] : null);

  // Modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [notice, setNotice] = useState('');

  // Selected patient's real game sessions
  const rawSessions = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      try {
        const idNum = Number(selectedPatientId);
        const sessions = await db.gameSessions.toArray();
        let list = sessions.filter(s => {
          const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
          return sPid === idNum;
        });

        // Also check activityRecords
        if (db.activityRecords) {
          try {
            const activities = await db.activityRecords.toArray();
            const gameActs = activities.filter(a => {
              const aPid = Number(a.patientId ?? a.patient_id ?? a.userId ?? a.user_id);
              return aPid === idNum && (a.activityType === 'game' || a.gameType);
            });
            for (const act of gameActs) {
              const actTime = act.timestamp || act.createdAt || act.date;
              const exists = list.some(s => {
                const sTime = s.completedAt || s.createdAt || s.timestamp;
                return sTime && actTime && Math.abs(new Date(sTime) - new Date(actTime)) < 3000;
              });
              if (!exists) {
                list.push({
                  id: act.id,
                  gameName: act.activityName,
                  score: act.score,
                  accuracy: act.accuracy,
                  difficultyLevel: act.difficulty,
                  completedAt: act.timestamp || act.createdAt,
                  createdAt: act.createdAt || act.timestamp
                });
              }
            }
          } catch (e) {
            console.warn('Caregiver activity query notice:', e);
          }
        }

        return list.sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0));
      } catch (err) {
        console.warn('Caregiver sessions query warning:', err);
        return [];
      }
    },
    [selectedPatientId]
  );
  const gameSessions = rawSessions || [];

  // Selected patient's real reminders
  const rawReminders = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      const all = await db.reminders.toArray();
      return all.filter(r => {
        return Number(r.targetUserId) === Number(selectedPatientId) ||
               Number(r.userId) === Number(selectedPatientId) ||
               Number(r.patientId) === Number(selectedPatientId);
      });
    },
    [selectedPatientId]
  );
  const reminders = rawReminders || [];

  // Selected patient's cognitive scores
  const rawScores = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      const scores = await db.cognitiveScores.toArray();
      return scores.filter(s => {
        const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
        return sPid === Number(selectedPatientId);
      });
    },
    [selectedPatientId]
  );
  const cognitiveScores = rawScores || [];

  // Metrics
  const totalReminders = reminders.length;
  const completedReminders = reminders.filter(r => r.done || r.completed).length;
  const routinePct = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : null;

  const totalGames = gameSessions.length;
  const avgScore = (cognitiveScores.length > 0 || gameSessions.length > 0)
    ? Math.round(
        cognitiveScores.length > 0
          ? cognitiveScores.reduce((a, b) => a + b.score, 0) / cognitiveScores.length
          : gameSessions.reduce((a, b) => a + b.score, 0) / gameSessions.length
      )
    : null;

  // Toggle Reminder completion
  const handleToggleReminder = async (reminder) => {
    try {
      const nextDone = !(reminder.done || reminder.completed);
      await db.reminders.update(reminder.id, {
        done: nextDone,
        completed: nextDone,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Top Header Card: Assigned Loved One & Caregiver Welcome */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors">
        {activePatient ? (
          <div className="flex items-center gap-4">
            <img
              src={activePatient.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'}
              alt={activePatient.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-400 shadow-sm"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/70 px-2.5 py-0.5 rounded-full border border-orange-300 dark:border-orange-800">
                  Caring For {activePatient.name}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {activePatient.relation} &bull; Age {activePatient.age}
                </span>
                {assignedPatients.length > 1 && (
                  <select
                    value={selectedPatientId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedPatientId(id);
                      localStorage.setItem('smriti_selected_caregiver_patient_id', String(id));
                    }}
                    className="text-xs font-bold bg-slate-100 dark:bg-[#1E293B] border border-slate-300 dark:border-[#243352] text-slate-800 dark:text-slate-200 rounded-lg px-2 py-0.5"
                  >
                    {assignedPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.relation})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {activePatient.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {activePatient.location} &bull; Primary Health Center: {activePatient.phcCenter}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-2xl">
              👵
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Welcome, {currentUser?.name || 'Caregiver'}!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You haven't linked a loved one yet. Add your elder to begin daily care monitoring.
              </p>
            </div>
            <button
              onClick={() => setShowAddPatientModal(true)}
              className="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-smriti-teal-600 text-white inline-flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Loved One</span>
            </button>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200 dark:border-[#243352] self-stretch lg:self-auto">
          <button
            onClick={() => setActiveTab('dailyCare')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dailyCare'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Care & Routine
          </button>
          <button
            onClick={() => setActiveTab('weeklySummary')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'weeklySummary'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weekly Summary
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Data & Sync
          </button>
          <button
            onClick={() => navigate('/community')}
            className="flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 transition-all border border-orange-200 dark:border-orange-800 inline-flex items-center gap-1"
          >
            <HeartHandshake className="w-4 h-4 text-orange-500" />
            <span>Community</span>
          </button>
          <button
            onClick={() => openAssistant({ patientId: selectedPatientId, patientName: activePatient?.name })}
            className="flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-smriti-teal-600 to-teal-800 hover:from-smriti-teal-700 hover:to-teal-900 transition-all shadow-sm inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ask Smriti AI</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* TAB 1: DAILY CARE & ROUTINE (Caregiver View) */}
      {activeTab === 'dailyCare' && activePatient && (
        <div className="space-y-6">
          {/* Key Caregiver Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Today's Care Routine"
              value={routinePct !== null ? `${routinePct}%` : '--'}
              subtitle={totalReminders > 0 ? `${completedReminders} of ${totalReminders} daily routines confirmed` : "No routines scheduled"}
              trend="up"
              trendLabel={routinePct === 100 ? "All tasks completed! 🎉" : "Routine on track"}
              icon={CheckCircle2}
              color="teal"
            />
            <MetricCard
              title="Cognitive Games"
              value={totalGames}
              subtitle={totalGames > 0 ? "Cultural memory & pattern activities" : "No games played yet"}
              trend={totalGames > 0 ? "up" : "neutral"}
              trendLabel={totalGames > 0 ? "Active participant ✨" : "Play a game today"}
              icon={Gamepad2}
              color="orange"
            />
            <MetricCard
              title="Cognitive Wellbeing"
              value={avgScore !== null ? `${avgScore}%` : '--'}
              subtitle={avgScore !== null ? "Consistent engagement across activities" : "Awaiting first game"}
              trend={avgScore !== null ? "up" : "neutral"}
              trendLabel={avgScore !== null ? "Healthy & Engaged" : "Pending play"}
              icon={Brain}
              color="blue"
            />
            <MetricCard
              title="Caregiver Peace of Mind"
              value="All Good"
              subtitle="Daily reminders and wellness active"
              trend="neutral"
              trendLabel="Calm & steady"
              icon={Heart}
              color="purple"
            />
          </div>

          {/* 2-Column Layout: Daily Routine & Reminders (Left) + Activities & Notes (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Today's Routine Schedule */}
            <div className="lg:col-span-2 bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Today's Routine & Medication Schedule
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tap a routine to confirm completion or add new care reminders
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReminderModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Schedule</span>
                </button>
              </div>

              {reminders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No routine reminders scheduled for {activePatient.name}. Tap "Manage Schedule" to add morning meds or tea reminders.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reminders.map(r => {
                    const isDone = Boolean(r.done || r.completed);
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleToggleReminder(r)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          isDone
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#1E293B] border-slate-200 dark:border-[#243352] hover:border-slate-300 dark:hover:border-[#2E4166]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-smriti-teal-600 dark:text-teal-400" />
                            <span>{r.time || 'Daily'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isDone
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                          }`}>
                            {isDone ? 'Completed ✓' : 'Pending'}
                          </span>
                        </div>
                        <h4 className={`font-bold text-sm mt-2 line-clamp-2 ${isDone ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {r.label || r.title || 'Daily Routine'}
                        </h4>
                        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>{r.type ? `Type: ${r.type}` : 'Daily care'}</span>
                          <span className="font-bold text-smriti-teal-700 dark:text-teal-400">
                            {isDone ? 'Tap to reopen' : 'Tap to mark done'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 1 Col: PHC Doctor Contact & Care Notes */}
            <div className="space-y-6">
              {/* PHC Clinician Card */}
              <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 border border-slate-200 dark:border-[#243352] shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#243352]">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Assigned PHC Clinician
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Supervising Health Center
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-100 flex items-center justify-center font-bold text-base">
                    👨‍⚕️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      Dr. Arun Phukan
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      PHC Medical Officer, Titabar
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dr. Phukan regularly monitors {activePatient.name}'s cognitive game participation and care plan adherence through the PHC Tele-Cognitive Network.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => openAssistant({ patientId: selectedPatientId, patientName: activePatient.name })}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-teal-100 hover:bg-teal-200 dark:bg-teal-950 dark:hover:bg-teal-900 text-smriti-teal-800 dark:text-teal-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About Doctor Review</span>
                  </button>
                </div>
              </div>

              {/* Gentle Peace of Mind Caregiver Notes */}
              <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 border border-slate-200 dark:border-[#243352] shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#243352]">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Caregiver Tips & Encouragement
                  </h4>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold">
                    🌸 Gentle Morning Engagement:
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Elders respond well when memory games are played right after morning tea or breakfast. Celebrate small wins with encouraging words!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Games Played by Loved One */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Recent Cognitive Activities Played
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cultural memory, pattern recognition and daily routine games
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/patient/games')}
                className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
              >
                <span>Browse Games</span>
              </button>
            </div>

            {gameSessions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent games recorded for {activePatient.name}. Invite them to play Bihu Memory Game or Sounds of Hills!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gameSessions.slice(0, 6).map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#243352] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {s.gameName || 'Memory Game'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {s.score}% Score
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>{s.completedAt ? formatDate(s.completedAt) : 'Recently'}</span>
                      <span className="capitalize font-semibold text-slate-600 dark:text-slate-300">
                        {s.difficultyLevel || 'Medium'} Level
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY SUMMARY */}
      {activeTab === 'weeklySummary' && (
        <WeeklyReportView
          patient={activePatient}
          scores={cognitiveScores}
          sessions={gameSessions}
          reminders={reminders}
        />
      )}

      {/* TAB 3: DATA & SYNC */}
      {activeTab === 'sync' && <SyncSettingsView />}

      {/* Reminder Manager Modal */}
      <ReminderManagerModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        reminders={reminders}
        patientId={selectedPatientId}
        patientName={activePatient?.name}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onPatientCreated={(newId) => {
          setSelectedPatientId(newId);
          setNotice(`Patient profile created and linked to your family care account.`);
          setTimeout(() => setNotice(''), 4500);
        }}
      />
    </div>
  );
}
