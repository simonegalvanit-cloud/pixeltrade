import { json } from "@/lib/api";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Everyone the signed-in wallet tails.
export async function GET() {
  const d = db();
  const me = await currentUser();
  if (!d || !me) return json({ tailing: [] });
  const { data } = await d.from("follows").select("followee").eq("follower", me).limit(1000);
  return json({ tailing: ((data ?? []) as { followee: string }[]).map((r) => r.followee) });
}
