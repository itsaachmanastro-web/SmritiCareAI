import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  trend = 'neutral', // 'up', 'down', 'neutral'
  trendLabel = '',
  icon: Icon,
  color = 'teal' // 'teal', 'orange', 'blue', 'purple'
}) {
  const colorSchemes = {
    teal: {
      bg: 'bg-gradient-to-br from-white to-teal-50/60 dark:from-[#131D33] dark:to-teal-950/30',
      border: 'border-teal-200/90 dark:border-teal-800/60',
      iconBg: 'bg-teal-100/90 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80',
      valColor: 'text-slate-900 dark:text-white',
      trendBg: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    orange: {
      bg: 'bg-gradient-to-br from-white to-orange-50/60 dark:from-[#131D33] dark:to-orange-950/30',
      border: 'border-orange-200/90 dark:border-orange-800/60',
      iconBg: 'bg-orange-100/90 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80',
      valColor: 'text-slate-900 dark:text-white',
      trendBg: 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    blue: {
      bg: 'bg-gradient-to-br from-white to-sky-50/60 dark:from-[#131D33] dark:to-sky-950/30',
      border: 'border-sky-200/90 dark:border-sky-800/60',
      iconBg: 'bg-sky-100/90 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80',
      valColor: 'text-slate-900 dark:text-white',
      trendBg: 'bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
    },
    purple: {
      bg: 'bg-gradient-to-br from-white to-purple-50/60 dark:from-[#131D33] dark:to-purple-950/30',
      border: 'border-purple-200/90 dark:border-purple-800/60',
      iconBg: 'bg-purple-100/90 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80',
      valColor: 'text-slate-900 dark:text-white',
      trendBg: 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    }
  }[color];

  return (
    <div className={`rounded-3xl p-5 md:p-6 border-2 ${colorSchemes.border} ${colorSchemes.bg} shadow-healthcare transition-all duration-200 hover:shadow-healthcare-hover hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl md:text-4xl font-black ${colorSchemes.valColor} font-display`}>
              {value}
            </span>
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${colorSchemes.iconBg} shadow-xs`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#243352] flex items-center justify-between text-xs font-bold">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {subtitle}
        </span>
        {trendLabel && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border flex-shrink-0 ${
            trend === 'up'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : trend === 'down'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              : 'bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#243352]'
          }`}>
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
