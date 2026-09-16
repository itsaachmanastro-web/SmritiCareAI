import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Activity,
  Brain,
  Calendar,
  AlertTriangle,
  Plus,
  FileText,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Stethoscope,
  Search,
  Filter,
  ShieldAlert,
  Trash2,
  UserCheck,
  Building2,
  HeartHandshake,
  Coins
} from 'lucide-react';
import MetricCard from '../../components/caregiver/MetricCard';
import CognitiveChart from '../../components/caregiver/CognitiveChart';
import AlertList from '../../components/caregiver/AlertList';
import ActivityLogTable from '../../components/caregiver/ActivityLogTable';
import ReminderManagerModal from '../../components/caregiver/ReminderManagerModal';
import AddPatientModal from '../../components/caregiver/AddPatientModal';
import DeleteUserModal from '../../components/common/DeleteUserModal';
import WeeklyReportView from '../caregiver/WeeklyReportView';
import SyncSettingsView from '../caregiver/SyncSettingsView';
import UserAvatar from '../../components/common/UserAvatar';
import { db } from '../../db/dexie';
import { deleteUser } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAssistant } from '../../context/AssistantContext';
import { scoreToDiscreteLevel } from '../../services/games';

/**
 * ClinicianDashboard
 * Dedicated professional multi-patient management and clinical monitoring console
 * for PHC Medical Officers, Healthcare Clinicians, and Clinical Workers.
 */
