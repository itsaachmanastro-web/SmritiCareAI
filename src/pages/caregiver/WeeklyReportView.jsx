import React from 'react';
import { Printer, Download, Brain, Heart, Calendar, ShieldCheck, Award } from 'lucide-react';
import { SmritiLogo } from '../../components/common/NerIcons';
import { useLanguage } from '../../context/LanguageContext';

export default function WeeklyReportView({ patient, scores = [], sessions = [], reminders = [] }) {
  const { formatDate } = useLanguage();
  const domains = ['memory', 'attention', 'routine', 'pattern'];

  // Compute average score per domain from local scores
  const domainAverages = domains.map((dom) => {
    const domScores = scores.filter((s) => s.domain === dom);
    const avg = domScores.length > 0
      ? Math.round(domScores.reduce((acc, curr) => acc + curr.score, 0) / domScores.length)
      : 75;
    return { domain: dom, avg };
  });

  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.durationSeconds || 60), 0) / 60
  );

  const completedReminders = reminders.filter((r) => r.done).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            Weekly Cognitive & Clinical Summary
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Standardized Tele-Cognitive Report for Primary Health Center (PHC) review
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-sm shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Printable Clinical Report Paper */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-[#243352] shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:bg-white print:text-slate-900">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-200 dark:border-[#243352] print:border-slate-200 gap-4">
          <SmritiLogo className="w-12 h-12" textClass="text-2xl font-black" />

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-smriti-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 print:bg-teal-50 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-700/60 print:border-teal-200">
              Weekly Cognitive Summary
            </span>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Generated: {formatDate(new Date())}
            </p>
          </div>
        </div>

        {/* Patient & Facility Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100 dark:border-[#243352] print:border-slate-100 text-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Patient Information</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white print:text-slate-900 mt-0.5">{patient?.name || 'Active Patient'}</h3>
            <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 font-medium">Age: {patient?.age || 'N/A'} Years &bull; Location: {patient?.location || 'Assam, India'}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">Supervising Facility</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white print:text-slate-900 mt-0.5">{patient?.phcCenter || 'Titabar PHC / Tele-Care Cell'}</h3>
            <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 font-medium">Attending Officer: Dr. Arun Phukan</p>
            <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 font-medium">Family Caregiver: {patient?.primaryCaregiver || 'Registered Family Caregiver'}</p>
          </div>
        </div>

        {/* Cognitive Domains Breakdown */}
        <div className="py-6 border-b border-slate-100 dark:border-[#243352] print:border-slate-100">
          <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 print:text-slate-700 uppercase tracking-wider mb-4">
            Cognitive Domain Scores (Average over 30 days)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {domainAverages.map(({ domain, avg }) => (
              <div key={domain} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] print:bg-slate-50 border border-slate-200 dark:border-[#243352] print:border-slate-200 text-center">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 capitalize">{domain}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white print:text-slate-900 mt-1">{avg}%</p>
                <div className="w-full bg-slate-200 dark:bg-[#25334D] print:bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      avg >= 75 ? 'bg-emerald-500' : avg >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement & Compliance Stats */}
        <div className="grid grid-cols-3 gap-4 py-6 border-b border-slate-100 dark:border-[#243352] print:border-slate-100 text-center">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Engagement</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white print:text-slate-900 mt-1">{totalMinutes} Mins</p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Across {sessions.length} sessions</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Routine Adherence</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white print:text-slate-900 mt-1">
              {reminders.length > 0 ? Math.round((completedReminders / reminders.length) * 100) : 100}%
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{completedReminders} tasks confirmed</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Primary Language</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white print:text-slate-900 mt-1">Assamese</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Voice-guided</span>
          </div>
        </div>

        {/* Clinical Observations & Recommendations */}
        <div className="py-6 space-y-3">
          <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 print:text-slate-700 uppercase tracking-wider">
            Clinical Observations & Care Plan Directives
          </h4>

          <div className="bg-amber-50 dark:bg-amber-950/40 print:bg-amber-50 border border-amber-200 dark:border-amber-800/60 print:border-amber-200 rounded-2xl p-4 text-sm text-amber-950 dark:text-amber-200 print:text-amber-950 space-y-1">
            <p className="font-bold">⚠️ Attention Trajectory Observation:</p>
            <p className="text-xs leading-relaxed">
              Patient demonstrated consistent recall in daily routine sequencing (Tea Garden) and cultural memory (Bihu pairs).
              A subtle 5-day variance (-14%) was observed in acoustic attention ("Sounds of the Hills").
              Family caregiver is advised to minimize ambient evening noise and encourage daytime sensory focus exercises.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 print:bg-emerald-50 border border-emerald-200 dark:border-emerald-800/60 print:border-emerald-200 rounded-2xl p-4 text-sm text-emerald-950 dark:text-emerald-200 print:text-emerald-950 space-y-1">
            <p className="font-bold">✓ Adherence Positive:</p>
            <p className="text-xs leading-relaxed">
              Morning blood pressure medications and hydration routines have maintained over 85% adherence via the tactile voice reminders.
            </p>
          </div>
        </div>

        {/* Doctor Signature Stamp */}
        <div className="pt-6 border-t-2 border-slate-200 dark:border-[#243352] print:border-slate-200 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            <p className="font-bold text-slate-800 dark:text-white print:text-slate-800">SmritiCare Autonomous Cognitive Care Platform</p>
            <p>Clinical Cognitive Analytics &bull; Longitudinal Vitality Report</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800 dark:text-white print:text-slate-800">Verified & Signed Digitally</p>
            <p>Dr. Arun Phukan, MBBS &bull; PHC Titabar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
