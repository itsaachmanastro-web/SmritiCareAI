/**
 * Speech-to-Text Service Abstraction
 * Wraps browser Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * with graceful error recovery and pluggable cloud STT interface.
 */
import { getLanguage, isSpeechRecognitionSupported } from '../translation/languageRegistry';

export class SpeechToTextEngine {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
      : null;
  }

  isSupported() {
    return !!this.SpeechRecognition;
  }

  startListening({
    language = 'en',
    onStart,
    onResult,
    onError,
    onEnd
  }) {
    if (!this.SpeechRecognition) {
      if (onError) {
        onError({
          code: 'UNSUPPORTED',
          message: 'Speech recognition is not supported in this browser. You can type your message below.'
        });
      }
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      this.recognition = new this.SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      // Set speech locale
      const langConfig = getLanguage(language);
      // If language has native speech support use its locale, otherwise fallback to en-IN or hi-IN
      this.recognition.lang = langConfig.speechRecognitionAvailable ? langConfig.sttLocale : 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
        const results = event.results;
        const transcript = Array.from(results)
          .map(result => result[0].transcript)
          .join('');
        const isFinal = results[results.length - 1].isFinal;

        if (onResult) {
          onResult({
            transcript,
            isFinal,
            language: this.recognition.lang
          });
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let userMessage = 'I could not hear you clearly. Please tap the microphone and try again.';
        if (event.error === 'not-allowed') {
          userMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings to speak with Smriti.';
        } else if (event.error === 'no-speech') {
          userMessage = 'No speech was detected. Tap the microphone and speak gently.';
        } else if (event.error === 'network') {
          userMessage = 'Network issue with speech recognition. You can type your question below.';
        }

        if (onError) {
          onError({
            code: event.error,
            message: userMessage
          });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (onError) {
        onError({
          code: 'INITIALIZATION_ERROR',
          message: 'Could not initialize speech recognition. Please try again.'
        });
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
      this.isListening = false;
    }
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }
}

export const sttEngine = new SpeechToTextEngine();
