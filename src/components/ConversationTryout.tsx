"use client";

import { useState } from "react";
import type { AppLanguage } from "@/lib/constants";

type Line = { from: "customer" | "employee"; text: string; meta?: string };
type Channel = "web" | "phone" | "whatsapp" | "instagram";

export function ConversationTryout({
  employeeName,
  showIdentity = false,
  demo = false,
}: {
  employeeName: string;
  showIdentity?: boolean;
  demo?: boolean;
}) {
  const [channel, setChannel] = useState<Channel>(showIdentity ? "whatsapp" : "web");
  const [text, setText] = useState("Bhai woh 12 watt ke Philips bulb ka rate kya hai?");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [language, setLanguage] = useState<AppLanguage | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, setPending] = useState(false);

  async function send() {
    const message = text.trim();
    if (!message) return;
    setPending(true);
    setLines((prev) => [...prev, { from: "customer", text: message }]);
    setText("");
    const res = await fetch("/api/ai/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        channel,
        previousLanguage: language ?? undefined,
        conversationId: conversationId ?? undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setLines((prev) => [
        ...prev,
        { from: "employee", text: data.error ?? "Abhi reply nahi ban paya." },
      ]);
      return;
    }
    setLanguage(data.language);
    if (data.conversationId) setConversationId(data.conversationId);
    if (data.debug?.nextBestAction) {
      setDebug(`${data.debug.currentState} → ${data.debug.nextBestAction}`);
    }
    setLines((prev) => [
      ...prev,
      {
        from: "employee",
        text: data.reply,
        meta: `${data.language} · ${channel === "phone" ? data.voice?.locale : channel}`,
      },
    ]);
  }

  const channels: { id: Channel; label: string }[] = showIdentity
    ? [
        { id: "whatsapp", label: "WhatsApp" },
        { id: "phone", label: "Phone" },
        { id: "instagram", label: "Instagram" },
        { id: "web", label: "Web" },
      ]
    : [
        { id: "web", label: "Chat" },
        { id: "phone", label: "Call (hi-IN / en-IN)" },
      ];

  return (
    <section className="panel p-5">
      {!showIdentity ? (
        <>
          <h2 className="font-semibold">
            {demo ? (
              <>
                <span className="badge badge-warn mr-2 align-middle">DEMO</span>
                Test {employeeName}
              </>
            ) : (
              <>Review {employeeName}&apos;s work</>
            )}
          </h2>
          <p className="mt-1 mb-3 text-sm text-[var(--muted)]">
            {demo
              ? `This never sends a live WhatsApp message. ${employeeName} must move the sale forward — not just chat.`
              : `Try a customer enquiry. ${employeeName} must move the sale forward — not just chat. Price only from the catalogue.`}
          </p>
        </>
      ) : (
        <p className="mb-3 text-sm text-[var(--muted)]">
          {demo ? (
            <>
              <span className="badge badge-warn mr-2">DEMO</span>
              This never sends a live WhatsApp message. Try an enquiry the way a customer would.
            </>
          ) : (
            <>Same customer, same journey — enter the mobile number so {employeeName} can match WhatsApp, phone, and Instagram.</>
          )}
        </p>
      )}
      {debug ? (
        <p className="mb-3 rounded-2xl bg-[var(--paper)] px-3 py-2 text-xs text-[var(--muted)]">
          Owner debug (not shown to customers): {debug}
        </p>
      ) : null}
      <div className="mb-3 flex flex-wrap gap-2">
        {channels.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`choice ${channel === item.id ? "choice-active" : ""}`}
            onClick={() => {
              setChannel(item.id);
              setConversationId(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {showIdentity ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            placeholder="Customer mobile"
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              setConversationId(null);
            }}
          />
          <input
            className="field"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
      ) : null}
      <div className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {lines.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Try: “Bhai 50 pieces chahiye, delivery tomorrow.”
          </p>
        ) : null}
        {lines.map((line, i) => (
          <div
            key={`${i}-${line.text.slice(0, 12)}`}
            className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
              line.from === "customer"
                ? "self-end bg-[var(--paper)]"
                : "self-start bg-[var(--brand-soft)]"
            }`}
          >
            <p>{line.text}</p>
            {line.meta ? (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {line.meta}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="Hindi, English ya Hinglish..."
        />
        <button className="btn-primary shrink-0 px-4" disabled={pending} type="button" onClick={() => void send()}>
          {pending ? "..." : channel === "phone" ? "Bolo" : "Bhejo"}
        </button>
      </div>
    </section>
  );
}
