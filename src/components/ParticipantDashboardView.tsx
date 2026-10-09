/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Registration,
  Event,
  listEvents,
  listAllRegistrations,
  getAttendeeProfile,
  saveAttendeeProfile,
  cancelRegistration,
  subscribeToStore,
  AttendeeProfile,
} from '../store';
import { useToast } from './Toast';
import { EventBannerImage } from './EventBannerImage';
import {
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Search,
  User,
  Building2,
  GraduationCap,
  Sparkles,
  AlertCircle,
  X,
  Share2,
  ArrowRight,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface ParticipantDashboardViewProps {
  onNavigateToEvents: () => void;
  onSelectEventForRegister: (eventId: string) => void;
}

export function ParticipantDashboardView({
  onNavigateToEvents,
  onSelectEventForRegister,
}: ParticipantDashboardViewProps) {
  const { showToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [profile, setProfile] = useState<AttendeeProfile | null>(() => getAttendeeProfile());

  // Search / Lookup filter
  const [searchQuery, setSearchQuery] = useState(() => profile?.email || '');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'checkedIn'>('all');

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [emailInput, setEmailInput] = useState(profile?.email || '');
  const [phoneInput, setPhoneInput] = useState(profile?.phone || '');
  const [collegeInput, setCollegeInput] = useState(profile?.collegeName || 'Marwadi University');
  const [branchInput, setBranchInput] = useState(profile?.branch || 'Computer Science & Engineering');

  // Enlarge QR Modal state
  const [enlargedPass, setEnlargedPass] = useState<{
    registration: Registration;
    event: Event;
    qrUrl: string;
  } | null>(null);

  // Cached QR data URLs mapped by registration code
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshData = () => {
    setEvents(listEvents());
    setAllRegistrations(listAllRegistrations());
    const p = getAttendeeProfile();
    setProfile(p);
  };

  useEffect(() => {
    refreshData();
    const unsub = subscribeToStore(() => {
      refreshData();
    });
    return unsub;
  }, []);

  // Update QR codes for visible registrations
  useEffect(() => {
    allRegistrations.forEach((r) => {
      if (!qrMap[r.code]) {
        QRCode.toDataURL(r.code, {
          width: 360,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        }).then((url) => {
          setQrMap((prev) => ({ ...prev, [r.code]: url }));
        });
      }
    });
  }, [allRegistrations]);

  // Registrations filtered by user query
  const filteredRegistrations = useMemo(() => {
    let list = [...allRegistrations];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.phone && r.phone.toLowerCase().includes(q))
      );
    }

    if (filterStatus === 'checkedIn') {
      list = list.filter((r) => r.checkedIn);
    } else if (filterStatus === 'upcoming') {
      list = list.filter((r) => !r.checkedIn);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allRegistrations, searchQuery, filterStatus]);

  // Aggregate stats
  const totalRegistered = filteredRegistrations.length;
  const totalAttended = filteredRegistrations.filter((r) => r.checkedIn).length;
  const totalUpcoming = totalRegistered - totalAttended;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!emailInput.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }

    const updated: AttendeeProfile = {
      name: nameInput.trim(),
      email: emailInput.trim().toLowerCase(),
      phone: phoneInput.trim(),
      collegeName: collegeInput.trim(),
      branch: branchInput.trim(),
    };

    saveAttendeeProfile(updated);
    setProfile(updated);
    setSearchQuery(updated.email);
    setIsEditingProfile(false);
    showToast('Attendee profile saved successfully!', 'success');
  };

  const handleCancelPass = (code: string, eventName: string) => {
    if (window.confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
      const ok = cancelRegistration(code);
      if (ok) {
        showToast('Registration cancelled.', 'info');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Pass code ${code} copied!`, 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrintPass = (reg: Registration, ev: Event) => {
    window.print();
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-60 h-60 bg-blue-50/60 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Participant Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Registrations & Digital Passes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Access your cryptographic QR entry passes, track check-in status, and present your digital credentials at college gates.
            </p>
          </div>

          {/* Quick Profile Summary Badge / Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-indigo-600" />
              <span>{profile?.name ? profile.name : 'Configure Profile'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToEvents}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Explore More</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Drawer / Card if active */}
      {isEditingProfile && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">Student Profile & Settings</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Priya Patel"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. priya.patel@marwadiuniversity.ac.in"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 98234 56789"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University</label>
              <input
                type="text"
                value={collegeInput}
                onChange={(e) => setCollegeInput(e.target.value)}
                placeholder="Marwadi University"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Branch</label>
              <input
                type="text"
                value={branchInput}
                onChange={(e) => setBranchInput(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Passes</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalRegistered}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmed & Upcoming</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{totalUpcoming}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Checked-In</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalAttended}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Lookup Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Email or Code Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter passes by email, your name, or pass code..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status pill toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Passes ({allRegistrations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'upcoming' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('checkedIn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'checkedIn' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Checked In
          </button>
        </div>
      </div>

      {/* Digital Tickets Pass List */}
      {filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">No Passes Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No passes matched '${searchQuery}'. Try resetting your search filter.`
                : 'You have not registered for any events yet, or your profile is not linked.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSearchQuery('priya.patel@marwadiuniversity.ac.in')}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  View Sample Seeded Pass
                </button>
                <button
                  type="button"
                  onClick={onNavigateToEvents}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Browse Campus Events
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRegistrations.map((reg) => {
            const ev = events.find((e) => e.id === reg.eventId) || {
              id: reg.eventId,
              name: 'Campus Event',
              date: 'Scheduled',
              venue: 'Main Campus',
              capacity: 100,
              createdAt: reg.createdAt,
            };

            const qrUrl = qrMap[reg.code];

            return (
              <div
                key={reg.id}
                className="relative bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-indigo-500/40"
              >
                {/* Perforated ticket layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Left: Event & Attendee Details (Col 8) */}
                  <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Digital Ticket Pass
                          </span>

                          {reg.checkedIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Checked In {reg.checkedInAt ? `(${new Date(reg.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Confirmed & Upcoming</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400">
                          Registered {new Date(reg.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                        {ev.name}
                      </h3>

                      {/* Date & Venue Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{ev.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendee Verified Credentials Box */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                        Pass Holder Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400 text-[11px]">Attendee</p>
                          <p className="font-bold text-slate-900 truncate">{reg.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[11px]">Email</p>
                          <p className="font-medium text-slate-700 truncate">{reg.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[11px]">Institution</p>
                          <p className="font-medium text-slate-700 truncate">{reg.collegeName || 'University'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(reg.code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedCode === reg.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Code: {reg.code}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintPass(reg, ev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print Pass</span>
                      </button>

                      {!reg.checkedIn && (
                        <button
                          type="button"
                          onClick={() => handleCancelPass(reg.code, ev.name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel Pass</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: QR Code & Fast Gate Pass (Col 4) */}
                  <div className="lg:col-span-4 bg-slate-50 p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-dashed border-slate-200 relative">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Fast Gate Entry
                    </span>

                    {/* QR Code Presentation Box */}
                    <div
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:scale-102 transition-transform"
                      onClick={() => qrUrl && setEnlargedPass({ registration: reg, event: ev, qrUrl })}
                      title="Click to enlarge QR code for gate check-in"
                    >
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR Pass for ${reg.name}`}
                          className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <p className="font-mono font-bold text-xs sm:text-sm text-slate-800 tracking-wider mt-3">
                      {reg.code}
                    </p>

                    <button
                      type="button"
                      onClick={() => qrUrl && setEnlargedPass({ registration: reg, event: ev, qrUrl })}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Enlarge for Scanner</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged QR Modal for Gate Check-in */}
      {enlargedPass && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setEnlargedPass(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Official Digital Entry Pass
              </span>
              <button
                type="button"
                onClick={() => setEnlargedPass(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 flex justify-center">
              <img
                src={enlargedPass.qrUrl}
                alt="Enlarged QR Code"
                className="w-60 h-60 object-contain"
              />
            </div>

            <p className="font-mono font-black text-lg text-slate-900 tracking-widest mb-1">
              {enlargedPass.registration.code}
            </p>
            <p className="text-xs font-bold text-slate-700">{enlargedPass.registration.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{enlargedPass.event.name}</p>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-semibold text-slate-500">
                Present this screen directly to the gate scanner desk
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
