import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowRight,
  ChevronDown,
  Leaf,
  ExternalLink,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Check,
  ClipboardCheck,
  Heart,
  CalendarClock,
  Settings as SettingsIcon,
  UserPlus,
  Home,
  CalendarCheck,
  BookOpen,
  Info
} from 'lucide-react';
import ClinicianSidebar from '../../components/clinician/ClinicianSidebar';
import ReminderManagerModal from '../../components/caregiver/ReminderManagerModal';
import AddPatientModal from '../../components/caregiver/AddPatientModal';
import AddClinicianModal from '../../components/clinician/AddClinicianModal';
import DeleteUserModal from '../../components/common/DeleteUserModal';
import WeeklyReportView from '../caregiver/WeeklyReportView';
import SyncSettingsView from '../caregiver/SyncSettingsView';
import UserMenu from '../../components/common/UserMenu';
import { SmritiLogo } from '../../components/common/NerIcons';
import { db } from '../../db/dexie';
import { deleteUser } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { useAssistant } from '../../context/AssistantContext';

export default function ClinicianDashboard() {
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { openAssistant } = useAssistant();
  const navigate = useNavigate();

  // Navigation tab state: 'overview', 'patients', 'team', 'careplans', 'assessments', 'reports', 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Real Interactive Period Filter State
  const [periodFilter, setPeriodFilter] = useState('6months');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const periodMenuRef = useRef(null);

  // Modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddClinicianModal, setShowAddClinicianModal] = useState(false);
  const [showClinicalSummaryModal, setShowClinicalSummaryModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Close Period Dropdown on Click Outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(e.target)) {
        setIsPeriodMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPeriodMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Timeframe options with reactive translations
  const periodOptions = useMemo(() => [
    { id: '1week', label: t('clinician.lastWeek') || 'Last Week' },
    { id: '1month', label: t('clinician.lastMonth') || 'Last Month' },
    { id: '6months', label: t('clinician.last6Months') || 'Last 6 Months' },
    { id: '1year', label: t('clinician.lastYear') || 'Last Year' }
  ], [t]);

  // 1. Query Dexie Users & Patient Profiles
  const allUsers = useLiveQuery(() => db.users.toArray(), []) || [];
  const allPatientProfiles = useLiveQuery(() => db.patientProfiles.toArray(), []) || [];

  const profileMap = useMemo(() => {
    const map = new Map();
    allPatientProfiles.forEach(p => map.set(p.userId, p));
    return map;
  }, [allPatientProfiles]);

  // Enriched patient list
  const patientsList = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'patient')
      .map(p => {
        const prof = profileMap.get(p.id) || {};
        return {
          ...p,
          displayName: p.name === 'Bimala Borah' ? 'Bimala Borah (Amma)' : p.name,
          profileId: prof.id,
          age: p.age || prof.age || 74,
          location: p.location || prof.location || 'Assam, India',
          phcCenter: prof.phcCenter || 'Titabar PHC, Jorhat',
          primaryCaregiver: prof.primaryCaregiver || 'Family Caregiver',
          mmseScore: prof.mmseScore || (p.name.includes('Bimala') ? 24 : p.name.includes('Ramesh') ? 18 : 12),
          clinicalRisk: prof.riskLevel || (p.name.includes('Shanti') ? 'High Risk' : p.name.includes('Ramesh') ? 'Monitor' : 'Stable')
        };
      });
  }, [allUsers, profileMap]);

  const activePatients = patientsList.filter(p => p.status !== 'archived' && !p.isDeleted && !p.deletedAt);

  const clinicalTeam = useMemo(() => {
    return allUsers.filter(u => 
      (u.role === 'healthcare' || u.role === 'clinician') && 
      u.status !== 'archived' && 
      !u.isDeleted && 
      !u.deletedAt
    );
  }, [allUsers]);

  // Selected Patient State for Dossier
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    const saved = localStorage.getItem('smriti_selected_clinician_patient_id');
    return saved ? Number(saved) : (currentUser?.linkedPatientId || null);
  });

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

  const activePatient = activePatients.find(p => p.id === selectedPatientId) || (activePatients.length > 0 ? activePatients[0] : null);

  // 2. Query Cognitive Scores & Game Sessions (both patient-specific and cohort-wide)
  const allCognitiveScores = useLiveQuery(
    async () => {
      try {
        return await db.cognitiveScores.toArray();
      } catch (err) {
        console.warn('Clinician allCognitiveScores warning:', err);
        return [];
      }
    },
    []
  ) || [];

  const rawScores = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      try {
        const idNum = Number(selectedPatientId);
        const scores = await db.cognitiveScores.toArray();
        return scores.filter(s => {
          const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
          return sPid === idNum;
        });
      } catch (err) {
        console.warn('Clinician scores warning:', err);
        return [];
      }
    },
    [selectedPatientId]
  ) || [];

  const rawSessions = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      try {
        const idNum = Number(selectedPatientId);
        const sessions = await db.gameSessions.toArray();
        return sessions.filter(s => {
          const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
          return sPid === idNum;
        });
      } catch (err) {
        console.warn('Clinician sessions warning:', err);
        return [];
      }
    },
    [selectedPatientId]
  ) || [];

  const rawReminders = useLiveQuery(
    async () => {
      if (!selectedPatientId) return [];
      const all = await db.reminders.toArray();
      return all.filter(r => Number(r.targetUserId || r.userId || r.patientId) === Number(selectedPatientId));
    },
    [selectedPatientId]
  ) || [];

  // Patient Delete Handler
  const handleDeleteUser = async (user) => {
    try {
      const res = await deleteUser(user.id, currentUser, { softDelete: true });
      if (res && res.success) {
        setActionNotice(`Patient "${user.name}" safely removed from clinical registry.`);
        setUserToDelete(null);
        if (selectedPatientId === user.id) {
          const remaining = activePatients.filter(p => p.id !== user.id);
          const nextId = remaining.length > 0 ? remaining[0].id : null;
          setSelectedPatientId(nextId);
          if (nextId) {
            localStorage.setItem('smriti_selected_clinician_patient_id', String(nextId));
          } else {
            localStorage.removeItem('smriti_selected_clinician_patient_id');
          }
        }
        setTimeout(() => setActionNotice(''), 3500);
      } else {
        const errorMsg = res?.error || 'Failed to delete patient. Please try again.';
        setActionNotice(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Clinician delete error:', err);
      setActionNotice(err.message || 'Error deleting patient from database.');
      throw err;
    }
  };

  // 3. Dynamic Cognitive Trajectory Series based on Real Cohort Data & Timeframe Selection
  const trajectorySeries = useMemo(() => {
    const patientCount = activePatients.length || 18;
    const mildCount = activePatients.filter(p => (p.mmseScore || 24) >= 21).length || 8;
    const modCount = activePatients.filter(p => (p.mmseScore || 18) >= 15 && (p.mmseScore || 18) < 21).length || 6;
    const sevCount = activePatients.filter(p => (p.mmseScore || 12) < 15).length || 4;

    const baseMild = mildCount > 0 
      ? Number((activePatients.filter(p => (p.mmseScore || 24) >= 21).reduce((acc, p) => acc + (p.mmseScore || 24), 0) / mildCount).toFixed(1)) 
      : 26.0;
    const baseMod = modCount > 0 
      ? Number((activePatients.filter(p => (p.mmseScore || 18) >= 15 && (p.mmseScore || 18) < 21).reduce((acc, p) => acc + (p.mmseScore || 18), 0) / modCount).toFixed(1)) 
      : 16.8;
    const baseSev = sevCount > 0 
      ? Number((activePatients.filter(p => (p.mmseScore || 12) < 15).reduce((acc, p) => acc + (p.mmseScore || 12), 0) / sevCount).toFixed(1)) 
      : 7.5;
    const baseOverall = Number(((baseMild * mildCount + baseMod * modCount + baseSev * sevCount) / patientCount).toFixed(1)) || 23.2;

    if (periodFilter === '1week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const offsets = [-0.3, -0.1, -0.4, 0.0, 0.2, -0.1, 0.3];
      return days.map((day, i) => {
        const off = offsets[i];
        return {
          label: day,
          fullDate: `${day}, Sep 2026`,
          overall: Number((baseOverall + off).toFixed(1)),
          mild: Number((baseMild + off * 0.6).toFixed(1)),
          moderate: Number((baseMod + off * 0.8).toFixed(1)),
          severe: Number((baseSev + off * 0.4).toFixed(1)),
          isLatest: i === days.length - 1
        };
      });
    }

    if (periodFilter === '1month') {
      const weeks = ['W1', 'W2', 'W3', 'W4'];
      const offsets = [-0.6, -0.3, 0.0, 0.3];
      return weeks.map((w, i) => {
        const off = offsets[i];
        return {
          label: w,
          fullDate: `Week ${i + 1}, Sep 2026`,
          overall: Number((baseOverall + off).toFixed(1)),
          mild: Number((baseMild + off * 0.7).toFixed(1)),
          moderate: Number((baseMod + off * 0.9).toFixed(1)),
          severe: Number((baseSev + off * 0.5).toFixed(1)),
          isLatest: i === weeks.length - 1
        };
      });
    }

    if (periodFilter === '1year') {
      const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      const offsets = [-1.0, -0.8, -0.5, -0.7, -0.2, 0.3, 0.0, -0.4, -0.7, -0.3, 0.0, 0.3];
      return months.map((m, i) => {
        const off = offsets[i];
        return {
          label: m,
          fullDate: `${m} 2026`,
          overall: Number((baseOverall + off).toFixed(1)),
          mild: Number((baseMild + off * 0.8).toFixed(1)),
          moderate: Number((baseMod + off * 1.0).toFixed(1)),
          severe: Number((baseSev + off * 0.6).toFixed(1)),
          isLatest: i === months.length - 1
        };
      });
    }

    // Default: '6months' (Apr to Sep)
    const sixMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const sixOffsets = [0.0, -0.4, -0.7, -0.3, 0.0, 0.3];
    return sixMonths.map((m, i) => {
      const off = sixOffsets[i];
      return {
        label: m,
        fullDate: `${m} 2026`,
        overall: Number((baseOverall + off).toFixed(1)),
        mild: Number((baseMild + off * 0.8).toFixed(1)),
        moderate: Number((baseMod + off * 1.0).toFixed(1)),
        severe: Number((baseSev + off * 0.6).toFixed(1)),
        isLatest: i === sixMonths.length - 1
      };
    });
  }, [periodFilter, activePatients, allCognitiveScores]);

  // Helper to compute dynamic SVG coordinates and smooth bezier path
  const seriesLength = trajectorySeries.length;
  const mapX = (idx) => {
    if (seriesLength <= 1) return 160;
    return 28 + (idx * (277 / (seriesLength - 1)));
  };
  const mapY = (val) => 110 - ((Math.max(0, Math.min(30, val)) / 30) * 95);

  const getLinePath = (key) => {
    return trajectorySeries.reduce((acc, pt, i) => {
      const x = mapX(i);
      const y = mapY(pt[key]);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = mapX(i - 1);
      const prevY = mapY(trajectorySeries[i - 1][key]);
      const cx1 = prevX + (x - prevX) / 2;
      const cy1 = prevY;
      const cx2 = prevX + (x - prevX) / 2;
      const cy2 = y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
    }, '');
  };

  const latestPoint = trajectorySeries[trajectorySeries.length - 1] || { overall: 23.5, label: 'Current' };
  const activeHoverPoint = hoveredPointIndex !== null ? trajectorySeries[hoveredPointIndex] : null;

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-[#091113] text-[#192320] dark:text-[#F1F5F5] flex font-sans antialiased transition-colors duration-200">
      {/* 1. PERSISTENT CLINICIAN SIDEBAR (DESKTOP) — STRICTLY ONE SMRITICARE LOGO ON SCREEN */}
      <ClinicianSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* 2. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-[#FAF8F5] dark:bg-[#070D0E] h-full shadow-2xl flex flex-col p-6 z-10 border-r border-[#ECE7DE] dark:border-[#152225]">
            <div className="flex items-center justify-between pb-6 border-b border-[#ECE7DE] dark:border-[#152225]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] flex items-center justify-center p-1.5 border border-[#D5E5DC] dark:border-[#163832]">
                  <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
                </div>
                <span className="font-serif font-bold text-lg text-[#192320] dark:text-white">SmritiCare</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-6 space-y-2 flex-1">
              {[
                { id: 'overview', label: t('navigation.home') || 'Home', icon: Home },
                { id: 'patients', label: t('navigation.patients') || 'Patients', icon: Users },
                { id: 'team', label: t('clinician.clinicalTeam') || 'Clinical Team', icon: UserCheck },
                { id: 'careplans', label: t('navigation.careplans') || 'Care Plans', icon: CalendarCheck },
                { id: 'assessments', label: t('navigation.assessments') || 'Assessments', icon: Stethoscope },
                { id: 'reports', label: t('navigation.reports') || 'Reports', icon: FileText },
                { id: 'resources', label: t('navigation.resources') || 'Resources', icon: BookOpen, path: '/economy' },
                { id: 'community', label: t('navigation.community') || 'Community', icon: Users, path: '/community' },
                { id: 'settings', label: t('navigation.settings') || 'Settings', icon: SettingsIcon },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    else handleSelectTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#143D30] text-white dark:bg-[#122C27] dark:text-[#4ADE80]'
                      : 'text-[#4A5954] dark:text-[#94A3B8]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-[#ECE7DE] dark:border-[#152225] flex items-center justify-between">
              <span className="text-xs text-[#6E7D76] dark:text-[#7A938C]">Dr. Arun Phukan</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-[#192320] dark:text-white"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN HEALTHCARE PROFESSIONAL CONSOLE */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* TOP HEADER — COMPACT, CLEAN, ZERO SMRITICARE LOGO DUPLICATION */}
        <header className="sticky top-0 z-20 w-full bg-[#FAF8F5]/90 dark:bg-[#070D0E]/90 backdrop-blur-md border-b border-[#ECE7DE] dark:border-[#152225] px-4 md:px-8 py-3.5 transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Mobile Menu Button + Search Input */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[#192320] dark:text-white"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#8C9B95] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('community.searchPlaceholder') || 'Search patients, reports, assessments...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#EFECE6]/80 dark:bg-[#121E22] text-xs md:text-sm text-[#192320] dark:text-white placeholder-[#8C9B95] dark:placeholder-[#64748B] rounded-full pl-9 pr-4 py-2 border border-transparent focus:border-[#C5BCB0] dark:focus:border-[#2DD4BF]/40 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Right: Notification, Theme Switch, Language Selector, Doctor Profile, Date */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Notification Bell with red alert dot */}
              <button
                type="button"
                onClick={() => setActionNotice(t('clinician.clinicalAlertsRequireReview') || '3 clinical alerts require physician review.')}
                className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#4A5954] dark:text-[#94A3B8] transition-colors cursor-pointer"
                aria-label="Clinical Alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#FAF8F5] dark:ring-[#070D0E]" />
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#4A5954] dark:text-[#94A3B8] transition-colors cursor-pointer"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#4A5954]" />}
              </button>

              {/* Language Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#4A5954] dark:text-[#CBD5E1] hover:text-[#192320] dark:hover:text-white text-xs font-medium rounded-full pl-2.5 pr-6 py-1.5 border border-[#ECE7DE] dark:border-[#18292D] cursor-pointer focus:outline-none transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#FAF8F5] dark:bg-[#070D0E] text-[#192320] dark:text-white">
                      {lang.flag} {lang.native}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#8C9B95] dark:text-[#64748B] absolute right-2 pointer-events-none" />
              </div>

              {/* Doctor Profile & Account Menu */}
              <UserMenu variant="clinician" />

              {/* Date Badge matching Reference Image */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] text-xs font-medium text-[#3A4742] dark:text-[#CBD5E1] shadow-2xs">
                <span>Wed, 17 Sep 2026</span>
                <Calendar className="w-3.5 h-3.5 text-[#8C9B95] dark:text-[#64748B]" />
              </div>
            </div>
          </div>
        </header>

        {/* Temporary toast alert notice */}
        {actionNotice && (
          <div className="fixed top-18 right-6 z-50 bg-[#143D30] dark:bg-[#122C27] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* MAIN BODY SWITCHER */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-5 md:py-6">
          {/* Sub-view: Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs font-medium text-[#143D30] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {t('clinician.backToDashboard') || '← Back to Healthcare Professional Dashboard'}
                </button>
              </div>
              <WeeklyReportView
                patient={activePatient}
                scores={rawScores}
                sessions={rawSessions}
                reminders={rawReminders}
              />
            </div>
          )}

          {/* Sub-view: Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-xs font-medium text-[#143D30] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {t('clinician.backToDashboard') || '← Back to Healthcare Professional Dashboard'}
              </button>
              <SyncSettingsView />
            </div>
          )}

          {/* Sub-view: Patients Directory Tab */}
          {activeTab === 'patients' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs font-medium text-[#143D30] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {t('clinician.backToOverview') || '← Back to Clinical Overview'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(true)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#143D30] hover:bg-[#0E2F25] dark:bg-[#2DD4BF] dark:text-[#091113] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('clinician.registerPatient') || 'Register Patient'}</span>
                </button>
              </div>

              {/* Patient Directory Card */}
              <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-6 shadow-2xs">
                <h2 className="font-bold text-lg text-[#192320] dark:text-white mb-4">
                  {t('clinician.patientCohortRegistry') || 'Patient Cohort Registry'} ({activePatients.length} {t('clinician.activePatients') || 'Active Patients'})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ECE7DE] dark:border-[#18292D] text-[#6E7D76] dark:text-[#889B95]">
                        <th className="pb-3 font-semibold">{t('clinician.thPatientName') || 'Patient Name'}</th>
                        <th className="pb-3 font-semibold">{t('clinician.thAgeLocation') || 'Age & Location'}</th>
                        <th className="pb-3 font-semibold">{t('clinician.thPhcCenter') || 'Primary Health Center'}</th>
                        <th className="pb-3 font-semibold">{t('clinician.thCognitiveScore') || 'Cognitive Score'}</th>
                        <th className="pb-3 font-semibold">{t('clinician.thRiskStratification') || 'Risk Stratification'}</th>
                        <th className="pb-3 font-semibold text-right">{t('clinician.thActions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE7DE]/60 dark:divide-[#18292D]/60">
                      {activePatients.map(pt => (
                        <tr key={pt.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 font-medium text-[#192320] dark:text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center font-bold text-xs">
                              {pt.name.charAt(0)}
                            </div>
                            <span>{pt.displayName || pt.name}</span>
                          </td>
                          <td className="py-3.5 text-[#6E7D76] dark:text-[#889B95]">
                            {pt.age} {t('clinician.years') || 'yrs'} &bull; {pt.location}
                          </td>
                          <td className="py-3.5 text-[#6E7D76] dark:text-[#889B95]">
                            {pt.phcCenter}
                          </td>
                          <td className="py-3.5 font-bold text-[#192320] dark:text-white">
                            MMSE: {pt.mmseScore}/30
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pt.clinicalRisk === 'High Risk'
                                ? 'bg-[#FDF2F2] text-[#9B1C1C] border border-[#FBD5D5] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]'
                                : pt.clinicalRisk === 'Monitor'
                                ? 'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A] dark:bg-[#713F12]/40 dark:text-[#FDE047]'
                                : 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] dark:bg-[#064E3B]/60 dark:text-[#4ADE80]'
                            }`}>
                              {pt.clinicalRisk === 'High Risk' ? (t('clinician.highRisk') || 'High Risk') : pt.clinicalRisk === 'Monitor' ? (t('clinician.monitor') || 'Monitor') : (t('clinician.stable') || 'Stable')}
                            </span>
                          </td>
                          <td className="py-3.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientId(pt.id);
                                setActiveTab('overview');
                                setActionNotice(`${t('clinician.clinicalRecordsNotice') || 'Viewing clinical records for'} ${pt.name}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#16252A] border border-[#ECE7DE] dark:border-[#1E3339] text-[#143D30] dark:text-[#2DD4BF] font-semibold hover:underline"
                            >
                              {t('clinician.dossier') || 'Dossier'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserToDelete(pt)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                              title={t('clinician.deletePatient') || 'Delete Patient'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Clinical Team Directory Tab */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs font-medium text-[#143D30] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {t('clinician.backToOverview') || '← Back to Clinical Overview'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClinicianModal(true)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#143D30] hover:bg-[#0E2F25] dark:bg-[#2DD4BF] dark:text-[#091113] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('clinician.addNewClinicalAccount') || 'Add New Clinical Account'}</span>
                </button>
              </div>

              {/* Clinical Team Directory Card */}
              <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-6 shadow-2xs">
                <div className="mb-4">
                  <h2 className="font-bold text-lg text-[#192320] dark:text-white">
                    {t('clinician.clinicalTeamTitle') || 'Clinical & Healthcare Team Registry'} ({clinicalTeam.length} {t('clinician.totalHealthcareStaff') || 'Healthcare Staff'})
                  </h2>
                  <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1">
                    {t('clinician.clinicalTeamDesc') || 'Verified healthcare professionals and medical officers across the PHC network.'}
                  </p>
                </div>

                {clinicalTeam.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#6E7D76] dark:text-[#889B95]">
                    {t('clinician.noClinicalMembers') || 'No clinical team members found.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#ECE7DE] dark:border-[#18292D] text-[#6E7D76] dark:text-[#889B95]">
                          <th className="pb-3 font-semibold">Staff Name</th>
                          <th className="pb-3 font-semibold">{t('clinician.professionalEmail') || 'Email'}</th>
                          <th className="pb-3 font-semibold">{t('clinician.designation') || 'Designation'}</th>
                          <th className="pb-3 font-semibold">{t('clinician.thPhcCenter') || 'Primary Health Center'}</th>
                          <th className="pb-3 font-semibold">{t('clinician.contactPhone') || 'Contact Phone'}</th>
                          <th className="pb-3 font-semibold text-right">{t('clinician.thActions') || 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ECE7DE]/60 dark:divide-[#18292D]/60">
                        {clinicalTeam.map(member => (
                          <tr key={member.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-3.5 font-medium text-[#192320] dark:text-white flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                                {member.name ? member.name.replace(/^Dr\.\s*/i, '').charAt(0) : 'D'}
                              </div>
                              <div>
                                <span className="font-semibold block">{member.name}</span>
                                <span className="text-[10px] text-[#6E7D76] dark:text-[#889B95]">{member.location || 'Assam, India'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 text-[#6E7D76] dark:text-[#889B95] font-mono">
                              {member.email}
                            </td>
                            <td className="py-3.5 text-[#192320] dark:text-white font-medium">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] border border-[#D5E5DC] dark:border-[#163832]">
                                {member.designation || 'PHC Medical Officer'}
                              </span>
                            </td>
                            <td className="py-3.5 text-[#6E7D76] dark:text-[#889B95]">
                              {member.phcCenter || 'Titabar PHC, Jorhat'}
                            </td>
                            <td className="py-3.5 text-[#6E7D76] dark:text-[#889B95]">
                              {member.phone || '—'}
                            </td>
                            <td className="py-3.5 text-right space-x-2">
                              {member.id !== currentUser?.id && (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(member)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRIMARY TAB: CLINICAL OVERVIEW DASHBOARD */}
          {(activeTab === 'overview' || activeTab === 'careplans' || activeTab === 'assessments') && (
            <div className="space-y-5">
              {/* SECTION 1: LARGE CLINICAL HERO BANNER WITH DOCTOR & PATIENT PHOTO */}
              <section className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[#ECE7DE] dark:border-[#18292D] bg-gradient-to-r from-[#F6F2EB] via-[#F4EFE6] to-[#EAE4D9] dark:from-[#0B171A] dark:via-[#0D1C1F] dark:to-[#0A1417] shadow-sm transition-colors duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[220px] md:min-h-[260px]">
                  {/* Left Hero Copy (7 Cols) */}
                  <div className="lg:col-span-7 p-6 md:p-8 lg:p-9 flex flex-col justify-between z-10">
                    <div>
                      <span className="block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#0D9488] dark:text-[#2DD4BF] mb-2.5">
                        {t('clinician.heroBadge') || 'HEALTHCARE PROFESSIONAL'}
                      </span>

                      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold text-[#192320] dark:text-[#F1F5F5] tracking-tight leading-[1.15]">
                        {t('clinician.heroTitle1') || 'Better Care.'}<br />
                        <span className="font-serif italic font-normal text-[#184D3D] dark:text-[#86EFAC]">{t('clinician.heroTitle2') || 'Brighter Lives.'}</span>
                      </h1>

                      <p className="text-xs sm:text-sm text-[#4A5954] dark:text-[#94A3B8] font-normal mt-3 max-w-md leading-relaxed">
                        {t('clinician.heroDesc') || 'Assess. Plan. Monitor. Collaborate.'}<br />
                        <span className="font-medium text-[#192320] dark:text-[#CBD5E1]">{t('clinician.heroDescSub') || 'Together for healthier tomorrows.'}</span>
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('patients')}
                        className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#143D30] hover:bg-[#0E2F25] dark:bg-[#2DD4BF] dark:hover:bg-[#26bba7] dark:text-[#091113] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <span>{t('clinician.viewPatients') || 'View Patients'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openAssistant()}
                        className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#3A4742] dark:text-slate-200 border border-[#C5BCB0] dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                        <span>{t('clinician.aiClinicalSummary') || 'AI Clinical Summary'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Hero Visual: Authentic Doctor & Senior Patient Photo + Pull Quote (5 Cols) */}
                  <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full overflow-hidden flex items-center justify-end">
                    <img
                      src="/assets/images/clinician-hero.jpg"
                      alt="Dr. Arun Phukan consulting with elderly patient in clinic"
                      className="absolute inset-0 w-full h-full object-cover object-[60%_center]"
                    />

                    {/* Editorial Soft Gradient Blend */}
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#F6F2EB] via-[#F6F2EB]/40 to-transparent dark:from-[#0B171A] dark:via-[#0B171A]/40 dark:to-transparent" />

                    {/* Editorial Pull Quote matching Reference Image */}
                    <div className="relative z-10 p-6 lg:p-8 text-right hidden sm:block max-w-xs ml-auto">
                      <p className="font-serif italic text-sm md:text-base text-[#192320] dark:text-white leading-snug drop-shadow-xs">
                        {isDark ? (
                          t('clinician.pullQuoteDark') || '“Data with humanity creates lasting impact.”'
                        ) : (
                          t('clinician.pullQuoteLight') || '“Compassion informed by data creates real change.”'
                        )}
                      </p>
                      <div className="w-12 h-[1px] bg-[#0D9488]/60 dark:bg-[#2DD4BF]/60 mt-2 ml-auto" />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: 5 KPI / CLINICAL OVERVIEW CARDS */}
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch">
                {/* CARD 1: TOTAL PATIENTS */}
                <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] dark:bg-[#0F2922] text-[#1B5E20] dark:text-[#4ADE80] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-[#1B5E20] dark:text-[#4ADE80] bg-[#E8F5E9] dark:bg-[#064E3B]/60 px-2 py-0.5 rounded-full border border-[#C8E6C9] dark:border-[#065F46]">
                      &uarr; 12%
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-sans text-[#192320] dark:text-white leading-none">
                      18
                    </span>
                    <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
                      {t('clinician.totalPatients') || 'Total Patients'}
                    </p>
                  </div>
                </div>

                {/* CARD 2: HIGH RISK */}
                <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FDE8E8] dark:bg-[#2E1517] text-[#E02424] dark:text-[#F87171] flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-[#9B1C1C] dark:text-[#FCA5A5] bg-[#FDF2F2] dark:bg-[#7F1D1D]/40 px-2 py-0.5 rounded-full border border-[#FBD5D5] dark:border-[#991B1B]">
                      {t('clinician.highRisk') || 'High Risk'}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-sans text-[#192320] dark:text-white leading-none">
                      4
                    </span>
                    <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
                      {t('clinician.highRisk') || 'High Risk'}
                    </p>
                  </div>
                </div>

                {/* CARD 3: ACTIVE CARE PLANS */}
                <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#E1EFFE] dark:bg-[#0E2838] text-[#1E429F] dark:text-[#60A5FA] flex items-center justify-center">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-[#1B5E20] dark:text-[#4ADE80] bg-[#E8F5E9] dark:bg-[#064E3B]/60 px-2 py-0.5 rounded-full border border-[#C8E6C9] dark:border-[#065F46]">
                      &uarr; 7%
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-sans text-[#192320] dark:text-white leading-none">
                      14
                    </span>
                    <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
                      {t('clinician.activeCarePlans') || 'Active Care Plans'}
                    </p>
                  </div>
                </div>

                {/* CARD 4: ASSESSMENT COMPLETION */}
                <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EDE7F6] dark:bg-[#221B35] text-[#4A148C] dark:text-[#C084FC] flex items-center justify-center">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-sans text-[#192320] dark:text-white leading-none">
                      92%
                    </span>
                    <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
                      {t('clinician.assessmentCompletion') || 'Assessment Completion'}
                    </p>
                  </div>
                </div>

                {/* CARD 5: AI INSIGHTS */}
                <button
                  type="button"
                  onClick={() => setShowClinicalSummaryModal(true)}
                  className="col-span-2 sm:col-span-1 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center border border-[#D5E5DC] dark:border-[#163832] group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#143D30] dark:text-[#2DD4BF] flex items-center gap-0.5">
                      {t('common.view') || 'View'} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold font-sans text-[#192320] dark:text-white leading-none block">
                      {t('clinician.aiInsights') || 'AI Insights'}
                    </span>
                    <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
                      {t('clinician.newRecommendations') || '3 new recommendations'}
                    </p>
                  </div>
                </button>
              </section>

              {/* SECTION 3: MAIN CLINICAL ANALYTICS (Split 75% / 25%) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* LEFT & CENTER ANALYTICS ZONE (9 Cols) */}
                <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* CARD 1: COGNITIVE TRAJECTORY TRENDS (7 Cols of 9) */}
                  <div className="md:col-span-7 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xs flex flex-col justify-between transition-colors">
                    <div>
                      {/* Header with Title, Latest Status Badge, and Interactive Timeframe Dropdown */}
                      <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D] gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-sm md:text-base text-[#192320] dark:text-white">
                              {t('clinician.cognitiveTrajectoryTrends') || 'Cognitive Trajectory Trends'}
                            </h2>
                            {/* Live Present Condition Badge with Pulsing Halo */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] dark:bg-[#064E3B]/60 dark:text-[#4ADE80] dark:border-[#065F46]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400"></span>
                              </span>
                              {t('clinician.latestCondition') || 'Latest'}: {latestPoint.overall} {t('clinician.scoreMMSE') || 'MMSE'} • {t('clinician.stable') || 'Stable'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">
                            {t('clinician.cognitiveTrajectorySub') || 'Average cognitive scores across patient cohort (MMSE)'}
                          </p>
                        </div>

                        {/* Interactive Period Selector Dropdown */}
                        <div className="relative shrink-0" ref={periodMenuRef}>
                          <button
                            type="button"
                            onClick={() => setIsPeriodMenuOpen(prev => !prev)}
                            aria-haspopup="listbox"
                            aria-expanded={isPeriodMenuOpen}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30]/40 dark:hover:border-[#2DD4BF]/50 text-xs font-semibold text-[#192320] dark:text-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>{periodOptions.find(p => p.id === periodFilter)?.label || 'Last 6 Months'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#6E7D76] transition-transform duration-150 ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isPeriodMenuOpen && (
                            <div
                              role="listbox"
                              className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-xl shadow-xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                            >
                              {periodOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  role="option"
                                  aria-selected={periodFilter === opt.id}
                                  onClick={() => {
                                    setPeriodFilter(opt.id);
                                    setIsPeriodMenuOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    periodFilter === opt.id
                                      ? 'bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] font-bold'
                                      : 'text-[#4A5954] dark:text-[#94A3B8] hover:bg-[#FAF8F5] dark:hover:bg-[#121E22]'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {periodFilter === opt.id && <Check className="w-3.5 h-3.5 text-[#143D30] dark:text-[#2DD4BF]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Multi-Line Trajectory Chart SVG matching Reference Image */}
                      <div className="mt-4 w-full h-44 relative" onMouseLeave={() => setHoveredPointIndex(null)}>
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120" preserveAspectRatio="none">
                          {/* Grid Lines */}
                          <line x1="25" y1="15" x2="305" y2="15" stroke={isDark ? '#1F2D30' : '#EFECE6'} strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="25" y1="47" x2="305" y2="47" stroke={isDark ? '#1F2D30' : '#EFECE6'} strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="25" y1="78" x2="305" y2="78" stroke={isDark ? '#1F2D30' : '#EFECE6'} strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="25" y1="110" x2="305" y2="110" stroke={isDark ? '#1F2D30' : '#EFECE6'} strokeWidth="1" />

                          {/* Y-Axis Labels */}
                          <text x="5" y="18" fill={isDark ? '#64748B' : '#8C9B95'} fontSize="9">30</text>
                          <text x="5" y="50" fill={isDark ? '#64748B' : '#8C9B95'} fontSize="9">20</text>
                          <text x="5" y="81" fill={isDark ? '#64748B' : '#8C9B95'} fontSize="9">10</text>
                          <text x="10" y="113" fill={isDark ? '#64748B' : '#8C9B95'} fontSize="9">0</text>

                          {/* Hover Crosshair Guideline */}
                          {hoveredPointIndex !== null && (
                            <line
                              x1={mapX(hoveredPointIndex)}
                              y1="10"
                              x2={mapX(hoveredPointIndex)}
                              y2="110"
                              stroke={isDark ? '#2DD4BF' : '#0D9488'}
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                              opacity="0.8"
                            />
                          )}

                          {/* Category 1: Mild (Blue line) */}
                          <path d={getLinePath('mild')} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                          {trajectorySeries.map((d, i) => (
                            <circle key={`mild-${i}`} cx={mapX(i)} cy={mapY(d.mild)} r="3" fill="#3B82F6" stroke={isDark ? '#0E1719' : '#FFFFFF'} strokeWidth="1.5" />
                          ))}

                          {/* Category 2: Overall (Teal/Emerald line) */}
                          <path d={getLinePath('overall')} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
                          {trajectorySeries.map((d, i) => {
                            const isCurrent = i === trajectorySeries.length - 1;
                            const isHovered = hoveredPointIndex === i;
                            return (
                              <g key={`overall-${i}`}>
                                {isCurrent && (
                                  <circle
                                    cx={mapX(i)}
                                    cy={mapY(d.overall)}
                                    r="7"
                                    fill="none"
                                    stroke="#0D9488"
                                    strokeWidth="1.5"
                                    className="animate-ping opacity-60"
                                  />
                                )}
                                <circle
                                  cx={mapX(i)}
                                  cy={mapY(d.overall)}
                                  r={isHovered ? 4.5 : isCurrent ? 4 : 3}
                                  fill="#0D9488"
                                  stroke={isDark ? '#0E1719' : '#FFFFFF'}
                                  strokeWidth={isHovered ? 2 : 1.5}
                                />
                              </g>
                            );
                          })}

                          {/* Category 3: Moderate (Orange line) */}
                          <path d={getLinePath('moderate')} fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
                          {trajectorySeries.map((d, i) => (
                            <circle key={`mod-${i}`} cx={mapX(i)} cy={mapY(d.moderate)} r="3" fill="#F97316" stroke={isDark ? '#0E1719' : '#FFFFFF'} strokeWidth="1.5" />
                          ))}

                          {/* Category 4: Severe (Red line) */}
                          <path d={getLinePath('severe')} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                          {trajectorySeries.map((d, i) => (
                            <circle key={`sev-${i}`} cx={mapX(i)} cy={mapY(d.severe)} r="3" fill="#EF4444" stroke={isDark ? '#0E1719' : '#FFFFFF'} strokeWidth="1.5" />
                          ))}

                          {/* Transparent Interactive Hit Columns for Responsive Touch/Mouse Hover */}
                          {trajectorySeries.map((d, i) => {
                            const w = 277 / Math.max(1, trajectorySeries.length);
                            const x = mapX(i) - w / 2;
                            return (
                              <rect
                                key={`hit-${i}`}
                                x={Math.max(18, x)}
                                y="0"
                                width={w}
                                height="120"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPointIndex(i)}
                                onTouchStart={() => setHoveredPointIndex(i)}
                              />
                            );
                          })}
                        </svg>

                        {/* Interactive Floating Tooltip matching Reference Image Specs */}
                        {activeHoverPoint && (
                          <div
                            className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded-lg bg-[#143D30] dark:bg-[#071311] text-white text-[11px] shadow-xl border border-white/15 flex flex-col gap-0.5 transition-all duration-75 transform -translate-x-1/2"
                            style={{
                              left: `${(mapX(hoveredPointIndex) / 320) * 100}%`,
                              top: `${Math.max(2, (mapY(activeHoverPoint.overall) / 120) * 100 - 45)}%`
                            }}
                          >
                            <div className="font-bold flex items-center justify-between gap-3 text-[11px]">
                              <span>{activeHoverPoint.fullDate || activeHoverPoint.label}</span>
                              <span className="text-[#4ADE80] font-mono font-semibold">{activeHoverPoint.overall} {t('clinician.scoreMMSE') || 'MMSE'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-white/80">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {activeHoverPoint.mild}</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> {activeHoverPoint.moderate}</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {activeHoverPoint.severe}</span>
                            </div>
                          </div>
                        )}

                        {/* Dynamic Period Labels on X-Axis */}
                        <div className="flex justify-between pl-7 pr-3 text-[10px] font-medium text-[#8C9B95] dark:text-[#64748B] mt-1">
                          {trajectorySeries.map((pt, idx) => (
                            <span
                              key={pt.label + idx}
                              className={`transition-colors cursor-pointer ${
                                hoveredPointIndex === idx
                                  ? 'text-[#0D9488] dark:text-[#2DD4BF] font-bold scale-105'
                                  : ''
                              }`}
                              onMouseEnter={() => setHoveredPointIndex(idx)}
                            >
                              {pt.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Chart Legend matching Reference Image */}
                    <div className="pt-3 mt-4 border-t border-[#ECE7DE] dark:border-[#18292D] flex flex-wrap items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#4A5954] dark:text-[#94A3B8]">
                        <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                        <span>{t('clinician.legendOverall') || 'Overall'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4A5954] dark:text-[#94A3B8]">
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                        <span>{t('clinician.legendMild') || 'Mild'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4A5954] dark:text-[#94A3B8]">
                        <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                        <span>{t('clinician.legendModerate') || 'Moderate'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4A5954] dark:text-[#94A3B8]">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                        <span>{t('clinician.legendSevere') || 'Severe'}</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: PATIENT COHORT OVERVIEW & RECENT ASSESSMENTS (5 Cols of 9) */}
                  <div className="md:col-span-5 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xs flex flex-col justify-between transition-colors">
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                        <h2 className="font-bold text-sm md:text-base text-[#192320] dark:text-white">
                          {t('clinician.patientCohortOverview') || 'Patient Cohort Overview'}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('patients')}
                          className="text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{t('clinician.viewAll') || 'View All'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Donut Chart & Legend Row */}
                      <div className="mt-4 flex items-center justify-around gap-3 pb-4 border-b border-[#ECE7DE] dark:border-[#18292D]">
                        {/* Donut SVG */}
                        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background Track */}
                            <circle cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#16252A' : '#EFECE6'} strokeWidth="12" />
                            {/* Mild: 44% (circumference ~ 238.76, 44% = 105) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="#3B82F6"
                              strokeWidth="12"
                              strokeDasharray="105 238.76"
                              strokeDashoffset="0"
                            />
                            {/* Moderate: 33% (33% = 78.8) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="#F97316"
                              strokeWidth="12"
                              strokeDasharray="78.8 238.76"
                              strokeDashoffset="-105"
                            />
                            {/* Severe: 22% (22% = 52.5) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="#EF4444"
                              strokeWidth="12"
                              strokeDasharray="52.5 238.76"
                              strokeDashoffset="-183.8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="font-bold text-base text-[#192320] dark:text-white leading-tight">18</span>
                            <span className="text-[10px] text-[#6E7D76] dark:text-[#889B95] leading-tight">{t('clinician.patients')}</span>
                          </div>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                              <span className="text-[#4A5954] dark:text-[#94A3B8]">{t('clinician.legendMild')}</span>
                            </div>
                            <span className="font-bold text-[#192320] dark:text-white">8 (44%)</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                              <span className="text-[#4A5954] dark:text-[#94A3B8]">{t('clinician.legendModerate')}</span>
                            </div>
                            <span className="font-bold text-[#192320] dark:text-white">6 (33%)</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                              <span className="text-[#4A5954] dark:text-[#94A3B8]">{t('clinician.legendSevere')}</span>
                            </div>
                            <span className="font-bold text-[#192320] dark:text-white">4 (22%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-section: Recent Assessments matching Reference Image */}
                      <div className="mt-4">
                        <span className="text-[11px] font-bold text-[#3A4742] dark:text-[#CBD5E1] block mb-2.5">
                          {t('clinician.recentAssessments')}
                        </span>

                        <div className="space-y-2.5">
                          {/* Row 1: Bimala Borah */}
                          <div
                            onClick={() => {
                              setSelectedPatientId(101);
                              setActionNotice('Viewing Bimala Borah (Amma)');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src="/assets/images/auth-patient.jpg"
                                alt="Bimala Borah"
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-300 dark:border-emerald-600/40"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#192320] dark:text-white truncate">
                                  Bimala Borah (Amma)
                                </p>
                                <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] truncate">
                                  MMSE &bull; 24/30
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B] block">{t('clinician.todayTime1')}</span>
                              <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] dark:bg-[#064E3B]/60 dark:text-[#4ADE80] dark:border-[#065F46]">
                                {t('clinician.stable')}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Ramesh Tiwari */}
                          <div
                            onClick={() => {
                              setActionNotice('Viewing Ramesh Tiwari');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src="/assets/images/patient-ramesh.jpg"
                                alt="Ramesh Tiwari"
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-amber-300 dark:border-amber-600/40"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#192320] dark:text-white truncate">
                                  Ramesh Tiwari
                                </p>
                                <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] truncate">
                                  MoCA &bull; 18/30
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B] block">{t('clinician.todayTime2')}</span>
                              <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A] dark:bg-[#713F12]/40 dark:text-[#FDE047] dark:border-[#854D0E]">
                                {t('clinician.monitor')}
                              </span>
                            </div>
                          </div>

                          {/* Row 3: Shanti Devi */}
                          <div
                            onClick={() => {
                              setActionNotice('Viewing Shanti Devi');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src="/assets/images/patient-shanti.jpg"
                                alt="Shanti Devi"
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-red-300 dark:border-red-600/40"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#192320] dark:text-white truncate">
                                  Shanti Devi
                                </p>
                                <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] truncate">
                                  MMSE &bull; 12/30
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B] block">{t('clinician.todayTime3')}</span>
                              <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#FDF2F2] text-[#9B1C1C] border border-[#FBD5D5] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5] dark:border-[#991B1B]">
                                {t('clinician.highRisk')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL ZONE: ALERTS + QUICK ACTIONS + INSIGHT (3 Cols) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* CARD 1: CLINICAL & CARE ALERTS */}
                  <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-2xs transition-colors">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FDF2ED] dark:bg-[#2A1B16] text-[#C86D51] dark:text-[#FCA5A5] flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-bold text-xs md:text-sm text-[#192320] dark:text-white">
                          {t('clinician.clinicalCareAlerts')}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActionNotice('Triage active for 3 alerts')}
                        className="text-[11px] font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{t('clinician.viewAll')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-3 text-xs">
                      {/* Alert 1 */}
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D]">
                        <div className="w-7 h-7 rounded-lg bg-[#FDE8E8] dark:bg-[#2E1517] text-[#E02424] dark:text-[#F87171] flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#192320] dark:text-white text-[11px]">{t('clinician.alertCognitiveDecline')}</span>
                            <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B]">{t('clinician.twoHoursAgo')}</span>
                          </div>
                          <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">
                            Ramesh Tiwari (&darr; 20% in MMSE)
                          </p>
                        </div>
                      </div>

                      {/* Alert 2 */}
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D]">
                        <div className="w-7 h-7 rounded-lg bg-[#FDE8E8] dark:bg-[#2E1517] text-[#E02424] dark:text-[#F87171] flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#192320] dark:text-white text-[11px]">{t('clinician.alertMedicationNonAdherence')}</span>
                            <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B]">{t('clinician.fourHoursAgo')}</span>
                          </div>
                          <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">
                            Shanti Devi (BP Tablet)
                          </p>
                        </div>
                      </div>

                      {/* Alert 3 */}
                      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D]">
                        <div className="w-7 h-7 rounded-lg bg-[#EDE7F6] dark:bg-[#221B35] text-[#4A148C] dark:text-[#C084FC] flex items-center justify-center shrink-0 mt-0.5">
                          <CalendarClock className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#192320] dark:text-white text-[11px]">{t('clinician.alertFollowUpDue')}</span>
                            <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B]">{t('clinician.sixHoursAgo')}</span>
                          </div>
                          <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">
                            Lata Verma (Assessment)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: QUICK ACTIONS (2x3 GRID) */}
                  <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-2xs transition-colors">
                    <h3 className="font-bold text-xs md:text-sm text-[#192320] dark:text-white pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                      {t('clinician.quickActions')}
                    </h3>

                    <div className="grid grid-cols-3 gap-2 mt-3.5">
                      {/* Action 1: Add Patient */}
                      <button
                        type="button"
                        onClick={() => setShowAddPatientModal(true)}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer group"
                      >
                        <UserPlus className="w-4 h-4 text-[#143D30] dark:text-[#2DD4BF] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-center font-medium text-[#3A4742] dark:text-[#CBD5E1] leading-tight">{t('clinician.addPatient')}</span>
                      </button>

                      {/* Action 2: New Assessment */}
                      <button
                        type="button"
                        onClick={() => {
                          setActionNotice('Opened MMSE Assessment console');
                          setActiveTab('patients');
                        }}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer group"
                      >
                        <ClipboardCheck className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-center font-medium text-[#3A4742] dark:text-[#CBD5E1] leading-tight">{t('clinician.newAssessment')}</span>
                      </button>

                      {/* Action 3: Generate Report */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('reports')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer group"
                      >
                        <FileText className="w-4 h-4 text-[#3B82F6] dark:text-[#60A5FA] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-center font-medium text-[#3A4742] dark:text-[#CBD5E1] leading-tight">{t('clinician.generateReport')}</span>
                      </button>

                      {/* Action 4: Care Plan */}
                      <button
                        type="button"
                        onClick={() => setShowReminderModal(true)}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer group"
                      >
                        <Heart className="w-4 h-4 text-[#EF4444] dark:text-[#F87171] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-center font-medium text-[#3A4742] dark:text-[#CBD5E1] leading-tight">{t('clinician.carePlan')}</span>
                      </button>

                      {/* Action 5: AI Assistant */}
                      <button
                        type="button"
                        onClick={() => openAssistant()}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer group"
                      >
                        <Sparkles className="w-4 h-4 text-[#8B5CF6] dark:text-[#C084FC] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-center font-medium text-[#3A4742] dark:text-[#CBD5E1] leading-tight">{t('clinician.aiAssistant')}</span>
                      </button>

                      {/* Action 6: Schedule Follow-up */}
                      <button
                        type="button"
                        onClick={() => setShowReminderModal(true)}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer group"
                      >
                        <CalendarClock className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-center font-medium text-[#3A4742] dark:text-[#CBD5E1] leading-tight">{t('clinician.scheduleFollowUp')}</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 3: SUPPORTING INSIGHT BOTANICAL CARD */}
                  <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-2xs flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center shrink-0 border border-[#D5E5DC] dark:border-[#163832]">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <p className="font-serif italic text-xs text-[#3A4742] dark:text-[#CBD5E1] leading-snug">
                        {t('clinician.pullQuoteFooter')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/community')}
                      className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-[#3A4742] dark:text-[#CBD5E1] transition-colors shrink-0 cursor-pointer"
                      aria-label="Community link"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* 4. CLINICAL MODALS */}
      {showReminderModal && (
        <ReminderManagerModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          targetUserId={selectedPatientId}
          patientId={selectedPatientId}
          patientName={activePatient?.name || 'Bimala Borah (Amma)'}
        />
      )}

      {showAddPatientModal && (
        <AddPatientModal
          isOpen={showAddPatientModal}
          onClose={() => setShowAddPatientModal(false)}
          onAdded={(newPatientId) => {
            setSelectedPatientId(newPatientId);
            setShowAddPatientModal(false);
            setActionNotice('New patient registered successfully in clinical registry.');
            setTimeout(() => setActionNotice(''), 3000);
          }}
        />
      )}

      {showAddClinicianModal && (
        <AddClinicianModal
          isOpen={showAddClinicianModal}
          onClose={() => setShowAddClinicianModal(false)}
          onClinicianCreated={(newClinician) => {
            setShowAddClinicianModal(false);
            setActionNotice(`Healthcare account for "${newClinician?.name}" registered successfully.`);
            setTimeout(() => setActionNotice(''), 3000);
          }}
        />
      )}

      {userToDelete && (
        <DeleteUserModal
          isOpen={Boolean(userToDelete)}
          user={userToDelete}
          currentUser={currentUser}
          onClose={() => setUserToDelete(null)}
          onConfirmDelete={handleDeleteUser}
        />
      )}

      {/* 5. AI CLINICAL SUMMARY MODAL */}
      {showClinicalSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowClinicalSummaryModal(false)}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#ECE7DE] dark:border-[#18292D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center border border-[#D5E5DC] dark:border-[#163832]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#192320] dark:text-white">
                    {t('clinician.aiInsights') || 'AI Clinical Summary & Insights'}
                  </h3>
                  <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
                    {periodOptions.find(p => p.id === periodFilter)?.label} Cohort Trajectory Overview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClinicalSummaryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trajectory Status Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] rounded-xl p-3">
                <span className="text-[11px] text-[#6E7D76] dark:text-[#889B95] block">{t('clinician.latestCondition') || 'Current MMSE'}</span>
                <span className="text-lg font-bold text-[#143D30] dark:text-[#2DD4BF] font-mono">{latestPoint.overall}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">● Stable trajectory</span>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] rounded-xl p-3">
                <span className="text-[11px] text-[#6E7D76] dark:text-[#889B95] block">{t('clinician.highRisk') || 'High Risk Cohort'}</span>
                <span className="text-lg font-bold text-[#E02424] dark:text-[#F87171] font-mono">4</span>
                <span className="text-[10px] text-[#9B1C1C] dark:text-[#FCA5A5] block font-medium">Flagged for review</span>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] rounded-xl p-3">
                <span className="text-[11px] text-[#6E7D76] dark:text-[#889B95] block">{t('clinician.assessmentCompletion') || 'Completion'}</span>
                <span className="text-lg font-bold text-[#1E429F] dark:text-[#60A5FA] font-mono">92%</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">High adherence</span>
              </div>
            </div>

            {/* AI Synthesized Recommendations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7D76] dark:text-[#889B95]">
                {t('clinician.newRecommendations') || 'Clinical AI Recommendations'}
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
                  <div>
                    <p className="text-xs font-semibold text-[#192320] dark:text-white">Follow-up scheduling for moderate tier patients</p>
                    <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">MMSE scores for moderate tier indicate stability at 16.5; schedule next sensory and motor screening in 3 weeks.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
                  <div>
                    <p className="text-xs font-semibold text-[#192320] dark:text-white">Multilingual caregiver adherence reinforcement</p>
                    <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">Caregivers utilizing native language voice reminders showed 14% higher routine completion rates.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">3</div>
                  <div>
                    <p className="text-xs font-semibold text-[#192320] dark:text-white">Memory stimulation protocol review</p>
                    <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">High-risk patients show improved calmness when familiar regional folk songs and photo memory games are included in care plans.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#ECE7DE] dark:border-[#18292D]">
              <button
                type="button"
                onClick={() => {
                  setShowClinicalSummaryModal(false);
                  openAssistant();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('clinician.aiAssistant') || 'Ask AI Assistant'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowClinicalSummaryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#091113] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
