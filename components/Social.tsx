"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { signIn, useSession } from "./Session";
import { useToast } from "./Toast";
import { shortAddr } from "@/lib/hyperliquid";
import Avatar from "./Avatar";
import Link from "next/link";

// Real GGs, tails (follows) and chat, saved in the database.
// Cards ask for their counts; requests are collected for 50 ms and sent as one.

type Store = { gg: Record<string, number>; mine: Set<string>; tailing: Set<string>; known: Set<string>; enabled: boolean | null };
const store: Store = { gg: {}, mine: new Set(), tailing: new Set(), known: new Set(), enabled: null };
let version = 0;
const listeners = new Set<() => void>();
const bump = () => { version++; listeners.forEach((l) => l()); };
const wantTargets = new Set<string>();
const wantWallets = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  timer = undefined;
  const targets = [...wantTargets].filter((t) => !store.known.has(t));
  const wallets = [...wantWallets].filter((w) => !store.known.has("w:" + w));
  wantTargets.clear(); wantWallets.clear();
  if (!targets.length && !wallets.length) return;
  for (let i = 0; i < Math.max(targets.length, wallets.length); i += 100) {
    const t = targets.slice(i, i + 100), w = wallets.slice(i, i + 100);
    fetch(`/api/social?targets=${encodeURIComponent(t.join(","))}&wallets=${w.join(",")}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        store.enabled = !!d.enabled;
        t.forEach((x) => { store.known.add(x); store.gg[x] = d.gg?.[x] ?? 0; store.mine.delete(x); });
        (d.mine ?? []).forEach((x: string) => store.mine.add(x));
        w.forEach((x) => { store.known.add("w:" + x); store.tailing.delete(x); });
        (d.tailing ?? []).forEach((x: string) => store.tailing.add(x));
        bump();
      })
      .catch(() => {});
  }
}
function want(targets: string[], wallets: string[]) {
  targets.forEach((t) => wantTargets.add(t));
  wallets.forEach((w) => wantWallets.add(w.toLowerCase()));
  if (!timer) timer = setTimeout(flush, 50);
}

// After signing in or out, "which did I GG / tail" changes: reload everything.
if (typeof window !== "undefined") {
  window.addEventListener("perpy:session", () => {
    const t = [...store.known].filter((k) => !k.startsWith("w:"));
    const w = [...store.known].filter((k) => k.startsWith("w:")).map((k) => k.slice(2));
    store.known.clear();
    want(t, w);
  });
}

function useStore() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => version, () => 0);
}

async function send(path: string, payload: object) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Something went wrong.");
  return d;
}

// Make sure the user is signed in before an action; offers to sign in.
function useGate() {
  const { address, enabled } = useSession();
  const toast = useToast();
  return async () => {
    if (address) return true;
    if (!enabled && store.enabled === false) { toast("Accounts aren't switched on yet"); return false; }
    try { await signIn(); return true; } catch (e) { toast((e as Error).message.slice(0, 60)); return false; }
  };
}

// GG button with the real count.
export function GG({ target }: { target: string }) {
  useStore();
  const gate = useGate();
  const toast = useToast();
  useEffect(() => { want([target], []); }, [target]);
  const on = store.mine.has(target);
  const n = store.gg[target] ?? 0;
  return (
    <button type="button" className={`btn gg${on ? " on" : ""}`} aria-pressed={on} aria-label="GG (like)"
      onClick={async (e) => {
        e.stopPropagation();
        if (!(await gate())) return;
        const next = !store.mine.has(target);
        if (next) store.mine.add(target); else store.mine.delete(target);
        store.gg[target] = Math.max(0, (store.gg[target] ?? 0) + (next ? 1 : -1));
        bump();
        try { await send("/api/gg", { target, on: next }); } catch (err) {
          if (next) store.mine.delete(target); else store.mine.add(target);
          store.gg[target] = Math.max(0, (store.gg[target] ?? 0) + (next ? -1 : 1));
          bump(); toast((err as Error).message);
        }
      }}>
      GG <span className="mono">{n}</span>
    </button>
  );
}

// Tail (follow) button. Tailing someone means their trades and posts show up in
// your "Tailing" feed (and, later, alerts).
export function Tail({ wallet, small }: { wallet: string; small?: boolean }) {
  useStore();
  const gate = useGate();
  const toast = useToast();
  const { address } = useSession();
  const w = wallet.toLowerCase();
  useEffect(() => { want([], [w]); }, [w]);
  if (address === w) return null;
  const on = store.tailing.has(w);
  return (
    <button type="button" className={`btn${on ? " on" : " cy"}${small ? " sm" : ""}`} aria-pressed={on}
      onClick={async (e) => {
        e.stopPropagation();
        if (!(await gate())) return;
        const next = !store.tailing.has(w);
        if (next) store.tailing.add(w); else store.tailing.delete(w);
        bump();
        try { await send("/api/follow", { target: w, on: next }); toast(next ? `Tailing ${shortAddr(w)}` : "Stopped tailing"); }
        catch (err) { if (next) store.tailing.delete(w); else store.tailing.add(w); bump(); toast((err as Error).message); }
      }}>
      {on ? "✓ Tailing" : "+ Tail"}
    </button>
  );
}

// Followers / following counts for a profile.
export function TailCounts({ wallet }: { wallet: string }) {
  const [c, setC] = useState<{ followers: number; following: number } | null>(null);
  useStore();
  useEffect(() => {
    fetch(`/api/social?profile=${wallet.toLowerCase()}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setC(d.counts)).catch(() => {});
  }, [wallet, version]);
  if (!c) return null;
  return <><span><b>{c.followers}</b> tailing them</span><span><b>{c.following}</b> they tail</span></>;
}

