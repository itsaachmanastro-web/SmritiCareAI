/**
 * Unified Speech Service
 * Combines Speech-to-Text and Text-to-Speech into a single, cohesive facade.
 */
import { sttEngine } from './speechToText';
import { ttsEngine } from './textToSpeech';
import { getLanguage, isSpeechRecognitionSupported, isTtsSupported } from '../translation/languageRegistry';

export const speechService = {
  // Check browser support
  isSpeechRecognitionSupported(langCode = 'en') {
    return sttEngine.isSupported() && isSpeechRecognitionSupported(langCode);
  },

  isTtsSupported(langCode = 'en') {
    return ttsEngine.isSupported() && isTtsSupported(langCode);
  },

  // STT
  startListening(options) {
    return sttEngine.startListening(options);
  },

  stopListening() {
    return sttEngine.stopListening();
  },

  abortListening() {
    return sttEngine.abort();
  },

  // TTS
  speak(text, language = 'en', onEnd = null, onError = null) {
    return ttsEngine.speak({
      text,
      language,
      onEnd,
      onError
    });
  },

  stopSpeaking() {
    return ttsEngine.stop();
  },

  pauseSpeaking() {
    return ttsEngine.pause();
  },

  resumeSpeaking() {
    return ttsEngine.resume();
  },

  isSpeaking() {
    return ttsEngine.isSpeaking();
  }
};
