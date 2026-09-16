/**
 * Text-to-Speech Service Abstraction
 * Wraps browser SpeechSynthesis with dementia-friendly rate, warm pitch,
 * voice selection, and pluggable cloud TTS interface.
 */
import { getLanguage } from '../translation/languageRegistry';

export class TextToSpeechEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this._isSpeaking = false;
    this.voices = [];

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  isSupported() {
    return !!this.synth;
  }

  isSpeaking() {
    return this._isSpeaking || (this.synth ? this.synth.speaking : false);
  }

  speak({
    text,
    language = 'en',
    rate = 0.86, // gentle, slower pace for elderly cognition
    pitch = 1.05, // warm, reassuring tone
    onStart,
    onEnd,
    onError
  }) {
    if (!this.synth) {
      if (onError) onError(new Error('SpeechSynthesis not supported'));
      return;
    }

    // Cancel any active speech before starting new speech
    this.stop();

    if (!text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Clean markdown characters like asterisks, emojis, brackets for clean acoustic delivery
      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const langConfig = getLanguage(language);
      const targetLocale = langConfig.ttsAvailable ? langConfig.ttsLocale : 'en-IN';
      utterance.lang = targetLocale;

      // Select voice: prioritize language match, then Indian accents
      if (this.voices.length === 0) {
        this.loadVoices();
      }

      const exactVoice = this.voices.find(v => v.lang === targetLocale);
      const regionalVoice = this.voices.find(v => v.lang.includes('IN') || v.lang.startsWith(targetLocale.split('-')[0]));
      const defaultVoice = exactVoice || regionalVoice || this.voices[0];

      if (defaultVoice) {
        utterance.voice = defaultVoice;
      }

      utterance.onstart = () => {
        this._isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        // Ignore cancellation errors
        if (e.error !== 'canceled' && onError) {
          onError(e);
        }
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      this._isSpeaking = false;
      if (onError) onError(err);
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
      this._isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }
}

export const ttsEngine = new TextToSpeechEngine();
