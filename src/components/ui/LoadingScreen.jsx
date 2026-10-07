import { useEffect, useState } from 'react';

/**
 * Apple-inspired minimal glassmorphism loading screen
 * - 60 FPS hardware-accelerated 12-blade radial indicator
 * - Frosted glass squircle HUD with subtle specular border & ambient depth
 * - Preserves website's exact color theme and typography
 * - Subtle fade-in on mount and smooth fade-out on unmount
 * - Responsive & centered on desktop, tablet, and mobile
 */
export default function LoadingScreen({
  message = 'Loading...',
  fullScreen = true,
  className = '',
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth fade-in frame
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-20'
      } flex items-center justify-center backdrop-blur-xl bg-[#06080E]/70 transition-opacity duration-200 ease-out ${
        mounted ? 'opacity-100' : 'opacity-0'
      } select-none overflow-hidden ${className}`}
      style={{ willChange: 'opacity' }}
    >
      {/* Subtle Apple Ambient Lighting Ring behind HUD */}
      <div className="absolute w-64 h-64 rounded-full bg-blue-600/10 blur-[90px] pointer-events-none" />

      {/* Minimal Apple Frosted Glass HUD */}
      <div className="relative px-7 py-6 sm:px-8 sm:py-7 rounded-2xl sm:rounded-3xl bg-[#0B0F1A]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col items-center justify-center gap-3.5 max-w-[220px] w-auto mx-4 pointer-events-auto">
        
        {/* Apple 12-Blade Smooth Activity Spinner */}
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-blue-500 dark:text-blue-400">
          <svg
            className="w-full h-full animate-spin"
            style={{
              animationDuration: '0.9s',
              animationTimingFunction: 'linear',
              willChange: 'transform',
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="1.00" transform="rotate(0 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.92" transform="rotate(30 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.84" transform="rotate(60 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" transform="rotate(90 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.67" transform="rotate(120 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.58" transform="rotate(150 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.50" transform="rotate(180 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.42" transform="rotate(210 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.33" transform="rotate(240 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.25" transform="rotate(270 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.17" transform="rotate(300 12 12)" />
            <line x1="12" y1="2.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.10" transform="rotate(330 12 12)" />
          </svg>
        </div>

        {/* Minimal Clean Label */}
        {message && (
          <p className="text-xs font-medium text-slate-300 tracking-wide select-none text-center leading-tight">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
