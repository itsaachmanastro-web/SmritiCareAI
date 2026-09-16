import React from 'react';
import { motion } from 'framer-motion';

export default function ElderButton({
  children,
  onClick,
  variant = 'primary', // 'primary' (teal), 'orange', 'warm', 'outline', 'danger', 'jade'
  size = 'lg', // 'md' (56px min), 'lg' (64px), 'xl' (76px)
  icon: Icon,
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button'
}) {
  const sizeClasses = {
    md: 'min-h-[56px] text-lg font-bold px-6 py-3.5',
    lg: 'min-h-[64px] text-xl font-extrabold px-8 py-4',
    xl: 'min-h-[76px] text-2xl font-black px-10 py-5',
  }[size];

  const variantClasses = {
    primary: 'bg-gradient-to-r from-smriti-teal-600 to-smriti-teal-700 hover:from-smriti-teal-700 hover:to-smriti-teal-800 text-white btn-tactile-teal shadow-elder border border-teal-500/30',
    orange: 'bg-gradient-to-r from-smriti-orange-500 to-smriti-orange-600 hover:from-smriti-orange-600 hover:to-smriti-orange-700 text-white btn-tactile-orange shadow-elder-orange border border-orange-400/30',
    warm: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 shadow-sm',
    outline: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:border-slate-400',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md border border-rose-500/30',
    jade: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md border border-emerald-500/30'
  }[variant];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.015 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        relative inline-flex items-center justify-center gap-3 rounded-2xl md:rounded-3xl
        select-none cursor-pointer tracking-wide transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${variantClasses}
        ${className}
      `}
    >
      {Icon && <Icon className="w-7 h-7 flex-shrink-0" />}
      <span className="leading-tight">{children}</span>
    </motion.button>
  );
}
