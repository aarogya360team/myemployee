"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddProductForm() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [aliases, setAliases] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        name,
        brand: brand || undefined,
        pricePaise: Math.round(Number(price) * 100),
        stock: Number(stock),
        aliases: aliases
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not add product. Check SKU is unique.");
      return;
    }
    setSku("");
    setName("");
    setBrand("");
    setPrice("");
    setStock("0");
    setAliases("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-0 grid gap-3 p-5 sm:grid-cols-2">
      <input className="field" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
      <input className="field" placeholder="Name (e.g. Philips 12W B22 LED)" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="field" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
      <input className="field" placeholder="Dealer price ₹" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <input className="field" placeholder="Stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required />
      <input className="field sm:col-span-2" placeholder="Aliases, comma separated (12 watt philips)" value={aliases} onChange={(e) => setAliases(e.target.value)} />
      {error ? <p className="text-sm text-[var(--danger)] sm:col-span-2">{error}</p> : null}
      <button className="btn-primary sm:col-span-2" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Give employee access to this product"}
      </button>
    </form>
  );
}
