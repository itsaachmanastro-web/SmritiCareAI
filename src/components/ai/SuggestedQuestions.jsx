import React from 'react';
import { Gamepad2, Award, Bell, Heart, PhoneCall, Lightbulb, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function SuggestedQuestions({ onSelectQuestion, isInGame = false, isCaregiver = false }) {
  const { t } = useLanguage();

  const patientGeneralQuestions = [
    {
      id: 'game_help',
      icon: Gamepad2,
      text: t('assistant.promptGameHelp'),
      prompt: t('assistant.promptGameHelp'),
      color: 'teal'
    },
    {
      id: 'reminders',
      icon: Bell,
      text: t('assistant.promptReminderCheck'),
      prompt: t('assistant.promptReminderCheck'),
      color: 'blue'
    },
    {
      id: 'emergency',
      icon: PhoneCall,
      text: t('assistant.promptCallCaregiver'),
      prompt: t('assistant.promptCallCaregiver'),
      color: 'red'
    }
  ];

  const inGameQuestions = [
    {
      id: 'rules',
      icon: Gamepad2,
      text: t('assistant.promptGameHelp'),
      prompt: t('assistant.promptGameHelp'),
      color: 'teal'
    },
    {
      id: 'score_now',
      icon: Award,
      text: t('games.score'),
      prompt: 'Can you explain my game score?',
      color: 'indigo'
    }
  ];

  const caregiverQuestions = [
    {
      id: 'summary',
      icon: Compass,
      text: t('caregiver.exportWeeklySummary'),
      prompt: 'Summarize today\'s patient game and cognitive activity.',
      color: 'teal'
    },
    {
      id: 'pending_reminders',
      icon: Bell,
      text: t('reminders.title'),
      prompt: 'Which reminders are pending for the patient today?',
      color: 'blue'
    }
  ];

  const questions = isCaregiver
    ? caregiverQuestions
    : isInGame
    ? inGameQuestions
    : patientGeneralQuestions;

  return (
    <div className="space-y-2">
      <span className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {t('assistant.suggestedPrompts')}
      </span>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => {
          const Icon = q.icon;
          return (
            <motion.button
              key={q.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectQuestion(q.prompt)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-[#25334D] border-2 border-slate-200 dark:border-[#243352] text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold shadow-xs transition-all cursor-pointer min-h-[48px]"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-smriti-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{q.text}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
