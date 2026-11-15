'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Info,
  Trash2
} from 'lucide-react';

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
  responseMeta?: AssistantMessageData;
}

const SAMPLE_PROMPTS = [
  "What is the optimal soil pH for winter wheat?",
  "How do I identify and manage early blight in tomatoes?",
  "What are the crop water requirements and ET0 irrigation guidelines?",
  "What chemical pesticide dosage should I spray for blight?", // Tests ADR-006 safety gate
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'init-01',
  sender: 'assistant',
  text: "Hello! I am your FarmIQ Agronomy Assistant. I can help answer questions about crop management, soil health, irrigation schedules, and plant health. How can I assist with your farm today?",
  timestamp: 'Just now',
};

function now(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [providerNote, setProviderNote] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: now(),
    };

    const history = messages.slice(-4).map((msg) => ({ role: msg.sender, content: msg.text }));
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || 'Request failed');
      }

      const data = payload.data as AssistantMessageData;
      if (data.providerConfigured && !data.providerConfigured.generation) {
        setProviderNote(
          'Operating in local agronomy mode — answers are verified extracts from the approved agronomic knowledge base.'
        );
      } else if (data.limitations.some((line) => line.includes('extractive summary'))) {
        setProviderNote(
          'Operating in local agronomy mode — answering from the verified agronomic knowledge base.'
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
        text: 'I could not reach the FarmIQ knowledge base just now. Please try again in a moment.',
        timestamp: now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: "Conversation cleared. Ready for your next farming question.",
        timestamp: 'Just now',
      },
    ]);
    setProviderNote(null);
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.sender === 'assistant')?.id;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header with Trust Contract Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">AI Agricultural Assistant</h2>
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Live AI answers. Sources cited when the knowledge base matches; general knowledge clearly labeled otherwise.
            </p>
            {providerNote && (
              <p className="text-[11px] text-[#895100] mt-2 font-bold bg-[#FFF6EB] border border-[#FFE0B2] rounded-xl px-3 py-1.5 inline-block">
                {providerNote}
              </p>
            )}
          </div>
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-full border border-[#DCE5DC] bg-[#EDF6ED] text-xs font-bold text-[#3D4A3B] hover:text-[#BA1A1A] hover:bg-rose-50 flex items-center gap-1.5 transition-colors self-start sm:self-center"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Thread</span>
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-[#3D4A3B] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#1BC447]" />
            <span>Suggested Inquiries (Click to evaluate):</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className={`text-xs px-4 py-2 rounded-full border text-left transition-smooth font-bold ${
                  idx === 3
                    ? 'bg-[#FFF6EB] border-[#FFE0B2] text-[#895100] hover:bg-[#FFE0B2]'
                    : 'bg-white border-[#DCE5DC] text-[#1C2922] hover:border-[#1BC447] hover:bg-[#EDF6ED]'
                }`}
              >
                {idx === 3 ? '⚠️ Safety Gate: ' : ''}{prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window Bento Card */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] shadow-bento flex flex-col h-[620px] overflow-hidden">

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-[#153D2B] text-[#1BC447] flex items-center justify-center shrink-0 mt-1 shadow-sm border border-[#1C4D37]">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>

                  {/* Message Bubble */}
                  <div
                    className={`inline-block p-5 rounded-3xl text-sm leading-relaxed text-left ${
                      msg.sender === 'user'
                        ? 'bg-[#153D2B] text-white rounded-tr-sm shadow-xs'
                        : 'bg-[#F3FCF3] border border-[#DCE5DC] text-[#1C2922] rounded-tl-sm'
                    }`}
                  >
                    <p className="font-medium whitespace-pre-line">{msg.text}</p>

                    {/* Warnings (Safety Gates) */}
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

                    {/* Knowledge Sources */}
                    {msg.responseMeta?.sources && msg.responseMeta.sources.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-[#DCE5DC] space-y-2">
                        <p className="text-[11px] font-extrabold text-[#3D4A3B] uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#1BC447]" />
                          <span>Sources:</span>
                        </p>
                        <div className="space-y-2">
                          {msg.responseMeta.sources.map((source, idx) => (
                            <div
                              key={`${source.sourceId ?? source.sourceLabel}-${idx}`}
                              className="bg-white p-3 rounded-2xl border border-[#DCE5DC] text-[11px] space-y-1 shadow-xs"
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
                                <p className="italic text-[#3D4A3B] bg-[#EDF6ED] p-2 rounded-xl border border-[#DCE5DC] line-clamp-3">
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

                  </div>

                  <span className="block text-[10px] text-[#3D4A3B] font-semibold px-2">{msg.timestamp}</span>

                  {/* Suggested follow-up questions (spec layer 6) */}
                  {msg.sender === 'assistant' &&
                    msg.id === lastAssistantId &&
                    !isTyping &&
                    (msg.responseMeta?.followUps?.length ?? 0) > 0 && (
                    <div className="space-y-1.5 mt-1">
                      <p className="text-[11px] font-extrabold text-[#3D4A3B] uppercase tracking-wider px-1">
                        You might also ask:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.responseMeta!.followUps.map((followUp, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(followUp)}
                            className="text-xs px-3.5 py-1.5 rounded-full border border-[#DCE5DC] bg-white text-[#153D2B] font-bold hover:border-[#1BC447] hover:bg-[#EDF6ED] transition-smooth text-left"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-[#1BC447] text-[#1C2922] font-black text-xs flex items-center justify-center shrink-0 mt-1 shadow-glow-lime">
                    You
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-xs text-[#3D4A3B] font-semibold italic">
                <div className="w-8 h-8 rounded-2xl bg-[#153D2B] text-[#1BC447] flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span>Checking FarmIQ knowledge base...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-5 bg-[#F3FCF3] border-t border-[#DCE5DC]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a farming question (e.g. soil pH, blight prevention, irrigation)..."
                className="flex-1 px-5 py-3.5 rounded-full border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-sm text-[#1C2922] bg-white shadow-xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="px-6 py-3.5 rounded-full bg-[#1BC447] hover:bg-[#16a73c] disabled:opacity-50 text-[#1C2922] font-extrabold text-sm shadow-glow-lime transition-smooth flex items-center gap-2 shrink-0"
              >
                <span>Send</span>
                <Send className="w-4 h-4 text-[#1C2922]" />
              </button>
            </form>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#3D4A3B] px-1 font-medium">
              <span>FarmIQ Assistant • Live AI answers with cited sources when available.</span>
              <span className="text-[#153D2B] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1BC447]" />
                <span>Agricultural Safety Standard</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
