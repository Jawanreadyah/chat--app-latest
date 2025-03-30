import React from 'react';

export function DoodleBackground() {
  return (
    <div className="absolute inset-0 w-full h-full opacity-[0.02] pointer-events-none">
      <svg width="100%" height="100%">
        <pattern id="doodle-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          {/* Squiggly lines */}
          <path d="M10 10 Q 30 30, 50 10 T 90 10" stroke="currentColor" fill="none" strokeWidth="1"/>
          <path d="M10 50 Q 30 70, 50 50 T 90 50" stroke="currentColor" fill="none" strokeWidth="1"/>
          <path d="M10 90 Q 30 110, 50 90 T 90 90" stroke="currentColor" fill="none" strokeWidth="1"/>
          
          {/* Circles */}
          <circle cx="20" cy="20" r="3" stroke="currentColor" fill="none" strokeWidth="1"/>
          <circle cx="80" cy="80" r="2" stroke="currentColor" fill="none" strokeWidth="1"/>
          
          {/* Stars */}
          <path d="M70 30 l2 2 l2 -2 l-2 -2 z" stroke="currentColor" fill="none" strokeWidth="1"/>
          <path d="M30 70 l2 2 l2 -2 l-2 -2 z" stroke="currentColor" fill="none" strokeWidth="1"/>
          
          {/* Random dots */}
          <circle cx="40" cy="40" r="1" fill="currentColor"/>
          <circle cx="60" cy="60" r="1" fill="currentColor"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#doodle-pattern)"/>
      </svg>
    </div>
  );
}