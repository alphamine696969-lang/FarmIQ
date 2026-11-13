'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';
import { Sprout } from 'lucide-react';

interface TransitionContextType {
  navigateWithTransition: (href: string, label?: string) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithTransition: () => {},
  isTransitioning: false,
});

export const usePageTransition = () => useContext(TransitionContext);

// Route labels for contextual agricultural telemetry feedback
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Platform Overview',
  '/features': 'Features & Engine Architecture',
  '/how-it-works': 'How It Works • Agronomic Evidence Pipeline',
  '/sources': 'Approved Sources & Trust Registry',
  '/about': 'About FarmIQ & Scientific Mission',
  '/login': 'Secure Sign In',
  '/signup': 'Create Farm Account',
  '/app': 'Farmer Workspace & Telemetry Dashboard',
  '/app/assistant': 'Grounded AI Assistant',
  '/app/crop-advisor': 'Crop Suitability Advisor',
  '/app/disease': 'Disease & Symptom Scanner',
  '/app/farms': 'Spatial Holdings & Plot Governance',
  '/app/markets': 'Market Prices & Net Realization',
  '/app/profit': 'Farm Profit & Break-Even Engine',
  '/app/settings': 'Farm Preferences & Localization',
  '/app/weather': 'Agro-Meteorological Forecasts',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
};

function getDestinationLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname];
  }
  // Fallback label based on route segment
  const segment = pathname.split('/').filter(Boolean).pop();
  if (!segment) return 'Platform Telemetry';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const currentPathname = usePathname();

  const [destinationLabel, setDestinationLabel] = useState<string>('Telemetry Routing');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const accentPanelRef = useRef<HTMLDivElement | null>(null);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const isTransitioningRef = useRef<boolean>(false);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger the GSAP transition and navigate
  const navigateWithTransition = (href: string, label?: string) => {
    if (isTransitioningRef.current) return;

    // Check for prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      router.push(href);
      return;
    }

    try {
      const url = new URL(href, window.location.href);
      const targetPath = url.pathname;

      // If already on the requested route, avoid redundant transition
      if (targetPath === currentPathname && url.search === window.location.search) {
        return;
      }

      setDestinationLabel(label || getDestinationLabel(targetPath));
      isTransitioningRef.current = true;
      setIsTransitioning(true);

      const overlay = overlayRef.current;
      const accent = accentPanelRef.current;
      const main = mainPanelRef.current;
      const badge = badgeRef.current;
      const progress = progressRef.current;

      if (!overlay || !accent || !main || !badge || !progress) {
        router.push(href);
        return;
      }

      // Kill any running animations
      gsap.killTweensOf([overlay, accent, main, badge, progress]);

      // Prepare starting states
      gsap.set(overlay, { display: 'block', pointerEvents: 'auto' });
      gsap.set([accent, main], { yPercent: 100 });
      gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(badge, { opacity: 0, y: 16, scale: 0.94 });

      const exitTl = gsap.timeline({
        onComplete: () => {
          // Push router navigation at the peak of the curtain cover
          router.push(href);

          // Safety timeout in case navigation stalls
          if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = setTimeout(() => {
            if (isTransitioningRef.current) {
              revealNewPage();
            }
          }, 1500);
        },
      });

      // 1. Accent blade slides up quickly
      exitTl.to(
        accent,
        {
          yPercent: 0,
          duration: 0.32,
          ease: 'power3.inOut',
        },
        0
      );

      // 2. Main deep forest panel follows
      exitTl.to(
        main,
        {
          yPercent: 0,
          duration: 0.36,
          ease: 'power3.inOut',
        },
        0.04
      );

      // 3. Top telemetry progress beam surges
      exitTl.to(
        progress,
        {
          scaleX: 1,
          duration: 0.34,
          ease: 'power2.out',
        },
        0.02
      );

      // 4. Centered telemetry badge enters
      exitTl.to(
        badge,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: 'back.out(1.2)',
        },
        0.16
      );
    } catch {
      router.push(href);
    }
  };

  // Animate curtain off to reveal the new page
  const revealNewPage = () => {
    const overlay = overlayRef.current;
    const accent = accentPanelRef.current;
    const main = mainPanelRef.current;
    const badge = badgeRef.current;
    const progress = progressRef.current;

    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    if (!overlay || !accent || !main || !badge || !progress) {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      return;
    }

    gsap.killTweensOf([overlay, accent, main, badge, progress]);

    const enterTl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { display: 'none', pointerEvents: 'none' });
        gsap.set([accent, main], { yPercent: 100 });
        isTransitioningRef.current = false;
        setIsTransitioning(false);
      },
    });

    // 1. Badge fades out cleanly
    enterTl.to(
      badge,
      {
        opacity: 0,
        y: -12,
        scale: 0.96,
        duration: 0.18,
        ease: 'power2.in',
      },
      0
    );

    // 2. Main curtain sweeps up out of view
    enterTl.to(
      main,
      {
        yPercent: -100,
        duration: 0.38,
        ease: 'power3.inOut',
      },
      0.06
    );

    // 3. Accent panel sweeps up behind it
    enterTl.to(
      accent,
      {
        yPercent: -100,
        duration: 0.34,
        ease: 'power3.inOut',
      },
      0.1
    );

    // 4. Progress bar fades
    enterTl.to(
      progress,
      {
        opacity: 0,
        duration: 0.2,
      },
      0.15
    );
  };

  // When pathname changes, reveal the new page if we were transitioning
  useEffect(() => {
    if (isTransitioningRef.current) {
      revealNewPage();
    }
  }, [currentPathname]);

  // Intercept standard internal links across the whole document
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore if modifier key was held (open in new tab/window)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Ignore external, download, tel, mailto, target="_blank", or hash anchors
      if (anchor.target === '_blank') return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('blob:')) return;
      if (href.startsWith('#')) return;

      try {
        const url = new URL(href, window.location.href);

        // Ignore external domains
        if (url.origin !== window.location.origin) return;

        // Ignore same exact URL
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          if (url.hash) return; // Allow hash scrolling on same page
          e.preventDefault();
          return;
        }

        // Prevent default browser jump and trigger smooth GSAP page transition
        e.preventDefault();
        navigateWithTransition(url.pathname + url.search + url.hash);
      } catch {
        // Fallback to default browser handling
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [currentPathname]);

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning }}>
      {children}

      {/* GSAP Fullscreen Telemetry Transition Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] pointer-events-none hidden overflow-hidden"
        aria-hidden="true"
      >
        {/* Layer 1: Emerald Accent Panel */}
        <div
          ref={accentPanelRef}
          className="absolute inset-0 bg-[#1BC447] shadow-2xl"
          style={{ willChange: 'transform' }}
        />

        {/* Layer 2: Deep Forest Green Main Curtain */}
        <div
          ref={mainPanelRef}
          className="absolute inset-0 bg-[#153D2B] flex flex-col items-center justify-center p-6 text-white"
          style={{ willChange: 'transform' }}
        >
          {/* Subtle Grid Telemetry Texture */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Top Telemetry Beam */}
          <div
            ref={progressRef}
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1BC447] via-[#74f899] to-[#1BC447] shadow-[0_0_16px_#1BC447]"
          />

          {/* Centered Telemetry Status Badge */}
          <div
            ref={badgeRef}
            className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-sm"
          >
            {/* Sprout Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#0E281C] border border-[#1C4D37] flex items-center justify-center text-[#1BC447] shadow-glow-lime">
              <Sprout className="w-7 h-7 animate-pulse" />
            </div>

            {/* Platform Branding & Telemetry Status */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Farm<span className="text-[#1BC447]">IQ</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-[#0E281C] text-[#1BC447] px-2.5 py-0.5 rounded-full border border-[#1C4D37]">
                  Global Telemetry
                </span>
              </div>
              <p className="text-xs font-semibold text-[#1BC447] tracking-wide">
                {destinationLabel}
              </p>
            </div>

            {/* Pulsing Sync Dots */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1BC447] animate-ping" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                Syncing Precision Nodes...
              </span>
            </div>
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
};
