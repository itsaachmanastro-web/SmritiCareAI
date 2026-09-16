import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const SpeechContext = createContext();

export function SpeechProvider({ children }) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setHasSpeechRecognition(!!SpeechRecognition);
  }, []);

  // Speak text using browser SpeechSynthesis
  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // cancel any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // gentle, slower pace for elderly cognition
    utterance.pitch = 1.05; // warm tone

    // Map language code
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'bn') utterance.lang = 'bn-IN';
    else if (language === 'as') utterance.lang = 'as-IN'; // fallbacks gracefully
    else utterance.lang = 'en-IN';

    // Try to pick an Indian English or local voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('IN')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Listen for voice input
  const startListening = (onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      if (language === 'hi') recognition.lang = 'hi-IN';
      else if (language === 'bn') recognition.lang = 'bn-IN';
      else recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        if (onResult) onResult(text);
      };
      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <SpeechContext.Provider
      value={{
        speak,
        stopSpeaking,
        isSpeaking,
        startListening,
        isListening,
        transcript,
        hasSpeechRecognition
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
}
