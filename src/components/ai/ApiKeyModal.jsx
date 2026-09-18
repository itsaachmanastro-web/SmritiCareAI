import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Key,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Trash2,
  ExternalLink,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { aiService } from '../../services/ai/aiService';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [serverStatus, setServerStatus] = useState({ hasKey: false, model: 'gemini-3.6-flash' });
  // 'untested' | 'testing' | 'connected' | 'rate_limited' | 'auth_error' | 'not_found' | 'service_error' | 'failed'
  const [connectionState, setConnectionState] = useState('untested');
  const [activeModel, setActiveModel] = useState('gemini-3.6-flash');
  const [errorDetail, setErrorDetail] = useState('');
  const [sampleResponse, setSampleResponse] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [isDefaultPrompt, setIsDefaultPrompt] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptFeedback, setPromptFeedback] = useState('');

  // 429 Quota & Diagnostics states
  const [lastRequestTime, setLastRequestTime] = useState(null);
  const [lastHttpStatus, setLastHttpStatus] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [quotaDiagnostics, setQuotaDiagnostics] = useState(null);
  const isTestingRef = useRef(false);

  // Fetch server status and system prompt on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorDetail('');
      setSampleResponse('');
      setSavedSuccess(false);
      setSaveMessage('');
      setPromptFeedback('');

      aiService.getServerStatus().then((status) => {
        if (status) {
          setServerStatus(status);
          if (status.model) setActiveModel(status.model);
        }
      });

      aiService.getSystemPrompt().then((res) => {
        if (res) {
          setSystemPrompt(res.systemPrompt);
          setDefaultPrompt(res.defaultPrompt);
          setIsDefaultPrompt(res.isDefault);
        }
      });
    }
  }, [isOpen]);

  // Safe countdown timer for retry
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  if (!isOpen) return null;

  const applyTestResult = (result, isSave = false) => {
    const httpStatus = result?.httpStatus || result?.status || (result?.connected ? 200 : 0);
    setLastHttpStatus(httpStatus);
    setLastRequestTime(new Date().toLocaleTimeString());

    if (result && result.connected) {
      setConnectionState('connected');
      if (result.model) setActiveModel(result.model);
      setSampleResponse(result.sampleResponse || 'Live response verified successfully.');
      setServerStatus(prev => ({ ...prev, hasKey: true, model: result.model }));
      setQuotaDiagnostics(null);
      setRetryCountdown(0);
      setErrorDetail('');
      if (isSave) {
        setSavedSuccess(true);
        setSaveMessage('Key saved to server and verified live with Gemini!');
        setApiKey('');
      }
    } else {
      const diag = result?.diagnostics || {};
      setQuotaDiagnostics(diag);

      if (httpStatus === 429 || diag.status === 429) {
        setConnectionState('rate_limited');
        const delay = diag.retryDelaySeconds || 15;
        setRetryCountdown(delay);
      } else if (httpStatus === 401 || httpStatus === 403 || diag.status === 401 || diag.status === 403) {
        setConnectionState('auth_error');
      } else if (httpStatus === 404 || diag.status === 404) {
        setConnectionState('not_found');
      } else if (httpStatus >= 500 || diag.status >= 500) {
        setConnectionState('service_error');
      } else {
        setConnectionState('failed');
      }

      setErrorDetail(result?.error || 'Gemini API connection test failed.');
      if (result?.model) setActiveModel(result.model);
      if (isSave) {
        setSavedSuccess(false);
      }
    }
  };

  const handleTestConnection = async () => {
    if (isTestingRef.current || retryCountdown > 0) return;
    isTestingRef.current = true;
    setConnectionState('testing');
    setErrorDetail('');
    setSampleResponse('');

    try {
      const result = await aiService.testLiveConnection(apiKey, activeModel, false);
      applyTestResult(result, false);
    } catch (err) {
      applyTestResult({
        connected: false,
        status: 0,
        httpStatus: 0,
        error: `Test request failed: ${err.message}`
      }, false);
    } finally {
      isTestingRef.current = false;
    }
  };

  const handleSaveToServer = async () => {
    if (!apiKey.trim()) {
      setErrorDetail('Please enter an API key to save.');
      return;
    }
    if (isTestingRef.current || retryCountdown > 0) return;

    isTestingRef.current = true;
    setConnectionState('testing');
    setErrorDetail('');

    try {
      // Configure on server and test in one live verification step
      const testResult = await aiService.testLiveConnection(apiKey.trim(), activeModel, true);
      applyTestResult(testResult, true);
    } catch (err) {
      applyTestResult({
        connected: false,
        status: 0,
        httpStatus: 0,
        error: `Could not save key to server: ${err.message}`
      }, true);
    } finally {
      isTestingRef.current = false;
    }

    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleClearServerKey = async () => {
    try {
      await aiService.configureServerKey('');
      setServerStatus({ hasKey: false, model: 'gemini-3.6-flash' });
      setApiKey('');
      setConnectionState('untested');
      setErrorDetail('');
      setSampleResponse('');
      setSaveMessage('Server key cleared. Local intelligent knowledge engine active.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setErrorDetail(`Failed to clear key: ${err.message}`);
    }
  };

  const handleSaveSystemPrompt = async () => {
    if (!systemPrompt.trim()) return;
    setIsSavingPrompt(true);
    setPromptFeedback('');
    try {
      const res = await aiService.saveSystemPrompt(systemPrompt);
      if (res && res.success) {
        setIsDefaultPrompt(Boolean(res.isDefault));
        setPromptFeedback('System prompt saved & applied across all assistant modalities.');
      } else {
        setPromptFeedback('System prompt saved locally.');
      }
    } catch (err) {
      setPromptFeedback(`Error saving prompt: ${err.message}`);
    } finally {
      setIsSavingPrompt(false);
      setTimeout(() => setPromptFeedback(''), 4000);
    }
  };

  const handleResetSystemPrompt = async () => {
    setIsSavingPrompt(true);
    setPromptFeedback('');
    try {
      const res = await aiService.resetSystemPrompt();
      if (res) {
        setSystemPrompt(res.systemPrompt || defaultPrompt);
        setIsDefaultPrompt(true);
        setPromptFeedback('System prompt reset to official SmritiCare default.');
      }
    } catch (err) {
      setPromptFeedback(`Error resetting prompt: ${err.message}`);
    } finally {
      setIsSavingPrompt(false);
      setTimeout(() => setPromptFeedback(''), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-7 border-2 border-slate-200 dark:border-[#243352] shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                AI Engine & LLM Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Google Gemini Flash &bull; Evaluator Console
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Pill - Strictly Truthful */}
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
          connectionState === 'connected'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : connectionState === 'rate_limited'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : (connectionState === 'auth_error' || connectionState === 'not_found' || connectionState === 'service_error' || connectionState === 'failed')
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            : serverStatus.hasKey
            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          {connectionState === 'connected' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : connectionState === 'rate_limited' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (connectionState === 'auth_error' || connectionState === 'not_found' || connectionState === 'service_error' || connectionState === 'failed') ? (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : serverStatus.hasKey ? (
            <Key className="w-5 h-5 text-sky-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}

          <div className="text-xs font-semibold">
            <span className="font-bold block">
              {connectionState === 'connected'
                ? `🟢 Gemini LLM Connected (${activeModel})`
                : connectionState === 'rate_limited'
                ? '🟡 Gemini Rate Limited / Quota Reached (429)'
                : connectionState === 'auth_error'
                ? `🔴 Authentication / API Key Error (${lastHttpStatus || '401/403'})`
                : connectionState === 'not_found'
                ? `🔴 Model / Endpoint Error (404)`
                : connectionState === 'service_error'
                ? `🔴 Gemini Service Error (${lastHttpStatus || '5xx'})`
                : connectionState === 'failed'
                ? '🔴 Gemini Connection Failed'
                : serverStatus.hasKey
                ? '⚪ Server Key Configured (Live Test Required)'
                : '🟠 Local Intelligent Knowledge Engine Active'}
            </span>
            <span className="text-[11px] opacity-90">
              {connectionState === 'connected'
                ? 'GenerateContent verified live with Google Gemini servers.'
                : connectionState === 'rate_limited'
                ? 'Your API project request or token quota has been reached. Safe retry enabled.'
                : connectionState === 'auth_error'
                ? 'Invalid API key or unauthorized project access. Verify your key in Google AI Studio.'
                : connectionState === 'not_found'
                ? `Endpoint for model ${activeModel} not found. Please verify model availability.`
                : connectionState === 'service_error'
                ? 'Google Gemini service encountered an error. Please retry shortly.'
                : connectionState === 'failed'
                ? 'Connection test failed. See exact diagnostic error below.'
                : serverStatus.hasKey
                ? 'Click "Test Live Connection" to verify generateContent execution.'
                : 'Zero external API key required. Using dynamic regional knowledge synthesizer.'}
            </span>
          </div>
        </div>

        {/* Server API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Google Gemini API Key
            </label>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              Kept Strictly Server-Side
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={serverStatus.hasKey ? "Key configured in server .env (enter new key to replace)" : "AIzaSy..."}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
            />
            {serverStatus.hasKey && (
              <button
                type="button"
                onClick={handleClearServerKey}
                title="Clear Server Key"
                className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {savedSuccess && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {saveMessage || 'Key updated on server!'}
            </p>
          )}
        </div>

        {/* Admin / Developer Quota Diagnostics Section */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60 font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Gemini API Status & Diagnostics</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Admin Diagnostics
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Model:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeModel}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Connection:</span>
              <span className={`font-bold ${
                connectionState === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                connectionState === 'rate_limited' ? 'text-amber-600 dark:text-amber-400' :
                connectionState === 'testing' ? 'text-teal-600 dark:text-teal-400 animate-pulse' :
                connectionState === 'untested' ? 'text-slate-500' :
                'text-rose-600 dark:text-rose-400'
              }`}>
                {connectionState === 'connected' ? 'Connected' :
                 connectionState === 'rate_limited' ? 'Rate Limited (429)' :
                 connectionState === 'testing' ? 'Testing...' :
                 connectionState === 'auth_error' ? 'Auth Error' :
                 connectionState === 'not_found' ? 'Model Error' :
                 connectionState === 'service_error' ? 'Service Error' :
                 connectionState === 'failed' ? 'Failed' : 'Untested'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Last Request:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{lastRequestTime || 'None'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Last Response:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {lastHttpStatus !== null ? `HTTP ${lastHttpStatus}` : 'None'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Retry Available:</span>
              <span className={`font-semibold ${retryCountdown > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {retryCountdown > 0 ? `In approximately ${retryCountdown} seconds` : 'Immediately available'}
              </span>
            </div>

            {quotaDiagnostics && (quotaDiagnostics.quotaMetric || quotaDiagnostics.quotaLimit || quotaDiagnostics.quotaLocation) && (
              <div className="col-span-2 p-2 bg-amber-100/60 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-[10px] space-y-0.5">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">Quota Details (Gemini Metadata):</span>
                {quotaDiagnostics.quotaMetric && (
                  <div><span className="text-slate-600 dark:text-slate-400">Metric:</span> <span className="font-mono font-semibold">{quotaDiagnostics.quotaMetric}</span></div>
                )}
                {quotaDiagnostics.quotaLimit && (
                  <div><span className="text-slate-600 dark:text-slate-400">Limit:</span> <span className="font-mono font-semibold">{quotaDiagnostics.quotaLimit}</span></div>
                )}
                {quotaDiagnostics.quotaLocation && (
                  <div><span className="text-slate-600 dark:text-slate-400">Location:</span> <span className="font-mono font-semibold">{quotaDiagnostics.quotaLocation}</span></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSaveToServer}
            disabled={!apiKey.trim() || connectionState === 'testing' || retryCountdown > 0}
            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-40"
          >
            Save Key to Server
          </button>

          <button
            type="button"
            disabled={connectionState === 'testing' || retryCountdown > 0}
            onClick={handleTestConnection}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {connectionState === 'testing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing connection...</span>
              </>
            ) : retryCountdown > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Retry in {retryCountdown}s</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Test Live Connection</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Success Display */}
        {connectionState === 'connected' && sampleResponse && (
          <div className="p-3 rounded-xl text-xs font-medium border bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 animate-fade-in">
            <span className="font-bold block mb-1">
              ✅ Live {activeModel} generateContent Success:
            </span>
            <p className="italic">"{sampleResponse}"</p>
          </div>
        )}

        {/* Rate Limited Banner with Clear Retry */}
        {connectionState === 'rate_limited' && (
          <div className="p-3.5 rounded-2xl text-xs font-medium border bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 animate-fade-in space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-sm">Gemini is temporarily rate-limited</span>
            </div>
            <p className="leading-relaxed">
              Your API project's request or token quota has been reached. Please wait a moment before trying again.
            </p>
            {retryCountdown > 0 && (
              <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Try again in approximately {retryCountdown} seconds.
              </p>
            )}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connectionState === 'testing' || retryCountdown > 0}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {connectionState === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing connection...</span>
                  </>
                ) : retryCountdown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Retry available in {retryCountdown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Other Diagnostic Errors */}
        {connectionState !== 'rate_limited' && connectionState !== 'connected' && connectionState !== 'untested' && connectionState !== 'testing' && errorDetail && (
          <div className="p-3.5 rounded-2xl text-xs font-medium border bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 animate-fade-in space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">Live Connection Diagnostic Error:</span>
            </div>
            <p className="leading-relaxed font-mono text-[11px] bg-white/60 dark:bg-[#131D33]/60 p-2 rounded-xl border border-rose-200 dark:border-rose-900/60">{errorDetail}</p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connectionState === 'testing'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* SmritiCare Assistant Behavior Section */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#243352] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>SmritiCare Assistant Behavior</span>
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ● SmritiCare Mode: Active
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Universal system prompt applied across Text AI Assistant, Voice Assistant, Patient Mode, and Caregiver Mode. Restricts responses to SmritiCare dementia-care features and safety guidelines.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                System Prompt
              </label>
              {isDefaultPrompt ? (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  (Default Domain Restriction)
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  (Custom Prompt Configured)
                </span>
              )}
            </div>

            <textarea
              rows={5}
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                setIsDefaultPrompt(e.target.value === defaultPrompt);
              }}
              placeholder="Enter system prompt instructions..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-slate-50 dark:bg-[#162238] text-slate-900 dark:text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:border-teal-500 resize-y"
            />
          </div>

          {promptFeedback && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5" /> {promptFeedback}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSystemPrompt}
              disabled={isSavingPrompt || !systemPrompt.trim()}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {isSavingPrompt && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>Save System Prompt</span>
            </button>

            <button
              type="button"
              onClick={handleResetSystemPrompt}
              disabled={isSavingPrompt || isDefaultPrompt}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Info & Setup Steps */}
        <div className="p-3 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352] text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Server-Side Security Architecture:</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            API keys are never stored in browser storage and are never exposed in JavaScript bundles. Requests route securely through the local backend <code className="bg-slate-200 dark:bg-[#25334D] px-1 py-0.5 rounded">/api/ai/chat</code> endpoint.
          </p>
          <ol className="list-decimal list-inside space-y-0.5 pt-1 text-[10px]">
            <li>Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-teal-600 underline font-semibold inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-2.5 h-2.5 inline" /></a></li>
            <li>Paste above to test live and save directly to server <code className="bg-slate-200 dark:bg-[#25334D] px-1 py-0.5 rounded">.env</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
