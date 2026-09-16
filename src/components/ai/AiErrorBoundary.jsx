import React from 'react';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';

/**
 * AiErrorBoundary
 * Prevents AI assistant crashes from unmounting the main dashboard.
 * Provides elder-friendly recovery options and logs diagnostics in DEV mode.
 */
export class AiErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env?.DEV) {
      console.error('🚨 [AiErrorBoundary] Caught error in AI Assistant component tree:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#131D33] border-2 border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {this.props.title || 'Smriti AI is temporarily unavailable.'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              We encountered a temporary issue while starting the AI Assistant. Your memory games, reminders, and health data remain completely safe.
            </p>
          </div>

          {import.meta.env?.DEV && this.state.error && (
            <div className="text-left text-xs p-3 bg-slate-100 dark:bg-[#162238] rounded-xl border border-slate-300 dark:border-slate-700 overflow-x-auto text-rose-700 dark:text-rose-300 font-mono">
              <strong>Dev Diagnostics:</strong> {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white text-sm font-black shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            {this.props.onClose && (
              <button
                type="button"
                onClick={this.props.onClose}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-800 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-[#243352] transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AiErrorBoundary;
