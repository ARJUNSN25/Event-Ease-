/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  setOrganizerSession,
  verifyOrganizerCredentials,
  isAuthorizedOrganizerEmail,
  AUTHORIZED_ORGANIZER_EMAIL,
  AUTHORIZED_ORGANIZER_PASSWORD,
} from '../store';
import { useToast } from './Toast';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Ticket,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface OrganizerAuthProps {
  onLoginSuccess: (email: string) => void;
  onNavigateToRegister?: (prefillEmail?: string) => void;
}

export function OrganizerAuth({ onLoginSuccess, onNavigateToRegister }: OrganizerAuthProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!trimmedEmail) {
      setError('Please enter your organizer email address.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your organizer password.');
      return;
    }

    // Check credentials: Only arjunsn258@gmail.com with password 143211
    if (trimmedEmail !== AUTHORIZED_ORGANIZER_EMAIL.toLowerCase()) {
      setError('Access denied: Invalid organizer email or credentials.');
      return;
    }

    const isValid = verifyOrganizerCredentials(trimmedEmail, cleanPassword);
    if (!isValid) {
      setError('Incorrect password. Please enter the valid organizer security password.');
      return;
    }

    setIsSubmitting(true);
    try {
      setOrganizerSession(trimmedEmail, cleanPassword);
      showToast('Welcome! Organizer session authenticated.', 'success');
      onLoginSuccess(trimmedEmail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-14 pb-28 md:pb-16 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Band */}
        <div className="bg-slate-50 border-b border-slate-200 text-slate-900 p-6 sm:p-7 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Lock className="w-3 h-3 text-indigo-600" />
              Organizer Console
            </span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
            Organizer Portal Sign In
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Administrative access for campus event directors. Sign in to manage events, monitor live attendance tracking, and run gate check-in scanners.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="organizer-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Organizer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="organizer-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@college.edu or organizer email"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors ${
                    error ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="organizer-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Security Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="organizer-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter security password"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors ${
                    error ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[46px] shadow-sm cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Organizer Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Student & Participant Redirect Section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Are you a student registering for events?
                  </span>
                  Students do not need organizer credentials. Use the student registration portal to reserve seats and download entry QR passes.
                </div>
              </div>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={() => onNavigateToRegister()}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Go to Student Registration Portal &rarr;</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
