/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Event,
  listEvents,
  getStats,
  getEventFeedbackSummary,
  subscribeToStore,
  EventCategory,
} from '../store';
import { CATEGORIES, getCategoryInfo } from '../utils/categories';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { ShareModal } from './ShareModal';
import { EventBannerImage } from './EventBannerImage';
import { EventDetailsModal } from './EventDetailsModal';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Ticket,
  X,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Plus,
  Star,
  MessageSquare,
  Share2,
  Building2,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface EventsCatalogViewProps {
  onSelectEventForRegister: (eventId: string) => void;
  onNavigateToOrganizer: () => void;
  initialCategory?: EventCategory | 'all';
}

export function EventsCatalogView({
  onSelectEventForRegister,
  onNavigateToOrganizer,
  initialCategory = 'all',
}: EventsCatalogViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>(initialCategory);
  const [venueFilter, setVenueFilter] = useState('all');

  // Modals state
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<Event | null>(null);
  const [shareModalEvent, setShareModalEvent] = useState<Event | null>(null);
  const [detailsModalEvent, setDetailsModalEvent] = useState<Event | null>(null);

  const refreshEvents = () => {
    setEvents(listEvents());
  };

  useEffect(() => {
    refreshEvents();
    const unsubscribe = subscribeToStore(() => {
      refreshEvents();
    });
    return unsubscribe;
  }, []);

  // Unique venues
  const uniqueVenues = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.venue) set.add(e.venue);
    });
    return Array.from(set);
  }, [events]);

  // Filter events based on search query, category & venue
  const filteredEvents = useMemo(() => {
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
          e.date.toLowerCase().includes(q) ||
          (e.organizerName && e.organizerName.toLowerCase().includes(q))
      );
    }

    // Sort newest first
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
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 space-y-8">
      {/* Modern Light Hero Header */}
      <div className="relative rounded-2xl bg-white border border-slate-200 text-slate-900 p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-indigo-50/80 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Collegiate Event Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Explore Campus Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            Discover upcoming hackathons, athletic tournaments, cultural fests, and research symposiums. Claim your verified digital QR pass in seconds.
          </p>
        </div>
      </div>

      {/* Search, Venue & Category Filter Section */}
      <div className="space-y-4">
        {/* Search Bar & Venue Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title, organizer, or venue..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location / Venue dropdown */}
          <div className="relative">
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
            >
              <option value="all">All Campus Venues</option>
              {uniqueVenues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as EventCategory | 'all')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap border shrink-0 min-h-[40px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/25'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-white' : 'text-indigo-600'
                  }`}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7" />
          </div>
          {events.length === 0 ? (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                No events published yet
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Be the first to create an event, configure custom banners, and start registering campus attendees.
              </p>
              <button
                type="button"
                onClick={onNavigateToOrganizer}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create first event in Organizer Portal</span>
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                No matching events found
              </h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
                We couldn't find any events matching your search or filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setVenueFilter('all');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                <span>Reset all search and filters</span>
                &rarr;
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
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
                  {/* Event Banner Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <EventBannerImage
                      src={event.bannerUrl}
                      category={event.category}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Gradient scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                    {/* Category Badge on Top-Left */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-xs text-slate-900 shadow-xs">
                        <CategoryIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{categoryInfo.label}</span>
                      </span>
                    </div>

                    {/* Seat status badge on Top-Right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {event.status === 'ongoing' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>LIVE</span>
                        </span>
                      )}
                      {isFull ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 shadow-xs">
                          Full
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shadow-xs">
                          {stats.remaining} {stats.remaining === 1 ? 'spot' : 'spots'} left
                        </span>
                      )}
                    </div>

                    {/* Event Name on Banner Bottom */}
                    <div className="absolute bottom-3 inset-x-3 text-white">
                      <h3 className="font-extrabold text-lg sm:text-xl leading-snug line-clamp-2 drop-shadow-xs">
                        {event.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>

                      {event.organizerName && (
                        <div className="flex items-center gap-2 text-slate-500 pt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Organized by {event.organizerName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{stats.registered} / {stats.capacity} registered</span>
                        </span>

                        {/* Rating stars if any reviews */}
                        {(() => {
                          const fb = getEventFeedbackSummary(event.id);
                          return fb.count > 0 ? (
                            <span className="flex items-center gap-1 font-bold text-slate-900">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{fb.averageRating} ({fb.count})</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">No reviews yet</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action: View Details and Register Now buttons */}
                <div className="p-5 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailsModalEvent(event)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectEventForRegister(event.id)}
                      disabled={isFull}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] cursor-pointer shadow-xs"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{isFull ? 'Event Full' : 'Register Now'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => setShareModalEvent(event)}
                      className="hover:text-indigo-600 font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeedbackModalEvent(event)}
                      className="hover:text-indigo-600 font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>Reviews</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
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

      {/* Student Feedback Modal */}
      {feedbackModalEvent && (
        <StudentFeedbackModal
          event={feedbackModalEvent}
          isOpen={!!feedbackModalEvent}
          onClose={() => setFeedbackModalEvent(null)}
        />
      )}

      {/* Social & Email Share Modal */}
      {shareModalEvent && (
        <ShareModal
          isOpen={!!shareModalEvent}
          onClose={() => setShareModalEvent(null)}
          event={shareModalEvent}
        />
      )}
    </div>
  );
}
