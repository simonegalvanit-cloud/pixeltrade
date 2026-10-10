"use client";

import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

// Who you are on perpy.
// - Privy says whether you're logged in (email / Google / Apple).
// - Our server says which perpy member that is (@handle, name, wallet).
// Right after signing up you have no member profile yet, so we send you to /welcome.

export type Member = { id: string; handle: string; name: string; wallet: string; bio: string };
type S = { member: Member | null; needsProfile: boolean; enabled: boolean; loaded: boolean; authenticated: boolean; ready: boolean };
let state: S = { member: null, needsProfile: false, enabled: true, loaded: false, authenticated: false, ready: false };
const SERVER: S = state;
const listeners = new Set<() => void>();
let loginFn: (() => void) | null = null;
let logoutFn: (() => Promise<void>) | null = null;

function set(next: Partial<S>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

// fetch() that also sends your Privy login token, so the server knows it's you.
export async function authFetch(url: string, init: RequestInit = {}) {
  const token = await getAccessToken().catch(() => null);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function refreshMe() {
  try {
    const r = await authFetch("/api/me");
    const d = await r.json();
    set({ member: d.member ?? null, needsProfile: !!d.needsProfile, enabled: d.enabled !== false, loaded: true });
  } catch {
    set({ loaded: true });
  }
  window.dispatchEvent(new Event("perpy:session"));
}

// Opens the Privy sign-up / login popup.
export function signIn() {
  if (loginFn) loginFn();
}

export async function signOut() {
  await logoutFn?.();
  set({ member: null, needsProfile: false });
  window.dispatchEvent(new Event("perpy:session"));
}

// Mounted once (in Providers): keeps our state in step with Privy.
export function MeSync() {
  const { ready, authenticated, login, logout } = usePrivy();
  const router = useRouter();
  const path = usePathname();
  loginFn = login;
  logoutFn = logout;
  useEffect(() => {
    set({ ready, authenticated });
    if (!ready) return;
    if (authenticated) refreshMe();
    else set({ member: null, needsProfile: false, loaded: true });
  }, [ready, authenticated]);
  // New member without a profile yet: pick your @handle first.
  useEffect(() => {
    if (state.loaded && authenticated && state.needsProfile && path !== "/welcome") router.push("/welcome");
  });
  return null;
}

export function useSession() {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => SERVER,
  );
  return { ...s, address: s.member?.wallet ?? null };
}
