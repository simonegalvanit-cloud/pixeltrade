import { revalidatePath } from "next/cache";
import { body, fail, json } from "@/lib/api";
import { db } from "@/lib/db";
import { fetchState } from "@/lib/hyperliquid";
import { parsePositions } from "@/lib/trading";
import { currentUser } from "@/lib/session";

// Post a call. If a coin is attached, we read your real position from
// Hyperliquid at that moment, so nobody can attach a trade they didn't make.
export async function POST(req: Request) {
  const d = db();
  const me = await currentUser();
  if (!d || !me) return fail("Sign in first.", 401);
  const b = await body<{ body: string; coin: string | null }>(req);
  const text = (b.body ?? "").trim();
  if (!text || text.length > 500) return fail("Write 1 to 500 characters.");

  const { data: last } = await d.from("posts").select("created_at").eq("author", me).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < 30_000) return fail("Slow down: one post every 30 seconds.", 429);

  let attach: Record<string, unknown> = {};
  if (b.coin) {
    const s = await fetchState(me, { cache: "no-store" }).catch(() => null);
    const pos = s && parsePositions(me, s).find((p) => p.coin === b.coin);
    if (!pos) return fail(`You don't have an open ${b.coin} position on Hyperliquid.`);
    attach = { coin: pos.coin, side: pos.szi > 0 ? 1 : -1, lev: pos.lev, entry_px: pos.entryPx, size_usd: pos.posValue };
  }
  const { data, error } = await d.from("posts").insert({ author: me, body: text, ...attach }).select("*").single();
  if (error) return fail("Couldn't save the post.", 500);
  revalidatePath("/");
  revalidatePath(`/u/${me}`);
  return json({ post: data });
}

export async function DELETE(req: Request) {
  const d = db();
  const me = await currentUser();
  if (!d || !me) return fail("Sign in first.", 401);
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return fail("Bad id");
  const { error } = await d.from("posts").delete().eq("id", id).eq("author", me);
  if (error) return fail("Couldn't delete.", 500);
  revalidatePath("/");
  revalidatePath(`/u/${me}`);
  return json({ ok: true });
}
