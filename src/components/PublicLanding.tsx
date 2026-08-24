"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Banknote,
  ChevronDown,
  PackageCheck,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import { RoiCalculator } from "@/components/RoiCalculator";
import { PricingCards } from "@/components/PricingCards";
import { BrandMark } from "@/components/ui";
import { DEMO_LABEL, PRODUCT_POSITIONING, USP_PRIMARY, USP_SECONDARY } from "@/lib/usp/positioning";

const WORK = [
  { title: "Answer", body: "Hindi, English or Hinglish — same register as the customer.", icon: PhoneCall },
  { title: "Sell", body: "Recommend from your catalogue. Never invent a rate.", icon: Sparkles },
  { title: "Order", body: "Move the enquiry to a quote, then a confirmed draft.", icon: ShoppingCart },
  { title: "Collect", body: "Request payment. Paid only after the provider confirms.", icon: Banknote },
  { title: "Deliver", body: "Book delivery after payment. Delivered only after the courier confirms.", icon: Truck },
  { title: "Follow up", body: "Recover incomplete journeys instead of letting them go cold.", icon: RefreshCw },
  { title: "Recover", body: "Track money at risk from quotes and stalled orders.", icon: PackageCheck },
  { title: "Escalate", body: "Call you for discounts, credit, anger, or anything outside the rules.", icon: ShieldAlert },
];

const SCENES = [
  {
    src: "/marketing/whatsapp-enquiry.png",
    alt: "A Delhi wholesaler taking a WhatsApp enquiry on the counter",
    kicker: "Enquiry",
    title: "The customer already WhatsApps you",
    body: "Rahul answers in the same Hinglish, then asks for the SKU and quantity instead of chatting forever.",
  },
  {
    src: "/marketing/product-money-desk.png",
    alt: "Owner money screen showing AI-assisted revenue",
    kicker: "Proof",
    title: "You measure rupees, not messages",
    body: "Today’s home is assisted revenue, recovered revenue, and incomplete journeys — never a chatbot inbox as the score.",
  },
  {
    src: "/marketing/paid-delivered.png",
    alt: "Packed cartons, invoice and UPI QR after a paid order",
    kicker: "Completion",
    title: "Paid and delivered only when it’s real",
    body: "Payment and courier stay pending until the provider confirms. Rahul will not pretend the sale is done.",
  },
];

const FAQS = [
  {
    q: "Is this a WhatsApp chatbot?",
    a: "No. Rahul is an AI employee whose job is to complete the sale and call you when judgment is needed.",
  },
  {
    q: "Do you guarantee extra revenue?",
    a: "No. The ROI calculator is an estimate. We only report money from real attributed orders.",
  },
  {
    q: "Will Rahul invent prices?",
    a: "No. Price, stock, payment and delivery are spoken only after the system confirms them.",
  },
];

