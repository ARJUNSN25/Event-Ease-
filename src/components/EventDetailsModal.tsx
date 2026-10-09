/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Ticket,
  Share2,
  Building2,
  CheckCircle2,
  Sparkles,
  Clock,
  ShieldCheck,
  Award,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Event, getStats } from '../store';
import { getCategoryInfo } from '../utils/categories';
import { EventBannerImage } from './EventBannerImage';

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister: (eventId: string) => void;
  onShare: (event: Event) => void;
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onRegister,
  onShare,
}: EventDetailsModalProps) {
  if (!isOpen || !event) return null;

  const stats = getStats(event.id);
  const isFull = stats.capacity > 0 && stats.remaining === 0;
  const categoryInfo = getCategoryInfo(event.category);
  const CategoryIcon = categoryInfo.icon;

  const percentBooked = stats.capacity > 0 ? Math.round((stats.registered / stats.capacity) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Scrim & Badges */}
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
          <EventBannerImage
            src={event.bannerUrl}
            category={event.category}
            alt={event.name}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top category & status badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
              <CategoryIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{categoryInfo.label}</span>
            </span>

            {event.status === 'ongoing' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>LIVE NOW</span>
              </span>
            )}
          </div>

          {/* Title on Banner */}
          <div className="absolute bottom-4 inset-x-4 text-white">
            <h2 id="event-details-title" className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug drop-shadow-sm">
              {event.name}
            </h2>
            {event.organizerName && (
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Organized by {event.organizerName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Key Facts Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
                <p className="text-xs font-bold text-slate-900 truncate">{event.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Venue</p>
                <p className="text-xs font-bold text-slate-900 truncate">{event.venue}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Availability</p>
                <p className="text-xs font-bold text-slate-900">
                  {isFull ? (
                    <span className="text-red-600">Full ({stats.capacity} max)</span>
                  ) : (
                    <span>{stats.remaining} spots left</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>Registration Status</span>
              <span>{stats.registered} of {stats.capacity} registered ({percentBooked}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFull ? 'bg-red-500' : percentBooked > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, percentBooked)}%` }}
              />
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Overview & Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Agenda & Schedule */}
          {event.agenda && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Event Agenda & Milestones</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
                {event.agenda}
              </div>
            </div>
          )}

          {/* Eligibility & Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {event.eligibility && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Eligibility
                </h3>
                <p className="text-xs text-slate-600">{event.eligibility}</p>
              </div>
            )}

            {event.requirements && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Requirements
                </h3>
                <p className="text-xs text-slate-600">{event.requirements}</p>
              </div>
            )}
          </div>

          {/* Perks list */}
          {event.perks && event.perks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Participant Perks & Benefits</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.perks.map((perk, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200/80 text-amber-900"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onShare(event)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span>Share Event</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isFull}
              onClick={() => {
                onClose();
                onRegister(event.id);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>{isFull ? 'Event Full' : 'Register for Pass'}</span>
              {!isFull && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
