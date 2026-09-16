import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Activity, Brain, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  getCalendarDateRange,
  formatDisplayDate,
  getLocalDateString,
  normalizeDomain
} from '../../services/activityService';

/**
 * Format duration in seconds into a friendly string (e.g. "1m 34s", "6 min")
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins} min`;
  return `${secs}s`;
}

/**
 * Custom Rich Tooltip showing session date, domain, score, game name,
 * accuracy, duration, difficulty level, and multi-session indicators.
 */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const activePayload = payload.filter(
      (entry) => entry.value !== null && entry.value !== undefined
    );
    if (!activePayload.length) return null;

    const rowData = payload[0]?.payload || {};

    return (
      <div className="bg-white/95 dark:bg-[#15213b]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-[#243352] shadow-2xl text-xs space-y-2.5 min-w-[210px] max-w-xs transition-all animate-fadeIn">
        {/* Tooltip Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-[#243352] pb-2">
          <span className="font-extrabold text-slate-800 dark:text-slate-100">{label}</span>
          <span className="text-[10px] font-bold text-smriti-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
            Recorded Telemetry
          </span>
        </div>

        {/* Domain Data Rows */}
        <div className="space-y-2">
          {activePayload.map((entry) => {
            const meta = rowData[`${entry.dataKey}Meta`];
            return (
              <div
                key={entry.dataKey}
                className="space-y-1 bg-slate-50/70 dark:bg-[#1E293B]/60 p-2.5 rounded-xl border border-slate-100 dark:border-[#283858]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </span>
                  <span
                    className="font-black text-slate-900 dark:text-white text-sm"
                    style={{ color: entry.color }}
                  >
                    {entry.value}%
                  </span>
                </div>

                {meta && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5 pl-3.5 border-l-2 border-slate-200 dark:border-[#243352] ml-1">
                    {meta.gameName && (
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        Game: <span className="font-bold">{meta.gameName}</span>
                      </p>
                    )}
                    {meta.accuracy !== null && meta.accuracy !== undefined && (
                      <p>
                        Accuracy:{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {meta.accuracy}%
                        </span>
                      </p>
                    )}
                    {meta.durationFormatted && (
                      <p>
                        Duration:{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {meta.durationFormatted}
                        </span>
                      </p>
                    )}
                    {meta.difficulty && (
                      <p>
                        Level:{' '}
                        <span className="font-bold capitalize text-slate-700 dark:text-slate-200">
                          {meta.difficulty}
                        </span>
                      </p>
                    )}
                    {meta.sessionCount > 1 && (
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold italic">
                        ({meta.sessionCount} sessions averaged)
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function CognitiveChart({
  patientId = null,
  patientName = 'Patient',
  sessions = [],
  rawScores = [],
  isLoading = false,
  isError = false,
  onRetry = null
}) {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState(30); // 7, 14, 30
  const [activeDomains, setActiveDomains] = useState({
    memory: true,
    attention: true,
    routine: true,
    pattern: true
  });

  // Transform patient game sessions and cognitive scores into contiguous calendar timeline
  // Inactive days have domain values set to null (never 0!) so Recharts connectNulls={false} shows gaps
  const { chartData, hasAnyData, activeDaysCount } = useMemo(() => {
    const calendarDates = getCalendarDateRange(timeRange);
    const dateDomainMap = {};
    const targetPatientId = patientId ? Number(patientId) : null;

    // 1. Process gameSessions (Primary granular session source)
    if (sessions && sessions.length > 0) {
      sessions.forEach((s) => {
        // Enforce patient ID scoping
        if (targetPatientId) {
          const sPid = Number(s.patientId ?? s.patient_id ?? s.userId ?? s.user_id);
          if (sPid && sPid !== targetPatientId) return;
        }

        const dateStr =
          s.date ||
          (s.completedAt ? getLocalDateString(new Date(s.completedAt)) : null) ||
          (s.createdAt ? getLocalDateString(new Date(s.createdAt)) : null) ||
          (s.timestamp ? getLocalDateString(new Date(s.timestamp)) : null);

        if (!dateStr) return;

        const domain = normalizeDomain(s.domain || s.gameType || s.gameName || s.category);
        const score = Math.max(0, Math.min(100, Math.round(Number(s.score ?? s.accuracy ?? 0))));

        if (!dateDomainMap[dateStr]) {
          dateDomainMap[dateStr] = {};
        }
        if (!dateDomainMap[dateStr][domain]) {
          dateDomainMap[dateStr][domain] = [];
        }

        const accuracy =
          s.accuracy !== undefined && s.accuracy !== null
            ? Math.round(Number(s.accuracy))
            : s.correctCount !== undefined &&
              Number(s.correctCount) + Number(s.mistakeCount || 0) > 0
            ? Math.round(
                (Number(s.correctCount) /
                  (Number(s.correctCount) + Number(s.mistakeCount || 0))) *
                  100
              )
            : null;

        dateDomainMap[dateStr][domain].push({
          score,
          accuracy,
          durationFormatted: formatDuration(s.durationSeconds),
          difficulty: s.difficultyLevel || s.difficulty || null,
          gameName: s.gameName || s.activityName || null
        });
      });
    }

    // 2. Process rawScores (from db.cognitiveScores for table parity)
    if (rawScores && rawScores.length > 0) {
      rawScores.forEach((item) => {
        if (targetPatientId) {
          const rPid = Number(item.patientId ?? item.patient_id ?? item.userId ?? item.user_id);
          if (rPid && rPid !== targetPatientId) return;
        }

        const dateStr =
          item.date ||
          (item.timestamp ? getLocalDateString(new Date(item.timestamp)) : null) ||
          (item.createdAt ? getLocalDateString(new Date(item.createdAt)) : null);

        if (!dateStr) return;

        const domain = normalizeDomain(item.domain || item.gameType || item.category);
        const score = Math.max(0, Math.min(100, Math.round(Number(item.score || 0))));

        if (!dateDomainMap[dateStr]) {
          dateDomainMap[dateStr] = {};
        }
        if (!dateDomainMap[dateStr][domain]) {
          dateDomainMap[dateStr][domain] = [];
        }

        // Avoid duplicate entry if identical score on that day was already recorded via sessions
        const alreadyHas = dateDomainMap[dateStr][domain].some((entry) => entry.score === score);
        if (!alreadyHas) {
          dateDomainMap[dateStr][domain].push({
            score,
            accuracy: item.accuracy !== undefined ? Math.round(Number(item.accuracy)) : null,
            durationFormatted: formatDuration(item.durationSeconds),
            difficulty: item.difficulty || item.difficultyLevel || null,
            gameName: item.gameName || item.activityName || null
          });
        }
      });
    }

    let recordedPoints = 0;
    let daysWithActivity = 0;

    // 3. Build contiguous daily series across the calendar window
    const data = calendarDates.map((dStr) => {
      const dayData = dateDomainMap[dStr] || {};
      let hasDayActivity = false;

      const getDomainData = (dom) => {
        const records = dayData[dom];
        if (!records || records.length === 0) return { score: null, meta: null };

        recordedPoints++;
        hasDayActivity = true;

        // Consistent daily aggregation: arithmetic average rounded to whole integer
        const avgScore = Math.round(
          records.reduce((acc, r) => acc + r.score, 0) / records.length
        );
        const latest = records[records.length - 1];

        return {
          score: avgScore,
          meta: {
            score: avgScore,
            gameName: latest.gameName,
            accuracy: latest.accuracy,
            durationFormatted: latest.durationFormatted,
            difficulty: latest.difficulty,
            sessionCount: records.length
          }
        };
      };

      const mem = getDomainData('memory');
      const att = getDomainData('attention');
      const rout = getDomainData('routine');
      const pat = getDomainData('pattern');

      if (hasDayActivity) daysWithActivity++;

      return {
        rawDate: dStr,
        date: formatDisplayDate(dStr),
        memory: mem.score,
        memoryMeta: mem.meta,
        attention: att.score,
        attentionMeta: att.meta,
        routine: rout.score,
        routineMeta: rout.meta,
        pattern: pat.score,
        patternMeta: pat.meta
      };
    });

    return {
      chartData: data,
      hasAnyData: recordedPoints > 0,
      activeDaysCount: daysWithActivity
    };
  }, [sessions, rawScores, patientId, timeRange]);

  const toggleDomain = (domain) => {
    setActiveDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const domainConfigs = [
    { key: 'memory', label: 'Memory (Bihu)', color: '#0d9488' },
    { key: 'attention', label: 'Attention (Hills Sound)', color: '#ea580c' },
    { key: 'routine', label: 'Daily Routine (Tea Garden)', color: '#6366f1' },
    { key: 'pattern', label: 'Pattern (Mekhela)', color: '#d97706' }
  ];

  return (
    <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm transition-colors duration-200">
      {/* Chart Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#243352]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-smriti-teal-700 dark:text-teal-300 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
              Cognitive Trajectory Trends
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-0.5">
              Live longitudinal trajectory across 4 neuro-cognitive domains (Dexie DB)
            </p>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1E293B] p-1 rounded-2xl border border-slate-200 dark:border-[#243352] self-stretch sm:self-auto">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                timeRange === days
                  ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Domain Toggles */}
      <div className="flex flex-wrap gap-2 pt-4 pb-2">
        {domainConfigs.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleDomain(key)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeDomains[key]
                ? 'bg-slate-50 dark:bg-[#1E293B] border-slate-300 dark:border-[#243352] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'bg-slate-100/60 dark:bg-[#1E293B]/40 border-transparent text-slate-400 dark:text-slate-500 opacity-60'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: activeDomains[key] ? color : '#94a3b8' }}
            />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Chart Area with Distinct Loading, Error, Empty, and Populated States */}
      <div className="h-72 md:h-84 w-full mt-4">
        {isLoading ? (
          // State 1: Loading Skeleton & Spinner
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading cognitive trajectory...</span>
          </div>
        ) : isError ? (
          // State 2: Error State
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/60">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Unable to load cognitive activity records
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                There was a problem reading local session records.
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        ) : !hasAnyData ? (
          // State 3: Polished Empty State (Honest Representation of Inactive Period)
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-3 bg-slate-50/50 dark:bg-[#1E293B]/30 rounded-2xl border border-dashed border-slate-200 dark:border-[#243352]">
            <div className="w-14 h-14 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
              <Brain className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                No Cognitive Activity Recorded in the Last {timeRange} Days
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                When {patientName} plays memory, pattern, attention, or daily routine activities, real longitudinal trajectory lines will appear here.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1E293B] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#243352] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Inactive calendar days render as gaps (null), never false 0% drops
              </span>
            </div>
          </div>
        ) : (
          // State 4: Multi-Series Recharts Line Graph
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#243352' : '#f1f5f9'} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#243352' : '#e2e8f0' }}
              />
              <YAxis
                domain={[30, 100]}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#243352' : '#e2e8f0' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomChartTooltip />} />

              {/* Clinical Benchmark Line */}
              <ReferenceLine
                y={60}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'Clinical Attention Threshold (60%)',
                  fill: '#e11d48',
                  fontSize: 10,
                  fontWeight: 700,
                  position: 'insideBottomRight'
                }}
              />

              {activeDomains.memory && (
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#0d9488"
                  strokeWidth={3}
                  strokeLinecap="round"
                  connectNulls={false}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff', stroke: '#0d9488' }}
                  activeDot={{ r: 7, strokeWidth: 2, fill: '#0d9488', stroke: '#fff' }}
                  name="Memory"
                />
              )}
              {activeDomains.attention && (
                <Line
                  type="monotone"
                  dataKey="attention"
                  stroke="#ea580c"
                  strokeWidth={3}
                  strokeLinecap="round"
                  connectNulls={false}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff', stroke: '#ea580c' }}
                  activeDot={{ r: 7, strokeWidth: 2, fill: '#ea580c', stroke: '#fff' }}
                  name="Attention"
                />
              )}
              {activeDomains.routine && (
                <Line
                  type="monotone"
                  dataKey="routine"
                  stroke="#6366f1"
                  strokeWidth={3}
                  strokeLinecap="round"
                  connectNulls={false}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff', stroke: '#6366f1' }}
                  activeDot={{ r: 7, strokeWidth: 2, fill: '#6366f1', stroke: '#fff' }}
                  name="Daily Routine"
                />
              )}
              {activeDomains.pattern && (
                <Line
                  type="monotone"
                  dataKey="pattern"
                  stroke="#d97706"
                  strokeWidth={3}
                  strokeLinecap="round"
                  connectNulls={false}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff', stroke: '#d97706' }}
                  activeDot={{ r: 7, strokeWidth: 2, fill: '#d97706', stroke: '#fff' }}
                  name="Pattern"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-[#243352] mt-2 gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {hasAnyData
            ? `${activeDaysCount} active days recorded in the last ${timeRange} days (Dexie IndexedDB)`
            : 'Zero cloud dependency • Live local Dexie IndexedDB sync'}
        </span>
        <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1E293B] border border-transparent dark:border-[#243352] px-2.5 py-1 rounded-lg">
          Normal Population Baseline: 70–85%
        </span>
      </div>
    </div>
  );
}

