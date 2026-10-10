/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Event,
  EventStats,
  Registration,
  Feedback,
  listEvents,
  getStats,
  listParticipants,
  listFeedback,
  getEventFeedbackSummary,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  exportCsv,
  exportFeedbackCsv,
  checkIn,
  undoCheckIn,
  subscribeToStore,
  PRESET_BANNERS,
  generateQrForCode,
  AUTHORIZED_ORGANIZER_EMAIL,
  EventCategory,
  EventStatus,
} from '../store';
import { CATEGORIES, getCategoryInfo } from '../utils/categories';
import { playSuccessBeep, playAlertBeep } from '../audio';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { DateTimePicker } from './DateTimePicker';
import { BannerUploader } from './BannerUploader';
import { ShareModal } from './ShareModal';
import { EventBannerImage } from './EventBannerImage';
import { useToast } from './Toast';
import {
  Plus,
  Download,
  Search,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  X,
  ChevronDown,
  AlertCircle,
  Share2,
  Trash2,
  Star,
  MessageSquare,
  Users,
  Activity,
  Check,
  ScanLine,
  RotateCcw,
  ShieldCheck,
  Building2,
  GraduationCap,
  Phone,
  QrCode,
  Sparkles,
  Edit2,
  ArrowRight,
  TrendingUp,
  Settings,
  Eye,
  Camera,
  Database,
  Copy,
  Cloud,
  Layers,
  Zap,
} from 'lucide-react';

interface OrganizerViewProps {
  selectedEventId: string | null;
  onSelectEventId: (id: string) => void;
  onNavigateToRegister: () => void;
  onNavigateToCheckIn?: () => void;
  organizerEmail?: string | null;
}

