/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

export type EventCategory = 'tech' | 'cultural' | 'sports' | 'academic' | 'arts' | 'general';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  capacity: number;
  createdAt: string;
  bannerUrl?: string;
  category?: EventCategory;
  status?: EventStatus;
  organizerEmail?: string;
  description?: string;
  organizerName?: string;
  eligibility?: string;
  entryFee?: string;
  agenda?: string;
  requirements?: string;
  perks?: string[];
}

export interface Feedback {
  id: string;
  eventId: string;
  studentName: string;
  studentEmail: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string; // stored lowercase
  phone?: string;
  collegeName?: string;
  branch?: string;
  specialization?: string;
  code: string; // unique, e.g. EVT1-ABCXYZ
  checkedIn: boolean;
  checkedInAt: string | null; // ISO string or null
  createdAt: string; // ISO string
}

export interface EventStats {
  registered: number;
  attended: number;
  remaining: number;
  capacity: number;
}

export type CheckInResult =
  | {
      status: 'SUCCESS';
      name: string;
      email?: string;
      checkedInAt: string;
      code: string;
      eventName: string;
    }
  | {
      status: 'DUPLICATE';
      name: string;
      email?: string;
      originalCheckedInAt: string;
      code: string;
      eventName: string;
    }
  | {
      status: 'INVALID';
      code: string;
    };

export interface RegistrationResult {
  code: string;
  qrDataUrl: string;
  name: string;
  eventName: string;
  registration: Registration;
}

const STORAGE_KEYS = {
  EVENTS: 'eventease_events_v1',
  REGISTRATIONS: 'eventease_registrations_v1',
  NEXT_EVENT_NUM: 'eventease_event_num_seq_v1',
  ORGANIZER_EMAIL: 'eventease_organizer_email_v1',
  FEEDBACK: 'eventease_feedback_v1',
};

export const PRESET_BANNERS = [
  {
    id: 'tech',
    label: 'Tech & Hackathon',
    category: 'tech' as EventCategory,
    url: '/src/assets/images/banner_tech_hackathon_1791431600955.jpg',
  },
  {
    id: 'cultural',
    label: 'Cultural & Arts',
    category: 'cultural' as EventCategory,
    url: '/src/assets/images/banner_cultural_arts_1791431623296.jpg',
  },
  {
    id: 'sports',
    label: 'Sports & Athletics',
    category: 'sports' as EventCategory,
    url: '/src/assets/images/banner_sports_meet_1791432284409.jpg',
  },
  {
    id: 'academic',
    label: 'Academic & Talks',
    category: 'academic' as EventCategory,
    url: '/src/assets/images/banner_academic_summit_1791432297209.jpg',
  },
  {
    id: 'brand',
    label: 'Brand Indigo',
    category: 'general' as EventCategory,
    color: '#3345E8',
    url: 'linear-gradient(135deg, #0E1424 0%, #3345E8 100%)',
  },
  {
    id: 'minimal',
    label: 'Midnight Slate',
    category: 'general' as EventCategory,
    color: '#0E1424',
    url: 'linear-gradient(135deg, #0E1424 0%, #1e293b 100%)',
  },
];

export const AUTHORIZED_ORGANIZER_EMAIL = 'arjunsn258@gmail.com';
export const AUTHORIZED_ORGANIZER_PASSWORD = '143211';

/**
 * Checks if the provided email matches the designated organizer email
 */
export function isAuthorizedOrganizerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === AUTHORIZED_ORGANIZER_EMAIL.toLowerCase();
}

/**
 * Verifies email and password for organizer access
 */
export function verifyOrganizerCredentials(email?: string | null, password?: string | null): boolean {
  if (!email || !password) return false;
  const normEmail = email.trim().toLowerCase();
  const normPass = password.trim();
  return (
    normEmail === AUTHORIZED_ORGANIZER_EMAIL.toLowerCase() &&
    normPass === AUTHORIZED_ORGANIZER_PASSWORD
  );
}

export function getOrganizerSession(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZER_EMAIL);
    if (!raw) return null;
    const trimmed = raw.trim().toLowerCase();
    if (isAuthorizedOrganizerEmail(trimmed)) {
      return trimmed;
    }
    // Automatically evict unauthorized or outdated organizer session
    localStorage.removeItem(STORAGE_KEYS.ORGANIZER_EMAIL);
    return null;
  } catch {
    return null;
  }
}

