'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUserProfile, saveStoredUserProfile, UserProfile } from '@/lib/data/userState';
import { X, Key, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

// Decodes standard Base64 URL encoded JWT from Google
export function decodeGoogleJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google JWT payload:', err);
    return null;
  }
}

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  onSuccess?: () => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  className = "",
  onSuccess,
}) => {
  const router = useRouter();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  
  const [clientId, setClientId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputClientId, setInputClientId] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Load configured Client ID from env or localStorage or backend API
  useEffect(() => {
    let activeId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!activeId && typeof window !== 'undefined') {
      activeId = localStorage.getItem('farmiq_google_client_id') || '';
    }

    if (activeId) {
      setClientId(activeId);
      setInputClientId(activeId);
    } else {
      fetch('/api/auth/google-client-id')
        .then((res) => res.json())
        .then((data) => {
          if (data.clientId) {
            setClientId(data.clientId);
            setInputClientId(data.clientId);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Handle successful Google authentication payload
  const handleAuthSuccess = async (googleUser: {
    name?: string;
    email?: string;
    picture?: string;
    sub?: string;
  }) => {
    try {
      const current = getStoredUserProfile();
      const updated: UserProfile = {
        ...current,
        displayName: googleUser.name || googleUser.email?.split('@')[0] || 'Farmer',
        email: googleUser.email || current.email,
        avatarUrl: googleUser.picture,
        photoUrl: googleUser.picture,
        googleSub: googleUser.sub,
        authProvider: 'google',
      };

      saveStoredUserProfile(updated);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/app');
      }
    } catch (err: any) {
      console.error('Error saving Google user session:', err);
      setErrorMessage('Failed to save authenticated user session');
    }
  };

  // Google Identity Services (GIS) Callback
  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setErrorMessage('No credential returned from Google');
      return;
    }

    try {
      setErrorMessage(null);

      // Verify token with backend API endpoint
      const verifyRes = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData.verified && verifyData.user) {
          await handleAuthSuccess(verifyData.user);
          return;
        }
      }

      // Fallback to client-side decoded JWT
      const payload = decodeGoogleJwt(response.credential);
      if (payload && payload.email) {
        await handleAuthSuccess({
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          sub: payload.sub,
        });
      } else {
        setErrorMessage('Could not decode Google ID token');
      }
    } catch (err: any) {
      console.error('Failed to verify Google credential:', err);
      setErrorMessage('Google authentication verification failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Initialize GIS and render ONLY the official Google button when clientId is available
  useEffect(() => {
    if (!clientId) return;

    const interval = setInterval(() => {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        clearInterval(interval);
        try {
          g.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official Google Sign In button directly from Google GIS
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            g.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 340,
            });
          }
        } catch (err) {
          console.error('Error initializing Google Identity Services:', err);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [clientId]);

  // Save new Client ID from modal
  const handleSaveClientId = async () => {
    const trimmed = inputClientId.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid Google Client ID');
      return;
    }

    setIsSavingKey(true);
    try {
      localStorage.setItem('farmiq_google_client_id', trimmed);
      setClientId(trimmed);

      await fetch('/api/auth/google-client-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: trimmed }),
      });

      setShowConfigModal(false);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to save Client ID:', err);
      setErrorMessage('Failed to save Client ID to server: ' + err.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  const copyOriginToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ONLY the official Google button rendered directly by Google GIS */}
      {clientId ? (
        <div 
          ref={googleBtnContainerRef} 
          className="w-full flex justify-center min-h-[44px]"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowConfigModal(true)}
          className={`w-full py-3 px-5 rounded-full bg-white hover:bg-[#F3FCF3] border border-[#DCE5DC] hover:border-[#1BC447]/60 text-[#1C2922] font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.99] ${className}`}
        >
          <GoogleIcon className="w-5 h-5 group-hover:scale-105 transition-transform shrink-0" />
          <span>Connect Google Client ID</span>
        </button>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="mt-2 text-xs text-[#BA1A1A] bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex items-center gap-2 w-full animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="ml-auto text-rose-500 hover:text-rose-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Real Google Cloud OAuth Client ID Configuration Modal (only if not configured) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#DCE5DC] shadow-floating max-w-lg w-full overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-[#DCE5DC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] flex items-center justify-center border border-[#DCE5DC]">
                  <GoogleIcon className="w-6 h-6 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1C2922]">Google Cloud OAuth Setup</h3>
                  <p className="text-xs text-[#3D4A3B]">Connect real Google Account Authentication</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#3D4A3B] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-[#3D4A3B] leading-relaxed">
                To sign in with real Google accounts, FarmIQ connects directly to Google OAuth 2.0.
              </p>

              {/* Step Guide */}
              <div className="space-y-2.5 bg-[#F3FCF3] p-4 rounded-2xl border border-[#DCE5DC] text-xs">
                <p className="font-bold text-[#1C2922]">Google Cloud Configuration:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#3D4A3B]">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#4285F4] hover:underline inline-flex items-center gap-1"
                    >
                      Google Cloud Console Credentials <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong></li>
                  <li>Select Application type: <strong>Web application</strong></li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>Add to Authorized JavaScript origins:</span>
                    <button
                      type="button"
                      onClick={copyOriginToClipboard}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#DCE5DC] font-mono text-[11px] text-[#153D2B] hover:bg-[#EDF6ED]"
                    >
                      {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                      {copiedOrigin ? <Check className="w-3 h-3 text-[#1BC447]" /> : <Copy className="w-3 h-3 text-[#3D4A3B]" />}
                    </button>
                  </li>
                  <li>Copy your <strong>Client ID</strong> and paste it below:</li>
                </ol>
              </div>

              {/* Client ID Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider">
                  Google Client ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-4 py-3 text-xs font-mono rounded-2xl border border-[#DCE5DC] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#4285F4] text-[#1C2922]"
                  />
                  <Key className="w-4 h-4 text-[#3D4A3B]/50 absolute right-4 top-3.5" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE5DC]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 rounded-full border border-[#DCE5DC] text-xs font-bold text-[#3D4A3B] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClientId}
                  disabled={isSavingKey || !inputClientId.trim()}
                  className="px-6 py-2.5 rounded-full bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>{isSavingKey ? 'Saving...' : 'Save Client ID'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