export function OrganizerView({
  selectedEventId,
  onSelectEventId,
  onNavigateToRegister,
  onNavigateToCheckIn,
  organizerEmail,
}: OrganizerViewProps) {
  const { showToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({ registered: 0, attended: 0, remaining: 0, capacity: 0 });
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState({ averageRating: 0, count: 0 });

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'pending'>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'live' | 'roster' | 'quickdesk' | 'feedback' | 'settings'>('live');
  const [isAllEventsModalOpen, setIsAllEventsModalOpen] = useState(false);

  // Live Pulse Clock
  const [liveClock, setLiveClock] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick Gate Desk Code Input in Dashboard
  const [deskCodeInput, setDeskCodeInput] = useState('');
  const [deskFeedbackMessage, setDeskFeedbackMessage] = useState<{
    type: 'success' | 'duplicate' | 'invalid';
    text: string;
    name?: string;
    time?: string;
  } | null>(null);

  // Student Pass Inspection Modal
  const [inspectedStudent, setInspectedStudent] = useState<Registration | null>(null);
  const [inspectedQrUrl, setInspectedQrUrl] = useState<string | null>(null);

  // Feedback filtering & modal states
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<'all' | number>('all');
  const [isAddFeedbackModalOpen, setIsAddFeedbackModalOpen] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Side Panel state for "New event"
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    capacity: '100',
    category: 'tech' as EventCategory,
    bannerUrl: PRESET_BANNERS[0].url,
    customUrl: '',
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    capacity?: string;
  }>({});

  // Edit Event Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    date: '',
    venue: '',
    capacity: '100',
    category: 'tech' as EventCategory,
    bannerUrl: PRESET_BANNERS[0].url,
    customUrl: '',
  });
  const [editFormErrors, setEditFormErrors] = useState<{
    name?: string;
    capacity?: string;
  }>({});

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Reload data from store
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
      setParticipants(
        listParticipants(activeId, {
          search: searchQuery,
          status: statusFilter,
        })
      );
      setFeedbackList(listFeedback(activeId));
      setFeedbackSummary(getEventFeedbackSummary(activeId));
    } else {
      setStats({ registered: 0, attended: 0, remaining: 0, capacity: 0 });
      setParticipants([]);
      setFeedbackList([]);
      setFeedbackSummary({ averageRating: 0, count: 0 });
    }
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return unsubscribe;
  }, [selectedEventId, searchQuery, statusFilter]);

  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Unique colleges in current event participants
  const uniqueColleges = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.collegeName) set.add(p.collegeName);
    });
    return Array.from(set);
  }, [participants]);

  // Filtered participants by college
  const filteredParticipants = useMemo(() => {
    if (collegeFilter === 'all') return participants;
    return participants.filter((p) => p.collegeName === collegeFilter);
  }, [participants, collegeFilter]);

  // Demographics stats
  const collegeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const col = p.collegeName || 'Other College';
      counts[col] = (counts[col] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [participants]);

  const branchBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const br = p.branch || 'Engineering';
      // simplify name
      const short = br.split('(')[0].trim();
      counts[short] = (counts[short] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [participants]);

  // Check-In toggle
  const handleToggleCheckIn = (code: string, currentStatus: boolean, name: string) => {
    if (currentStatus) {
      const ok = undoCheckIn(code);
      if (ok) {
        showToast(`Reverted gate check-in for ${name}`);
      }
    } else {
      const res = checkIn(code);
      if (res.status === 'SUCCESS') {
        playSuccessBeep();
        showToast(`Checked in: ${res.name}`);
      } else if (res.status === 'DUPLICATE') {
        playAlertBeep();
        showToast(`Already checked in earlier`, 'warning');
      }
    }
  };

  // Quick Desk Check-In
  const handleQuickDeskCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskCodeInput.trim()) return;

    const res = checkIn(deskCodeInput);
    if (res.status === 'SUCCESS') {
      playSuccessBeep();
      setDeskFeedbackMessage({
        type: 'success',
        text: `Checked in successfully!`,
        name: res.name,
        time: new Date(res.checkedInAt).toLocaleTimeString(),
      });
      showToast(`Gate checked in: ${res.name}`);
      setDeskCodeInput('');
    } else if (res.status === 'DUPLICATE') {
      playAlertBeep();
      setDeskFeedbackMessage({
        type: 'duplicate',
        text: `Duplicate check-in warning!`,
        name: res.name,
        time: new Date(res.originalCheckedInAt).toLocaleTimeString(),
      });
      showToast(`Warning: ${res.name} already checked in!`, 'warning');
    } else {
      playAlertBeep();
      setDeskFeedbackMessage({
        type: 'invalid',
        text: `Invalid or unrecognized ticket code '${deskCodeInput}'.`,
      });
      showToast(`Invalid ticket code`, 'error');
    }
  };

  // Inspect student modal
  const handleOpenInspectStudent = async (student: Registration) => {
    setInspectedStudent(student);
    try {
      const qr = await generateQrForCode(student.code);
      setInspectedQrUrl(qr);
    } catch {
      setInspectedQrUrl(null);
    }
  };

  // Copy registration link
  const handleCopyRegistrationLink = async () => {
    try {
      const url = `${window.location.origin}?tab=register&eventId=${selectedEventId || ''}`;
      await navigator.clipboard.writeText(url);
      showToast('Student registration link copied to clipboard.');
    } catch {
      showToast('Could not copy link.', 'warning');
    }
  };

  // Change Event Status
  const handleStatusChange = (status: EventStatus) => {
    if (!selectedEventId) return;
    updateEventStatus(selectedEventId, status);
    showToast(`Event status updated to ${status.toUpperCase()}`);
  };

  // Delete event
  const handleDeleteConfirm = () => {
    if (!selectedEventId) return;
    setIsDeleting(true);
    try {
      const remainingEvents = events.filter((e) => String(e.id) !== String(selectedEventId));
      deleteEvent(selectedEventId);
      showToast('Event removed successfully.');
      setIsDeleteModalOpen(false);
      if (remainingEvents.length > 0) {
        onSelectEventId(remainingEvents[0].id);
      } else {
        onSelectEventId('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete event.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Simulate Live Attendee Join (For live presentation & hackathon testing)
  const handleSimulateLiveJoin = () => {
    if (!currentEvent) return;
    const pending = participants.filter((p) => !p.checkedIn);
    if (pending.length > 0) {
      const candidate = pending[0];
      const res = checkIn(candidate.code);
      if (res.status === 'SUCCESS') {
        playSuccessBeep();
        showToast(`⚡ Live Join: ${candidate.name} (${candidate.collegeName || 'Student'}) checked in!`, 'success');
      }
    } else {
      showToast('All registered attendees have already joined this session!', 'info');
    }
  };

  const checkedInParticipants = useMemo(() => {
    return participants
      .filter((p) => p.checkedIn)
      .sort((a, b) => {
        const timeA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
        const timeB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [participants]);

  // Open New Event panel
  const handleOpenPanel = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const defDate = `${months[tomorrow.getMonth()]} ${tomorrow.getDate()}, ${tomorrow.getFullYear()} · 10:00 AM`;

    setFormData({
      name: '',
      date: defDate,
      venue: '',
      capacity: '100',
      category: 'tech',
      bannerUrl: PRESET_BANNERS[0].url,
      customUrl: '',
    });
    setFormErrors({});
    setIsPanelOpen(true);
  };

  // Open Edit Event panel
  const handleOpenEditModal = () => {
    if (!currentEvent) return;
    setEditFormData({
      name: currentEvent.name,
      date: currentEvent.date,
      venue: currentEvent.venue,
      capacity: currentEvent.capacity.toString(),
      category: currentEvent.category || 'tech',
      bannerUrl: currentEvent.bannerUrl || PRESET_BANNERS[0].url,
      customUrl: '',
    });
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  // Submit Edit Event
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    const errors: { name?: string; capacity?: string } = {};

    if (!editFormData.name.trim()) {
      errors.name = 'Please provide an event name.';
    }

    const capNum = Number(editFormData.capacity);
    if (!Number.isInteger(capNum) || capNum < 1) {
      errors.capacity = 'Capacity must be at least 1.';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    setIsEditSubmitting(true);
    try {
      const activeBanner = editFormData.bannerUrl.trim() || PRESET_BANNERS[0].url;

      updateEvent(selectedEventId, {
        name: editFormData.name.trim(),
        date: editFormData.date.trim() || 'Date TBA',
        venue: editFormData.venue.trim() || 'Main Auditorium',
        capacity: capNum,
        category: editFormData.category,
        bannerUrl: activeBanner,
      });

      showToast(`Event '${editFormData.name}' updated successfully!`);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update event.';
      showToast(msg, 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Submit New Event
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; capacity?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Please provide an event name.';
    }

    const capNum = Number(formData.capacity);
    if (!Number.isInteger(capNum) || capNum < 1) {
      errors.capacity = 'Capacity must be at least 1.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const activeBanner = formData.bannerUrl.trim() || PRESET_BANNERS[0].url;

      const newEv = createEvent({
        name: formData.name.trim(),
        date: formData.date.trim() || 'Date TBA',
        venue: formData.venue.trim() || 'Main Auditorium',
        capacity: capNum,
        category: formData.category,
        bannerUrl: activeBanner,
        organizerEmail: organizerEmail || AUTHORIZED_ORGANIZER_EMAIL,
      });

      showToast(`Event '${newEv.name}' created! Ready to share.`);
      setIsPanelOpen(false);
      onSelectEventId(newEv.id);
      setIsShareModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create event.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Attendance percentages
  const registeredPercent =
    stats.capacity > 0 ? Math.min(100, Math.round((stats.registered / stats.capacity) * 100)) : 0;
  const attendedPercent =
    stats.registered > 0 ? Math.min(100, Math.round((stats.attended / stats.registered) * 100)) : 0;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-16 space-y-6">
      {/* Top Header Bar: Event Selector & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E1E5EE]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {events.length > 0 ? (
            <div className="relative inline-block">
              <select
                value={selectedEventId || ''}
                onChange={(e) => onSelectEventId(e.target.value)}
                className="appearance-none bg-white border border-[#E1E5EE] text-[#0E1424] font-extrabold text-xl sm:text-2xl py-2 pl-3.5 pr-10 rounded-[10px] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] cursor-pointer transition-colors max-w-[280px] sm:max-w-md truncate shadow-2xs"
                aria-label="Select event"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-[#5B6478] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0E1424]">
                Organizer Workspace
              </h1>
              <p className="text-xs text-[#5B6478] mt-0.5">
                Authenticated administrative console for college events
              </p>
            </div>
          )}

          {events.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAllEventsModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="View all created events"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>All Events ({events.length})</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-bold w-fit">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Organizer: {organizerEmail || 'Event Admin'}</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold w-fit"
            title="Database Connected: ooxhjbafurogcnqurdvo"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Cloud Connected</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          {currentEvent && (
            <>
              {onNavigateToCheckIn && (
                <button
                  type="button"
                  onClick={onNavigateToCheckIn}
                  className="inline-flex items-center gap-1.5 bg-[#0E1424] hover:bg-black text-white text-xs font-bold px-3.5 py-2.5 rounded-[10px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[40px] shadow-sm cursor-pointer"
                  title="Open Dedicated Scanner Desk"
                >
                  <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Scanner Desk</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => exportCsv(currentEvent.id)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F4F6FA] text-[#0E1424] text-xs font-bold px-3 py-2.5 border border-[#E1E5EE] rounded-[10px] transition-colors cursor-pointer min-h-[40px]"
                title="Download attendee list with College & Branch as CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#5B6478]" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F4F6FA] text-[#0E1424] text-xs font-bold px-3 py-2.5 border border-[#E1E5EE] rounded-[10px] transition-colors cursor-pointer min-h-[40px]"
                title="Share event across WhatsApp, Instagram, LinkedIn & Mail"
              >
                <Share2 className="w-3.5 h-3.5 text-[#3345E8]" />
                <span className="hidden sm:inline">Share Event</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#EEF2FF] text-[#3345E8] text-xs font-bold px-3 py-2.5 border border-[#3345E8]/30 rounded-[10px] transition-colors cursor-pointer min-h-[40px]"
                title="Edit event details, schedule & date with calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-[#3345E8]" />
                <span className="hidden sm:inline">Edit Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FCE1E1]/40 text-[#C0302F] text-xs font-bold px-3 py-2.5 border border-[#E1E5EE] hover:border-[#C0302F]/30 rounded-[10px] transition-colors cursor-pointer min-h-[40px]"
                title="Delete this event"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleOpenPanel}
            className="inline-flex items-center justify-center gap-1.5 bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-bold px-4 py-2.5 rounded-[10px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[40px] shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-[20px] border border-[#E1E5EE] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E8EBFE] text-[#3345E8] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0E1424] mb-2">
            No events registered yet
          </h2>
          <p className="text-[#5B6478] max-w-md mx-auto text-sm mb-6">
            Create an event to start accepting student registrations, generate QR codes, and monitor attendance.
          </p>
          <button
            type="button"
            onClick={handleOpenPanel}
            className="inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] text-white text-sm font-bold px-5 py-2.5 rounded-[10px] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <>
          {/* Featured Event Banner & Live Session Controller Card */}
          {currentEvent && (
            <div className="relative rounded-[20px] overflow-hidden border border-[#E1E5EE] shadow-sm min-h-[190px] flex flex-col justify-between p-6 sm:p-8 text-white">
              {/* Background Banner */}
              <EventBannerImage
                src={currentEvent.bannerUrl}
                category={currentEvent.category}
                alt={currentEvent.name}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Scrim overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1424]/95 via-[#0E1424]/75 to-[#0E1424]/40 pointer-events-none" />

              {/* Top Controls on Banner */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {currentEvent.status === 'ongoing' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>LIVE SESSION ONGOING</span>
                    </span>
                  ) : currentEvent.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-white/90">
                      <Check className="w-3.5 h-3.5" />
                      <span>CONCLUDED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#3345E8] text-white">
                      <span>UPCOMING SESSION</span>
                    </span>
                  )}

                  {(() => {
                    const catInfo = getCategoryInfo(currentEvent.category);
                    const CatIcon = catInfo.icon;
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-xs text-white border border-white/20">
                        <CatIcon className="w-3 h-3 text-white" />
                        <span>{catInfo.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Session Mode Selector */}
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs p-1 rounded-[10px] border border-white/15 text-xs">
                  <span className="text-white/60 px-2 font-medium">Session:</span>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('upcoming')}
                    className={`px-2.5 py-1 rounded-[6px] font-bold transition-colors cursor-pointer ${
                      (currentEvent.status || 'upcoming') === 'upcoming'
                        ? 'bg-white text-[#0E1424]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('ongoing')}
                    className={`px-2.5 py-1 rounded-[6px] font-bold transition-colors cursor-pointer ${
                      currentEvent.status === 'ongoing'
                        ? 'bg-emerald-500 text-white'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Live Ongoing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('completed')}
                    className={`px-2.5 py-1 rounded-[6px] font-bold transition-colors cursor-pointer ${
                      currentEvent.status === 'completed'
                        ? 'bg-slate-300 text-[#0E1424]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Concluded
                  </button>
                </div>
              </div>

              {/* Bottom Content on Banner */}
              <div className="relative z-10 mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {currentEvent.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/90 pt-1">
                    <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-[8px] border border-white/10">
                      <Calendar className="w-4 h-4 text-white/80" />
                      <span>{currentEvent.date}</span>
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="ml-1 text-white/70 hover:text-white p-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
                        title="Reschedule date & time with calendar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </span>
                    <span aria-hidden="true" className="text-white/40">·</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-white/80" />
                      {currentEvent.venue}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onNavigateToRegister}
                    className="inline-flex items-center justify-center gap-1.5 bg-white text-[#0E1424] hover:bg-white/90 text-xs font-bold px-4 py-2 rounded-[8px] transition-colors cursor-pointer"
                  >
                    <span>Public Registration Link</span>
                    &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KPI Analytics Cards: 4 columns on laptop, 2 columns on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Registrations */}
            <div className="bg-white rounded-[18px] border border-[#E1E5EE] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#5B6478] mb-1">
                <span>Registrations</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#3345E8]">
                  {registeredPercent}%
                </span>
              </div>
              <div className="text-2xl sm:text-[34px] font-extrabold text-[#0E1424] leading-tight tabular-nums flex items-baseline gap-1">
                <span>{stats.registered}</span>
                <span className="text-xs sm:text-base font-semibold text-[#5B6478]">/ {stats.capacity}</span>
              </div>
              <div className="w-full bg-[#E1E5EE] h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-[#3345E8] h-full rounded-full transition-all duration-300"
                  style={{ width: `${registeredPercent}%` }}
                />
              </div>
            </div>

            {/* Card 2: Gate Attendance */}
            <div className="bg-white rounded-[18px] border border-[#E1E5EE] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#5B6478] mb-1">
                <span>Gate Checked In</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#EBFBF4] text-[#12805C]">
                  {attendedPercent}% turn-up
                </span>
              </div>
              <div className="text-2xl sm:text-[34px] font-extrabold text-[#12805C] leading-tight tabular-nums">
                {stats.attended}
              </div>
              <div className="w-full bg-[#E1E5EE] h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-[#12805C] h-full rounded-full transition-all duration-300"
                  style={{ width: `${attendedPercent}%` }}
                />
              </div>
            </div>

            {/* Card 3: Seats Left */}
            <div className="bg-white rounded-[18px] border border-[#E1E5EE] p-4 sm:p-5 shadow-2xs">
              <div className="text-xs font-bold text-[#5B6478] mb-1">
                Seats Left
              </div>
              <div className="text-2xl sm:text-[34px] font-extrabold text-[#0E1424] leading-tight tabular-nums">
                {stats.remaining}
              </div>
              <div className="text-[11px] text-[#5B6478] mt-2 truncate">
                {stats.remaining > 0 ? 'Accepting attendees' : 'Maximum capacity reached'}
              </div>
            </div>

            {/* Card 4: Student Feedback Rating */}
            <div className="bg-white rounded-[18px] border border-[#E1E5EE] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#5B6478] mb-1">
                <span>Student Rating</span>
                <span className="text-[11px] text-[#5B6478]">
                  {feedbackSummary.count} {feedbackSummary.count === 1 ? 'review' : 'reviews'}
                </span>
              </div>
              <div className="text-2xl sm:text-[34px] font-extrabold text-amber-500 leading-tight tabular-nums flex items-center gap-1.5">
                <span>{feedbackSummary.count > 0 ? feedbackSummary.averageRating : '—'}</span>
                {feedbackSummary.count > 0 && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
              </div>
              <div className="text-[11px] text-[#5B6478] mt-2">
                {feedbackSummary.count > 0 ? 'Verified student reviews' : 'No feedback yet'}
              </div>
            </div>
          </div>

          {/* Demographics Overview Pill-Bar */}
          {participants.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#E1E5EE] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#0E1424] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#3345E8]" />
                  <span>Colleges:</span>
                </span>
                {collegeBreakdown.slice(0, 3).map(([col, cnt]) => (
                  <span
                    key={col}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4F6FA] border border-[#E1E5EE] font-medium text-[#0E1424]"
                  >
                    <span>{col}</span>
                    <strong className="text-[#3345E8]">({cnt})</strong>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#0E1424] flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#12805C]" />
                  <span>Top Branches:</span>
                </span>
                {branchBreakdown.slice(0, 3).map(([br, cnt]) => (
                  <span
                    key={br}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] font-medium text-[#475569]"
                  >
                    <span>{br}</span>
                    <strong className="text-[#0E1424]">({cnt})</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'live'
                  ? 'bg-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span>Live Attendance Pulse ({stats.attended} Joined)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'roster'
                  ? 'bg-[#3345E8] text-white shadow-[0_2px_8px_rgba(51,69,232,0.25)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Attendee Directory ({participants.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quickdesk')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'quickdesk'
                  ? 'bg-[#3345E8] text-white shadow-[0_2px_8px_rgba(51,69,232,0.25)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>Quick Gate Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'bg-[#3345E8] text-white shadow-[0_2px_8px_rgba(51,69,232,0.25)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Student Feedback ({feedbackList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#3345E8] text-white shadow-[0_2px_8px_rgba(51,69,232,0.25)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Event Settings</span>
            </button>
          </div>

          {/* TAB 0: LIVE ATTENDANCE PULSE & REAL-TIME TRACKING */}
          {activeTab === 'live' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Live Banner & Real-Time Sync Bar */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-[20px] p-5 sm:p-7 border border-emerald-900/40 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                        </span>
                        LIVE ATTENDANCE PULSE
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Live clock: <strong className="text-white font-mono">{liveClock}</strong>
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {currentEvent ? currentEvent.name : 'Event Live Stream'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                      Real-time gate check-ins and attendance tracking. Monitors incoming students, capacity limits, and venue flow live.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSimulateLiveJoin}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      title="Simulate a real-time student check-in to test the live counter"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Test Live Join</span>
                    </button>
                    {onNavigateToCheckIn && (
                      <button
                        type="button"
                        onClick={onNavigateToCheckIn}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
                      >
                        <ScanLine className="w-4 h-4 text-emerald-400" />
                        <span>Launch Camera Scanner</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Big Live KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. PEOPLE JOINED */}
                <div className="bg-white rounded-[20px] border-2 border-emerald-500/30 p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      PEOPLE JOINED
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                      {attendedPercent}% of registered
                    </span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-600 leading-tight tracking-tight tabular-nums flex items-baseline gap-2">
                    <span>{stats.attended}</span>
                    <span className="text-sm font-bold text-slate-500">students</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified gate admissions</span>
                  </div>
                </div>

                {/* 2. TOTAL REGISTERED */}
                <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>TOTAL REGISTERED</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200">
                      {registeredPercent}% filled
                    </span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight tabular-nums flex items-baseline gap-2">
                    <span>{stats.registered}</span>
                    <span className="text-sm font-bold text-slate-500">/ {stats.capacity}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 font-medium">
                    <span>{Math.max(0, stats.registered - stats.attended)} pending arrival</span>
                  </div>
                </div>

                {/* 3. SEATS REMAINING */}
                <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>SEATS REMAINING</span>
                    <span className="text-[11px] text-slate-500">Available</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-indigo-600 leading-tight tracking-tight tabular-nums flex items-baseline gap-2">
                    <span>{stats.remaining}</span>
                    <span className="text-sm font-bold text-slate-500">seats</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 font-medium">
                    {stats.remaining > 0 ? 'Accepting student registrations' : 'Capacity maxed out'}
                  </div>
                </div>

                {/* 4. VENUE OCCUPANCY METER */}
                <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>VENUE OCCUPANCY</span>
                    <span className="text-[11px] text-slate-500">Hall Capacity</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight tabular-nums flex items-baseline gap-2">
                    <span>{stats.capacity > 0 ? Math.round((stats.attended / stats.capacity) * 100) : 0}%</span>
                    <span className="text-sm font-bold text-slate-500">occupied</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 font-medium">
                    {stats.attended >= stats.capacity ? 'Full venue capacity' : `${Math.max(0, stats.capacity - stats.attended)} chairs vacant`}
                  </div>
                </div>
              </div>

              {/* Live Attendance Flow Gauge Bar */}
              <div className="bg-white rounded-[20px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-900 text-sm">Real-Time Hall Capacity Distribution</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>{stats.attended} Joined & Checked In</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span>{Math.max(0, stats.registered - stats.attended)} Registered (En route)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-200" />
                      <span>{stats.remaining} Empty Capacity</span>
                    </span>
                  </div>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500 relative"
                    style={{
                      width: `${stats.capacity > 0 ? Math.min(100, (stats.attended / stats.capacity) * 100) : 0}%`,
                    }}
                    title={`${stats.attended} people joined`}
                  />
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500 relative"
                    style={{
                      width: `${
                        stats.capacity > 0
                          ? Math.min(
                              100,
                              (Math.max(0, stats.registered - stats.attended) / stats.capacity) * 100
                            )
                          : 0
                      }%`,
                    }}
                    title={`${stats.registered - stats.attended} registered not yet checked in`}
                  />
                </div>
              </div>

              {/* Split Layout: Live Quick Desk & Recent Joins Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (1 col): Fast Gate Pass Check-In */}
                <div className="bg-white rounded-[20px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ScanLine className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Fast Gate Pass Entry
                      </h4>
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      Live Gate Active
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Type or paste attendee ticket pass code (e.g. <span className="font-mono font-semibold text-slate-700">EVT1-TK9A2B</span>) to verify gate entry immediately.
                  </p>

                  <form onSubmit={handleQuickDeskCheckIn} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={deskCodeInput}
                        onChange={(e) => setDeskCodeInput(e.target.value)}
                        placeholder="EVT... (e.g. EVT1-TK9A2B)"
                        className="w-full uppercase font-mono tracking-wider font-extrabold text-sm pl-3.5 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                      />
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Verify
                      </button>
                    </div>

                    {deskFeedbackMessage && (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                          deskFeedbackMessage.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : deskFeedbackMessage.type === 'duplicate'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {deskFeedbackMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          )}
                          <span>{deskFeedbackMessage.text}</span>
                        </div>
                        {deskFeedbackMessage.name && (
                          <div className="font-semibold">{deskFeedbackMessage.name}</div>
                        )}
                        {deskFeedbackMessage.time && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Time: {deskFeedbackMessage.time}
                          </div>
                        )}
                      </div>
                    )}
                  </form>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Audio sound:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Chime enabled on scan
                    </span>
                  </div>
                </div>

                {/* Right (2 cols): People Joined Live Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span>Live Joined Attendee Feed ({checkedInParticipants.length} people joined)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Real-time stream of verified gate check-ins with college and ticket information
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{checkedInParticipants.length} in hall</span>
                      </span>
                    </div>
                  </div>

                  {/* List of checked in attendees */}
                  {checkedInParticipants.length > 0 ? (
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {checkedInParticipants.map((p, idx) => {
                        const checkInTime = p.checkedInAt
                          ? new Date(p.checkedInAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Just now';

                        return (
                          <div
                            key={p.code}
                            className="p-3.5 rounded-xl border border-slate-200/90 hover:border-emerald-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar circle */}
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {p.name}
                                  </span>
                                  {idx === 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                                      Latest Join
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                  {p.collegeName && (
                                    <span className="font-medium text-slate-700">
                                      {p.collegeName}
                                    </span>
                                  )}
                                  {p.branch && (
                                    <>
                                      <span className="text-slate-300">·</span>
                                      <span className="text-slate-500">{p.branch}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-right">
                                <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                                  {p.code}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{checkInTime}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleCheckIn(p.code, true, p.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Undo check-in"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm">
                        No attendees have joined the hall yet
                      </h5>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        When attendees scan their QR passes or check in at the desk, they will instantly appear in this live stream!
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulateLiveJoin}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Simulate First Student Arrival</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ATTENDEE ROSTER DIRECTORY */}
          {activeTab === 'roster' && (
            <div className="bg-white rounded-[20px] border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-4">
              {/* Search & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E1E5EE]">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0E1424]">
                    Attendee Directory & Gate Pass List
                  </h3>
                  <p className="text-xs text-[#5B6478]">
                    Showing registered students with College, Branch, and Specialization
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, code, college..."
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#E1E5EE] rounded-[8px] text-[#0E1424] placeholder:text-[#5B6478]/70 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#0E1424] p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1 p-1 bg-[#F4F6FA] rounded-[8px] border border-[#E1E5EE]">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                        statusFilter === 'all' ? 'bg-white text-[#0E1424] shadow-xs' : 'text-[#5B6478]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('checkedIn')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                        statusFilter === 'checkedIn' ? 'bg-white text-[#12805C] shadow-xs' : 'text-[#5B6478]'
                      }`}
                    >
                      Checked in
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('pending')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                        statusFilter === 'pending' ? 'bg-white text-[#C0302F] shadow-xs' : 'text-[#5B6478]'
                      }`}
                    >
                      Pending
                    </button>
                  </div>

                  {/* College Filter (if multiple colleges) */}
                  {uniqueColleges.length > 1 && (
                    <div className="relative">
                      <select
                        value={collegeFilter}
                        onChange={(e) => setCollegeFilter(e.target.value)}
                        className="appearance-none bg-[#F4F6FA] border border-[#E1E5EE] text-xs font-semibold text-[#0E1424] py-1.5 pl-3 pr-8 rounded-[8px] focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Colleges</option>
                        {uniqueColleges.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-[#5B6478] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Data Presentation: Responsive Table for Laptop, Cards for Mobile */}
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-[#F4F6FA] text-[#5B6478] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0E1424]">No attendees match criteria</h4>
                  <p className="text-xs text-[#5B6478] mt-1">
                    Try adjusting search keywords or changing status filters.
                  </p>
                </div>
              ) : (
                <>
                  {/* Laptop View: Data Table (hidden on mobile < 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E1E5EE] text-[#5B6478] font-bold uppercase tracking-wider text-[11px] bg-[#F8FAFC]">
                          <th className="py-3 px-3">Student Name</th>
                          <th className="py-3 px-3">College & Department</th>
                          <th className="py-3 px-3">Specialization</th>
                          <th className="py-3 px-3 font-mono">Ticket Code</th>
                          <th className="py-3 px-3">Gate Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E1E5EE]">
                        {filteredParticipants.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                            {/* Name & Contact */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-[#0E1424] text-sm">{p.name}</div>
                              <div className="text-[#5B6478] text-[11px] truncate max-w-[180px]">{p.email}</div>
                              {p.phone && <div className="text-[#5B6478] text-[10px]">{p.phone}</div>}
                            </td>

                            {/* College & Branch */}
                            <td className="py-3.5 px-3">
                              <div className="font-semibold text-[#0E1424]">
                                {p.collegeName || 'Marwadi University'}
                              </div>
                              <div className="text-[#5B6478] text-[11px] max-w-[200px] truncate">
                                {p.branch || 'Engineering'}
                              </div>
                            </td>

                            {/* Specialization */}
                            <td className="py-3.5 px-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF2FF] text-[#3345E8]">
                                {p.specialization || 'General'}
                              </span>
                            </td>

                            {/* Ticket Code */}
                            <td className="py-3.5 px-3">
                              <span className="font-mono font-bold tracking-wider text-[#0E1424] bg-[#F4F6FA] px-2 py-1 rounded border border-[#E1E5EE]">
                                {p.code}
                              </span>
                            </td>

                            {/* Gate Status */}
                            <td className="py-3.5 px-3">
                              {p.checkedIn ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EBFBF4] text-[#12805C] border border-[#12805C]/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Checked In</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F4F6FA] text-[#5B6478] border border-[#E1E5EE]">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pending</span>
                                </span>
                              )}
                              {p.checkedInAt && (
                                <div className="text-[10px] text-[#5B6478] mt-1 pl-1">
                                  {new Date(p.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInspectStudent(p)}
                                  className="p-1.5 rounded-[6px] text-[#5B6478] hover:text-[#0E1424] hover:bg-[#E1E5EE] transition-colors cursor-pointer"
                                  title="View Student Pass & QR"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleCheckIn(p.code, p.checkedIn, p.name)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                                    p.checkedIn
                                      ? 'bg-white hover:bg-[#FCE1E1]/40 text-[#C0302F] border border-[#E1E5EE]'
                                      : 'bg-[#12805C] hover:bg-[#0E6C4E] text-white shadow-2xs'
                                  }`}
                                >
                                  {p.checkedIn ? (
                                    <>
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Undo</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Check In</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View: Cards Grid (< 768px) */}
                  <div className="md:hidden space-y-3">
                    {filteredParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-[14px] border border-[#E1E5EE] bg-[#F8FAFC]/50 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-[#0E1424] text-sm">{p.name}</div>
                            <div className="text-xs text-[#5B6478]">{p.email}</div>
                          </div>
                          {p.checkedIn ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBFBF4] text-[#12805C]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Entered</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#5B6478] border border-[#E1E5EE]">
                              <span>Pending</span>
                            </span>
                          )}
                        </div>

                        {/* College and branch tags */}
                        <div className="text-xs space-y-1 bg-white p-2.5 rounded-[10px] border border-[#E1E5EE]">
                          <div className="font-semibold text-[#0E1424] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#3345E8] shrink-0" />
                            <span>{p.collegeName || 'Marwadi University'}</span>
                          </div>
                          <div className="text-[11px] text-[#5B6478] flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-[#12805C] shrink-0" />
                            <span className="truncate">{p.branch}</span>
                          </div>
                          {p.specialization && (
                            <div className="text-[11px] text-[#3345E8] font-medium pl-5">
                              {p.specialization}
                            </div>
                          )}
                        </div>

                        {/* Ticket Code and Touch Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="font-mono text-xs font-black tracking-wider text-[#0E1424] bg-white px-2 py-1 rounded border border-[#E1E5EE]">
                            {p.code}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenInspectStudent(p)}
                              className="px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E1E5EE] text-xs font-semibold text-[#0E1424]"
                            >
                              Pass
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(p.code, p.checkedIn, p.name)}
                              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold ${
                                p.checkedIn
                                  ? 'bg-white text-[#C0302F] border border-[#E1E5EE]'
                                  : 'bg-[#12805C] text-white'
                              }`}
                            >
                              {p.checkedIn ? 'Undo' : 'Check In'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: QUICK GATE DESK & CHECK-IN CONSOLE */}
          {activeTab === 'quickdesk' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Rapid Code Input */}
              <div className="md:col-span-7 bg-white rounded-[20px] border border-[#E1E5EE] shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E1424]">
                    Rapid Gate Check-In Desk
                  </h3>
                  <p className="text-xs text-[#5B6478] mt-0.5">
                    Enter or paste attendee ticket codes for instantaneous admission verification.
                  </p>
                </div>

                <form onSubmit={handleQuickDeskCheckIn} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={deskCodeInput}
                      onChange={(e) => setDeskCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. EVT1-TK9A2B"
                      className="w-full font-mono text-lg font-bold tracking-widest pl-4 pr-24 py-3.5 bg-white border-2 border-[#3345E8] rounded-[12px] text-[#0E1424] placeholder:text-[#5B6478]/40 focus:outline-none focus:ring-4 focus:ring-[#3345E8]/20 transition-all uppercase"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#3345E8] hover:bg-[#2735C4] text-white font-bold text-xs px-4 py-2 rounded-[8px] transition-colors cursor-pointer"
                    >
                      Check In
                    </button>
                  </div>
                </form>

                {/* Desk Feedback Callout Card */}
                {deskFeedbackMessage && (
                  <div
                    className={`p-4 rounded-[14px] border space-y-1 animate-fadeIn ${
                      deskFeedbackMessage.type === 'success'
                        ? 'bg-[#EBFBF4] border-[#12805C]/30 text-[#065F46]'
                        : deskFeedbackMessage.type === 'duplicate'
                        ? 'bg-[#FFFBEB] border-amber-300 text-amber-900'
                        : 'bg-[#FFF4F2] border-[#F87171] text-[#991B1B]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {deskFeedbackMessage.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#12805C]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span>{deskFeedbackMessage.text}</span>
                    </div>

                    {deskFeedbackMessage.name && (
                      <div className="text-xs font-semibold pl-7">
                        Attendee: <strong className="text-black">{deskFeedbackMessage.name}</strong>
                        {deskFeedbackMessage.time && ` · Time: ${deskFeedbackMessage.time}`}
                      </div>
                    )}
                  </div>
                )}

                {/* Dedicated Scanner desk launcher */}
                {onNavigateToCheckIn && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[14px] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#3345E8] text-white flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0E1424]">Camera QR Scanner</div>
                        <div className="text-xs text-[#5B6478]">Use phone/laptop camera or upload QR image</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onNavigateToCheckIn}
                      className="bg-[#0E1424] hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-[8px] transition-colors cursor-pointer"
                    >
                      Launch Scanner &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Live Turn-up Stream */}
              <div className="md:col-span-5 bg-white rounded-[20px] border border-[#E1E5EE] shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1E5EE]">
                  <h4 className="font-extrabold text-sm text-[#0E1424]">
                    Recently Entered Attendees
                  </h4>
                  <span className="text-xs font-bold text-[#12805C]">
                    {stats.attended} checked in
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {participants
                    .filter((p) => p.checkedIn)
                    .slice(0, 8)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#0E1424] truncate">{p.name}</div>
                          <div className="text-[11px] text-[#5B6478] truncate">{p.collegeName || 'Marwadi University'}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-[10px] font-bold text-[#3345E8] bg-white px-1.5 py-0.5 rounded border border-[#E1E5EE]">
                            {p.code}
                          </span>
                          {p.checkedInAt && (
                            <div className="text-[10px] text-[#5B6478] mt-0.5">
                              {new Date(p.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {participants.filter((p) => p.checkedIn).length === 0 && (
                    <div className="text-center py-8 text-xs text-[#5B6478]">
                      No check-ins recorded yet for this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT FEEDBACK OPINIONS & REVIEWS */}
          {activeTab === 'feedback' && (
            <div className="bg-white rounded-[20px] border border-[#E1E5EE] shadow-sm p-5 sm:p-7 space-y-6">
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E5EE]">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E1424]">
                    Student Feedback & Event Ratings
                  </h3>
                  <p className="text-xs text-[#5B6478]">
                    Real-time opinions and suggestions submitted by student attendees
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentEvent && (
                    <button
                      type="button"
                      onClick={() => exportFeedbackCsv(currentEvent.id)}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F4F6FA] text-[#0E1424] text-xs font-bold px-3 py-2 border border-[#E1E5EE] rounded-[8px] transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#5B6478]" />
                      <span>Export Feedback CSV</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsAddFeedbackModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-bold px-3.5 py-2 rounded-[8px] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Feedback</span>
                  </button>
                </div>
              </div>

              {/* Scorecard Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F8FAFC] p-4 sm:p-5 rounded-[16px] border border-[#E2E8F0]">
                <div className="text-center sm:text-left flex flex-col justify-center">
                  <span className="text-xs font-bold text-[#5B6478] uppercase">Average Satisfaction</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#0E1424] mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <span>{feedbackSummary.count > 0 ? feedbackSummary.averageRating : '—'}</span>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(feedbackSummary.averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-[#5B6478] mt-1">
                    Based on {feedbackSummary.count} verified submissions
                  </span>
                </div>

                <div className="sm:col-span-2 flex flex-col justify-center space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const countForStars = feedbackList.filter((f) => f.rating === stars).length;
                    const pct = feedbackList.length > 0 ? Math.round((countForStars / feedbackList.length) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs">
                        <span className="w-7 font-bold text-[#5B6478]">{stars} ★</span>
                        <div className="flex-1 bg-[#E1E5EE] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-[#5B6478]">{countForStars}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Reviews List */}
              <div className="space-y-3 pt-2">
                {feedbackList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#5B6478]">
                    No feedback comments received yet for this event.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {feedbackList.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-4 rounded-[14px] bg-white border border-[#E1E5EE] shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-xs text-[#0E1424]">{fb.studentName}</div>
                            {fb.studentEmail && (
                              <div className="text-[11px] text-[#5B6478]">{fb.studentEmail}</div>
                            )}
                          </div>
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-[#334155] leading-relaxed pt-1">
                          "{fb.comment}"
                        </p>

                        <div className="text-[10px] text-[#94A3B8] pt-1 border-t border-[#F1F5F9]">
                          {new Date(fb.createdAt).toLocaleDateString()} at{' '}
                          {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EVENT SETTINGS & CONFIGURATION */}
          {activeTab === 'settings' && currentEvent && (
            <div className="bg-white rounded-[20px] border border-[#E1E5EE] shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#0E1424]">
                  Event Configuration & Session Settings
                </h3>
                <p className="text-xs text-[#5B6478]">
                  Manage session state, seat capacity, and event branding
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event State Card */}
                <div className="p-4 rounded-[14px] border border-[#E1E5EE] space-y-3">
                  <h4 className="font-bold text-sm text-[#0E1424]">Session Status</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('upcoming')}
                      className={`w-full text-left p-3 rounded-[10px] border text-xs font-semibold flex items-center justify-between ${
                        (currentEvent.status || 'upcoming') === 'upcoming'
                          ? 'border-[#3345E8] bg-[#EEF2FF] text-[#1E1B4B]'
                          : 'border-[#E1E5EE] text-[#5B6478]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#0E1424]">Upcoming Session</div>
                        <div className="text-[11px] text-[#5B6478]">Registration open; gates opening soon</div>
                      </div>
                      {(currentEvent.status || 'upcoming') === 'upcoming' && <Check className="w-4 h-4 text-[#3345E8]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('ongoing')}
                      className={`w-full text-left p-3 rounded-[10px] border text-xs font-semibold flex items-center justify-between ${
                        currentEvent.status === 'ongoing'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'border-[#E1E5EE] text-[#5B6478]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#065F46]">Live Ongoing Session</div>
                        <div className="text-[11px] text-[#065F46]/80">Gate check-in active; real-time attendance tracking</div>
                      </div>
                      {currentEvent.status === 'ongoing' && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('completed')}
                      className={`w-full text-left p-3 rounded-[10px] border text-xs font-semibold flex items-center justify-between ${
                        currentEvent.status === 'completed'
                          ? 'border-slate-400 bg-slate-100 text-slate-800'
                          : 'border-[#E1E5EE] text-[#5B6478]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#0E1424]">Concluded</div>
                        <div className="text-[11px] text-[#5B6478]">Event finished; review attendee feedback</div>
                      </div>
                      {currentEvent.status === 'completed' && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  </div>
                </div>

                {/* Quick Info & Danger Zone */}
                <div className="space-y-4">
                  <div className="p-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                      <h4 className="font-bold text-sm text-[#0E1424]">Event Specifications</h4>
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3345E8] font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Edit Schedule / Venue</span>
                      </button>
                    </div>
                    <div className="space-y-1.5 text-[#475569]">
                      <div><strong>Event ID:</strong> {currentEvent.id}</div>
                      <div><strong>Venue:</strong> {currentEvent.venue}</div>
                      <div className="flex items-center gap-2">
                        <strong>Date & Time:</strong>
                        <span className="font-bold text-[#3345E8] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {currentEvent.date}
                        </span>
                      </div>
                      <div><strong>Capacity:</strong> {currentEvent.capacity} seats</div>
                      <div><strong>Organizer:</strong> {currentEvent.organizerEmail || AUTHORIZED_ORGANIZER_EMAIL}</div>
                    </div>
                  </div>

                  {/* Supabase Backend Integration Info */}
                  <div className="p-4 rounded-[14px] border border-indigo-200 bg-indigo-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                        <Database className="w-4 h-4 text-indigo-600" />
                        <span>Supabase Backend & Storage</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Connected
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div><strong>Project ID:</strong> <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px] border border-indigo-100">ooxhjbafurogcnqurdvo</code></div>
                      <div><strong>Storage Bucket:</strong> <code className="bg-white px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px] border border-indigo-100">event-banners</code></div>
                      <p className="text-[11px] text-slate-500 pt-1">
                        Events, participant registrations, attendance, and banners are automatically synced with Supabase.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-[14px] border border-[#F87171]/40 bg-[#FFF4F2] space-y-2">
                    <h4 className="font-bold text-sm text-[#991B1B]">Danger Zone</h4>
                    <p className="text-xs text-[#7F1D1D]">
                      Permanently remove this event and cascade delete all its registrations and student feedbacks.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="bg-[#C0302F] hover:bg-[#991B1B] text-white text-xs font-bold py-2 px-3.5 rounded-[8px] transition-colors cursor-pointer"
                    >
                      Delete Event Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* STUDENT PASS INSPECTION MODAL */}
      {inspectedStudent && (
        <div className="fixed inset-0 z-50 bg-[#0E1424]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[22px] border border-[#E1E5EE] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-[#0E1424] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                  Verified Student Pass
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {inspectedStudent.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedStudent(null)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 text-center space-y-4">
              {inspectedQrUrl && (
                <div className="inline-block p-2 bg-white border border-[#E1E5EE] rounded-[16px]">
                  <img
                    src={inspectedQrUrl}
                    alt="Student QR code"
                    className="w-44 h-44 mx-auto object-contain"
                  />
                </div>
              )}

              <div className="font-mono text-xl font-black text-[#0E1424] bg-[#F4F6FA] py-2 px-3 rounded-[8px] border border-[#E1E5EE]">
                {inspectedStudent.code}
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-[12px] border border-[#E2E8F0] text-left text-xs space-y-1.5">
                <div>
                  <span className="text-[10px] text-[#5B6478] font-bold uppercase">College</span>
                  <div className="font-bold text-[#0E1424]">{inspectedStudent.collegeName || 'Marwadi University'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B6478] font-bold uppercase">Branch</span>
                  <div className="font-medium text-[#334155]">{inspectedStudent.branch}</div>
                </div>
                {inspectedStudent.specialization && (
                  <div>
                    <span className="text-[10px] text-[#5B6478] font-bold uppercase">Specialization</span>
                    <div className="font-medium text-[#3345E8]">{inspectedStudent.specialization}</div>
                  </div>
                )}
                <div className="pt-1 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[10px] text-[#5B6478]">Status</span>
                  <span className={inspectedStudent.checkedIn ? 'text-[#12805C] font-bold' : 'text-[#5B6478] font-bold'}>
                    {inspectedStudent.checkedIn ? 'Checked In' : 'Pending Entry'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleToggleCheckIn(inspectedStudent.code, inspectedStudent.checkedIn, inspectedStudent.name);
                  setInspectedStudent(null);
                }}
                className={`w-full py-2.5 px-4 rounded-[10px] text-xs font-bold ${
                  inspectedStudent.checkedIn
                    ? 'bg-white text-[#C0302F] border border-[#E1E5EE]'
                    : 'bg-[#12805C] text-white'
                }`}
              >
                {inspectedStudent.checkedIn ? 'Revert Check-In' : 'Mark Checked In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW EVENT DRAWER / MODAL */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1424]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[22px] border border-[#E1E5EE] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-[#0E1424] text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white">Create New Event</h3>
                <p className="text-xs text-white/70 mt-0.5">Publish a new college event session</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                  Event Title <span className="text-[#C0302F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AI & Robotics Symposium 2026"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
                />
                {formErrors.name && <p className="text-xs text-[#C0302F] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <DateTimePicker
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                    label="Date & Time"
                    placeholder="Click to pick from calendar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                    Seat Capacity <span className="text-[#C0302F]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
                  />
                  {formErrors.capacity && <p className="text-xs text-[#C0302F] mt-1">{formErrors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                  Campus Venue / Location
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Main Auditorium, Hall 3"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                  Event Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(CATEGORIES)
                    .filter((cat) => cat.id !== 'all')
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id as EventCategory })}
                        className={`p-2 rounded-[8px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          formData.category === cat.id
                            ? 'border-[#3345E8] bg-[#EEF2FF] text-[#3345E8]'
                            : 'border-[#E1E5EE] text-[#5B6478]'
                        }`}
                      >
                        <cat.icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <BannerUploader
                  value={formData.bannerUrl}
                  onChange={(newUrl) => setFormData({ ...formData, bannerUrl: newUrl })}
                  label="Upload or Select Event Banner"
                />
              </div>

              <div className="pt-3 border-t border-[#E1E5EE] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="px-4 py-2.5 rounded-[10px] border border-[#E1E5EE] text-xs font-bold text-[#5B6478]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-[10px] bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT DETAILS & SCHEDULE MODAL */}
      {isEditModalOpen && currentEvent && (
        <div className="fixed inset-0 z-50 bg-[#0E1424]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[22px] border border-[#E1E5EE] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-[#0E1424] text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3345E8] bg-[#EEF2FF] px-2 py-0.5 rounded">
                  Edit Event
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">
                  Update Event & Schedule
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Change date, time, venue, or capacity with interactive calendar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                  Event Title <span className="text-[#C0302F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. AI & Robotics Symposium 2026"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
                />
                {editFormErrors.name && <p className="text-xs text-[#C0302F] mt-1">{editFormErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <DateTimePicker
                    value={editFormData.date}
                    onChange={(val) => setEditFormData({ ...editFormData, date: val })}
                    label="Date & Time"
                    placeholder="Click to pick from calendar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                    Seat Capacity <span className="text-[#C0302F]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
                  />
                  {editFormErrors.capacity && <p className="text-xs text-[#C0302F] mt-1">{editFormErrors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                  Campus Venue / Location
                </label>
                <input
                  type="text"
                  value={editFormData.venue}
                  onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
                  placeholder="Main Auditorium, Hall 3"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
                  Event Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(CATEGORIES)
                    .filter((cat) => cat.id !== 'all')
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, category: cat.id as EventCategory })}
                        className={`p-2 rounded-[8px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          editFormData.category === cat.id
                            ? 'border-[#3345E8] bg-[#EEF2FF] text-[#3345E8]'
                            : 'border-[#E1E5EE] text-[#5B6478]'
                        }`}
                      >
                        <cat.icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <BannerUploader
                  value={editFormData.bannerUrl}
                  onChange={(newUrl) => setEditFormData({ ...editFormData, bannerUrl: newUrl })}
                  label="Upload or Update Event Banner"
                />
              </div>

              <div className="pt-3 border-t border-[#E1E5EE] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-[10px] border border-[#E1E5EE] text-xs font-bold text-[#5B6478]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2.5 rounded-[10px] bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && currentEvent && (
        <div className="fixed inset-0 z-50 bg-[#0E1424]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[22px] border border-[#E1E5EE] shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#FFF4F2] text-[#C0302F] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0E1424]">Delete '{currentEvent.name}'?</h3>
              <p className="text-xs text-[#5B6478] mt-1 leading-relaxed">
                This action is irreversible. All student registrations, generated pass codes, and student feedback for this event will be deleted permanently.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-[#E1E5EE] text-xs font-bold text-[#5B6478]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-[8px] bg-[#C0302F] hover:bg-[#991B1B] text-white text-xs font-bold transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT FEEDBACK MODAL (Organizer Triggered) */}
      {currentEvent && (
        <StudentFeedbackModal
          event={currentEvent}
          isOpen={isAddFeedbackModalOpen}
          onClose={() => setIsAddFeedbackModalOpen(false)}
        />
      )}

      {/* ALL EVENTS OVERVIEW MODAL */}
      {isAllEventsModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1424]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[85vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    All College Events ({events.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select an event to view analytics, gate live tracking, and participant roster.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllEventsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {events.map((ev) => {
                const isSelected = ev.id === selectedEventId;
                const evStats = getStats(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      onSelectEventId(ev.id);
                      setIsAllEventsModalOpen(false);
                      showToast(`Switched to '${ev.name}'`);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-600/10'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative border border-slate-200">
                        <EventBannerImage
                          src={ev.bannerUrl}
                          category={ev.category}
                          alt={ev.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {ev.name}
                          </h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span>{ev.date}</span>
                          <span>·</span>
                          <span>{ev.venue}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-3 pt-0.5">
                          <span className="text-indigo-600">
                            {evStats.registered} / {ev.capacity} registered
                          </span>
                          <span>·</span>
                          <span className="text-emerald-600 font-bold">
                            {evStats.attended} joined
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEventId(ev.id);
                          setIsAllEventsModalOpen(false);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? 'Currently Viewing' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsAllEventsModalOpen(false);
                  handleOpenPanel();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Another Event</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAllEventsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL & EMAIL SHARE MODAL */}
      {currentEvent && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          event={currentEvent}
        />
      )}
    </div>
  );
}
