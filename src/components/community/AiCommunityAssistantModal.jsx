import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, Heart, Check, BookOpen } from 'lucide-react';
import ElderButton from '../common/ElderButton';

export default function AiCommunityAssistantModal({
  isOpen,
  onClose,
  targetPost,
  onInsertReply
}) {
  const [selectedTask, setSelectedTask] = useState('summarize'); // 'summarize', 'simplify', 'suggest_reply'
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !targetPost) return null;

  const handleGenerate = (task) => {
    setSelectedTask(task);
    if (task === 'summarize') {
      setGeneratedOutput(
        `📌 Gentle Summary of ${targetPost.author_name}'s Post:\n\n` +
        `• Theme: Dealing with daily restlessness and emotional wandering.\n` +
        `• What Worked: Taking a peaceful walk along the fresh garden path.\n` +
        `• Key Takeaway: Connecting with nature and fresh air can gently calm distress without conflict.`
      );
    } else if (task === 'simplify') {
      setGeneratedOutput(
        `🌸 In Very Simple Words:\n\n` +
        `"${targetPost.author_name} is saying: Some mornings are hard. But walking quietly outside in the nice breeze helps us feel happy and relaxed again."`
      );
    } else if (task === 'suggest_reply') {
      setGeneratedOutput(
        `"Thank you so much for sharing this lovely experience, ${targetPost.author_name}. We also find that fresh outdoor air and a quiet stroll make a big difference when Amma feels restless. Wishing you and your family a peaceful evening!"`
      );
    }
  };

  React.useEffect(() => {
    handleGenerate('summarize');
  }, [targetPost]);

  const handleUseReply = () => {
    if (onInsertReply) {
      onInsertReply(generatedOutput);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-[#243352] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                Ask SmritiCare Assistant
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Empathetic assistance with reading and formulating responses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task Buttons */}
        <div className="py-4 border-b border-slate-100 dark:border-[#243352] space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            How would you like SmritiCare to help?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'summarize', label: 'Summarize Post', icon: '📝' },
              { id: 'simplify', label: 'Explain Simply', icon: '🌸' },
              { id: 'suggest_reply', label: 'Suggest Reply', icon: '💬' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleGenerate(t.id)}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all text-center ${
                  selectedTask === t.id
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-500 text-amber-950 dark:text-amber-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#1E293B] border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#25334D]'
                }`}
              >
                <div className="text-lg mb-0.5">{t.icon}</div>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Output Box */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#162238] border border-slate-200 dark:border-[#243352] whitespace-pre-line text-sm md:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
            {generatedOutput}
          </div>

          {/* AI Guardrail Reassurance */}
          <div className="mt-4 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center gap-2.5 text-xs text-teal-900 dark:text-teal-200 font-semibold">
            <ShieldAlert className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span>
              SmritiCare AI never posts automatically, never diagnoses medical conditions, and never exposes private health telemetry.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#243352] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors border border-transparent dark:border-[#243352]"
          >
            Close
          </button>

          {selectedTask === 'suggest_reply' && onInsertReply && (
            <ElderButton
              variant="orange"
              size="md"
              icon={Check}
              onClick={handleUseReply}
            >
              Use this Reply
            </ElderButton>
          )}
        </div>
      </div>
    </div>
  );
}
