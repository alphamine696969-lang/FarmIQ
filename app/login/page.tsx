'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sprout, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleAuth';
import { getStoredUserProfile, saveStoredUserProfile, UserProfile } from '@/lib/data/userState';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDetails = searchParams.get('details');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Save email sign-in profile
    const existing = getStoredUserProfile();
    const updated: UserProfile = {
      ...existing,
      email: email.trim() || existing.email,
      authProvider: 'email',
    };
    saveStoredUserProfile(updated);

    setTimeout(() => {
      router.push('/app');
    }, 600);
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 shadow-bento rounded-3xl border border-[#DCE5DC] space-y-6">
      {/* OAuth Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-[#BA1A1A] space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Google Authentication: {error}</span>
          </div>
          {errorDetails && (
            <p className="text-[11px] font-mono break-all text-rose-700 bg-white/70 p-2 rounded-xl mt-1">
              {errorDetails}
            </p>
          )}
        </div>
      )}

      {/* Google Account Authentication */}
      <div className="space-y-3">
        <GoogleSignInButton label="Sign in with Google" />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#DCE5DC]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white px-3 text-[#3D4A3B] font-bold text-[10px]">Or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@domain.com"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] focus:border-[#1BC447] text-[#1C2922] transition-all"
            />
            <Mail className="w-4 h-4 text-[#3D4A3B]/60 absolute right-4 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] focus:border-[#1BC447] text-[#1C2922] transition-all"
            />
            <Lock className="w-4 h-4 text-[#3D4A3B]/60 absolute right-4 top-3.5" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-[#3D4A3B] cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded-full accent-[#1BC447] w-4 h-4" />
            <span>Remember session</span>
          </label>
          <a href="#" className="font-bold text-[#153D2B] hover:text-[#1BC447] transition-colors">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-full bg-[#153D2B] hover:bg-[#1C4D37] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-[#3D4A3B]">
        Don't have an account yet?{' '}
        <Link href="/signup" className="font-bold text-[#153D2B] hover:text-[#1BC447] underline transition-colors">
          Create an account
        </Link>
      </div>

      <div className="pt-3 border-t border-[#DCE5DC] flex items-center justify-center gap-1.5 text-[11px] text-[#3D4A3B]">
        <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
        <span>Enterprise OAuth 2.0 Security</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F3FCF3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#153D2B] text-[#1BC447] flex items-center justify-center shadow-bento">
            <Sprout className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-3xl tracking-tight text-[#153D2B]">
            Farm<span className="text-[#1BC447]">IQ</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#1C2922]">Sign in to your Farm Workspace</h2>
        <p className="text-xs text-[#3D4A3B]">Grow Smarter. Earn Better with Grounded Precision.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="bg-white p-8 rounded-3xl border border-[#DCE5DC] text-center text-xs text-[#3D4A3B]">Loading workspace sign in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
