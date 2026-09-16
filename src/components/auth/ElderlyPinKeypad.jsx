import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Delete, Sparkles, Check, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useLanguage } from '../../context/LanguageContext';
import { playCardFlipSound, playMatchSuccessSound } from '../../audio/synthAudio';

/**
 * Non-blocking audio and haptic feedback helper.
 * Never blocks the main React rendering thread or user touch response.
 */
function triggerTapFeedback() {
  // 1. Gentle mobile haptic feedback (gracefully ignored on unsupported browsers/desktop)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    // Ignore haptic errors silently
  }

  // 2. Audio feedback scheduled on next animation frame to prevent micro-stutter
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      try {
        playCardFlipSound();
      } catch {
        // Ignore audio failures silently
      }
    });
  }
}

/**
 * Memoized Digit Button Component.
 * Guaranteed never to re-render when PIN length changes (1 -> 2 -> 3 -> 4),
 * ensuring sub-millisecond tap response even on low-end hardware.
 */
const KeypadDigitButton = memo(function KeypadDigitButton({
  digit,
  onTap,
  disabled,
  ariaLabel
}) {
  const handleClick = (e) => {
    e.preventDefault();
    if (disabled) return;
    onTap(digit);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel || `PIN digit ${digit}`}
      className="pin-keypad-btn h-14 sm:h-16 md:h-17 rounded-2xl bg-white/95 dark:bg-[#1A2844]/90 hover:bg-slate-50 dark:hover:bg-[#223356] border-2 border-slate-200/90 dark:border-[#2D4168] shadow-sm hover:shadow-md text-2xl sm:text-3xl font-black text-slate-800 dark:text-white flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ touchAction: 'manipulation' }}
    >
      <span>{digit}</span>
    </button>
  );
});

/**
 * ElderlyPinKeypad
 * 
 * Ultra-fast, instant-response 4-digit PIN keypad engineered for elderly users.
 * Features:
 * - Stage 1 (instant UI feedback) isolated from Stage 2 (async authentication).
 * - Zero parent re-renders during digit typing.
 * - Concurrency & rapid-tap safe using functional state updates.
 * - Strict double-submission guard.
 * - Hardware-accelerated CSS active transforms with touchAction: 'manipulation'.
 * - Full physical keyboard support (0-9, Backspace, Escape).
 * - Gentle shake animation on incorrect PIN and automatic reset.
 * - High-contrast indicators for elderly readability in Light & Dark modes.
 */
