import { verifyMessage } from "viem";
import { body, fail, host, json } from "@/lib/api";
import { socialEnabled } from "@/lib/db";
import { signInMessage, startSession, takeNonce } from "@/lib/session";

// Step 2: send back the signature. We rebuild the exact message ourselves and
// check that this wallet signed it, then start a session.
export async function POST(req: Request) {
  if (!socialEnabled()) return fail("Accounts aren't set up on this server yet.", 503);
  const b = await body<{ address: string; signature: `0x${string}`; issuedAt: string }>(req);
  const address = b.address?.toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{40}$/.test(address) || !b.signature || !b.issuedAt) return fail("Bad request");
  const nonce = await takeNonce();
  if (!nonce) return fail("Sign-in expired, try again.", 401);
  const message = signInMessage(address, await host(), nonce, b.issuedAt);
  let ok = false;
  try { ok = await verifyMessage({ address: address as `0x${string}`, message, signature: b.signature }); } catch { ok = false; }
  if (!ok) return fail("Signature didn't match this wallet.", 401);
  await startSession(address);
  return json({ address });
}
