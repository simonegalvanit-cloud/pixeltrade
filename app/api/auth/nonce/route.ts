import { fail, host, json } from "@/lib/api";
import { socialEnabled } from "@/lib/db";
import { newNonce, signInMessage } from "@/lib/session";

// Step 1 of signing in: get the message your wallet should sign.
export async function GET(req: Request) {
  if (!socialEnabled()) return fail("Accounts aren't set up on this server yet.", 503);
  const address = new URL(req.url).searchParams.get("address")?.toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{40}$/.test(address)) return fail("Bad address");
  const nonce = await newNonce();
  const issuedAt = new Date().toISOString();
  return json({ message: signInMessage(address, await host(), nonce, issuedAt), issuedAt });
}
