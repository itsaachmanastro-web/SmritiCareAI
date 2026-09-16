import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { db } from '../db/dexie';

const LanguageContext = createContext();

const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN'
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' }
];

/**
 * Searches a dictionary using either direct key or dot-notation traversal.
 * Also checks legacy flat keys for backward compatibility.
 */
function getNestedValue(dict, keyPath) {
  if (!dict || !keyPath) return undefined;

  // 1. Direct property match (flat key or direct string)
  if (typeof dict[keyPath] === 'string') {
    return dict[keyPath];
  }

  // 2. Dot notation traversal (e.g. 'games.bihu.title')
  const keys = keyPath.split('.');
  let current = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  // 3. Fallback: Check if key matches last part of dot notation or legacy name
  const lastKey = keys[keys.length - 1];
  if (typeof dict[lastKey] === 'string') {
    return dict[lastKey];
  }

  return undefined;
}

/**
 * Replaces {{variable}} placeholders with parameter values.
 */
function interpolate(template, params) {
  if (!template || typeof template !== 'string' || !params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, varName) => {
    return params[varName] !== undefined ? String(params[varName]) : `{{${varName}}}`;
  });
}

export function LanguageProvider({ children }) {
  const authContext = useAuth();
  const currentUser = authContext?.currentUser;

  // Initialize from persisted storage or default to 'en'
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('smriti_lang') || localStorage.getItem('smriti_language') || 'en';
  });

  // When an authenticated user with a saved language logs in, adopt their preference
  useEffect(() => {
    if (currentUser?.language && translations[currentUser.language] && currentUser.language !== language) {
      setLanguageState(currentUser.language);
      localStorage.setItem('smriti_lang', currentUser.language);
      localStorage.setItem('smriti_language', currentUser.language);
    }
  }, [currentUser?.id, currentUser?.language]);

  // Reactive translation function
  const t = useCallback((key, params) => {
    if (!key || typeof key !== 'string') return '';

    const langDict = translations[language] || translations.en;
    let result = getNestedValue(langDict, key);

    // Fall back to English dictionary if key is missing in active language
    if (result === undefined && language !== 'en') {
      result = getNestedValue(translations.en, key);
    }

    // If still missing, log in development and return readable fallback string
    if (result === undefined) {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] Missing translation key "${key}" for language "${language}"`);
      }
      // If key is dotted (e.g. auth.signInButton), return humanized last segment (e.g. "Sign In Button" or "Sign In")
      if (key.includes('.')) {
        const lastPart = key.split('.').pop() || '';
        const humanized = lastPart
          .replace(/Button$/, '')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        return humanized || key;
      }
      return key;
    }

    // Apply variable interpolation if params provided
    if (params && typeof params === 'object') {
      return interpolate(result, params);
    }

    return result;
  }, [language]);

  // Set language with user-scoped persistence
  const setLanguage = useCallback(async (newLang) => {
    if (!translations[newLang]) {
      console.warn(`[i18n] Attempted to set unsupported language: "${newLang}"`);
      return;
    }

    setLanguageState(newLang);
    localStorage.setItem('smriti_lang', newLang);
    localStorage.setItem('smriti_language', newLang);

    // Persist to logged-in user record in IndexedDB
    if (currentUser?.id) {
      try {
        await db.users.update(currentUser.id, {
          language: newLang,
          updatedAt: new Date().toISOString()
        });
        const updatedUser = { ...currentUser, language: newLang };
        localStorage.setItem('smriti_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.warn('[i18n] Failed to persist user language in Dexie:', err);
      }
    }
  }, [currentUser]);

  // Locale-aware formatting functions
  const formatDate = useCallback((date, options = { dateStyle: 'medium' }) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      const locale = LOCALE_MAP[language] || 'en-IN';
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch {
      return String(date);
    }
  }, [language]);

  const formatTime = useCallback((date, options = { hour: '2-digit', minute: '2-digit' }) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      const locale = LOCALE_MAP[language] || 'en-IN';
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch {
      return String(date);
    }
  }, [language]);

  const formatNumber = useCallback((num, options) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    try {
      const locale = LOCALE_MAP[language] || 'en-IN';
      return new Intl.NumberFormat(locale, options).format(num);
    } catch {
      return String(num);
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatDate,
        formatTime,
        formatNumber,
        supportedLanguages: SUPPORTED_LANGUAGES,
        locale: LOCALE_MAP[language] || 'en-IN'
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
