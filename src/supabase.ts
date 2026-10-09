/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Event, Registration, Feedback } from './store';

// Environment variables with hardcoded fallbacks to the user-provided project configuration
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ooxhjbafurogcnqurdvo.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_UMke8Ovf-Y_uXmVT_yKSlw_tRdbeKQ9';

export const BUCKET_NAME = 'event-banners';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Upload an image file or blob to Supabase Storage bucket 'event-banners'
 * Returns the public URL on success, or null if storage is unconfigured or upload fails.
 */
export async function uploadBannerToStorage(
  fileOrBlob: File | Blob,
  originalName: string = 'banner.jpg'
): Promise<string | null> {
  try {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const filePath = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;

    const contentType =
      fileOrBlob.type || (cleanExt === 'png' ? 'image/png' : 'image/jpeg');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileOrBlob, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] Upload notice:', error.message);
      return null;
    }

    if (data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
    return null;
  } catch (err) {
    console.warn('[Supabase Storage] Unexpected upload failure:', err);
    return null;
  }
}

/**
 * Map database row to application Event model
 */
export function mapRowToEvent(row: any): Event {
  return {
    id: String(row.id),
    name: row.name || 'Untitled Event',
    date: row.date || 'TBA',
    venue: row.venue || 'Campus Venue',
    capacity: Number(row.capacity) || 100,
    bannerUrl: row.banner_url || undefined,
    category: row.category || 'tech',
    status: row.status || 'upcoming',
    organizerEmail: row.organizer_email || undefined,
    organizerName: row.organizer_name || undefined,
    description: row.description || undefined,
    eligibility: row.eligibility || undefined,
    entryFee: row.entry_fee || undefined,
    agenda: row.agenda || undefined,
    requirements: row.requirements || undefined,
    perks: Array.isArray(row.perks) ? row.perks : undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Map application Event model to database row
 */
export function mapEventToRow(ev: Event) {
  return {
    id: String(ev.id),
    name: ev.name,
    date: ev.date,
    venue: ev.venue,
    capacity: ev.capacity,
    banner_url: ev.bannerUrl || null,
    category: ev.category || 'tech',
    status: ev.status || 'upcoming',
    organizer_email: ev.organizerEmail || null,
    organizer_name: ev.organizerName || null,
    description: ev.description || null,
    eligibility: ev.eligibility || null,
    entry_fee: ev.entryFee || null,
    agenda: ev.agenda || null,
    requirements: ev.requirements || null,
    perks: ev.perks || null,
    created_at: ev.createdAt,
  };
}

/**
 * Map database row to application Registration model
 */
export function mapRowToRegistration(row: any): Registration {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    name: row.name,
    email: (row.email || '').toLowerCase(),
    phone: row.phone || undefined,
    collegeName: row.college_name || undefined,
    branch: row.branch || undefined,
    specialization: row.specialization || undefined,
    code: String(row.code).toUpperCase(),
    checkedIn: Boolean(row.checked_in),
    checkedInAt: row.checked_in_at || null,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Map application Registration model to database row
 */
export function mapRegistrationToRow(reg: Registration) {
  return {
    id: String(reg.id),
    event_id: String(reg.eventId),
    name: reg.name,
    email: reg.email.toLowerCase(),
    phone: reg.phone || null,
    college_name: reg.collegeName || null,
    branch: reg.branch || null,
    specialization: reg.specialization || null,
    code: reg.code.toUpperCase(),
    checked_in: Boolean(reg.checkedIn),
    checked_in_at: reg.checkedInAt || null,
    created_at: reg.createdAt,
  };
}

/**
 * Map database row to application Feedback model
 */
export function mapRowToFeedback(row: any): Feedback {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    studentName: row.student_name,
    studentEmail: row.student_email,
    rating: Number(row.rating) || 5,
    comment: row.comment || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Map application Feedback model to database row
 */
export function mapFeedbackToRow(fb: Feedback) {
  return {
    id: String(fb.id),
    event_id: String(fb.eventId),
    student_name: fb.studentName,
    student_email: fb.studentEmail,
    rating: fb.rating,
    comment: fb.comment,
    created_at: fb.createdAt,
  };
}

// ----------------------------------------------------
// Database Operations
// ----------------------------------------------------

export async function fetchEventsFromSupabase(): Promise<Event[] | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchEvents note:', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToEvent);
  } catch (err) {
    console.warn('[Supabase] fetchEvents failed:', err);
    return null;
  }
}

export async function saveEventToSupabase(event: Event): Promise<boolean> {
  try {
    const row = mapEventToRow(event);
    const { error } = await supabase.from('events').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] saveEvent error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveEvent failed:', err);
    return false;
  }
}

export async function updateEventInSupabase(
  eventId: string,
  updates: Partial<Event>
): Promise<boolean> {
  try {
    const rowUpdates: Record<string, any> = {};
    if (updates.name !== undefined) rowUpdates.name = updates.name;
    if (updates.date !== undefined) rowUpdates.date = updates.date;
    if (updates.venue !== undefined) rowUpdates.venue = updates.venue;
    if (updates.capacity !== undefined) rowUpdates.capacity = updates.capacity;
    if (updates.bannerUrl !== undefined) rowUpdates.banner_url = updates.bannerUrl;
    if (updates.category !== undefined) rowUpdates.category = updates.category;
    if (updates.status !== undefined) rowUpdates.status = updates.status;
    if (updates.organizerEmail !== undefined) rowUpdates.organizer_email = updates.organizerEmail;
    if (updates.organizerName !== undefined) rowUpdates.organizer_name = updates.organizerName;
    if (updates.description !== undefined) rowUpdates.description = updates.description;
    if (updates.eligibility !== undefined) rowUpdates.eligibility = updates.eligibility;
    if (updates.entryFee !== undefined) rowUpdates.entry_fee = updates.entryFee;
    if (updates.agenda !== undefined) rowUpdates.agenda = updates.agenda;
    if (updates.requirements !== undefined) rowUpdates.requirements = updates.requirements;
    if (updates.perks !== undefined) rowUpdates.perks = updates.perks;

    const { error } = await supabase
      .from('events')
      .update(rowUpdates)
      .eq('id', eventId);

    if (error) {
      console.warn('[Supabase] updateEvent error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] updateEvent failed:', err);
    return false;
  }
}

export async function deleteEventFromSupabase(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      console.warn('[Supabase] deleteEvent error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteEvent failed:', err);
    return false;
  }
}

export async function fetchRegistrationsFromSupabase(): Promise<Registration[] | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchRegistrations note:', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToRegistration);
  } catch (err) {
    console.warn('[Supabase] fetchRegistrations failed:', err);
    return null;
  }
}

