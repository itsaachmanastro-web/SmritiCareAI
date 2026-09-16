import { useState, useCallback, useEffect } from 'react';
import { speechService } from '../services/speech/speechService';

export function useTextToSpeech({ language = 'en' } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasSupport = speechService.isTtsSupported(language);

  const speak = useCallback((text, langOverride = null, onFinished = null) => {
    const targetLang = langOverride || language;
    setIsSpeaking(true);

    speechService.speak(
      text,
      targetLang,
      () => {
        setIsSpeaking(false);
        if (onFinished) onFinished();
      },
      () => {
        setIsSpeaking(false);
      }
    );
  }, [language]);

  const stopSpeaking = useCallback(() => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  return {
    isSpeaking,
    hasSupport,
    speak,
    stopSpeaking
  };
}
