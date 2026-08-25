"use client";

import { useEffect, useState } from "react";

export function ConnectPayments() {
  const [pay, setPay] = useState<{ connected: boolean; keyId: string | null; webhookUrl: string } | null>(null);
  const [ship, setShip] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"pay" | "ship" | null>(null);

  async function refresh() {
    const [payments, delivery] = await Promise.all([
      fetch("/api/integrations/payments").then((res) => res.json()),
      fetch("/api/integrations/delivery").then((res) => res.json()),
    ]);
    if (payments.connected !== undefined) setPay(payments);
    if (delivery.connected !== undefined) setShip(delivery);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function savePay() {
    setError("");
    setPending("pay");
    const res = await fetch("/api/integrations/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId, keySecret, webhookSecret }),
    });
    const data = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Could not save Razorpay.");
      return;
    }
    setKeyId("");
    setKeySecret("");
    setWebhookSecret("");
    await refresh();
  }

  async function saveShip() {
    setError("");
    setPending("ship");
    const res = await fetch("/api/integrations/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Could not save Shiprocket.");
      return;
    }
    setPassword("");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Razorpay</h2>
        <p className="text-sm text-[var(--muted)]">
          Your employee will send a payment link. Paid is marked only after Razorpay confirms.
        </p>
        {pay?.connected ? (
          <p className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm">Connected · {pay.keyId}</p>
        ) : null}
        {pay?.webhookUrl ? (
          <p className="text-xs text-[var(--muted)]">
            Razorpay webhook URL: <span className="break-all font-mono">{pay.webhookUrl}</span>
          </p>
        ) : null}
        <input className="field" placeholder="Key ID (rzp_live_… or rzp_test_…)" value={keyId} onChange={(e) => setKeyId(e.target.value)} />
        <input className="field" type="password" placeholder="Key Secret" value={keySecret} onChange={(e) => setKeySecret(e.target.value)} />
        <input
          className="field"
          type="password"
          placeholder="Webhook secret (optional)"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
        />
        <button type="button" className="btn-primary" disabled={pending === "pay" || !keyId || !keySecret} onClick={() => void savePay()}>
          {pending === "pay" ? "Saving…" : pay?.connected ? "Update Razorpay" : "Connect Razorpay"}
        </button>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Shiprocket</h2>
        <p className="text-sm text-[var(--muted)]">Delivery is booked only after payment is confirmed.</p>
        {ship?.connected ? (
          <p className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm">Connected · {ship.email}</p>
        ) : null}
        <input className="field" type="email" placeholder="Shiprocket email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Shiprocket password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="btn-primary" disabled={pending === "ship" || !email || !password} onClick={() => void saveShip()}>
          {pending === "ship" ? "Saving…" : ship?.connected ? "Update courier" : "Connect courier"}
        </button>
      </section>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
