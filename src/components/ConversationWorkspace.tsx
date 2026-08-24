"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatInr } from "@/lib/billing/catalog";

type Message = { id: string; sender: string; body: string; createdAt: string | Date };
type Order = {
  id: string;
  status: string;
  totalPaise: number;
  payments: { id: string; status: string }[];
  deliveries: { id: string; status: string; trackingId: string | null }[];
};

export function ConversationWorkspace({
  conversation,
  employeeName,
}: {
  employeeName: string;
  conversation: {
    id: string;
    channel: string;
    controlMode: string;
    currentState: string;
    nextBestAction: string | null;
    blockingReason: string | null;
    customer: { name: string | null; phone: string; segment: string | null } | null;
    messages: Message[];
    orders: Order[];
  };
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const human = conversation.controlMode === "HUMAN";
  const demo = conversation.customer?.segment === "TRYOUT" || conversation.customer?.phone === "TRYOUT";
  const order = conversation.orders[0];

  async function setMode(controlMode: "AI" | "HUMAN") {
    setPending(true);
    await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ controlMode }),
    });
    setPending(false);
    router.refresh();
  }

  async function reply() {
    const body = text.trim();
    if (!body) return;
    setPending(true);
    await fetch(`/api/conversations/${conversation.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body }),
    });
    setText("");
    setPending(false);
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">
              {conversation.customer?.name || conversation.customer?.phone || "Customer"}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {conversation.channel}
              {demo ? " · DEMO" : ""}
            </p>
          </div>
          {human ? (
            <button type="button" className="btn-secondary" disabled={pending} onClick={() => void setMode("AI")}>
              Give back to {employeeName}
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={pending} onClick={() => void setMode("HUMAN")}>
              Take over
            </button>
          )}
        </div>
        <div className="mb-4 flex max-h-80 flex-col gap-2 overflow-y-auto">
          {conversation.messages.map((line) => (
            <div
              key={line.id}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                line.sender === "customer" ? "self-end bg-[var(--paper)]" : "self-start bg-[var(--brand-soft)]"
              }`}
            >
              <p>{line.body}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">{line.sender}</p>
            </div>
          ))}
        </div>
        {human ? (
          <div className="flex gap-2">
            <input
              className="field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Reply as the owner"
            />
            <button type="button" className="btn-primary shrink-0" disabled={pending} onClick={() => void reply()}>
              Send
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">{employeeName} is handling this conversation.</p>
        )}
      </section>
      <aside className="flex flex-col gap-3">
        <div className="panel p-4 text-sm">
          <p className="font-semibold">Next action</p>
          <p className="mt-1">{conversation.nextBestAction ?? "Waiting for the customer"}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">State</p>
          <p>{conversation.currentState}</p>
          {conversation.blockingReason ? <p className="mt-2 text-[var(--danger)]">{conversation.blockingReason}</p> : null}
        </div>
        <div className="panel p-4 text-sm">
          <p className="font-semibold">Order</p>
          {order ? (
            <ul className="mt-2 flex flex-col gap-1">
              <li>{order.status} · {formatInr(order.totalPaise)}</li>
              <li>Payment: {order.payments[0]?.status ?? "none"}</li>
              <li>Delivery: {order.deliveries[0]?.status ?? "none"}</li>
            </ul>
          ) : (
            <p className="mt-2 text-[var(--muted)]">No order yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
