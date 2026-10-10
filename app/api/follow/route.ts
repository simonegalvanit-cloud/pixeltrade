import { body, fail, json } from "@/lib/api";
import { ADDR, db } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Tail (follow) or untail a wallet.
export async function POST(req: Request) {
  const d = db();
  const me = await currentUser();
  if (!d || !me) return fail("Sign in first.", 401);
  const b = await body<{ target: string; on: boolean }>(req);
  const target = b.target?.toLowerCase() ?? "";
  if (!ADDR.test(target) || target === me) return fail("Bad wallet");
  const { error } = b.on
    ? await d.from("follows").upsert({ follower: me, followee: target }, { onConflict: "follower,followee", ignoreDuplicates: true })
    : await d.from("follows").delete().eq("follower", me).eq("followee", target);
  if (error) return fail("Couldn't save.", 500);
  return json({ ok: true });
}
