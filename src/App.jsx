import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import PatientNav from './components/patient/PatientNav';
import EmergencyCallModal from './components/patient/EmergencyCallModal';
import AiAssistantDrawer from './components/ai/AiAssistantDrawer';
import AiErrorBoundary from './components/ai/AiErrorBoundary';
import FloatingAssistantButton from './components/ai/FloatingAssistantButton';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import NotificationToast from './components/notifications/NotificationToast';
import NotificationPermissionModal from './components/notifications/NotificationPermissionModal';
import CinematicAuthBackground from './components/auth/CinematicAuthBackground';

import FeatureGate from './components/common/FeatureGate';
import { FEATURE_KEYS } from './services/subscriptionService';

// Pages
import LandingPage from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import LoginPage from './pages/LoginPage';
import PatientHome from './pages/patient/PatientHome';
import PatientSafetyView from './pages/patient/PatientSafetyView';
import PatientGamesList from './pages/patient/PatientGamesList';
import PatientReminders from './pages/patient/PatientReminders';
import PatientProgress from './pages/patient/PatientProgress';
import BihuMemoryGame from './pages/patient/games/BihuMemoryGame';
import MekhelaPatternGame from './pages/patient/games/MekhelaPatternGame';
import TeaGardenRoutineGame from './pages/patient/games/TeaGardenRoutineGame';
import SoundsOfHillsGame from './pages/patient/games/SoundsOfHillsGame';
import MemoryMotionGame from './pages/patient/games/MemoryMotionGame';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import ClinicianDashboard from './pages/clinician/ClinicianDashboard';
import CommunityPage from './pages/community/CommunityPage';
import AssistantPage from './pages/assistant/AssistantPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EconomyHubPage from './pages/economy/EconomyHubPage';
import AuthDebugPanel from './components/common/AuthDebugPanel';

import { useAuth } from './context/AuthContext';
import { useAssistant } from './context/AssistantContext';

/**
 * AccessDenied Component
 * Dignified, informative barrier when an authenticated user attempts to access an unauthorized role dashboard.
 */
function AccessDenied({ requiredRole, userRole, currentUser }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const roleLabels = {
    patient: 'Patient / Senior',
    caregiver: 'Family Caregiver',
    healthcare: 'Healthcare Professional',
    clinician: 'Healthcare Professional'
  };

  const dashboardRoutes = {
    patient: '/patient/home',
    caregiver: '/caregiver/dashboard',
    healthcare: '/clinician/dashboard',
    clinician: '/clinician/dashboard'
  };

  const reqName = roleLabels[requiredRole] || requiredRole;
  const currName = roleLabels[userRole] || userRole || 'User';
  const myDashboard = dashboardRoutes[userRole] || '/';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#070B0E] text-slate-100">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#0E151D] border border-rose-800/40 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Access Restricted
          </span>
          <h2 className="font-serif text-2xl text-white mt-1">
            {reqName} Portal
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            You are signed in as <strong className="text-white">{currentUser?.name || currName}</strong> (<span className="text-emerald-400">{currName}</span>). This workspace requires <strong className="text-amber-300">{reqName}</strong> credentials.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={() => navigate(myDashboard)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            Go to My {currName} Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate(`/login?role=${requiredRole}`)}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-all cursor-pointer"
          >
            Sign in as {reqName}
          </button>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function RequirePatient({ children, currentUser, role, isLoading }) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070D0E] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login?role=patient" replace />;
  }
  if (role !== 'patient') {
    return <AccessDenied requiredRole="patient" userRole={role} currentUser={currentUser} />;
  }
  return children;
}

function RequireCaregiver({ children, currentUser, role, isLoading }) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0D1217] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login?role=caregiver" replace />;
  }
  if (role !== 'caregiver') {
    return <AccessDenied requiredRole="caregiver" userRole={role} currentUser={currentUser} />;
  }
  return children;
}

function RequireClinician({ children, currentUser, role, isLoading }) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070D0E] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login?role=healthcare" replace />;
  }
  if (role !== 'healthcare' && role !== 'clinician') {
    return <AccessDenied requiredRole="healthcare" userRole={role} currentUser={currentUser} />;
  }
  return children;
}

