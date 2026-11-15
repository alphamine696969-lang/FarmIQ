'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout, Menu, X, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/sources', label: 'Sources & Trust', icon: ShieldCheck },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F5FBEF]/95 backdrop-blur-md border-b border-[#DCE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Official Farm IQ Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/brand/logo.png"
              alt="FarmIQ"
              className="h-11 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                    isActive
                      ? 'bg-[#EDF6ED] text-[#153D2B] font-bold border border-[#DCE5DC] shadow-xs'
                      : 'text-[#1C2922] hover:text-[#1BC447] hover:bg-[#EDF6ED]/60'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-[#153D2B]' : 'text-[#1BC447]'}`} />}
                  {isActive && !Icon && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1BC447] shrink-0" />
                  )}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live connectivity indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF6ED] text-[#153D2B] text-xs font-bold border border-[#DCE5DC]">
              <span className="w-2 h-2 rounded-full bg-[#1BC447] animate-pulse" />
              <span>Live Sync</span>
            </div>

            <Link
              href="/login"
              className="px-5 py-2.5 text-xs font-bold text-[#1C2922] bg-white hover:bg-[#EDF6ED] border border-[#DCE5DC] rounded-full transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-bold text-xs shadow-glow-lime transition-smooth"
            >
              <LayoutDashboard className="w-4 h-4 text-[#1C2922]" />
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1C2922]" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/app"
              className="px-4 py-2 text-xs font-bold rounded-full bg-[#1BC447] text-[#1C2922] shadow-glow-lime"
            >
              Launch App
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-[#1C2922] hover:bg-[#EDF6ED]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#DCE5DC] bg-[#F3FCF3] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#EDF6ED] text-[#153D2B] font-bold border border-[#DCE5DC]'
                    : 'text-[#1C2922] hover:bg-[#EDF6ED]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-[#DCE5DC] flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold border border-[#DCE5DC] rounded-full bg-white text-[#1C2922]"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 text-xs font-bold rounded-full bg-[#1BC447] text-[#1C2922] shadow-glow-lime"
            >
              Launch FarmIQ Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