export function setOrganizerSession(email: string, password?: string): void {
  const trimmed = email.trim().toLowerCase();
  if (!isAuthorizedOrganizerEmail(trimmed)) {
    throw new Error(
      `Access denied: '${trimmed}' is not authorized. Organizer portal is strictly restricted to authorized administrator.`
    );
  }
  if (password !== undefined && password.trim() !== AUTHORIZED_ORGANIZER_PASSWORD) {
    throw new Error('Invalid organizer password.');
  }
  try {
    localStorage.setItem(STORAGE_KEYS.ORGANIZER_EMAIL, trimmed);
    notifyStoreChange();
  } catch (e) {
    console.error(e);
  }
}

export function clearOrganizerSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ORGANIZER_EMAIL);
    notifyStoreChange();
  } catch (e) {
    console.error(e);
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DEFAULT_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Tech Innovators Hackathon 2026',
    date: 'Oct 24, 2026 · 09:00 AM',
    venue: 'Main Campus - Auditorium Hall A',
    capacity: 120,
    bannerUrl: PRESET_BANNERS[0].url,
    category: 'tech',
    status: 'ongoing',
    organizerEmail: AUTHORIZED_ORGANIZER_EMAIL,
    organizerName: 'Faculty of Engineering & Technology',
    description: 'A 24-hour university-wide innovation hackathon tackling real-world problems in AI, Web3, and smart campus automation. Mentorship provided by industry engineers.',
    eligibility: 'Open to all Engineering, MCA, BCA, and Applied Science students across colleges.',
    entryFee: 'Free (Sponsored by University Tech Club)',
    agenda: '09:00 AM Opening Ceremony & Problem Statements · 11:00 AM Hacking Commences · 04:00 PM Mid-way Mentorship · Next Day 09:00 AM Final Pitches & Awards',
    requirements: 'Bring your laptop, charger, college student ID card, and enthusiasm to code.',
    perks: ['Free Food & Drinks', 'Official Participation Certificate', 'Cash Prizes ₹50,000+', 'Recruiter Networking'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '2',
    name: 'National Cultural & Arts Fest',
    date: 'Nov 12, 2026 · 05:00 PM',
    venue: 'Open Air Amphitheatre',
    capacity: 250,
    bannerUrl: PRESET_BANNERS[1].url,
    category: 'cultural',
    status: 'upcoming',
    organizerEmail: AUTHORIZED_ORGANIZER_EMAIL,
    organizerName: 'Student Cultural Council',
    description: 'An evening celebration of folk traditions, acoustic bands, dynamic choreography, drama, and contemporary visual arts from 15+ university delegations.',
    eligibility: 'Open to all enrolled undergraduate and postgraduate students from any university/college.',
    entryFee: 'Free Pass (Prior QR Registration Required)',
    agenda: '05:00 PM Red Carpet & Art Gallery · 06:00 PM Band Battles · 08:00 PM Dance Troupe Finals · 10:00 PM DJ Night & Gala',
    requirements: 'Valid college ID card and digital EventEase entry pass QR at the gate.',
    perks: ['Snacks & Refreshment Counters', 'Stage Performance Slot', 'Best Delegation Trophy'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'Inter-College Athletics Championship',
    date: 'Dec 05, 2026 · 08:30 AM',
    venue: 'University Sports Complex',
    capacity: 80,
    bannerUrl: PRESET_BANNERS[2].url,
    category: 'sports',
    status: 'upcoming',
    organizerEmail: AUTHORIZED_ORGANIZER_EMAIL,
    organizerName: 'Department of Physical Education',
    description: 'Track and field meet featuring 100m/400m sprint heats, long jump, shot put, 4x100m relay, and inter-university badminton tournament.',
    eligibility: 'Enrolled collegiate athletes and sports enthusiasts.',
    entryFee: 'Free (Kit & Energy drinks provided)',
    agenda: '08:30 AM Athletes Reporting & Bib Distribution · 09:30 AM Track Heats · 02:00 PM Finals & Medal Ceremony',
    requirements: 'Sports footwear and athletic kit mandatory.',
    perks: ['Gold/Silver/Bronze Medals', 'Energy Drink Kits', 'Sports Certificate'],
    createdAt: new Date().toISOString(),
  },
];

// Safe localStorage readers/writers
function loadEvents(): Event[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      // Seed default events on initial setup
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }
    // Enrich any existing events that might be missing description, eligibility, or agenda
    let hasUpdates = false;
    const enriched = parsed.map((ev: Event) => {
      const match = DEFAULT_EVENTS.find((d) => d.id === ev.id);
      if (match && (!ev.description || !ev.agenda || !ev.eligibility)) {
        hasUpdates = true;
        return {
          ...match,
          ...ev,
          description: ev.description || match.description,
          organizerName: ev.organizerName || match.organizerName,
          eligibility: ev.eligibility || match.eligibility,
          entryFee: ev.entryFee || match.entryFee,
          agenda: ev.agenda || match.agenda,
          requirements: ev.requirements || match.requirements,
          perks: ev.perks || match.perks,
        };
      }
      return ev;
    });

    if (hasUpdates) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(enriched));
    }
    return enriched;
  } catch {
    return DEFAULT_EVENTS;
  }
}

