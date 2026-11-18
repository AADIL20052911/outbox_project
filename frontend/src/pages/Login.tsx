import React, { useState } from 'react';
import { CalendarClock, ShieldCheck, Zap, ArrowRight, Lock } from 'lucide-react';
import { apiService } from '../services/api';

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    window.location.href = apiService.getGoogleOAuthUrl();
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[var(--background)]">
      {}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-zinc-950 text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden select-none border-b md:border-b-0 md:border-r border-zinc-800">
        {}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {}
        <div className="flex items-center gap-3 z-10">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-subtle">
            R
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ReachInbox</span>
        </div>

        {}
        <div className="my-12 z-10 max-w-lg">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded border border-blue-800">
            Email Operations Console
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-100 mt-4 leading-tight">
            High-volume cold outreach with rate limit immunity.
          </h1>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            Automate recipient batch scheduling, throttle limits, and native Slack alerts without burning sending domain reputation.
          </p>

          {}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-zinc-800">
            <div className="flex flex-col gap-1.5 p-3 rounded-ten bg-zinc-900/60 border border-zinc-800/80">
              <CalendarClock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-zinc-200">Schedule</span>
              <span className="text-[11px] text-zinc-400">Queue CSV batches</span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-ten bg-zinc-900/60 border border-zinc-800/80">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">Control</span>
              <span className="text-[11px] text-zinc-400">Hourly caps & delays</span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-ten bg-zinc-900/60 border border-zinc-800/80">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-200">Deliver</span>
              <span className="text-[11px] text-zinc-400">BullMQ deferred windows</span>
            </div>
          </div>
        </div>

        {}
        <div className="z-10 text-xs text-zinc-500 font-mono flex items-center justify-between">
          <span>ReachInbox Platform Inc.</span>
          <span>Security SOC2 Compliant</span>
        </div>
      </div>

      {}
      <div className="w-full md:w-7/12 lg:w-1/2 p-8 lg:p-16 flex flex-col items-center justify-center bg-[var(--surface)]">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          {}
          <div className="w-12 h-12 rounded-ten bg-white text-zinc-950 border border-zinc-200 flex items-center justify-center shadow-subtle">
            <span className="font-bold text-xl tracking-tight">R</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Welcome back</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Sign in with your Google workspace account to access the email scheduling dashboard.
            </p>
          </div>

          {}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--surface)] hover:bg-zinc-50 text-[var(--text-primary)] font-semibold text-sm border border-[var(--border)] rounded-ten shadow-subtle hover:shadow-card transition-all disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                {}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform ml-auto" />
              </>
            )}
          </button>

          <div className="w-full flex items-center gap-3 my-1">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">or</span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                setIsLoading(true);
                await apiService.devLogin();
                window.location.href = '/dashboard';
              } catch (err: any) {
                alert(`Dev login error: ${err?.response?.data?.message || err?.message || 'Failed'}`);
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-ten shadow-subtle transition-all disabled:opacity-60"
          >
            <span>🚀 Instant Dev / Demo Login</span>
          </button>

          {}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single Sign-On protected by Google Workspace</span>
          </div>

          {}
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-4">
            By signing in, you agree to ReachInbox’s{' '}
            <a href="#" className="underline hover:text-[var(--text-primary)]">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-[var(--text-primary)]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
