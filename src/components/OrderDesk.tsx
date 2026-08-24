"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, EmptyState } from "@/components/ui";

export type OrderDeskRow = {
  id: string;
  status: string;
  totalLabel: string;
  customerLabel: string;
  items: string;
  payments: { id: string; status: string; link: string | null }[];
  deliveries: { id: string; status: string; trackingId: string | null }[];
  invoices: { id: string; number: string; sent: boolean }[];
};

export function OrderDesk({ orders }: { orders: OrderDeskRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(orderId: string, action: "confirm" | "request_payment" | "send_invoice" | "book_delivery") {
    setPending(`${orderId}:${action}`);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action }),
    });
    const data = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update this order.");
      return;
    }
    router.refresh();
  }

  async function mockPaid(paymentId: string) {
    setPending(`paid:${paymentId}`);
    setError("");
    const res = await fetch(`/api/mocks/payments/${paymentId}/paid`, { method: "POST" });
    const data = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Provider did not confirm payment.");
      return;
    }
    router.refresh();
  }

  async function mockDelivered(deliveryId: string) {
    setPending(`delivered:${deliveryId}`);
    setError("");
    const res = await fetch(`/api/mocks/deliveries/${deliveryId}/delivered`, { method: "POST" });
    const data = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Provider did not confirm delivery.");
      return;
    }
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        body="An order draft appears after product, quantity, and address are confirmed."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {orders.map((order) => {
        const paid = order.payments.some((p) => p.status === "paid");
        const pendingPay = order.payments.find((p) => p.status === "pending");
        const delivery = order.deliveries[0];
        return (
          <article key={order.id} className="panel p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {order.customerLabel} · {order.totalLabel}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {order.id.slice(-8).toUpperCase()} · {order.items}
                </p>
              </div>
              <Badge tone={paid ? "ok" : "warn"}>{order.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary text-xs" type="button" disabled={pending != null} onClick={() => void act(order.id, "confirm")}>
                Confirm order
              </button>
              <button className="btn-secondary text-xs" type="button" disabled={pending != null} onClick={() => void act(order.id, "request_payment")}>
                Request payment
              </button>
              <button className="btn-secondary text-xs" type="button" disabled={pending != null || !paid} onClick={() => void act(order.id, "send_invoice")}>
                Send invoice
              </button>
              <button className="btn-secondary text-xs" type="button" disabled={pending != null || !paid} onClick={() => void act(order.id, "book_delivery")}>
                Book delivery
              </button>
            </div>
            {pendingPay ? (
              <div className="mt-3 rounded-2xl bg-[var(--paper)] px-3 py-2">
                <p className="text-xs">
                  Payment {pendingPay.status}
                  {pendingPay.link ? (
                    <>
                      {" "}
                      ·{" "}
                      <a className="text-[var(--brand)]" href={pendingPay.link} target="_blank" rel="noreferrer">
                        mock link
                      </a>
                    </>
                  ) : null}
                </p>
                <button
                  className="mt-1 text-xs font-medium text-[var(--brand)]"
                  type="button"
                  disabled={pending != null}
                  onClick={() => void mockPaid(pendingPay.id)}
                >
                  MOCK: provider confirmed paid
                </button>
              </div>
            ) : null}
            {paid ? <p className="mt-2 text-xs">Payment paid (provider).</p> : null}
            {order.invoices.map((inv) => (
              <p key={inv.id} className="mt-1 text-xs text-[var(--muted)]">
                Invoice {inv.number} · {inv.sent ? "sent" : "generated, not sent"}
              </p>
            ))}
            {delivery ? (
              <div className="mt-2 rounded-2xl bg-[var(--paper)] px-3 py-2">
                <p className="text-xs">
                  Delivery {delivery.status}
                  {delivery.trackingId ? ` · ${delivery.trackingId}` : ""}
                </p>
                {delivery.status !== "DELIVERED" ? (
                  <button
                    className="mt-1 text-xs font-medium text-[var(--brand)]"
                    type="button"
                    disabled={pending != null}
                    onClick={() => void mockDelivered(delivery.id)}
                  >
                    MOCK: courier confirmed delivered
                  </button>
                ) : (
                  <p className="mt-1 text-xs">Delivered (provider).</p>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
