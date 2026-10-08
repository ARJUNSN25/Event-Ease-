/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar, TabType } from './components/Navbar';
import { EventsCatalogView } from './components/EventsCatalogView';
import { OrganizerView } from './components/OrganizerView';
import { OrganizerAuth } from './components/OrganizerAuth';
import { RegisterView } from './components/RegisterView';
import { CheckInView } from './components/CheckInView';
import {
  listEvents,
  getOrganizerSession,
  clearOrganizerSession,
  isAuthorizedOrganizerEmail,
  subscribeToStore,
} from './store';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'register' || tabParam === 'events' || tabParam === 'checkin' || tabParam === 'organizer') {
        return tabParam as TabType;
      }
    } catch {
      // Ignore URL parsing errors
    }
    return 'events';
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

  const [organizerEmail, setOrganizerEmail] = useState<string | null>(() => getOrganizerSession());
  const [registerPrefillEmail, setRegisterPrefillEmail] = useState<string>('');

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
  };

  const handleNavigateToRegisterFromAuth = (emailToPrefill?: string) => {
    if (emailToPrefill) {
      setRegisterPrefillEmail(emailToPrefill);
    }
    setActiveTab('register');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA] text-[#0E1424]">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        organizerEmail={organizerEmail}
        onOrganizerLogout={handleOrganizerLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full">
        {activeTab === 'events' && (
          <EventsCatalogView
            onSelectEventForRegister={handleSelectEventForRegister}
            onNavigateToOrganizer={() => setActiveTab('organizer')}
          />
        )}

        {activeTab === 'register' && (
          <RegisterView
            selectedEventId={selectedEventId}
            onSelectEventId={setSelectedEventId}
            onNavigateToOrganizer={() => setActiveTab('organizer')}
            onNavigateToEvents={() => setActiveTab('events')}
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
