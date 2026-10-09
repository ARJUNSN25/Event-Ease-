/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar, TabType } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { EventsCatalogView } from './components/EventsCatalogView';
import { ParticipantDashboardView } from './components/ParticipantDashboardView';
import { OrganizerView } from './components/OrganizerView';
import { OrganizerAuth } from './components/OrganizerAuth';
import { RegisterView } from './components/RegisterView';
import { CheckInView } from './components/CheckInView';
import { AboutModal } from './components/AboutModal';
import { AuthModal } from './components/AuthModal';
import {
  listEvents,
  getOrganizerSession,
  clearOrganizerSession,
  isAuthorizedOrganizerEmail,
  subscribeToStore,
  initSupabaseSync,
  EventCategory,
} from './store';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'home' ||
        tabParam === 'events' ||
        tabParam === 'registrations' ||
        tabParam === 'register' ||
        tabParam === 'checkin' ||
        tabParam === 'organizer'
      ) {
        return tabParam as TabType;
      }
    } catch {
      // Ignore URL parsing errors
    }
    return 'home';
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const evParam = params.get('eventId');
      if (evParam) return evParam;
    } catch {
      // Ignore
    }
    return null;
  });

  const [catalogInitialCategory, setCatalogInitialCategory] = useState<EventCategory | 'all'>('all');
  const [organizerEmail, setOrganizerEmail] = useState<string | null>(() => getOrganizerSession());
  const [registerPrefillEmail, setRegisterPrefillEmail] = useState<string>('');

  // Modals
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'student' | 'organizer' }>({
    isOpen: false,
    mode: 'student',
  });

  // Keep URL query param synced with tab without full reloads
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      if (selectedEventId && activeTab === 'register') {
        url.searchParams.set('eventId', selectedEventId);
      } else {
        url.searchParams.delete('eventId');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore
    }
  }, [activeTab, selectedEventId]);

  // Initialize live Supabase sync and subscriptions on initial mount
  useEffect(() => {
    initSupabaseSync();
  }, []);

  // Initialize selected event on initial mount
  useEffect(() => {
    const events = listEvents();
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [selectedEventId]);

  // Keep organizer session in sync with store and enforce authorized email
  useEffect(() => {
    const current = getOrganizerSession();
    if (current && !isAuthorizedOrganizerEmail(current)) {
      clearOrganizerSession();
      setOrganizerEmail(null);
    }

    const unsubscribe = subscribeToStore(() => {
      const updated = getOrganizerSession();
      if (updated && !isAuthorizedOrganizerEmail(updated)) {
        clearOrganizerSession();
        setOrganizerEmail(null);
      } else {
        setOrganizerEmail(updated);
      }
    });
    return unsubscribe;
  }, []);

  const handleOrganizerLogout = () => {
    clearOrganizerSession();
    setOrganizerEmail(null);
  };

  const handleSelectEventForRegister = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToRegisterFromAuth = (emailToPrefill?: string) => {
    if (emailToPrefill) {
      setRegisterPrefillEmail(emailToPrefill);
    }
    setActiveTab('register');
  };

  const handleOpenExploreWithCategory = (category: EventCategory | 'all' = 'all') => {
    setCatalogInitialCategory(category);
    setActiveTab('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#4F46E5]/10 selection:text-[#4F46E5]">
      {/* Modern Light Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        organizerEmail={organizerEmail}
        onOrganizerLogout={handleOrganizerLogout}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenAuth={(mode = 'student') => setAuthModalState({ isOpen: true, mode })}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <HomeView
            onNavigateToEvents={handleOpenExploreWithCategory}
            onNavigateToRegistrations={() => {
              setActiveTab('registrations');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToOrganizer={() => {
              setActiveTab('organizer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToCheckIn={() => {
              setActiveTab('checkin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectEventForRegister={handleSelectEventForRegister}
            onOpenAbout={() => setIsAboutModalOpen(true)}
          />
        )}

        {activeTab === 'events' && (
          <EventsCatalogView
            onSelectEventForRegister={handleSelectEventForRegister}
            onNavigateToOrganizer={() => {
              setActiveTab('organizer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialCategory={catalogInitialCategory}
          />
        )}

        {activeTab === 'registrations' && (
          <ParticipantDashboardView
            onNavigateToEvents={() => {
              setActiveTab('events');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectEventForRegister={handleSelectEventForRegister}
          />
        )}

        {activeTab === 'register' && (
          <RegisterView
            selectedEventId={selectedEventId}
            onSelectEventId={setSelectedEventId}
            onNavigateToOrganizer={() => setActiveTab('organizer')}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToRegistrations={() => {
              setActiveTab('registrations');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialEmail={registerPrefillEmail}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckInView
            selectedEventId={selectedEventId}
            onSelectEventId={setSelectedEventId}
            onNavigateToOrganizer={() => setActiveTab('organizer')}
          />
        )}

        {activeTab === 'organizer' && (
          <>
            {!organizerEmail ? (
              <OrganizerAuth
                onLoginSuccess={(email) => setOrganizerEmail(email)}
                onNavigateToRegister={handleNavigateToRegisterFromAuth}
              />
            ) : (
              <OrganizerView
                selectedEventId={selectedEventId}
                onSelectEventId={setSelectedEventId}
                onNavigateToRegister={() => setActiveTab('register')}
                onNavigateToCheckIn={() => setActiveTab('checkin')}
                organizerEmail={organizerEmail}
              />
            )}
          </>
        )}
      </main>

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onExploreEvents={() => {
          setActiveTab('events');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrganizer={() => {
          setActiveTab('organizer');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Auth / Sign In Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'student' })}
        onParticipantSuccess={(email) => {
          setActiveTab('registrations');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOrganizerSuccess={(email) => {
          setOrganizerEmail(email);
          setActiveTab('organizer');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
