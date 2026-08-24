"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CatalogueImport() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError("");
    setResult("");
    const text = await file.text();
    const res = await fetch("/api/products/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text,
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not import that file.");
      return;
    }
    setResult(`Added ${data.created} products${data.skipped ? `, skipped ${data.skipped}` : ""}.`);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm">
      <p className="font-medium">Import CSV</p>
      <p className="mt-1 text-[var(--muted)]">Columns: sku, name, brand, price, stock, aliases</p>
      <input
        className="mt-3 text-sm"
        type="file"
        accept=".csv,text/csv"
        disabled={pending}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error ? <p className="mt-2 text-[var(--danger)]">{error}</p> : null}
      {result ? <p className="mt-2 text-emerald-700">{result}</p> : null}
    </div>
  );
}
