"use client";

import { useEffect, useSyncExternalStore } from "react";
import { toHex } from "viem";
import { connectWallet, getProvider, useWallet } from "./Wallet";

// Who is signed in. "Signed in" means you proved you own the wallet by signing
// a free message (it can't move funds and costs no gas). The proof lives in a
// secure cookie for 30 days.

type S = { address: string | null; enabled: boolean; loaded: boolean };
let state: S = { address: null, enabled: false, loaded: false };
const listeners = new Set<() => void>();
const SERVER: S = { address: null, enabled: false, loaded: false };
let loading = false;

function set(next: Partial<S>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export async function refreshSession() {
  if (loading) return;
  loading = true;
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    const d = await r.json();
    set({ address: d.address ?? null, enabled: !!d.enabled, loaded: true });
  } catch {
    set({ loaded: true });
  } finally { loading = false; }
}

export function useSession() {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => SERVER,
  );
  useEffect(() => { if (!state.loaded) refreshSession(); }, []);
  return s;
}

// Connect the wallet if needed, then sign the sign-in message.
export async function signIn(): Promise<string> {
  const address = await connectWallet();
  const provider = getProvider();
  if (!address || !provider) throw new Error("No wallet found. Install MetaMask or Rabby.");
  const a = address.toLowerCase();
  const r = await fetch(`/api/auth/nonce?address=${a}`, { cache: "no-store" });
  const n = await r.json();
  if (!r.ok) throw new Error(n.error ?? "Couldn't start sign-in.");
  const signature = (await provider.request({ method: "personal_sign", params: [toHex(n.message), a] })) as string;
  const v = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: a, signature, issuedAt: n.issuedAt }),
  });
  const d = await v.json();
  if (!v.ok) throw new Error(d.error ?? "Sign-in failed.");
  set({ address: d.address, enabled: true, loaded: true });
  window.dispatchEvent(new Event("perpy:session"));
  return d.address;
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  set({ address: null });
  window.dispatchEvent(new Event("perpy:session"));
}

// True when the connected wallet is the signed-in one.
export function useMe() {
  const s = useSession();
  const { address } = useWallet();
  return { ...s, wallet: address, signedIn: !!s.address };
}
