"use client";

import { useState } from "react";

type Feature = {
  id: string;
  name: string;
  summary: string;
  kind: string;
  core: boolean;
  enabled: boolean;
};

export function FeatureToggles({ features: initial }: { features: Feature[] }) {
  const [features, setFeatures] = useState(initial);
  const [error, setError] = useState("");

  async function toggle(pluginId: string, enabled: boolean) {
    setError("");
    const res = await fetch("/api/business/features", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pluginId, enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update add-on.");
      return;
    }
    setFeatures(data.features);
  }

  return (
    <section className="panel p-5">
      <h2 className="font-semibold">Add-ons for this shop</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
        Same platform for every business. You hire employees and turn on what they may use — not chatbot nodes.
      </p>
      <div className="flex flex-col gap-3">
        {features.map((feature) => (
          <label key={feature.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line)] px-3 py-3">
            <span>
              <span className="block text-sm font-medium">{feature.name}</span>
              <span className="block text-xs text-[var(--muted)]">{feature.summary}</span>
            </span>
            <input
              type="checkbox"
              checked={feature.enabled}
              disabled={feature.core}
              onChange={(e) => toggle(feature.id, e.target.checked)}
            />
          </label>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </section>
  );
}
