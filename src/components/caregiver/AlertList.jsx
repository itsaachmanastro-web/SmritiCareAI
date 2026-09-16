import React, { useState, useMemo } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, Info, ArrowRight, Check, Send } from 'lucide-react';

export default function AlertList({ scores = [], reminders = [], patientName = 'Patient' }) {
  const [acknowledged, setAcknowledged] = useState({});

  // Real dynamic computation from Dexie IndexedDB data
  const dynamicAlerts = useMemo(() => {
    const alerts = [];

    // 1. Check for 5 consecutive days of declining score or sudden drop
    const domains = ['attention', 'memory', 'routine', 'pattern'];

    domains.forEach((dom) => {
      const domainScores = scores
        .filter((s) => s.domain === dom)
        .sort((a, b) => b.date.localeCompare(a.date)); // newest first

      if (domainScores.length >= 5) {
        const last5 = domainScores.slice(0, 5);
        let isDeclining = true;
        for (let i = 0; i < 4; i++) {
          if (last5[i].score >= last5[i + 1].score) {
            isDeclining = false;
            break;
          }
        }

        const drop = last5[4].score - last5[0].score;
        if (isDeclining || drop >= 15) {
          alerts.push({
            id: `decline-${dom}`,
            severity: 'warning',
            tag: 'Longitudinal Trend',
            title: `Gradual Decline in ${dom.toUpperCase()} (${drop > 0 ? `-${drop}%` : '5-day trend'})`,
            description: `Cognitive telemetry detected a consistent 5-day decline in ${dom} activities. Recommended action: schedule a review or consult PHC doctor.`,
            timestamp: 'Algorithm &bull; Telemetry',
            actionText: 'Acknowledge & Flag'
          });
        }
      }
    });

    // 2. Check for reminders missed 3+ times
    reminders.forEach((r) => {
      if (r.missedCount && r.missedCount >= 3) {
        alerts.push({
          id: `missed-${r.id}`,
          severity: 'danger',
          tag: 'Urgent Routine Alert',
          title: `Critical Routine Alert: "${r.label || r.title}" missed ${r.missedCount} times`,
          description: `Patient has skipped confirmation for scheduled ${r.type}. Check in with ${patientName} or trigger an instant voice reminder.`,
          timestamp: `Scheduled at ${r.time}`,
          actionText: 'Send Voice Reminder'
        });
      }
    });

    // 3. Positive reassurance card if routine is good
    const completedCount = reminders.filter(r => r.done || r.completed).length;
    if (completedCount >= 2) {
      alerts.push({
        id: 'positive-routine',
        severity: 'success',
        tag: 'Care Plan Win',
        title: `Positive Routine Adherence: ${completedCount} items completed today`,
        description: `${patientName} completed scheduled medicines and hydration routines on schedule with zero distress.`,
        timestamp: 'Today &bull; Sync Active',
        actionText: 'View Day Log'
      });
    }

    return alerts;
  }, [scores, reminders, patientName]);

  const handleActionClick = (alertId) => {
    setAcknowledged(prev => ({ ...prev, [alertId]: true }));
  };

  return (
    <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-xs">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
              Clinical & Care Alerts
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">
              Autonomous algorithmic triggers from local Dexie database
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-full shadow-xs">
          {dynamicAlerts.length} Active
        </span>
      </div>

      <div className="space-y-3.5 mt-4">
        {dynamicAlerts.length > 0 ? (
          dynamicAlerts.map((alert) => {
            const isDanger = alert.severity === 'danger';
            const isWarning = alert.severity === 'warning';
            const isSuccess = alert.severity === 'success';
            const isDone = acknowledged[alert.id];

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDanger
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 border-l-4 border-l-rose-600 text-rose-950 dark:text-rose-100'
                    : isWarning
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 border-l-4 border-l-amber-500 text-amber-950 dark:text-amber-100'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 border-l-4 border-l-emerald-600 text-emerald-950 dark:text-emerald-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {isDanger && <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                    {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                    {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isDanger ? 'bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200' : isWarning ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200' : 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                        }`}>
                          {alert.tag}
                        </span>
                        <h4 className="font-extrabold text-sm md:text-base leading-snug">
                          {alert.title}
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold opacity-70">
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                      {alert.description}
                    </p>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() => handleActionClick(alert.id)}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs ${
                          isDone
                            ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#25334D] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#243352] active:scale-95'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Acknowledged ✓</span>
                          </>
                        ) : (
                          <>
                            <span>{alert.actionText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-medium text-sm">
            {scores.length === 0 && reminders.length === 0
              ? `No active alerts. Complete activities with ${patientName} to generate clinical telemetry.`
              : 'No active alerts. Patient cognitive vitals are currently stable.'}
          </div>
        )}
      </div>
    </div>
  );
}

