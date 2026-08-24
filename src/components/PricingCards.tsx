"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { PLAN_CATALOG, formatInr, type PlanCode } from "@/lib/billing/catalog";
import { PRODUCT_POSITIONING } from "@/lib/usp/positioning";

const PLAN_POINTS: Record<Exclude<PlanCode, "PERFORMANCE">, string[]> = {
  STARTER: [
    "Hire Rahul for WhatsApp enquiries",
    "Catalogue search — no invented prices",
    "Customer memory and human takeover",
    "1,000 AI interactions / month",
    "1 AI employee seat",
  ],
  BUSINESS: [
    "Quote, order, invoice, payment, delivery",
    "Follow-ups and recovered-revenue tracking",
    "Analytics and attribution",
    "5,000 AI interactions / month",
    "1 AI employee seat · everything in Starter",
  ],
  GROWTH: [
    "Voice inbound and outbound",
    "Marketing campaigns",
    "2 AI employee seats (Rahul + Priya)",
    "10,000 interactions · 250 voice minutes",
    "Everything in Business",
  ],
  PRO: [
    "Build the workforce — 8 AI employee seats",
    "Multi-branch and API access",
    "Advanced analytics and priority support",
    "50,000 interactions · 1,000 voice minutes",
    "Everything in Growth",
  ],
};

const PLANS = PLAN_CATALOG.filter((p) => p.code !== "PERFORMANCE");
const PERFORMANCE = PLAN_CATALOG.find((p) => p.code === "PERFORMANCE")!;

export function PricingCards() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="border-y border-[var(--line)] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">Pricing</p>
            <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
              Hire an employee. Pay for the work they finish.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Plans unlock what Rahul is allowed to complete. Annual billing is 10 months — two months on the house.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-[var(--line)] bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                !yearly ? "bg-[var(--sidebar)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              onClick={() => setYearly(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                yearly ? "bg-[var(--sidebar)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              onClick={() => setYearly(true)}
            >
              Yearly
              <span className={`ml-1.5 text-xs font-medium ${yearly ? "text-teal-200" : "text-[var(--brand)]"}`}>
                2 months free
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const points = PLAN_POINTS[plan.code as Exclude<PlanCode, "PERFORMANCE">];
            const displayPaise = yearly ? Math.round(plan.annualPaise / 12) : plan.monthlyPaise;
            const featured = plan.popular;
            return (
              <article
                key={plan.code}
                className={`relative flex flex-col rounded-2xl p-6 transition duration-200 ${
                  featured
                    ? "z-10 border-2 border-teal-400 bg-[var(--sidebar)] text-white shadow-2xl xl:-translate-y-4"
                    : "border border-[var(--line)] bg-white shadow-[0_18px_40px_-24px_rgb(15_23_42_/_0.35)] hover:-translate-y-1 hover:shadow-xl"
                }`}
              >
                {featured ? (
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-400 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--sidebar)]">
                    Most hired
                  </p>
                ) : null}
                <p className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${featured ? "text-teal-200" : "text-[var(--brand)]"}`}>
                  {plan.name}
                </p>
                <p className={`mt-2 min-h-10 text-sm leading-5 ${featured ? "text-slate-300" : "text-[var(--muted)]"}`}>
                  {plan.tagline}
                </p>
                <p className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{formatInr(displayPaise)}</span>
                  <span className={`mb-1 text-sm ${featured ? "text-slate-400" : "text-[var(--muted)]"}`}>/mo</span>
                </p>
                <p className={`text-xs ${featured ? "text-slate-400" : "text-[var(--muted)]"}`}>
                  {yearly
                    ? `Billed ${formatInr(plan.annualPaise)} / year`
                    : `${plan.trialDays}-day trial · then ${formatInr(plan.monthlyPaise)}/mo`}
                </p>
                <Link
                  href="/signup"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold ${
                    featured
                      ? "bg-white text-[var(--brand)] hover:bg-slate-100"
                      : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                  }`}
                >
                  {PRODUCT_POSITIONING.primaryCta}
                </Link>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                          featured ? "bg-white/10" : "bg-[var(--brand-soft)]"
                        }`}
                      >
                        <Check className={`size-3.5 ${featured ? "text-teal-300" : "text-[var(--brand)]"}`} />
                      </span>
                      <span className={featured ? "text-slate-200" : "text-slate-700"}>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">{PERFORMANCE.name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{PERFORMANCE.tagline}</p>
          </div>
          <Link href="/signup" className="btn-secondary shrink-0">
            Start on {PERFORMANCE.name}
          </Link>
        </div>
      </div>
    </section>
  );
}