export function PublicLanding() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandMark />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--muted)] md:flex">
            <a href="#work" className="hover:text-[var(--ink)]">
              The work
            </a>
            <a href="#how" className="hover:text-[var(--ink)]">
              How it works
            </a>
            <a href="#pricing" className="hover:text-[var(--ink)]">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary px-4 py-2 text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary px-4 py-2 text-sm">
              {PRODUCT_POSITIONING.primaryCta}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[34rem] overflow-hidden lg:min-h-[40rem]">
          <Image
            src="/marketing/hero-electrical-counter.png"
            alt="Electrical wholesale counter in Delhi at dusk, WhatsApp open on the shop phone"
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/58 to-black/20" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div className="text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
                AI employee · not a chatbot
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">{USP_PRIMARY}</h1>
              <p className="mt-5 max-w-xl text-lg leading-7 text-slate-200">{PRODUCT_POSITIONING.subhead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-slate-100">
                  {PRODUCT_POSITIONING.primaryCta}
                </Link>
                <a href="#pricing" className="inline-flex rounded-[10px] border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                  See pricing
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-slate-200">
                {["Hindi · English · Hinglish", "Never invents price", "Paid only when paid", "Calls you when it should"].map(
                  (chip) => (
                    <li key={chip} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                      {chip}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="relative hidden min-h-[22rem] lg:block">
              <div className="absolute right-0 top-0 w-[86%] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
                <Image
                  src="/marketing/whatsapp-enquiry.png"
                  alt="WhatsApp enquiry on a shop counter"
                  width={1200}
                  height={900}
                  className="h-auto w-full"
                />
              </div>
              <div className="absolute -bottom-2 left-0 w-[72%] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
                <Image
                  src="/marketing/product-money-desk.png"
                  alt="Owner desk with AI-assisted revenue on the laptop"
                  width={1600}
                  height={900}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="badge badge-warn">{DEMO_LABEL}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sharma Electricals, Delhi (illustrative)</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              {DEMO_LABEL} numbers only. Live shops show real AI-assisted revenue — never invented totals.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
                <p className="text-sm font-medium text-[var(--muted)]">Before Rahul</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight">42</p>
                <p className="text-sm text-[var(--muted)]">missed enquiries</p>
                <p className="mt-4 text-sm">8 orders · ₹84,000</p>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-[var(--brand-soft)] p-6">
                <p className="text-sm font-medium text-[var(--brand)]">After Rahul</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight">₹4.2L</p>
                <p className="text-sm text-[var(--muted)]">assisted revenue</p>
                <p className="mt-4 text-sm">184 enquiries handled · 31 orders</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">The sale, on the shop floor</h2>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">{PRODUCT_POSITIONING.difference}</p>
          <ul className="mt-10 grid gap-8">
            {SCENES.map((scene, i) => (
              <li
                key={scene.title}
                className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}
              >
                <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] shadow-lg">
                  <Image src={scene.src} alt={scene.alt} width={1600} height={900} className="h-auto w-full object-cover" />
                  <p className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {DEMO_LABEL}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{scene.kicker}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{scene.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[var(--muted)]">{scene.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="work" className="border-y border-[var(--line)] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Your AI employee does the work</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{USP_SECONDARY}</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WORK.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="panel p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="size-4" />
                    </span>
                    <p className="mt-3 font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-4">
            {[
              { n: "01", title: "Connect your business", body: "Shop name, hours, languages, and who customers will talk to." },
              { n: "02", title: "Teach the catalogue", body: "SKUs, dealer rates, stock. No catalogue, no quote." },
              { n: "03", title: "Set the rules", body: "Discount cap, credit, payment before delivery — evaluated on the server." },
              { n: "04", title: "Go live", body: "WhatsApp when Meta is connected. Until then, the inbox simulator is the rehearsal." },
            ].map((step) => (
              <li key={step.n} className="panel p-5">
                <p className="font-mono text-xs font-semibold text-[var(--brand)]">{step.n}</p>
                <p className="mt-3 font-semibold">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <PricingCards />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <RoiCalculator />
        </div>

        <section className="border-t border-[var(--line)] bg-white">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
            <div className="mt-8 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
              {FAQS.map((item, i) => (
                <div key={item.q}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    aria-expanded={openFaq === i}
                  >
                    {item.q}
                    <ChevronDown className={`size-4 shrink-0 text-[var(--muted)] transition ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i ? <p className="px-5 pb-4 text-sm leading-6 text-[var(--muted)]">{item.a}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative min-h-[20rem] overflow-hidden">
          <Image
            src="/marketing/paid-delivered.png"
            alt="Packed orders ready to leave the shop"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[var(--sidebar)]/80" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white">
              See what Rahul could do for your business.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">{PRODUCT_POSITIONING.firstLivePath}</p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-slate-100"
            >
              {PRODUCT_POSITIONING.primaryCta}
            </Link>
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-[var(--line)] bg-white/95 p-3 backdrop-blur md:hidden">
        <Link href="/signup" className="btn-primary w-full">
          {PRODUCT_POSITIONING.primaryCta}
        </Link>
      </div>
    </div>
  );
}
