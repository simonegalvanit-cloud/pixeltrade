import { json } from "@/lib/api";
import { HANDLE, memberByHandle, searchMembers } from "@/lib/db";

export const dynamic = "force-dynamic";

// ?q=ma → members whose handle starts with "ma". ?check=maya → is @maya free?
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const check = q.get("check");
  if (check !== null) {
    const h = check.toLowerCase().replace(/^@/, "");
    if (!HANDLE.test(h)) return json({ ok: false, reason: "3 to 15 letters, numbers or _" });
    return json({ ok: !(await memberByHandle(h)), reason: "taken" });
  }
  const members = await searchMembers(q.get("q") ?? "");
  return json({ members: members.map(({ handle, name, wallet }) => ({ handle, name, wallet })) });
}
