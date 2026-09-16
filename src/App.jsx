import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import PatientNav from './components/patient/PatientNav';
import EmergencyCallModal from './components/patient/EmergencyCallModal';
import AiAssistantDrawer from './components/ai/AiAssistantDrawer';
import AiErrorBoundary from './components/ai/AiErrorBoundary';
import FloatingAssistantButton from './components/ai/FloatingAssistantButton';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import NotificationToast from './components/notifications/NotificationToast';
import NotificationPermissionModal from './components/notifications/NotificationPermissionModal';
import CinematicAuthBackground from './components/auth/CinematicAuthBackground';

// Pages
import LandingPage from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import LoginPage from './pages/LoginPage';
import PatientHome from './pages/patient/PatientHome';
import PatientGamesList from './pages/patient/PatientGamesList';
import PatientReminders from './pages/patient/PatientReminders';
import PatientProgress from './pages/patient/PatientProgress';
import BihuMemoryGame from './pages/patient/games/BihuMemoryGame';
import MekhelaPatternGame from './pages/patient/games/MekhelaPatternGame';
import TeaGardenRoutineGame from './pages/patient/games/TeaGardenRoutineGame';
import SoundsOfHillsGame from './pages/patient/games/SoundsOfHillsGame';
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

function RequireCaregiver({ children, currentUser, role }) {
  if (!currentUser) {
    return <Navigate to="/login?role=caregiver" replace />;
  }
  if (role === 'healthcare') {
    return <Navigate to="/clinician/dashboard" replace />;
  }
  if (role !== 'caregiver') {
    return <Navigate to="/patient/home" replace />;
  }
  return children;
}

function RequireClinician({ children, currentUser, role }) {
  if (!currentUser) {
    return <Navigate to="/login?role=healthcare" replace />;
  }
  if (role === 'caregiver') {
    return <Navigate to="/caregiver/dashboard" replace />;
  }
  if (role !== 'healthcare') {
    return <Navigate to="/patient/home" replace />;
  }
  return children;
}

function RequireAuth({ children, currentUser }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const { currentUser, role } = useAuth();
  const { isOpen: isAssistantOpen, closeAssistant, openAssistant, contextData } = useAssistant();
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Check if current route is patient experience
  const isPatientRoute = location.pathname.startsWith('/patient') || (role === 'patient' && location.pathname === '/community');
  const isGameActive = location.pathname.startsWith('/patient/games/') && location.pathname !== '/patient/games';
  const isPublicPage = location.pathname === '/' || location.pathname === '/role-select' || location.pathname === '/login' || location.pathname === '/reset-password';
  const isAssistantRoute = location.pathname === '/assistant';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans pb-24 md:pb-28 transition-colors duration-200 relative">
      {/* Ambient Cinematic Background for Public/Auth routes */}
      {isPublicPage && <CinematicAuthBackground />}

      {/* Universal Header (Persistent across whole app) */}
      <Header onOpenEmergency={() => setIsEmergencyOpen(true)} />

      {/* Main Content View */}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/role-select" element={<RoleSelectPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User Profile & Account Settings (Require Auth) */}
          <Route
            path="/profile"
            element={
              <RequireAuth currentUser={currentUser}>
                <ProfilePage />
              </RequireAuth>
            }
          />

          {/* Patient Routes */}
          <Route path="/patient/home" element={<RequireAuth currentUser={currentUser}><PatientHome /></RequireAuth>} />
          <Route path="/patient/games" element={<RequireAuth currentUser={currentUser}><PatientGamesList /></RequireAuth>} />
          <Route path="/patient/games/bihu" element={<RequireAuth currentUser={currentUser}><BihuMemoryGame /></RequireAuth>} />
          <Route path="/patient/games/mekhela" element={<RequireAuth currentUser={currentUser}><MekhelaPatternGame /></RequireAuth>} />
          <Route path="/patient/games/teagarden" element={<RequireAuth currentUser={currentUser}><TeaGardenRoutineGame /></RequireAuth>} />
          <Route path="/patient/games/soundshills" element={<RequireAuth currentUser={currentUser}><SoundsOfHillsGame /></RequireAuth>} />
          <Route path="/patient/reminders" element={<RequireAuth currentUser={currentUser}><PatientReminders /></RequireAuth>} />
          <Route path="/patient/progress" element={<RequireAuth currentUser={currentUser}><PatientProgress /></RequireAuth>} />

          {/* Dedicated AI Assistant Hub */}
          <Route path="/assistant" element={<AiErrorBoundary><AssistantPage /></AiErrorBoundary>} />

          {/* Global Dementia Community Routes */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/patient/community" element={<CommunityPage />} />

          {/* Caregiver Dashboard (Guarded for Caregiver) */}
          <Route
            path="/caregiver/dashboard"
            element={
              <RequireCaregiver currentUser={currentUser} role={role}>
                 <CaregiverDashboard />
              </RequireCaregiver>
            }
          />

          {/* Healthcare Clinician Dashboard (Guarded for Healthcare Clinician) */}
          <Route
            path="/clinician/dashboard"
            element={
              <RequireClinician currentUser={currentUser} role={role}>
                <ClinicianDashboard />
              </RequireClinician>
            }
          />

          {/* Smriti Economy & Rewards Hub */}
          <Route
            path="/economy"
            element={
              <RequireAuth currentUser={currentUser}>
                <EconomyHubPage />
              </RequireAuth>
            }
          />
          <Route
            path="/economy/:tab"
            element={
              <RequireAuth currentUser={currentUser}>
                <EconomyHubPage />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Elder-Friendly Bottom Navigation (Visible in Patient Mode, hidden during active game screen) */}
      {isPatientRoute && !isGameActive && (
        <PatientNav onOpenEmergency={() => setIsEmergencyOpen(true)} />
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
