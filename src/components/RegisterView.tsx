/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Event,
  EventStats,
  RegistrationResult,
  listEvents,
  getStats,
  register,
  subscribeToStore,
} from '../store';
import { useToast } from './Toast';
import {
  Ticket,
  ChevronDown,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  GraduationCap,
  Building2,
  Phone,
  Printer,
  Compass,
  Info,
  Clock,
  ShieldCheck,
  Award,
  Coffee,
  FileText,
  BadgeCheck,
  User,
  Share2,
  CheckCheck,
} from 'lucide-react';
import { getCategoryInfo } from '../utils/categories';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { ShareModal } from './ShareModal';

interface RegisterViewProps {
  selectedEventId: string | null;
  onSelectEventId: (id: string) => void;
  onNavigateToOrganizer: () => void;
  onNavigateToEvents?: () => void;
  initialEmail?: string;
}

const COMMON_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Electronics & Communication (ECE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Electrical Engineering (EE)',
  'BCA / MCA (Computer Applications)',
  'BBA / MBA (Management Studies)',
  'Applied Sciences & Humanities',
  'Other Degree / Branch',
];

const COMMON_SPECIALIZATIONS = [
  'Artificial Intelligence & Machine Learning (AI/ML)',
  'Data Science & Analytics',
  'Cyber Security & Forensics',
  'Cloud Computing & DevOps',
  'Full Stack Web & Mobile Development',
  'Robotics & Internet of Things (IoT)',
  'Software Systems & Architecture',
  'Automotive & Electric Vehicles',
  'General / Core Engineering',
  'Other Specialization',
];

const SUGGESTED_COLLEGES = [
  'Marwadi University',
  'Gujarat Technological University (GTU)',
  'Nirma University',
  'Pandit Deendayal Energy University (PDEU)',
  'Atmiya University',
  'Dharmsinh Desai University (DDU)',
  'L.D. College of Engineering',
  'BVM Engineering College',
];

