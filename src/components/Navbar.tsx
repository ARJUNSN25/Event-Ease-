/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  Compass,
  Ticket,
  ScanLine,
  LayoutDashboard,
  LogOut,
  Info,
  User,
  LogIn,
  Menu,
  X,
  Sparkles,
  QrCode,
  Home,
} from 'lucide-react';
import { AttendeeProfile, getAttendeeProfile } from '../store';

export type TabType = 'home' | 'events' | 'register' | 'registrations' | 'checkin' | 'organizer';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  organizerEmail?: string | null;
  onOrganizerLogout?: () => void;
  onOpenAbout: () => void;
  onOpenAuth: (mode?: 'student' | 'organizer') => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  organizerEmail,
  onOrganizerLogout,
  onOpenAbout,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = getAttendeeProfile();

  const navLinks = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'events' as TabType, label: 'Explore Events', icon: Compass },
    { id: 'registrations' as TabType, label: 'My Registrations', icon: Ticket },
  ];

  const handleMobileNav = (tab: TabType) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Header - Modern Light UI Header with #F8FAFC and #4F46E5 theme */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-2xs">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Modern EventEase Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => onTabChange('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Logo className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  EventEase
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hidden sm:inline">
                  College
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 tracking-wide mt-0.5 hidden sm:block">
                Registration & Check-In Platform
              </span>
            </div>
          </div>

          {/* Zone 2: Desktop Navigation Links (Home, Explore Events, My Registrations, About) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/90 rounded-full border border-slate-200">
            {navLinks.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-150 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenAbout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>About</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Auth (Scanner desk, Login & Sign Up, Organizer status) */}
          <div className="flex items-center gap-2">
            {/* Quick Scanner Shortcut for Staff */}
            <button
              type="button"
              onClick={() => onTabChange('checkin')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'checkin'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Open gate camera QR code scanner"
            >
              <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scanner Desk</span>
            </button>

            {organizerEmail ? (
              /* Organizer Logged In status */
              <div className="flex items-center gap-1.5 sm:gap-2 bg-indigo-50/80 py-1 px-2.5 sm:px-3 rounded-xl border border-indigo-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span
                  className="max-w-[100px] sm:max-w-[140px] truncate text-indigo-950 font-bold"
                  title={organizerEmail}
                  onClick={() => onTabChange('organizer')}
                >
                  {organizerEmail}
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded hidden sm:inline">
                  Admin
                </span>
                {onOrganizerLogout && (
                  <button
                    type="button"
                    onClick={onOrganizerLogout}
                    title="Sign out of organizer workspace"
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors ml-0.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              /* Participant / Login Actions */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('student')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{profile?.name ? profile.name.split(' ')[0] : 'Sign In'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('organizer')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Organizer</span>
                  <span className="sm:hidden">Portal</span>
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => handleMobileNav('home')}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'home' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4 text-indigo-600" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNav('events')}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'events' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Explore Events</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNav('registrations')}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'registrations' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Ticket className="w-4 h-4 text-indigo-600" />
                <span>My Passes</span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNav('checkin')}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'checkin' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ScanLine className="w-4 h-4 text-indigo-600" />
                <span>Scanner Desk</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAbout();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                <Info className="w-4 h-4 text-indigo-600" />
                <span>About EventEase</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('student');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600"
              >
                <User className="w-4 h-4" />
                <span>{profile?.name ? profile.name : 'Sign In / Profile'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Nav Bar (< 768px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-pb"
      >
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('events')}
          className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            activeTab === 'events' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'events' ? 'font-bold' : 'font-medium'}`}>
            Explore
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('registrations')}
          className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            activeTab === 'registrations' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'registrations' ? 'font-bold' : 'font-medium'}`}>
            My Passes
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('organizer')}
          className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            activeTab === 'organizer' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'organizer' ? 'font-bold' : 'font-medium'}`}>
            Organizer
          </span>
        </button>
      </nav>
    </>
  );
}