type Msg = { id: string; author: string; body: string; created_at: string };

// Chat under a post, position or trade.
export function Chat({ target }: { target: string }) {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const gate = useGate();
  const toast = useToast();
  const { address } = useSession();
  useEffect(() => {
    let on = true;
    const load = () => fetch(`/api/comments?target=${encodeURIComponent(target)}`, { cache: "no-store" })
      .then((r) => r.json()).then((d) => { if (on) { setMsgs(d.comments ?? []); setEnabled(d.enabled !== false); } }).catch(() => on && setMsgs([]));
    load();
    const t = setInterval(load, 15000); // pick up new messages every 15s
    return () => { on = false; clearInterval(t); };
  }, [target]);

  async function sendMsg() {
    if (!address) { await gate(); return; }
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const d = await send("/api/comments", { target, body });
      setMsgs((m) => [...(m ?? []), d.comment]);
      setText("");
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="chatbox">
      {!enabled && <p className="muted" style={{ padding: "8px 12px", margin: 0 }}>Chat switches on once accounts are set up.</p>}
      {enabled && msgs === null && <p className="muted mono" style={{ padding: "8px 12px", margin: 0 }}>loading…</p>}
      {enabled && msgs?.length === 0 && <p className="muted" style={{ padding: "8px 12px", margin: 0 }}>No chat yet. Say GG.</p>}
      {msgs?.map((m) => (
        <article className="cmsg" key={m.id}>
          <Link href={`/u/${m.author}`}><Avatar seed={m.author} size={30} label={shortAddr(m.author)} /></Link>
          <div className="c">
            <div className="h">{shortAddr(m.author)}{m.author === address && <span className="tag lv">you</span>}<span>{new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <p>{m.body}</p>
          </div>
        </article>
      ))}
      {enabled && (
        <form className="reply" onSubmit={(e) => { e.preventDefault(); sendMsg(); }}>
          {address ? <Avatar seed={address} size={28} label="you" /> : null}
          <input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={address ? "type a message…" : "sign in to chat…"} aria-label="Message" />
          <button type="submit" className="btn go sm" disabled={busy}>{address ? "Send" : "Sign in"}</button>
        </form>
      )}
    </div>
  );
}

// Copies a link to the page (or uses the phone's share sheet).
export function Share({ path, title }: { path: string; title?: string }) {
  const toast = useToast();
  return (
    <button type="button" className="btn" aria-label="Share" onClick={async (e) => {
      e.stopPropagation();
      const url = `${location.origin}${path}`;
      try {
        if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ url, title });
        else { await navigator.clipboard.writeText(url); toast("Link copied"); }
      } catch {}
    }}>
      <svg className="i sm" viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" /></svg>
    </button>
  );
}

// Everyone you tail (loaded once after sign-in), for the "Tailing" feed filter.
let tailSet = new Set<string>();
let tailLoaded: string | null = null;
const tailListeners = new Set<() => void>();
async function loadTailing(me: string) {
  if (tailLoaded === me) return;
  tailLoaded = me;
  try {
    const d = await (await fetch("/api/social/tailing", { cache: "no-store" })).json();
    tailSet = new Set(d.tailing ?? []);
    tailListeners.forEach((l) => l());
  } catch {}
}
export const tailingList = {
  empty: new Set<string>(),
  subscribe(l: () => void) { tailListeners.add(l); listeners.add(l); return () => { tailListeners.delete(l); listeners.delete(l); }; },
  get() {
    // Merge what the server said with taps on Tail buttons since.
    const s = new Set(tailSet);
    store.tailing.forEach((w) => s.add(w));
    for (const k of store.known) if (k.startsWith("w:") && !store.tailing.has(k.slice(2))) s.delete(k.slice(2));
    const key = [...s].sort().join();
    if (key !== cacheKey) { cacheKey = key; cached = s; }
    return cached;
  },
};
let cacheKey = "";
let cached = new Set<string>();
export function useTailingLoader() {
  const { address } = useSession();
  useEffect(() => { if (address) loadTailing(address); else { tailSet = new Set(); tailLoaded = null; } }, [address]);
}