function saveEvents(events: Event[]): void {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  notifyStoreChange();
}

const DEFAULT_REGISTRATIONS: Registration[] = [
  {
    id: 'reg_seed_1',
    eventId: '1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@marwadiuniversity.ac.in',
    phone: '+91 98765 43210',
    collegeName: 'Marwadi University',
    branch: 'Computer Science & Engineering (CSE)',
    specialization: 'Artificial Intelligence & Machine Learning',
    code: 'EVT1-TK9A2B',
    checkedIn: true,
    checkedInAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'reg_seed_2',
    eventId: '1',
    name: 'Priya Patel',
    email: 'priya.patel@marwadiuniversity.ac.in',
    phone: '+91 98234 56789',
    collegeName: 'Marwadi University',
    branch: 'Information Technology (IT)',
    specialization: 'Cyber Security & Forensics',
    code: 'EVT1-MP7K4C',
    checkedIn: true,
    checkedInAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'reg_seed_3',
    eventId: '1',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@gtu.ac.in',
    phone: '+91 97112 33445',
    collegeName: 'Gujarat Technological University',
    branch: 'Artificial Intelligence & Data Science (AI & DS)',
    specialization: 'Data Science & Analytics',
    code: 'EVT1-X8Y4N2',
    checkedIn: false,
    checkedInAt: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'reg_seed_4',
    eventId: '1',
    name: 'Ananya Desai',
    email: 'ananya.desai@marwadiuniversity.ac.in',
    phone: '+91 99001 22334',
    collegeName: 'Marwadi University',
    branch: 'Computer Science & Engineering (CSE)',
    specialization: 'Cloud Computing & DevOps',
    code: 'EVT1-C3F9L7',
    checkedIn: true,
    checkedInAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'reg_seed_5',
    eventId: '1',
    name: 'Devendra Varma',
    email: 'devendra.v@nirmauni.ac.in',
    phone: '+91 98450 11223',
    collegeName: 'Nirma University',
    branch: 'Electronics & Communication (ECE)',
    specialization: 'Robotics & IoT',
    code: 'EVT1-H5Q2W8',
    checkedIn: false,
    checkedInAt: null,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

function loadRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
      return DEFAULT_REGISTRATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
      return DEFAULT_REGISTRATIONS;
    }
    return parsed;
  } catch {
    return DEFAULT_REGISTRATIONS;
  }
}

function saveRegistrations(regs: Registration[]): void {
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
  notifyStoreChange();
}

function getNextEventSequence(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NEXT_EVENT_NUM);
    const num = raw ? parseInt(raw, 10) : 1;
    const next = isNaN(num) || num < 1 ? 1 : num;
    localStorage.setItem(STORAGE_KEYS.NEXT_EVENT_NUM, (next + 1).toString());
    return next;
  } catch {
    return Math.floor(Date.now() % 10000);
  }
}

// Custom store change event for reactive UI updates across components
type StoreListener = () => void;
const listeners = new Set<StoreListener>();

export function subscribeToStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyStoreChange(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Store listener error', e);
    }
  });
}

/**
 * Generate cryptographically random 6-character code from specified alphabet:
 * ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no 0/O/1/I)
 */
function generateRandomSuffix(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return result;
}

/**
 * Generate a unique code formatted EVT<eventId>-<6 chars>
 */
