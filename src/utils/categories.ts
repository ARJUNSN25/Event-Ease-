/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Cpu,
  Sparkles,
  Trophy,
  GraduationCap,
  Palette,
  Calendar,
  LucideIcon,
} from 'lucide-react';
import { EventCategory } from '../store';

export interface CategoryInfo {
  id: EventCategory | 'all';
  label: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const CATEGORIES: Record<EventCategory | 'all', CategoryInfo> = {
  all: {
    id: 'all',
    label: 'All events',
    icon: Calendar,
    badgeBg: 'bg-[#F4F6FA]',
    badgeText: 'text-[#0E1424]',
    borderColor: 'border-[#E1E5EE]',
  },
  tech: {
    id: 'tech',
    label: 'Tech & Hackathons',
    icon: Cpu,
    badgeBg: 'bg-[#E8EBFE]',
    badgeText: 'text-[#3345E8]',
    borderColor: 'border-[#3345E8]/30',
  },
  cultural: {
    id: 'cultural',
    label: 'Cultural & Music',
    icon: Sparkles,
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  sports: {
    id: 'sports',
    label: 'Sports & Athletics',
    icon: Trophy,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
  },
  academic: {
    id: 'academic',
    label: 'Academic & Talks',
    icon: GraduationCap,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-200',
  },
  arts: {
    id: 'arts',
    label: 'Arts & Design',
    icon: Palette,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
  general: {
    id: 'general',
    label: 'Campus Community',
    icon: Calendar,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-200',
  },
};

export function getCategoryInfo(cat?: EventCategory): CategoryInfo {
  if (!cat || !CATEGORIES[cat]) {
    return CATEGORIES.tech;
  }
  return CATEGORIES[cat];
}
