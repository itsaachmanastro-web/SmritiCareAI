/**
 * Centralized Application Mode Configuration
 * Enforces strict separation between Production Mode (verified real users only)
 * and Demo Mode (evaluator demo users enabled for demonstration).
 */

export const APP_MODES = {
  PRODUCTION: 'production',
  DEMO: 'demo'
};

const APP_MODE_STORAGE_KEY = 'smriti_app_mode';

export function getAppMode() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(APP_MODE_STORAGE_KEY);
    if (saved === APP_MODES.DEMO) {
      return APP_MODES.DEMO;
    }
  }
  // Default is strictly PRODUCTION
  return APP_MODES.PRODUCTION;
}

export function setAppMode(mode) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (mode === APP_MODES.DEMO) {
      window.localStorage.setItem(APP_MODE_STORAGE_KEY, APP_MODES.DEMO);
    } else {
      window.localStorage.setItem(APP_MODE_STORAGE_KEY, APP_MODES.PRODUCTION);
    }
  }
}

export function isProductionMode() {
  return getAppMode() === APP_MODES.PRODUCTION;
}

export function isDemoMode() {
  return getAppMode() === APP_MODES.DEMO;
}
