import { json } from "@/lib/api";
import { socialEnabled } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({ address: socialEnabled() ? await currentUser() : null, enabled: socialEnabled() });
}
