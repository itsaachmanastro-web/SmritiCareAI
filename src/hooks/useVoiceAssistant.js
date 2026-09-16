import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { saveConversationMessage } from '../db/syncService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { aiService } from '../services/ai/aiService';
import { speechService } from '../services/speech/speechService';
import { getLanguage } from '../services/translation/languageRegistry';
import { ASSISTANT_STATES } from '../services/voice/voiceAssistantService';

export function useVoiceAssistant({
  currentGameId = null,
  currentGameName = null,
  currentGameState = null,
  currentScore = undefined,
  autoGreet = false,
  onOpenEmergency = null
} = {}) {
  const { currentUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();

  const userId = currentUser?.id || null;

  // Live Query conversation history for the authenticated user only
  const rawConversations = useLiveQuery(
    () => userId ? db.conversations.where('userId').equals(userId).toArray() : [],
    [userId]
  ) || [];

  const [state, setState] = useState(ASSISTANT_STATES.IDLE);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const lastProcessedTimeRef = useRef(0);

  // Clean up timers and in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // Clear conversation history for active user only
  const clearHistory = useCallback(async () => {
    try {
      await db.conversations.where('userId').equals(userId).delete();
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  }, [userId]);

  // Execute safe application action
  const executeAction = useCallback((action) => {
    if (!action) return;

    if (action.type === 'NAVIGATE' && action.path) {
      setTimeout(() => {
        navigate(action.path);
      }, 1200);
    } else if (action.type === 'OPEN_EMERGENCY_MODAL') {
      if (onOpenEmergency) {
        setTimeout(() => {
          onOpenEmergency();
        }, 1000);
      }
    } else if (action.type === 'TOGGLE_THEME') {
      toggleTheme();
    } else if (action.type === 'SET_LANGUAGE' && action.language) {
      setLanguage(action.language);
    }
  }, [navigate, onOpenEmergency, toggleTheme, setLanguage]);

  // Send a text message (typed or transcribed)
  const processQuery = useCallback(async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const trimmed = queryText.trim();
    const now = Date.now();

    // Guard against duplicate triggers from Web Speech API (same query within 1500ms)
    if (trimmed === lastProcessedTextRef.current && (now - lastProcessedTimeRef.current < 1500)) {
      console.log('Skipping duplicate voice/query trigger:', trimmed);
      return;
    }
    lastProcessedTextRef.current = trimmed;
    lastProcessedTimeRef.current = now;

    // Set processing guard
    isProcessingRef.current = true;
    setErrorMessage(null);

    // Cancel any in-flight query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(ASSISTANT_STATES.THINKING);

    // 30-second safety timeout guard to allow complete generation
    timeoutRef.current = setTimeout(() => {
      if (stateRef.current === ASSISTANT_STATES.THINKING) {
        controller.abort();
        setErrorMessage('Response took a little longer than usual. Please try again.');
        setState(ASSISTANT_STATES.IDLE);
      }
    }, 30000);

    try {
      // 1. Save user's message to IndexedDB
      await saveConversationMessage({
        userId,
        role: 'user',
        message: trimmed,
        language
      });

      // 2. Format recent conversation history for multi-turn context
      const conversationHistory = (rawConversations || []).slice(-10).map((c) => ({
        role: c.role === 'assistant' ? 'assistant' : 'user',
        message: c.message
      }));

      // 3. Prepare rich context including latest game session & reminder summary
      let recentGame = null;
      let recentScore = undefined;
      let hasGameSessions = false;
      let reminderSummary = null;

      try {
        if (userId) {
          const lastSession = await db.gameSessions
            .where('userId')
            .equals(userId)
            .reverse()
            .first();
          if (lastSession) {
            hasGameSessions = true;
            recentGame = lastSession.gameName;
            recentScore = lastSession.score;
          }

          const allReminders = await db.reminders.toArray();
          const reminders = allReminders.filter(r => Number(r.targetUserId) === Number(userId) || Number(r.userId) === Number(userId));
          if (reminders && reminders.length > 0) {
            const pending = reminders.filter(r => !r.done);
            reminderSummary = {
              total: reminders.length,
              pendingCount: pending.length,
              nextReminder: pending[0] ? `${pending[0].label || pending[0].title} at ${pending[0].time}` : 'All complete'
            };
          }
        }
      } catch (err) {
        console.warn('Could not read user context from Dexie:', err);
      }

      const context = {
        userId,
        userName: currentUser?.name || 'Elder',
        userRole: currentUser?.role || 'patient',
        currentLanguage: language,
        currentPage: window.location.pathname,
        currentGameId,
        currentGameName,
        currentGameState,
        currentScore,
        conversationHistory,
        signal: controller.signal,
        gameContext: {
          currentGame: currentGameName || currentGameId,
          score: currentScore,
          state: currentGameState,
          recentGame,
          recentScore,
          hasGameSessions
        },
        appContext: {
          currentPage: window.location.pathname,
          reminderSummary
        }
      };

      // 4. Query AI Service
      const result = await aiService.sendMessage(trimmed, context);

      // Clear safety timeout on successful response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const responseText = result.replyText || result.text || '';

      // 5. Save AI's response to IndexedDB
      await saveConversationMessage({
        userId,
        role: 'assistant',
        message: responseText,
        language: result.language || language,
        intent: result.intent,
        source: result.source
      });

      // 6. Handle action if any
      if (result.action) {
        executeAction(result.action);
      }

      // 7. Speak response aloud using TTS
      setState(ASSISTANT_STATES.SPEAKING);
      setIsSpeaking(true);

      speechService.speak(
        responseText,
        result.language || language,
        () => {
          setIsSpeaking(false);
          setState(ASSISTANT_STATES.DONE);
        },
        () => {
          setIsSpeaking(false);
          setState(ASSISTANT_STATES.DONE);
        }
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        // Ignored as query was deliberately cancelled by new user action
        return;
      }
      console.error('Error in Voice Assistant query:', err);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setErrorMessage('Something went wrong. Please tap the microphone and try again.');
      setState(ASSISTANT_STATES.ERROR);
    } finally {
      isProcessingRef.current = false;
    }
  }, [userId, language, currentUser, currentGameId, currentGameName, currentGameState, currentScore, rawConversations, executeAction]);

  // Tap to start voice listening
  const startVoiceInput = useCallback(() => {
    setErrorMessage(null);
    setLiveTranscript('');

    // Cancel in-flight request if user taps to talk again
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop speaking if currently speaking
    speechService.stopSpeaking();
    setIsSpeaking(false);

    setState(ASSISTANT_STATES.LISTENING);

    speechService.startListening({
      language,
      onStart: () => {
        setState(ASSISTANT_STATES.LISTENING);
      },
      onResult: ({ transcript: text, isFinal }) => {
        setLiveTranscript(text);
        if (isFinal && text.trim()) {
          // Immediately stop listening so extra speech recognition events don't fire duplicate requests
          speechService.stopListening();
          setState(ASSISTANT_STATES.UNDERSTANDING);
          processQuery(text);
        }
      },
      onError: (err) => {
        setErrorMessage(err.message || 'I could not hear you clearly. Please try again.');
        setState(ASSISTANT_STATES.IDLE);
      },
      onEnd: () => {
        // If ended without final, revert or maintain
        if (stateRef.current === ASSISTANT_STATES.LISTENING) {
          setState(ASSISTANT_STATES.IDLE);
        }
      }
    });
  }, [language, processQuery]);

  // Stop listening
  const stopVoiceInput = useCallback(() => {
    speechService.stopListening();
    if (stateRef.current === ASSISTANT_STATES.LISTENING) {
      setState(ASSISTANT_STATES.IDLE);
    }
  }, []);

  // Replay a specific message aloud
  const replayMessage = useCallback((text, langCode = null) => {
    speechService.stopSpeaking();
    setIsSpeaking(true);
    setState(ASSISTANT_STATES.SPEAKING);

    speechService.speak(
      text,
      langCode || language,
      () => {
        setIsSpeaking(false);
        setState(ASSISTANT_STATES.DONE);
      },
      () => {
        setIsSpeaking(false);
        setState(ASSISTANT_STATES.DONE);
      }
    );
  }, [language]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
    if (stateRef.current === ASSISTANT_STATES.SPEAKING) {
      setState(ASSISTANT_STATES.DONE);
    }
  }, []);

  return {
    state,
    conversations: rawConversations,
    liveTranscript,
    errorMessage,
    isSpeaking,
    language,
    currentLangConfig: getLanguage(language),
    startVoiceInput,
    stopVoiceInput,
    processQuery,
    replayMessage,
    stopSpeaking,
    clearHistory
  };
}
