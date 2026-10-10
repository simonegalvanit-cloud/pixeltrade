import { body, fail, json } from "@/lib/api";
import { TARGET, db } from "@/lib/db";
import { currentUser } from "@/lib/session";

// GG (like) or un-GG a post, position or trade.
export async function POST(req: Request) {
  const d = db();
  const me = await currentUser();
  if (!d || !me) return fail("Sign in first.", 401);
  const b = await body<{ target: string; on: boolean }>(req);
  const target = b.target ?? "";
  if (!TARGET.test(target)) return fail("Bad target");
  const { error } = b.on
    ? await d.from("ggs").upsert({ user_addr: me, target }, { onConflict: "user_addr,target", ignoreDuplicates: true })
    : await d.from("ggs").delete().eq("user_addr", me).eq("target", target);
  if (error) return fail("Couldn't save.", 500);
  return json({ ok: true });
}
