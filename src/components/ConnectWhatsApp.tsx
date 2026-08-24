"use client";

import { useEffect, useState } from "react";
import type { WhatsAppPath } from "@/lib/onboarding";

type Status = {
  health: string;
  connected: boolean;
  displayPhone: string | null;
  connectReady: boolean;
  merchantMessage: string;
  sdk?: { appId: string | null; configId: string | null } | null;
};

const PATHS: { id: WhatsAppPath; title: string; body: string }[] = [
  {
    id: "EXISTING",
    title: "Use my existing WhatsApp",
    body: "Customers keep messaging the number they already know.",
  },
  {
    id: "NEW",
    title: "Get a new number for my employee",
    body: "A dedicated number is not available yet. Use your existing WhatsApp for now.",
  },
  {
    id: "UNSURE",
    title: "I'm not sure",
    body: "If customers already WhatsApp you, connect that number.",
  },
];

export function ConnectWhatsApp({
  path,
  onPath,
  compact = false,
}: {
  path?: WhatsAppPath | null;
  onPath?: (path: WhatsAppPath) => void;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function refresh() {
    const res = await fetch("/api/integrations/whatsapp");
    const data = await res.json();
    if (res.ok) setStatus(data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function choose(next: WhatsAppPath) {
    onPath?.(next);
    await fetch("/api/integrations/whatsapp/path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: next }),
    });
  }

  async function connect() {
    setError("");
    if (!status?.connectReady || !status.sdk?.appId || !status.sdk.configId) {
      setError("WhatsApp connect is not available yet. You can still test your employee here.");
      return;
    }
    setPending(true);
    try {
      await launchEmbeddedSignup(status.sdk.appId, status.sdk.configId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "WhatsApp did not finish connecting. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "" : "flex flex-col gap-4"}>
      <div className="grid gap-2">
        {PATHS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`choice text-left ${path === item.id ? "choice-active" : ""}`}
            onClick={() => void choose(item.id)}
          >
            <span className="block font-medium">{item.title}</span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">{item.body}</span>
          </button>
        ))}
      </div>
      {status?.connected ? (
        <p className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm">
          WhatsApp connected{status.displayPhone ? ` · ${status.displayPhone}` : "."}
        </p>
      ) : (
        <button type="button" className="btn-primary" disabled={pending} onClick={() => void connect()}>
          {pending ? "Connecting…" : "Connect WhatsApp"}
        </button>
      )}
      <p className="text-sm text-[var(--muted)]">{status?.merchantMessage}</p>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}

type FbLogin = (
  cb: (response: { authResponse?: { code?: string } }) => void,
  opts: Record<string, unknown>,
) => void;

async function launchEmbeddedSignup(appId: string, configId: string) {
    await loadFacebookSdk(appId);
    const wabaPromise = waitForWabaSession();
    const fb = (window as unknown as { FB?: { login: FbLogin } }).FB;
    if (!fb) throw new Error("WhatsApp connect is not available yet.");
    const code = await new Promise<string>((resolve, reject) => {
      fb.login(
        (response) => {
          const value = response.authResponse?.code;
          if (value) resolve(value);
          else reject(new Error("WhatsApp connection was cancelled."));
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVersion: "3",
          },
        },
      );
    });
    const waba = await wabaPromise;
  const res = await fetch("/api/integrations/whatsapp", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      wabaId: waba.wabaId,
      phoneNumberId: waba.phoneNumberId,
      displayPhone: waba.displayPhone,
      existingNumber: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "WhatsApp did not finish connecting.");
}

function loadFacebookSdk(appId: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("facebook-jssdk");
    const win = window as unknown as { FB?: { init: (opts: object) => void }; fbAsyncInit?: () => void };
    if (win.FB) {
      resolve();
      return;
    }
    win.fbAsyncInit = () => {
      win.FB?.init({ appId, cookie: true, xfbml: false, version: "v21.0" });
      resolve();
    };
    if (existing) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => reject(new Error("WhatsApp connect is not available yet."));
    document.body.appendChild(script);
  });
}

function waitForWabaSession() {
  return new Promise<{ wabaId: string; phoneNumberId?: string; displayPhone?: string }>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("WhatsApp connection was cancelled or expired. Try again."));
    }, 180000);
    function onMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type !== "WA_EMBEDDED_SIGNUP") return;
        const data = payload.data ?? {};
        if (!data.waba_id) return;
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve({
          wabaId: String(data.waba_id),
          phoneNumberId: data.phone_number_id ? String(data.phone_number_id) : undefined,
          displayPhone: data.display_phone_number ? String(data.display_phone_number) : undefined,
        });
      } catch {
        /* ignore other frame messages */
      }
    }
    window.addEventListener("message", onMessage);
  });
}
