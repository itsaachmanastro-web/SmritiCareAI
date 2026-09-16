import React from 'react';
import { Gamepad2, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ActivityLogTable({ sessions = [] }) {
  const { t, formatDate, formatTime } = useLanguage();

  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'hard':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'medium':
      default:
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    }
  };

  const formatSessionTime = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return `${formatDate(d)} ${formatTime(d)}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {t('caregiver.recentGameActivity')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Synced from local IndexedDB session logs
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Showing {sessions.length} sessions
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 text-xs uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-[#243352]">
            <tr>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Origin</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Accuracy</th>
              <th className="py-3 px-4">Completed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#243352] font-medium">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr key={session.id || `${session.date}_${session.activityName}`} className="hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-lg">
                      {session.activityType === 'reminder' ? '⏰' : session.gameType === 'pattern' ? '🧵' : session.gameType === 'routine' ? '☕' : session.gameType === 'attention' ? '🎵' : '🎯'}
                    </span>
                    <div>
                      <div>{session.activityName || session.gameName}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                        {session.domain || session.gameType || 'General'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {session.isDemo ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                        Demo Simulation
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        Real Record
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-full text-xs ${
                      session.score >= 80
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : session.score >= 60
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    }`}>
                      <Award className="w-3.5 h-3.5" />
                      {session.score}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getDifficultyBadge(session.difficultyLevel || session.difficulty)}`}>
                      {session.difficultyLevel || session.difficulty || 'Medium'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {session.durationSeconds ? `${session.durationSeconds}s` : '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3 text-xs">
                      {session.accuracy !== undefined ? (
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {session.accuracy}%
                        </span>
                      ) : null}
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {session.correctCount ?? '-'}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                        <XCircle className="w-3.5 h-3.5" /> {session.mistakeCount ?? session.mistakes ?? '-'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    {formatSessionTime(session.completedAt || session.timestamp)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">📝</span>
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                      No Activity Records for this Patient
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Play cognitive games or complete scheduled daily reminders in Patient mode to populate real audit logs.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
