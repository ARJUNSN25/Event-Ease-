/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Event,
  EventStats,
  listEvents,
  getStats,
  getEventFeedbackSummary,
  subscribeToStore,
  EventCategory,
} from '../store';
import { CATEGORIES, getCategoryInfo } from '../utils/categories';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { ShareModal } from './ShareModal';
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
  Radio,
  Share2,
} from 'lucide-react';

interface EventsCatalogViewProps {
  onSelectEventForRegister: (eventId: string) => void;
  onNavigateToOrganizer: () => void;
}

export function EventsCatalogView({
  onSelectEventForRegister,
  onNavigateToOrganizer,
}: EventsCatalogViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<Event | null>(null);
  const [shareModalEvent, setShareModalEvent] = useState<Event | null>(null);

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

  // Filter events based on search query & category
  const filteredEvents = useMemo(() => {
    let list = [...events];

    if (selectedCategory !== 'all') {
      list = list.filter((e) => (e.category || 'tech') === selectedCategory);
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

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, selectedCategory, searchQuery]);

  const categoriesList = [
    CATEGORIES.all,
    CATEGORIES.tech,
    CATEGORIES.cultural,
    CATEGORIES.sports,
    CATEGORIES.academic,
    CATEGORIES.arts,
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-[20px] bg-[#0E1424] text-white p-6 sm:p-10 overflow-hidden shadow-sm">
        {/* Subtle background ambient blur */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#3345E8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white/90 mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Official University Events</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Explore Campus Events
          </h1>
          <p className="text-sm sm:text-base text-white/70 mt-2 leading-relaxed">
            Discover upcoming hackathons, athletic tournaments, cultural fests, and research symposiums. Claim your verified QR entry pass in seconds.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, or date..."
            className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-white border border-[#E1E5EE] rounded-[12px] text-[#0E1424] placeholder:text-[#5B6478]/60 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8] shadow-xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#0E1424] p-1 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills with Logos/Icons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as EventCategory | 'all')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border shrink-0 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#3345E8]/30 ${
                  isSelected
                    ? 'bg-[#0E1424] text-white border-[#0E1424] shadow-sm'
                    : 'bg-white text-[#5B6478] hover:text-[#0E1424] hover:bg-[#F4F6FA] border-[#E1E5EE]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-white' : 'text-[#3345E8]'
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
        <div className="py-16 text-center bg-white rounded-[16px] border border-[#E1E5EE] p-8">
          <div className="w-14 h-14 rounded-full bg-[#F4F6FA] text-[#5B6478] flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7" />
          </div>
          {events.length === 0 ? (
            <>
              <h2 className="text-xl font-bold text-[#0E1424] mb-2">
                No events published yet
              </h2>
              <p className="text-[#5B6478] text-sm max-w-md mx-auto mb-6">
                Be the first to create an event, configure custom banners, and start registering campus attendees.
              </p>
              <button
                type="button"
                onClick={onNavigateToOrganizer}
                className="inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] text-white text-sm font-semibold px-5 py-2.5 rounded-[8px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create first event in Organizer Portal</span>
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[#0E1424] mb-2">
                No matching events found
              </h2>
              <p className="text-[#5B6478] text-sm max-w-sm mx-auto mb-4">
                We couldn't find any events matching your search or category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3345E8] hover:underline"
              >
                <span>Reset search and filters</span>
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
                className="group bg-white rounded-[16px] border border-[#E1E5EE] overflow-hidden flex flex-col justify-between hover:border-[#3345E8]/40 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Event Banner Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#0E1424]">
                    {event.bannerUrl?.startsWith('linear-gradient') ? (
                      <div
                        className="w-full h-full"
                        style={{ background: event.bannerUrl }}
                      />
                    ) : event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0E1424]" />
                    )}

                    {/* Gradient scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Category Badge on Top-Left */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-xs text-[#0E1424] shadow-xs">
                        <CategoryIcon className="w-3.5 h-3.5 text-[#3345E8]" />
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFEBCB] text-[#B25E00] shadow-xs">
                          Full
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DDF5EA] text-[#12805C] shadow-xs">
                          {stats.remaining} {stats.remaining === 1 ? 'seat' : 'seats'} left
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
                    <div className="space-y-1.5 text-xs sm:text-sm text-[#5B6478]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#5B6478] shrink-0" />
                        <span className="font-medium text-[#0E1424]">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#5B6478] shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#5B6478] pt-2 border-t border-[#E1E5EE]">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#5B6478] shrink-0" />
                          <span>{stats.registered} / {stats.capacity} registered</span>
                        </span>

                        {/* Rating stars if any reviews */}
                        {(() => {
                          const fb = getEventFeedbackSummary(event.id);
                          return fb.count > 0 ? (
                            <span className="flex items-center gap-1 font-bold text-[#0E1424]">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{fb.averageRating} ({fb.count})</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#5B6478]/80">No reviews yet</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-5 pt-0 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectEventForRegister(event.id)}
                      disabled={isFull}
                      className="sm:col-span-3 w-full inline-flex items-center justify-center gap-2 bg-[#3345E8] hover:bg-[#2735C4] disabled:bg-[#F4F6FA] disabled:text-[#5B6478] disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-[10px] transition-colors focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 min-h-[44px] cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{isFull ? 'Event Full' : 'Get Entry Pass'}</span>
                      {!isFull && <ArrowRight className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareModalEvent(event)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#F4F6FA] hover:bg-[#E1E5EE] text-[#0E1424] border border-[#E1E5EE] text-xs font-bold py-2.5 px-3 rounded-[10px] transition-colors cursor-pointer min-h-[44px]"
                      title="Share to WhatsApp, Instagram, LinkedIn, Mail"
                    >
                      <Share2 className="w-4 h-4 text-[#3345E8]" />
                      <span className="sm:hidden">Share</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFeedbackModalEvent(event)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 text-[#5B6478] hover:text-[#0E1424] hover:bg-[#F4F6FA] rounded-[6px] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Leave student review / feedback</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
