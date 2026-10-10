import { json } from "@/lib/api";
import { db } from "@/lib/db";
import { currentMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Everyone the signed-in wallet tails.
export async function GET(req: Request) {
  const d = db();
  const me = (await currentMember(req))?.wallet ?? null;
  if (!d || !me) return json({ tailing: [] });
  const { data } = await d.from("follows").select("followee").eq("follower", me).limit(1000);
  return json({ tailing: ((data ?? []) as { followee: string }[]).map((r) => r.followee) });
}
