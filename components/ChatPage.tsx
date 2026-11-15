"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import "./farmiq-chat.css";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Mode = "ask" | "plan";
type MenuName = "plus" | "ctx" | null;
type ActionState = "mic" | "send" | "stop" | "rec";
type BotStatus = "typing" | "streaming" | "done" | "stopped" | "error";

export interface Attachment {
  name: string;
  size?: number;
  type?: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  files?: string[];
  attachments?: Attachment[];
  status?: BotStatus;
}

export interface ChatPageProps {
  /** Your chat endpoint. It must stream plain text. Leave empty to run the demo reply. */
  apiUrl?: string;
  /** Fields the user can pick from. */
  fields?: string[];
  /** Speech recognition language, e.g. "en-US". */
  language?: string;
  /** Suggestion chips shown on the empty screen. */
  suggestions?: string[];
  /** Optional title override. */
  title?: string;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

let counter = 0;
const nextId = () => String(++counter);

const ACTION_LABEL: Record<ActionState, string> = {
  mic: "Voice input",
  send: "Send message",
  stop: "Stop response",
  rec: "Stop recording",
};

const PLACEHOLDER: Record<Mode, string> = {
  ask: "How can I help you with your crops today?",
  plan: "Describe what you want to plan for this season…",
};

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

interface RequestData {
  message: string;
  mode: Mode;
  field: string;
  files: File[];
}

/** Sends the message to your server and calls onChunk with each piece of streamed text. */
async function streamFromApi(
  url: string,
  data: RequestData,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
) {
  let init: RequestInit;
  if (data.files.length) {
    const form = new FormData();
    form.append("message", data.message);
    form.append("mode", data.mode);
    form.append("field", data.field);
    data.files.forEach((f) => form.append("files", f));
    init = { method: "POST", body: form, signal };
  } else {
    init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: data.message, mode: data.mode, field: data.field }),
      signal,
    };
  }
  const res = await fetch(url, init);
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

const DEMO_REPLY =
  "This is a demo reply. Pass an apiUrl prop to ChatPage and the real answer from Farm IQ will stream in here.";

async function demoStream(signal: AbortSignal, onChunk: (chunk: string) => void) {
  await sleep(1600, signal);
  for (const word of DEMO_REPLY.split(" ")) {
    onChunk(word + " ");
    await sleep(45, signal);
  }
}

/* ------------------------------------------------------------------ */
/* Brand pieces                                                        */
/* ------------------------------------------------------------------ */