export async function saveRegistrationToSupabase(
  reg: Registration
): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
  try {
    const row = mapRegistrationToRow(reg);
    const { error } = await supabase.from('registrations').insert(row);
    if (error) {
      // Check for unique constraint violation (duplicate registration or duplicate code)
      if (error.code === '23505') {
        return {
          success: false,
          duplicate: true,
          error: 'This email is already registered for this event in Supabase.',
        };
      }
      console.warn('[Supabase] saveRegistration error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] saveRegistration failed:', err);
    return { success: false, error: err?.message };
  }
}

export async function updateRegistrationCheckInInSupabase(
  code: string,
  checkedIn: boolean,
  checkedInAt: string | null,
  eventId?: string
): Promise<boolean> {
  try {
    const normCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('registrations')
      .update({
        checked_in: checkedIn,
        checked_in_at: checkedInAt,
      })
      .eq('code', normCode)
      .select();

    if (error) {
      console.warn('[Supabase] checkIn update error:', error.message);
      return false;
    }

    // Also record audit log in check_ins table if checked in
    if (checkedIn && checkedInAt && data && data.length > 0) {
      const target = data[0];
      try {
        await supabase.from('check_ins').insert({
          id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          registration_id: target.id,
          registration_code: normCode,
          event_id: eventId || target.event_id,
          checked_in_at: checkedInAt,
          method: 'scanner',
        });
      } catch (logErr) {
        // Non-blocking log insert
      }
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] checkIn update failed:', err);
    return false;
  }
}

export async function cancelRegistrationInSupabase(code: string): Promise<boolean> {
  try {
    const normCode = code.trim().toUpperCase();
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('code', normCode);

    if (error) {
      console.warn('[Supabase] cancelRegistration error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] cancelRegistration failed:', err);
    return false;
  }
}

export async function fetchFeedbackFromSupabase(): Promise<Feedback[] | null> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchFeedback note:', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToFeedback);
  } catch (err) {
    console.warn('[Supabase] fetchFeedback failed:', err);
    return null;
  }
}

export async function saveFeedbackToSupabase(fb: Feedback): Promise<boolean> {
  try {
    const row = mapFeedbackToRow(fb);
    const { error } = await supabase.from('feedback').insert(row);
    if (error) {
      console.warn('[Supabase] saveFeedback error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveFeedback failed:', err);
    return false;
  }
}
