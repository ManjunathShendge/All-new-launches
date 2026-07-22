"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Send, Bot, User } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const BOT_SRC =
  "https://lottie.host/1be148aa-e44f-45f2-a668-c15c1011ae0f/xXOXvSQOP0.lottie";

type QA = { q: string; a: React.ReactNode; keywords: string[] };

/**
 * FAQ knowledge base distilled from the homepage (hero, services, FAQ, contact).
 * `keywords` widen matching so free-typed questions still resolve to an answer.
 */
const KNOWLEDGE: QA[] = [
  {
    q: "What is All New Launches?",
    a: "All New Launches is your trusted channel partner for premium residential and commercial property across India — 50,000+ verified homes, from luxury apartments and villas to gated communities and investment opportunities.",
    keywords: ["about", "who", "what", "company", "allnewlaunches", "platform"],
  },
  {
    q: "How do I search for properties?",
    a: "Enter your location, property type and budget in the homepage search, then use the advanced filters (amenities, size and more) to narrow it down.",
    keywords: ["search", "find", "filter", "look", "browse", "property", "properties", "home", "flat", "apartment"],
  },
  {
    q: "Are the listed properties verified?",
    a: "Premium listings pass a strict verification process and carry a 'Verified' badge. We also monitor standard listings and let users report anything suspicious.",
    keywords: ["verified", "verify", "genuine", "authentic", "trust", "rera", "fake", "scam"],
  },
  {
    q: "Is it free to list my property?",
    a: "Yes — basic listings are completely free. We also offer premium packages for greater visibility and faster lead generation.",
    keywords: ["list", "listing", "post", "sell", "free", "cost", "add property", "owner", "agent"],
  },
  {
    q: "How does the home loan process work?",
    a: (
      <>
        We partner with top banks so you can check eligibility and apply once
        you&apos;ve shortlisted a property. See{" "}
        <Link href="/services" className="font-medium text-blue-300 underline">
          Services → Loan at Best Rate
        </Link>
        .
      </>
    ),
    keywords: ["loan", "home loan", "finance", "emi", "mortgage", "interest", "rate", "bank", "eligibility", "credit"],
  },
  {
    q: "Can I schedule a site visit?",
    a: "Absolutely! Use the 'Schedule Visit' button on any property page to pick a date and time — the agent or owner will confirm your appointment.",
    keywords: ["visit", "site visit", "tour", "see", "schedule", "appointment", "book", "viewing"],
  },
  {
    q: "What are your fees for buying or selling?",
    a: "We don't charge brokerage for standard interactions. Fees apply only if you opt for our premium concierge or legal assistance services.",
    keywords: ["fee", "fees", "charge", "brokerage", "commission", "cost", "price", "pay"],
  },
  {
    q: "What services do you offer?",
    a: (
      <>
        End-to-end: buy, sell &amp; rent property, home loans at the best rates,
        interior design and legal support. Explore{" "}
        <Link href="/services" className="font-medium text-blue-300 underline">
          all services
        </Link>
        .
      </>
    ),
    keywords: ["service", "services", "offer", "do", "help", "rent", "buy", "sell", "interior", "legal", "design"],
  },
  {
    q: "How can I contact you?",
    a: (
      <>
        Call{" "}
        <a href="tel:+919118404041" className="font-medium text-blue-300 underline">
          +91 91184 04041
        </a>
        , email sales@allnewlaunches.com, or{" "}
        <Link href="/contact" className="font-medium text-blue-300 underline">
          send an enquiry
        </Link>
        .
      </>
    ),
    keywords: ["contact", "call", "phone", "email", "reach", "support", "talk", "number", "enquiry", "inquiry"],
  },
];

const FALLBACK: React.ReactNode = (
  <>
    I&apos;m not sure about that one yet. Try rephrasing, tap a suggested
    question, or{" "}
    <Link href="/contact" className="font-medium text-blue-300 underline">
      contact our team
    </Link>{" "}
    — we&apos;re happy to help.
  </>
);

type Msg = { role: "bot" | "user"; content: React.ReactNode };

const GREETING: Msg = {
  role: "bot",
  content: "Hi! 👋 How can I help you today?",
};

/** Match a free-typed message to the best answer (token + keyword overlap). */
function answerFor(query: string): React.ReactNode {
  const q = query.toLowerCase().trim();
  if (/^(hi|hello|hey|yo|hola|namaste)\b/.test(q)) {
    return "Hello! 😊 Ask me anything about properties, home loans, listing, site visits or our services.";
  }
  if (/(thank|thanks|thx|great|awesome|cool)/.test(q)) {
    return "You're welcome! Anything else I can help you with?";
  }
  if (/(bye|goodbye|see you)/.test(q)) {
    return "Goodbye! 👋 Come back anytime — happy house hunting.";
  }

  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  let best: QA | null = null;
  let bestScore = 0;
  for (const item of KNOWLEDGE) {
    const hay = `${item.q} ${item.keywords.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    for (const kw of item.keywords) if (q.includes(kw)) score += 1.5;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best && bestScore >= 1.5 ? best.a : FALLBACK;
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing, open]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setTyping(true);
    // Small delay so the "typing…" indicator reads naturally.
    window.setTimeout(() => {
      const a = answerFor(q);
      setMessages((m) => [...m, { role: "bot", content: a }]);
      setTyping(false);
    }, 650);
  };

  const showStarters = messages.length === 1 && !typing;

  return (
    <>
      {/* ---------------- Chat panel ---------------- */}
      {open && (
        <div className="fixed bottom-6 right-4 z-60 flex h-128 max-h-[80vh] w-88 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Bot className="h-5 w-5 text-white" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">allnewlaunches.com</p>
                <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <MessageRow key={i} role={m.role}>
                {m.content}
              </MessageRow>
            ))}

            {typing && (
              <MessageRow role="bot">
                <span className="flex items-center gap-1 py-0.5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
              </MessageRow>
            )}

            {/* Starter suggestions (only before the first question) */}
            {showStarters && (
              <div className="flex flex-wrap gap-2 pt-1 pl-9">
                {KNOWLEDGE.slice(0, 4).map((item) => (
                  <button
                    key={item.q}
                    type="button"
                    onClick={() => send(item.q)}
                    className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-left text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-300"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-700/60 bg-slate-900 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              aria-label="Type your message"
              className="min-w-0 flex-1 rounded-full border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* ---------------- Launcher ---------------- */}
      {/* The Lottie stays permanently mounted (never swapped for an icon) so its
          fetch is never aborted mid-flight — that abort was the console error.
          When the chat is open, the panel simply covers the launcher. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        aria-expanded={open}
        className="flex h-24 w-24 items-center justify-center transition-transform duration-300 hover:scale-110"
      >
        <DotLottieReact src={BOT_SRC} loop autoplay className="h-full w-full" />
      </button>
    </>
  );
}

/* ------------------------------- message row ------------------------------ */
function MessageRow({
  role,
  children,
}: {
  role: "bot" | "user";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-blue-600/20 text-blue-300" : "bg-slate-700 text-blue-300"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-blue-600 text-white"
            : "rounded-bl-sm bg-slate-800 text-slate-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