function RequireAuth({ children, currentUser, isLoading }) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070D0E] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const { currentUser, role, isLoading } = useAuth();
  const { isOpen: isAssistantOpen, closeAssistant, openAssistant, contextData } = useAssistant();
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Check if current route is patient experience
  const isPatientRoute = location.pathname.startsWith('/patient') && location.pathname !== '/patient/community';
  const isCaregiverRoute = location.pathname.startsWith('/caregiver');
  const isClinicianRoute = location.pathname.startsWith('/clinician') || location.pathname.startsWith('/healthcare-worker');
  const isCommunityRoute = location.pathname === '/community' || location.pathname === '/patient/community';
  const isGameActive = location.pathname.startsWith('/patient/games/') && location.pathname !== '/patient/games';
  const isDedicatedAuthView = location.pathname === '/role-select' || location.pathname === '/login';
  const isPublicPage = (location.pathname === '/' || location.pathname === '/about' || location.pathname === '/contact' || location.pathname === '/reset-password');
  const isAssistantRoute = location.pathname === '/assistant';
  const isCustomLayout = isDedicatedAuthView || isCaregiverRoute || isClinicianRoute || isAssistantRoute || isCommunityRoute;

  return (
    <div className={`min-h-screen flex flex-col bg-background text-foreground font-sans ${isCustomLayout ? 'pb-0' : 'pb-24 md:pb-28 lg:pb-8'} transition-colors duration-200 relative`}>
      {/* Ambient Cinematic Background for Public/Auth routes */}
      {isPublicPage && <CinematicAuthBackground />}

      <div className="flex flex-1 w-full min-h-screen">
        {/* Desktop Sidebar (visible on large screens for patient route) */}
        {isPatientRoute && !isGameActive && !isCommunityRoute && <Sidebar />}

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Universal Header (Persistent across whole app except dedicated auth, caregiver, clinician, assistant, and community views) */}
          {!isDedicatedAuthView && !isCaregiverRoute && !isClinicianRoute && !isAssistantRoute && !isCommunityRoute && <Header onOpenEmergency={() => setIsEmergencyOpen(true)} />}

          {/* Main Content View */}
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<LandingPage defaultSection="about" />} />
              <Route path="/contact" element={<LandingPage defaultSection="contact" />} />
              <Route path="/role-select" element={<RoleSelectPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Quick Redirects */}
              <Route path="/patient" element={<Navigate to="/patient/home" replace />} />
              <Route path="/caregiver" element={<Navigate to="/caregiver/dashboard" replace />} />
              <Route path="/clinician" element={<Navigate to="/clinician/dashboard" replace />} />
              <Route path="/healthcare-worker" element={<Navigate to="/clinician/dashboard" replace />} />
              <Route path="/healthcare-worker/*" element={<Navigate to="/clinician/dashboard" replace />} />

              {/* User Profile & Account Settings (Require Auth) */}
              <Route
                path="/profile"
                element={
                  <RequireAuth currentUser={currentUser} isLoading={isLoading}>
                    <ProfilePage />
                  </RequireAuth>
                }
              />

              {/* Patient Routes (Guarded for Patient Role Only) */}
              <Route path="/patient/home" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><PatientHome /></RequirePatient>} />
              <Route path="/patient/safety" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><PatientSafetyView /></RequirePatient>} />
              <Route path="/patient/games" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><PatientGamesList /></RequirePatient>} />
              <Route
                path="/patient/games/bihu"
                element={
                  <RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}>
                    <FeatureGate feature={FEATURE_KEYS.ALL_CULTURAL_GAMES} backPath="/patient/games">
                      <BihuMemoryGame />
                    </FeatureGate>
                  </RequirePatient>
                }
              />
              <Route
                path="/patient/games/mekhela"
                element={
                  <RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}>
                    <FeatureGate feature={FEATURE_KEYS.ALL_CULTURAL_GAMES} backPath="/patient/games">
                      <MekhelaPatternGame />
                    </FeatureGate>
                  </RequirePatient>
                }
              />
              <Route
                path="/patient/games/teagarden"
                element={
                  <RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}>
                    <FeatureGate feature={FEATURE_KEYS.ALL_CULTURAL_GAMES} backPath="/patient/games">
                      <TeaGardenRoutineGame />
                    </FeatureGate>
                  </RequirePatient>
                }
              />
              <Route
                path="/patient/games/soundshills"
                element={
                  <RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}>
                    <FeatureGate feature={FEATURE_KEYS.ALL_CULTURAL_GAMES} backPath="/patient/games">
                      <SoundsOfHillsGame />
                    </FeatureGate>
                  </RequirePatient>
                }
              />
              <Route path="/patient/games/memorymotion" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><MemoryMotionGame /></RequirePatient>} />
              <Route path="/patient/games/memory-motion" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><MemoryMotionGame /></RequirePatient>} />
              <Route path="/patient/reminders" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><PatientReminders /></RequirePatient>} />
              <Route path="/patient/progress" element={<RequirePatient currentUser={currentUser} role={role} isLoading={isLoading}><PatientProgress /></RequirePatient>} />

              {/* Dedicated AI Assistant Hub */}
              <Route
                path="/assistant"
                element={
                  <AiErrorBoundary>
                    <FeatureGate feature={FEATURE_KEYS.VOICE_AI} backPath="/">
                      <AssistantPage />
                    </FeatureGate>
                  </AiErrorBoundary>
                }
              />

              {/* Global Dementia Community Routes */}
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/patient/community" element={<CommunityPage />} />

              {/* Caregiver Dashboard (Guarded for Caregiver Role Only) */}
              <Route
                path="/caregiver/dashboard"
                element={
                  <RequireCaregiver currentUser={currentUser} role={role} isLoading={isLoading}>
                    <CaregiverDashboard />
                  </RequireCaregiver>
                }
              />

              {/* Healthcare Clinician Dashboard (Guarded for Healthcare Role Only) */}
              <Route
                path="/clinician/dashboard"
                element={
                  <RequireClinician currentUser={currentUser} role={role} isLoading={isLoading}>
                    <ClinicianDashboard />
                  </RequireClinician>
                }
              />

              {/* Smriti Economy & Rewards Hub */}
              <Route
                path="/economy"
                element={
                  <RequireAuth currentUser={currentUser} isLoading={isLoading}>
                    <EconomyHubPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/economy/:tab"
                element={
                  <RequireAuth currentUser={currentUser} isLoading={isLoading}>
                    <EconomyHubPage />
                  </RequireAuth>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Elder-Friendly Bottom Navigation (Visible in Patient Mode on mobile, hidden during active game screen) */}
      {isPatientRoute && !isGameActive && (
        <div className="lg:hidden">
          <PatientNav onOpenEmergency={() => setIsEmergencyOpen(true)} />
        </div>
      )}

      {/* Universal Floating "Ask Smriti" Voice Trigger */}
      {!isPublicPage && !isAssistantRoute && (
        <FloatingAssistantButton
          hasActiveGame={isGameActive}
          onClick={() => openAssistant()}
        />
      )}

      {/* Global Unified AI Assistant Drawer (Desktop: Right-Side Panel, Mobile: Full-Screen View) */}
      <AiAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={closeAssistant}
        currentGameId={contextData.currentGameId}
        currentGameName={contextData.currentGameName}
        currentGameState={contextData.currentGameState}
        currentScore={contextData.currentScore}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
      />

      {/* Global Emergency Caregiver Call Modal */}
      <EmergencyCallModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Centralized Notification Center Drawer */}
      <NotificationDrawer />

      {/* Foreground Reminder Toast Alert */}
      <NotificationToast />

      {/* Browser Notification Permission Pre-Prompt Modal */}
      <NotificationPermissionModal />

      {/* Developer Authentication HUD (Active only in import.meta.env.DEV) */}
      <AuthDebugPanel />
    </div>
  );
}
