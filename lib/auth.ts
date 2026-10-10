// Who is making this request? The browser sends Privy's login token in the
// Authorization header; we check it against Privy's public keys (no secret needed)
// and then look up the perpy member.

import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { PRIVY_APP_ID } from "./privy";
import { memberById, type Member } from "./db";

const jwks = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`));

// The Privy user id ("did:privy:…") from a valid login token, or null.
export async function privyUser(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: "privy.io", audience: PRIVY_APP_ID });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// The signed-in perpy member (null if not logged in or no profile yet).
export async function currentMember(req: Request): Promise<Member | null> {
  const id = await privyUser(req);
  return id ? memberById(id) : null;
}

// Ask Privy (with our app secret) which wallet it created for this user.
// This is how we know a wallet really belongs to them.
export async function privyWallet(id: string): Promise<string | null> {
  const secret = process.env.PRIVY_APP_SECRET;
  if (!secret) throw new Error("PRIVY_APP_SECRET is not set on the server.");
  const r = await fetch(`https://auth.privy.io/api/v1/users/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${PRIVY_APP_ID}:${secret}`).toString("base64")}`,
      "privy-app-id": PRIVY_APP_ID,
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Privy ${r.status}`);
  const u = (await r.json()) as { linked_accounts?: { type: string; address?: string; wallet_client_type?: string; chain_type?: string }[] };
  const w = u.linked_accounts?.find((a) => a.type === "wallet" && a.wallet_client_type === "privy" && (a.chain_type ?? "ethereum") === "ethereum");
  return w?.address?.toLowerCase() ?? null;
}
