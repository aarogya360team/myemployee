"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowUpActions() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function followAll() {
    setPending(true);
    setError("");
    const res = await fetch("/api/recovery/follow-up", { method: "POST" });
    setPending(false);
    if (!res.ok) {
      setError("Could not queue follow-up. WhatsApp send waits for a connected number.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className="btn-primary px-4 py-2 text-sm" disabled={pending} onClick={() => void followAll()}>
        Follow up all
      </button>
      <p className="w-full text-xs text-[var(--muted)]">
        Follow-up is sent only after WhatsApp confirms. Tryout numbers stay queued. Live Cloud API is not connected yet — this uses the mock sender.
      </p>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}

export function DismissOpportunity({ id }: { id: string }) {
  const router = useRouter();
  async function dismiss() {
    await fetch(`/api/recovery/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "DISMISSED" }) });
    router.refresh();
  }
  return (
    <button className="mt-2 text-xs text-[var(--brand)]" type="button" onClick={() => void dismiss()}>
      Dismiss
    </button>
  );
}