export function RegisterView({
  selectedEventId,
  onSelectEventId,
  onNavigateToOrganizer,
  onNavigateToEvents,
  initialEmail,
}: RegisterViewProps) {
  const { showToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({ registered: 0, attended: 0, remaining: 0, capacity: 0 });

  // Mobile active tab toggle when registering (Event Details vs Register Form vs My Pass)
  const [mobileTab, setMobileTab] = useState<'form' | 'details' | 'pass'>('form');

  // Registration form inputs
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState(() => initialEmail || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [collegeNameInput, setCollegeNameInput] = useState('Marwadi University');
  const [branchInput, setBranchInput] = useState(COMMON_BRANCHES[0]);
  const [specializationInput, setSpecializationInput] = useState(COMMON_SPECIALIZATIONS[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<RegistrationResult | null>(null);

  // Update emailInput if initialEmail arrives or changes
  useEffect(() => {
    if (initialEmail && !emailInput) {
      setEmailInput(initialEmail);
    }
  }, [initialEmail]);

  // Copied state for ticket button
  const [copied, setCopied] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Reload events & stats
  const refreshData = () => {
    const all = listEvents();
    setEvents(all);

    let activeId = selectedEventId;
    if (!activeId || !all.some((e) => e.id === activeId)) {
      if (all.length > 0) {
        activeId = all[0].id;
        onSelectEventId(all[0].id);
      } else {
        activeId = null;
      }
    }

    if (activeId) {
      setStats(getStats(activeId));
    } else {
      setStats({ registered: 0, attended: 0, remaining: 0, capacity: 0 });
    }
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return unsubscribe;
  }, [selectedEventId]);

  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const isEventFull = stats.capacity > 0 && stats.remaining === 0;

  // Handle Event selection change
  const handleEventChange = (newId: string) => {
    onSelectEventId(newId);
    setErrorMessage(null);
    setSuccessResult(null);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedEventId) {
      setErrorMessage('Please select an event.');
      return;
    }

    if (!collegeNameInput.trim()) {
      setErrorMessage('Please enter your college or university name.');
      return;
    }

    if (!branchInput.trim()) {
      setErrorMessage('Please specify your academic branch / department.');
      return;
    }

    if (!specializationInput.trim()) {
      setErrorMessage('Please specify your specialization or field of study.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        eventId: selectedEventId,
        name: nameInput,
        email: emailInput,
        phone: phoneInput,
        collegeName: collegeNameInput,
        branch: branchInput,
        specialization: specializationInput,
      });

      setSuccessResult(res);
      setMobileTab('pass');
      showToast("Registration confirmed! Your verified entry pass is ready.");
      // Scroll to pass on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during registration.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Entry pass code copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy automatically.', 'warning');
    }
  };

  // Download QR code PNG
  const handleDownloadQr = (qrUrl: string, code: string) => {
    try {
      const link = document.createElement('a');
      link.download = `${code}-entry-pass.png`;
      link.href = qrUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Entry pass QR downloaded.');
    } catch {
      showToast('Could not download QR code.', 'warning');
    }
  };

  // Print pass
  const handlePrintPass = () => {
    window.print();
  };

  // Reset to register another person
  const handleRegisterAnother = () => {
    setNameInput('');
    setEmailInput('');
    setPhoneInput('');
    setSuccessResult(null);
    setErrorMessage(null);
    setMobileTab('form');
  };

  if (events.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-[20px] border border-[#E1E5EE] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E8EBFE] text-[#3345E8] flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0E1424] mb-2">
            No active events
          </h2>
          <p className="text-[#5B6478] text-sm mb-6">
            There are currently no events open for registration. An organizer needs to publish an event first.
          </p>
          <button
            type="button"
            onClick={onNavigateToOrganizer}
            className="inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] text-white text-sm font-semibold px-5 py-2.5 rounded-[10px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[44px]"
          >
            Go to Organizer Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1160px] mx-auto px-3.5 sm:px-6 py-4 sm:py-8 pb-32 md:pb-16 space-y-4 sm:space-y-6">
      {/* Top back navigation */}
      {onNavigateToEvents && (
        <button
          type="button"
          onClick={onNavigateToEvents}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3345E8] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Browse all campus events</span>
        </button>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E5EE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3345E8] border border-[#C7D2FE]">
              Student Portal
            </span>
            <span className="text-xs text-[#5B6478] hidden sm:inline">
              Instant Entry Pass & QR Generation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-[30px] font-extrabold text-[#0E1424] tracking-tight mt-1">
            Student Event Registration & Pass
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6478] mt-0.5">
            View complete event details, check eligibility & venue, and enter your college details for your instant QR pass.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-[#0E1424] border border-[#E1E5EE] text-xs font-bold w-fit shadow-2xs">
          <GraduationCap className="w-4 h-4 text-[#3345E8]" />
          <span>College Pass Gateway</span>
        </div>
      </div>

      {/* MOBILE SEGMENTED TABS: Switch between Form & Event Details & My Pass on small screens */}
      <div className="lg:hidden flex items-center p-1 bg-white rounded-xl border border-[#E1E5EE] shadow-2xs text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
            mobileTab === 'form'
              ? 'bg-[#3345E8] text-white shadow-xs'
              : 'text-[#5B6478] hover:text-[#0E1424]'
          }`}
        >
          1. Student Form
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
            mobileTab === 'details'
              ? 'bg-[#3345E8] text-white shadow-xs'
              : 'text-[#5B6478] hover:text-[#0E1424]'
          }`}
        >
          2. Event Details
        </button>
        {successResult && (
          <button
            type="button"
            onClick={() => setMobileTab('pass')}
            className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
              mobileTab === 'pass'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50'
            }`}
          >
            3. My QR Pass
          </button>
        )}
      </div>

      {/* Grid: 2 Columns on laptop, 1 Column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Registration Form (7 cols on lg) */}
        <div
          className={`lg:col-span-7 bg-white rounded-[20px] border border-[#E1E5EE] shadow-[0_4px_20px_rgba(14,20,36,0.04)] p-4 sm:p-7 space-y-5 ${
            mobileTab === 'details' && !successResult ? 'hidden lg:block' : ''
          } ${mobileTab === 'pass' && successResult ? 'hidden lg:block' : ''}`}
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E1E5EE]">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0E1424] flex items-center gap-2">
                <User className="w-5 h-5 text-[#3345E8]" />
                <span>Student Registration Form</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6478] mt-0.5">
                Fill in your student information to reserve your seat and generate your pass.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EBFBF4] text-[#12805C] border border-[#12805C]/20 shrink-0">
              Instant Pass
            </span>
          </div>

          {/* Success Notification if registered */}
          {successResult && (
            <div className="bg-[#DDF5EA] text-[#12805C] border border-[#12805C]/30 p-4 rounded-[14px] flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#12805C]" />
              <div className="text-xs sm:text-sm flex-1">
                <span className="font-bold block text-[#065F46] text-sm">Registration Confirmed!</span>
                Your verified entry pass has been generated. Tap <strong>My QR Pass</strong> or inspect the pass card to download or share.
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileTab('pass')}
                    className="lg:hidden text-xs font-bold bg-[#12805C] text-white px-3 py-1.5 rounded-lg shadow-2xs"
                  >
                    View My Entry Pass &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={handleRegisterAnother}
                    className="text-xs font-bold text-[#065F46] underline hover:no-underline py-1"
                  >
                    Register another student
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-[#FCE1E1] text-[#C0302F] p-4 rounded-[12px] text-xs sm:text-sm flex items-start gap-3 border border-[#C0302F]/20">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Registration Error</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reg-event" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478]">
                  Select Campus Event <span className="text-[#C0302F]">*</span>
                </label>
                {currentEvent && (
                  <button
                    type="button"
                    onClick={() => setMobileTab('details')}
                    className="lg:hidden text-xs font-bold text-[#3345E8] hover:underline"
                  >
                    View Details &rarr;
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  id="reg-event"
                  value={selectedEventId || ''}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full appearance-none px-3.5 py-3 text-sm bg-[#F8FAFC] border border-[#E1E5EE] rounded-[12px] text-[#0E1424] font-semibold pr-10 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.date})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#5B6478] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Student Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
                Full Name <span className="text-[#C0302F]">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Arjun S. N. or Priya Patel"
                className="w-full px-3.5 py-2.5 sm:py-3 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
              />
            </div>

            {/* Student Email & Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
                  Student Email Address <span className="text-[#C0302F]">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@marwadiuniversity.ac.in"
                  className="w-full px-3.5 py-2.5 sm:py-3 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
                  Mobile / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* College Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reg-college" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478]">
                  College / University Name <span className="text-[#C0302F]">*</span>
                </label>
                <span className="text-[11px] text-[#5B6478]">Institution</span>
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-college"
                  type="text"
                  required
                  value={collegeNameInput}
                  onChange={(e) => setCollegeNameInput(e.target.value)}
                  placeholder="e.g. Marwadi University"
                  className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors font-medium"
                />
              </div>

              {/* Quick college suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-[#5B6478] font-medium mr-1">Quick pick:</span>
                {SUGGESTED_COLLEGES.slice(0, 4).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setCollegeNameInput(col)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      collegeNameInput === col
                        ? 'bg-[#3345E8] text-white border-[#3345E8]'
                        : 'bg-[#F4F6FA] text-[#5B6478] hover:text-[#0E1424] border-[#E1E5EE]'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch / Department & Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label htmlFor="reg-branch" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
                  Academic Branch / Degree <span className="text-[#C0302F]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="reg-branch"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 sm:py-3 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] pr-10 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
                  >
                    {COMMON_BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6478] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-spec" className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
                  Specialization / Domain <span className="text-[#C0302F]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="reg-spec"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 sm:py-3 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] pr-10 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
                  >
                    {COMMON_SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6478] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isEventFull}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] active:bg-[#1E2BB8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold py-3.5 px-4 rounded-[12px] transition-all focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[50px] shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Digital Pass...</span>
                  </>
                ) : isEventFull ? (
                  <span>Event is Full</span>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Confirm Registration & Get Digital Pass</span>
                  </>
                )}
              </button>
            </div>

            {successResult && (
              <button
                type="button"
                onClick={handleRegisterAnother}
                className="w-full text-center text-xs sm:text-sm font-bold text-[#3345E8] hover:underline pt-2 cursor-pointer"
              >
                Register another student &rarr;
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Complete Event Details & Digital Pass (5 cols on lg) */}
        <div
          className={`lg:col-span-5 flex flex-col items-center w-full space-y-5 ${
            mobileTab === 'form' && !successResult ? 'hidden lg:flex' : ''
          }`}
        >
          {successResult ? (
            /* Live Generated Digital Ticket / Pass */
            <div className="w-full max-w-[440px] bg-white rounded-[24px] border border-[#E1E5EE] shadow-[0_12px_36px_rgba(14,20,36,0.08)] overflow-hidden transition-all duration-300">
              {/* Event Header Banner */}
              <div className="relative p-5 sm:p-6 text-white rounded-t-[23px] overflow-hidden min-h-[140px] flex flex-col justify-end">
                {currentEvent?.bannerUrl?.startsWith('linear-gradient') ? (
                  <div
                    className="absolute inset-0"
                    style={{ background: currentEvent.bannerUrl }}
                  />
                ) : currentEvent?.bannerUrl ? (
                  <img
                    src={currentEvent.bannerUrl}
                    alt={successResult.eventName}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#3345E8]" />
                )}
                {/* Contrast overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1424]/95 via-[#0E1424]/75 to-[#0E1424]/40" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-white/90 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                      Verified Entry Pass
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Valid Pass
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-white pt-1">
                    {successResult.eventName}
                  </h3>

                  {currentEvent && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/90 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-white/80" />
                        {currentEvent.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-white/80" />
                        {currentEvent.venue}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pass Body */}
              <div className="p-5 sm:p-6 text-center space-y-4">
                {/* Student Full Details Block */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[14px] text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#5B6478]">
                        Student Attendee
                      </span>
                      <div className="text-lg font-extrabold text-[#0E1424]">
                        {successResult.name}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#12805C] bg-[#DDF5EA] px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-1 gap-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[#334155]">
                      <Building2 className="w-3.5 h-3.5 text-[#3345E8] shrink-0" />
                      <span className="font-semibold">{successResult.registration.collegeName || 'Marwadi University'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[#334155]">
                      <GraduationCap className="w-3.5 h-3.5 text-[#12805C] shrink-0" />
                      <span className="truncate">{successResult.registration.branch}</span>
                    </div>

                    {successResult.registration.specialization && (
                      <div className="text-[11px] text-[#64748B] pl-5">
                        Specialization: <strong className="text-[#0E1424]">{successResult.registration.specialization}</strong>
                      </div>
                    )}

                    {successResult.registration.phone && (
                      <div className="text-[11px] text-[#64748B] pl-5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#5B6478]" />
                        <span>{successResult.registration.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Block */}
                <div className="inline-block p-3.5 bg-white border border-[#E1E5EE] rounded-[18px] shadow-sm">
                  <img
                    src={successResult.qrDataUrl}
                    alt={`QR Entry Code ${successResult.code}`}
                    className="w-44 h-44 sm:w-52 sm:h-52 object-contain mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[10px] text-[#5B6478] font-medium mt-1">
                    Scan at university gate for instant check-in
                  </div>
                </div>

                {/* Perforated divider */}
                <div className="relative my-3">
                  <div className="border-t-2 border-dashed border-[#E1E5EE] w-full" />
                </div>

                {/* Ticket Code */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#5B6478] mb-1">
                    Entry Pass Code
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-[#0E1424] bg-[#F4F6FA] py-2 px-3 rounded-[10px] border border-[#E1E5EE]">
                    {successResult.code}
                  </div>
                </div>

                {/* Action Buttons: Download QR & Copy code & Share Pass */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(successResult.qrDataUrl, successResult.code)}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#F4F6FA] hover:bg-[#E1E5EE] text-[#0E1424] border border-[#E1E5EE] text-xs font-bold py-2.5 px-3 rounded-[10px] transition-colors cursor-pointer min-h-[42px]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#5B6478]" />
                    <span>Download Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(successResult.code)}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#F4F6FA] hover:bg-[#E1E5EE] text-[#0E1424] border border-[#E1E5EE] text-xs font-bold py-2.5 px-3 rounded-[10px] transition-colors cursor-pointer min-h-[42px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#5B6478]" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Share Button across WhatsApp, Instagram, LinkedIn & Mail */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-[12px] transition-all cursor-pointer shadow-xs min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Pass (WhatsApp, Insta, LinkedIn, Mail)</span>
                </button>

                {/* Print button & Feedback Review */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrintPass}
                    className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#F8FAFC] text-[#5B6478] border border-[#E1E5EE] text-xs font-semibold py-2 px-3 rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#F8FAFC] text-[#3345E8] border border-[#C7D2FE] text-xs font-semibold py-2 px-3 rounded-[8px] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Event Feedback</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* COMPLETE EVENT DETAILS CARD FOR STUDENTS */
            <div className="w-full max-w-[440px] bg-white rounded-[22px] border border-[#E1E5EE] shadow-[0_4px_20px_rgba(14,20,36,0.04)] overflow-hidden space-y-0">
              {currentEvent && (
                <>
                  {/* Event Banner */}
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-[#0E1424]">
                    {currentEvent.bannerUrl?.startsWith('linear-gradient') ? (
                      <div
                        className="absolute inset-0"
                        style={{ background: currentEvent.bannerUrl }}
                      />
                    ) : currentEvent.bannerUrl ? (
                      <img
                        src={currentEvent.bannerUrl}
                        alt={currentEvent.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#3345E8]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1424]/90 via-[#0E1424]/40 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      {(() => {
                        const catInfo = getCategoryInfo(currentEvent.category);
                        const CatIcon = catInfo.icon;
                        return (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#0E1424] shadow-xs">
                            <CatIcon className="w-3 h-3 text-[#3345E8]" />
                            <span>{catInfo.label}</span>
                          </span>
                        );
                      })()}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsShareModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 hover:bg-white text-[#0E1424] shadow-xs transition-colors cursor-pointer"
                          title="Share event across WhatsApp, Instagram, LinkedIn & Mail"
                        >
                          <Share2 className="w-3 h-3 text-[#3345E8]" />
                          <span>Share</span>
                        </button>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-xs">
                          {currentEvent.entryFee || 'Free Entry'}
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-2">
                        {currentEvent.name}
                      </h3>
                      {currentEvent.organizerName && (
                        <p className="text-[11px] text-white/80">
                          Organized by {currentEvent.organizerName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content: Date, Venue, Description, Agenda, Perks */}
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Time & Venue Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-[12px] border border-[#E2E8F0]">
                      <div className="flex items-start gap-2 text-[#0E1424]">
                        <Calendar className="w-4 h-4 text-[#3345E8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#5B6478] font-bold uppercase block">Date & Time</span>
                          <span className="font-semibold text-xs">{currentEvent.date}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-[#0E1424]">
                        <MapPin className="w-4 h-4 text-[#3345E8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#5B6478] font-bold uppercase block">Campus Venue</span>
                          <span className="font-semibold text-xs">{currentEvent.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Seat capacity gauge */}
                    <div className="bg-white p-3.5 rounded-[12px] border border-[#E1E5EE] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#5B6478]">Seat Availability</span>
                        <span className={stats.remaining > 0 ? 'text-[#12805C]' : 'text-[#C0302F]'}>
                          {stats.remaining > 0 ? `${stats.remaining} seats left` : 'Fully Booked'}
                        </span>
                      </div>

                      <div className="w-full bg-[#E1E5EE] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#3345E8] h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              stats.capacity > 0
                                ? Math.min(100, Math.round((stats.registered / stats.capacity) * 100))
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#5B6478]">
                        <span>{stats.registered} students registered</span>
                        <span>Total Capacity: {stats.capacity}</span>
                      </div>
                    </div>

                    {/* About / Description */}
                    {currentEvent.description && (
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold text-[#5B6478] tracking-wider block">
                          About this Event
                        </span>
                        <p className="text-[#334155] leading-relaxed text-xs">
                          {currentEvent.description}
                        </p>
                      </div>
                    )}

                    {/* Eligibility & Requirements */}
                    {(currentEvent.eligibility || currentEvent.requirements) && (
                      <div className="space-y-2 p-3 bg-[#EEF2FF]/60 rounded-[12px] border border-[#C7D2FE]/60">
                        {currentEvent.eligibility && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#3345E8] tracking-wider block">
                              Who Can Attend:
                            </span>
                            <span className="text-xs text-[#0E1424] font-medium">
                              {currentEvent.eligibility}
                            </span>
                          </div>
                        )}
                        {currentEvent.requirements && (
                          <div className="pt-1.5 border-t border-[#C7D2FE]/40">
                            <span className="text-[10px] uppercase font-bold text-[#3345E8] tracking-wider block">
                              What to Bring / Requirements:
                            </span>
                            <span className="text-xs text-[#0E1424]">
                              {currentEvent.requirements}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Event Schedule / Agenda */}
                    {currentEvent.agenda && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] uppercase font-bold text-[#5B6478] tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#3345E8]" />
                          <span>Event Agenda & Schedule</span>
                        </span>
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#334155] leading-relaxed">
                          {currentEvent.agenda}
                        </div>
                      </div>
                    )}

                    {/* Perks / Benefits */}
                    {currentEvent.perks && currentEvent.perks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] uppercase font-bold text-[#5B6478] tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-[#12805C]" />
                          <span>Student Perks & Benefits</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentEvent.perks.map((perk, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EBFBF4] text-[#12805C] border border-[#12805C]/20 text-[11px] font-semibold"
                            >
                              <CheckCheck className="w-3 h-3 text-[#12805C]" />
                              <span>{perk}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fast Register CTA on Mobile when in Details tab */}
                    <button
                      type="button"
                      onClick={() => setMobileTab('form')}
                      className="lg:hidden w-full inline-flex items-center justify-center gap-2 bg-[#3345E8] text-white font-bold py-3 rounded-xl shadow-xs mt-2"
                    >
                      <span>Proceed to Student Form & Register</span>
                      &rarr;
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Feedback Modal */}
      {currentEvent && (
        <StudentFeedbackModal
          event={currentEvent}
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          defaultName={nameInput}
          defaultEmail={emailInput}
        />
      )}

      {/* Share Modal (Supports event share & student pass share) */}
      {currentEvent && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          event={currentEvent}
          studentPassCode={successResult?.code}
          studentName={successResult?.name}
        />
      )}
    </div>
  );
}
