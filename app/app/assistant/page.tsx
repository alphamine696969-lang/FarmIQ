'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { generateAssistantResponse, GroundedAssistantResponse } from '@/lib/services/assistantService';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responseMeta?: GroundedAssistantResponse;
}

const SAMPLE_PROMPTS = [
  "What is the optimal soil pH for winter wheat?",
  "How do I identify and manage early blight in tomatoes?",
  "What are the crop water requirements and ET0 irrigation guidelines?",
  "What chemical pesticide dosage should I spray for blight?", // Tests ADR-006 safety gate
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-01',
      sender: 'assistant',
      text: "Hello! I am the FarmIQ Grounded Agricultural Assistant. All my responses are strictly grounded in peer-reviewed scientific sources (FAO, USDA, CGIAR, ICAR). In compliance with FarmIQ Trust Principles (ADR-006), I provide evidence-based cultural practices and abstain from unverified synthetic chemical dosages. How can I assist your farm today?",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAssistantResponse(query);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseMeta: response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'init-01',
        sender: 'assistant',
        text: "Conversation cleared. Ready for your next agricultural question.",
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Header with Trust Contract Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">AI Agricultural Assistant</h2>
              <FreshnessBadge status="supported" label="Grounded RAG (ADR-006)" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">Grounded in validated FAO 56, USDA AMS, CGIAR, and ICAR extension handbooks.</p>
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
                    <p className="font-medium">{msg.text}</p>

                    {/* Grounded steps */}
                    {msg.responseMeta?.steps && msg.responseMeta.steps.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-[#DCE5DC] space-y-2">
                        <p className="text-xs font-extrabold text-[#153D2B] uppercase tracking-wider">
                          Evidence-Backed Next Steps:
                        </p>
                        <ul className="space-y-2 text-xs text-[#1C2922]">
                          {msg.responseMeta.steps.map((st, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0 mt-0.5" />
                              <span className="font-medium">{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings (Safety Gates) */}
                    {msg.responseMeta?.warnings && msg.responseMeta.warnings.length > 0 && (
                      <div className="mt-3.5 p-3.5 rounded-2xl bg-[#FFF6EB] border border-[#FFE0B2] text-xs text-[#895100] space-y-1">
                        <div className="flex items-center gap-1.5 font-extrabold text-[#5d3500]">
                          <AlertTriangle className="w-4 h-4 text-[#FD9D1A]" />
                          <span>Safety Gate & Regulatory Notice (ADR-006):</span>
                        </div>
                        {msg.responseMeta.warnings.map((w, i) => (
                          <p key={i} className="font-medium">• {w}</p>
                        ))}
                      </div>
                    )}

                    {/* Source Citations */}
                    {msg.responseMeta?.citations && msg.responseMeta.citations.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-[#DCE5DC] space-y-2">
                        <p className="text-[11px] font-extrabold text-[#3D4A3B] uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#1BC447]" />
                          <span>Verified Scientific Citations:</span>
                        </p>
                        <div className="space-y-2">
                          {msg.responseMeta.citations.map((c) => (
                            <div
                              key={c.sourceId}
                              className="bg-white p-3 rounded-2xl border border-[#DCE5DC] text-[11px] space-y-1 shadow-xs"
                            >
                              <div className="flex items-center justify-between font-bold text-[#1C2922]">
                                <span>{c.sourceName}</span>
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#153D2B] hover:text-[#1BC447] font-bold flex items-center gap-0.5"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3 text-[#1BC447]" />
                                </a>
                              </div>
                              <p className="text-[#3D4A3B] text-[10px]">Section: {c.section}</p>
                              {c.excerpt && (
                                <p className="italic text-[#3D4A3B] bg-[#EDF6ED] p-2 rounded-xl border border-[#DCE5DC]">"{c.excerpt}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence Limitations */}
                    {msg.responseMeta?.limitations && (
                      <div className="mt-2 text-[10px] text-[#3D4A3B] italic flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Evidence Limitation: {msg.responseMeta.limitations}</span>
                      </div>
                    )}

                  </div>

                  <span className="block text-[10px] text-[#3D4A3B] font-semibold px-2">{msg.timestamp}</span>
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
                <span>Retrieving verified documents and validating citations...</span>
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
                placeholder="Ask an agronomic question (e.g. soil pH, blight prevention, irrigation)..."
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
              <span>FarmIQ RAG Engine v2.0 • Citations mathematically verified against indexed registries.</span>
              <span className="text-[#153D2B] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1BC447]" />
                <span>ADR-006 Safety Protocol</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