function generateUniqueCode(eventId: string, existingRegistrations: Registration[]): string {
  const existingCodes = new Set(existingRegistrations.map((r) => r.code.toUpperCase()));
  let attempts = 0;
  while (attempts < 1000) {
    const suffix = generateRandomSuffix();
    const code = `EVT${eventId}-${suffix}`;
    if (!existingCodes.has(code)) {
      return code;
    }
    attempts++;
  }
  // Fallback with timestamp salt if collision
  return `EVT${eventId}-${generateRandomSuffix()}`;
}

/**
 * Business Rule 1: createEvent
 * - name required
 * - capacity must be a whole number >= 1
 */
export function createEvent(input: {
  name: string;
  date: string;
  venue: string;
  capacity: number;
  bannerUrl?: string;
  category?: EventCategory;
  organizerEmail?: string;
  organizerName?: string;
  description?: string;
  eligibility?: string;
  entryFee?: string;
  agenda?: string;
  requirements?: string;
  perks?: string[];
}): Event {
  const name = (input.name || '').trim();
  if (!name) {
    throw new Error('Event name is required.');
  }

  const capacity = Number(input.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error('Capacity must be a whole number of at least 1.');
  }

  const date = (input.date || '').trim() || 'Date TBA';
  const venue = (input.venue || '').trim() || 'Main Campus';
  const bannerUrl = (input.bannerUrl || '').trim() || PRESET_BANNERS[0].url;
  const category = input.category || 'tech';
  const organizerEmail = (input.organizerEmail || '').trim().toLowerCase() || undefined;

  const events = loadEvents();
  const seq = getNextEventSequence();
  const id = seq.toString();

  const newEvent: Event = {
    id,
    name,
    date,
    venue,
    capacity,
    bannerUrl,
    category,
    organizerEmail,
    organizerName: input.organizerName?.trim() || undefined,
    description: input.description?.trim() || undefined,
    eligibility: input.eligibility?.trim() || undefined,
    entryFee: input.entryFee?.trim() || undefined,
    agenda: input.agenda?.trim() || undefined,
    requirements: input.requirements?.trim() || undefined,
    perks: input.perks && input.perks.length > 0 ? input.perks : undefined,
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  saveEvents(events);
  return newEvent;
}

/**
 * List all events
 */
export function listEvents(): Event[] {
  return loadEvents();
}

/**
 * Get an event by id
 */
export function getEventById(eventId: string): Event | null {
  const events = loadEvents();
  return events.find((e) => e.id === eventId) || null;
}

/**
 * Business Rule 4: Stats per event
 * - registered
 * - attended
 * - remaining (capacity minus registered, never negative)
 */
export function getStats(eventId: string): EventStats {
  const event = getEventById(eventId);
  if (!event) {
    return { registered: 0, attended: 0, remaining: 0, capacity: 0 };
  }

  const registrations = loadRegistrations().filter((r) => r.eventId === eventId);
  const registered = registrations.length;
  const attended = registrations.filter((r) => r.checkedIn).length;
  const remaining = Math.max(0, event.capacity - registered);

  return {
    registered,
    attended,
    remaining,
    capacity: event.capacity,
  };
}

/**
 * Business Rule 2: register
 * Checked in this exact order:
 * a) event exists
 * b) registered count < capacity, else error "This event is full."
 * c) email not already registered for this event (compare lowercase), else error "This email is already registered for this event."
 * d) valid name and a valid email format
 * Then generate code and save. Return { code, qrDataUrl, name, eventName, registration }.
 */
export async function register(input: {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  collegeName?: string;
  branch?: string;
  specialization?: string;
}): Promise<RegistrationResult> {
  // Step a: Event exists
  const event = getEventById(input.eventId);
  if (!event) {
    throw new Error('Event not found.');
  }

  const allRegistrations = loadRegistrations();
  const eventRegistrations = allRegistrations.filter((r) => r.eventId === input.eventId);

  // Step b: registered count < capacity
  if (eventRegistrations.length >= event.capacity) {
    throw new Error('This event is full.');
  }

  // Step c: email not already registered for this event (compare lowercase)
  const normalizedEmail = (input.email || '').trim().toLowerCase();
  const emailAlreadyRegistered = eventRegistrations.some(
    (r) => r.email.toLowerCase() === normalizedEmail
  );
  if (emailAlreadyRegistered) {
    throw new Error('This email is already registered for this event.');
  }

  // Step d: valid name and a valid email format
  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  // Generate unique code & QR code
  const code = generateUniqueCode(event.id, allRegistrations);
  const qrDataUrl = await QRCode.toDataURL(code, {
    width: 320,
    margin: 1,
    color: {
      dark: '#0E1424',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  const registration: Registration = {
    id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId: event.id,
    name: trimmedName,
    email: normalizedEmail,
    phone: input.phone?.trim() || undefined,
    collegeName: input.collegeName?.trim() || 'College/University',
    branch: input.branch?.trim() || 'General Engineering',
    specialization: input.specialization?.trim() || 'General',
    code,
    checkedIn: false,
    checkedInAt: null,
    createdAt: new Date().toISOString(),
  };

  allRegistrations.push(registration);
  saveRegistrations(allRegistrations);

  return {
    code,
    qrDataUrl,
    name: trimmedName,
    eventName: event.name,
    registration,
  };
}

/**
 * Business Rule 3: checkIn(code)
 * - Trim and uppercase the code
 * Return one of:
 * - INVALID if the code does not exist
 * - DUPLICATE if it exists and checkedIn is already true; include participant name and ORIGINAL check-in time
 * - SUCCESS if it exists and is not checked in; set checkedIn=true and checkedInAt=now; include the name
 * A second check-in with the same code must never change the stored time or the attended count.
 */
export function checkIn(rawCode: string): CheckInResult {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { status: 'INVALID', code };
  }

  const allRegistrations = loadRegistrations();
  const targetIndex = allRegistrations.findIndex((r) => r.code.toUpperCase() === code);

  if (targetIndex === -1) {
    return { status: 'INVALID', code };
  }

  const targetReg = allRegistrations[targetIndex];
  const event = getEventById(targetReg.eventId);
  const eventName = event ? event.name : 'Event';

  // Check if DUPLICATE
  if (targetReg.checkedIn) {
    return {
      status: 'DUPLICATE',
      name: targetReg.name,
      email: targetReg.email,
      originalCheckedInAt: targetReg.checkedInAt || targetReg.createdAt,
      code: targetReg.code,
      eventName,
    };
  }

  // Mark as SUCCESS
  const nowIso = new Date().toISOString();
  allRegistrations[targetIndex] = {
    ...targetReg,
    checkedIn: true,
    checkedInAt: nowIso,
  };

  saveRegistrations(allRegistrations);

  return {
    status: 'SUCCESS',
    name: targetReg.name,
    email: targetReg.email,
    checkedInAt: nowIso,
    code: targetReg.code,
    eventName,
  };
}

/**
 * Undo check-in for an attendee
 */
export function undoCheckIn(rawCode: string): boolean {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return false;

  const allRegistrations = loadRegistrations();
  const targetIndex = allRegistrations.findIndex((r) => r.code.toUpperCase() === code);
  if (targetIndex === -1) return false;

  allRegistrations[targetIndex] = {
    ...allRegistrations[targetIndex],
    checkedIn: false,
    checkedInAt: null,
  };

  saveRegistrations(allRegistrations);
  return true;
}

/**
 * List participants for an event with search & status filters
 */
export function listParticipants(
  eventId: string,
  options?: {
    search?: string;
    status?: 'all' | 'checkedIn' | 'pending';
  }
): Registration[] {
  const allRegistrations = loadRegistrations();
  let list = allRegistrations.filter((r) => r.eventId === eventId);

  if (options?.status === 'checkedIn') {
    list = list.filter((r) => r.checkedIn);
  } else if (options?.status === 'pending') {
    list = list.filter((r) => !r.checkedIn);
  }

  if (options?.search) {
    const q = options.search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.collegeName && r.collegeName.toLowerCase().includes(q)) ||
        (r.branch && r.branch.toLowerCase().includes(q)) ||
        (r.specialization && r.specialization.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q))
    );
  }

  // Sort descending by registration date
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Export participants as a CSV file download
 */
export function exportCsv(eventId: string): void {
  const event = getEventById(eventId);
  if (!event) return;

  const participants = listParticipants(eventId);

  const headers = [
    'Name',
    'Email',
    'Phone',
    'College Name',
    'Branch',
    'Specialization',
    'Ticket Code',
    'Checked in',
    'Checked in at',
    'Registration Date',
  ];
  const rows = participants.map((p) => {
    const checkedInStr = p.checkedIn ? 'Yes' : 'No';
    const checkedInAtStr = p.checkedInAt ? new Date(p.checkedInAt).toLocaleString() : '';
    const registeredAtStr = p.createdAt ? new Date(p.createdAt).toLocaleString() : '';
    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.email.replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${(p.collegeName || '').replace(/"/g, '""')}"`,
      `"${(p.branch || '').replace(/"/g, '""')}"`,
      `"${(p.specialization || '').replace(/"/g, '""')}"`,
      `"${p.code.replace(/"/g, '""')}"`,
      `"${checkedInStr}"`,
      `"${checkedInAtStr}"`,
      `"${registeredAtStr}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeEventName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.setAttribute('download', `${safeEventName}-participants.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate QR code for existing registration if needed
 */
export async function generateQrForCode(code: string): Promise<string> {
  return QRCode.toDataURL(code, {
    width: 320,
    margin: 1,
    color: {
      dark: '#0E1424',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

// Student Feedback storage and helpers
function loadFeedback(): Feedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFeedback(items: Feedback[]): void {
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(items));
  notifyStoreChange();
}

export function addFeedback(input: {
  eventId: string;
  studentName: string;
  studentEmail: string;
  rating: number;
  comment: string;
}): Feedback {
  const event = getEventById(input.eventId);
  if (!event) {
    throw new Error('Event not found.');
  }

  const trimmedComment = (input.comment || '').trim();
  if (!trimmedComment) {
    throw new Error('Please enter your feedback comment.');
  }

  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));
  const studentName = (input.studentName || '').trim() || 'Student Attendee';
  const studentEmail = (input.studentEmail || '').trim().toLowerCase();

  const all = loadFeedback();
  const newFeedback: Feedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId: input.eventId,
    studentName,
    studentEmail,
    rating,
    comment: trimmedComment,
    createdAt: new Date().toISOString(),
  };

  all.push(newFeedback);
  saveFeedback(all);
  return newFeedback;
}

export function listFeedback(eventId: string): Feedback[] {
  const all = loadFeedback();
  return all
    .filter((f) => f.eventId === eventId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getEventFeedbackSummary(eventId: string): {
  averageRating: number;
  count: number;
} {
  const items = listFeedback(eventId);
  if (items.length === 0) return { averageRating: 0, count: 0 };
  const sum = items.reduce((acc, curr) => acc + curr.rating, 0);
  return {
    averageRating: Math.round((sum / items.length) * 10) / 10,
    count: items.length,
  };
}

/**
 * Delete event and cascade remove its registrations and feedback
 */
export function deleteEvent(eventId: string): void {
  const events = loadEvents().filter((e) => e.id !== eventId);
  saveEvents(events);

  const regs = loadRegistrations().filter((r) => r.eventId !== eventId);
  saveRegistrations(regs);

  const fb = loadFeedback().filter((f) => f.eventId !== eventId);
  saveFeedback(fb);
}

/**
 * Export student feedback reviews as a CSV file download
 */
export function exportFeedbackCsv(eventId: string): void {
  const event = getEventById(eventId);
  if (!event) return;

  const feedbacks = listFeedback(eventId);
  const headers = ['Student Name', 'Student Email', 'Rating', 'Comment', 'Submitted At'];
  const rows = feedbacks.map((f) => [
    `"${f.studentName.replace(/"/g, '""')}"`,
    `"${f.studentEmail.replace(/"/g, '""')}"`,
    `"${f.rating}"`,
    `"${f.comment.replace(/"/g, '""')}"`,
    `"${new Date(f.createdAt).toLocaleString()}"`,
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeEventName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.setAttribute('download', `${safeEventName}-student-feedback.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Update event session status (upcoming | ongoing | completed)
 */
export function updateEventStatus(eventId: string, status: EventStatus): void {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx !== -1) {
    events[idx] = {
      ...events[idx],
      status,
    };
    saveEvents(events);
  }
}

/**
 * Update an existing event's details (name, date, venue, capacity, category, bannerUrl)
 */
export function updateEvent(
  eventId: string,
  updates: Partial<Omit<Event, 'id' | 'createdAt'>>
): Event {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx === -1) {
    throw new Error('Event not found.');
  }

  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Event title cannot be empty.');
  }

  if (updates.capacity !== undefined) {
    const capNum = Number(updates.capacity);
    if (!Number.isInteger(capNum) || capNum < 1) {
      throw new Error('Capacity must be a positive integer.');
    }
    updates.capacity = capNum;
  }

  events[idx] = {
    ...events[idx],
    ...updates,
  };
  saveEvents(events);
  return events[idx];
}
