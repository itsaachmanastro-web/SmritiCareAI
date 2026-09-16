/**
 * Centralized Provider-Independent AI Service Gateway
 * Connects frontend UI to real Gemini LLM API via backend /api/ai/chat endpoint,
 * with multi-turn conversation memory, request cancellation, server-side key security,
 * and graceful offline local knowledge fallback.
 */
import { localFallbackProvider } from './localFallbackProvider.js';
import { getLanguage, SUPPORTED_LANGUAGES } from '../translation/languageRegistry.js';
import { DEFAULT_SYSTEM_PROMPT } from '../../config/aiConfig.js';

const getBaseUrl = () => {
  const customUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';
  if (customUrl) return customUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return '';
  return '';
};

export class AIService {
  constructor() {
    this._currentTestPromise = null;
  }

  /**
   * Check server-side AI configuration status
   */
  async getServerStatus() {
    try {
      const res = await fetch(`${getBaseUrl()}/api/ai/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Could not fetch server AI status:', err);
    }
    return { hasKey: false, model: 'gemini-3.5-flash', defaultModel: 'gemini-3.5-flash' };
  }

  /**
   * Configure API key securely on the server
   */
  async configureServerKey(apiKey, model = null) {
    const res = await fetch(`${getBaseUrl()}/api/ai/configure-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model })
    });
    return await res.json();
  }

  /**
   * Test live connection to Google Gemini API
   * Deduplicates rapid concurrent test clicks to avoid duplicate API requests.
   */
  async testLiveConnection(apiKey = '', model = null, saveKey = false) {
    if (this._currentTestPromise) {
      return this._currentTestPromise;
    }

    this._currentTestPromise = (async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/ai/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: (apiKey || '').trim(),
            model,
            saveKey
          })
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = { error: `Server returned status ${res.status}` };
        }

        return {
          ...data,
          httpStatus: res.status,
          status: data.status || res.status
        };
      } catch (err) {
        return {
          connected: false,
          status: 0,
          httpStatus: 0,
          error: `❌ Could not connect to local server test endpoint: ${err.message}`,
          model: model || 'gemini-3.5-flash'
        };
      } finally {
        this._currentTestPromise = null;
      }
    })();

    return this._currentTestPromise;
  }

  /**
   * Get cached system prompt from localStorage
   */
  getCachedSystemPrompt() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('smriti_system_prompt') || null;
      }
    } catch {}
    return null;
  }

  /**
   * Fetch current system prompt (server first, then local cache / default)
   */
  async getSystemPrompt() {
    try {
      const res = await fetch(`${getBaseUrl()}/api/ai/system-prompt`);
      if (res.ok) {
        const data = await res.json();
        if (data.systemPrompt && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('smriti_system_prompt', data.systemPrompt);
        }
        return {
          systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT,
          defaultPrompt: data.defaultPrompt || DEFAULT_SYSTEM_PROMPT,
          isDefault: Boolean(data.isDefault)
        };
      }
    } catch (err) {
      console.warn('Could not fetch system prompt from server:', err);
    }

    const cached = this.getCachedSystemPrompt();
    return {
      systemPrompt: cached || DEFAULT_SYSTEM_PROMPT,
      defaultPrompt: DEFAULT_SYSTEM_PROMPT,
      isDefault: !cached || cached === DEFAULT_SYSTEM_PROMPT
    };
  }

  /**
   * Save configured system prompt (both to server and local cache)
   */
  async saveSystemPrompt(prompt) {
    const cleanPrompt = (prompt || '').trim();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('smriti_system_prompt', cleanPrompt);
    }

    try {
      const res = await fetch(`${getBaseUrl()}/api/ai/system-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: cleanPrompt })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Could not persist system prompt to server:', err);
    }

    return {
      success: true,
      systemPrompt: cleanPrompt,
      isDefault: cleanPrompt === DEFAULT_SYSTEM_PROMPT
    };
  }

  /**
   * Reset system prompt to official default
   */
  async resetSystemPrompt() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('smriti_system_prompt');
    }

    try {
      const res = await fetch(`${getBaseUrl()}/api/ai/system-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Could not reset system prompt on server:', err);
    }

    return {
      success: true,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      isDefault: true
    };
  }

  /**
   * Send message to Real Gemini LLM API via backend /api/ai/chat endpoint
   */
  async sendMessage(input, maybeContext = {}) {
    let message = '';
    let conversationHistory = [];
    let language = 'en';
    let userContext = {};
    let appContext = {};
    let gameContext = {};
    let signal = null;

    if (typeof input === 'string') {
      message = input;
      conversationHistory = maybeContext.conversationHistory || [];
      language = maybeContext.language || maybeContext.currentLanguage || 'en';
      userContext = maybeContext.userContext || {
        id: maybeContext.userId,
        name: maybeContext.userName,
        role: maybeContext.userRole
      };
      appContext = maybeContext.appContext || {
        currentPage: maybeContext.currentPage
      };
      gameContext = maybeContext.gameContext || {
        currentGame: maybeContext.currentGameName || maybeContext.currentGameId,
        score: maybeContext.currentScore,
        state: maybeContext.currentGameState
      };
      signal = maybeContext.signal || null;
    } else if (typeof input === 'object' && input !== null) {
      message = input.message || '';
      conversationHistory = input.conversationHistory || [];
      language = input.language || input.currentLanguage || 'en';
      userContext = input.userContext || {};
      appContext = input.appContext || {};
      gameContext = input.gameContext || {};
      signal = input.signal || null;
    }

    const customSystemPrompt = maybeContext.customSystemPrompt ||
                               (typeof input === 'object' && input.customSystemPrompt) ||
                               this.getCachedSystemPrompt() ||
                               DEFAULT_SYSTEM_PROMPT;

    const userQuery = (message || '').trim();
    if (!userQuery) {
      return {
        text: 'I did not hear anything. Tap the microphone to speak with me.',
        replyText: 'I did not hear anything. Tap the microphone to speak with me.',
        intent: 'EMPTY',
        action: null,
        language,
        timestamp: new Date().toISOString(),
        source: 'local'
      };
    }

    // 1. If offline, use local knowledge engine immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const localResult = await localFallbackProvider.generateResponse(userQuery, {
        currentLanguage: language,
        userContext,
        appContext,
        gameContext,
        conversationHistory,
        customSystemPrompt
      });

      const reply = localResult.intent === 'OUT_OF_DOMAIN'
        ? localResult.replyText
        : `[Offline Mode] ${localResult.replyText}`;
      return {
        text: reply,
        replyText: reply,
        intent: localResult.intent,
        action: localResult.action,
        language,
        timestamp: new Date().toISOString(),
        source: 'offline'
      };
    }

    // 2. Online: Call backend /api/ai/chat endpoint (with fallback to /api/chat)
    try {
      let endpoint = `${getBaseUrl()}/api/ai/chat`;
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          message: userQuery,
          conversationHistory,
          language,
          userContext,
          appContext,
          gameContext,
          customSystemPrompt
        })
      });

      // If /api/ai/chat returns 404, fallback to /api/chat alias
      if (response.status === 404) {
        endpoint = `${getBaseUrl()}/api/chat`;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            message: userQuery,
            conversationHistory,
            language,
            userContext,
            appContext,
            gameContext,
            customSystemPrompt
          })
        });
      }

      if (response.status === 429) {
        let errData = {};
        try {
          errData = await response.json();
        } catch {}

        console.warn('Gemini chat API rate-limited (429), serving local SmritiCare fallback:', errData);
        const localResult = await localFallbackProvider.generateResponse(userQuery, {
          currentLanguage: language,
          userContext,
          appContext,
          gameContext,
          conversationHistory,
          customSystemPrompt
        });

        return {
          text: localResult.replyText,
          replyText: localResult.replyText,
          intent: localResult.intent,
          action: localResult.action,
          language,
          timestamp: new Date().toISOString(),
          source: 'local_fallback',
          isRateLimited: true,
          notice: errData.error || 'Gemini is temporarily rate-limited. Serving local SmritiCare knowledge.'
        };
      }

      if (response.ok) {
        const data = await response.json();

        // If Gemini returned a generated response, use it!
        if (data && data.text) {
          return {
            text: data.text,
            replyText: data.text,
            language: data.language || language,
            intent: data.intent || 'GENERAL',
            action: data.action || null,
            timestamp: data.timestamp || new Date().toISOString(),
            source: data.source || 'gemini',
            model: data.model || 'gemini-3.5-flash'
          };
        }

        // If backend reported rate limited source gracefully
        if (data && data.source === 'rate_limited') {
          const localResult = await localFallbackProvider.generateResponse(userQuery, {
            currentLanguage: language,
            userContext,
            appContext,
            gameContext,
            conversationHistory,
            customSystemPrompt
          });

          return {
            text: localResult.replyText,
            replyText: localResult.replyText,
            intent: localResult.intent,
            action: localResult.action,
            language,
            timestamp: new Date().toISOString(),
            source: 'local_fallback',
            isRateLimited: true,
            notice: data.error || 'Gemini is temporarily rate-limited. Serving local SmritiCare knowledge.'
          };
        }

        // If backend reported that no key was configured
        if (data && data.source === 'no_key') {
          const localResult = await localFallbackProvider.generateResponse(userQuery, {
            currentLanguage: language,
            userContext,
            appContext,
            gameContext,
            conversationHistory,
            customSystemPrompt
          });

          return {
            text: localResult.replyText,
            replyText: localResult.replyText,
            intent: localResult.intent,
            action: localResult.action,
            language,
            timestamp: new Date().toISOString(),
            source: 'local_no_key',
            notice: data.notice
          };
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.warn('Call to Gemini chat API failed, falling back to local engine:', err);
    }

    // 3. Fallback to local contextual synthesizer if server/API call fails
    const localResult = await localFallbackProvider.generateResponse(userQuery, {
      currentLanguage: language,
      userContext,
      appContext,
      gameContext,
      conversationHistory,
      customSystemPrompt
    });

    return {
      text: localResult.replyText,
      replyText: localResult.replyText,
      intent: localResult.intent,
      action: localResult.action,
      language,
      timestamp: new Date().toISOString(),
      source: 'local_fallback'
    };
  }

  /**
   * Explain game results simply with encouragement
   */
  async explainGameResult(gameId, score, durationSeconds = 60, context = {}) {
    return await this.sendMessage({
      message: `I completed ${context.currentGameName || gameId} with a score of ${score}%. Can you explain my result and encourage me?`,
      language: context.currentLanguage || 'en',
      userContext: context.userContext || {},
      appContext: { currentPage: 'game-won' },
      gameContext: { currentGame: context.currentGameName || gameId, score, durationSeconds }
    });
  }

  /**
   * Generate caregiver activity summary
   */
  async generateCaregiverSummary(patient, recentSessions = [], pendingReminders = []) {
    return await this.sendMessage({
      message: `Please summarize today's cognitive game sessions and pending reminders for caregiver review.`,
      language: 'en',
      userContext: { name: patient?.name || 'Elder', role: 'caregiver' },
      appContext: { currentPage: 'caregiver-dashboard' },
      gameContext: {
        totalSessions: recentSessions.length,
        recentScores: recentSessions.map(s => s.score),
        pendingReminders: pendingReminders.length
      }
    });
  }

  /**
   * List supported languages
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }
}

export const aiService = new AIService();
