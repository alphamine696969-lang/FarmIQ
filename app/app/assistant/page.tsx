'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { getStoredUserProfile, UserProfile, Farm } from '@/lib/data/userState';
import {
  Send,
  Plus,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Info,
  Trash2,
  ChevronDown,
  Check,
  Copy,
  CheckCheck,
  Paperclip,
  Image as ImageIcon,
  Sprout,
  X,
  ArrowUp,
  RotateCcw,
  Volume2
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Interfaces & Types                                                         */
/* -------------------------------------------------------------------------- */

interface AssistantSource {
  sourceId?: string;
  sourceLabel: string;
  url?: string;
  excerpt?: string;
  similarity: number;
}

interface AssistantMessageData {
  answer: string;
  intent: { label: string; confidence: number; method: string };
  sources: AssistantSource[];
  followUps: string[];
  evidenceStatus: 'supported' | 'partial' | 'conflicting' | 'insufficient';
  limitations: string[];
  warnings: string[];
  blocked: boolean;
  providerConfigured: { generation: boolean; embeddings: boolean; translation: boolean; retrieval: boolean };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachedImage?: string;
  responseMeta?: AssistantMessageData;
}

/* -------------------------------------------------------------------------- */
/* Agricultural Advisory Scopes (Replaces Claude's AI Model Picker)           */
/* -------------------------------------------------------------------------- */

interface AdvisoryScope {
  id: string;
  label: string;
  icon: string;
  hint: string;
  systemTag: string;
}

const ADVISORY_SCOPES: AdvisoryScope[] = [
  {
    id: 'full',
    label: 'Full Agronomy & Telemetry',
    icon: '🌿',
    hint: 'Holistic crop intelligence, NASA agro-weather and soil telemetry',
    systemTag: 'Comprehensive Agricultural Telemetry'
  },
  {
    id: 'pathology',
    label: 'Crop Pathology & Blight',
    icon: '🔬',
    hint: 'Leaf symptom identification, fungal spot diagnosis & IPM prevention',
    systemTag: 'Plant Pathology & Integrated Pest Management'
  },
  {
    id: 'soil',
    label: 'Soil Chemistry & NPK',
    icon: '🧪',
    hint: 'Optimal NPK fertilizer schedules, organic amendments & soil pH balance',
    systemTag: 'Soil Fertility & Nutrient Program'
  },
  {
    id: 'weather',
    label: 'NASA Weather & ET0',
    icon: '🌦️',
    hint: 'NASA POWER solar radiation, evapotranspiration & crop water deficit',
    systemTag: 'Agrometeorology & Crop Irrigation Deficit'
  },
  {
    id: 'economics',
    label: 'Mandi Rates & Economics',
    icon: '📈',
    hint: 'Agmarknet wholesale mandi prices, regional price trends & profit margins',
    systemTag: 'Agricultural Market Economics'
  }
];

/* -------------------------------------------------------------------------- */
/* Starter Agricultural Prompts for Clean Hero State                          */
/* -------------------------------------------------------------------------- */

const STARTER_PROMPTS = [
  {
    icon: '🔬',
    category: 'Crop Pathology',
    title: 'Early Blight & Leaf Spot',
    prompt: 'How do I identify and manage early blight in tomatoes before it spreads?'
  },
  {
    icon: '🌦️',
    category: 'Agro Weather',
    title: 'ET0 Irrigation Schedule',
    prompt: 'What are the crop water requirements and ET0 irrigation guidelines for wheat?'
  },
  {
    icon: '🧪',
    category: 'Soil & Nutrition',
    title: 'Soil pH & NPK Balance',
    prompt: 'What is the optimal soil pH and fertilizer dosage for winter wheat?'
  },
  {
    icon: '📈',
    category: 'Market Economics',
    title: 'Mandi Price Benchmarks',
    prompt: 'How do current wholesale mandi prices compare and what are the transport margins?'
  }
];

function now(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* -------------------------------------------------------------------------- */
/* Claude-Style Warm Agricultural Starburst Emblem                             */
/* -------------------------------------------------------------------------- */

function FarmIQStarburst({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="4" x2="24" y2="12" />
        <line x1="24" y1="36" x2="24" y2="44" />
        <line x1="4" y1="24" x2="12" y2="24" />
        <line x1="36" y1="24" x2="44" y2="24" />
        <line x1="9.86" y1="9.86" x2="15.52" y2="15.52" />
        <line x1="32.48" y1="32.48" x2="38.14" y2="38.14" />
        <line x1="9.86" y1="38.14" x2="15.52" y2="32.48" />
        <line x1="32.48" y1="15.52" x2="38.14" y2="9.86" />
        <line x1="16.34" y1="6.34" x2="19.46" y2="13.88" />
        <line x1="28.54" y1="34.12" x2="31.66" y2="41.66" />
        <line x1="6.34" y1="31.66" x2="13.88" y2="28.54" />
        <line x1="34.12" y1="19.46" x2="41.66" y2="16.34" />
        <line x1="31.66" y1="6.34" x2="28.54" y2="13.88" />
        <line x1="19.46" y1="34.12" x2="16.34" y2="41.66" />
        <line x1="6.34" y1="16.34" x2="13.88" y2="19.46" />
        <line x1="34.12" y1="28.54" x2="41.66" y2="31.66" />
      </g>
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Formatted Markdown-like Assistant Text Component                           */
/* -------------------------------------------------------------------------- */

function FormattedAssistantContent({ text }: { text: string }) {
  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <div className="space-y-3.5 text-[14px] leading-relaxed text-[#1C2922]">
      {paragraphs.map((para, idx) => {
        // Bullet list check
        if (para.includes('\n•') || para.startsWith('•') || para.includes('\n-') || para.startsWith('-')) {
          const lines = para.split('\n').filter((l) => l.trim().length > 0);
          return (
            <ul key={idx} className="space-y-1.5 pl-4 list-disc marker:text-[#1BC447]">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[-•*]\s*/, '');
                return (
                  <li key={lIdx} className="leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleaned) }} />
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p
            key={idx}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(para) }}
          />
        );
      })}
    </div>
  );
}

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-[#153D2B]">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-[#EDF6ED] px-1.5 py-0.5 rounded text-xs font-mono text-[#153D2B]">$1</code>');
}

/* -------------------------------------------------------------------------- */
/* Main Assistant Page Component                                              */
/* -------------------------------------------------------------------------- */

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [providerNote, setProviderNote] = useState<string | null>(null);

  // Profile & User Context
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [holdingDropdownOpen, setHoldingDropdownOpen] = useState(false);

  // Agricultural Advisory Scope (Replaces Claude's model picker)
  const [activeScope, setActiveScope] = useState<AdvisoryScope>(ADVISORY_SCOPES[0]);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  // Attachment & Voice Dictation
  const [attachedImage, setAttachedImage] = useState<{ name: string; preview: string } | null>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load User Profile and sync name
  useEffect(() => {
    const localProfile = getStoredUserProfile();
    setProfile(localProfile);
    if (localProfile?.farms && localProfile.farms.length > 0) {
      const active = localProfile.farms.find((f) => f.id === localProfile.activeFarmId) || localProfile.farms[0];
      setSelectedFarm(active);
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setProfile((prev) => ({
            ...(prev || localProfile),
            displayName: data.user.name || prev?.displayName || 'Parth',
            email: data.user.email || prev?.email || '',
            avatarUrl: data.user.picture || prev?.avatarUrl,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Derived user display name: Match screenshot "Parth"
  const userName =
    profile?.displayName && profile.displayName !== 'Farmer'
      ? profile.displayName.split(' ')[0]
      : 'Parth';

  const farms = profile?.farms && profile.farms.length > 0 ? profile.farms : [];

  // Speech-to-text dictation handler
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is supported in Chrome, Edge, and modern browsers.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText((prev) => (prev.trim() ? `${prev} ${transcript}` : transcript));
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Image file attachment handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({
        name: file.name,
        preview: String(reader.result),
      });
      setPlusMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy assistant message to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send message to AI assistant
  const handleSend = async (textToSend?: string) => {
    const rawQuery = textToSend || inputText;
    if ((!rawQuery.trim() && !attachedImage) || isTyping) return;

    // Close any open popovers
    setHoldingDropdownOpen(false);
    setScopeDropdownOpen(false);
    setPlusMenuOpen(false);

    // Build context-aware prompt if special scope or holding is active
    let augmentedMessage = rawQuery.trim();
    if (attachedImage) {
      augmentedMessage = `[Attached Crop Leaf Photo: ${attachedImage.name}] ${augmentedMessage}`;
    }
    if (activeScope.id !== 'full') {
      augmentedMessage = `[Scope: ${activeScope.label}] ${augmentedMessage}`;
    }
    if (selectedFarm) {
      augmentedMessage = `[Farm Context: ${selectedFarm.name}] ${augmentedMessage}`;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: rawQuery.trim() || `Analyze attached leaf sample: ${attachedImage?.name}`,
      timestamp: now(),
      attachedImage: attachedImage?.preview,
    };

    const history = messages.slice(-4).map((msg) => ({ role: msg.sender, content: msg.text }));
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: augmentedMessage, history }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || 'Request failed');
      }

      const data = payload.data as AssistantMessageData;
      if (data.providerConfigured && !data.providerConfigured.generation) {
        setProviderNote(
          'Operating in local agronomy mode — verified extracts from approved agricultural registries.'
        );
      } else if (data.limitations?.some((line) => line.includes('extractive summary'))) {
        setProviderNote(
          'Operating in local agronomy mode — verified agronomic knowledge base active.'
        );
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: now(),
        responseMeta: data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const assistantMsg: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        text: 'I could not reach the FarmIQ knowledge base just now. Please verify your connection and try again.',
        timestamp: now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Reset conversation to fresh Hero view
  const handleClearHistory = () => {
    setMessages([]);
    setInputText('');
    setAttachedImage(null);
    setProviderNote(null);
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.sender === 'assistant')?.id;

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-140px)] flex flex-col justify-between max-w-5xl mx-auto w-full">
        
        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* ================================================================= */}
        {/* CASE 1: HERO STATE (No messages sent yet)                         */}
        {/* Matches Claude.ai Home screen in light theme                      */}
        {/* ================================================================= */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
            
            {/* Top Plan / Intelligence Pill (Inspired by Claude's Top Header) */}
            <div className="mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE5DC] text-[11px] font-bold text-[#153D2B] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1BC447] animate-pulse" />
                <span>Agronomy Intelligence Suite</span>
                <span className="text-stone-300">•</span>
                <span className="text-[#3D4A3B] font-medium">Verified Agricultural Telemetry</span>
              </div>
            </div>

            {/* Central Claude Hero: Emblem + "Back at it, Parth" */}
            <div className="flex items-center justify-center gap-3 sm:gap-3.5 mb-7 text-center">
              <FarmIQStarburst className="w-8 h-8 sm:w-10 sm:h-10 text-[#D97746] shrink-0 transition-transform hover:scale-105" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#153D2B] font-normal tracking-tight">
                Back at it, {userName}
              </h1>
            </div>

            {/* Floating Claude-style Prompt Container */}
            <div className="w-full max-w-2xl sm:max-w-3xl">
              <div className="bg-white rounded-3xl border border-[#DCE5DC] shadow-md shadow-emerald-950/[0.04] p-4 transition-all focus-within:ring-4 focus-within:ring-[#1BC447]/15 focus-within:border-[#1BC447]">
                
                {/* Attached Image Thumbnail Pill */}
                {attachedImage && (
                  <div className="flex items-center gap-2 mb-2 p-1.5 px-3 bg-[#EDF6ED] border border-[#DCE5DC] rounded-xl w-fit animate-scale-in">
                    <img
                      src={attachedImage.preview}
                      alt="Crop Attachment"
                      className="w-6 h-6 object-cover rounded-md"
                    />
                    <span className="text-xs font-bold text-[#153D2B] max-w-[200px] truncate">
                      {attachedImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="text-stone-400 hover:text-red-500 ml-1 transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Multiline Autosizing Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="How can I help you today?"
                  rows={2}
                  className="w-full bg-transparent resize-none outline-none text-base text-[#1C2922] placeholder:text-stone-400 font-normal min-h-[72px] px-1 py-1 leading-relaxed"
                />

                {/* Bottom Action Row inside Prompt Box */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  
                  {/* Left: + Attachment Button with Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPlusMenuOpen((prev) => !prev)}
                      className="w-8 h-8 rounded-full border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-900 flex items-center justify-center hover:bg-stone-50 transition-colors"
                      title="Attach crop photo or field data"
                    >
                      <Plus className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    {plusMenuOpen && (
                      <div className="absolute left-0 bottom-10 w-64 bg-white border border-[#DCE5DC] rounded-2xl shadow-floating p-2 z-40 animate-scale-in">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 py-1.5">
                          Agricultural Attachments
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#EDF6ED] hover:text-[#153D2B] flex items-center gap-2.5 transition-colors"
                        >
                          <ImageIcon className="w-4 h-4 text-[#1BC447]" />
                          <span>Attach Crop Leaf Photo</span>
                        </button>
                        <Link
                          href="/app/disease"
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#EDF6ED] hover:text-[#153D2B] flex items-center gap-2.5 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-[#FD9D1A]" />
                          <span>Open Disease Scanner</span>
                        </Link>
                        <Link
                          href="/app/farms"
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#EDF6ED] hover:text-[#153D2B] flex items-center gap-2.5 transition-colors"
                        >
                          <Sprout className="w-4 h-4 text-[#0B4D2E]" />
                          <span>Select Plot Telemetry</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right: Mic Dictation + Send Button */}
                  <div className="flex items-center gap-2">
                    
                    {/* Voice Dictation Button with dropdown chevron (matches Claude 🎙️ v) */}
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`h-8 px-2 rounded-full flex items-center gap-0.5 transition-all ${
                        isListening
                          ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                      }`}
                      title={isListening ? 'Listening... click to stop' : 'Voice input (Speech to text)'}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      <ChevronDown className="w-3 h-3 text-stone-400" />
                    </button>

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={(!inputText.trim() && !attachedImage) || isTyping}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        inputText.trim() || attachedImage
                          ? 'bg-[#153D2B] hover:bg-[#1BC447] text-white hover:text-[#1C2922] shadow-sm cursor-pointer'
                          : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                      }`}
                      title="Send question"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.4]" />
                    </button>

                  </div>

                </div>

              </div>

              {/* ============================================================= */}
              {/* Agricultural Options Bar (Directly below Prompt Box)          */}
              {/* Left: Holding Selector  |  Right: Advisory Scope             */}
              {/* (NO AI model selection, replaced with agricultural options)   */}
              {/* ============================================================= */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 px-2 text-xs">
                
                {/* Left: Holding / Farm Context Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setHoldingDropdownOpen((prev) => !prev);
                      setScopeDropdownOpen(false);
                      setPlusMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DCE5DC] text-[#153D2B] font-semibold hover:border-[#1BC447] hover:bg-[#F3FCF3] transition-colors shadow-2xs"
                  >
                    <Sprout className="w-3.5 h-3.5 text-[#1BC447]" />
                    <span>Holding: {selectedFarm ? selectedFarm.name : 'All Landholdings'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {holdingDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white border border-[#DCE5DC] rounded-2xl shadow-floating p-2 z-30 animate-scale-in">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 py-1.5">
                        Active Farm Context
                      </p>
                      <div className="space-y-1">
                        {farms.map((farm) => (
                          <button
                            key={farm.id}
                            type="button"
                            onClick={() => {
                              setSelectedFarm(farm);
                              setHoldingDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                              selectedFarm?.id === farm.id
                                ? 'bg-[#EDF6ED] text-[#153D2B] font-bold'
                                : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span>{farm.name}</span>
                            {selectedFarm?.id === farm.id && <Check className="w-3.5 h-3.5 text-[#1BC447]" />}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFarm(null);
                            setHoldingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedFarm === null
                              ? 'bg-[#EDF6ED] text-[#153D2B] font-bold'
                              : 'hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <span>All Landholdings (Global)</span>
                          {selectedFarm === null && <Check className="w-3.5 h-3.5 text-[#1BC447]" />}
                        </button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#DCE5DC]">
                        <Link
                          href="/app/farms"
                          className="text-[11px] font-bold text-[#153D2B] hover:text-[#1BC447] px-3 py-1 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Manage Landholdings & Plots</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Agricultural Advisory Scope (Replaces Claude's Sonnet 3.5 picker) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setScopeDropdownOpen((prev) => !prev);
                      setHoldingDropdownOpen(false);
                      setPlusMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DCE5DC] text-[#153D2B] font-semibold hover:border-[#1BC447] hover:bg-[#F3FCF3] transition-colors shadow-2xs"
                  >
                    <span>{activeScope.icon}</span>
                    <span>Scope: {activeScope.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {scopeDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-[#DCE5DC] rounded-2xl shadow-floating p-2 z-30 animate-scale-in">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 py-1.5">
                        Agricultural Advisory Focus
                      </p>
                      <div className="space-y-1">
                        {ADVISORY_SCOPES.map((scope) => (
                          <button
                            key={scope.id}
                            type="button"
                            onClick={() => {
                              setActiveScope(scope);
                              setScopeDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors ${
                              activeScope.id === scope.id
                                ? 'bg-[#EDF6ED] text-[#153D2B] font-bold'
                                : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 font-bold">
                                <span>{scope.icon}</span>
                                <span>{scope.label}</span>
                              </span>
                              {activeScope.id === scope.id && <Check className="w-3.5 h-3.5 text-[#1BC447]" />}
                            </div>
                            <p className="text-[10px] text-stone-500 font-normal mt-0.5 ml-6 line-clamp-1">
                              {scope.hint}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Starter Prompt Cards (Agricultural Quick Starters) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-9 w-full max-w-2xl sm:max-w-3xl">
              {STARTER_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#DCE5DC] hover:border-[#1BC447] hover:bg-[#F3FCF3] text-left transition-smooth shadow-2xs hover:shadow-sm group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-bold text-[#153D2B]">{item.title}</span>
                  </div>
                  <p className="text-xs text-[#3D4A3B] line-clamp-2 leading-relaxed font-normal">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>

          </div>
        ) : (
          /* ================================================================= */
          /* CASE 2: CONVERSATION THREAD (When messages exist)                 */
          /* Clean, spacious conversational feed with sticky bottom prompt bar  */
          /* ================================================================= */
          <div className="flex-1 flex flex-col justify-between animate-fade-in">
            
            {/* Thread Header Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DCE5DC]">
              <div className="flex items-center gap-3">
                <FarmIQStarburst className="w-6 h-6 text-[#D97746] shrink-0" />
                <span className="font-serif text-lg font-medium text-[#153D2B]">
                  Back at it, {userName}
                </span>
                {selectedFarm && (
                  <span className="hidden sm:inline-flex text-[11px] font-bold text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                    {selectedFarm.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-3.5 py-1.5 rounded-full border border-[#DCE5DC] bg-white text-xs font-bold text-[#3D4A3B] hover:text-[#BA1A1A] hover:bg-rose-50 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Start a new chat session"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Conversation</span>
              </button>
            </div>

            {/* Provider note if fallback is active */}
            {providerNote && (
              <div className="mb-4 text-[11px] text-[#895100] font-bold bg-[#FFF6EB] border border-[#FFE0B2] rounded-xl px-3.5 py-2">
                {providerNote}
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 space-y-6 pb-28">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar: Starburst Leaf Emblem */}
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-2xl bg-white border border-[#DCE5DC] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs text-[#D97746]">
                      <FarmIQStarburst className="w-5 h-5 text-[#D97746]" />
                    </div>
                  )}

                  {/* Message Container */}
                  <div className={`max-w-2xl space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    
                    {/* User Attached Image (if present) */}
                    {msg.sender === 'user' && msg.attachedImage && (
                      <div className="flex justify-end mb-1.5">
                        <img
                          src={msg.attachedImage}
                          alt="Uploaded Leaf Sample"
                          className="w-48 h-36 object-cover rounded-2xl border border-[#DCE5DC] shadow-xs"
                        />
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`p-4 sm:p-5 text-sm leading-relaxed text-left ${
                        msg.sender === 'user'
                          ? 'bg-[#153D2B] text-white rounded-3xl rounded-tr-md shadow-xs font-medium'
                          : 'bg-white border border-[#DCE5DC] rounded-3xl rounded-tl-md text-[#1C2922] shadow-bento'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <p className="whitespace-pre-line">{msg.text}</p>
                      ) : (
                        <FormattedAssistantContent text={msg.text} />
                      )}

                      {/* Safety Advisory Banner (ADR-006) */}
                      {msg.responseMeta?.warnings && msg.responseMeta.warnings.length > 0 && (
                        <div className="mt-3.5 p-3.5 rounded-2xl bg-[#FFF6EB] border border-[#FFE0B2] text-xs text-[#895100] space-y-1">
                          <div className="flex items-center gap-1.5 font-extrabold text-[#5d3500]">
                            <AlertTriangle className="w-4 h-4 text-[#FD9D1A]" />
                            <span>Agricultural Safety Advisory:</span>
                          </div>
                          {msg.responseMeta.warnings.map((w, i) => (
                            <p key={i} className="font-medium">• {w}</p>
                          ))}
                        </div>
                      )}

                      {/* Cited Sources & Grounding */}
                      {msg.responseMeta?.sources && msg.responseMeta.sources.length > 0 && (
                        <div className="mt-3.5 pt-3.5 border-t border-[#DCE5DC] space-y-2">
                          <p className="text-[11px] font-extrabold text-[#3D4A3B] uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-[#1BC447]" />
                            <span>Verified Sources:</span>
                          </p>
                          <div className="space-y-2">
                            {msg.responseMeta.sources.map((source, idx) => (
                              <div
                                key={`${source.sourceId ?? source.sourceLabel}-${idx}`}
                                className="bg-[#F8FAF8] p-3 rounded-2xl border border-[#DCE5DC] text-[11px] space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between font-bold text-[#1C2922]">
                                  <span>{source.sourceLabel}</span>
                                  {source.url && (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#153D2B] hover:text-[#1BC447] font-bold flex items-center gap-0.5"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3 h-3 text-[#1BC447]" />
                                    </a>
                                  )}
                                </div>
                                {source.excerpt && (
                                  <p className="italic text-[#3D4A3B] bg-white p-2 rounded-xl border border-[#DCE5DC] line-clamp-3">
                                    &ldquo;{source.excerpt}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence Limitations */}
                      {msg.responseMeta?.limitations && msg.responseMeta.limitations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.responseMeta.limitations.map((limitation, i) => (
                            <div key={i} className="text-[10px] text-[#3D4A3B] italic flex items-start gap-1">
                              <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                              <span>Limitation: {limitation}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assistant Actions Bar: Copy button */}
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                          <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-stone-500 hover:text-[#153D2B] hover:bg-stone-50 transition-colors"
                            title="Copy answer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-[#1BC447]" />
                                <span className="text-[#1BC447] font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <span className="block text-[10px] text-[#3D4A3B] font-semibold px-2">
                        {msg.timestamp}
                      </span>
                    )}

                    {/* Follow-up suggestions */}
                    {msg.sender === 'assistant' &&
                      msg.id === lastAssistantId &&
                      !isTyping &&
                      (msg.responseMeta?.followUps?.length ?? 0) > 0 && (
                        <div className="space-y-1.5 mt-2">
                          <p className="text-[11px] font-extrabold text-[#3D4A3B] uppercase tracking-wider px-1">
                            You might also ask:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.responseMeta!.followUps.map((followUp, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSend(followUp)}
                                className="text-xs px-3.5 py-1.5 rounded-full border border-[#DCE5DC] bg-white text-[#153D2B] font-bold hover:border-[#1BC447] hover:bg-[#EDF6ED] transition-smooth text-left shadow-2xs"
                              >
                                {followUp}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                  </div>

                  {/* User Avatar */}
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-2xl bg-[#1BC447] text-[#1C2922] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-glow-lime">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 items-center text-xs text-[#3D4A3B] font-semibold italic animate-fade-in">
                  <div className="w-8 h-8 rounded-2xl bg-white border border-[#DCE5DC] text-[#D97746] flex items-center justify-center shadow-2xs">
                    <FarmIQStarburst className="w-5 h-5 text-[#D97746] animate-spin" />
                  </div>
                  <span>Consulting FarmIQ knowledge base...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pinned Sticky Bottom Input Bar (Same Claude Light Style) */}
            <div className="sticky bottom-0 bg-gradient-to-t from-[#F3FCF3] via-[#F3FCF3]/95 to-transparent pt-4 pb-2">
              <div className="bg-white rounded-3xl border border-[#DCE5DC] shadow-floating p-3 sm:p-4 transition-all focus-within:ring-4 focus-within:ring-[#1BC447]/15 focus-within:border-[#1BC447]">
                
                {/* Attached Image Thumbnail */}
                {attachedImage && (
                  <div className="flex items-center gap-2 mb-2 p-1.5 px-3 bg-[#EDF6ED] border border-[#DCE5DC] rounded-xl w-fit">
                    <img
                      src={attachedImage.preview}
                      alt="Crop Attachment"
                      className="w-6 h-6 object-cover rounded-md"
                    />
                    <span className="text-xs font-bold text-[#153D2B] max-w-[200px] truncate">
                      {attachedImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="text-stone-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="How can I help you today?"
                  rows={1}
                  className="w-full bg-transparent resize-none outline-none text-sm text-[#1C2922] placeholder:text-stone-400 font-normal min-h-[44px] px-1 py-1 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPlusMenuOpen((prev) => !prev)}
                      className="w-7 h-7 rounded-full border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-900 flex items-center justify-center hover:bg-stone-50 transition-colors"
                      title="Attach crop photo"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>

                    {plusMenuOpen && (
                      <div className="absolute left-0 bottom-9 w-60 bg-white border border-[#DCE5DC] rounded-2xl shadow-floating p-2 z-40 animate-scale-in">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#EDF6ED] hover:text-[#153D2B] flex items-center gap-2 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#1BC447]" />
                          <span>Attach Crop Leaf Photo</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isListening
                          ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                      }`}
                      title={isListening ? 'Listening...' : 'Voice dictation'}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={(!inputText.trim() && !attachedImage) || isTyping}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        inputText.trim() || attachedImage
                          ? 'bg-[#153D2B] hover:bg-[#1BC447] text-white hover:text-[#1C2922] shadow-sm cursor-pointer'
                          : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.4]" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Context pills in active thread */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 px-3 pt-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sprout className="w-3 h-3 text-[#1BC447]" />
                  <span>{selectedFarm ? selectedFarm.name : 'All Landholdings'}</span>
                  <span>•</span>
                  <span>{activeScope.label}</span>
                </span>
                <span className="text-[#153D2B] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#1BC447]" />
                  <span>Verified Agricultural Grounding</span>
                </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
