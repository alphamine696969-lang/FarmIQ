'use client';

import React, { useState, useEffect, useRef } from 'react';

export const SplashScreen: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if the user forced splash display via ?splash=1 or ?splash=true
    const params = new URLSearchParams(window.location.search);
    const forceSplash = params.get('splash') === '1' || params.get('splash') === 'true';

    // Show on cold start only (once per browser session) unless forced
    if (!forceSplash) {
      try {
        const viewed = sessionStorage.getItem('farmiq_splash_viewed');
        if (viewed) {
          return;
        }
      } catch {
        // Storage access restricted; proceed safely
      }

      // Respect prefers-reduced-motion
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        try {
          sessionStorage.setItem('farmiq_splash_viewed', 'true');
        } catch {}
        return;
      }
    }

    setShowSplash(true);

    // Safety timeout: 5.5s (video duration is 4.2s) to prevent users from ever getting stuck
    timerRef.current = setTimeout(() => {
      finishSplash();
    }, 5500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const finishSplash = () => {
    try {
      sessionStorage.setItem('farmiq_splash_viewed', 'true');
    } catch {}

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsFadingOut(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 500);
  };

  if (!showSplash) return null;

  return (
    <div
      role="dialog"
      aria-label="FarmIQ Splash Animation"
      aria-modal="true"
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-[#FBFDFA] transition-opacity duration-500 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#FBFDFA' }}
    >
      <video
        ref={videoRef}
        src="/farmiq-splash.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finishSplash}
        onError={finishSplash}
        className="w-full h-full object-contain max-w-full max-h-full"
        style={{ backgroundColor: '#FBFDFA' }}
      />
    </div>
  );
};

