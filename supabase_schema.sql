-- ==============================================================================
-- EventEase Supabase Database & Storage Setup Schema
-- Project: EventEase (College Event Registration & Check-In Platform)
-- Instructions: Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create 'events' table
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  venue TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  banner_url TEXT,
  category TEXT DEFAULT 'tech',
  status TEXT DEFAULT 'upcoming',
  organizer_email TEXT,
  organizer_name TEXT,
  description TEXT,
  eligibility TEXT,
  entry_fee TEXT,
  agenda TEXT,
  requirements TEXT,
  perks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'registrations' table
CREATE TABLE IF NOT EXISTS public.registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college_name TEXT,
  branch TEXT,
  specialization TEXT,
  code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicate registrations for the same event and email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_event_email 
  ON public.registrations(event_id, lower(email));

-- Index for instant ticket pass lookups by code
CREATE INDEX IF NOT EXISTS idx_registrations_code 
  ON public.registrations(upper(code));

-- 3. Create 'check_ins' audit log table for QR check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id TEXT PRIMARY KEY,
  registration_id TEXT REFERENCES public.registrations(id) ON DELETE CASCADE,
  registration_code TEXT NOT NULL,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  method TEXT DEFAULT 'scanner'
);

-- 4. Create 'feedback' table for attendee reviews
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Events Policies (Anyone can read; authenticated or anon key can manage)
DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events" ON public.events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert events" ON public.events;
CREATE POLICY "Public can insert events" ON public.events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update events" ON public.events;
CREATE POLICY "Public can update events" ON public.events
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete events" ON public.events;
CREATE POLICY "Public can delete events" ON public.events
  FOR DELETE USING (true);

-- Registrations Policies
DROP POLICY IF EXISTS "Public can view registrations" ON public.registrations;
CREATE POLICY "Public can view registrations" ON public.registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert registrations" ON public.registrations;
CREATE POLICY "Public can insert registrations" ON public.registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update check-in status" ON public.registrations;
CREATE POLICY "Public can update check-in status" ON public.registrations
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete registrations" ON public.registrations;
CREATE POLICY "Public can delete registrations" ON public.registrations
  FOR DELETE USING (true);

-- Check-ins Policies
DROP POLICY IF EXISTS "Public can view check_ins" ON public.check_ins;
CREATE POLICY "Public can view check_ins" ON public.check_ins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert check_ins" ON public.check_ins;
CREATE POLICY "Public can insert check_ins" ON public.check_ins
  FOR INSERT WITH CHECK (true);

-- Feedback Policies
DROP POLICY IF EXISTS "Public can view feedback" ON public.feedback;
CREATE POLICY "Public can view feedback" ON public.feedback
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert feedback" ON public.feedback;
CREATE POLICY "Public can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 6. Supabase Storage for Event Banners ('event-banners' bucket)
-- ==============================================================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'event-banners' bucket
DROP POLICY IF EXISTS "Public Access to event-banners" ON storage.objects;
CREATE POLICY "Public Access to event-banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-banners');

DROP POLICY IF EXISTS "Public Upload to event-banners" ON storage.objects;
CREATE POLICY "Public Upload to event-banners" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-banners');

DROP POLICY IF EXISTS "Public Update event-banners" ON storage.objects;
CREATE POLICY "Public Update event-banners" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-banners');

-- ==============================================================================
-- 7. Seed Initial College Events (if events table is empty)
-- ==============================================================================

INSERT INTO public.events (id, name, date, venue, capacity, banner_url, category, status, organizer_email, organizer_name, description, eligibility, entry_fee, agenda, requirements, perks, created_at)
SELECT 
  '1',
  'Tech Innovators Hackathon 2026',
  'Oct 24, 2026 · 09:00 AM',
  'Main Campus - Auditorium Hall A',
  120,
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  'tech',
  'ongoing',
  'arjunsn258@gmail.com',
  'Faculty of Engineering & Technology',
  'A 24-hour university-wide innovation hackathon tackling real-world problems in AI, Web3, and smart campus automation. Mentorship provided by industry engineers.',
  'Open to all Engineering, MCA, BCA, and Applied Science students across colleges.',
  'Free (Sponsored by University Tech Club)',
  '09:00 AM Opening Ceremony & Problem Statements · 11:00 AM Hacking Commences · 04:00 PM Mid-way Mentorship · Next Day 09:00 AM Final Pitches & Awards',
  'Bring your laptop, charger, college student ID card, and enthusiasm to code.',
  '["Free Food & Drinks", "Official Participation Certificate", "Cash Prizes ₹50,000+", "Recruiter Networking"]'::jsonb,
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE id = '1');

INSERT INTO public.events (id, name, date, venue, capacity, banner_url, category, status, organizer_email, organizer_name, description, eligibility, entry_fee, agenda, requirements, perks, created_at)
SELECT 
  '2',
  'National Cultural & Arts Fest',
  'Nov 12, 2026 · 05:00 PM',
  'Open Air Amphitheatre',
  250,
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  'cultural',
  'upcoming',
  'arjunsn258@gmail.com',
  'Student Cultural Council',
  'An evening celebration of folk traditions, acoustic bands, dynamic choreography, drama, and contemporary visual arts from 15+ university delegations.',
  'Open to all enrolled undergraduate and postgraduate students from any university/college.',
  'Free Pass (Prior QR Registration Required)',
  '05:00 PM Red Carpet & Art Gallery · 06:00 PM Band Battles · 08:00 PM Dance Troupe Finals · 10:00 PM DJ Night & Gala',
  'Valid college ID card and digital EventEase entry pass QR at the gate.',
  '["Snacks & Refreshment Counters", "Stage Performance Slot", "Best Delegation Trophy"]'::jsonb,
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE id = '2');

INSERT INTO public.events (id, name, date, venue, capacity, banner_url, category, status, organizer_email, organizer_name, description, eligibility, entry_fee, agenda, requirements, perks, created_at)
SELECT 
  '3',
  'Inter-College Athletics Championship',
  'Dec 05, 2026 · 08:30 AM',
  'University Sports Complex',
  80,
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
  'sports',
  'upcoming',
  'arjunsn258@gmail.com',
  'Department of Physical Education',
  'Track and field meet featuring 100m/400m sprint heats, long jump, shot put, 4x100m relay, and inter-university badminton tournament.',
  'Enrolled collegiate athletes and sports enthusiasts.',
  'Free (Kit & Energy drinks provided)',
  '08:30 AM Athletes Reporting & Bib Distribution · 09:30 AM Track Heats · 02:00 PM Finals & Medal Ceremony',
  'Sports footwear and athletic kit mandatory.',
  '["Gold/Silver/Bronze Medals", "Energy Drink Kits", "Sports Certificate"]'::jsonb,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE id = '3');
