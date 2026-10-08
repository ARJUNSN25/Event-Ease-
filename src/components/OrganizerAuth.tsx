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
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDeniedEmail(null);

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

    // Check email authorization
    if (!isAuthorizedOrganizerEmail(trimmedEmail)) {
      setDeniedEmail(trimmedEmail);
      setError(
        `Access Denied: '${trimmedEmail}' is not authorized for the Organizer Portal. Other email addresses are reserved for student & attendee event registration.`
      );
      return;
    }

    // Check credentials (email + password)
    const isValid = verifyOrganizerCredentials(trimmedEmail, cleanPassword);
    if (!isValid) {
      setError('Incorrect password. Please verify your credentials and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      setOrganizerSession(trimmedEmail, cleanPassword);
      showToast('Welcome back! Organizer session authenticated.');
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
      <div className="w-full max-w-md bg-white rounded-[20px] border border-[#E1E5EE] shadow-[0_12px_36px_rgba(14,20,36,0.08)] overflow-hidden">
        {/* Header Band */}
        <div className="bg-[#0E1424] text-white p-6 sm:p-7 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#3345E8] flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Lock className="w-3 h-3" />
              Restricted Console
            </span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight">
            Organizer Portal
          </h1>
          <p className="text-xs sm:text-[13px] text-white/70 mt-1.5 leading-relaxed">
            Administrative access is strictly protected. Please sign in with your authorized organizer email and security password.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Access Denied Callout Box when an unauthorized email is entered */}
          {deniedEmail && (
            <div className="p-4 rounded-[12px] bg-[#FFF4F2] border border-[#F87171]/50 text-[#991B1B] space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
                    Organizer Access Restricted
                  </h2>
                  <p className="text-xs text-[#7F1D1D] leading-relaxed">
                    The email <strong className="font-semibold text-black">{deniedEmail}</strong> does not have organizer administrative privileges.
                  </p>
                  <p className="text-xs text-[#991B1B] font-medium pt-0.5">
                    Other email accounts are reserved for student & attendee event registrations.
                  </p>
                </div>
              </div>

              {/* Action buttons inside the denial box */}
              {onNavigateToRegister && (
                <div className="pt-2 border-t border-[#F87171]/30">
                  <button
                    type="button"
                    onClick={() => onNavigateToRegister(deniedEmail)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0E1424] hover:bg-black text-white text-xs font-bold py-2.5 px-3 rounded-[8px] transition-colors shadow-xs"
                  >
                    <Ticket className="w-3.5 h-3.5 text-blue-400" />
                    <span>Register for Events with this Email &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="organizer-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5"
              >
                Organizer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    if (deniedEmail) setDeniedEmail(null);
                  }}
                  placeholder="name@college.edu or organizer email"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors ${
                    error && !deniedEmail ? 'border-[#C0302F]' : 'border-[#E1E5EE]'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="organizer-password"
                className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5"
              >
                Security Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className={`w-full pl-10 pr-11 py-2.5 text-sm bg-white border rounded-[10px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors ${
                    error && !deniedEmail ? 'border-[#C0302F]' : 'border-[#E1E5EE]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#0E1424] p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && !deniedEmail && (
                <p className="text-xs text-[#C0302F] font-semibold mt-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] active:bg-[#1E2BB8] disabled:opacity-50 text-white font-bold text-sm py-3 px-4 rounded-[10px] transition-all focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[46px] shadow-sm cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Organizer Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Student & Participant Redirect Section */}
          <div className="pt-4 border-t border-[#E1E5EE] space-y-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-[12px]">
              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-[#3345E8] shrink-0 mt-0.5" />
                <div className="text-xs text-[#475569] leading-relaxed">
                  <span className="font-bold text-[#0E1424] block mb-0.5">
                    Are you a student registering for events?
                  </span>
                  Students do not need organizer credentials. Use the student registration portal to reserve seats and download entry QR passes.
                </div>
              </div>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={() => onNavigateToRegister()}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#F1F5F9] text-[#3345E8] border border-[#CBD5E1] text-xs font-bold py-2.5 px-3 rounded-[8px] transition-colors cursor-pointer"
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
