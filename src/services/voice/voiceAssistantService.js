/**
 * Voice Assistant State Machine & Orchestrator
 * Manages states: idle -> listening -> understanding -> thinking -> speaking -> done
 */

export const ASSISTANT_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  UNDERSTANDING: 'understanding',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  DONE: 'done',
  ERROR: 'error'
};

export class VoiceAssistantService {
  constructor() {
    this.state = ASSISTANT_STATES.IDLE;
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = newState;
    this.listeners.forEach(fn => fn(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const voiceAssistantService = new VoiceAssistantService();