export default function ElderlyPinKeypad({
  registeredPatient,
  onLoginPin,
  onQuickDemo,
  externalError = '',
  onClearExternalError
}) {
  const { t } = useLanguage();
  
  // Local isolated PIN state (does NOT re-render parent LoginPage on every digit)
  const [pin, setPin] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Synchronous submission lock to prevent double-submitting or queueing extra taps
  const isSubmittingRef = useRef(false);
  const shakeTimerRef = useRef(null);

  // Synchronize external error if parent returns one
  useEffect(() => {
    if (externalError) {
      setLocalError(externalError);
      setIsShaking(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 350);
      setPin('');
      isSubmittingRef.current = false;
      setIsChecking(false);
    }
  }, [externalError]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  /**
   * Dispatches PIN authentication once 4 digits are entered.
   */
  const executeAuthentication = useCallback(async (fullPin) => {
    setIsChecking(true);
    setLocalError('');
    if (onClearExternalError) onClearExternalError();

    try {
      const result = await onLoginPin(fullPin);
      if (result?.success) {
        setIsSuccessState(true);
        try {
          playMatchSuccessSound();
        } catch {}
      } else {
        // Authentication failed (wrong PIN)
        const friendlyMsg =
          result?.error ||
          t('auth.pinErrorFriendly') ||
          "That PIN doesn't match. Please try again.";
        setLocalError(friendlyMsg);
        setIsShaking(true);
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => {
          setIsShaking(false);
        }, 350);
        // Clear PIN back to empty state for next try
        setPin('');
        isSubmittingRef.current = false;
        setIsChecking(false);
      }
    } catch (err) {
      setLocalError(t('common.error') || 'Authentication failed. Please try again.');
      setPin('');
      isSubmittingRef.current = false;
      setIsChecking(false);
    }
  }, [onLoginPin, t, onClearExternalError]);

  /**
   * Handle single digit entry.
   * Functional state update ensures rapid sequential taps (e.g. "1234" in 100ms)
   * never drop digits or read stale closures.
   */
  const handleDigit = useCallback((digit) => {
    if (isSubmittingRef.current || isChecking || isSuccessState) return;

    triggerTapFeedback();

    setPin((prevPin) => {
      if (prevPin.length >= 4) return prevPin;
      const nextPin = prevPin + digit;

      // When the 4th digit is entered, trigger authentication immediately
      if (nextPin.length === 4) {
        isSubmittingRef.current = true;
        // Schedule authentication on next microtask so the 4th dot renders instantly
        Promise.resolve().then(() => {
          executeAuthentication(nextPin);
        });
      }

      return nextPin;
    });

    if (localError) setLocalError('');
  }, [isChecking, isSuccessState, executeAuthentication, localError]);

  /**
   * Handle Backspace: deletes the last entered digit instantly.
   */
  const handleBackspace = useCallback(() => {
    if (isSubmittingRef.current || isChecking || isSuccessState) return;
    triggerTapFeedback();
    setPin((prev) => prev.slice(0, -1));
    if (localError) setLocalError('');
  }, [isChecking, isSuccessState, localError]);

  /**
   * Handle Clear: resets entered PIN immediately.
   */
  const handleClear = useCallback(() => {
    if (isSubmittingRef.current || isChecking || isSuccessState) return;
    triggerTapFeedback();
    setPin('');
    if (localError) setLocalError('');
  }, [isChecking, isSuccessState, localError]);

  /**
   * Physical Keyboard Listener:
   * Enables elderly users and desktop/laptop users to type directly with numeric keys.
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if focus is inside an input, textarea, or select
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  // Determine active display patient details
  const patientDisplayName = registeredPatient?.name || 'Bimala Borah';
  const patientRoleName = registeredPatient?.relation || 'Amma';

  return (
    <div className="w-full space-y-4 select-none">
      {/* 1. Dignified Patient Profile Card (Non-clickable to avoid accidental demo login) */}
      <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-teal-50/90 dark:bg-[#162238] border-2 border-teal-200/90 dark:border-[#2A3E63] shadow-xs">
        <UserAvatar
          user={registeredPatient || { name: 'Bimala Borah', role: 'patient' }}
          size="md"
        />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg truncate">
              {patientDisplayName}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300/80 dark:border-teal-700/80">
              {patientRoleName}
            </span>
          </div>
          <p className="text-xs text-smriti-teal-700 dark:text-teal-400 font-bold mt-0.5">
            {t('auth.pinPrompt') || 'Enter your 4-digit PIN'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-teal-100/70 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* 2. PIN Indicators (Dots Container with Shake Animation) */}
      <div className={`py-1 text-center ${isShaking ? 'animate-pin-shake' : ''}`}>
        <div
          className="flex justify-center items-center gap-4 my-2"
          role="status"
          aria-live="polite"
          aria-label={`${pin.length} of 4 digits entered`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            const isCurrent = pin.length === idx && !isChecking && !isSuccessState;

            let dotClasses = 'w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform duration-75 flex items-center justify-center ';

            if (isSuccessState) {
              dotClasses += 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30 scale-105';
            } else if (localError) {
              dotClasses += 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 scale-95';
            } else if (isFilled) {
              dotClasses += 'bg-gradient-to-tr from-smriti-teal-600 to-teal-500 border-teal-500 scale-105 shadow-md shadow-teal-500/30';
            } else if (isCurrent) {
              dotClasses += 'bg-white dark:bg-[#1E293B] border-teal-500 dark:border-teal-400 scale-100 ring-2 ring-teal-400/30';
            } else {
              dotClasses += 'bg-slate-100 dark:bg-[#162238] border-slate-300 dark:border-[#2D4168]';
            }

            return (
              <div key={idx} className={dotClasses}>
                {isSuccessState ? (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                ) : isFilled ? (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white dark:bg-[#0B1120]" />
                ) : isCurrent ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-ping opacity-75" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Status / Loading / Error Notice Line */}
        <div className="h-6 flex items-center justify-center">
          {isSuccessState ? (
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5" />
              <span>{t('auth.welcomeBack') || 'Welcome back'}</span>
            </span>
          ) : isChecking ? (
            <span className="text-xs sm:text-sm font-bold text-smriti-teal-700 dark:text-teal-300 flex items-center gap-2 animate-in fade-in duration-100">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t('auth.checkingPin') || 'Checking...'}</span>
            </span>
          ) : localError ? (
            <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{localError}</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('auth.pinPrompt') || 'Enter your 4-digit PIN'} &bull;{' '}
              <span className="text-smriti-teal-700 dark:text-teal-400 font-extrabold">
                {t('auth.demoPatientNote') || 'Demo: 1234'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Big Numeric Keypad (Optimized for Elderly Touch & Fast Input) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-sm mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <KeypadDigitButton
            key={num}
            digit={String(num)}
            onTap={handleDigit}
            disabled={isChecking || isSuccessState}
            ariaLabel={`PIN digit ${num}`}
          />
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={isChecking || isSuccessState || pin.length === 0}
          aria-label={t('auth.clear') || 'Clear PIN'}
          className="pin-keypad-btn h-14 sm:h-16 md:h-17 rounded-2xl bg-slate-100/90 dark:bg-[#162238]/90 hover:bg-slate-200 dark:hover:bg-[#1E2E4A] border-2 border-slate-200/80 dark:border-[#2D4168] text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ touchAction: 'manipulation' }}
        >
          <span>{t('auth.clear') || 'Clear'}</span>
        </button>

        {/* 0 Button */}
        <KeypadDigitButton
          digit="0"
          onTap={handleDigit}
          disabled={isChecking || isSuccessState}
          ariaLabel="PIN digit 0"
        />

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={isChecking || isSuccessState || pin.length === 0}
          aria-label={t('auth.backspace') || 'Backspace'}
          className="pin-keypad-btn h-14 sm:h-16 md:h-17 rounded-2xl bg-slate-100/90 dark:bg-[#162238]/90 hover:bg-slate-200 dark:hover:bg-[#1E2E4A] border-2 border-slate-200/80 dark:border-[#2D4168] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ touchAction: 'manipulation' }}
        >
          <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* 4. Separate Demo Mode (Clearly Delineated & Non-Confusing) */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-[#243352]/80 text-center">
        <button
          type="button"
          onClick={onQuickDemo}
          disabled={isChecking || isSuccessState}
          className="w-full py-2.5 px-3 rounded-xl bg-amber-50/80 dark:bg-[#1E293B]/70 hover:bg-amber-100 dark:hover:bg-[#25334D] text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>{t('auth.tryDemoSeparate') || '⚡ Try Demo (Instant 1-Tap)'}</span>
          <span className="text-[10px] opacity-75 font-normal">
            &bull; {t('profile.demoMode') || 'Demo Mode'}
          </span>
        </button>
      </div>
    </div>
  );
}
