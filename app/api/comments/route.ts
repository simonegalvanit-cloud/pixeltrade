import { body, fail, json } from "@/lib/api";
import { TARGET, db, membersByWallets } from "@/lib/db";
import { currentMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Chat under a post, position or trade.
export async function GET(req: Request) {
  const d = db();
  const target = new URL(req.url).searchParams.get("target") ?? "";
  if (!d) return json({ comments: [], enabled: false });
  if (!TARGET.test(target)) return fail("Bad target");
  const { data } = await d.from("comments").select("id, author, body, created_at").eq("target", target).order("created_at", { ascending: true }).limit(200);
  return json({ comments: await withAuthors(data ?? []), enabled: true });
}

export async function POST(req: Request) {
  const d = db();
  const me = (await currentMember(req))?.wallet ?? null;
  if (!d || !me) return fail("Sign in first.", 401);
  const b = await body<{ target: string; body: string }>(req);
  const target = b.target ?? "";
  const text = (b.body ?? "").trim();
  if (!TARGET.test(target)) return fail("Bad target");
  if (!text || text.length > 500) return fail("Write 1 to 500 characters.");
  const { data: last } = await d.from("comments").select("created_at").eq("author", me).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < 5_000) return fail("Slow down a little.", 429);
  const { data, error } = await d.from("comments").insert({ target, author: me, body: text }).select("id, author, body, created_at").single();
  if (error) return fail("Couldn't send.", 500);
  return json({ comment: (await withAuthors([data]))[0] });
}

// Add each author's @handle and name.
async function withAuthors<T extends { author: string }>(rows: T[]) {
  const ms = await membersByWallets([...new Set(rows.map((r) => r.author))]);
  const by = new Map(ms.map((m) => [m.wallet, m]));
  return rows.map((r) => ({ ...r, handle: by.get(r.author)?.handle ?? null, name: by.get(r.author)?.name ?? null }));
}
