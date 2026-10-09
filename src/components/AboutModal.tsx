/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Sparkles,
  Ticket,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  Award,
  Zap,
  GraduationCap,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreEvents: () => void;
  onOpenOrganizer: () => void;
}

export function AboutModal({
  isOpen,
  onClose,
  onExploreEvents,
  onOpenOrganizer,
}: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Indigo gradient accent */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 p-6 sm:p-8 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>National Hackathon & Campus Edition</span>
          </div>

          <h2 id="about-modal-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            About EventEase
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base mt-2 max-w-lg leading-relaxed">
            The next-generation campus event management & instant digital pass check-in platform designed for universities, colleges, and student organizations.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-700">
          {/* Mission statement */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Our Mission</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              EventEase eliminates long entry lines, lost paper tickets, and chaotic manual attendance sheets. We provide student participants with cryptographic QR digital passes on their mobile devices and empower campus event organizers with real-time camera scanning, capacity controls, and instant attendance analytics.
            </p>
          </div>

          {/* Key Features Grid */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Key Platform Capabilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Instant Digital Passes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register in seconds and receive high-res scannable QR ticket passes instantly.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Live Camera Check-In Desk</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Zero-latency gate verification with sound feedback and duplicate scan prevention.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Anti-Fraud Protection</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict duplicate check-in detection preserving authentic gate entry records.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Organizer Analytics & CSV</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time registration counts, capacity monitors, and 1-click attendee CSV exports.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* College Accreditation Banner */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-950">Built for Collegiate Excellence</p>
                <p className="text-xs text-indigo-700">Supported across engineering faculties, student clubs, and sports councils.</p>
              </div>
            </div>
            <Award className="w-5 h-5 text-indigo-500 shrink-0 hidden sm:block" />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrganizer();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Organizer Access
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onExploreEvents();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Explore College Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
