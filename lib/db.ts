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

export const socialEnabled = () => !!db() && !!process.env.SESSION_SECRET;

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
