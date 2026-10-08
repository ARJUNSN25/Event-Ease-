/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Ticket, ScanLine, LogOut, Compass } from 'lucide-react';

export type TabType = 'events' | 'register' | 'checkin' | 'organizer';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  organizerEmail?: string | null;
  onOrganizerLogout?: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  organizerEmail,
  onOrganizerLogout,
}: NavbarProps) {
  const tabs = [
    { id: 'events' as TabType, label: 'Explore Events', icon: Compass },
    { id: 'register' as TabType, label: 'Register', icon: Ticket },
    { id: 'checkin' as TabType, label: 'Scanner & Desk', icon: ScanLine },
    { id: 'organizer' as TabType, label: 'Organizer', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Top Header - Dark Ink bar */}
      <header className="bg-[#0E1424] text-white sticky top-0 z-40 border-b border-[#0E1424]/80">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#3345E8] flex items-center justify-center font-bold text-white text-base tracking-tight shadow-sm">
              E
            </div>
            <span className="font-bold text-xl tracking-tight text-white select-none">
              EventEase
            </span>
          </div>

          {/* Zone 2: Desktop Tabs (>= 720px) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/10 rounded-full border border-white/10">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    isActive
                      ? 'bg-white text-[#0E1424] shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Organizer Session Status / Quick Indicator */}
          <div className="flex items-center gap-2">
            {organizerEmail ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 py-1 px-2 sm:px-2.5 rounded-full border border-white/10 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="max-w-[110px] sm:max-w-[160px] truncate text-white/90 font-medium" title={organizerEmail}>
                  {organizerEmail}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded hidden sm:inline">
                  Admin
                </span>
                {onOrganizerLogout && (
                  <button
                    type="button"
                    onClick={onOrganizerLogout}
                    title="Sign out of organizer workspace"
                    className="text-white/70 hover:text-white p-1 rounded transition-colors ml-0.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-white/50 hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80" />
                <span>Live Gate System</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Fixed Tab Bar (< 720px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1424] border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[72px] min-h-[44px] rounded-[8px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isActive ? 'text-white' : 'text-white/60 hover:text-white/90'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  isActive ? 'bg-[#3345E8] text-white' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-white font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
