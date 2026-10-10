import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export function Logo({ className = 'w-9 h-9', size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="EventEase Logo"
    >
      <defs>
        <linearGradient id="eventEaseBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="85%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="eventEaseCheck" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Top Left Calendar Ring */}
      <rect x="27" y="10" width="7" height="17" rx="3.5" fill="url(#eventEaseBlue)" />

      {/* Top Right Calendar Ring */}
      <rect x="54" y="10" width="7" height="17" rx="3.5" fill="url(#eventEaseBlue)" />

      {/* Calendar Header Arch & Outer Border */}
      <path
        d="M 36 21 L 52 21 M 63 21 L 70 21 C 76.5 21 80 24.5 80 31 L 80 50 M 25 21 L 18 21 C 12.5 21 9 24.5 9 31 L 9 66 C 9 78.5 19 88.5 32 89.5"
        stroke="url(#eventEaseBlue)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic Stylized 'e' letter loop filling calendar body */}
      <path
        d="M 21.5 69 C 14 53 23 37.5 44 37.5 C 64 37.5 73.5 51 70.5 68.5 L 21 68.5 C 22 81 33.5 87 47 85 C 56.5 83.5 63.5 78 66.5 70"
        stroke="url(#eventEaseBlue)"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner bowl highlight of the 'e' */}
      <path
        d="M 27 58 C 28.5 49 36 44.5 46 44.5 C 55.5 44.5 62.5 49 61.5 58 Z"
        fill="url(#eventEaseBlue)"
        fillOpacity="0.18"
      />

      {/* Checked verification mark on the lower right */}
      <path
        d="M 64.5 67 L 73 75.5 L 92.5 49.5"
        stroke="url(#eventEaseCheck)"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default Logo;
