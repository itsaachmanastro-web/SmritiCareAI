import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/dexie';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Read initial setting from active user or localStorage or default to 'light'
  const [theme, setThemeState] = useState(() => {
    try {
      const storedUser = localStorage.getItem('smriticare_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
          return parsed.theme;
        }
      }
      const stored = localStorage.getItem('smriticare-theme') || localStorage.getItem('smriticare_theme');
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Could not read theme preference:', e);
    }
    return 'dark';
  });

  // Calculate if dark mode is active
  const [isDark, setIsDark] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Check for active user preference changes
  useEffect(() => {
    const handleStorage = () => {
      try {
        const storedUser = localStorage.getItem('smriticare_current_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
            setThemeState(parsed.theme);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeIsDark = false;
      if (theme === 'dark') {
        activeIsDark = true;
      } else if (theme === 'system') {
        activeIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        activeIsDark = false;
      }

      setIsDark(activeIsDark);

      if (activeIsDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }

      // Update meta theme-color for mobile browser chrome
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', activeIsDark ? '#0B1120' : '#FAF8F5');
    };

    applyTheme();

    // Listen for OS changes if system mode
    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = async (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem('smriticare-theme', newTheme);
      localStorage.setItem('smriticare_theme', newTheme);

      // Persist to currently authenticated user if present
      const storedUser = localStorage.getItem('smriticare_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) {
          parsed.theme = newTheme;
          localStorage.setItem('smriticare_current_user', JSON.stringify(parsed));
          try {
            await db.users.update(parsed.id, { theme: newTheme });
          } catch (dbErr) {
            console.warn('Could not persist theme preference to db.users:', dbErr);
          }
        }
      }
    } catch (e) {
      console.warn('Could not persist theme preference:', e);
    }
  };

  const toggleTheme = () => {
    // If currently dark, toggle to light; if light, toggle to dark
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
