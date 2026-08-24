"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Scale,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { PRODUCT_POSITIONING } from "@/lib/usp/positioning";
import { BrandMark } from "@/components/ui";

type Props = {
  businessName: string;
  employeeName: string;
  userName: string;
  children: React.ReactNode;
};

const NAV = [
  {
    label: "Operations",
    items: [
      { href: "/app", label: "Today", icon: LayoutDashboard },
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
      { href: "/app/orders", label: "Orders", icon: Package },
      { href: "/app/opportunities", label: "Money at risk", icon: AlertTriangle },
      { href: "/app/escalations", label: "Take over", icon: ShieldAlert },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/app/products", label: "Catalogue", icon: BookOpen },
      { href: "/app/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/app/customers", label: "Customers", icon: Users },
      { href: "/app/rules", label: "Rules", icon: Scale },
      { href: "/app/team", label: "Team", icon: Briefcase },
      { href: "/app/proof", label: "Proof", icon: BadgeCheck },
    ],
  },
  {
    label: "Employee",
    items: [{ href: "/ai-employee", label: "Review", icon: UserRound }],
  },
];

export function AppShell({ businessName, employeeName, userName, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-4">
        <BrandMark inverted />
        <p className="mt-4 truncate text-sm font-medium text-white">{businessName}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--sidebar-muted)]">
          {employeeName} on duty · Hindi / English / Hinglish
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--sidebar-muted)]">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                        active
                          ? "bg-white/10 font-medium text-white"
                          : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4 shrink-0 opacity-80" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" />
          <span className="min-w-0 truncate">{userName}</span>
          <span className="ml-auto text-xs text-[var(--sidebar-muted)]">Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-[var(--sidebar)] lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-64 bg-[var(--sidebar)] shadow-xl">{sidebar}</aside>
        </div>
      ) : null}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" className="btn-ghost px-2" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{businessName}</p>
            <p className="truncate text-xs text-[var(--muted)]">{employeeName} on duty</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-16 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function GuestShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden lg:flex">
        <Image
          src="/marketing/hero-electrical-counter.png"
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute inset-0 bg-[var(--sidebar)]/78" />
        <div className="relative flex w-full flex-col justify-between p-10 text-white">
          <BrandMark inverted />
          <div>
            <p className="text-sm font-medium text-teal-200">AI employee for Indian businesses</p>
            <h2 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight">
              Don&apos;t just answer customers. Complete the sale.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              {PRODUCT_POSITIONING.employeeNotSoftware} Rahul takes an enquiry as far toward a paid, delivered order as
              the business allows.
            </p>
          </div>
          <p className="text-xs text-slate-400">Hindi · English · Hinglish</p>
        </div>
      </aside>
      <div className="flex min-h-screen flex-col bg-[var(--paper)] px-4 py-8 sm:px-8">
        <div className="mb-8 lg:hidden">
          <BrandMark />
          <p className="mt-2 text-xs text-[var(--muted)]">{PRODUCT_POSITIONING.employeeNotSoftware}</p>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="panel p-6 sm:p-8">
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