export default function ClinicianDashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { openAssistant } = useAssistant();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'reports', 'directory', 'sync'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'needsReview', 'archived'

  // Query all users and patient profiles from Dexie
  const allUsers = useLiveQuery(() => db.users.toArray(), []) || [];
  const allPatientProfiles = useLiveQuery(() => db.patientProfiles.toArray(), []) || [];

  const profileMap = new Map();
  allPatientProfiles.forEach(p => profileMap.set(p.userId, p));

  // Enriched patient list
  const patientsList = allUsers
    .filter(u => u.role === 'patient')
    .map(p => {
      const prof = profileMap.get(p.id) || {};
      return {
        ...p,
        profileId: prof.id,
        age: p.age || prof.age || 72,
        location: p.location || prof.location || 'Assam, India',
        phcCenter: prof.phcCenter || 'Titabar PHC, Jorhat',
        primaryCaregiver: prof.primaryCaregiver || 'Family Caregiver'
      };
    });

  // Selected Patient State
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    const saved = localStorage.getItem('smriti_selected_clinician_patient_id');
    return saved ? Number(saved) : (currentUser?.linkedPatientId || null);
  });

  // Active non-archived patients for clinical dossier
  const activePatients = patientsList.filter(p => p.status !== 'archived');

  // Synchronize selected patient
  useEffect(() => {
    if (activePatients.length > 0) {
      if (!selectedPatientId || !activePatients.some(p => p.id === selectedPatientId)) {
        const firstId = activePatients[0].id;
        setSelectedPatientId(firstId);
        localStorage.setItem('smriti_selected_clinician_patient_id', String(firstId));
      }
    } else {
      setSelectedPatientId(null);
    }
  }, [activePatients, selectedPatientId]);

  const handleSelectPatient = (id) => {
    setSelectedPatientId(Number(id));
    localStorage.setItem('smriti_selected_clinician_patient_id', String(id));
  };

  const activePatient = activePatients.find(p => p.id === selectedPatientId) || (activePatients.length > 0 ? activePatients[0] : null);

  // Modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Demo toggle for selected patient
  const [includeDemoData, setIncludeDemoData] = useState(() => Boolean(activePatient?.isDemo));
  useEffect(() => {
    if (activePatient) {
      setIncludeDemoData(Boolean(activePatient.isDemo));
    }
  }, [activePatient?.isDemo, selectedPatientId]);

  // Selected patient rawScores & gameSessions queries
  const rawScores = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      try {
        const idNum = Number(selectedPatientId);
        const scores = await db.cognitiveScores.toArray();
        return scores.filter(s => {
          const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
          if (sPid !== idNum) return false;
          return includeDemoData || !s.isDemo;
        });
      } catch (err) {
        console.warn('Clinician rawScores query error:', err);
        return [];
      }
    },
    [selectedPatientId, includeDemoData]
  );
  const cognitiveScores = rawScores || [];

  const rawSessions = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      try {
        const idNum = Number(selectedPatientId);
        const sessions = await db.gameSessions.toArray();
        let list = sessions.filter(s => {
          const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
          if (sPid !== idNum) return false;
          return includeDemoData || !s.isDemo;
        });

        // ActivityRecords check
        if (db.activityRecords) {
          try {
            const activities = await db.activityRecords.toArray();
            const gameActivities = activities.filter(a => {
              const aPid = Number(a.patientId ?? a.patient_id ?? a.userId ?? a.user_id);
              if (aPid !== idNum) return false;
              if (a.activityType !== 'game' && !a.gameType) return false;
              return includeDemoData || !a.isDemo;
            });
            for (const act of gameActivities) {
              const actTime = act.timestamp || act.createdAt || act.date;
              const exists = list.some(s => {
                const sTime = s.completedAt || s.createdAt || s.timestamp;
                return sTime && actTime && Math.abs(new Date(sTime) - new Date(actTime)) < 3000;
              });
              if (!exists) {
                list.push({
                  id: act.id,
                  userId: act.userId,
                  patientId: act.patientId || act.userId,
                  isDemo: act.isDemo,
                  gameName: act.activityName,
                  gameType: act.gameType || act.domain,
                  domain: act.domain || act.gameType,
                  score: act.score,
                  accuracy: act.accuracy,
                  difficultyLevel: act.difficulty,
                  durationSeconds: act.durationSeconds,
                  completedAt: act.timestamp || act.createdAt,
                  createdAt: act.createdAt || act.timestamp,
                  mistakeCount: act.mistakes
                });
              }
            }
          } catch (actErr) {
            console.warn('Clinician activityRecords query notice:', actErr);
          }
        }

        return list.sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0));
      } catch (err) {
        console.warn('Clinician rawSessions query error:', err);
        return [];
      }
    },
    [selectedPatientId, includeDemoData]
  );
  const gameSessions = rawSessions || [];

  const rawReminders = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      const all = await db.reminders.toArray();
      return all.filter(r => {
        const matchesUser = Number(r.targetUserId) === Number(selectedPatientId) ||
                            Number(r.userId) === Number(selectedPatientId) ||
                            Number(r.patientId) === Number(selectedPatientId);
        if (!matchesUser) return false;
        return includeDemoData || !r.isDemo;
      });
    },
    [selectedPatientId, includeDemoData]
  );
  const reminders = rawReminders || [];

  const adaptiveProfile = useLiveQuery(
    () => (selectedPatientId && db.adaptiveProfiles) ? db.adaptiveProfiles.where('userId').equals(selectedPatientId).first() : null,
    [selectedPatientId]
  );

  // High-level patient stats (real data only)
  const totalGames = gameSessions.length;
  const avgScore = (cognitiveScores.length > 0 || gameSessions.length > 0)
    ? Math.round(
        cognitiveScores.length > 0
          ? cognitiveScores.reduce((a, b) => a + b.score, 0) / cognitiveScores.length
          : gameSessions.reduce((a, b) => a + b.score, 0) / gameSessions.length
      )
    : null;

  const totalReminders = reminders.length;
  const completedReminders = reminders.filter(r => r.done || r.completed).length;
  const adherenceRate = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : null;

  // Cohort Stats
  const cohortTotal = activePatients.length;
  const cohortAttentionAlerts = activePatients.filter(p => p.id === 1).length; // Simulated / calculated alert flagged patients
  const cohortActivePlayers = activePatients.filter(p => p.lastLoginAt || p.isDemo).length;

  // Filtered Cohort for Directory Search
  const filteredCohort = patientsList.filter(p => {
    if (statusFilter === 'active' && p.status === 'archived') return false;
    if (statusFilter === 'archived' && p.status !== 'archived') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = p.name && p.name.toLowerCase().includes(q);
      const matchId = String(p.id).includes(q) || (`ner-${p.id}`).includes(q);
      const matchLoc = p.location && p.location.toLowerCase().includes(q);
      const matchCg = p.primaryCaregiver && p.primaryCaregiver.toLowerCase().includes(q);
      return matchName || matchId || matchLoc || matchCg;
    }
    return true;
  });

  // Safe Delete User Handler
  const handleConfirmDelete = async (targetUser) => {
    const res = await deleteUser(targetUser.id, currentUser, { softDelete: true });
    if (res.success) {
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(''), 4500);
      if (selectedPatientId === targetUser.id) {
        const remaining = activePatients.filter(p => p.id !== targetUser.id);
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        setSelectedPatientId(nextId);
        if (nextId) localStorage.setItem('smriti_selected_clinician_patient_id', String(nextId));
        else localStorage.removeItem('smriti_selected_clinician_patient_id');
      }
    } else {
      throw new Error(res.error || 'Failed to archive user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Top Banner: Clinician Identity & Navigation */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-smriti-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-2xl shadow-xs">
            👨‍⚕️
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-300 dark:border-teal-800">
                PHC Clinical Console
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentUser?.designation || 'PHC Medical Officer, Titabar'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {currentUser?.name || 'Dr. Arun Phukan'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Titabar Public Health Center &bull; Longitudinal Patient Management & Cognitive Screening
            </p>
          </div>
        </div>

        {/* Console Action Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200 dark:border-[#243352] self-stretch lg:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Clinical Dossier
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Clinical Reports
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Manage Patients & Users
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sync & Telemetry
          </button>
          <button
            onClick={() => openAssistant({ patientId: selectedPatientId, patientName: activePatient?.name })}
            className="flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-smriti-teal-600 to-teal-800 hover:from-smriti-teal-700 hover:to-teal-900 transition-all shadow-sm inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Clinical Summary</span>
          </button>
        </div>
      </div>

      {/* Global Success / Action Notification */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: CLINICAL OVERVIEW & COHORT MANAGEMENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cohort KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#131D33] p-5 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  PHC Registered Cohort
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {cohortTotal} Patients
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Titabar jurisdiction
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131D33] p-5 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Attention Review Flags
                </span>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {cohortAttentionAlerts} Flagged
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  Requires clinical assessment
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131D33] p-5 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active Cognitive Monitoring
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {cohortActivePlayers} Active
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Regular game participation
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131D33] p-5 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Assigned Facility
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Titabar PHC
                </h3>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  Jorhat District, Assam
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Cohort Selector Roster */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-smriti-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Patient Cohort Selector
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch between patient clinical profiles with strict data isolation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddPatientModal(true)}
                className="text-xs font-bold bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Patient</span>
              </button>
            </div>

            {/* Quick Cohort Cards Carousel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activePatients.map(p => {
                const isSelected = p.id === selectedPatientId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/90 dark:bg-teal-950/60 border-smriti-teal-500 ring-2 ring-smriti-teal-400/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#1E293B]/70 border-slate-200 dark:border-[#243352] hover:border-slate-300 dark:hover:border-[#2E4166]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {p.name}
                          </h4>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          ID #{p.id} &bull; Age {p.age}
                        </p>
                        <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold truncate">
                          CG: {p.primaryCaregiver}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Patient Clinical Dossier Header */}
          {activePatient ? (
            <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-[#243352] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
              <div className="flex items-start sm:items-center gap-4">
                <img
                  src={activePatient.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'}
                  alt={activePatient.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-smriti-teal-500 shadow-sm"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                      Viewing Clinical Dossier: {activePatient.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      ID #{activePatient.id} &bull; Age {activePatient.age} &bull; {activePatient.location}
                    </span>
                    {activePatient.isDemo ? (
                      <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        Demo Simulation Profile
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        Verified Clinical Patient
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {activePatient.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Primary Family Caregiver: <strong>{activePatient.primaryCaregiver}</strong> &bull; PHC Facility: <strong>{activePatient.phcCenter}</strong>
                  </p>
                </div>
              </div>

              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIncludeDemoData(prev => !prev)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 ${
                    includeDemoData
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-[#243352]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${includeDemoData ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>Demo Mode: {includeDemoData ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-amber-50 dark:bg-amber-950/40 rounded-3xl border border-amber-200 dark:border-amber-800 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 dark:text-white">No active patients registered in this PHC cohort</h3>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="mt-3 px-4 py-2 bg-smriti-teal-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Register Patient</span>
              </button>
            </div>
          )}

          {/* Key Clinical Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Cognitive Vitality Index (CVI)"
              value={avgScore !== null ? `${avgScore}%` : '--'}
              subtitle={avgScore !== null ? "Composite across 4 neuro-cognitive domains" : "No games recorded yet"}
              trend={avgScore !== null ? "up" : "neutral"}
              trendLabel={avgScore !== null ? "+3% vs PHC baseline" : "Awaiting baseline"}
              icon={Brain}
              color="teal"
            />
            <MetricCard
              title="Care Plan Protocol Adherence"
              value={adherenceRate !== null ? `${adherenceRate}%` : '--'}
              subtitle={totalReminders > 0 ? `${completedReminders} of ${totalReminders} daily routines completed` : "No routines scheduled"}
              trend="neutral"
              trendLabel={adherenceRate !== null ? "Consistent Routine" : "No schedule"}
              icon={CheckCircle2}
              color="orange"
            />
            <MetricCard
              title="Longitudinal Sessions"
              value={totalGames}
              subtitle={totalGames > 0 ? "Bihu, Mekhela & Routine sessions" : "No game sessions"}
              trend={totalGames > 0 ? "up" : "neutral"}
              trendLabel={totalGames > 0 ? "Regular participant" : "Awaiting play"}
              icon={Activity}
              color="blue"
            />
            <MetricCard
              title="Early Screening Status"
              value={totalGames >= 3 ? "Mild Alert" : "--"}
              subtitle={totalGames >= 3 ? "Attention dip detected (last 5d)" : "Requires 3+ sessions"}
              trend={totalGames >= 3 ? "down" : "neutral"}
              trendLabel={totalGames >= 3 ? "Attention: -14%" : "Calibrating"}
              icon={AlertTriangle}
              color="purple"
            />
          </div>

          {/* Chart & Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CognitiveChart
                patientId={selectedPatientId}
                patientName={activePatient?.name}
                sessions={gameSessions}
                rawScores={cognitiveScores}
                isLoading={rawSessions === undefined && rawScores === undefined}
              />
            </div>
            <div className="lg:col-span-1">
              <AlertList
                scores={cognitiveScores}
                reminders={reminders}
                patientName={activePatient?.name}
              />
            </div>
          </div>

          {/* Adaptive Cognitive Training Telemetry Panel */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-smriti-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Adaptive Cognitive Difficulty Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time difficulty progression calibrated across clinical domains
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Calibrated Level:</span>
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-smriti-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {scoreToDiscreteLevel(adaptiveProfile?.overallDifficulty || 0.5)} ({(Number(adaptiveProfile?.overallDifficulty || 0.5) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {[
                { domain: 'Memory & Recall', key: 'memoryMatch', color: 'bg-emerald-500' },
                { domain: 'Pattern & Visual', key: 'patternRecognition', color: 'bg-amber-500' },
                { domain: 'Routine & Executive', key: 'sequenceMemory', color: 'bg-teal-500' },
                { domain: 'Auditory Attention', key: 'auditoryAttention', color: 'bg-orange-500' }
              ].map((item) => {
                const val = Number(adaptiveProfile?.[item.key] || 0.5);
                const discrete = scoreToDiscreteLevel(val);
                return (
                  <div key={item.key} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#243352]">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-200">{item.domain}</span>
                      <span className="uppercase text-slate-500 dark:text-slate-400 font-extrabold">{discrete}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${Math.round(val * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                      <span>Gentle</span>
                      <span>{(val * 100).toFixed(0)}%</span>
                      <span>Advanced</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log Table */}
          <ActivityLogTable sessions={gameSessions} />
        </div>
      )}

      {/* TAB 2: CLINICAL REPORT */}
      {activeTab === 'reports' && (
        <WeeklyReportView
          patient={activePatient}
          scores={cognitiveScores}
          sessions={gameSessions}
          reminders={reminders}
        />
      )}

      {/* TAB 3: MANAGE PATIENTS & USERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243352]">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  PHC User & Patient Registry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage patient enrollments, caregiver linkages, and safe archival controls
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddPatientModal(true)}
                  className="text-xs font-bold bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Patient</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID (#NER-1), location, or caregiver..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-slate-50 dark:bg-[#162238] text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-smriti-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'active', label: 'Active Only' },
                  { id: 'archived', label: 'Archived' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      statusFilter === tab.id
                        ? 'bg-smriti-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#25334D]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patients & Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#243352] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3 px-3">User / Patient</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">Location & Center</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {allUsers
                    .filter(u => {
                      if (statusFilter === 'active' && u.status === 'archived') return false;
                      if (statusFilter === 'archived' && u.status !== 'archived') return false;
                      if (searchQuery.trim()) {
                        const q = searchQuery.trim().toLowerCase();
                        return (u.name && u.name.toLowerCase().includes(q)) ||
                               String(u.id).includes(q) ||
                               (u.role && u.role.toLowerCase().includes(q)) ||
                               (u.email && u.email.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .map(u => {
                      const isArchived = u.status === 'archived';
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#1A263F]/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={u} size="sm" />
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">
                                  {u.name}
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                  #NER-{u.id} &bull; {u.email || (u.role === 'patient' ? 'Elderly PIN User' : 'Standard Auth')}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="capitalize font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300">
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {u.location || 'Assam, India'}
                          </td>

                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isArchived
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                : (u.isDemo
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300')
                            }`}>
                              {isArchived ? 'Archived' : (u.isDemo ? 'Demo' : 'Active')}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              {u.role === 'patient' && !isArchived && (
                                <button
                                  onClick={() => {
                                    handleSelectPatient(u.id);
                                    setActiveTab('overview');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-smriti-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 font-bold"
                                >
                                  View Dossier
                                </button>
                              )}

                              {!isSelf && (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="px-2 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-bold inline-flex items-center gap-1 transition-colors"
                                  title="Archive or delete user account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{isArchived ? 'Delete' : 'Archive'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYNC SETTINGS */}
      {activeTab === 'sync' && <SyncSettingsView />}

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onPatientCreated={(newId) => {
          setSelectedPatientId(newId);
          setActionNotice(`Patient #${newId} was registered into Titabar PHC cohort.`);
          setTimeout(() => setActionNotice(''), 4500);
        }}
      />

      {/* Safe Delete User Modal */}
      <DeleteUserModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        user={userToDelete}
        currentUser={currentUser}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
