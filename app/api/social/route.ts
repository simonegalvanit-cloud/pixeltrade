import { fail, json } from "@/lib/api";
import { ADDR, TARGET, db } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Everything social a page needs in one call:
// GG counts (+ which ones you GG'd), whether you tail some wallets, and
// follower counts for one profile.
// ?targets=a,b,c&wallets=0x..,0x..&profile=0x..
export async function GET(req: Request) {
  const d = db();
  const me = await currentUser();
  const q = new URL(req.url).searchParams;
  const targets = (q.get("targets") ?? "").split(",").filter((t) => TARGET.test(t)).slice(0, 100);
  const wallets = (q.get("wallets") ?? "").toLowerCase().split(",").filter((w) => ADDR.test(w)).slice(0, 100);
  const profile = q.get("profile")?.toLowerCase() ?? "";
  if (!d) return json({ enabled: false, me: null, gg: {}, mine: [], tailing: [], counts: null });
  if (q.get("targets") && !targets.length && !wallets.length) return fail("Bad targets");

  const [counts, mine, tailing, prof] = await Promise.all([
    targets.length ? d.rpc("gg_counts", { targets }) : Promise.resolve({ data: [] }),
    me && targets.length ? d.from("ggs").select("target").eq("user_addr", me).in("target", targets) : Promise.resolve({ data: [] }),
    me && wallets.length ? d.from("follows").select("followee").eq("follower", me).in("followee", wallets) : Promise.resolve({ data: [] }),
    ADDR.test(profile) ? d.rpc("follow_counts", { addr: profile }) : Promise.resolve({ data: null }),
  ]);
  const gg: Record<string, number> = {};
  for (const r of (counts.data ?? []) as { target: string; n: number }[]) gg[r.target] = Number(r.n);
  const pc = (prof.data as { followers: number; following: number }[] | null)?.[0];
  return json({
    enabled: true,
    me,
    gg,
    mine: ((mine.data ?? []) as { target: string }[]).map((r) => r.target),
    tailing: ((tailing.data ?? []) as { followee: string }[]).map((r) => r.followee),
    counts: pc ? { followers: Number(pc.followers), following: Number(pc.following) } : null,
  });
}
