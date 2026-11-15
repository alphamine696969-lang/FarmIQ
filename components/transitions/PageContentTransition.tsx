'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PageContentTransitionProps {
  children: React.ReactNode;
}

export const PageContentTransition: React.FC<PageContentTransitionProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const bar = progressBarRef.current;
    if (!el) return;

    // Respect user's motion preference
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Subtle, refined content fade & micro-rise (Linear/Vercel style)
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 7,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );

      // 2. Ultra-subtle top progress beam (instant feedback)
      if (bar) {
        const tl = gsap.timeline();
        tl.fromTo(
          bar,
          { scaleX: 0, opacity: 1, transformOrigin: '0% 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        ).to(bar, { opacity: 0, duration: 0.15, ease: 'power1.out' });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Subtle 2px emerald progress accent at top of screen */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1BC447] via-[#A8E063] to-[#153D2B] z-[9999] pointer-events-none opacity-0 shadow-[0_0_8px_rgba(27,196,71,0.4)]"
        style={{ willChange: 'transform, opacity' }}
      />
      {/* Page content wrapper */}
      <div ref={containerRef} className="w-full flex-1 flex flex-col">
        {children}
      </div>
    </>
  );
};
