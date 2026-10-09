/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Mail,
  Send,
  Linkedin,
  Instagram,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Event } from '../store';
import { useToast } from './Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  studentPassCode?: string;
  studentName?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  event,
  studentPassCode,
  studentName,
}: ShareModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  if (!isOpen) return null;

  // Build clean sharing URL with event ID
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareUrl = `${baseUrl}?tab=register&eventId=${event.id}`;

  const isPassShare = Boolean(studentPassCode);

  // Formulate text content based on whether this is an Organizer event share or a Student pass share
  const shareTitle = isPassShare
    ? `🎓 My Verified Entry Pass: ${event.name}`
    : `🚀 Join ${event.name} on EventEase`;

  const shareSummary = isPassShare
    ? `Hey! I just registered for ${event.name} scheduled for ${event.date} at ${event.venue}. My Entry Pass Code is ${studentPassCode}. Register and grab your pass here: ${shareUrl}`
    : `Hey! Check out this campus event: ${event.name}\n📅 Date: ${event.date}\n📍 Venue: ${event.venue}\n${event.description ? `📝 ${event.description}\n` : ''}🎟️ Claim your digital QR pass here: ${shareUrl}`;

  // Copy URL to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Event link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy automatically.', 'warning');
    }
  };

  // WhatsApp Share (Instant direct web/app intent)
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareTitle}\n\n${shareSummary}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // LinkedIn Share
  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    const summary = encodeURIComponent(shareSummary);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Instagram Share (Instagram doesn't have a direct prefill web URL, copies caption and opens Instagram)
  const handleShareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareSummary);
      showToast('Event details copied! Opening Instagram to share on story/DM...', 'info');
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      }, 600);
    } catch {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }
  };

  // Mail ID Sharing (Opens default client like Gmail, Outlook, Apple Mail with pre-filled subject, body and recipient)
  const handleShareEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const to = recipientEmail.trim();
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share this college event with you:\n\nEvent: ${event.name}\nDate & Time: ${event.date}\nVenue: ${event.venue}\n${isPassShare ? `Attendee: ${studentName || 'Student'}\nPass Code: ${studentPassCode}\n\n` : ''}${event.description ? `About:\n${event.description}\n\n` : ''}Register and get your digital QR entry pass here:\n${shareUrl}\n\nBest regards,\nEventEase Platform`
    );

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    showToast(to ? `Opening email composer to ${to}...` : 'Opening email composer...');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1424]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-[24px] border border-slate-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Light Header */}
        <div className="bg-slate-50 border-b border-slate-200/90 text-slate-900 p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-full bg-[#3345E8] text-white shadow-xs">
              <Share2 className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#3345E8]">
              {isPassShare ? 'Share Verified Entry Pass' : 'Share Campus Event'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 leading-tight">
            {event.name}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {isPassShare
              ? `Share your digital pass (Code: ${studentPassCode}) with friends or organizers.`
              : 'Invite friends, classmates, and attendees across your favorite channels.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Quick Social Share Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-2.5">
              Share to Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#12805C] transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#0E1424]">WhatsApp</span>
                <span className="text-[10px] text-[#5B6478]">Direct chat</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleShareInstagram}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 hover:from-purple-500/20 hover:to-orange-500/20 border border-pink-500/30 text-pink-700 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Instagram className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#0E1424]">Instagram</span>
                <span className="text-[10px] text-[#5B6478]">Copy & Open</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#0A66C2] transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Linkedin className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#0E1424]">LinkedIn</span>
                <span className="text-[10px] text-[#5B6478]">Post / Feed</span>
              </button>

              {/* Email Client */}
              <button
                type="button"
                onClick={() => handleShareEmail()}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#3345E8]/10 hover:bg-[#3345E8]/20 border border-[#3345E8]/30 text-[#3345E8] transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-[#3345E8] text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#0E1424]">Mail App</span>
                <span className="text-[10px] text-[#5B6478]">Default client</span>
              </button>
            </div>
          </div>

          {/* 2. Direct Personal Email Input */}
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <label htmlFor="share-email-input" className="block text-xs font-bold uppercase tracking-wider text-[#0E1424] mb-1.5 flex items-center justify-between">
              <span>Send to Personal Mail ID</span>
              <span className="text-[10px] text-[#5B6478] font-normal">Pre-composed email</span>
            </label>
            <form onSubmit={handleShareEmail} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="share-email-input"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="friend@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E1E5EE] rounded-xl text-[#0E1424] placeholder:text-[#5B6478]/60 focus:outline-none focus:ring-2 focus:ring-[#3345E8]/30"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose</span>
              </button>
            </form>
          </div>

          {/* 3. Copyable Direct Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
              Copy Direct Registration Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-[#E1E5EE] rounded-xl text-[#5B6478] font-mono truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 bg-[#0E1424] hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-5 py-3 flex items-center justify-between text-xs text-[#5B6478]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3345E8]" />
            <span>EventEase Instant Pass Gateway</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#0E1424] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
