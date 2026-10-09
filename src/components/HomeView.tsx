/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Event,
  listEvents,
  getStats,
  EventCategory,
  subscribeToStore,
} from '../store';
import { CATEGORIES, getCategoryInfo } from '../utils/categories';
import { EventBannerImage } from './EventBannerImage';
import { EventDetailsModal } from './EventDetailsModal';
import { ShareModal } from './ShareModal';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import {
  Sparkles,
  ArrowRight,
  Ticket,
  Calendar,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Zap,
  QrCode,
  GraduationCap,
  Award,
  ChevronRight,
  Star,
  Compass,
  LayoutDashboard,
  ScanLine,
} from 'lucide-react';

interface HomeViewProps {
  onNavigateToEvents: (initialCategory?: EventCategory | 'all') => void;
  onNavigateToRegistrations: () => void;
  onNavigateToOrganizer: () => void;
  onNavigateToCheckIn: () => void;
  onSelectEventForRegister: (eventId: string) => void;
  onOpenAbout: () => void;
}

export function HomeView({
  onNavigateToEvents,
  onNavigateToRegistrations,
  onNavigateToOrganizer,
  onNavigateToCheckIn,
  onSelectEventForRegister,
  onOpenAbout,
}: HomeViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

  // Modals state
  const [detailsModalEvent, setDetailsModalEvent] = useState<Event | null>(null);
  const [shareModalEvent, setShareModalEvent] = useState<Event | null>(null);
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<Event | null>(null);

  const refreshEvents = () => {
    setEvents(listEvents());
  };

  useEffect(() => {
    refreshEvents();
    const unsub = subscribeToStore(() => {
      refreshEvents();
    });
    return unsub;
  }, []);

  // Unique venues list for filter
  const uniqueVenues = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.venue) set.add(e.venue);
    });
    return Array.from(set);
  }, [events]);

  // Featured events (first 2 or highlighted)
  const featuredEvents = useMemo(() => {
    return events.slice(0, 2);
  }, [events]);

  // Filtered upcoming events
  const upcomingEvents = useMemo(() => {
    let list = [...events];

    if (selectedCategory !== 'all') {
      list = list.filter((e) => (e.category || 'tech') === selectedCategory);
    }

    if (venueFilter !== 'all') {
      list = list.filter((e) => e.venue === venueFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.date.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, selectedCategory, venueFilter, searchQuery]);

  const categoriesList = [
    CATEGORIES.all,
    CATEGORIES.tech,
    CATEGORIES.cultural,
    CATEGORIES.sports,
    CATEGORIES.academic,
    CATEGORIES.arts,
  ];

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 pb-24 md:pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        {/* Subtle decorative background gradient glows */}
        <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 -mb-20 w-80 h-80 bg-blue-50/70 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
          <div className="max-w-3xl space-y-5">
            {/* National / Collegiate pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>National College Event Registration & Check-In Platform</span>
            </div>

            {/* Required Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Discover. Register.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                Experience.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed pt-1">
              Join university hackathons, dynamic cultural festivals, sports tournaments, and scholarly symposiums. Generate verified digital QR passes in seconds and enjoy seamless gate entry.
            </p>

            {/* Clear Call-To-Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => onNavigateToEvents('all')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[48px]"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNavigateToRegistrations}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-xs transition-all cursor-pointer min-h-[48px]"
              >
                <Ticket className="w-4 h-4 text-indigo-600" />
                <span>My Digital Passes</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToOrganizer}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-sm transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Organizer Portal</span>
              </button>
            </div>
          </div>

          {/* Key Platform Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">1,200+</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Campus Attendees</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="text-2xl sm:text-3xl font-black text-indigo-600">100%</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Digital QR Passes</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">&lt; 1 sec</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Gate Verification</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="text-2xl sm:text-3xl font-black text-blue-600">Zero</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Paper Ticket Waste</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-10 space-y-14">
        {/* 2. Featured College Events Section */}
        {featuredEvents.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Spotlight
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Featured College Events
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToEvents('all')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <span>View all ({events.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredEvents.map((event) => {
                const stats = getStats(event.id);
                const isFull = stats.capacity > 0 && stats.remaining === 0;
                const categoryInfo = getCategoryInfo(event.category);
                const CategoryIcon = categoryInfo.icon;

                return (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-indigo-400 hover:shadow-lg transition-all duration-200"
                  >
                    <div>
                      {/* Banner Image */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                        <EventBannerImage
                          src={event.bannerUrl}
                          category={event.category}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />

                        {/* Gradient scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                        {/* Category Badge */}
                        <div className="absolute top-3.5 left-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                            <CategoryIcon className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{categoryInfo.label}</span>
                          </span>
                        </div>

                        {/* Availability badge */}
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                          {event.status === 'ongoing' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>LIVE</span>
                            </span>
                          )}
                          {isFull ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 shadow-xs">
                              Capacity Full
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shadow-xs">
                              {stats.remaining} spots left
                            </span>
                          )}
                        </div>

                        {/* Event Name */}
                        <div className="absolute bottom-3.5 inset-x-3.5 text-white">
                          <h3 className="font-extrabold text-xl leading-snug line-clamp-2 drop-shadow-xs">
                            {event.name}
                          </h3>
                        </div>
                      </div>

                      {/* Event Details Content */}
                      <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-900">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>

                        {event.organizerName && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Organized by {event.organizerName}</span>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                          {event.description || 'Join your fellow students for this campus event.'}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions: View Details & Register Now */}
                    <div className="p-5 pt-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailsModalEvent(event)}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        disabled={isFull}
                        onClick={() => onSelectEventForRegister(event.id)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>{isFull ? 'Event Full' : 'Register Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. Search, Location & Category Filters */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Browse Campus Calendar
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Upcoming Events & Activities
              </h2>
            </div>

            {/* Quick search & Venue selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events or date..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Location / Venue Filter */}
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
              >
                <option value="all">All Locations & Venues</option>
                {uniqueVenues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoriesList.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as EventCategory | 'all')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/25'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Upcoming Events Grid with consistent Modern Light cards */}
        <section>
          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No events found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No events currently match your selected filters. Try resetting the category or search keyword.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setVenueFilter('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => {
                const stats = getStats(event.id);
                const isFull = stats.capacity > 0 && stats.remaining === 0;
                const categoryInfo = getCategoryInfo(event.category);
                const CategoryIcon = categoryInfo.icon;

                return (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      {/* Banner Image */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <EventBannerImage
                          src={event.bannerUrl}
                          category={event.category}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />

                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                            <CategoryIcon className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{categoryInfo.label}</span>
                          </span>
                        </div>

                        {/* Availability badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {isFull ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 shadow-xs">
                              Full
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shadow-xs">
                              {stats.remaining} spots left
                            </span>
                          )}
                        </div>

                        {/* Event Title */}
                        <div className="absolute bottom-3 inset-x-3 text-white">
                          <h3 className="font-extrabold text-lg leading-snug line-clamp-2 drop-shadow-xs">
                            {event.name}
                          </h3>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{event.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>

                        {event.organizerName && (
                          <div className="flex items-center gap-2 text-slate-500 pt-1 border-t border-slate-100">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">By {event.organizerName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: View Details & Register Now */}
                    <div className="p-4 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailsModalEvent(event)}
                          className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => onSelectEventForRegister(event.id)}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{isFull ? 'Full' : 'Register'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setShareModalEvent(event)}
                          className="hover:text-indigo-600 font-semibold cursor-pointer"
                        >
                          Share event
                        </button>

                        <button
                          type="button"
                          onClick={() => setFeedbackModalEvent(event)}
                          className="hover:text-indigo-600 font-semibold cursor-pointer"
                        >
                          Reviews / Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. How EventEase Works (3-Step Guide) */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How EventEase Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Built specifically to streamline collegiate event registration and eliminate queue congestion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-base">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Explore Campus Events</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse hackathons, competitions, guest lectures, and cultural nights hosted by departments and student clubs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-base">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Instant QR Pass Issuance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your student credentials in 30 seconds. Your unique digital pass and encrypted QR code are generated on the spot.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-base">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Fast Gate Check-In</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Present your digital screen at the venue door. Gate volunteers scan and verify entry in under 1 second.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Professional Footer */}
        <footer className="pt-12 border-t border-slate-200 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-black text-white text-base">
                  E
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  EventEase
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                College event registration and real-time check-in platform. Designed for universities, student chapters, and national hackathons.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600">
                  Gate Verification System Online
                </span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Navigation</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateToEvents('all')}
                    className="hover:text-indigo-600 cursor-pointer"
                  >
                    Explore Events
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToRegistrations}
                    className="hover:text-indigo-600 cursor-pointer"
                  >
                    My Digital Passes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToCheckIn}
                    className="hover:text-indigo-600 cursor-pointer"
                  >
                    Scanner Gate Desk
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToOrganizer}
                    className="hover:text-indigo-600 cursor-pointer"
                  >
                    Organizer Portal
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: About & Support */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">About & Trust</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>
                  <button
                    type="button"
                    onClick={onOpenAbout}
                    className="hover:text-indigo-600 cursor-pointer"
                  >
                    About EventEase
                  </button>
                </li>
                <li>
                  <span className="text-slate-400">Campus Council Approved</span>
                </li>
                <li>
                  <span className="text-slate-400">Encrypted Pass Verification</span>
                </li>
                <li>
                  <span className="text-slate-400">Anti-Duplicate Entry</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <p>&copy; {new Date().getFullYear()} EventEase &middot; Collegiate Event Management Platform.</p>
            <p className="flex items-center gap-1">
              <span>Crafted for National College Hackathons &amp; Events</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <EventDetailsModal
        event={detailsModalEvent}
        isOpen={!!detailsModalEvent}
        onClose={() => setDetailsModalEvent(null)}
        onRegister={onSelectEventForRegister}
        onShare={(ev) => {
          setDetailsModalEvent(null);
          setShareModalEvent(ev);
        }}
      />

      {shareModalEvent && (
        <ShareModal
          event={shareModalEvent}
          isOpen={!!shareModalEvent}
          onClose={() => setShareModalEvent(null)}
        />
      )}

      {feedbackModalEvent && (
        <StudentFeedbackModal
          event={feedbackModalEvent}
          isOpen={!!feedbackModalEvent}
          onClose={() => setFeedbackModalEvent(null)}
        />
      )}
    </div>
  );
}
