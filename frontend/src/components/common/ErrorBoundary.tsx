import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-rose-900/60 shadow-[0_0_30px_rgba(244,63,94,0.15)] my-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">
                  COMPONENT INTERCEPTED
                </span>
                <span className="text-xs font-mono text-slate-500">RUNTIME SAFEGUARD</span>
              </div>

              <h2 className="text-base font-bold text-white">
                {this.props.fallbackTitle || 'A rendering error occurred in this view.'}
              </h2>

              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                The firewall's shell caught an unhandled exception. The rest of the application remains fully secure and operational.
              </p>

              {this.state.error && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-rose-300 break-words">
                  {this.state.error.message}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-mono transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Component View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
