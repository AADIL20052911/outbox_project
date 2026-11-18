import React, { useEffect } from 'react';
import { AlertTriangle, X, Slack, Clock, ShieldAlert } from 'lucide-react';
import { RateLimitToastPayload } from '../types';

export interface ToastProps {
  toast: RateLimitToastPayload | null;
  onClose: () => void;
  autoHideDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, autoHideDuration = 8000 }) => {
  useEffect(() => {
    if (toast && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [toast, autoHideDuration, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-amber-950 text-amber-50 border border-amber-800 rounded-ten p-4 shadow-modal relative overflow-hidden">
        {}
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-900/80 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-amber-200 tracking-tight">
                Hourly sending limit reached
              </h4>
              <button
                onClick={onClose}
                className="text-amber-400 hover:text-white p-0.5 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-amber-300 mt-1 leading-relaxed">
              Remaining emails moved to the next available window.
            </p>

            {}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-amber-800/80 pt-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-amber-400 text-[10px] uppercase font-semibold">Sender</span>
                <span className="truncate text-amber-100 font-mono text-[11px]" title={toast.sender}>
                  {toast.sender}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-amber-400 text-[10px] uppercase font-semibold">Hourly Cap</span>
                <span className="text-amber-100 font-semibold">{toast.limit} msgs/hr</span>
              </div>

              <div className="flex items-center gap-1 text-amber-200 col-span-2 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px]">
                  Next dispatch window: <strong className="text-amber-100">{toast.nextWindow}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-amber-300 col-span-2 pt-0.5">
                <Slack className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  Slack Alert Status: <span className="font-semibold text-emerald-300">{toast.slackStatus}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
