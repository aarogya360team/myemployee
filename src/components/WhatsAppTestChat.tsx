"use client";

import { useEffect, useRef, useState } from "react";
import type { AppLanguage } from "@/lib/constants";
import { LearningProgress, type LearningSnapshot } from "@/components/LearningProgress";

type Line = { from: "customer" | "employee"; text: string };
type Payment = { id: string; link: string | null; amountPaise: number; status: string };
type Delivery = { id: string; trackingId: string | null; status: string };

const CHIPS = [
  { label: "Namaste", text: "Namaste" },
  { label: "Philips rate", text: "Bhai 12 watt Philips bulb ka rate?" },
  { label: "50 pcs", text: "50 pieces chahiye" },
  { label: "Address", text: "Delivery Karol Bagh, Delhi 110005" },
  { label: "Haan", text: "Haan, order kar do" },
];

function upiUrl(businessName: string, amountPaise: number) {
  const rupees = (amountPaise / 100).toFixed(2);
  return `upi://pay?pa=aurel-test@upi&pn=${encodeURIComponent(businessName)}&am=${rupees}&cu=INR`;
}

function qrSrc(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;
}

function newTestPhone() {
  return `99999${String(Date.now()).slice(-5)}`;
}

export function WhatsAppTestChat({
  employeeName,
  businessName,
}: {
  employeeName: string;
  businessName: string;
}) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<AppLanguage | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [phone, setPhone] = useState(newTestPhone);
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, setPending] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [learning, setLearning] = useState<LearningSnapshot | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [lines, payment, delivery]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setLines((prev) => [...prev, { from: "customer", text: trimmed }]);
    setText("");
    const res = await fetch("/api/ai/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        channel: "whatsapp",
        simulate: true,
        previousLanguage: language ?? undefined,
        conversationId: conversationId ?? undefined,
        customerPhone: phone,
        customerName: "WhatsApp test",
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setLines((prev) => [...prev, { from: "employee", text: data.error ?? "Abhi reply nahi ban paya." }]);
      return;
    }
    setLanguage(data.language);
    if (data.conversationId) setConversationId(data.conversationId);
    if (data.debug?.nextBestAction) {
      setDebug(`${data.debug.currentState} → ${data.debug.nextBestAction}`);
    }
    if (data.payment) setPayment(data.payment);
    if (data.delivery) setDelivery(data.delivery);
    if (data.learning) setLearning(data.learning);
    setLines((prev) => [...prev, { from: "employee", text: data.reply }]);
  }

  async function markPaid() {
    if (!payment?.id || payment.status === "paid") return;
    setPending(true);
    await fetch(`/api/mocks/payments/${payment.id}/paid`, { method: "POST" });
    setPending(false);
    await send("Maine pay kar diya");
  }

  async function markDelivered() {
    if (!delivery?.id || delivery.status === "DELIVERED") return;
    setPending(true);
    await fetch(`/api/mocks/deliveries/${delivery.id}/delivered`, { method: "POST" });
    setPending(false);
    await send("Maal aa gaya, theek hai");
  }

  function resetChat() {
    setLines([]);
    setConversationId(null);
    setLanguage(null);
    setDebug(null);
    setPayment(null);
    setDelivery(null);
    setPhone(newTestPhone());
    setText("");
  }

  const showPay = payment && payment.status !== "paid";
  const showDelivered = delivery && delivery.status !== "DELIVERED";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <section className="overflow-hidden rounded-2xl border border-black/10 shadow-lg">
        <header className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {employeeName.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{employeeName}</p>
            <p className="text-xs text-white/80">{pending ? "typing…" : "online · test chat, not live WhatsApp"}</p>
          </div>
          <button type="button" className="text-xs text-white/80 hover:text-white" onClick={resetChat}>
            New chat
          </button>
        </header>
        <div ref={scroller} className="flex h-[28rem] flex-col gap-2 overflow-y-auto bg-[#ECE5DD] px-3 py-3">
          {lines.length === 0 ? (
            <p className="mx-auto mt-8 max-w-[16rem] rounded-lg bg-white/80 px-3 py-2 text-center text-xs text-slate-600">
              Same journey as WhatsApp: greet → rate → pieces → address → pay → delivery. Nothing is sent to a real
              customer.
            </p>
          ) : null}
          {lines.map((line, i) => (
            <div
              key={`${i}-${line.text.slice(0, 16)}`}
              className={`max-w-[82%] rounded-lg px-3 py-1.5 text-sm shadow-sm ${
                line.from === "customer" ? "self-end bg-[#DCF8C6]" : "self-start bg-white"
              }`}
            >
              {line.text}
            </div>
          ))}
          {showPay ? (
            <div className="self-start max-w-[82%] rounded-lg bg-white px-3 py-3 text-sm shadow-sm">
              <p className="font-medium">UPI (test)</p>
              <p className="text-xs text-slate-500">₹{(payment.amountPaise / 100).toFixed(0)} · aurel-test@upi</p>
              <img
                alt="Test UPI QR"
                className="mx-auto my-2 size-36 rounded bg-white"
                src={qrSrc(upiUrl(businessName, payment.amountPaise))}
              />
              <button
                type="button"
                className="btn-primary w-full text-sm"
                disabled={pending}
                onClick={() => void markPaid()}
              >
                I&apos;ve paid (test)
              </button>
            </div>
          ) : null}
          {showDelivered ? (
            <div className="self-start max-w-[82%] rounded-lg bg-white px-3 py-3 text-sm shadow-sm">
              <p className="text-xs text-slate-500">Tracking {delivery.trackingId}</p>
              <button
                type="button"
                className="btn-secondary mt-2 w-full text-sm"
                disabled={pending}
                onClick={() => void markDelivered()}
              >
                Courier delivered (test)
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 bg-[#F0F2F5] px-3 py-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
              disabled={pending}
              onClick={() => void send(chip.text)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2 bg-[#F0F2F5] px-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <input
            className="field rounded-full bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
          />
          <button className="btn-primary shrink-0 rounded-full px-4" disabled={pending} type="submit">
            {pending ? "…" : "Send"}
          </button>
        </form>
      </section>
      <div className="flex flex-col gap-3">
        {debug ? (
          <p className="rounded-xl bg-[var(--paper)] px-3 py-2 text-xs text-[var(--muted)]">
            Owner debug (not shown to customers): {debug}
          </p>
        ) : null}
        <LearningProgress employeeName={employeeName} learning={learning} />
        <p className="text-sm text-[var(--muted)]">
          Live customer WhatsApp still needs Meta connected. This screen uses the same employee, catalogue, and
          rules — payments and courier are mocked so you can finish the sale without Razorpay or Shiprocket.
        </p>
      </div>
    </div>
  );
}
