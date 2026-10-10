import { revalidatePath } from "next/cache";
import { body, fail, json } from "@/lib/api";
import { privyUser, privyWallet } from "@/lib/auth";
import { HANDLE, db, memberById, socialEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

// Who am I? { member } once the profile exists, { needsProfile: true } right after sign-up.
export async function GET(req: Request) {
  if (!socialEnabled()) return json({ enabled: false, member: null });
  const id = await privyUser(req);
  if (!id) return json({ enabled: true, member: null });
  const member = await memberById(id);
  return json({ enabled: true, member, needsProfile: !member });
}

// Create (or update) your profile: @handle and display name.
// The wallet is NOT taken from the browser: we ask Privy which wallet belongs to you.
export async function POST(req: Request) {
  const d = db();
  if (!d) return fail("Accounts aren't set up on this server yet.", 503);
  const id = await privyUser(req);
  if (!id) return fail("Sign in first.", 401);
  const b = await body<{ handle: string; name: string; bio: string }>(req);
  const handle = (b.handle ?? "").trim().toLowerCase().replace(/^@/, "");
  const name = (b.name ?? "").trim();
  const bio = (b.bio ?? "").trim().slice(0, 160);
  if (!HANDLE.test(handle)) return fail("Handle: 3 to 15 letters, numbers or _.");
  if (!name || name.length > 30) return fail("Name: 1 to 30 characters.");
  if (["perpy", "admin", "support", "help", "official", "team", "settings", "wallet", "welcome"].includes(handle)) return fail("That handle is reserved.");

  const existing = await memberById(id);
  if (existing) {
    // Updating: the handle can change if it's free; the wallet never changes.
    const { data, error } = await d.from("members").update({ handle, name, bio }).eq("id", id).select("*").single();
    if (error) return fail(error.code === "23505" ? `@${handle} is taken.` : "Couldn't save.", 400);
    revalidatePath(`/u/${existing.handle}`);
    return json({ member: data });
  }

  let wallet: string | null;
  try { wallet = await privyWallet(id); } catch (e) { return fail((e as Error).message, 500); }
  if (!wallet) return fail("Your wallet is still being created. Wait a few seconds and try again.", 409);
  const { data, error } = await d.from("members").insert({ id, handle, name, bio, wallet }).select("*").single();
  if (error) return fail(error.code === "23505" ? `@${handle} is taken.` : "Couldn't create your profile.", 400);
  revalidatePath("/");
  return json({ member: data });
}