function Sprout({ size = 32, still = false, onDark = false }: { size?: number; still?: boolean; onDark?: boolean }) {
  return (
    <span
      className={`fl${still ? " still" : ""}${onDark ? " on-dark" : ""}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      <i className="gd" />
      <i className="st" />
      <i className="lf l1" />
      <i className="lf l2" />
    </span>
  );
}

function Typing() {
  return (
    <span className="fiq-typing" role="status" aria-label="Farm IQ is typing">
      <i />
      <i />
      <i />
    </span>
  );
}

function Icon({ children, className = "i" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
const MicIcon = () => (
  <Icon className="i m">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </Icon>
);
const ArrowUpIcon = () => (
  <Icon className="i s">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
);
const XIcon = ({ className = "i" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
const ChevronIcon = () => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
const ChatIcon = () => (
  <Icon>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Icon>
);
const PlanIcon = () => (
  <Icon>
    <path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" />
  </Icon>
);
const ImageIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </Icon>
);
const CameraIcon = () => (
  <Icon>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </Icon>
);
const FileIcon = () => (
  <Icon>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <path d="M14 2v6h6" />
  </Icon>
);
const PaperclipIcon = () => (
  <Icon>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </Icon>
);

/* ------------------------------------------------------------------ */
/* Rich Markdown Message List                                         */
/* ------------------------------------------------------------------ */

function renderInline(text: string, isStreaming = false): ReactNode {
  // Regex to match **bold**, *italic*, [markdown links](url), and bare https:// URLs
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>)"]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="fiq-bold">
          {renderInline(inner, isStreaming)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="fiq-em">
          {inner}
        </em>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="fiq-link"
        >
          {linkMatch[1]}
        </a>
      );
    }

    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="fiq-link"
        >
          {part}
        </a>
      );
    }

    if (isStreaming) {
      return part.split(/(\s+)/).map((w, wi) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <span className="fiq-w" key={`${index}-${wi}`}>
            {w}
          </span>
        )
      );
    }

    return part;
  });
}

function BotText({ text, isStreaming = false }: { text: string; isStreaming?: boolean }) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let isNumbered = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const items = listItems.map((item, idx) => (
        <li key={idx} className="fiq-li">
          {renderInline(item, isStreaming)}
        </li>
      ));
      if (isNumbered) {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="fiq-num-list">
            {items}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="fiq-list">
            {items}
          </ul>
        );
      }
      listItems = [];
      isNumbered = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Safety Advisory callout card
    if (trimmed.startsWith('⚠️ Agricultural Safety Advisory') || trimmed.startsWith('⚠️ Safety:')) {
      flushList();
      blocks.push(
        <div key={`adv-${i}`} className="fiq-advisory">
          <div className="fiq-advisory-badge">⚠️ Agricultural Safety Advisory</div>
          <p>{trimmed.replace(/^⚠️\s*(?:Agricultural Safety Advisory:?)?\s*/, '')}</p>
        </div>
      );
      continue;
    }

    // Sources Header
    if (trimmed.startsWith('Verified Sources:')) {
      flushList();
      blocks.push(
        <div key={`src-${i}`} className="fiq-sources-header">
          🌱 <strong>Verified Agronomic Sources:</strong>
        </div>
      );
      continue;
    }

    // Bullet item (- item, * item, • item)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (isNumbered) flushList();
      listItems.push(bulletMatch[1]);
      continue;
    }

    // Numbered item (1. item, 2. item)
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (!isNumbered) flushList();
      isNumbered = true;
      listItems.push(numMatch[1]);
      continue;
    }

    // Headings (### Title or **Title:**)
    const headingMatch = trimmed.match(/^(?:###\s*|\*\*)([^*#]+)\*\*?:?$/);
    if (headingMatch && trimmed.length < 90) {
      flushList();
      blocks.push(
        <h4 key={`h-${i}`} className="fiq-h4">
          {headingMatch[1].replace(/:$/, '')}
        </h4>
      );
      continue;
    }

    flushList();

    blocks.push(
      <p key={`p-${i}`} className="fiq-p">
        {renderInline(trimmed, isStreaming)}
      </p>
    );
  }

  flushList();

  return <div className="fiq-bot-content">{blocks}</div>;
}

function MessageRow({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="row me">
        <div className="bub">
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="msg-attachments">
              {msg.attachments.map((att, idx) =>
                att.url && (att.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(att.name)) ? (
                  <div key={idx} className="msg-att-img-wrap">
                    <img src={att.url} alt={att.name} className="msg-att-img" />
                    <span className="msg-att-caption">{att.name}</span>
                  </div>
                ) : (
                  <div key={idx} className="msg-att-doc">
                    <span className="msg-att-doc-icon"><FileIcon /></span>
                    <div className="msg-att-doc-text">
                      <span className="msg-att-doc-name">{att.name}</span>
                      {att.size ? <span className="msg-att-doc-size">{(att.size / 1024).toFixed(0)} KB</span> : null}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
          {msg.text && <div className="msg-user-text">{msg.text}</div>}
          {!msg.attachments && msg.files && msg.files.length > 0 && (
            <small>Attached: {msg.files.join(", ")}</small>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="row bot">
      <div className="bot-avatar" aria-hidden="true">
        <img src="/brand/logo-icon.png" alt="FarmIQ" className="bot-logo-img" />
      </div>
      <div className="bub">
        {msg.status === "typing" ? (
          <Typing />
        ) : (
          <BotText text={msg.text} isStreaming={msg.status === "streaming"} />
        )}
        {msg.status === "stopped" && <small className="fiq-stopped">Response stopped.</small>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ChatPage({
  apiUrl,
  fields = ["All fields", "North field", "South field"],
  language = "en-US",
  suggestions = [
    "🌦️ Will it rain this week?",
    "🔬 Why are my tomato leaves yellowing?",
    "📅 Plan this month’s sowing schedule",
    "🧪 What is the optimal soil pH for winter wheat?",
    "📈 Check APMC Mandi wholesale prices"
  ],
  title,
}: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<Mode>("ask");
  const [field, setField] = useState(fields[0]);
  const [menu, setMenu] = useState<MenuName>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recogRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const state: ActionState = busy ? "stop" : listening ? "rec" : text.trim() || files.length ? "send" : "mic";

  /* Grow the text box with its content */
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [text]);

  /* Keep the newest message in view */
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* Close menus on outside click or Escape */
  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (!dockRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onClick as EventListener);
    document.addEventListener("touchstart", onClick as EventListener);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick as EventListener);
      document.removeEventListener("touchstart", onClick as EventListener);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  /* Stop everything if the page is closed */
  useEffect(
    () => () => {
      abortRef.current?.abort();
      recogRef.current?.stop();
    },
    [],
  );

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const array = Array.from(list);
    if (array.length === 0) return;
    setFiles((prev) => [...prev, ...array].slice(0, 5));
    array.forEach((f) => {
      if (f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(f.name)) {
        try {
          const url = URL.createObjectURL(f);
          setPreviews((p) => ({ ...p, [f.name]: url }));
        } catch {}
      }
    });
    setMenu(null);
    taRef.current?.focus();
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const removed = prev[idx];
      if (removed && previews[removed.name]) {
        try {
          URL.revokeObjectURL(previews[removed.name]);
        } catch {}
        setPreviews((p) => {
          const next = { ...p };
          delete next[removed.name];
          return next;
        });
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const send = useCallback(
    async (override?: string) => {
      const content = (override ?? text).trim();
      if ((!content && files.length === 0) || busy) return;

      const sentFiles = files;
      const sentAttachments: Attachment[] = sentFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: previews[f.name],
      }));

      const botId = nextId();
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "user",
          text: content || (sentFiles.length > 0 ? "Attached photos & files for agronomic diagnosis:" : "Please look at this."),
          files: sentFiles.map((f) => f.name),
          attachments: sentAttachments,
        },
        { id: botId, role: "bot", text: "", status: "typing" },
      ]);
      setText("");
      setFiles([]);
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const patch = (p: Partial<Message>) =>
        setMessages((m) => m.map((x) => (x.id === botId ? { ...x, ...p } : x)));

      try {
        let acc = "";
        const onChunk = (chunk: string) => {
          acc += chunk;
          patch({ text: acc, status: "streaming" });
        };
        if (apiUrl) {
          await streamFromApi(apiUrl, { message: content, mode, field, files: sentFiles }, ctrl.signal, onChunk);
        } else {
          await demoStream(ctrl.signal, onChunk);
        }
        patch({ status: "done" });
      } catch (err) {
        if ((err as Error).name === "AbortError") patch({ status: "stopped" });
        else patch({ text: "Something went wrong. Please try again.", status: "error" });
      } finally {
        setBusy(false);
        abortRef.current = null;
        taRef.current?.focus({ preventScroll: true });
      }
    },
    [apiUrl, busy, field, files, mode, text],
  );

  const toggleVoice = () => {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      window.alert("Voice input is not supported in this browser.");
      return;
    }
    const recog = new SR();
    recog.lang = language;
    recog.interimResults = false;
    recog.onresult = (e: { results: { 0: { 0: { transcript: string } } } }) => {
      const heard = e.results[0][0].transcript;
      setText((t) => (t ? `${t} ` : "") + heard);
    };
    recog.onend = () => {
      setListening(false);
      taRef.current?.focus();
    };
    recog.onerror = () => setListening(false);
    recogRef.current = recog;
    setListening(true);
    recog.start();
  };

  const onAction = () => {
    if (state === "send") void send();
    else if (state === "stop") abortRef.current?.abort();
    else toggleVoice();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFiles(e.clipboardData.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className={`app ${messages.length === 0 ? "is-empty" : "has-messages"}${isDragging ? " is-dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fiq-drop-overlay">
          <div className="drop-card">
            <ImageIcon />
            <h3>Drop crop photos or files here</h3>
            <p>Support for JPG, PNG, WebP, PDF, CSV, and text notes</p>
          </div>
        </div>
      )}
      <div id="msgs" ref={logRef} role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="hero">
            <div className="hero-badge">
              <img src="/brand/logo-icon.png" alt="FarmIQ" className="hero-logo-img" />
            </div>
            <h1>{title || "What’s growing today?"}</h1>
            <p className="hero-sub">
              Ask FarmIQ about crop pathology, soil nutrients, weather forecasts, or seasonal field planning.
            </p>

            <div className="sugs">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="sug"
                  type="button"
                  onClick={() => {
                    const cleanText = s.replace(/^[^\w\s]+\s*/, '');
                    setText(cleanText);
                    taRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageRow key={m.id} msg={m} />)
        )}
      </div>

      <div className="dock" ref={dockRef}>
        <div className={`composer${state === "rec" ? " rec" : ""}`}>
          {files.length > 0 && (
            <div className="atts">
              {files.map((f, i) => (
                <span className="att" key={`${f.name}-${i}`}>
                  {previews[f.name] ? (
                    <img src={previews[f.name]} alt={f.name} className="att-thumb-img" />
                  ) : (
                    <span className="th"><FileIcon /></span>
                  )}
                  <span className="att-info">
                    <span className="att-name">{f.name}</span>
                    <span className="att-size">{(f.size / 1024).toFixed(0)} KB</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeFile(i)}
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="field">
            <textarea
              ref={taRef}
              rows={1}
              value={text}
              placeholder={PLACEHOLDER[mode]}
              aria-label="Message"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
            />
            <div className="wave" aria-hidden="true">
              <b>
                <i />
                <i />
                <i />
                <i />
                <i />
              </b>
              Listening…
            </div>
          </div>

          <div className="tools">
            <button
              className="ic"
              type="button"
              aria-label="More attachment options"
              title="More attachment options"
              aria-haspopup="menu"
              aria-expanded={menu === "plus"}
              onClick={() => setMenu(menu === "plus" ? null : "plus")}
            >
              <PlusIcon />
            </button>

            <button
              className="ic"
              type="button"
              aria-label="Attach crop photo"
              title="Attach photo of crops, leaves, or soil"
              onClick={() => photoRef.current?.click()}
            >
              <ImageIcon />
            </button>

            <button
              className="ic"
              type="button"
              aria-label="Attach document or file"
              title="Attach document, field report, or CSV"
              onClick={() => docRef.current?.click()}
            >
              <PaperclipIcon />
            </button>

            <div className="seg" role="radiogroup" aria-label="Mode">
              <button type="button" role="radio" aria-checked={mode === "ask"} onClick={() => setMode("ask")}>
                <ChatIcon />
                <span>Ask</span>
              </button>
              <button type="button" role="radio" aria-checked={mode === "plan"} onClick={() => setMode("plan")}>
                <PlanIcon />
                <span>Plan</span>
              </button>
            </div>

            <button
              className="ctx"
              type="button"
              aria-label="Choose field"
              aria-haspopup="menu"
              aria-expanded={menu === "ctx"}
              onClick={() => setMenu(menu === "ctx" ? null : "ctx")}
            >
              <i className="dot" />
              <span className="t">{field}</span>
              <ChevronIcon />
            </button>

            <span className="grow" />

            <button className="act" type="button" data-state={state} aria-label={ACTION_LABEL[state]} onClick={onAction}>
              <MicIcon />
              <ArrowUpIcon />
              <XIcon className="i r" />
              <Sprout size={22} onDark />
            </button>
          </div>

          {menu === "plus" && (
            <div className="menu" role="menu">
              <button type="button" role="menuitem" onClick={() => photoRef.current?.click()}>
                <ImageIcon />
                <span>Photo of a crop</span>
              </button>
              <button type="button" role="menuitem" onClick={() => cameraRef.current?.click()}>
                <CameraIcon />
                <span>Take a photo with camera</span>
              </button>
              <button type="button" role="menuitem" onClick={() => docRef.current?.click()}>
                <FileIcon />
                <span>Upload document (PDF, CSV, TXT)</span>
              </button>
            </div>
          )}

          {menu === "ctx" && (
            <div className="menu r" role="menu">
              {fields.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="menuitemradio"
                  aria-checked={f === field}
                  onClick={() => {
                    setField(f);
                    setMenu(null);
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={docRef} type="file" accept=".pdf,.csv,.txt,.json,.doc,.docx" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </div>

        <p className="fine">Farm IQ can make mistakes. Check important advice.</p>
      </div>
    </div>
  );
}
