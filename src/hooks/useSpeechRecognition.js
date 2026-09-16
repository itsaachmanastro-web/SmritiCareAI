import { useState, useCallback, useEffect } from 'react';
import { speechService } from '../services/speech/speechService';

export function useSpeechRecognition({ language = 'en' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const hasSupport = speechService.isSpeechRecognitionSupported(language);

  const startListening = useCallback((onFinalResult) => {
    setError(null);
    setTranscript('');

    speechService.startListening({
      language,
      onStart: () => {
        setIsListening(true);
      },
      onResult: ({ transcript: text, isFinal }) => {
        setTranscript(text);
        if (isFinal && onFinalResult) {
          onFinalResult(text);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setError(err.message || 'Speech recognition failed');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  }, [language]);

  const stopListening = useCallback(() => {
    speechService.stopListening();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      speechService.stopListening();
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    hasSupport,
    startListening,
    stopListening
  };
}
