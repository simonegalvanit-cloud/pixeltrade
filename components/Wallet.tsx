"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isAddress, shortAddr } from "@/lib/hyperliquid";

// Connect a browser wallet (MetaMask, Rabby, Coinbase Wallet...) to become P1.
// We only ask for your address. perpy never asks you to sign or send anything here,
// and the address is remembered in this browser only.

type Provider = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (e: string, f: (x: unknown) => void) => void };
type Announce = CustomEvent<{ info: { name: string; rdns: string }; provider: Provider }>;

let address: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();
const providers: { name: string; provider: Provider }[] = [];

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const a = localStorage.getItem("p1"); if (a && isAddress(a)) address = a.toLowerCase(); } catch {}
  // EIP-6963: wallets announce themselves when asked.
  window.addEventListener("eip6963:announceProvider", (e) => {
    const d = (e as Announce).detail;
    if (!providers.some((p) => p.name === d.info.name)) providers.push({ name: d.info.name, provider: d.provider });
    listeners.forEach((l) => l());
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function set(a: string | null) {
  address = a ? a.toLowerCase() : null;
  try { if (address) localStorage.setItem("p1", address); else localStorage.removeItem("p1"); } catch {}
  listeners.forEach((l) => l());
}

export function getProvider(): Provider | null {
  const injected = (typeof window !== "undefined" && (window as unknown as { ethereum?: Provider }).ethereum) || null;
  return providers[0]?.provider ?? injected;
}

export async function connectWallet(): Promise<string | null> {
  load();
  const p = getProvider();
  if (!p) return null;
  const accounts = (await p.request({ method: "eth_requestAccounts" })) as string[];
  const a = accounts?.[0];
  if (a) set(a);
  p.on?.("accountsChanged", (x) => set(((x as string[]) ?? [])[0] ?? null));
  return a ?? null;
}

export const disconnectWallet = () => set(null);

export function useWallet() {
  const a = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return address; },
    () => null,
  );
  const [hasWallet, setHasWallet] = useState(false);
  useEffect(() => { load(); setHasWallet(!!getProvider()); const t = setTimeout(() => setHasWallet(!!getProvider()), 500); return () => clearTimeout(t); }, []);
  return { address: a, hasWallet };
}

// "Connect wallet" button. Without a browser wallet it explains how to get one.
export function ConnectButton({ className = "btn go sm" }: { className?: string }) {
  const { address: a, hasWallet } = useWallet();
  const router = useRouter();
  const [err, setErr] = useState("");
  if (a) return null;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button type="button" className={className} onClick={async () => {
        setErr("");
        if (!hasWallet) { setErr("No wallet found. Install MetaMask or Rabby, or paste an address in search."); return; }
        try { const x = await connectWallet(); if (x) router.push(`/u/${x.toLowerCase()}`); } catch { setErr("Connection cancelled."); }
      }}>Connect wallet</button>
      {err && <small className="mono" style={{ color: "var(--down)", fontSize: 11, maxWidth: 240 }}>{err}</small>}
    </span>
  );
}

// Look up any wallet by pasting its address.
export function WalletSearch({ big }: { big?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState("");
  const ok = isAddress(v.trim());
  return (
    <form className={`wsearch${big ? " big" : ""}`} onSubmit={(e) => { e.preventDefault(); if (ok) router.push(`/u/${v.trim().toLowerCase()}`); }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Paste any wallet 0x…" aria-label="Look up a wallet" spellCheck={false} />
      <button type="submit" className="btn sm" disabled={!ok}>Go</button>
    </form>
  );
}

export const short = shortAddr;
