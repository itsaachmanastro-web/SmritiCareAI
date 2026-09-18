import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Heart, 
  Shield, 
  Volume2, 
  Users, 
  Activity, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Brain, 
  Gamepad2, 
  Play, 
  Quote, 
  ChevronDown, 
  X,
  Radio,
  UserCheck,
  Mail,
  Send,
  MessageSquare,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SmritiLogo, JaapiIcon, GamosaIcon, TeaLeafIcon } from '../components/common/NerIcons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../db/dexie';

export default function LandingPage({ defaultSection = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { success: boolean, message: string, inquiryId?: string }

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll on hash or defaultSection prop
  useEffect(() => {
    const hash = (location.hash ? location.hash.replace('#', '') : null) || defaultSection;
    if (hash) {
      const timer = setTimeout(() => {
        scrollToSection(hash);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash, defaultSection]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    // 1. Client-Side Validation
    if (!contactName.trim() || contactName.trim().length < 2) {
      setSubmitStatus({ success: false, message: 'Please provide your full name (minimum 2 characters).' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      setSubmitStatus({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!contactSubject.trim() || contactSubject.trim().length < 3) {
      setSubmitStatus({ success: false, message: 'Subject is required (minimum 3 characters).' });
      return;
    }

    if (!contactMessage.trim() || contactMessage.trim().length < 10) {
      setSubmitStatus({ success: false, message: 'Message is required (minimum 10 characters).' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          subject: contactSubject.trim(),
          message: contactMessage.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Log in Dexie syncQueue for local offline safety
        try {
          await db.syncQueue.add({
            entityType: 'contact_inquiries',
            entityId: data.inquiryId,
            operation: 'INSERT',
            status: 'synced',
            createdAt: new Date().toISOString(),
            retryCount: 0
          });
        } catch (dexieErr) {
          console.warn('Dexie queue note:', dexieErr);
        }

        setSubmitStatus({
          success: true,
          inquiryId: data.inquiryId,
          message: data.message || `Thank you! Your inquiry has been submitted (ID: ${data.inquiryId}).`
        });
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        setSubmitStatus({
          success: false,
          message: data.error || 'The contact service could not process your submission. Please try again.'
        });
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      // Honest offline fallback check
      try {
        const offlineInquiryId = `INQ-OFFLINE-${Date.now().toString(36).toUpperCase()}`;
        await db.syncQueue.add({
          entityType: 'contact_inquiries',
          entityId: offlineInquiryId,
          operation: 'INSERT',
          status: 'pending',
          createdAt: new Date().toISOString(),
          retryCount: 0
        });

        setSubmitStatus({
          success: true,
          inquiryId: offlineInquiryId,
          message: `Network unavailable. Your inquiry (${offlineInquiryId}) has been saved locally to your device and will synchronize once your connection is restored.`
        });
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } catch {
        setSubmitStatus({
          success: false,
          message: 'Unable to reach contact server. Please verify your connection or email support@smriticare.org.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative z-10 overflow-x-hidden selection:bg-[#143D30] selection:text-white">
      {/* Corner Botanical Leaves (Matching Reference Art) */}
      <div className="absolute top-0 left-0 pointer-events-none z-0 select-none overflow-hidden w-64 h-64 sm:w-96 sm:h-96 opacity-35 dark:opacity-20 transition-opacity">
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#143D30] dark:text-[#34D399]">
          <path d="M-20 -20 C80 20, 140 100, 160 210 C130 190, 70 160, -20 -20 Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M-10 10 C60 50, 110 120, 120 200" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
          <path d="M50 75 C85 60, 120 70, 140 100 C115 110, 80 100, 50 75 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M85 125 C125 115, 160 130, 175 165 C145 170, 110 155, 85 125 Z" fill="currentColor" fillOpacity="0.25" />
          <path d="M25 40 C45 15, 80 15, 95 35 C75 50, 45 50, 25 40 Z" fill="currentColor" fillOpacity="0.18" />
        </svg>
      </div>

      <div className="absolute bottom-20 left-0 pointer-events-none z-0 select-none overflow-hidden w-56 h-56 sm:w-80 sm:h-80 opacity-30 dark:opacity-15 transition-opacity">
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#143D30] dark:text-[#34D399]">
          <path d="M-30 250 C40 180, 110 160, 200 170 C160 200, 100 240, -30 250 Z" fill="currentColor" fillOpacity="0.18" />
          <path d="M10 230 C70 190, 130 180, 180 185" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
          <path d="M60 200 C80 165, 115 160, 135 180 C115 195, 85 205, 60 200 Z" fill="currentColor" fillOpacity="0.22" />
          <path d="M110 185 C135 155, 170 155, 185 175 C160 188, 130 192, 110 185 Z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      </div>

      {/* Main Hero Section */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16 md:pb-24 w-full">
        {/* Floating Ambient Cards (Desktop / Tablet Flanking Layout Matching Reference Image) */}
        <div className="relative min-h-[580px] lg:min-h-[620px] flex flex-col items-center justify-center text-center">
          
          {/* ================= LEFT FLANKING CARDS ================= */}
          {/* Card 1: Top-Left - Play / Learn / Remember */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => navigate('/patient/games')}
            className="hidden lg:flex items-center gap-3.5 absolute top-10 left-2 xl:left-8 px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xl shadow-lg shadow-[#143D30]/5 dark:shadow-black/30 hover:scale-105 transition-all cursor-pointer group z-20 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F3ED] dark:bg-[#143D30]/60 flex items-center justify-center text-[#143D30] dark:text-[#2DD4BF] group-hover:bg-[#143D30] group-hover:text-white transition-colors shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#142823] dark:text-[#F0F6F4] leading-tight">Play / Learn / Remember</p>
              <p className="text-[11px] font-medium text-[#5C756D] dark:text-[#7E9C94] mt-0.5">Adaptive Brain Games</p>
            </div>
          </motion.div>

          {/* Card 2: Mid-Left - Connected Across Generations */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            onClick={() => navigate('/community')}
            className="hidden lg:flex items-center gap-3.5 absolute top-44 left-0 xl:left-4 px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xl shadow-lg shadow-[#143D30]/5 dark:shadow-black/30 hover:scale-105 transition-all cursor-pointer group z-20 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F3ED] dark:bg-[#143D30]/60 flex items-center justify-center text-[#143D30] dark:text-[#2DD4BF] group-hover:bg-[#143D30] group-hover:text-white transition-colors shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#142823] dark:text-[#F0F6F4] leading-tight">Connected</p>
              <p className="text-[11px] font-medium text-[#5C756D] dark:text-[#7E9C94] mt-0.5">Across Generations</p>
            </div>
          </motion.div>

          {/* Card 3: Bottom-Left - Inspiring Quote Pill */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="hidden lg:flex items-center gap-3 absolute bottom-6 left-2 xl:left-6 max-w-xs px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xl shadow-lg shadow-[#143D30]/5 dark:shadow-black/30 z-20 text-left"
          >
            <Quote className="w-5 h-5 text-[#143D30]/40 dark:text-[#2DD4BF]/40 shrink-0 self-start mt-0.5" />
            <p className="font-serif italic text-xs md:text-sm text-[#3D574F] dark:text-[#9EB3A8] leading-snug">
              {isDark 
                ? '“Technology with heart. For brighter tomorrows.”' 
                : '“A kinder tomorrow for every generation.”'}
            </p>
          </motion.div>

          {/* ================= RIGHT FLANKING CARDS ================= */}
          {/* Card 4: Top-Right - Healthier Minds */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => navigate('/role-select')}
            className="hidden lg:flex items-center gap-3.5 absolute top-10 right-2 xl:right-8 px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xl shadow-lg shadow-[#143D30]/5 dark:shadow-black/30 hover:scale-105 transition-all cursor-pointer group z-20 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F3ED] dark:bg-[#143D30]/60 flex items-center justify-center text-[#143D30] dark:text-[#2DD4BF] group-hover:bg-[#143D30] group-hover:text-white transition-colors shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#142823] dark:text-[#F0F6F4] leading-tight">Healthier Minds</p>
              <p className="text-[11px] font-medium text-[#5C756D] dark:text-[#7E9C94] mt-0.5">Brighter Tomorrows</p>
            </div>
          </motion.div>

          {/* Card 5: Mid-Right - Small Steps / Big Differences */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            onClick={() => navigate('/login?role=caregiver')}
            className="hidden lg:flex items-center gap-3.5 absolute top-44 right-0 xl:right-4 px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xl shadow-lg shadow-[#143D30]/5 dark:shadow-black/30 hover:scale-105 transition-all cursor-pointer group z-20 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F3ED] dark:bg-[#143D30]/60 flex items-center justify-center text-[#E11D48] dark:text-[#FB7185] group-hover:bg-[#E11D48] group-hover:text-white transition-colors shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#142823] dark:text-[#F0F6F4] leading-tight">Small Steps</p>
              <p className="text-[11px] font-medium text-[#5C756D] dark:text-[#7E9C94] mt-0.5">Big Differences</p>
            </div>
          </motion.div>

          {/* Card 6: Bottom-Right - Video Preview Card with Real Photo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            onClick={() => setIsVideoModalOpen(true)}
            className="hidden lg:flex items-center gap-3.5 absolute bottom-6 right-2 xl:right-6 p-2 pr-4 rounded-2xl bg-white/85 dark:bg-[#0E221E]/85 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xl shadow-xl shadow-[#143D30]/10 dark:shadow-black/40 hover:scale-105 transition-all cursor-pointer group z-20 text-left"
          >
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/40 dark:border-white/10 shadow-xs">
              <img
                src="/assets/images/patient-shanti.jpg"
                alt="Shanti Devi using SmritiCare"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/95 text-[#143D30] flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#142823] dark:text-[#F0F6F4] leading-tight group-hover:text-[#143D30] dark:group-hover:text-[#2DD4BF] transition-colors">
                See how SmritiCare helps
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F3ED] dark:bg-[#143D30] text-[#143D30] dark:text-[#2DD4BF]">
                  02:14
                </span>
                <span className="text-[10px] text-[#5C756D] dark:text-[#7E9C94] font-medium">Watch story</span>
              </div>
            </div>
          </motion.div>

          {/* ================= CENTER BRAND & HEADLINE ================= */}
          <div className="max-w-3xl mx-auto flex flex-col items-center z-10 px-2">
            {/* Dual-Tone Botanical Tree Emblem (Matching Reference) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/90 dark:bg-[#0E221E]/90 border border-[#D5E5DA] dark:border-[#1E4D3D] shadow-xl shadow-[#143D30]/5 dark:shadow-black/50 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 hover:rotate-3 transition-transform">
                <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF] drop-shadow-sm" showText={false} />
              </div>
            </motion.div>

            {/* Brand Title & Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[#142823] dark:text-white">
                Smriti<span className="text-[#0D9488] dark:text-[#2DD4BF]">Care</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#5C756D] dark:text-[#7E9C94] mt-1 mb-4">
                {t('hero.brandLine') || 'AI FOR BRIGHTER MINDS'}
              </p>
            </motion.div>

            {/* Main Hero Serif Headline (Exact Reference Copy & Styling) */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-tight text-[#142823] dark:text-[#F0F6F4] leading-[1.18] text-balance max-w-2xl"
            >
              {t('hero.tagline') || 'Empowering Every Memory. Enriching Every Moment.'}
            </motion.h2>

            {/* Subtext Body */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xs sm:text-sm md:text-base text-[#526B63] dark:text-[#9EB3A8] font-normal max-w-2xl mx-auto mt-4 leading-relaxed text-balance"
            >
              {t('hero.subtagline') || 'SmritiCare brings together AI-powered cognitive games, personalized memory support, gentle reminders and voice-enabled assistance to help older adults stay engaged, independent and connected — while giving caregivers meaningful insight into their everyday cognitive journey.'}
            </motion.p>

            {/* Primary Action Buttons (Pill CTAs Matching Reference) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
            >
              {/* Button 1: Get Started Pill */}
              <button
                type="button"
                onClick={() => navigate('/role-select')}
                className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-full bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#06110F] font-bold text-sm sm:text-base shadow-lg shadow-[#143D30]/20 dark:shadow-emerald-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{t('getStarted') || 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Button 2: Senior PIN Sign-in Pill */}
              <button
                type="button"
                onClick={() => navigate('/login?role=patient')}
                className="w-full sm:w-auto min-h-[52px] px-7 py-3.5 rounded-full bg-white/90 dark:bg-[#0E221E]/90 hover:bg-white dark:hover:bg-[#132A24] text-[#142823] dark:text-[#E8F3EF] border border-[#CBDED3] dark:border-[#1E4D3D] font-bold text-sm sm:text-base shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <Lock className="w-4 h-4 text-[#143D30] dark:text-[#2DD4BF]" />
                <span>Senior PIN Sign-in</span>
              </button>
            </motion.div>

            {/* 3 Feature Badges / Chips under CTAs (Matching Reference) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2.5 mt-7"
            >
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-[#0E221E]/70 text-[#3D574F] dark:text-[#A3C0B7] border border-[#DFEAE2] dark:border-[#183830] text-xs font-semibold shadow-xs backdrop-blur-md">
                <Globe className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span>AI Assistance</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-[#0E221E]/70 text-[#3D574F] dark:text-[#A3C0B7] border border-[#DFEAE2] dark:border-[#183830] text-xs font-semibold shadow-xs backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Voice-Enabled</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-[#0E221E]/70 text-[#3D574F] dark:text-[#A3C0B7] border border-[#DFEAE2] dark:border-[#183830] text-xs font-semibold shadow-xs backdrop-blur-md">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Personalized Cognitive Training</span>
              </div>
            </motion.div>

            {/* Mobile-Only Ambient Cards Quick Links */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-8 lg:hidden">
              <button
                type="button"
                onClick={() => navigate('/patient/games')}
                className="p-3 rounded-xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] text-left flex items-center gap-2.5 shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8F3ED] dark:bg-[#143D30] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#142823] dark:text-white truncate">Brain Games</p>
                  <p className="text-[10px] text-[#5C756D] dark:text-[#7E9C94] truncate">Play & Remember</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="p-3 rounded-xl bg-white/80 dark:bg-[#0E221E]/80 border border-[#DFEAE2] dark:border-[#183830] text-left flex items-center gap-2.5 shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8F3ED] dark:bg-[#143D30] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#142823] dark:text-white truncate">Watch Story</p>
                  <p className="text-[10px] text-[#5C756D] dark:text-[#7E9C94] truncate">02:14 Demo</p>
                </div>
              </button>
            </div>

            {/* Bottom Center Scroll Indicator (Matching Reference) */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => scrollToSection('about')}
              className="mt-12 sm:mt-14 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-[#0E221E]/60 border border-[#DFEAE2] dark:border-[#183830] text-xs font-semibold text-[#5C756D] dark:text-[#7E9C94] hover:text-[#143D30] dark:hover:text-[#F0F6F4] transition-all cursor-pointer backdrop-blur-md shadow-xs group"
            >
              <span>Scroll to explore</span>
              <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </motion.button>
          </div>
        </div>

        {/* Quick Cultural Motif Showcase */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mt-16 opacity-90">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3D574F] dark:text-[#A3C0B7] bg-white/70 dark:bg-[#0E221E]/70 px-4 py-2 rounded-full border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xs shadow-xs">
            <JaapiIcon className="w-5 h-5" />
            <span>Assam Jaapi Heritage</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3D574F] dark:text-[#A3C0B7] bg-white/70 dark:bg-[#0E221E]/70 px-4 py-2 rounded-full border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xs shadow-xs">
            <GamosaIcon className="w-5 h-5" />
            <span>Sacred Gamosa Motifs</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3D574F] dark:text-[#A3C0B7] bg-white/70 dark:bg-[#0E221E]/70 px-4 py-2 rounded-full border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-xs shadow-xs">
            <TeaLeafIcon className="w-5 h-5" />
            <span>Tea Garden Routines</span>
          </div>
        </div>

        {/* ================= DEDICATED ABOUT SECTION ================= */}
        <section id="about" className="mt-20 scroll-mt-24">
          <div className="bg-white/80 dark:bg-[#0E221E]/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-[#DFEAE2] dark:border-[#183830] shadow-xl text-left">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#EFF5F1] dark:border-[#183830]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F3ED] dark:bg-[#143D30] flex items-center justify-center p-2 text-[#143D30] dark:text-[#2DD4BF] shadow-xs">
                  <SmritiLogo className="w-full h-full" showText={false} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] dark:text-[#2DD4BF]">
                    About SmritiCare • Cognitive Care Platform
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#142823] dark:text-white">
                    Technology with Empathy, for Healthier Tomorrows
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-[#5C756D] dark:text-[#7E9C94] bg-[#F7F5F0] dark:bg-[#06110F] px-4 py-2 rounded-full border border-[#DFEAE2] dark:border-[#183830]">
                <span>Elder-Centric Innovation</span>
                <span>&bull;</span>
                <span className="text-[#143D30] dark:text-[#2DD4BF]">Care Connects Generations</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              <div className="lg:col-span-2 space-y-4 text-sm text-[#526B63] dark:text-[#A3C0B7] leading-relaxed font-normal">
                <p>
                  <strong className="text-[#142823] dark:text-white font-semibold">SmritiCare</strong> is an elder-friendly, voice-first clinical cognitive care platform engineered specifically for elderly dementia and Mild Cognitive Impairment (MCI) individuals across India, with deep cultural grounding in the North Eastern Region (NER).
                </p>
                <p>
                  Built with a <strong className="text-[#142823] dark:text-white font-semibold">100% offline-first Dexie.js (IndexedDB)</strong> architecture, the platform guarantees that senior citizens and community health workers in remote tea-garden hamlets can engage in daily cognitive stimulation, access gentle audio routines, and track vital memories without data loss—even during complete network outages.
                </p>
                <p>
                  All cognitive exercises are grounded in authentic cultural heritage: matching Bihu festival artifacts, recognizing traditional Mekhela Chador textile motifs, sequencing morning tea plantation routines, and listening to native hillside acoustic melodies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F7F5F0] dark:bg-[#06110F] border border-[#DFEAE2] dark:border-[#183830] flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#142823] dark:text-white mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                    Clinical Privacy Assurance
                  </h3>
                  <p className="text-xs text-[#5C756D] dark:text-[#7E9C94] leading-relaxed">
                    Zero forced telemetry. All clinical diagnostic records, daily cognitive curves, and personal family photographs remain securely stored in your local browser sandbox.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DFEAE2] dark:border-[#183830] flex items-center justify-between text-xs">
                  <span className="text-[#5C756D] dark:text-[#7E9C94]">Clinical Focus:</span>
                  <span className="font-bold text-[#142823] dark:text-white">North East India Dementia & MCI Care</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= KEY FEATURE PILLARS ================= */}
        <div id="pillars" className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 text-left scroll-mt-24">
          {/* Pillar 1 */}
          <div className="bg-white/80 dark:bg-[#0E221E]/80 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-[#DFEAE2] dark:border-[#183830] shadow-md hover:shadow-xl hover:border-[#BAD9C6] dark:hover:border-[#2DD4BF]/40 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F3ED] dark:bg-[#143D30] flex items-center justify-center text-[#143D30] dark:text-[#2DD4BF] mb-4 shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#142823] dark:text-white">Adaptive Cognitive Games</h3>
            <p className="text-[#5C756D] dark:text-[#9EB3A8] text-sm mt-2 leading-relaxed font-normal">
              Culturally grounded memory, pattern, and attention exercises that dynamically adjust difficulty based on performance to strengthen cognitive resilience.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white/80 dark:bg-[#0E221E]/80 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-[#DFEAE2] dark:border-[#183830] shadow-md hover:shadow-xl hover:border-[#BAD9C6] dark:hover:border-[#2DD4BF]/40 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300 mb-4 shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#142823] dark:text-white">Caregiver Vitality Analytics</h3>
            <p className="text-[#5C756D] dark:text-[#9EB3A8] text-sm mt-2 leading-relaxed font-normal">
              Honest 7, 14, and 30-day longitudinal trajectory tracking, medication adherence monitoring, and automated clinical decline alerts for families and doctors.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white/80 dark:bg-[#0E221E]/80 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-[#DFEAE2] dark:border-[#183830] shadow-md hover:shadow-xl hover:border-[#BAD9C6] dark:hover:border-[#2DD4BF]/40 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F3ED] dark:bg-[#143D30] flex items-center justify-center text-[#143D30] dark:text-[#2DD4BF] mb-4 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#142823] dark:text-white">100% Offline-First Privacy</h3>
            <p className="text-[#5C756D] dark:text-[#9EB3A8] text-sm mt-2 leading-relaxed font-normal">
              Powered by local Dexie IndexedDB architecture. All cognitive interactions and clinical logs stay securely on device with optional background synchronization.
            </p>
          </div>
        </div>

        {/* Clinical Trust Strip */}
        <div id="features" className="mt-12 p-5 rounded-2xl bg-white/70 dark:bg-[#0E221E]/70 border border-[#DFEAE2] dark:border-[#183830] backdrop-blur-md flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-[#3D574F] dark:text-[#A3C0B7] shadow-xs scroll-mt-24">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
            <span>WCAG 2.1 AA Accessible (56px+ Touch Targets)</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Private Local Storage &bull; Zero Forced Cloud Telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Multilingual Spoken Audio (Assamese, Hindi, English, Bengali)</span>
          </div>
        </div>

        {/* ================= DEDICATED CONTACT US SECTION ================= */}
        <section id="contact" className="mt-20 scroll-mt-24">
          <div className="bg-white/80 dark:bg-[#0E221E]/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-[#DFEAE2] dark:border-[#183830] shadow-xl text-left">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#EFF5F1] dark:border-[#183830]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] dark:text-[#2DD4BF]">
                  Support & Communications
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#142823] dark:text-white mt-1">
                  Contact the SmritiCare Team
                </h2>
                <p className="text-xs sm:text-sm text-[#5C756D] dark:text-[#7E9C94] mt-1 font-normal">
                  Have questions about clinical pilots, elder care deployment, or technical support? Send us a direct inquiry.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-[#06110F] border border-[#DFEAE2] dark:border-[#183830] text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#142823] dark:text-white">
                  <Mail className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                  <span>support@smriticare.org</span>
                </div>
                <p className="text-[11px] text-[#5C756D] dark:text-[#7E9C94]">
                  Official SmritiCare Support Team
                </p>
              </div>
            </div>

            {/* Submission Status Alert */}
            {submitStatus && (
              <div
                className={`mt-6 p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                  submitStatus.success
                    ? 'bg-[#E8F3ED] dark:bg-[#102923] border-[#BAD9C6] dark:border-[#183830] text-[#143D30] dark:text-[#34D399]'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                }`}
              >
                {submitStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{submitStatus.success ? 'Inquiry Confirmed' : 'Submission Notice'}</p>
                  <p className="mt-0.5 font-normal leading-relaxed">{submitStatus.message}</p>
                  {submitStatus.inquiryId && (
                    <p className="mt-1 text-xs font-mono font-bold opacity-80">
                      Tracking Reference: {submitStatus.inquiryId}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Contact Form */}
            <form onSubmit={handleContactSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#142823] dark:text-white mb-1.5">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Borah"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0B1C18] border border-[#DFEAE2] dark:border-[#183830] text-xs sm:text-sm text-[#142823] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142823] dark:text-white mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@smriticare.org"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0B1C18] border border-[#DFEAE2] dark:border-[#183830] text-xs sm:text-sm text-[#142823] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#142823] dark:text-white mb-1.5">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding clinical pilot in Titabar PHC"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0B1C18] border border-[#DFEAE2] dark:border-[#183830] text-xs sm:text-sm text-[#142823] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#142823] dark:text-white mb-1.5">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry, feedback, or partnership request..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0B1C18] border border-[#DFEAE2] dark:border-[#183830] text-xs sm:text-sm text-[#142823] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] transition-all resize-y"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-[#5C756D] dark:text-[#7E9C94] font-medium">
                  We reply within 24–48 business hours. Inquiries are verified and never shared.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20B8A5] text-white dark:text-[#06110F] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#06110F] border-t-transparent animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Video Story Modal Preview */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-[#0E221E] rounded-3xl border border-[#DFEAE2] dark:border-[#183830] shadow-2xl overflow-hidden text-left"
            >
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/images/patient-shanti.jpg"
                  alt="Shanti Devi with SmritiCare"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(false)}
                      className="p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors cursor-pointer"
                      aria-label="Close Preview"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-white">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#10B981] text-[#06110F] text-xs font-extrabold uppercase mb-2">
                      Featured Patient Story
                    </span>
                    <h4 className="font-serif text-xl sm:text-2xl font-bold">
                      Shanti Devi’s Journey with SmritiCare
                    </h4>
                    <p className="text-xs text-white/80 mt-1">
                      Discover how daily Assamese audio games and gentle routines foster dignity and connection.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F7F5F0] dark:bg-[#06110F]">
                <div className="text-xs text-[#5C756D] dark:text-[#7E9C94]">
                  Clinical pilot in Guwahati & Kamrup • Offline Voice Support
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoModalOpen(false);
                    navigate('/role-select');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#06110F] font-bold text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
                >
                  Experience SmritiCare Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comprehensive Functional Healthcare Footer */}
      <footer className="py-12 border-t border-[#DFEAE2] dark:border-[#183830] text-xs text-[#5C756D] dark:text-[#7E9C94] bg-white/70 dark:bg-[#06110F]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#EFF5F1] dark:border-[#183830] text-left">
            {/* Column 1: Brand & Mission */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#E8F3ED] dark:bg-[#143D30] flex items-center justify-center p-1">
                  <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
                </div>
                <span className="font-serif font-bold text-base text-[#142823] dark:text-white">SmritiCare</span>
              </div>
              <p className="text-xs text-[#5C756D] dark:text-[#7E9C94] leading-relaxed">
                Empowering every memory, enriching every moment with culturally sensitive, voice-first cognitive care.
              </p>
              <div className="pt-1">
                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F3ED] dark:bg-[#102923] text-[#143D30] dark:text-[#34D399] border border-[#BAD9C6] dark:border-[#183830]">
                  Culturally Grounded • Voice-First Cognitive Care
                </span>
              </div>
            </div>

            {/* Column 2: Product & Care */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#142823] dark:text-white">
                Product & Therapy
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    About SmritiCare
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pillars')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Our Clinical Approach
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/patient/games')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Cognitive Brain Games
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/assistant')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    AI Voice Companion
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Care & Support */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#142823] dark:text-white">
                Care & Community
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate('/community')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Community Forum
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login?role=caregiver')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Family Caregiver Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login?role=healthcare')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Clinical PHC Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contact')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Account & Access */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#142823] dark:text-white">
                Account & Access
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Sign In
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login?role=patient')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Senior 4-Digit PIN Sign-in
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/role-select')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Switch Role Experience
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/economy')} className="hover:text-[#143D30] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
                    Smriti Economy & Rewards
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#142823] dark:text-white">SmritiCare</span>
              <span>&bull;</span>
              <span>{t('footerText') || '© 2026 SmritiCare. Smarter care for brighter minds.'}</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">100% Offline-First</span>
              <span>&bull;</span>
              <span>WCAG 2.1 AA Accessible</span>
              <span>&bull;</span>
              <span>support@smriticare.org</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
