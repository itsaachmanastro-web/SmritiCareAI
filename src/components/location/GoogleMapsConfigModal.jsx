import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mapsConfigService } from '../../services/location/mapsConfigService';
import { useLanguage } from '../../context/LanguageContext';

export default function GoogleMapsConfigModal({ isOpen, onClose, onConfigSaved = () => {} }) {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { connected: boolean, message: string }
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setToastMessage('');
      mapsConfigService.getStatus().then(res => {
        setIsConfigured(Boolean(res.hasKey));
      });
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!apiKey.trim()) {
      setToastMessage(t('location.enterValidKey') || 'Please enter an API key.');
      return;
    }

    setIsSaving(true);
    setToastMessage('');
    const res = await mapsConfigService.saveKey(apiKey);
    setIsSaving(false);

    if (res.success) {
      setIsConfigured(true);
      setToastMessage(t('location.keySavedSuccess') || 'Google Maps API key saved successfully.');
      onConfigSaved();
      setTimeout(() => {
        setToastMessage('');
      }, 3500);
    } else {
      setToastMessage(res.error || 'Failed to save API key.');
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await mapsConfigService.testConnection(apiKey || null);
    setIsTesting(false);
    setTestResult(res);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#0E2420] text-emerald-700 dark:text-[#2DD4BF] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#192320] dark:text-white leading-tight">
                  {t('location.mapsConfigTitle') || 'Google Maps API Configuration'}
                </h3>
                <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] font-medium">
                  {t('location.mapsConfigSub') || 'Configure your Google Maps API key for high-definition live satellite & terrain tracking.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D]">
            <span className="text-xs font-bold text-[#6E7D76] dark:text-[#889B95]">
              {t('common.status') || 'Status'}:
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className={`text-xs font-bold ${isConfigured ? 'text-emerald-700 dark:text-[#2DD4BF]' : 'text-amber-700 dark:text-amber-400'}`}>
                {isConfigured ? (t('location.connected') || 'Connected / Key Configured') : (t('location.notConnected') || 'Not Connected / OpenStreetMap Fallback Active')}
              </span>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#192320] dark:text-white flex items-center justify-between">
              <span>{t('location.googleMapsApiKey') || 'Google Maps API Key'}</span>
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-emerald-700 dark:text-[#2DD4BF] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{t('location.getApiKey') || 'Get API Key (Google Cloud)'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>

            <div className="relative">
              <Key className="w-4 h-4 text-[#8C9B95] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={isConfigured ? '••••••••••••••••••••••••••••••••' : 'AIzaSy... (Enter Google Maps Key)'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#121E22] text-xs font-mono text-[#192320] dark:text-white placeholder-[#8C9B95] dark:placeholder-[#64748B] rounded-2xl pl-10 pr-10 py-3 border border-[#ECE7DE] dark:border-[#18292D] focus:border-emerald-500 dark:focus:border-[#2DD4BF] outline-none transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Toast Notice */}
          {toastMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-[#0E2420] border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Diagnostic Result Box */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
              testResult.connected
                ? 'bg-emerald-50 dark:bg-[#0E2420] border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-[#2A1517] border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-start gap-2">
                {testResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {testResult.connected ? (t('location.testSuccess') || 'Connection Test Succeeded') : (t('location.testFailed') || 'Diagnostic Notice')}
                  </span>
                  <p className="mt-0.5">{testResult.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#ECE7DE] dark:border-[#18292D]">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 border border-[#ECE7DE] dark:border-[#18292D] text-xs font-bold text-[#192320] dark:text-white flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isTesting ? (t('location.testing') || 'Testing...') : (t('location.testConnection') || 'Test Connection')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#6E7D76] dark:text-[#CBD5E1] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-2xl bg-[#143D30] hover:bg-[#0E2F25] dark:bg-[#2DD4BF] dark:text-[#091113] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (t('common.saving') || 'Saving...') : (t('location.saveApiKey') || 'Save API Key')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
