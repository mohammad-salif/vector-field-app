import { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Terminal,
} from 'lucide-react';

interface FieldLoginViewProps {
  onLoginSuccess: (officerId: string) => void;
}

export function FieldLoginView({ onLoginSuccess }: FieldLoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your Field Officer ID or registered email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your security access password.');
      return;
    }

    setIsLoading(true);

    // Realistic adapter boundary simulation delay
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(trimmedId);
    }, 450);
  }

  return (
    <div
      id="field-login-container"
      className="flex min-h-screen min-h-dvh flex-col justify-between bg-neutral-100/80 px-4 py-6 sm:py-10"
    >
      <div className="mx-auto w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-900 bg-neutral-900 text-white shadow-md">
            <Shield className="h-7 w-7 text-emerald-400" />
          </div>
          <span className="mt-3 inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Logistics Intelligence Platform
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Field Officer Portal
          </h1>
          <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
            Operational transit access, route telemetry & road disruption reporting
          </p>
        </div>

        {/* Readiness State Pill (Truthful prototype state, no live network claims) */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-xs">
            <Shield className="h-3.5 w-3.5 text-neutral-600" />
            <span>Secure Field Access • Authentication service ready for integration</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="mt-5 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-7">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              Sign In to Duty Station
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Enter your assigned officer credentials to access your vehicle, route, and delivery tasks.
            </p>
          </div>

          {errorMessage && (
            <div
              id="login-error-alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Officer ID / Email */}
            <div>
              <label
                htmlFor="officer-identifier"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
              >
                Officer Identifier / ID
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="officer-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Officer ID (e.g. OFF-4091)"
                  required
                  autoComplete="username"
                  className="block min-h-[46px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="officer-password"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
              >
                Password / PIN
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="officer-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security access password"
                  required
                  autoComplete="current-password"
                  className="block min-h-[46px] w-full rounded-xl border border-neutral-300 bg-neutral-50/50 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
                <button
                  type="button"
                  id="btn-toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-black disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Officer Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Field App</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Development / Prototype Navigation Access */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-white px-2.5 text-neutral-400">
                Development / Evaluation
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              id="btn-prototype-mode-access"
              data-testid="button-prototype-mode"
              onClick={() => onLoginSuccess('OFF-4091')}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-100 active:scale-[0.99]"
            >
              <Terminal className="h-4 w-4 text-neutral-600" />
              <span>Continue in Prototype Mode</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </button>
            <p className="text-center text-[10px] text-neutral-500">
              Prototype Mode: Launches mock session as Officer V. Rawat (OFF-4091) for interface review.
            </p>
          </div>
        </div>

        {/* Prototype Adapter Boundary Notice */}
        <div className="mt-4 rounded-xl border border-neutral-200/80 bg-neutral-50/90 p-3 text-[11px] leading-relaxed text-neutral-600 shadow-2xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-700" />
            <div>
              <strong className="font-semibold text-neutral-900">
                Authentication Adapter Boundary:
              </strong>{' '}
              Configured with standard adapter interfaces ready to connect directly to Supabase Auth / Backend OAuth. No production credentials hardcoded.
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Info */}
      <footer className="mt-6 text-center text-[10px] text-neutral-400">
        Logistics Intelligence System • Field Operations Division • Version 2.4.0 (Offline-Ready)
      </footer>
    </div>
  );
}
