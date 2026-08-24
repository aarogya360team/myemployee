"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StaffCustomerForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name: name || undefined, note: note || undefined }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save this customer.");
      return;
    }
    setPhone("");
    setName("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mb-6 grid gap-3 p-5 sm:grid-cols-2">
      <p className="text-sm font-semibold sm:col-span-2">Staff entry</p>
      <p className="text-xs text-[var(--muted)] sm:col-span-2">Phone is required so journeys can match across WhatsApp, phone, and Instagram.</p>
      <input
        className="field"
        placeholder="Mobile number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <input className="field" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field sm:col-span-2" placeholder="Owner note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error ? <p className="text-sm text-[var(--danger)] sm:col-span-2">{error}</p> : null}
      <button className="btn-primary sm:col-span-2" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add customer"}
      </button>
    </form>
  );
}

export function MemoryFactEditor({
  customerId,
  facts,
}: {
  customerId: string;
  facts: { id: string; field: string; value: string; source: string; why: string }[];
}) {
  const router = useRouter();
  const [field, setField] = useState("note");
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function addFact() {
    if (!value.trim()) return;
    setPending(true);
    setError("");
    const res = await fetch(`/api/customers/${customerId}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value: value.trim() }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save memory.");
      return;
    }
    setValue("");
    router.refresh();
  }

  async function saveFact(id: string) {
    const next = editing[id];
    if (!next?.trim()) return;
    setPending(true);
    setError("");
    const res = await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: next.trim() }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not edit memory.");
      return;
    }
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    router.refresh();
  }

  async function removeFact(id: string) {
    setPending(true);
    setError("");
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not delete memory.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3">
      {facts.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No verified memories yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {facts.map((fact) => (
            <li key={fact.id} className="rounded-2xl bg-[var(--paper)] px-3 py-2">
              <p className="font-medium">{fact.field}</p>
              {editing[fact.id] != null ? (
                <div className="mt-1 flex gap-2">
                  <input
                    className="field"
                    value={editing[fact.id]}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [fact.id]: e.target.value }))}
                  />
                  <button
                    className="text-xs font-medium text-[var(--brand)]"
                    type="button"
                    disabled={pending}
                    onClick={() => void saveFact(fact.id)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p>{fact.value}</p>
              )}
              <p className="text-xs text-[var(--muted)]">{fact.why}</p>
              <div className="mt-1 flex gap-3">
                <button
                  className="text-xs text-[var(--brand)]"
                  type="button"
                  onClick={() => setEditing((prev) => ({ ...prev, [fact.id]: fact.value }))}
                >
                  Edit
                </button>
                <button
                  className="text-xs text-[var(--danger)]"
                  type="button"
                  disabled={pending}
                  onClick={() => void removeFact(fact.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 grid gap-2">
        <select className="field" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="note">Note</option>
          <option value="name">Name</option>
          <option value="location">Location</option>
          <option value="preferred_payment">Preferred payment</option>
          <option value="preferred_delivery">Preferred delivery</option>
          <option value="product_requested">Product requested</option>
        </select>
        <input
          className="field"
          placeholder="Add a fact you verified"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="text-sm font-medium text-[var(--brand)]" type="button" disabled={pending} onClick={() => void addFact()}>
          Save fact
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
