/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Smartphone,
  Edit2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

interface DateTimePickerProps {
  value: string;
  onChange: (formattedValue: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const FULL_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Quick time presets for college events
const QUICK_TIMES = [
  { label: '9:00 AM', hour: '09', minute: '00', period: 'AM' },
  { label: '10:00 AM', hour: '10', minute: '00', period: 'AM' },
  { label: '11:30 AM', hour: '11', minute: '30', period: 'AM' },
  { label: '2:00 PM', hour: '02', minute: '00', period: 'PM' },
  { label: '3:30 PM', hour: '03', minute: '30', period: 'PM' },
  { label: '5:00 PM', hour: '05', minute: '00', period: 'PM' },
];

export function DateTimePicker({
  value,
  onChange,
  label = 'Date & Time',
  required = false,
  placeholder = 'Select date & time',
  className = '',
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'calendar' | 'custom'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  // Parse initial date from value or fallback to tomorrow
  const initialDate = useMemo(() => {
    if (!value) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }

    // Try parsing strings like "Nov 15, 2026 · 10:00 AM" or ISO
    const cleanStr = value.split('·')[0].split('-')[0].trim();
    const parsed = Date.parse(cleanStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }

    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }, [value]);

  // Calendar navigation state
  const [currentYear, setCurrentYear] = useState<number>(() => initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => initialDate.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(() => initialDate.getDate());

  // Time state
  const [selectedHour, setSelectedHour] = useState<string>('10');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Optional End Time
  const [hasEndTime, setHasEndTime] = useState<boolean>(false);
  const [endHour, setEndHour] = useState<string>('01');
  const [endMinute, setEndMinute] = useState<string>('00');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM');

  // Custom text fallback
  const [customText, setCustomText] = useState<string>(value || '');

  // Parse time details from incoming value if present
  useEffect(() => {
    if (!value) return;

    // Pattern: "Nov 15, 2026 · 10:00 AM" or "10:00 AM"
    const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      const h = timeMatch[1].padStart(2, '0');
      const m = timeMatch[2];
      const p = (timeMatch[3].toUpperCase() === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM';
      setSelectedHour(h);
      setSelectedMinute(m);
      setSelectedPeriod(p);
    }

    // Check for end time like "10:00 AM – 01:00 PM"
    const endMatch = value.match(/[–\-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (endMatch) {
      setHasEndTime(true);
      setEndHour(endMatch[1].padStart(2, '0'));
      setEndMinute(endMatch[2]);
      setEndPeriod((endMatch[3].toUpperCase() === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM');
    }

    setCustomText(value);
  }, [value]);

  // Sync internal picker to formatted string
  const formatDateTime = (
    year: number,
    month: number,
    day: number,
    hour: string,
    minute: string,
    period: 'AM' | 'PM',
    withEnd = hasEndTime,
    eH = endHour,
    eM = endMinute,
    eP = endPeriod
  ) => {
    const monthStr = MONTH_NAMES[month];
    let timeStr = `${hour}:${minute} ${period}`;
    if (withEnd) {
      timeStr += ` – ${eH}:${eM} ${eP}`;
    }
    return `${monthStr} ${day}, ${year} · ${timeStr}`;
  };

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calendar Grid Calculation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Quick shortcuts handler
  const handleQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setCurrentYear(target.getFullYear());
    setCurrentMonth(target.getMonth());
    setSelectedDay(target.getDate());

    const formatted = formatDateTime(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      selectedHour,
      selectedMinute,
      selectedPeriod
    );
    onChange(formatted);
  };

  // Day selection click
  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const formatted = formatDateTime(
      currentYear,
      currentMonth,
      day,
      selectedHour,
      selectedMinute,
      selectedPeriod
    );
    onChange(formatted);
  };

  // Time change
  const handleTimeChange = (hour: string, minute: string, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    const formatted = formatDateTime(
      currentYear,
      currentMonth,
      selectedDay,
      hour,
      minute,
      period
    );
    onChange(formatted);
  };

  // End time change
  const handleEndTimeToggle = (enabled: boolean) => {
    setHasEndTime(enabled);
    const formatted = formatDateTime(
      currentYear,
      currentMonth,
      selectedDay,
      selectedHour,
      selectedMinute,
      selectedPeriod,
      enabled
    );
    onChange(formatted);
  };

  // Native datetime-local picker change handler
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // e.g. "2026-11-15T10:00"
    if (!val) return;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();
        let h = d.getHours();
        const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        const hourStr = h.toString().padStart(2, '0');
        const minuteStr = d.getMinutes().toString().padStart(2, '0');

        setCurrentYear(year);
        setCurrentMonth(month);
        setSelectedDay(day);
        setSelectedHour(hourStr);
        setSelectedMinute(minuteStr);
        setSelectedPeriod(period);

        const formatted = formatDateTime(year, month, day, hourStr, minuteStr, period);
        onChange(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === currentYear &&
      now.getMonth() === currentMonth &&
      now.getDate() === day
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase text-[#5B6478] mb-1">
          {label} {required && <span className="text-[#C0302F]">*</span>}
        </label>
      )}

      {/* Main Trigger Input Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E1E5EE] hover:border-[#3345E8]/60 rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30 flex items-center justify-between gap-2 cursor-pointer shadow-2xs transition-all select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-[7px] bg-[#EEF2FF] text-[#3345E8] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className={`truncate ${value ? 'font-semibold text-[#0E1424]' : 'text-[#5B6478]'}`}>
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-bold text-[#3345E8] bg-[#EEF2FF] px-2 py-0.5 rounded-[6px] hidden sm:inline">
            Pick Date & Time
          </span>
          <CalendarDays className="w-4 h-4 text-[#5B6478]" />
        </div>
      </div>

      {/* Hidden Native Picker Trigger for Mobile OS Native Integration */}
      <input
        ref={nativeInputRef}
        type="datetime-local"
        className="sr-only"
        tabIndex={-1}
        onChange={handleNativePickerChange}
      />

      {/* Interactive Calendar Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 w-full min-w-[320px] max-w-[420px] bg-white rounded-[16px] border border-[#CBD5E1] shadow-2xl p-4 sm:p-5 animate-fadeIn">
          {/* Top Bar with Modes and Close */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E5EE] mb-3">
            <div className="flex items-center gap-1.5 bg-[#F4F6FA] p-1 rounded-[8px] text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('calendar')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  mode === 'calendar'
                    ? 'bg-white text-[#3345E8] shadow-2xs font-extrabold'
                    : 'text-[#5B6478] hover:text-[#0E1424]'
                }`}
              >
                Calendar View
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  mode === 'custom'
                    ? 'bg-white text-[#3345E8] shadow-2xs font-extrabold'
                    : 'text-[#5B6478] hover:text-[#0E1424]'
                }`}
              >
                Custom Text
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  try {
                    nativeInputRef.current?.showPicker();
                  } catch {
                    nativeInputRef.current?.focus();
                  }
                }}
                className="p-1.5 rounded-[7px] text-[#5B6478] hover:text-[#3345E8] hover:bg-[#EEF2FF] transition-colors"
                title="Use device's native calendar picker"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-[7px] text-[#5B6478] hover:text-[#0E1424] hover:bg-[#F4F6FA] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {mode === 'calendar' ? (
            <div className="space-y-4">
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleQuickDate(0)}
                  className="px-2.5 py-1 rounded-full bg-[#F4F6FA] hover:bg-[#EEF2FF] text-[#5B6478] hover:text-[#3345E8] transition-colors whitespace-nowrap border border-[#E1E5EE]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2.5 py-1 rounded-full bg-[#F4F6FA] hover:bg-[#EEF2FF] text-[#5B6478] hover:text-[#3345E8] transition-colors whitespace-nowrap border border-[#E1E5EE]"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(7)}
                  className="px-2.5 py-1 rounded-full bg-[#F4F6FA] hover:bg-[#EEF2FF] text-[#5B6478] hover:text-[#3345E8] transition-colors whitespace-nowrap border border-[#E1E5EE]"
                >
                  In 1 Week
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(14)}
                  className="px-2.5 py-1 rounded-full bg-[#F4F6FA] hover:bg-[#EEF2FF] text-[#5B6478] hover:text-[#3345E8] transition-colors whitespace-nowrap border border-[#E1E5EE]"
                >
                  In 2 Weeks
                </button>
              </div>

              {/* Month & Year Navigation */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-[8px] border border-[#E1E5EE] hover:bg-[#F4F6FA] text-[#0E1424] transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#0E1424]">
                    {FULL_MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-[8px] border border-[#E1E5EE] hover:bg-[#F4F6FA] text-[#0E1424] transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="text-[11px] font-bold text-[#5B6478] py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-8" />
                ))}

                {/* Day numbers */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const isSelected = selectedDay === day;
                  const today = isToday(day);

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-8 w-full rounded-[8px] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#3345E8] text-white font-extrabold shadow-sm'
                          : today
                          ? 'bg-[#EEF2FF] text-[#3345E8] font-bold border border-[#3345E8]/30'
                          : 'text-[#0E1424] hover:bg-[#F4F6FA]'
                      }`}
                    >
                      <span>{day}</span>
                      {today && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-[#3345E8] absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TIME SELECTION SECTION */}
              <div className="pt-3 border-t border-[#E1E5EE] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#0E1424]">
                  <span className="flex items-center gap-1.5 text-[#5B6478]">
                    <Clock className="w-3.5 h-3.5 text-[#3345E8]" />
                    <span>Start Time</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleEndTimeToggle(!hasEndTime)}
                      className={`px-2 py-0.5 rounded-[5px] font-semibold transition-colors ${
                        hasEndTime
                          ? 'bg-[#EEF2FF] text-[#3345E8] font-bold'
                          : 'text-[#5B6478] hover:text-[#0E1424]'
                      }`}
                    >
                      {hasEndTime ? '✓ Has End Time' : '+ Add End Time'}
                    </button>
                  </div>
                </div>

                {/* Quick Time Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {QUICK_TIMES.map((qt) => {
                    const isActive =
                      selectedHour === qt.hour &&
                      selectedMinute === qt.minute &&
                      selectedPeriod === qt.period;
                    return (
                      <button
                        key={qt.label}
                        type="button"
                        onClick={() => handleTimeChange(qt.hour, qt.minute, qt.period as 'AM' | 'PM')}
                        className={`py-1 px-1 rounded-[6px] text-[10px] font-bold border transition-colors ${
                          isActive
                            ? 'bg-[#EEF2FF] text-[#3345E8] border-[#3345E8]'
                            : 'bg-white text-[#5B6478] border-[#E1E5EE] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {qt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Time Selectors */}
                <div className="flex flex-wrap items-center gap-2 bg-[#F8FAFC] p-2 rounded-[10px] border border-[#E2E8F0]">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#0E1424]">
                    <select
                      value={selectedHour}
                      onChange={(e) => handleTimeChange(e.target.value, selectedMinute, selectedPeriod)}
                      className="bg-white border border-[#CBD5E1] rounded-[6px] px-2 py-1 text-xs font-bold text-[#0E1424] focus:outline-none focus:ring-2 focus:ring-[#3345E8]/30"
                    >
                      {Array.from({ length: 12 }).map((_, i) => {
                        const h = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        );
                      })}
                    </select>
                    <span>:</span>
                    <select
                      value={selectedMinute}
                      onChange={(e) => handleTimeChange(selectedHour, e.target.value, selectedPeriod)}
                      className="bg-white border border-[#CBD5E1] rounded-[6px] px-2 py-1 text-xs font-bold text-[#0E1424] focus:outline-none focus:ring-2 focus:ring-[#3345E8]/30"
                    >
                      {['00', '15', '30', '45'].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <div className="flex rounded-[6px] border border-[#CBD5E1] overflow-hidden ml-1">
                      <button
                        type="button"
                        onClick={() => handleTimeChange(selectedHour, selectedMinute, 'AM')}
                        className={`px-2 py-1 text-xs font-bold ${
                          selectedPeriod === 'AM'
                            ? 'bg-[#3345E8] text-white'
                            : 'bg-white text-[#5B6478]'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(selectedHour, selectedMinute, 'PM')}
                        className={`px-2 py-1 text-xs font-bold ${
                          selectedPeriod === 'PM'
                            ? 'bg-[#3345E8] text-white'
                            : 'bg-white text-[#5B6478]'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>

                  {/* End Time selectors if enabled */}
                  {hasEndTime && (
                    <div className="flex items-center gap-1 text-xs font-bold text-[#0E1424] pl-2 border-l border-[#CBD5E1]">
                      <span className="text-[11px] text-[#5B6478]">to</span>
                      <select
                        value={endHour}
                        onChange={(e) => {
                          setEndHour(e.target.value);
                          const formatted = formatDateTime(
                            currentYear,
                            currentMonth,
                            selectedDay,
                            selectedHour,
                            selectedMinute,
                            selectedPeriod,
                            true,
                            e.target.value,
                            endMinute,
                            endPeriod
                          );
                          onChange(formatted);
                        }}
                        className="bg-white border border-[#CBD5E1] rounded-[6px] px-2 py-1 text-xs font-bold text-[#0E1424] focus:outline-none"
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const h = (i + 1).toString().padStart(2, '0');
                          return (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          );
                        })}
                      </select>
                      <span>:</span>
                      <select
                        value={endMinute}
                        onChange={(e) => {
                          setEndMinute(e.target.value);
                          const formatted = formatDateTime(
                            currentYear,
                            currentMonth,
                            selectedDay,
                            selectedHour,
                            selectedMinute,
                            selectedPeriod,
                            true,
                            endHour,
                            e.target.value,
                            endPeriod
                          );
                          onChange(formatted);
                        }}
                        className="bg-white border border-[#CBD5E1] rounded-[6px] px-2 py-1 text-xs font-bold text-[#0E1424] focus:outline-none"
                      >
                        {['00', '15', '30', '45'].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="flex rounded-[6px] border border-[#CBD5E1] overflow-hidden ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEndPeriod('AM');
                            const formatted = formatDateTime(
                              currentYear,
                              currentMonth,
                              selectedDay,
                              selectedHour,
                              selectedMinute,
                              selectedPeriod,
                              true,
                              endHour,
                              endMinute,
                              'AM'
                            );
                            onChange(formatted);
                          }}
                          className={`px-1.5 py-1 text-xs font-bold ${
                            endPeriod === 'AM'
                              ? 'bg-[#3345E8] text-white'
                              : 'bg-white text-[#5B6478]'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEndPeriod('PM');
                            const formatted = formatDateTime(
                              currentYear,
                              currentMonth,
                              selectedDay,
                              selectedHour,
                              selectedMinute,
                              selectedPeriod,
                              true,
                              endHour,
                              endMinute,
                              'PM'
                            );
                            onChange(formatted);
                          }}
                          className={`px-1.5 py-1 text-xs font-bold ${
                            endPeriod === 'PM'
                              ? 'bg-[#3345E8] text-white'
                              : 'bg-white text-[#5B6478]'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Custom Text Input Mode */
            <div className="space-y-3 py-2">
              <p className="text-xs text-[#5B6478]">
                Type any custom date format, multi-day range, or notice:
              </p>
              <input
                type="text"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder="e.g. Nov 15-16, 2026 · 10:00 AM – 4:00 PM"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-3 focus:ring-[#3345E8]/30"
              />
            </div>
          )}

          {/* Current Selection Preview & Confirm Button */}
          <div className="pt-3 border-t border-[#E1E5EE] mt-3 flex items-center justify-between gap-2">
            <div className="text-[11px] text-[#5B6478] truncate">
              <span className="font-semibold text-[#0E1424]">Selected: </span>
              <span className="text-[#3345E8] font-bold">{value || 'None'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#3345E8] hover:bg-[#2735C4] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
