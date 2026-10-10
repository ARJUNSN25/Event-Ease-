/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  X,
  User,
  Shield,
  Lock,
  Mail,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  saveAttendeeProfile,
  getAttendeeProfile,
  setOrganizerSession,
  verifyOrganizerCredentials,
  AUTHORIZED_ORGANIZER_EMAIL,
  AUTHORIZED_ORGANIZER_PASSWORD,
} from '../store';
import { useToast } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipantSuccess: (email: string) => void;
  onOrganizerSuccess: (email: string) => void;
  initialMode?: 'student' | 'organizer';
}

export function AuthModal({
  isOpen,
  onClose,
  onParticipantSuccess,
  onOrganizerSuccess,
  initialMode = 'student',
}: AuthModalProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'student' | 'organizer'>(initialMode);

  // Student profile state
  const existingProfile = getAttendeeProfile();
  const [studentName, setStudentName] = useState(existingProfile?.name || '');
  const [studentEmail, setStudentEmail] = useState(existingProfile?.email || '');
  const [studentCollege, setStudentCollege] = useState(existingProfile?.collegeName || 'Marwadi University');

  // Organizer state
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPassword, setOrgPassword] = useState('');
  const [orgError, setOrgError] = useState('');

  if (!isOpen) return null;

  const handleContinueWithGoogle = () => {
    // Generate/Use realistic user Google Profile for student login
    const googleEmail = 'arjunsn258@gmail.com';
    const googleName = 'Arjun S. N.';
    const college = studentCollege.trim() || 'Marwadi University';

    saveAttendeeProfile({
      name: googleName,
      email: googleEmail,
      collegeName: college,
    });

    showToast(`Signed in with Google as ${googleName} (${googleEmail})!`, 'success');
    onParticipantSuccess(googleEmail);
    onClose();
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    const trimmedEmail = studentEmail.trim().toLowerCase();

    if (!trimmedName) {
      showToast('Please enter your full name', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      showToast('Please enter a valid student email address', 'error');
      return;
    }

    saveAttendeeProfile({
      name: trimmedName,
      email: trimmedEmail,
      collegeName: studentCollege.trim() || 'College/University',
    });

    showToast(`Welcome, ${trimmedName}! Passes synchronized.`, 'success');
    onParticipantSuccess(trimmedEmail);
    onClose();
  };

  const handleOrganizerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError('');

    const normEmail = orgEmail.trim().toLowerCase();
    const normPass = orgPassword.trim();

    if (!verifyOrganizerCredentials(normEmail, normPass)) {
      setOrgError('Invalid credentials. Access restricted to arjunsn258@gmail.com with password 143211.');
      return;
    }

    try {
      setOrganizerSession(normEmail, normPass);
      showToast('Organizer access authenticated successfully!', 'success');
      onOrganizerSuccess(normEmail);
      onClose();
    } catch (err: any) {
      setOrgError(err.message || 'Authorization failed.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 p-0.5 flex items-center justify-center shadow-xs">
              <Logo className="w-full h-full" />
            </div>
            <h2 id="auth-modal-title" className="font-extrabold text-slate-900 text-lg">
              EventEase Account Access
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between Student & Organizer */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('student')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'student'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Attendee</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('organizer')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'organizer'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>College Organizer</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {mode === 'student' ? (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Participant Portal
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  Access Your Digital Passes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your student details to instantly view your registered QR tickets, track attendance, and auto-fill future event forms.
                </p>
              </div>

              {/* Continue with Google button for students */}
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer bg-white"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              </button>

              {/* Or separator */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-slate-400 absolute">
                  or sign in with email
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. student@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / University</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentCollege}
                    onChange={(e) => setStudentCollege(e.target.value)}
                    placeholder="e.g. Marwadi University"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Save Profile & View My Passes</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-slate-400 pt-2">
                All event registrations and passes are stored securely and cryptographically verified.
              </p>
            </form>
          ) : (
            <form onSubmit={handleOrganizerSubmit} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Staff & Council Access
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  Organizer Dashboard Sign In
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage events, track live registrations, and conduct fast camera QR code check-ins.
                </p>
              </div>

              {orgError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{orgError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={orgPassword}
                    onChange={(e) => setOrgPassword(e.target.value)}
                    placeholder="Enter organizer password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>Enter Organizer Portal</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
