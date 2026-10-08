/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { addFeedback, Event } from '../store';
import { useToast } from './Toast';
import { Star, X, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

interface StudentFeedbackModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
}

export function StudentFeedbackModal({
  event,
  isOpen,
  onClose,
  defaultName = '',
  defaultEmail = '',
}: StudentFeedbackModalProps) {
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (defaultName) setName(defaultName);
      if (defaultEmail) setEmail(defaultEmail);
      setError(null);
      setSubmitted(false);
    }
  }, [isOpen, defaultName, defaultEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError('Please provide a feedback comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      addFeedback({
        eventId: event.id,
        studentName: name.trim() || 'Student Attendee',
        studentEmail: email.trim().toLowerCase(),
        rating,
        comment: trimmedComment,
      });

      setSubmitted(true);
      showToast('Thank you for your feedback!');
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setComment('');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit feedback.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0E1424]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-[20px] border border-[#E1E5EE] shadow-[0_12px_32px_rgba(14,20,36,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0E1424] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-white/90 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-300" />
            <span>Attendee Feedback</span>
          </div>

          <h3 id="feedback-title" className="text-xl font-bold text-white leading-tight">
            Review {event.name}
          </h3>
          <p className="text-xs text-white/70 mt-1">
            Share your experience, organization feedback, and suggestions.
          </p>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#DDF5EA] text-[#12805C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-[#0E1424]">Feedback Recorded</h4>
            <p className="text-sm text-[#5B6478]">
              Your review is visible to the organizers in their event dashboard. Thank you!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-[8px] bg-[#FCE1E1] text-[#C0302F] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating !== null ? hoverRating : rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#E1E5EE] fill-transparent hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-semibold text-[#5B6478] ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                </span>
              </div>
            </div>

            {/* Student Name */}
            <div>
              <label htmlFor="student-name" className="block text-xs font-semibold text-[#0E1424] mb-1">
                Your name (optional)
              </label>
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Riya Sharma"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5EE] rounded-[8px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8]"
              />
            </div>

            {/* Student Email */}
            <div>
              <label htmlFor="student-email" className="block text-xs font-semibold text-[#0E1424] mb-1">
                Your email (optional)
              </label>
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="riya@college.edu"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5EE] rounded-[8px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8]"
              />
            </div>

            {/* Feedback Comment */}
            <div>
              <label htmlFor="feedback-comment" className="block text-xs font-semibold text-[#0E1424] mb-1">
                Comments & Suggestions <span className="text-[#C0302F]">*</span>
              </label>
              <textarea
                id="feedback-comment"
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you enjoy most about the event? Any suggestions for the organizers?"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5EE] rounded-[8px] text-[#0E1424] placeholder:text-[#5B6478]/50 focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 focus:border-[#3345E8]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E5EE]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#0E1424] hover:bg-[#F4F6FA] rounded-[8px] border border-[#E1E5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#3345E8] hover:bg-[#2735C4] disabled:opacity-50 rounded-[8px] shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
