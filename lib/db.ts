// The database (Supabase). Only used on the server, with the secret key.
// If the keys aren't set yet, everything social quietly switches off and the
// rest of the site keeps working.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

export const socialEnabled = () => !!db();

export type Post = {
  id: string;
  author: string;
  body: string;
  coin: string | null;
  side: 1 | -1 | null;
  lev: number | null;
  entry_px: number | null;
  size_usd: number | null;
  created_at: string;
};

export async function latestPosts(limit = 12, author?: string): Promise<Post[]> {
  const d = db();
  if (!d) return [];
  let q = d.from("posts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (author) q = q.eq("author", author);
  const { data, error } = await q;
  if (error) { console.error("posts", error.message); return []; }
  return data as Post[];
}

export async function getPost(id: string): Promise<Post | null> {
  const d = db();
  if (!d || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await d.from("posts").select("*").eq("id", id).maybeSingle();
  return (data as Post) ?? null;
}

// What can be GG'd or chatted under.
export const TARGET = /^(post:[0-9a-f-]{36}|pos:0x[0-9a-f]{40}:[A-Za-z0-9@:._-]{1,24}|trade:0x[0-9a-f]{40}:\d{1,24})$/;
export const ADDR = /^0x[0-9a-f]{40}$/;

// ---------- members ----------

export type Member = { id: string; handle: string; name: string; wallet: string; bio: string; created_at: string };
export const HANDLE = /^[a-z0-9_]{3,15}$/;
const COLS = "id, handle, name, wallet, bio, created_at";

export async function memberById(id: string): Promise<Member | null> {
  const d = db();
  if (!d) return null;
  const { data } = await d.from("members").select(COLS).eq("id", id).maybeSingle();
  return (data as Member) ?? null;
}

export async function memberByHandle(handle: string): Promise<Member | null> {
  const d = db();
  if (!d || !HANDLE.test(handle)) return null;
  const { data } = await d.from("members").select(COLS).eq("handle", handle).maybeSingle();
  return (data as Member) ?? null;
}

export async function membersByWallets(wallets: string[]): Promise<Member[]> {
  const d = db();
  if (!d || !wallets.length) return [];
  const { data } = await d.from("members").select(COLS).in("wallet", wallets);
  return (data as Member[]) ?? [];
}

export async function listMembers(limit = 200): Promise<Member[]> {
  const d = db();
  if (!d) return [];
  const { data, error } = await d.from("members").select(COLS).order("created_at", { ascending: true }).limit(limit);
  if (error) { console.error("members", error.message); return []; }
  return data as Member[];
}

export async function searchMembers(q: string, limit = 8): Promise<Member[]> {
  const d = db();
  const s = q.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!d || !s) return [];
  const { data } = await d.from("members").select(COLS).ilike("handle", `${s}%`).limit(limit);
  return (data as Member[]) ?? [];
}
